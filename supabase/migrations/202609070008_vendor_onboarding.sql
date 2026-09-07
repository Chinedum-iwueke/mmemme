create type public.vendor_member_role as enum ('owner','manager','editor','viewer');
create type public.vendor_application_status as enum ('draft','submitted','in_review','inspection_pending','changes_requested','approved','rejected','withdrawn','expired','suspended');
create type public.vendor_evidence_status as enum ('quarantined','scanning','clean','rejected','expired');
create type public.provider_check_status as enum ('pending','processing','passed','failed','manual_review','unavailable');

create table public.vendor_accounts (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check(char_length(trim(legal_name)) between 2 and 160),
  category public.vendor_category not null,
  phone text not null check(phone ~ '^\+234[789][01][0-9]{8}$'),
  consent_version text not null,
  consented_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.vendor_memberships (
  account_id uuid not null references public.vendor_accounts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.vendor_member_role not null,
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key(account_id,user_id)
);
create unique index one_vendor_owner on public.vendor_memberships(account_id) where role='owner';
create table public.vendor_invitations (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.vendor_accounts(id) on delete cascade,
  email text not null, role public.vendor_member_role not null check(role<>'owner'), token_hash text not null unique,
  invited_by uuid not null references public.profiles(id), expires_at timestamptz not null, accepted_at timestamptz,
  created_at timestamptz not null default now(), unique(account_id,email)
);
create table public.vendor_credential_requirements (
  id uuid primary key default gen_random_uuid(), category public.vendor_category not null, version text not null,
  code text not null, label text not null, description text not null, evidence_kind text not null,
  required boolean not null default true, expires boolean not null default false,
  accepted_mime_types text[] not null, max_bytes integer not null check(max_bytes between 1 and 10485760),
  max_pages integer check(max_pages between 1 and 50), active boolean not null default true,
  created_at timestamptz not null default now(), unique(category,version,code)
);
create table public.vendor_applications (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references public.vendor_accounts(id) on delete cascade,
  status public.vendor_application_status not null default 'draft', requirements_version text not null default '2026-09',
  current_step integer not null default 1 check(current_step between 1 and 8), revision integer not null default 1,
  draft_data jsonb not null default '{}', submission_snapshot jsonb, submitted_at timestamptz,
  assigned_reviewer uuid references public.profiles(id), decision_reason text, vendor_id uuid references public.vendors(id),
  expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(account_id)
);
create table public.vendor_application_events (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  actor_id uuid references public.profiles(id), previous_state public.vendor_application_status,
  new_state public.vendor_application_status not null, reason text not null, metadata jsonb not null default '{}',
  correlation_id uuid not null default gen_random_uuid(), created_at timestamptz not null default now()
);
create table public.vendor_evidence (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  requirement_code text not null, storage_path text not null unique, original_name text not null,
  mime_type text not null, byte_size integer not null check(byte_size between 1 and 10485760), page_count integer,
  expires_at date, status public.vendor_evidence_status not null default 'quarantined', scan_provider text,
  scan_reference text, rejection_reason text, ownership_attested boolean not null,
  uploaded_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), scanned_at timestamptz,
  unique(application_id,requirement_code)
);
create table public.vendor_provider_checks (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  kind text not null check(kind in ('identity','bank_name')), provider text not null, provider_request_id text not null,
  status public.provider_check_status not null default 'pending', result_summary jsonb not null default '{}',
  consent_version text not null, consented_at timestamptz not null, reviewed_by uuid references public.profiles(id),
  reviewer_decision text check(reviewer_decision is null or reviewer_decision in ('accept','reject','manual_review')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(provider,provider_request_id), unique(application_id,kind)
);
create table public.vendor_listing_drafts (
  application_id uuid primary key references public.vendor_applications(id) on delete cascade,
  trading_name text not null default '', area text not null default '', description text not null default '',
  capacity_min integer, capacity_max integer, price_from_kobo bigint, portfolio_paths text[] not null default '{}',
  revision integer not null default 1, updated_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(),
  check(capacity_min is null or capacity_min>0), check(capacity_max is null or capacity_max>=capacity_min),
  check(price_from_kobo is null or price_from_kobo>0)
);
create table public.vendor_package_drafts (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  name text not null check(char_length(trim(name)) between 2 and 120), description text not null check(char_length(trim(description)) between 10 and 1000),
  price_from_kobo bigint not null check(price_from_kobo>0), guest_min integer not null check(guest_min>0),
  guest_max integer not null check(guest_max>=guest_min), inclusions text[] not null default '{}', exclusions text[] not null default '{}',
  active boolean not null default true, updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.vendor_inspections (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  scheduled_for timestamptz not null, address text not null, acknowledged_at timestamptz, completed_at timestamptz,
  outcome text check(outcome is null or outcome in ('passed','failed','follow_up')), notes text,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.vendor_change_requests (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  requested_by uuid not null references public.profiles(id), fields text[] not null, request_message text not null,
  vendor_response text, responded_by uuid references public.profiles(id), responded_at timestamptz, resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.vendor_notifications (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id), kind text not null, title text not null, body text not null,
  deduplication_key text not null unique, email_status text not null default 'pending' check(email_status in ('pending','sent','failed','suppressed')),
  created_at timestamptz not null default now(), sent_at timestamptz
);
create table public.vendor_funnel_events (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.vendor_applications(id) on delete cascade,
  account_id uuid not null references public.vendor_accounts(id) on delete cascade, actor_id uuid references public.profiles(id),
  event_name text not null, step integer, properties jsonb not null default '{}', created_at timestamptz not null default now()
);

create or replace function public.is_vendor_member(p_account_id uuid, p_roles public.vendor_member_role[] default null)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.vendor_memberships m where m.account_id=p_account_id and m.user_id=auth.uid() and (p_roles is null or m.role=any(p_roles)))
$$;
create or replace function public.application_account(p_application_id uuid) returns uuid language sql stable security definer set search_path=public as $$
  select account_id from public.vendor_applications where id=p_application_id
$$;
create or replace function public.create_vendor_account(p_legal_name text,p_category public.vendor_category,p_phone text,p_consent_version text)
returns public.vendor_applications language plpgsql security definer set search_path=public as $$
declare v_account public.vendor_accounts; v_application public.vendor_applications;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if p_phone !~ '^\+234[789][01][0-9]{8}$' then raise exception 'valid Nigerian phone required'; end if;
 if exists(select 1 from public.vendor_memberships where user_id=auth.uid()) then raise exception 'vendor account already exists'; end if;
 insert into public.vendor_accounts(legal_name,category,phone,consent_version,created_by) values(trim(p_legal_name),p_category,p_phone,p_consent_version,auth.uid()) returning * into v_account;
 insert into public.vendor_memberships(account_id,user_id,role) values(v_account.id,auth.uid(),'owner');
 insert into public.vendor_applications(account_id) values(v_account.id) returning * into v_application;
 insert into public.vendor_application_events(application_id,actor_id,new_state,reason) values(v_application.id,auth.uid(),'draft','Application created');
 insert into public.vendor_funnel_events(application_id,account_id,actor_id,event_name,step) values(v_application.id,v_account.id,auth.uid(),'application_created',1);
 return v_application;
end $$;
create or replace function public.save_vendor_application(p_application_id uuid,p_step integer,p_data jsonb,p_expected_revision integer)
returns public.vendor_applications language plpgsql security definer set search_path=public as $$
declare v_row public.vendor_applications;
begin
 if not public.is_vendor_member(public.application_account(p_application_id),array['owner','manager','editor']::public.vendor_member_role[]) then raise exception 'not authorized'; end if;
 if jsonb_typeof(p_data)<>'object' or pg_column_size(p_data)>65536 then raise exception 'invalid application data'; end if;
 update public.vendor_applications set draft_data=draft_data||p_data,current_step=greatest(current_step,p_step),revision=revision+1,updated_at=now()
 where id=p_application_id and revision=p_expected_revision and status in('draft','changes_requested') returning * into v_row;
 if not found then raise exception 'application changed; refresh before saving'; end if;
 insert into public.vendor_funnel_events(application_id,account_id,actor_id,event_name,step,properties)
 values(v_row.id,v_row.account_id,auth.uid(),'step_saved',p_step,jsonb_build_object('revision',v_row.revision));
 return v_row;
end $$;
create or replace function public.submit_vendor_application(p_application_id uuid,p_attested boolean,p_idempotency_key uuid)
returns public.vendor_applications language plpgsql security definer set search_path=public as $$
declare v_row public.vendor_applications; v_missing integer; v_previous public.vendor_application_status;
begin
 select * into v_row from public.vendor_applications where id=p_application_id for update;
 if not public.is_vendor_member(v_row.account_id,array['owner','manager']::public.vendor_member_role[]) then raise exception 'not authorized'; end if;
 if v_row.status='submitted' and v_row.submission_snapshot->>'idempotencyKey'=p_idempotency_key::text then return v_row; end if;
 if v_row.status not in('draft','changes_requested') then raise exception 'application cannot be submitted'; end if;
 v_previous:=v_row.status;
 if not p_attested then raise exception 'attestation required'; end if;
 if coalesce(v_row.draft_data->>'tradingName','')='' or coalesce(v_row.draft_data->>'address','')='' or coalesce(v_row.draft_data->>'references','')='' then raise exception 'required application details are missing'; end if;
 select count(*) into v_missing from public.vendor_credential_requirements r where r.category=(select category from public.vendor_accounts where id=v_row.account_id) and r.version=v_row.requirements_version and r.required and r.evidence_kind<>'provider' and not exists(select 1 from public.vendor_evidence e where e.application_id=v_row.id and e.requirement_code=r.code and e.status='clean');
 if v_missing>0 then raise exception 'required clean credentials are missing'; end if;
 if not exists(select 1 from public.vendor_provider_checks where application_id=v_row.id and kind='identity' and (status='passed' or reviewer_decision='accept')) then raise exception 'identity verification is incomplete'; end if;
 if not exists(select 1 from public.vendor_provider_checks where application_id=v_row.id and kind='bank_name' and (status='passed' or reviewer_decision='accept')) then raise exception 'bank-name verification is incomplete'; end if;
 if not exists(select 1 from public.vendor_package_drafts where application_id=v_row.id and active) then raise exception 'at least one package is required'; end if;
 update public.vendor_applications set status='submitted',submitted_at=now(),submission_snapshot=jsonb_build_object('idempotencyKey',p_idempotency_key,'application',draft_data,'submittedAt',now()),revision=revision+1,updated_at=now() where id=v_row.id returning * into v_row;
 insert into public.vendor_application_events(application_id,actor_id,previous_state,new_state,reason) values(v_row.id,auth.uid(),v_previous,'submitted','Vendor attested and submitted');
 insert into public.vendor_notifications(application_id,recipient_id,kind,title,body,deduplication_key) values(v_row.id,auth.uid(),'received','Application received','MMEMME received your verification application.','received:'||v_row.id||':'||v_row.revision) on conflict(deduplication_key) do nothing;
 insert into public.vendor_funnel_events(application_id,account_id,actor_id,event_name,step) values(v_row.id,v_row.account_id,auth.uid(),'application_submitted',6);
 return v_row;
end $$;
create or replace function public.respond_vendor_change_request(p_request_id uuid,p_response text)
returns public.vendor_change_requests language plpgsql security definer set search_path=public as $$
declare v_row public.vendor_change_requests;
begin update public.vendor_change_requests r set vendor_response=trim(p_response),responded_by=auth.uid(),responded_at=now() where r.id=p_request_id and public.is_vendor_member(public.application_account(r.application_id),array['owner','manager','editor']::public.vendor_member_role[]) and r.resolved_at is null returning * into v_row;
 if not found then raise exception 'change request not found'; end if; insert into public.vendor_funnel_events(application_id,account_id,actor_id,event_name) values(v_row.application_id,public.application_account(v_row.application_id),auth.uid(),'change_response'); return v_row; end $$;
create or replace function public.invite_vendor_member(p_account_id uuid,p_email text,p_role public.vendor_member_role)
returns text language plpgsql security definer set search_path=public as $$
declare v_token text:=encode(extensions.gen_random_bytes(24),'hex');
begin
 if not public.is_vendor_member(p_account_id,array['owner','manager']::public.vendor_member_role[]) or p_role='owner' then raise exception 'not authorized'; end if;
 insert into public.vendor_invitations(account_id,email,role,token_hash,invited_by,expires_at) values(p_account_id,lower(trim(p_email)),p_role,encode(extensions.digest(v_token,'sha256'),'hex'),auth.uid(),now()+interval '7 days')
 on conflict(account_id,email) do update set role=excluded.role,token_hash=excluded.token_hash,invited_by=excluded.invited_by,expires_at=excluded.expires_at,accepted_at=null;
 return v_token;
end $$;
create or replace function public.accept_vendor_invitation(p_token text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_invite public.vendor_invitations; v_email text;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select lower(coalesce(email,'')) into v_email from auth.users where id=auth.uid();
 select * into v_invite from public.vendor_invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires_at>now() and accepted_at is null and email=v_email for update;
 if not found then raise exception 'invitation is invalid or expired'; end if;
 insert into public.vendor_memberships(account_id,user_id,role,invited_by) values(v_invite.account_id,auth.uid(),v_invite.role,v_invite.invited_by) on conflict do nothing;
 update public.vendor_invitations set accepted_at=now() where id=v_invite.id; return v_invite.account_id;
end $$;
create or replace function public.propose_vendor_maintenance(p_application_id uuid,p_fields text[],p_reason text)
returns public.vendor_change_requests language plpgsql security definer set search_path=public as $$
declare v_row public.vendor_change_requests; v_account uuid:=public.application_account(p_application_id);
begin
 if not public.is_vendor_member(v_account,array['owner','manager','editor']::public.vendor_member_role[]) then raise exception 'not authorized'; end if;
 if not exists(select 1 from public.vendor_applications where id=p_application_id and status='approved') then raise exception 'application is not approved'; end if;
 insert into public.vendor_change_requests(application_id,requested_by,fields,request_message) values(p_application_id,auth.uid(),p_fields,trim(p_reason)) returning * into v_row;
 insert into public.vendor_application_events(application_id,actor_id,previous_state,new_state,reason,metadata) values(p_application_id,auth.uid(),'approved','approved','Vendor proposed reviewed changes',jsonb_build_object('changeRequestId',v_row.id,'fields',p_fields));
 insert into public.vendor_funnel_events(application_id,account_id,actor_id,event_name,properties) values(p_application_id,v_account,auth.uid(),'maintenance_proposed',jsonb_build_object('fieldCount',cardinality(p_fields))); return v_row;
end $$;

create or replace function public.review_vendor_application(p_application_id uuid,p_new_status public.vendor_application_status,p_reason text,p_fields text[] default '{}')
returns public.vendor_applications language plpgsql security definer set search_path=public as $$
declare v_old public.vendor_applications; v_row public.vendor_applications; v_owner uuid; v_kind text; v_listing public.vendor_listing_drafts; v_account public.vendor_accounts; v_vendor uuid; v_package public.vendor_package_drafts;
begin
 if not public.is_admin() then raise exception 'admin required'; end if;
 select * into v_old from public.vendor_applications where id=p_application_id for update;
 if p_new_status not in('in_review','inspection_pending','changes_requested','approved','rejected','suspended','expired') then raise exception 'invalid operator state'; end if;
 if (v_old.status,p_new_status) not in (('submitted','in_review'),('submitted','changes_requested'),('submitted','rejected'),('in_review','inspection_pending'),('in_review','changes_requested'),('in_review','rejected'),('inspection_pending','approved'),('inspection_pending','changes_requested'),('inspection_pending','rejected'),('approved','suspended'),('approved','expired'),('suspended','in_review')) then raise exception 'invalid application transition: % -> %',v_old.status,p_new_status; end if;
 if p_new_status='approved' and (not exists(select 1 from public.vendor_inspections where application_id=p_application_id and outcome='passed') or exists(select 1 from public.vendor_evidence where application_id=p_application_id and status<>'clean') or not exists(select 1 from public.vendor_provider_checks where application_id=p_application_id and kind='identity' and (status='passed' or reviewer_decision='accept')) or not exists(select 1 from public.vendor_provider_checks where application_id=p_application_id and kind='bank_name' and (status='passed' or reviewer_decision='accept'))) then raise exception 'identity, bank name, inspection and clean evidence required'; end if;
 if p_new_status='approved' then
   select * into v_listing from public.vendor_listing_drafts where application_id=p_application_id;
   select * into v_account from public.vendor_accounts where id=v_old.account_id;
   if v_listing.trading_name='' or char_length(v_listing.description)<20 or not exists(select 1 from public.vendor_package_drafts where application_id=p_application_id and active) then raise exception 'complete listing and package required'; end if;
   if v_old.vendor_id is null then
     insert into public.vendors(name,category,area,description,capacity_min,capacity_max,price_from_kobo,verification_status,published,hero_image_path,verification_expires_at)
     values(v_listing.trading_name,v_account.category,v_listing.area,v_listing.description,v_listing.capacity_min,v_listing.capacity_max,v_listing.price_from_kobo,'draft',false,null,now()+interval '1 year') returning id into v_vendor;
     for v_package in select * from public.vendor_package_drafts where application_id=p_application_id and active loop
       insert into public.service_packages(vendor_id,name,description,price_from_kobo,inclusions,guest_min,guest_max,active) values(v_vendor,v_package.name,v_package.description,v_package.price_from_kobo,v_package.inclusions,v_package.guest_min,v_package.guest_max,true);
     end loop;
     insert into public.verification_records(vendor_id,status,identity_checked,contact_checked,bank_name_checked,authority_checked,portfolio_checked,references_checked,physical_site_checked,checked_by,checked_at,expires_at,public_note)
     values(v_vendor,'approved',true,true,true,true,true,true,true,auth.uid(),now(),now()+interval '1 year','MMEMME checked identity, contact, bank account name, operating authority, portfolio, references and the physical operating site.');
     update public.vendors set verification_status='approved',published=true where id=v_vendor;
     update public.vendor_applications set vendor_id=v_vendor where id=p_application_id;
   else v_vendor:=v_old.vendor_id; end if;
 end if;
 update public.vendor_applications set status=p_new_status,assigned_reviewer=auth.uid(),decision_reason=trim(p_reason),expires_at=case when p_new_status='approved' then now()+interval '1 year' else expires_at end,revision=revision+1,updated_at=now() where id=p_application_id returning * into v_row;
 if p_new_status='changes_requested' then insert into public.vendor_change_requests(application_id,requested_by,fields,request_message) values(p_application_id,auth.uid(),p_fields,trim(p_reason)); end if;
 insert into public.vendor_application_events(application_id,actor_id,previous_state,new_state,reason,correlation_id) values(p_application_id,auth.uid(),v_old.status,p_new_status,trim(p_reason),gen_random_uuid());
 select user_id into v_owner from public.vendor_memberships where account_id=v_row.account_id and role='owner'; v_kind:=p_new_status::text;
 insert into public.vendor_notifications(application_id,recipient_id,kind,title,body,deduplication_key) values(p_application_id,v_owner,v_kind,'Application '||replace(p_new_status::text,'_',' '),left(trim(p_reason),500),v_kind||':'||p_application_id||':'||v_row.revision) on conflict(deduplication_key) do nothing;
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,metadata,correlation_id) values(auth.uid(),'vendor_application.'||p_new_status::text,'vendor_application',p_application_id,trim(p_reason),jsonb_build_object('fields',p_fields),gen_random_uuid());
 if p_new_status in('suspended','expired','rejected') and v_row.vendor_id is not null then update public.vendors set published=false,verification_status=case when p_new_status='expired' then 'expired'::public.verification_status else verification_status end where id=v_row.vendor_id; end if;
 return v_row;
end $$;

create or replace function public.protect_vendor_membership() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='UPDATE' and new.role<>old.role and not public.is_admin() then raise exception 'membership role changes require operations'; end if;
 if tg_op='DELETE' and old.role='owner' and not public.is_admin() then raise exception 'owner cannot be removed'; end if;
 return coalesce(new,old);
end $$;
create or replace function public.expire_vendor_applications() returns integer language plpgsql security definer set search_path=public as $$
declare v_row public.vendor_applications; v_count integer:=0; v_owner uuid;
begin
 for v_row in select * from public.vendor_applications where status='approved' and expires_at<=now() for update loop
   update public.vendor_applications set status='expired',updated_at=now(),revision=revision+1 where id=v_row.id;
   if v_row.vendor_id is not null then update public.vendors set published=false,verification_status='expired' where id=v_row.vendor_id; end if;
   insert into public.vendor_application_events(application_id,previous_state,new_state,reason) values(v_row.id,'approved','expired','Verification validity period ended');
   select user_id into v_owner from public.vendor_memberships where account_id=v_row.account_id and role='owner';
   insert into public.vendor_notifications(application_id,recipient_id,kind,title,body,deduplication_key) values(v_row.id,v_owner,'expired','Your MMEMME verification expired','Renew the required credentials before the listing can return to the marketplace.','expired:'||v_row.id||':'||v_row.expires_at) on conflict(deduplication_key) do nothing;
   v_count:=v_count+1;
 end loop; return v_count;
end $$;
create trigger protect_vendor_membership before update or delete on public.vendor_memberships for each row execute function public.protect_vendor_membership();
create or replace function public.protect_vendor_evidence_review() returns trigger language plpgsql set search_path=public as $$
begin
 if public.is_admin() or coalesce(auth.jwt()->>'role','')='service_role' or current_user in('postgres','supabase_admin') then return new; end if;
 if tg_op='INSERT' then new.status:='quarantined'; new.scan_provider:=null; new.scan_reference:=null; new.rejection_reason:=null; new.scanned_at:=null;
 elsif new.storage_path is distinct from old.storage_path then new.status:='quarantined'; new.scan_provider:=null; new.scan_reference:=null; new.rejection_reason:=null; new.scanned_at:=null;
 elsif new.status<>old.status or new.scan_provider is distinct from old.scan_provider or new.scan_reference is distinct from old.scan_reference or new.rejection_reason is distinct from old.rejection_reason or new.scanned_at is distinct from old.scanned_at then raise exception 'evidence review fields are server managed'; end if;
 return new;
end $$;
create trigger protect_vendor_evidence before insert or update on public.vendor_evidence for each row execute function public.protect_vendor_evidence_review();
create or replace function public.protect_vendor_inspection_review() returns trigger language plpgsql set search_path=public as $$
begin
 if public.is_admin() or coalesce(auth.jwt()->>'role','')='service_role' or current_user in('postgres','supabase_admin') then return new; end if;
 if new.scheduled_for<>old.scheduled_for or new.address<>old.address or new.completed_at is distinct from old.completed_at or new.outcome is distinct from old.outcome or new.notes is distinct from old.notes then raise exception 'inspection review fields are operator managed'; end if;
 return new;
end $$;
create trigger protect_vendor_inspection before update on public.vendor_inspections for each row execute function public.protect_vendor_inspection_review();
create trigger immutable_vendor_application_events before update or delete on public.vendor_application_events for each row execute function public.prevent_update_delete();
create trigger immutable_vendor_funnel_events before update or delete on public.vendor_funnel_events for each row execute function public.prevent_update_delete();
create or replace function public.redact_vendor_funnel_event() returns trigger language plpgsql as $$
begin
 if new.event_name not in('application_created','step_saved','application_submitted','change_response','maintenance_proposed') then raise exception 'unsupported vendor funnel event'; end if;
 new.properties:=new.properties-'credential'-'document'-'identity'-'bank'-'phone'-'email'-'name'-'address'-'references'; return new;
end $$;
create trigger redact_vendor_funnel before insert on public.vendor_funnel_events for each row execute function public.redact_vendor_funnel_event();

insert into public.vendor_credential_requirements(category,version,code,label,description,evidence_kind,expires,accepted_mime_types,max_bytes,max_pages) values
('venue','2026-09','authority','Business or operating authority','Evidence that the venue may operate at this site.','document',true,array['application/pdf','image/jpeg','image/png'],10485760,20),
('venue','2026-09','site','Operating site','Current proof of the physical venue.','image',false,array['image/jpeg','image/png','image/webp'],10485760,null),
('venue','2026-09','identity','Owner or director identity','Submit through the approved identity provider.','provider',true,array['application/pdf'],10485760,1),
('venue','2026-09','bank_name','Settlement bank-name match','Confirm the settlement account name through the approved provider.','provider',false,array['application/pdf'],10485760,1),
('caterer','2026-09','authority','Business or operating authority','Evidence of authority to operate the catering business.','document',true,array['application/pdf','image/jpeg','image/png'],10485760,20),
('caterer','2026-09','site','Operating kitchen','Current proof of the inspected catering site.','image',false,array['image/jpeg','image/png','image/webp'],10485760,null),
('caterer','2026-09','identity','Owner or director identity','Submit through the approved identity provider.','provider',true,array['application/pdf'],10485760,1),
('caterer','2026-09','bank_name','Settlement bank-name match','Confirm the settlement account name through the approved provider.','provider',false,array['application/pdf'],10485760,1);

alter table public.vendor_accounts enable row level security; alter table public.vendor_memberships enable row level security;
alter table public.vendor_invitations enable row level security; alter table public.vendor_credential_requirements enable row level security;
alter table public.vendor_applications enable row level security; alter table public.vendor_application_events enable row level security;
alter table public.vendor_evidence enable row level security; alter table public.vendor_provider_checks enable row level security;
alter table public.vendor_listing_drafts enable row level security; alter table public.vendor_package_drafts enable row level security;
alter table public.vendor_inspections enable row level security; alter table public.vendor_change_requests enable row level security;
alter table public.vendor_notifications enable row level security; alter table public.vendor_funnel_events enable row level security;
create policy "members read vendor account" on public.vendor_accounts for select using(public.is_vendor_member(id) or public.is_admin());
create policy "owners update vendor account" on public.vendor_accounts for update using(public.is_vendor_member(id,array['owner','manager']::public.vendor_member_role[]) or public.is_admin()) with check(public.is_vendor_member(id,array['owner','manager']::public.vendor_member_role[]) or public.is_admin());
create policy "members read memberships" on public.vendor_memberships for select using(public.is_vendor_member(account_id) or public.is_admin());
create policy "owners manage invitations" on public.vendor_invitations for all using(public.is_vendor_member(account_id,array['owner','manager']::public.vendor_member_role[]) or public.is_admin()) with check(public.is_vendor_member(account_id,array['owner','manager']::public.vendor_member_role[]) or public.is_admin());
create policy "authenticated reads active requirements" on public.vendor_credential_requirements for select to authenticated using(active or public.is_admin());
create policy "members read applications" on public.vendor_applications for select using(public.is_vendor_member(account_id) or public.is_admin());
create policy "members read application events" on public.vendor_application_events for select using(public.is_vendor_member(public.application_account(application_id)) or public.is_admin());
create policy "members manage evidence metadata" on public.vendor_evidence for all using(public.is_vendor_member(public.application_account(application_id)) or public.is_admin()) with check(public.is_vendor_member(public.application_account(application_id),array['owner','manager','editor']::public.vendor_member_role[]) or public.is_admin());
create policy "members read provider checks" on public.vendor_provider_checks for select using(public.is_vendor_member(public.application_account(application_id)) or public.is_admin());
create policy "members manage listing draft" on public.vendor_listing_drafts for all using(public.is_vendor_member(public.application_account(application_id)) or public.is_admin()) with check(public.is_vendor_member(public.application_account(application_id),array['owner','manager','editor']::public.vendor_member_role[]) or public.is_admin());
create policy "members manage package drafts" on public.vendor_package_drafts for all using(public.is_vendor_member(public.application_account(application_id)) or public.is_admin()) with check(public.is_vendor_member(public.application_account(application_id),array['owner','manager','editor']::public.vendor_member_role[]) or public.is_admin());
create policy "members read inspections" on public.vendor_inspections for select using(public.is_vendor_member(public.application_account(application_id)) or public.is_admin());
create policy "members acknowledge inspections" on public.vendor_inspections for update using(public.is_vendor_member(public.application_account(application_id),array['owner','manager']::public.vendor_member_role[]) or public.is_admin()) with check(public.is_vendor_member(public.application_account(application_id),array['owner','manager']::public.vendor_member_role[]) or public.is_admin());
create policy "members read change requests" on public.vendor_change_requests for select using(public.is_vendor_member(public.application_account(application_id)) or public.is_admin());
create policy "members read notifications" on public.vendor_notifications for select using(recipient_id=auth.uid() or public.is_admin());
create policy "members record redacted funnel" on public.vendor_funnel_events for insert with check(actor_id=auth.uid() and public.is_vendor_member(account_id));
create policy "admins read funnel" on public.vendor_funnel_events for select using(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('vendor-credentials','vendor-credentials',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']),
('vendor-draft-media','vendor-draft-media',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "vendor uploads credentials" on storage.objects for insert to authenticated with check(bucket_id='vendor-credentials' and public.is_vendor_member(((storage.foldername(name))[1])::uuid,array['owner','manager','editor']::public.vendor_member_role[]));
create policy "vendor reads own credentials" on storage.objects for select to authenticated using(bucket_id='vendor-credentials' and public.is_vendor_member(((storage.foldername(name))[1])::uuid));
create policy "admins read vendor credentials" on storage.objects for select to authenticated using(bucket_id='vendor-credentials' and public.is_admin());
create policy "vendor manages draft media" on storage.objects for all to authenticated using(bucket_id='vendor-draft-media' and public.is_vendor_member(((storage.foldername(name))[1])::uuid)) with check(bucket_id='vendor-draft-media' and public.is_vendor_member(((storage.foldername(name))[1])::uuid,array['owner','manager','editor']::public.vendor_member_role[]));
create policy "admins read vendor draft media" on storage.objects for select to authenticated using(bucket_id='vendor-draft-media' and public.is_admin());

grant select,update on public.vendor_accounts to authenticated; grant select on public.vendor_memberships,public.vendor_credential_requirements,public.vendor_applications,public.vendor_application_events,public.vendor_provider_checks,public.vendor_inspections,public.vendor_change_requests,public.vendor_notifications to authenticated;
grant select,insert,update,delete on public.vendor_invitations,public.vendor_evidence,public.vendor_listing_drafts,public.vendor_package_drafts to authenticated;
grant insert,select on public.vendor_funnel_events to authenticated;
grant execute on function public.create_vendor_account(text,public.vendor_category,text,text),public.save_vendor_application(uuid,integer,jsonb,integer),public.submit_vendor_application(uuid,boolean,uuid),public.respond_vendor_change_request(uuid,text),public.invite_vendor_member(uuid,text,public.vendor_member_role),public.accept_vendor_invitation(text),public.propose_vendor_maintenance(uuid,text[],text),public.review_vendor_application(uuid,public.vendor_application_status,text,text[]) to authenticated;
revoke all on function public.expire_vendor_applications() from public,anon,authenticated;
grant execute on function public.expire_vendor_applications() to service_role;
grant all privileges on all tables in schema public to service_role;
