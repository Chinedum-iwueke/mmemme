create table public.notification_preferences (
  customer_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  reminders_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique, platform text not null check(platform in ('ios','android')), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.customer_notifications (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade, kind text not null,
  title text not null, body text not null, deep_link text, push_status text not null default 'pending', email_status text not null default 'pending',
  read_at timestamptz, created_at timestamptz not null default now()
);
create table public.booking_reminders (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade, remind_at timestamptz not null,
  kind text not null, delivered_at timestamptz, unique(booking_id,kind)
);
create table public.cancellations (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id),
  customer_id uuid not null references public.profiles(id), reason text not null check(char_length(reason) between 10 and 2000),
  status text not null default 'requested' check(status in ('requested','approved','rejected')),
  paid_amount_kobo bigint not null, refundable_amount_kobo bigint not null, retained_amount_kobo bigint not null,
  policy_version text not null, calculation jsonb not null, requested_at timestamptz not null default now(),
  decided_by uuid references public.profiles(id), decided_at timestamptz, decision_reason text
);
create table public.refunds (
  id uuid primary key default gen_random_uuid(), cancellation_id uuid not null unique references public.cancellations(id),
  booking_id uuid not null references public.bookings(id), payment_id uuid not null references public.payments(id),
  amount_kobo bigint not null check(amount_kobo>0), status text not null default 'awaiting_first_approval' check(status in ('awaiting_first_approval','awaiting_second_approval','approved','processing','succeeded','failed')),
  requested_by uuid not null references public.profiles(id), first_approved_by uuid references public.profiles(id), second_approved_by uuid references public.profiles(id),
  approval_reason text, provider_reference text unique, failure_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(first_approved_by is null or second_approved_by is null or first_approved_by<>second_approved_by)
);
create table public.dispute_evidence (
  id uuid primary key default gen_random_uuid(), dispute_id uuid not null references public.disputes(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id), storage_path text not null unique,
  media_type text not null, description text not null default '', created_at timestamptz not null default now()
);
create table public.payout_approvals (
  payout_id uuid primary key references public.payouts(id) on delete cascade,
  first_approved_by uuid not null references public.profiles(id), second_approved_by uuid references public.profiles(id),
  reason text not null, first_approved_at timestamptz not null default now(), second_approved_at timestamptz,
  check(second_approved_by is null or first_approved_by<>second_approved_by)
);
create table public.product_events (
  id uuid primary key default gen_random_uuid(), customer_id uuid references public.profiles(id), booking_id uuid references public.bookings(id),
  name text not null, properties jsonb not null default '{}', correlation_id uuid, created_at timestamptz not null default now()
);
create table public.reconciliation_runs (
  id uuid primary key default gen_random_uuid(), run_date date not null unique, status text not null check(status in ('balanced','exceptions')),
  payment_count integer not null, gross_kobo bigint not null, exception_count integer not null,
  details jsonb not null default '{}', run_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);

create or replace function public.create_notification_preferences() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.notification_preferences(customer_id) values(new.id) on conflict do nothing; return new; end $$;
create trigger profile_notification_defaults after insert on public.profiles for each row execute function public.create_notification_preferences();
insert into public.notification_preferences(customer_id) select id from public.profiles on conflict do nothing;

create or replace function public.enqueue_booking_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare v_title text; v_body text;
begin if old.status=new.status then return new; end if;
 v_title:=case new.status when 'quote_ready' then 'Your MMEMME quote is ready' when 'confirmed' then 'Your booking is confirmed' when 'cancelled' then 'Your booking was cancelled' when 'disputed' then 'Your dispute is open' when 'service_due' then 'Your event is approaching' when 'completed' then 'Your booking is complete' else null end;
 if v_title is not null then v_body:='Booking status: '||replace(new.status::text,'_',' '); insert into public.customer_notifications(customer_id,booking_id,kind,title,body,deep_link) values(new.customer_id,new.id,'booking_status',v_title,v_body,'mmemme://booking/'||new.id); end if;
 if new.status='confirmed' then
   insert into public.booking_reminders(booking_id,customer_id,remind_at,kind) values
   (new.id,new.customer_id,(new.event_date-30)::timestamp,'event_30_days'),
   (new.id,new.customer_id,(new.event_date-7)::timestamp,'event_7_days'),
   (new.id,new.customer_id,(new.event_date-1)::timestamp,'event_1_day') on conflict do nothing;
 end if; return new; end $$;
create trigger notify_booking_status after update of status on public.bookings for each row execute function public.enqueue_booking_notification();

