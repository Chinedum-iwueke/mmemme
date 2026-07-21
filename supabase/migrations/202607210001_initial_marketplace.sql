create extension if not exists pgcrypto;

create type public.vendor_category as enum ('venue', 'caterer');
create type public.booking_status as enum ('requested','operations_review','quote_ready','accepted_awaiting_payment','confirmed','service_due','fulfilled','completed','declined','expired','cancelled','disputed');
create type public.payment_status as enum ('initiated','pending','succeeded','failed','partially_refunded','refunded','charged_back');
create type public.payout_status as enum ('held','eligible','processing','paid','failed','reversed');
create type public.verification_status as enum ('draft','in_review','approved','expired','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wedding_briefs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  wedding_date date not null,
  area text not null,
  guest_count integer not null check (guest_count between 10 and 5000),
  budget_min_kobo bigint not null check (budget_min_kobo >= 0),
  budget_max_kobo bigint not null check (budget_max_kobo >= budget_min_kobo),
  priorities public.vendor_category[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.vendor_category not null,
  area text not null,
  description text not null default '',
  capacity_min integer,
  capacity_max integer,
  price_from_kobo bigint check (price_from_kobo >= 0),
  verification_status public.verification_status not null default 'draft',
  published boolean not null default false,
  paystack_subaccount_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (capacity_min is null or capacity_max is null or capacity_max >= capacity_min),
  check (published = false or verification_status = 'approved')
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  status public.verification_status not null default 'draft',
  identity_checked boolean not null default false,
  contact_checked boolean not null default false,
  bank_name_checked boolean not null default false,
  authority_checked boolean not null default false,
  portfolio_checked boolean not null default false,
  references_checked boolean not null default false,
  physical_site_checked boolean not null default false,
  checked_by uuid references public.profiles(id),
  checked_at timestamptz,
  expires_at timestamptz,
  public_note text not null default '',
  private_note text not null default '',
  created_at timestamptz not null default now()
);

create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  description text not null,
  price_from_kobo bigint not null check (price_from_kobo > 0),
  inclusions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  correlation_id uuid not null default gen_random_uuid() unique,
  customer_id uuid not null references public.profiles(id),
  wedding_brief_id uuid not null references public.wedding_briefs(id),
  vendor_id uuid not null references public.vendors(id),
  package_id uuid references public.service_packages(id),
  event_date date not null,
  requirements text not null check (char_length(requirements) between 20 and 2000),
  status public.booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_active_booking_per_vendor_date on public.bookings(vendor_id, event_date)
  where status in ('confirmed','service_due','fulfilled');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  revision integer not null default 1,
  total_amount_kobo bigint not null check (total_amount_kobo > 0),
  deposit_amount_kobo bigint not null check (deposit_amount_kobo > 0 and deposit_amount_kobo <= total_amount_kobo),
  platform_fee_bps integer not null default 750 check (platform_fee_bps between 0 and 10000),
  cancellation_template_version text not null,
  cancellation_summary text not null,
  terms_version text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (booking_id, revision)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  quote_id uuid not null references public.quotes(id),
  customer_id uuid not null references public.profiles(id),
  provider text not null check (provider = 'paystack'),
  provider_reference text not null unique,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status public.payment_status not null default 'initiated',
  paid_at timestamptz,
  raw_provider_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  entry_type text not null check (entry_type in ('gross','gateway_fee','platform_fee','vendor_net','refund','chargeback','payout')),
  amount_kobo bigint not null,
  provider_reference text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  payment_id uuid not null references public.payments(id),
  vendor_id uuid not null references public.vendors(id),
  amount_kobo bigint not null check (amount_kobo > 0),
  status public.payout_status not null default 'held',
  provider_reference text unique,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  opened_by uuid not null references public.profiles(id),
  reason text not null,
  status text not null default 'open' check (status in ('open','investigating','resolved_customer','resolved_vendor','closed')),
  resolution_note text,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  customer_id uuid not null references public.profiles(id),
  vendor_id uuid not null references public.vendors(id),
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 20 and 2000),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.state_transition_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('booking','payment','payout','verification')),
  entity_id uuid not null,
  actor_id uuid references public.profiles(id),
  previous_state text,
  new_state text not null,
  reason text not null,
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  metadata jsonb not null default '{}',
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);

create table public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'paystack'),
  event_key text not null unique,
  event_type text not null,
  payload_sha256 text not null,
  processed_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.prevent_update_delete() returns trigger language plpgsql as $$ begin
  raise exception '% is append-only', tg_table_name;
