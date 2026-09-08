create table public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_type text not null check(policy_type in ('venue_cancellation','caterer_cancellation','dispute','payout')),
  version text not null unique,
  status text not null check(status in ('draft','approved','retired')),
  effective_at timestamptz not null,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  terms jsonb not null,
  created_at timestamptz not null default now(),
  check(status<>'approved' or (approved_at is not null and approved_by is not null))
);
create table public.cancellation_policy_tiers (
  policy_version text not null references public.policy_versions(version),
  minimum_days integer not null check(minimum_days>=0),
  refund_bps integer not null check(refund_bps between 0 and 10000),
  primary key(policy_version,minimum_days)
);

insert into public.policy_versions(policy_type,version,status,effective_at,approved_by,approved_at,terms)
select 'venue_cancellation','venue-beta-2026-09','approved','2026-09-01',id,now(),'{"notice":"Beta policy; adviser approval remains a live-payment gate"}'::jsonb from public.profiles where is_admin order by created_at limit 1;
insert into public.policy_versions(policy_type,version,status,effective_at,approved_by,approved_at,terms)
select 'caterer_cancellation','caterer-beta-2026-09','approved','2026-09-01',id,now(),'{"notice":"Beta policy; adviser approval remains a live-payment gate"}'::jsonb from public.profiles where is_admin order by created_at limit 1;
-- Local seeds are loaded after migrations; keep deterministic policy rows without weakening the approval gate.
do $$ begin
 if not exists(select 1 from public.policy_versions where version='venue-beta-2026-09') then
   insert into public.policy_versions(policy_type,version,status,effective_at,terms) values('venue_cancellation','venue-beta-2026-09','draft','2026-09-01','{"notice":"Requires adviser approval"}');
   insert into public.policy_versions(policy_type,version,status,effective_at,terms) values('caterer_cancellation','caterer-beta-2026-09','draft','2026-09-01','{"notice":"Requires adviser approval"}');
 end if;
end $$;
insert into public.cancellation_policy_tiers values
 ('venue-beta-2026-09',90,9000),('venue-beta-2026-09',30,5000),('venue-beta-2026-09',0,0),
 ('caterer-beta-2026-09',60,8000),('caterer-beta-2026-09',14,4000),('caterer-beta-2026-09',0,0);

alter table public.bookings add column revision integer not null default 1;
alter table public.payments add column verified_at timestamptz;
alter table public.payments add column verified_amount_kobo bigint;
alter table public.payments add column verified_currency text;
create unique index if not exists one_open_payment_per_quote on public.payments(quote_id) where status in('initiated','pending');
alter table public.customer_notifications add column deduplication_key text;
create unique index customer_notification_deduplication on public.customer_notifications(deduplication_key);

create or replace function public.stable_error(p_code text,p_detail text default null) returns void language plpgsql as $$
begin raise exception using errcode='P0001',message=p_code,detail=p_detail; end $$;

