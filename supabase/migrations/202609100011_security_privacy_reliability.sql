create type public.privacy_request_kind as enum ('export','deletion');
create type public.privacy_request_status as enum ('requested','in_review','completed','rejected');
create type public.incident_severity as enum ('sev1','sev2','sev3');

alter table public.profiles add column privacy_deleted_at timestamptz;

create table public.consent_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  purpose text not null check(purpose in ('terms','privacy','analytics','vendor_verification')),
  policy_version text not null, granted boolean not null, source text not null check(source in ('web','mobile','vendor','operations')),
  correlation_id uuid not null default gen_random_uuid(), recorded_at timestamptz not null default now()
);
create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  kind public.privacy_request_kind not null, status public.privacy_request_status not null default 'requested',
  reason text not null default '', assigned_to uuid references public.profiles(id),
  requested_at timestamptz not null default now(), due_at timestamptz not null default now()+interval '30 days',
  completed_at timestamptz, completed_by uuid references public.profiles(id), rejection_reason text,
  export_payload jsonb, correlation_id uuid not null default gen_random_uuid()
);
create unique index one_open_privacy_request on public.privacy_requests(user_id,kind) where status in('requested','in_review');
create table public.data_retention_rules (
  data_class text primary key, retention_days integer check(retention_days is null or retention_days>0),
  action text not null check(action in ('delete','anonymize','retain_legal')), legal_basis text not null,
  owner_role text not null, reviewed_at date not null, next_review_at date not null
);
insert into public.data_retention_rules values
 ('customer_drafts',30,'delete','User convenience only','operations',current_date,current_date+180),
 ('notifications',365,'delete','Service delivery evidence','operations',current_date,current_date+180),
 ('product_events',180,'anonymize','Product improvement with minimized fields','owner',current_date,current_date+180),
 ('vendor_credentials',730,'delete','Verification and dispute window','verification',current_date,current_date+180),
 ('financial_records',null,'retain_legal','Accounting, tax, refund and chargeback obligations','finance',current_date,current_date+180),
 ('audit_events',2555,'retain_legal','Security and financial accountability','owner',current_date,current_date+180);

create table public.rate_limit_counters (
  scope text not null, subject_hash text not null, window_started_at timestamptz not null,
  request_count integer not null default 1, primary key(scope,subject_hash,window_started_at)
);
create table public.security_incidents (
  id uuid primary key default gen_random_uuid(), severity public.incident_severity not null,
  domain text not null check(domain in ('auth','authorization','booking','funds','delivery','privacy','availability')),
  status text not null default 'open' check(status in ('open','contained','resolved')),
  title text not null, correlation_id uuid not null, primary_owner uuid references public.profiles(id),
  backup_owner uuid references public.profiles(id), detected_at timestamptz not null default now(),
  acknowledged_at timestamptz, resolved_at timestamptz, timeline jsonb not null default '[]',
  resolution text
);
create table public.restore_rehearsals (
  id uuid primary key default gen_random_uuid(), environment text not null check(environment<>'production'),
  backup_started_at timestamptz not null, restore_completed_at timestamptz not null,
  rpo_minutes integer not null, rto_minutes integer not null,
  database_checksum text not null, storage_manifest_checksum text not null,
  reconciliation_status text not null check(reconciliation_status in ('balanced','exceptions')),
  evidence_sha256 text not null, recorded_by uuid references public.profiles(id), created_at timestamptz not null default now()
);

alter table public.consent_records enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.data_retention_rules enable row level security;
alter table public.rate_limit_counters enable row level security;
alter table public.security_incidents enable row level security;
alter table public.restore_rehearsals enable row level security;
create policy "users read own consent" on public.consent_records for select using(user_id=auth.uid() or public.admin_has_capability('audit'));
create policy "users record own consent" on public.consent_records for insert with check(user_id=auth.uid());
create policy "users read own privacy requests" on public.privacy_requests for select using(user_id=auth.uid() or public.admin_has_capability('audit'));
create policy "privacy operators read retention" on public.data_retention_rules for select using(public.admin_has_capability('audit'));
create policy "owners read incidents" on public.security_incidents for select using(public.admin_has_capability('audit'));
create policy "owners read restore evidence" on public.restore_rehearsals for select using(public.admin_has_capability('audit'));

