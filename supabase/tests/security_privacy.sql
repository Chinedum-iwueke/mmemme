begin;
insert into auth.users(id,email) values
 ('51000000-0000-0000-0000-000000000001','customer-a@test.invalid'),
 ('51000000-0000-0000-0000-000000000002','customer-b@test.invalid'),
 ('51000000-0000-0000-0000-000000000003','privacy-admin@test.invalid');
update public.profiles set full_name='Customer A',email='customer-a@test.invalid' where id='51000000-0000-0000-0000-000000000001';
update public.profiles set full_name='Customer B',email='customer-b@test.invalid' where id='51000000-0000-0000-0000-000000000002';
update public.profiles set full_name='Privacy Admin',email='privacy-admin@test.invalid',is_admin=true where id='51000000-0000-0000-0000-000000000003';
insert into public.admin_access(user_id,role) values('51000000-0000-0000-0000-000000000003','owner');
insert into public.wedding_briefs(id,customer_id,wedding_date,area,guest_count,budget_min_kobo,budget_max_kobo,priorities) values
 ('52000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001',current_date+90,'Lekki',100,100,200,array['venue']::public.vendor_category[]),
 ('52000000-0000-0000-0000-000000000002','51000000-0000-0000-0000-000000000002',current_date+90,'Ikeja',100,100,200,array['venue']::public.vendor_category[]);

set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-0000-0000-000000000001',true);
do $$ begin
 if (select count(*) from public.wedding_briefs)<>1 then raise exception 'cross-customer brief disclosure'; end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'cross-customer profile disclosure'; end if;
 if public.build_account_export('51000000-0000-0000-0000-000000000002') is not null then raise exception 'cross-customer export disclosure'; end if;
end $$;
select public.record_consent('analytics','privacy-2026-09',false,'web');
select public.request_account_data('export','Test export request');
do $$ begin begin perform public.request_account_data('export','Duplicate'); raise exception 'duplicate privacy request succeeded'; exception when others then if sqlerrm='duplicate privacy request succeeded' then raise; end if; end; end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 if (select count(*) from public.privacy_requests)<>0 then raise exception 'anonymous privacy disclosure'; end if;
 if (select count(*) from public.consent_records)<>0 then raise exception 'anonymous consent disclosure'; end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-0000-0000-000000000003',true);
select public.complete_privacy_request((select id from public.privacy_requests where user_id='51000000-0000-0000-0000-000000000001'),'true','Identity checked and export approved.');
do $$ begin
 if (select export_payload->'profile'->>'email' from public.privacy_requests where user_id='51000000-0000-0000-0000-000000000001')<>'customer-a@test.invalid' then raise exception 'export incomplete'; end if;
end $$;

select set_config('request.jwt.claim.sub','51000000-0000-0000-0000-000000000001',true);
select public.request_account_data('deletion','Delete test account data');
select set_config('request.jwt.claim.sub','51000000-0000-0000-0000-000000000003',true);
select public.complete_privacy_request((select id from public.privacy_requests where user_id='51000000-0000-0000-0000-000000000001' and kind='deletion'),'true','Identity checked and deletion approved.');
reset role;
do $$ begin
 if (select email is not null or privacy_deleted_at is null from public.profiles where id='51000000-0000-0000-0000-000000000001') then raise exception 'profile was not pseudonymized'; end if;
 if not (select banned_until='infinity'::timestamptz from auth.users where id='51000000-0000-0000-0000-000000000001') then raise exception 'deleted auth account remains active'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-0000-0000-000000000001',true);
do $$ begin begin update public.profiles set full_name='Resurrected' where id='51000000-0000-0000-0000-000000000001'; raise exception 'deleted profile reactivated'; exception when others then if sqlerrm='deleted profile reactivated' then raise; end if; end; end $$;

reset role;
do $$ declare v_rls_without_policy integer; begin
 select count(*) into v_rls_without_policy from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false;
 if v_rls_without_policy<>0 then raise exception '% public tables lack RLS',v_rls_without_policy; end if;
end $$;
rollback;