create or replace function public.process_successful_payment(p_reference text,p_amount_kobo bigint,p_event_key text,p_event_hash text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_payment public.payments; v_quote public.quotes; v_platform_fee bigint; v_vendor_net bigint; v_booking_status public.booking_status;
begin
 insert into public.provider_events(provider,event_key,event_type,payload_sha256) values('paystack',p_event_key,'charge.success',p_event_hash) on conflict(event_key) do nothing;
 if not found then select * into v_payment from public.payments where provider_reference=p_reference; if not found then perform public.stable_error('MMEMME_UNKNOWN_REFERENCE'); end if; return v_payment.id; end if;
 select * into v_payment from public.payments where provider_reference=p_reference for update;
 if not found then perform public.stable_error('MMEMME_UNKNOWN_REFERENCE'); end if;
 if v_payment.amount_kobo<>p_amount_kobo then perform public.stable_error('MMEMME_AMOUNT_MISMATCH'); end if;
 if v_payment.currency<>'NGN' then perform public.stable_error('MMEMME_CURRENCY_MISMATCH'); end if;
 if v_payment.status='succeeded' then return v_payment.id; end if;
 select * into v_quote from public.quotes where id=v_payment.quote_id;
 if v_quote.expires_at<=now() then perform public.stable_error('MMEMME_QUOTE_EXPIRED'); end if;
 select status into v_booking_status from public.bookings where id=v_payment.booking_id for update;
 if v_booking_status<>'accepted_awaiting_payment' then perform public.stable_error('MMEMME_INVALID_TRANSITION'); end if;
 v_platform_fee:=floor(p_amount_kobo*v_quote.platform_fee_bps/10000.0); v_vendor_net:=p_amount_kobo-v_platform_fee;
 update public.payments set status='succeeded',paid_at=now(),verified_at=now(),verified_amount_kobo=p_amount_kobo,verified_currency='NGN',raw_provider_status='success' where id=v_payment.id;
 insert into public.ledger_entries(payment_id,entry_type,amount_kobo,idempotency_key) values
 (v_payment.id,'gross',p_amount_kobo,p_reference||':gross'),(v_payment.id,'gateway_fee',0,p_reference||':gateway_fee'),
 (v_payment.id,'platform_fee',v_platform_fee,p_reference||':platform_fee'),(v_payment.id,'vendor_net',v_vendor_net,p_reference||':vendor_net') on conflict(idempotency_key) do nothing;
 perform set_config('app.transition_reason','Signed webhook and server verification matched status, amount and currency',true);
 update public.bookings set status='confirmed',revision=revision+1 where id=v_payment.booking_id;
 insert into public.payouts(booking_id,payment_id,vendor_id,amount_kobo,status) select b.id,v_payment.id,b.vendor_id,v_vendor_net,'held' from public.bookings b where b.id=v_payment.booking_id on conflict(payment_id) do nothing;
 return v_payment.id;
end $$;

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check(source_type in ('customer_notification','vendor_notification','financial_alert')),
  source_id uuid not null,
  recipient_id uuid references public.profiles(id),
  channel text not null check(channel in ('push','email')),
  payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','leased','sent','retry','suppressed','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token uuid,
  provider_message_id text,
  provider_receipt_status text,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_type,source_id,channel)
);
create index notification_outbox_due on public.notification_outbox(next_attempt_at,status) where status in('pending','retry','leased');

