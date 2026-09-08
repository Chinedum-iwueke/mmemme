begin;
insert into auth.users(id,email) values
 ('41000000-0000-0000-0000-000000000001','customer@test.invalid'),
 ('41000000-0000-0000-0000-000000000002','owner@test.invalid'),
 ('41000000-0000-0000-0000-000000000003','finance@test.invalid');
update public.profiles p set full_name=v.name,email=v.email,is_admin=v.admin
from (values
 ('41000000-0000-0000-0000-000000000001'::uuid,'Customer Test','customer@test.invalid',false),
 ('41000000-0000-0000-0000-000000000002'::uuid,'Owner Test','owner@test.invalid',true),
 ('41000000-0000-0000-0000-000000000003'::uuid,'Finance Test','finance@test.invalid',true)
) v(id,name,email,admin) where p.id=v.id;
insert into public.admin_access(user_id,role) values
 ('41000000-0000-0000-0000-000000000002','owner'),
 ('41000000-0000-0000-0000-000000000003','finance');
insert into public.vendors(id,name,category,area,description,capacity_min,capacity_max,price_from_kobo)
values('42000000-0000-0000-0000-000000000001','Atomic Venue','venue','Lekki','A test venue used only inside a rolled-back transaction.',50,500,10000000);
insert into public.service_packages(id,vendor_id,name,description,price_from_kobo,guest_min,guest_max)
values('43000000-0000-0000-0000-000000000001','42000000-0000-0000-0000-000000000001','Atomic package','A complete test package.',10000000,50,500);
insert into public.wedding_briefs(id,customer_id,wedding_date,area,guest_count,budget_min_kobo,budget_max_kobo,priorities)
values('44000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000001',current_date+90,'Lekki',100,5000000,20000000,array['venue']::public.vendor_category[]);
insert into public.bookings(id,correlation_id,customer_id,wedding_brief_id,vendor_id,package_id,event_date,guest_count,requirements,status)
values('45000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000001','44000000-0000-0000-0000-000000000001','42000000-0000-0000-0000-000000000001','43000000-0000-0000-0000-000000000001',current_date+90,100,'Need complete venue availability and terms.','operations_review');
insert into public.vendors(id,name,category,area,description,capacity_min,capacity_max,price_from_kobo) values('42000000-0000-0000-0000-000000000002','Boundary Caterer','caterer','Ikeja','A caterer used for policy boundary testing only.',50,500,5000000);
insert into public.service_packages(id,vendor_id,name,description,price_from_kobo,guest_min,guest_max) values('43000000-0000-0000-0000-000000000002','42000000-0000-0000-0000-000000000002','Catering test','Boundary policy catering package.',5000000,50,500);
insert into public.wedding_briefs(id,customer_id,wedding_date,area,guest_count,budget_min_kobo,budget_max_kobo,priorities) values('44000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000001',current_date+14,'Ikeja',100,1000000,10000000,array['caterer']::public.vendor_category[]);
insert into public.bookings(id,correlation_id,customer_id,wedding_brief_id,vendor_id,package_id,event_date,guest_count,requirements,status) values('45000000-0000-0000-0000-000000000002','46000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000001','44000000-0000-0000-0000-000000000002','42000000-0000-0000-0000-000000000002','43000000-0000-0000-0000-000000000002',current_date+14,100,'Need a full catering package for boundary testing.','confirmed');
insert into public.quotes(id,booking_id,total_amount_kobo,deposit_amount_kobo,cancellation_template_version,cancellation_summary,terms_version,expires_at,created_by) values('49000000-0000-0000-0000-000000000002','45000000-0000-0000-0000-000000000002',5000000,1000000,'category-2026-09','Approved category policy applies.','beta-2026-09',now()+interval '1 day','41000000-0000-0000-0000-000000000002');
insert into public.payments(id,booking_id,quote_id,customer_id,provider,provider_reference,amount_kobo,status,paid_at) values('47000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000002','49000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000001','paystack','ps_test_caterer',1000000,'succeeded',now());