end $$;
create trigger immutable_ledger before update or delete on public.ledger_entries for each row execute function public.prevent_update_delete();
create trigger immutable_transitions before update or delete on public.state_transition_events for each row execute function public.prevent_update_delete();
create trigger immutable_admin_audit before update or delete on public.admin_audit_events for each row execute function public.prevent_update_delete();
create trigger immutable_provider_events before update or delete on public.provider_events for each row execute function public.prevent_update_delete();

create or replace function public.valid_booking_transition(old_state public.booking_status, new_state public.booking_status) returns boolean language sql immutable as $$
  select (old_state, new_state) in (
    ('requested','operations_review'),('requested','declined'),('requested','cancelled'),
    ('operations_review','quote_ready'),('operations_review','declined'),('operations_review','cancelled'),
    ('quote_ready','accepted_awaiting_payment'),('quote_ready','expired'),('quote_ready','cancelled'),
    ('accepted_awaiting_payment','confirmed'),('accepted_awaiting_payment','expired'),('accepted_awaiting_payment','cancelled'),
    ('confirmed','service_due'),('confirmed','cancelled'),('confirmed','disputed'),
    ('service_due','fulfilled'),('service_due','cancelled'),('service_due','disputed'),
    ('fulfilled','completed'),('fulfilled','disputed'),
    ('disputed','fulfilled'),('disputed','completed'),('disputed','cancelled')
  )
$$;
create or replace function public.enforce_booking_transition() returns trigger language plpgsql as $$ begin
  if old.status <> new.status and not public.valid_booking_transition(old.status, new.status) then
    raise exception 'invalid booking transition: % -> %', old.status, new.status;
  end if;
  new.updated_at = now(); return new;
end $$;
create trigger booking_transition_guard before update on public.bookings for each row execute function public.enforce_booking_transition();

alter table public.profiles enable row level security;
alter table public.wedding_briefs enable row level security;
alter table public.vendors enable row level security;
alter table public.verification_records enable row level security;
alter table public.service_packages enable row level security;
alter table public.bookings enable row level security;
alter table public.quotes enable row level security;
alter table public.payments enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payouts enable row level security;
alter table public.support_messages enable row level security;
alter table public.disputes enable row level security;
alter table public.reviews enable row level security;
alter table public.state_transition_events enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.provider_events enable row level security;

create policy "public reads published vendors" on public.vendors for select using (published or public.is_admin());
create policy "public reads active packages" on public.service_packages for select using (active and exists (select 1 from public.vendors v where v.id = vendor_id and v.published) or public.is_admin());
create policy "public reads approved verification disclosure" on public.verification_records for select using (status = 'approved' or public.is_admin());
create policy "customer owns profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "customer reads own briefs" on public.wedding_briefs for select using (customer_id = auth.uid() or public.is_admin());
create policy "customer creates own briefs" on public.wedding_briefs for insert with check (customer_id = auth.uid());
create policy "customer updates own briefs" on public.wedding_briefs for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "customer reads own bookings" on public.bookings for select using (customer_id = auth.uid() or public.is_admin());
create policy "customer creates own booking requests" on public.bookings for insert with check (customer_id = auth.uid() and status = 'requested');
create policy "customer reads own quotes" on public.quotes for select using (exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()) or public.is_admin());
create policy "customer reads own payments" on public.payments for select using (customer_id = auth.uid() or public.is_admin());
create policy "booking participants read messages" on public.support_messages for select using (author_id = auth.uid() or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()) or public.is_admin());
create policy "customer creates own support messages" on public.support_messages for insert with check (author_id = auth.uid() and exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()));
create policy "customer reads own disputes" on public.disputes for select using (opened_by = auth.uid() or public.is_admin());
create policy "customer opens own booking dispute" on public.disputes for insert with check (opened_by = auth.uid() and exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()));
create policy "public reads published reviews" on public.reviews for select using (published or customer_id = auth.uid() or public.is_admin());
create policy "customer reviews completed booking" on public.reviews for insert with check (customer_id = auth.uid() and exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'));

create policy "admins manage vendors" on public.vendors for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage verification" on public.verification_records for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage packages" on public.service_packages for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage bookings" on public.bookings for update using (public.is_admin()) with check (public.is_admin());
create policy "admins manage quotes" on public.quotes for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read payouts" on public.payouts for select using (public.is_admin());
create policy "admins read ledger" on public.ledger_entries for select using (public.is_admin());
create policy "admins manage reviews" on public.reviews for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit" on public.admin_audit_events for select using (public.is_admin());
create policy "admins read transitions" on public.state_transition_events for select using (public.is_admin());