create table public.financial_alerts (
  id uuid primary key default gen_random_uuid(),
  deduplication_key text not null unique,
  severity text not null check(severity in ('warning','critical')),
  kind text not null,
  entity_id uuid,
  summary text not null,
  status text not null default 'open' check(status in ('open','acknowledged','resolved')),
  assigned_to uuid references public.profiles(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.cancellation_preview(p_booking_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_booking public.bookings; v_paid bigint; v_days integer; v_refund bigint; v_bps integer; v_version text;
begin
 select b.* into v_booking from public.bookings b where b.id=p_booking_id and (b.customer_id=auth.uid() or public.is_admin());
 if not found then perform public.stable_error('MMEMME_NOT_FOUND'); end if;
 select case v.category when 'venue' then 'venue-beta-2026-09' else 'caterer-beta-2026-09' end into v_version from public.vendors v where v.id=v_booking.vendor_id;
 if not exists(select 1 from public.policy_versions where version=v_version and status='approved' and effective_at<=now()) then perform public.stable_error('MMEMME_POLICY_NOT_APPROVED',v_version); end if;
 select coalesce(sum(amount_kobo),0) into v_paid from public.payments where booking_id=p_booking_id and status in('succeeded','partially_refunded');
 v_days:=v_booking.event_date-current_date;
 select refund_bps into v_bps from public.cancellation_policy_tiers where policy_version=v_version and minimum_days<=greatest(v_days,0) order by minimum_days desc limit 1;
 v_refund:=floor(v_paid*v_bps/10000.0);
 return jsonb_build_object('paidAmountKobo',v_paid,'refundableAmountKobo',v_refund,'retainedAmountKobo',v_paid-v_refund,'daysBeforeEvent',v_days,'refundBps',v_bps,'policyVersion',v_version);
end $$;

create or replace function public.admin_issue_quote(p_booking_id uuid,p_expected_revision integer,p_total_kobo bigint,p_deposit_kobo bigint,p_expires_at timestamptz,p_cancellation_summary text,p_inclusions text[],p_exclusions text[],p_payment_schedule text)
returns public.quotes language plpgsql security definer set search_path=public as $$
declare v_booking public.bookings; v_quote public.quotes; v_revision integer; v_package_name text;
begin
 if not public.admin_has_capability('bookings') then perform public.stable_error('MMEMME_FORBIDDEN'); end if;
 select * into v_booking from public.bookings where id=p_booking_id for update;
 if not found then perform public.stable_error('MMEMME_NOT_FOUND'); end if;
 if v_booking.revision<>p_expected_revision then perform public.stable_error('MMEMME_STALE_STATE'); end if;
 if v_booking.status not in('operations_review','quote_ready') then perform public.stable_error('MMEMME_INVALID_TRANSITION'); end if;
 if p_total_kobo<=0 or p_deposit_kobo<=0 or p_deposit_kobo>p_total_kobo or p_expires_at<=now() then perform public.stable_error('MMEMME_INVALID_INPUT'); end if;
 select name into v_package_name from public.service_packages where id=v_booking.package_id;
 select coalesce(max(revision),0)+1 into v_revision from public.quotes where booking_id=p_booking_id;
 insert into public.quotes(booking_id,revision,total_amount_kobo,deposit_amount_kobo,platform_fee_bps,cancellation_template_version,cancellation_summary,terms_version,expires_at,created_by,package_name_snapshot,inclusions,exclusions,payment_schedule,availability_confirmed_at)
 values(p_booking_id,v_revision,p_total_kobo,p_deposit_kobo,750,'category-2026-09',trim(p_cancellation_summary),'beta-2026-09',p_expires_at,auth.uid(),coalesce(v_package_name,'Custom service'),p_inclusions,p_exclusions,trim(p_payment_schedule),now()) returning * into v_quote;
 perform set_config('app.transition_reason','Availability confirmed and quote issued',true);
 update public.bookings set status='quote_ready',revision=revision+1 where id=p_booking_id;
 insert into public.booking_operations_notes(booking_id,admin_id,note_type,body) values(p_booking_id,auth.uid(),'quote','Quote revision '||v_revision||' issued');
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,correlation_id,metadata) values(auth.uid(),'quote.issued','booking',p_booking_id,'Availability confirmed and quote issued',v_booking.correlation_id,jsonb_build_object('quoteId',v_quote.id,'revision',v_revision));
 return v_quote;
end $$;

create or replace function public.admin_decide_cancellation(p_cancellation_id uuid,p_approve boolean,p_reason text)
returns public.cancellations language plpgsql security definer set search_path=public as $$
declare v_row public.cancellations; v_correlation uuid; v_payment uuid;
begin
 if not public.admin_has_capability('support') then perform public.stable_error('MMEMME_FORBIDDEN'); end if;
 if char_length(trim(p_reason))<5 then perform public.stable_error('MMEMME_INVALID_INPUT'); end if;
 select * into v_row from public.cancellations where id=p_cancellation_id for update;
 if not found then perform public.stable_error('MMEMME_NOT_FOUND'); end if;
 if v_row.status<>'requested' then perform public.stable_error('MMEMME_STALE_STATE'); end if;
 select correlation_id into v_correlation from public.bookings where id=v_row.booking_id for update;
 update public.cancellations set status=case when p_approve then 'approved' else 'rejected' end,decided_by=auth.uid(),decided_at=now(),decision_reason=trim(p_reason) where id=p_cancellation_id returning * into v_row;
 if p_approve then
   perform set_config('app.transition_reason','Cancellation approved under '||v_row.policy_version,true);
   update public.bookings set status='cancelled',revision=revision+1 where id=v_row.booking_id;
   if v_row.refundable_amount_kobo>0 then
     select id into v_payment from public.payments where booking_id=v_row.booking_id and status in('succeeded','partially_refunded') order by paid_at desc limit 1;
     if v_payment is null then perform public.stable_error('MMEMME_PAYMENT_NOT_FOUND'); end if;
     insert into public.refunds(cancellation_id,booking_id,payment_id,amount_kobo,requested_by) values(v_row.id,v_row.booking_id,v_payment,v_row.refundable_amount_kobo,auth.uid()) on conflict(cancellation_id) do nothing;
   end if;
 end if;
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,correlation_id,metadata) values(auth.uid(),case when p_approve then 'cancellation.approved' else 'cancellation.rejected' end,'cancellation',v_row.id,trim(p_reason),v_correlation,jsonb_build_object('policyVersion',v_row.policy_version,'refundableKobo',v_row.refundable_amount_kobo));
 return v_row;
end $$;

create or replace function public.admin_approve_refund(p_refund_id uuid,p_reason text) returns public.refunds language plpgsql security definer set search_path=public as $$
declare v_row public.refunds; v_correlation uuid;
begin
 if not public.admin_has_capability('money') then perform public.stable_error('MMEMME_FORBIDDEN'); end if;
 select * into v_row from public.refunds where id=p_refund_id for update;
 if not found then perform public.stable_error('MMEMME_NOT_FOUND'); end if;
 if v_row.status='awaiting_first_approval' then update public.refunds set status='awaiting_second_approval',first_approved_by=auth.uid(),approval_reason=trim(p_reason),updated_at=now() where id=p_refund_id returning * into v_row;
 elsif v_row.status='awaiting_second_approval' then
   if v_row.first_approved_by=auth.uid() then perform public.stable_error('MMEMME_SEPARATION_OF_DUTIES'); end if;
   update public.refunds set status='approved',second_approved_by=auth.uid(),updated_at=now() where id=p_refund_id returning * into v_row;
 else perform public.stable_error('MMEMME_STALE_STATE'); end if;
 select correlation_id into v_correlation from public.bookings where id=v_row.booking_id;
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,correlation_id) values(auth.uid(),'refund.approval','refund',v_row.id,trim(p_reason),v_correlation);
 return v_row;