create or replace function public.enqueue_support_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare v_customer uuid; begin select customer_id into v_customer from public.bookings where id=new.booking_id;
 if new.author_id<>v_customer then insert into public.customer_notifications(customer_id,booking_id,kind,title,body,deep_link) values(v_customer,new.booking_id,'support','MMEMME replied to your booking',left(new.body,180),'mmemme://booking/manage/'||new.booking_id); end if; return new; end $$;
create trigger notify_support_reply after insert on public.support_messages for each row execute function public.enqueue_support_notification();

alter table public.notification_preferences enable row level security; alter table public.push_tokens enable row level security;
alter table public.customer_notifications enable row level security; alter table public.booking_reminders enable row level security;
alter table public.cancellations enable row level security; alter table public.refunds enable row level security;
alter table public.dispute_evidence enable row level security; alter table public.payout_approvals enable row level security;
alter table public.product_events enable row level security; alter table public.reconciliation_runs enable row level security;
create policy "customer owns notification preferences" on public.notification_preferences for all using(customer_id=auth.uid() or public.is_admin()) with check(customer_id=auth.uid() or public.is_admin());
create policy "customer owns push tokens" on public.push_tokens for all using(customer_id=auth.uid() or public.is_admin()) with check(customer_id=auth.uid() or public.is_admin());
create policy "customer reads notifications" on public.customer_notifications for select using(customer_id=auth.uid() or public.is_admin());
create policy "customer marks notifications read" on public.customer_notifications for update using(customer_id=auth.uid()) with check(customer_id=auth.uid());
create policy "customer reads reminders" on public.booking_reminders for select using(customer_id=auth.uid() or public.is_admin());
create policy "customer reads own cancellations" on public.cancellations for select using(customer_id=auth.uid() or public.is_admin());
create policy "customer reads own refunds" on public.refunds for select using(exists(select 1 from public.bookings b where b.id=booking_id and b.customer_id=auth.uid()) or public.is_admin());
create policy "booking participant reads dispute evidence" on public.dispute_evidence for select using(uploaded_by=auth.uid() or exists(select 1 from public.disputes d join public.bookings b on b.id=d.booking_id where d.id=dispute_id and b.customer_id=auth.uid()) or public.is_admin());
create policy "customer records dispute evidence" on public.dispute_evidence for insert with check(uploaded_by=auth.uid() and exists(select 1 from public.disputes d join public.bookings b on b.id=d.booking_id where d.id=dispute_id and b.customer_id=auth.uid()));
create policy "customer records product events" on public.product_events for insert with check(customer_id=auth.uid());
create policy "admins read product events" on public.product_events for select using(public.is_admin());
create policy "admins read payout approvals" on public.payout_approvals for select using(public.is_admin());
create policy "admins read reconciliation" on public.reconciliation_runs for select using(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('dispute-evidence','dispute-evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create policy "customers upload own dispute evidence" on storage.objects for insert to authenticated with check(bucket_id='dispute-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "customers read own dispute evidence files" on storage.objects for select to authenticated using(bucket_id='dispute-evidence' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
create policy "admins manage dispute evidence files" on storage.objects for all to authenticated using(bucket_id='dispute-evidence' and public.is_admin()) with check(bucket_id='dispute-evidence' and public.is_admin());

create or replace function public.cancellation_preview(p_booking_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_booking public.bookings; v_paid bigint; v_days integer; v_refund bigint; v_percent integer;
begin
 select * into v_booking from public.bookings where id=p_booking_id and (customer_id=auth.uid() or public.is_admin()); if not found then raise exception 'booking not found'; end if;
 select coalesce(sum(amount_kobo),0) into v_paid from public.payments where booking_id=p_booking_id and status in('succeeded','partially_refunded');
 v_days:=v_booking.event_date-current_date; v_percent:=case when v_days>=90 then 90 when v_days>=30 then 50 else 0 end; v_refund:=floor(v_paid*v_percent/100.0);
 return jsonb_build_object('paidAmountKobo',v_paid,'refundableAmountKobo',v_refund,'retainedAmountKobo',v_paid-v_refund,'daysBeforeEvent',v_days,'refundPercent',v_percent,'policyVersion','beta-2026-07');
end $$;
create or replace function public.request_cancellation(p_booking_id uuid,p_reason text) returns public.cancellations language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_preview jsonb; v_row public.cancellations;
begin if char_length(trim(p_reason))<10 then raise exception 'reason is too short'; end if;
 if not exists(select 1 from public.bookings where id=p_booking_id and customer_id=v_user and status in('accepted_awaiting_payment','confirmed','service_due')) then raise exception 'booking cannot be cancelled'; end if;
 v_preview:=public.cancellation_preview(p_booking_id);
 insert into public.cancellations(booking_id,customer_id,reason,paid_amount_kobo,refundable_amount_kobo,retained_amount_kobo,policy_version,calculation)
 values(p_booking_id,v_user,trim(p_reason),(v_preview->>'paidAmountKobo')::bigint,(v_preview->>'refundableAmountKobo')::bigint,(v_preview->>'retainedAmountKobo')::bigint,v_preview->>'policyVersion',v_preview)
 on conflict(booking_id) do update set reason=excluded.reason returning * into v_row; return v_row;
end $$;
create or replace function public.open_booking_dispute(p_booking_id uuid,p_reason text) returns public.disputes language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_row public.disputes;
begin if char_length(trim(p_reason))<20 then raise exception 'reason is too short'; end if;
 if not exists(select 1 from public.bookings where id=p_booking_id and customer_id=v_user and status in('confirmed','service_due','fulfilled')) then raise exception 'booking cannot be disputed'; end if;
 insert into public.disputes(booking_id,opened_by,reason) values(p_booking_id,v_user,trim(p_reason)) returning * into v_row;
 perform set_config('app.transition_reason','Customer opened a dispute',true); update public.bookings set status='disputed' where id=p_booking_id; return v_row;
end $$;
create or replace function public.confirm_fulfillment(p_booking_id uuid) returns public.bookings language plpgsql security definer set search_path=public as $$
declare v_row public.bookings; begin perform set_config('app.transition_reason','Customer confirmed service fulfillment',true);
 update public.bookings set status='fulfilled' where id=p_booking_id and customer_id=auth.uid() and status='service_due' returning * into v_row;
 if not found then raise exception 'booking is not awaiting fulfillment confirmation'; end if; return v_row; end $$;

grant select,insert,update on public.notification_preferences,public.push_tokens to authenticated;
grant select,update on public.customer_notifications to authenticated; grant select on public.booking_reminders,public.cancellations,public.refunds,public.dispute_evidence to authenticated;
grant insert on public.product_events,public.dispute_evidence to authenticated; grant all privileges on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to authenticated,service_role;
grant execute on function public.cancellation_preview(uuid),public.request_cancellation(uuid,text),public.open_booking_dispute(uuid,text),public.confirm_fulfillment(uuid) to authenticated;

create or replace function public.process_refund_event(p_transaction_reference text,p_amount_kobo bigint,p_status text,p_provider_reference text,p_event_key text,p_event_hash text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_payment public.payments; v_refund public.refunds; v_total_refunded bigint;
begin
 insert into public.provider_events(provider,event_key,event_type,payload_sha256) values('paystack',p_event_key,'refund.'||p_status,p_event_hash) on conflict(event_key) do nothing;
 if not found then select r.* into v_refund from public.refunds r join public.payments p on p.id=r.payment_id where p.provider_reference=p_transaction_reference and r.amount_kobo=p_amount_kobo order by r.created_at desc limit 1; return v_refund.id; end if;
 select * into v_payment from public.payments where provider_reference=p_transaction_reference for update; if not found then raise exception 'unknown payment reference'; end if;
 select * into v_refund from public.refunds where payment_id=v_payment.id and amount_kobo=p_amount_kobo and status in('approved','processing','failed') order by created_at desc limit 1 for update; if not found then raise exception 'approved refund not found'; end if;
 if p_status='processed' then
   update public.refunds set status='succeeded',provider_reference=coalesce(p_provider_reference,provider_reference),failure_reason=null,updated_at=now() where id=v_refund.id;
   insert into public.ledger_entries(payment_id,entry_type,amount_kobo,provider_reference,idempotency_key) values(v_payment.id,'refund',-p_amount_kobo,p_provider_reference,'refund:'||v_refund.id) on conflict(idempotency_key) do nothing;
   select coalesce(sum(amount_kobo),0) into v_total_refunded from public.refunds where payment_id=v_payment.id and status='succeeded';
   update public.payments set status=case when v_total_refunded>=amount_kobo then 'refunded'::public.payment_status else 'partially_refunded'::public.payment_status end where id=v_payment.id;
   update public.payouts set status='reversed' where payment_id=v_payment.id and status in('held','eligible','failed');
 elsif p_status='failed' then update public.refunds set status='failed',failure_reason='Provider reported refund failure',updated_at=now() where id=v_refund.id;
 else update public.refunds set status='processing',provider_reference=coalesce(p_provider_reference,provider_reference),updated_at=now() where id=v_refund.id; end if;
 return v_refund.id;
end $$;
revoke all on function public.process_refund_event(text,bigint,text,text,text,text) from public,anon,authenticated;
grant execute on function public.process_refund_event(text,bigint,text,text,text,text) to service_role;