set local role authenticated;
select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000002',true);
select public.admin_issue_quote('45000000-0000-0000-0000-000000000001',1,10000000,5000000,now()+interval '2 days','90% refundable until 90 days; exact policy applies.',array['Hall'],array['Decor'],'50% now; balance later');
do $$ begin
 if (select status<>'quote_ready' or revision<>2 from public.bookings where id='45000000-0000-0000-0000-000000000001') then raise exception 'atomic quote transition failed'; end if;
 if (select count(*)<>1 from public.quotes where booking_id='45000000-0000-0000-0000-000000000001') then raise exception 'quote missing'; end if;
 begin perform public.admin_issue_quote('45000000-0000-0000-0000-000000000001',1,10000000,5000000,now()+interval '2 days','Stale revision must roll back every write.',array['Hall'],array[]::text[],'50% now'); raise exception 'stale quote succeeded'; exception when others then if sqlerrm='stale quote succeeded' then raise; end if; end;
 if (select count(*)<>1 from public.quotes where booking_id='45000000-0000-0000-0000-000000000001') then raise exception 'stale quote left partial data'; end if;
end $$;

select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000001',true);
select public.accept_quote('45000000-0000-0000-0000-000000000001',(select id from public.quotes where booking_id='45000000-0000-0000-0000-000000000001'));
reset role;
select set_config('request.jwt.claim.sub','',true);
insert into public.payments(id,booking_id,quote_id,customer_id,provider,provider_reference,amount_kobo,status)
select '47000000-0000-0000-0000-000000000001',b.id,q.id,b.customer_id,'paystack','ps_test_atomic',q.deposit_amount_kobo,'pending' from public.bookings b join public.quotes q on q.booking_id=b.id where b.id='45000000-0000-0000-0000-000000000001';
select public.process_successful_payment('ps_test_atomic',5000000,'charge.success:atomic','hash-a');
select public.process_successful_payment('ps_test_atomic',5000000,'charge.success:atomic','hash-a');
select public.process_successful_payment('ps_test_atomic',5000000,'charge.success:delayed','hash-b');
do $$ begin
 begin perform public.process_successful_payment('ps_test_atomic',4999999,'charge.success:mismatch','hash-mismatch'); raise exception 'amount mismatch succeeded'; exception when others then if sqlerrm='amount mismatch succeeded' then raise; end if; end;
 begin perform public.process_successful_payment('unknown_reference',5000000,'charge.success:unknown','hash-unknown'); raise exception 'unknown reference succeeded'; exception when others then if sqlerrm='unknown reference succeeded' then raise; end if; end;
end $$;
do $$ begin
 if (select status<>'succeeded' or verified_amount_kobo<>5000000 or verified_currency<>'NGN' from public.payments where id='47000000-0000-0000-0000-000000000001') then raise exception 'verified payment state failed'; end if;
 if (select count(*)<>4 from public.ledger_entries where payment_id='47000000-0000-0000-0000-000000000001') then raise exception 'duplicate ledger value'; end if;
 if (select count(*)<>1 from public.payouts where payment_id='47000000-0000-0000-0000-000000000001') then raise exception 'duplicate payout'; end if;
 if (select status<>'confirmed' from public.bookings where id='45000000-0000-0000-0000-000000000001') then raise exception 'booking not confirmed'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000001',true);
do $$ declare preview jsonb; cancellation public.cancellations; begin
 preview:=public.cancellation_preview('45000000-0000-0000-0000-000000000001');
 if (preview->>'policyVersion')<>'venue-beta-2026-09' or (preview->>'refundBps')::integer<>9000 or (preview->>'refundableAmountKobo')::bigint<>4500000 then raise exception 'venue boundary policy mismatch: %',preview; end if;
 preview:=public.cancellation_preview('45000000-0000-0000-0000-000000000002');
 if (preview->>'policyVersion')<>'caterer-beta-2026-09' or (preview->>'refundBps')::integer<>4000 or (preview->>'refundableAmountKobo')::bigint<>400000 then raise exception 'caterer boundary policy mismatch: %',preview; end if;
 cancellation:=public.request_cancellation('45000000-0000-0000-0000-000000000001','Our plans changed and we need the approved policy applied.');