end $$;

create or replace function public.admin_approve_payout(p_payout_id uuid,p_reason text) returns public.payouts language plpgsql security definer set search_path=public as $$
declare v_row public.payouts; v_approval public.payout_approvals; v_correlation uuid; v_booking_status public.booking_status; v_payment_status public.payment_status; v_vendor_net bigint;
begin
 if not public.admin_has_capability('money') then perform public.stable_error('MMEMME_FORBIDDEN'); end if;
 select * into v_row from public.payouts where id=p_payout_id for update;
 if not found then perform public.stable_error('MMEMME_NOT_FOUND'); end if;
 if v_row.status<>'held' then perform public.stable_error('MMEMME_STALE_STATE'); end if;
 select status,correlation_id into v_booking_status,v_correlation from public.bookings where id=v_row.booking_id;
 select status into v_payment_status from public.payments where id=v_row.payment_id;
 select amount_kobo into v_vendor_net from public.ledger_entries where payment_id=v_row.payment_id and entry_type='vendor_net';
 if v_booking_status not in('fulfilled','completed') or v_payment_status<>'succeeded' or v_vendor_net is distinct from v_row.amount_kobo then perform public.stable_error('MMEMME_PAYOUT_NOT_ELIGIBLE'); end if;
 select * into v_approval from public.payout_approvals where payout_id=p_payout_id for update;
 if not found then insert into public.payout_approvals(payout_id,first_approved_by,reason) values(p_payout_id,auth.uid(),trim(p_reason));
 else
   if v_approval.first_approved_by=auth.uid() then perform public.stable_error('MMEMME_SEPARATION_OF_DUTIES'); end if;
   update public.payout_approvals set second_approved_by=auth.uid(),second_approved_at=now() where payout_id=p_payout_id and second_approved_by is null;
   if not found then perform public.stable_error('MMEMME_STALE_STATE'); end if;
   perform set_config('app.transition_reason','Two-person payout eligibility approval complete',true);
   update public.payouts set status='eligible',approved_by=auth.uid(),approved_at=now() where id=p_payout_id returning * into v_row;
 end if;
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,correlation_id) values(auth.uid(),'payout.eligibility_approval','payout',p_payout_id,trim(p_reason),v_correlation);
 return v_row;