create or replace function public.consume_rate_limit(p_scope text,p_subject text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_start timestamptz:=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds); v_count integer;
begin
 if p_limit<1 or p_window_seconds<1 or char_length(p_subject)<3 then return false; end if;
 insert into public.rate_limit_counters(scope,subject_hash,window_started_at,request_count)
 values(p_scope,encode(extensions.digest(p_subject,'sha256'),'hex'),v_start,1)
 on conflict(scope,subject_hash,window_started_at) do update set request_count=public.rate_limit_counters.request_count+1
 returning request_count into v_count;
 return v_count<=p_limit;
end $$;

create or replace function public.record_consent(p_purpose text,p_policy_version text,p_granted boolean,p_source text)
returns public.consent_records language plpgsql security definer set search_path=public as $$
declare v_row public.consent_records;
begin
 if auth.uid() is null then raise exception 'MMEMME_AUTH_REQUIRED'; end if;
 insert into public.consent_records(user_id,purpose,policy_version,granted,source)
 values(auth.uid(),p_purpose,left(trim(p_policy_version),80),p_granted,p_source) returning * into v_row;
 return v_row;
end $$;

create or replace function public.request_account_data(p_kind public.privacy_request_kind,p_reason text default '')
returns public.privacy_requests language plpgsql security definer set search_path=public as $$
declare v_row public.privacy_requests;
begin
 if auth.uid() is null then raise exception 'MMEMME_AUTH_REQUIRED'; end if;
 if not public.consume_rate_limit('privacy_request',auth.uid()::text,3,86400) then raise exception 'MMEMME_RATE_LIMITED'; end if;
 insert into public.privacy_requests(user_id,kind,reason) values(auth.uid(),p_kind,left(trim(p_reason),500)) returning * into v_row;
 return v_row;
exception when unique_violation then raise exception 'MMEMME_REQUEST_EXISTS';
end $$;

create or replace function public.build_account_export(p_user_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select case when p_user_id=auth.uid() or public.admin_has_capability('export') then jsonb_build_object(
  'generatedAt',now(),'profile',(select to_jsonb(p)-'is_admin' from public.profiles p where id=p_user_id),
  'briefs',coalesce((select jsonb_agg(to_jsonb(x)) from public.wedding_briefs x where customer_id=p_user_id),'[]'),
  'bookings',coalesce((select jsonb_agg(to_jsonb(x)) from public.bookings x where customer_id=p_user_id),'[]'),
  'payments',coalesce((select jsonb_agg(to_jsonb(x)-'raw_provider_status') from public.payments x where customer_id=p_user_id),'[]'),
  'support',coalesce((select jsonb_agg(to_jsonb(x)) from public.support_messages x join public.bookings b on b.id=x.booking_id where b.customer_id=p_user_id),'[]'),
  'consents',coalesce((select jsonb_agg(to_jsonb(x)) from public.consent_records x where user_id=p_user_id),'[]')
 ) else null end
$$;

create or replace function public.complete_privacy_request(p_request_id uuid,p_approve boolean,p_reason text)
returns public.privacy_requests language plpgsql security definer set search_path=public as $$
declare v_admin uuid:=auth.uid(); v_row public.privacy_requests;
begin
 if not public.admin_has_capability('audit') then raise exception 'MMEMME_FORBIDDEN'; end if;
 if char_length(trim(p_reason))<10 then raise exception 'MMEMME_REASON_REQUIRED'; end if;
 select * into v_row from public.privacy_requests where id=p_request_id and status in('requested','in_review') for update;
 if not found then raise exception 'MMEMME_STALE_STATE'; end if;
 if not p_approve then
  update public.privacy_requests set status='rejected',rejection_reason=trim(p_reason),completed_at=now(),completed_by=v_admin where id=p_request_id returning * into v_row;
 elsif v_row.kind='export' then
  update public.privacy_requests set status='completed',export_payload=public.build_account_export(v_row.user_id),completed_at=now(),completed_by=v_admin where id=p_request_id returning * into v_row;
 else
  delete from public.customer_drafts where customer_id=v_row.user_id;
  delete from public.shortlist_items where customer_id=v_row.user_id;
  delete from public.push_tokens where customer_id=v_row.user_id;
  delete from public.notification_preferences where customer_id=v_row.user_id;
  update public.product_events set customer_id=null,properties='{}' where customer_id=v_row.user_id;
  update public.profiles set full_name='Deleted customer',phone=null,email=null,privacy_deleted_at=now(),updated_at=now() where id=v_row.user_id;
  update auth.users set banned_until='infinity',raw_user_meta_data='{}' where id=v_row.user_id;
  update public.privacy_requests set status='completed',reason='',completed_at=now(),completed_by=v_admin where id=p_request_id returning * into v_row;
 end if;
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,correlation_id)
 values(v_admin,'privacy.'||v_row.kind||'.'||v_row.status,'privacy_request',v_row.id,trim(p_reason),v_row.correlation_id);
 return v_row;