end $$;
select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000002',true);
select public.admin_decide_cancellation((select id from public.cancellations where booking_id='45000000-0000-0000-0000-000000000001'),true,'Verified against venue policy and payment.');
select public.admin_approve_refund((select id from public.refunds where booking_id='45000000-0000-0000-0000-000000000001'),'First finance approval.');
do $$ begin begin perform public.admin_approve_refund((select id from public.refunds where booking_id='45000000-0000-0000-0000-000000000001'),'Improper duplicate approval.'); raise exception 'same approver succeeded'; exception when others then if sqlerrm='same approver succeeded' then raise; end if; end; end $$;
select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000003',true);
select public.admin_approve_refund((select id from public.refunds where booking_id='45000000-0000-0000-0000-000000000001'),'Independent second finance approval.');

reset role;
select set_config('request.jwt.claim.sub','',true);
insert into public.ledger_entries(payment_id,entry_type,amount_kobo,idempotency_key) values
 ('47000000-0000-0000-0000-000000000003','gross',1000000,'caterer:gross'),
 ('47000000-0000-0000-0000-000000000003','gateway_fee',0,'caterer:gateway'),
 ('47000000-0000-0000-0000-000000000003','platform_fee',75000,'caterer:fee'),
 ('47000000-0000-0000-0000-000000000003','vendor_net',925000,'caterer:net');
insert into public.payouts(id,booking_id,payment_id,vendor_id,amount_kobo,status) values('4a000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000002','47000000-0000-0000-0000-000000000003','42000000-0000-0000-0000-000000000002',925000,'held');
update public.bookings set status='service_due' where id='45000000-0000-0000-0000-000000000002';
update public.bookings set status='fulfilled' where id='45000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000002',true);
select public.admin_approve_payout('4a000000-0000-0000-0000-000000000001','First payout eligibility approval.');
do $$ begin begin perform public.admin_approve_payout('4a000000-0000-0000-0000-000000000001','Improper duplicate payout approval.'); raise exception 'same payout approver succeeded'; exception when others then if sqlerrm='same payout approver succeeded' then raise; end if; end; end $$;
select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000003',true);
select public.admin_approve_payout('4a000000-0000-0000-0000-000000000001','Independent payout eligibility approval.');
do $$ begin if (select status<>'eligible' from public.payouts where id='4a000000-0000-0000-0000-000000000001') then raise exception 'payout did not become eligible'; end if; end $$;

reset role;
select set_config('request.jwt.claim.sub','',true);
insert into public.customer_notifications(customer_id,booking_id,kind,title,body,deduplication_key) values('41000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000001','security','Test critical notice','Test delivery body.','delivery:test') on conflict(deduplication_key) do nothing;
do $$ declare first_count integer; second_count integer; begin
 select count(*) into first_count from public.claim_notification_deliveries(100,'48000000-0000-0000-0000-000000000001');
 select count(*) into second_count from public.claim_notification_deliveries(100,'48000000-0000-0000-0000-000000000002');
 if first_count<2 or second_count<>0 then raise exception 'notification lease was not exclusive: %, %',first_count,second_count; end if;
end $$;
select public.complete_notification_delivery(id,'48000000-0000-0000-0000-000000000001','retry','','','synthetic outage') from public.notification_outbox where lease_token='48000000-0000-0000-0000-000000000001';

insert into public.payments(id,booking_id,quote_id,customer_id,provider,provider_reference,amount_kobo,status,paid_at)
select '47000000-0000-0000-0000-000000000002',b.id,q.id,b.customer_id,'paystack','ps_test_mismatch',123456,'succeeded',now() from public.bookings b join public.quotes q on q.booking_id=b.id where b.id='45000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','41000000-0000-0000-0000-000000000003',true);
select public.run_financial_reconciliation(current_date);
reset role;
do $$ begin
 if not exists(select 1 from public.reconciliation_exceptions where payment_id='47000000-0000-0000-0000-000000000002') then raise exception 'synthetic discrepancy not detected'; end if;
 if not exists(select 1 from public.financial_alerts where kind='reconciliation') then raise exception 'financial owner was not alerted'; end if;
end $$;
select public.process_chargeback_event('ps_test_atomic',1000000,'charge.dispute.create','charge.dispute.create:99','hash-c','99');
select public.process_chargeback_event('ps_test_atomic',1000000,'charge.dispute.create','charge.dispute.create:99','hash-c','99');
do $$ begin if (select count(*)<>1 from public.ledger_entries where payment_id='47000000-0000-0000-0000-000000000001' and entry_type='chargeback') then raise exception 'chargeback duplicated'; end if; end $$;
rollback;