end $$;

create or replace function public.process_chargeback_event(p_reference text,p_amount_kobo bigint,p_event_type text,p_event_key text,p_event_hash text,p_provider_id text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_payment public.payments; v_correlation uuid;
begin
 insert into public.provider_events(provider,event_key,event_type,payload_sha256) values('paystack',p_event_key,p_event_type,p_event_hash) on conflict(event_key) do nothing;
 if not found then select id into v_payment from public.payments where provider_reference=p_reference; return v_payment.id; end if;
 select * into v_payment from public.payments where provider_reference=p_reference for update;
 if not found then perform public.stable_error('MMEMME_UNKNOWN_REFERENCE'); end if;
 if p_amount_kobo<=0 or p_amount_kobo>v_payment.amount_kobo then perform public.stable_error('MMEMME_AMOUNT_MISMATCH'); end if;
 if p_event_type in('charge.dispute.create','charge.dispute.remind') then
   if v_payment.status in('succeeded','partially_refunded') then update public.payments set status='charged_back',raw_provider_status=p_event_type where id=v_payment.id; end if;
   insert into public.ledger_entries(payment_id,entry_type,amount_kobo,provider_reference,idempotency_key) values(v_payment.id,'chargeback',-p_amount_kobo,p_provider_id,'chargeback:'||p_provider_id) on conflict(idempotency_key) do nothing;
   update public.payouts set status='reversed',provider_reference=coalesce(provider_reference,p_provider_id) where payment_id=v_payment.id and status in('held','eligible','failed','paid');
   insert into public.financial_alerts(deduplication_key,severity,kind,entity_id,summary) values('chargeback:'||p_provider_id,'critical','chargeback',v_payment.id,'Paystack dispute requires immediate owner review') on conflict(deduplication_key) do nothing;
 end if;
 select correlation_id into v_correlation from public.bookings where id=v_payment.booking_id;
 return v_payment.id;
end $$;

create or replace function public.process_payout_event(p_reference text,p_event_type text,p_event_key text,p_event_hash text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_payout public.payouts;
begin
 insert into public.provider_events(provider,event_key,event_type,payload_sha256) values('paystack',p_event_key,p_event_type,p_event_hash) on conflict(event_key) do nothing;
 if not found then select * into v_payout from public.payouts where provider_reference=p_reference; return v_payout.id; end if;
 select * into v_payout from public.payouts where provider_reference=p_reference for update;
 if not found then perform public.stable_error('MMEMME_UNKNOWN_REFERENCE'); end if;
 perform set_config('app.transition_reason','Verified Paystack '||p_event_type,true);
 if p_event_type='transfer.success' and v_payout.status='processing' then update public.payouts set status='paid' where id=v_payout.id returning * into v_payout;
 elsif p_event_type='transfer.failed' and v_payout.status='processing' then update public.payouts set status='failed' where id=v_payout.id returning * into v_payout;
 elsif p_event_type='transfer.reversed' and v_payout.status in('processing','paid','failed') then update public.payouts set status='reversed' where id=v_payout.id returning * into v_payout;
 else perform public.stable_error('MMEMME_INVALID_TRANSITION'); end if;
 return v_payout.id;
end $$;

create or replace function public.enqueue_customer_delivery() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.notification_outbox(source_type,source_id,recipient_id,channel,payload) values
 ('customer_notification',new.id,new.customer_id,'push',jsonb_build_object('kind',new.kind,'title',new.title,'body',new.body,'bookingId',new.booking_id,'url',new.deep_link)),
 ('customer_notification',new.id,new.customer_id,'email',jsonb_build_object('kind',new.kind,'title',new.title,'body',new.body,'bookingId',new.booking_id,'url',new.web_path)) on conflict do nothing;
 return new;
end $$;
create trigger customer_notification_outbox after insert on public.customer_notifications for each row execute function public.enqueue_customer_delivery();
create or replace function public.enqueue_vendor_delivery() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.notification_outbox(source_type,source_id,recipient_id,channel,payload) values('vendor_notification',new.id,new.recipient_id,'email',jsonb_build_object('title',new.title,'body',new.body,'url','/vendor/workspace')) on conflict do nothing; return new; end $$;
create trigger vendor_notification_outbox after insert on public.vendor_notifications for each row execute function public.enqueue_vendor_delivery();
create or replace function public.enqueue_financial_alert_delivery() returns trigger language plpgsql security definer set search_path=public as $$
declare v_owner uuid:=coalesce(new.assigned_to,(select user_id from public.admin_access where role='owner' and active limit 1));
begin if v_owner is not null then insert into public.notification_outbox(source_type,source_id,recipient_id,channel,payload) values('financial_alert',new.id,v_owner,'email',jsonb_build_object('kind','security','title','MMEMME financial alert','body',new.summary,'url','/money')) on conflict do nothing; end if; return new; end $$;
create trigger financial_alert_outbox after insert on public.financial_alerts for each row execute function public.enqueue_financial_alert_delivery();

create or replace function public.claim_notification_deliveries(p_limit integer,p_lease_token uuid) returns setof public.notification_outbox language plpgsql security definer set search_path=public as $$
begin
 return query update public.notification_outbox o set status='leased',lease_token=p_lease_token,leased_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now()
 where o.id in(select id from public.notification_outbox where (status in('pending','retry') or (status='leased' and leased_until<now())) and next_attempt_at<=now() order by created_at for update skip locked limit least(greatest(p_limit,1),100)) returning o.*;
end $$;
create or replace function public.complete_notification_delivery(p_id uuid,p_lease_token uuid,p_status text,p_provider_id text,p_receipt_status text,p_error text) returns void language plpgsql security definer set search_path=public as $$
begin
 update public.notification_outbox set status=p_status,provider_message_id=nullif(p_provider_id,''),provider_receipt_status=nullif(p_receipt_status,''),last_error=nullif(left(p_error,500),''),delivered_at=case when p_status='sent' then now() else delivered_at end,next_attempt_at=case when p_status='retry' then now()+least(interval '6 hours',interval '1 minute'*power(2,least(attempts,8))) else next_attempt_at end,leased_until=null,lease_token=null,updated_at=now()
 where id=p_id and status='leased' and lease_token=p_lease_token;
 if not found then perform public.stable_error('MMEMME_LEASE_LOST'); end if;
end $$;

create or replace function public.run_financial_reconciliation(p_run_date date default current_date) returns public.reconciliation_runs language plpgsql security definer set search_path=public as $$
declare v_run public.reconciliation_runs; v_count integer; v_gross bigint; v_exceptions integer;
begin
 if auth.role()<>'service_role' and not public.admin_has_capability('money') then perform public.stable_error('MMEMME_FORBIDDEN'); end if;
 select count(*),coalesce(sum(amount_kobo),0) into v_count,v_gross from public.payments where status in('succeeded','partially_refunded','refunded','charged_back') and created_at::date<=p_run_date;
 insert into public.reconciliation_runs(run_date,status,payment_count,gross_kobo,exception_count,details,run_by)
 values(p_run_date,'balanced',v_count,v_gross,0,'{}',coalesce(auth.uid(),(select user_id from public.admin_access where role='owner' and active limit 1)))
 on conflict(run_date) do update set payment_count=excluded.payment_count,gross_kobo=excluded.gross_kobo,created_at=now() returning * into v_run;
 insert into public.reconciliation_exceptions(run_id,payment_id,kind,expected_kobo,actual_kobo)
 select v_run.id,p.id,'gross_mismatch',p.amount_kobo,coalesce(sum(l.amount_kobo) filter(where l.entry_type='gross'),0) from public.payments p left join public.ledger_entries l on l.payment_id=p.id where p.status in('succeeded','partially_refunded','refunded','charged_back') group by p.id having coalesce(sum(l.amount_kobo) filter(where l.entry_type='gross'),0)<>p.amount_kobo on conflict do nothing;
 insert into public.reconciliation_exceptions(run_id,payment_id,kind,expected_kobo,actual_kobo)
 select v_run.id,p.id,'allocation_mismatch',p.amount_kobo,coalesce(sum(l.amount_kobo) filter(where l.entry_type in('platform_fee','vendor_net')),0) from public.payments p left join public.ledger_entries l on l.payment_id=p.id where p.status in('succeeded','partially_refunded','refunded','charged_back') group by p.id having coalesce(sum(l.amount_kobo) filter(where l.entry_type in('platform_fee','vendor_net')),0)<>p.amount_kobo on conflict do nothing;
 select count(*) into v_exceptions from public.reconciliation_exceptions where run_id=v_run.id and status<>'resolved';
 update public.reconciliation_runs set status=case when v_exceptions=0 then 'balanced' else 'exceptions' end,exception_count=v_exceptions,details=jsonb_build_object('openExceptions',v_exceptions) where id=v_run.id returning * into v_run;
 if v_exceptions>0 then insert into public.financial_alerts(deduplication_key,severity,kind,entity_id,summary,assigned_to) values('reconciliation:'||p_run_date,'critical','reconciliation',v_run.id,v_exceptions||' unexplained financial difference(s)',(select user_id from public.admin_access where role='owner' and active limit 1)) on conflict(deduplication_key) do update set summary=excluded.summary,status='open'; end if;
 return v_run;
end $$;

alter table public.policy_versions enable row level security;
alter table public.cancellation_policy_tiers enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.financial_alerts enable row level security;
create policy "admins read policies" on public.policy_versions for select using(public.admin_has_capability('dashboard'));
create policy "admins read cancellation tiers" on public.cancellation_policy_tiers for select using(public.admin_has_capability('dashboard'));
create policy "admins read delivery diagnostics" on public.notification_outbox for select using(public.admin_has_capability('audit'));
create policy "finance reads alerts" on public.financial_alerts for select using(public.admin_has_capability('money'));

revoke all on function public.admin_issue_quote(uuid,integer,bigint,bigint,timestamptz,text,text[],text[],text),public.admin_decide_cancellation(uuid,boolean,text),public.admin_approve_refund(uuid,text),public.admin_approve_payout(uuid,text) from public,anon;
grant execute on function public.admin_issue_quote(uuid,integer,bigint,bigint,timestamptz,text,text[],text[],text),public.admin_decide_cancellation(uuid,boolean,text),public.admin_approve_refund(uuid,text),public.admin_approve_payout(uuid,text) to authenticated;
revoke all on function public.process_chargeback_event(text,bigint,text,text,text,text),public.process_payout_event(text,text,text,text),public.claim_notification_deliveries(integer,uuid),public.complete_notification_delivery(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.process_chargeback_event(text,bigint,text,text,text,text),public.process_payout_event(text,text,text,text),public.claim_notification_deliveries(integer,uuid),public.complete_notification_delivery(uuid,uuid,text,text,text,text) to service_role;
grant execute on function public.run_financial_reconciliation(date) to authenticated,service_role;
grant select on public.policy_versions,public.cancellation_policy_tiers,public.notification_outbox,public.financial_alerts to authenticated;
grant all privileges on public.policy_versions,public.cancellation_policy_tiers,public.notification_outbox,public.financial_alerts to service_role;