end $$;

create or replace function public.apply_retention_schedule(p_now timestamptz default now()) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_drafts integer; v_notifications integer; v_events integer; v_limits integer;
begin
 delete from public.customer_drafts where updated_at<p_now-interval '30 days'; get diagnostics v_drafts=row_count;
 delete from public.customer_notifications where created_at<p_now-interval '365 days'; get diagnostics v_notifications=row_count;
 update public.product_events set customer_id=null,properties='{}' where created_at<p_now-interval '180 days' and customer_id is not null; get diagnostics v_events=row_count;
 delete from public.rate_limit_counters where window_started_at<p_now-interval '2 days'; get diagnostics v_limits=row_count;
 return jsonb_build_object('draftsDeleted',v_drafts,'notificationsDeleted',v_notifications,'eventsAnonymized',v_events,'rateLimitsDeleted',v_limits);
end $$;

create or replace function public.open_security_incident(p_severity public.incident_severity,p_domain text,p_title text,p_correlation_id uuid,p_primary uuid,p_backup uuid)
returns public.security_incidents language plpgsql security definer set search_path=public as $$
declare v_row public.security_incidents;
begin
 if auth.role()<>'service_role' and not public.admin_has_capability('audit') then raise exception 'MMEMME_FORBIDDEN'; end if;
 insert into public.security_incidents(severity,domain,title,correlation_id,primary_owner,backup_owner,timeline)
 values(p_severity,p_domain,left(trim(p_title),200),p_correlation_id,p_primary,p_backup,jsonb_build_array(jsonb_build_object('at',now(),'event','opened','actor',auth.uid()))) returning * into v_row;
 return v_row;
end $$;

create or replace function public.prevent_security_record_mutation() returns trigger language plpgsql as $$ begin raise exception 'MMEMME_IMMUTABLE_RECORD'; end $$;
create or replace function public.prevent_deleted_profile_reactivation() returns trigger language plpgsql as $$
begin
 if old.privacy_deleted_at is not null and not public.admin_has_capability('audit') and coalesce(auth.role(),'authenticated')<>'service_role' then raise exception 'MMEMME_ACCOUNT_DELETED'; end if;
 return new;
end $$;
create trigger consent_records_immutable before update or delete on public.consent_records for each row execute function public.prevent_security_record_mutation();
create trigger restore_rehearsals_immutable before update or delete on public.restore_rehearsals for each row execute function public.prevent_security_record_mutation();
create trigger deleted_profiles_stay_deleted before update on public.profiles for each row execute function public.prevent_deleted_profile_reactivation();

grant select,insert on public.consent_records to authenticated;
grant select on public.privacy_requests,public.data_retention_rules,public.security_incidents,public.restore_rehearsals to authenticated;
grant all privileges on public.consent_records,public.privacy_requests,public.data_retention_rules,public.rate_limit_counters,public.security_incidents,public.restore_rehearsals to service_role;
grant execute on function public.record_consent(text,text,boolean,text),public.request_account_data(public.privacy_request_kind,text),public.build_account_export(uuid),public.complete_privacy_request(uuid,boolean,text),public.open_security_incident(public.incident_severity,text,text,uuid,uuid,uuid) to authenticated;
revoke all on function public.consume_rate_limit(text,text,integer,integer),public.apply_retention_schedule(timestamptz) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer),public.apply_retention_schedule(timestamptz) to service_role;

-- Evidence files cannot be overwritten: updates are intentionally absent. Deletes are operator-only.
drop policy if exists "vendor manages draft media" on storage.objects;
create policy "vendor inserts draft media" on storage.objects for insert to authenticated with check(bucket_id='vendor-draft-media' and public.is_vendor_member(((storage.foldername(name))[1])::uuid,array['owner','manager','editor']::public.vendor_member_role[]));
create policy "vendor reads draft media" on storage.objects for select to authenticated using(bucket_id='vendor-draft-media' and public.is_vendor_member(((storage.foldername(name))[1])::uuid));
create policy "admins delete draft media" on storage.objects for delete to authenticated using(bucket_id='vendor-draft-media' and public.admin_has_capability('vendors'));
