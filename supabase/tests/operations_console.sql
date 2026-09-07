begin;
insert into auth.users(id,email) values
 ('10000000-0000-0000-0000-000000000001','ops@test.invalid'),
 ('10000000-0000-0000-0000-000000000002','finance@test.invalid'),
 ('10000000-0000-0000-0000-000000000003','vendor@test.invalid');
update public.profiles p set full_name=v.full_name,email=v.email,is_admin=v.is_admin
from (values
 ('10000000-0000-0000-0000-000000000001'::uuid,'Operations Test','ops@test.invalid',true),
 ('10000000-0000-0000-0000-000000000002'::uuid,'Finance Test','finance@test.invalid',true),
 ('10000000-0000-0000-0000-000000000003'::uuid,'Vendor Test','vendor@test.invalid',false)
) as v(id,full_name,email,is_admin) where p.id=v.id;
insert into public.admin_access(user_id,role) values
 ('10000000-0000-0000-0000-000000000001','operations'),
 ('10000000-0000-0000-0000-000000000002','finance');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
 if not public.admin_has_capability('bookings') then raise exception 'operations should manage bookings'; end if;
 if public.admin_has_capability('money') then raise exception 'operations must not manage money'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
 if not public.admin_has_capability('money') then raise exception 'finance should manage money'; end if;
 if public.admin_has_capability('vendors') then raise exception 'finance must not approve vendors'; end if;
end $$;

reset role;
select set_config('request.jwt.claim.sub','',true);
update public.admin_access set active=false,revoked_at=now() where user_id='10000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
 if public.admin_has_capability('money') then raise exception 'revoked access remained active'; end if;
end $$;

reset role;
insert into public.vendor_accounts(id,legal_name,category,phone,consent_version,created_by)
values('20000000-0000-0000-0000-000000000001','Conflict Venue Ltd','venue','+2348010000000','test-v1','10000000-0000-0000-0000-000000000001');
insert into public.vendor_memberships(account_id,user_id,role)
values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','owner');
insert into public.vendor_applications(id,account_id,status)
values('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','inspection_pending');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
reset role;
do $$ begin
 begin
   update public.vendor_applications set status='approved' where id='30000000-0000-0000-0000-000000000001';
   raise exception 'dual-role approval unexpectedly succeeded';
 exception when others then
   if sqlerrm='dual-role approval unexpectedly succeeded' then raise; end if;
 end;
end $$;
rollback;
