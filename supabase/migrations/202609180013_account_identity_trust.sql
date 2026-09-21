create type public.account_identity_status as enum
  ('not_started','in_progress','manual_review','verified','failed','expired');

create table public.account_identity_verifications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status public.account_identity_status not null default 'not_started',
  email_verified_at timestamptz,
  national_identity_verified_at timestamptz,
  national_identity_expires_at timestamptz,
  document_verified_at timestamptz,
  selfie_liveness_verified_at timestamptz,
  face_match_verified_at timestamptz,
  provider text,
  provider_reference text,
  confidence_band text check(confidence_band is null or confidence_band in ('high','medium','low')),
  checked_at timestamptz,
  expires_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(status <> 'verified' or (
    national_identity_verified_at is not null and
    national_identity_expires_at is not null and
    document_verified_at is not null and
    selfie_liveness_verified_at is not null and
    face_match_verified_at is not null and
    expires_at > checked_at
  ))
);

alter table public.vendor_identity_sessions
  alter column application_id drop not null,
  add column subject_user_id uuid references public.profiles(id) on delete cascade;
update public.vendor_identity_sessions set subject_user_id=requested_by where subject_user_id is null;
alter table public.vendor_identity_sessions alter column subject_user_id set not null;
alter table public.vendor_identity_sessions add constraint vendor_identity_session_context
  check(application_id is null or subject_user_id=requested_by);

create table public.identity_proofing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_session_id text unique,
  status text not null default 'pending'
    check(status in ('pending','processing','passed','failed','manual_review','expired')),
  consent_version text not null,
  consented_at timestamptz not null,
  purpose text not null,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(expires_at <= created_at + interval '1 hour')
);

create table public.identity_proofing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  session_id uuid not null references public.identity_proofing_sessions(id) on delete cascade,
  payload_sha256 text not null,
  received_at timestamptz not null default now(),
  unique(provider,provider_event_id)
);

alter table public.account_identity_verifications enable row level security;
alter table public.identity_proofing_sessions enable row level security;
alter table public.identity_proofing_events enable row level security;

create policy "users read own identity status" on public.account_identity_verifications
  for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy "booking vendors read customer trust" on public.account_identity_verifications
  for select to authenticated using(exists(
    select 1 from public.bookings b
    join public.vendor_applications a on a.vendor_id=b.vendor_id
    where b.customer_id=account_identity_verifications.user_id
      and public.is_vendor_member(a.account_id)
  ));
create policy "users read own proofing sessions" on public.identity_proofing_sessions
  for select to authenticated using(user_id=auth.uid() or public.is_admin());

revoke all on public.account_identity_verifications,public.identity_proofing_events from anon,authenticated;
grant select(user_id,status,email_verified_at,national_identity_verified_at,
  national_identity_expires_at,document_verified_at,selfie_liveness_verified_at,
  face_match_verified_at,checked_at,expires_at)
  on public.account_identity_verifications to authenticated;
grant select on public.identity_proofing_sessions to authenticated;

create or replace function public.account_has_verified_identity(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.account_identity_verifications
    where user_id=p_user_id and status='verified' and expires_at>now()
  )
$$;
revoke all on function public.account_has_verified_identity(uuid) from public,anon,authenticated;
grant execute on function public.account_has_verified_identity(uuid) to service_role;

comment on table public.account_identity_verifications is
  'Minimal verification outcomes only. No identity document, selfie, facial template, NIN or provider payload.';
comment on table public.identity_proofing_sessions is
  'Hosted document/liveness provider sessions. Capture occurs outside MMEMME storage.';

insert into public.data_retention_rules values
  ('identity_transaction_metadata',90,'delete','Short-lived verification and consent transaction evidence','privacy',current_date,current_date+90)
on conflict(data_class) do update set retention_days=excluded.retention_days,
  action=excluded.action,legal_basis=excluded.legal_basis,owner_role=excluded.owner_role,
  reviewed_at=excluded.reviewed_at,next_review_at=excluded.next_review_at;

create or replace function public.apply_retention_schedule(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_drafts integer; v_notifications integer; v_events integer; v_limits integer; v_identity integer; v_nin integer;
begin
 delete from public.customer_drafts where updated_at<p_now-interval '30 days'; get diagnostics v_drafts=row_count;
 delete from public.customer_notifications where created_at<p_now-interval '365 days'; get diagnostics v_notifications=row_count;
 update public.product_events set customer_id=null,properties='{}' where created_at<p_now-interval '180 days' and customer_id is not null; get diagnostics v_events=row_count;
 delete from public.rate_limit_counters where window_started_at<p_now-interval '2 days'; get diagnostics v_limits=row_count;
 delete from public.identity_proofing_sessions where created_at<p_now-interval '90 days'; get diagnostics v_identity=row_count;
 delete from public.vendor_identity_sessions where created_at<p_now-interval '90 days'; get diagnostics v_nin=row_count;
 return jsonb_build_object('draftsDeleted',v_drafts,'notificationsDeleted',v_notifications,'eventsAnonymized',v_events,'rateLimitsDeleted',v_limits,'proofingSessionsDeleted',v_identity,'ninSessionsDeleted',v_nin);
end $$;

create or replace function public.delete_identity_trust_on_privacy_deletion()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.privacy_deleted_at is null and new.privacy_deleted_at is not null then
   delete from public.account_identity_verifications where user_id=new.id;
   delete from public.identity_proofing_sessions where user_id=new.id;
   delete from public.vendor_identity_sessions where subject_user_id=new.id;
 end if;
 return new;
end $$;
create trigger delete_identity_trust_after_privacy_deletion
after update of privacy_deleted_at on public.profiles for each row
execute function public.delete_identity_trust_on_privacy_deletion();
