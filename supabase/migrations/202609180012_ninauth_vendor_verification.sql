create table public.vendor_identity_sessions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.vendor_applications(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  provider text not null default 'ninauth',
  state_hash text not null unique,
  nonce_hash text not null,
  verifier_ciphertext text not null,
  verifier_iv text not null,
  consent_version text not null,
  consent_purpose text not null,
  status text not null default 'pending' check(status in ('pending','processing','completed','failed','expired')),
  provider_request_id text,
  failure_code text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(expires_at <= created_at + interval '15 minutes'),
  check(consumed_at is null or consumed_at >= created_at)
);

create index vendor_identity_sessions_application_idx
  on public.vendor_identity_sessions(application_id, created_at desc);

alter table public.vendor_identity_sessions enable row level security;

-- Deliberately no client policy. Only service-role Edge Functions may read the
-- short-lived PKCE material or mutate provider callback state.
revoke all on public.vendor_identity_sessions from anon, authenticated;

create policy "members read safe identity session status"
  on public.vendor_identity_sessions for select to authenticated
  using(false);

comment on table public.vendor_identity_sessions is
  'Server-only, short-lived NINAuth OAuth/PKCE state. Never stores a NIN or identity profile.';
