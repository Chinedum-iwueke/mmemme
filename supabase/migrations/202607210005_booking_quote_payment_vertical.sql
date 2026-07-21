alter table public.bookings add column if not exists client_request_id uuid;
alter table public.bookings add column if not exists guest_count integer check (guest_count between 10 and 5000);
alter table public.bookings add column if not exists claimed_by uuid references public.profiles(id);
create unique index if not exists booking_request_idempotency on public.bookings(customer_id,client_request_id) where client_request_id is not null;

alter table public.quotes add column if not exists package_name_snapshot text not null default '';
alter table public.quotes add column if not exists inclusions text[] not null default '{}';
alter table public.quotes add column if not exists exclusions text[] not null default '{}';
alter table public.quotes add column if not exists payment_schedule text not null default '';
alter table public.quotes add column if not exists availability_confirmed_at timestamptz;
alter table public.payments add column if not exists authorization_url text;
create unique index if not exists one_open_payment_per_quote on public.payments(quote_id) where status in ('initiated','pending');

create table if not exists public.booking_operations_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  note_type text not null check (note_type in ('claim','vendor_contact','decline','quote','payment_exception')),
  body text not null check (char_length(body) between 2 and 2000),
  created_at timestamptz not null default now()
);
alter table public.booking_operations_notes enable row level security;
create policy "admins manage booking operations notes" on public.booking_operations_notes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customer creates own booking requests" on public.bookings;

create or replace function public.submit_booking_request(
  p_vendor_id uuid, p_package_id uuid, p_wedding_brief_id uuid,
  p_requirements text, p_guest_count integer, p_client_request_id uuid
) returns public.bookings language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_brief public.wedding_briefs; v_vendor public.vendors; v_booking public.bookings;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select * into v_booking from public.bookings where customer_id=v_user and client_request_id=p_client_request_id;
  if found then return v_booking; end if;
  select * into v_brief from public.wedding_briefs where id=p_wedding_brief_id and customer_id=v_user;
  if not found then raise exception 'wedding brief not found'; end if;
  select * into v_vendor from public.vendors where id=p_vendor_id and published and verification_status='approved';
  if not found then raise exception 'vendor is unavailable'; end if;
  if p_package_id is not null and not exists(select 1 from public.service_packages where id=p_package_id and vendor_id=p_vendor_id and active) then raise exception 'package is unavailable'; end if;
  if v_brief.wedding_date <= current_date then raise exception 'event date must be in the future'; end if;
  if p_guest_count < 10 or p_guest_count > 5000 or (v_vendor.capacity_max is not null and p_guest_count > v_vendor.capacity_max) then raise exception 'guest count is outside vendor capacity'; end if;
  if char_length(trim(p_requirements)) < 20 or char_length(trim(p_requirements)) > 2000 then raise exception 'requirements must be 20 to 2000 characters'; end if;
  insert into public.bookings(customer_id,wedding_brief_id,vendor_id,package_id,event_date,guest_count,requirements,client_request_id)
  values(v_user,p_wedding_brief_id,p_vendor_id,p_package_id,v_brief.wedding_date,p_guest_count,trim(p_requirements),p_client_request_id)
  returning * into v_booking;
  insert into public.state_transition_events(entity_type,entity_id,actor_id,previous_state,new_state,reason,correlation_id)
  values('booking',v_booking.id,v_user,null,'requested','Customer submitted booking request',v_booking.correlation_id);
  return v_booking;
exception when unique_violation then
  select * into v_booking from public.bookings where customer_id=v_user and client_request_id=p_client_request_id;
  return v_booking;
end $$;
grant execute on function public.submit_booking_request(uuid,uuid,uuid,text,integer,uuid) to authenticated;

create or replace function public.accept_quote(p_booking_id uuid,p_quote_id uuid) returns public.bookings
language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_booking public.bookings; v_quote public.quotes;
begin
  select * into v_booking from public.bookings where id=p_booking_id and customer_id=v_user for update;
  if not found then raise exception 'booking not found'; end if;
  if v_booking.status='accepted_awaiting_payment' then return v_booking; end if;
  if v_booking.status<>'quote_ready' then raise exception 'booking is not ready for acceptance'; end if;
  select * into v_quote from public.quotes where id=p_quote_id and booking_id=p_booking_id;
  if not found or v_quote.expires_at<=now() then raise exception 'quote has expired'; end if;
  if v_quote.revision<>(select max(revision) from public.quotes where booking_id=p_booking_id) then raise exception 'quote has been superseded'; end if;
  update public.quotes set accepted_at=now() where id=p_quote_id and accepted_at is null;
  perform set_config('app.transition_reason','Customer accepted quote and terms',true);
  update public.bookings set status='accepted_awaiting_payment' where id=p_booking_id returning * into v_booking;
  return v_booking;
end $$;
grant execute on function public.accept_quote(uuid,uuid) to authenticated;

create policy "customer reads own booking transitions" on public.state_transition_events for select using (
  entity_type='booking' and exists(select 1 from public.bookings b where b.id=entity_id and b.customer_id=auth.uid()) or public.is_admin()
);
create policy "customer reads own payouts" on public.payouts for select using (
  exists(select 1 from public.bookings b where b.id=booking_id and b.customer_id=auth.uid()) or public.is_admin()
);

grant usage on schema public to anon,authenticated,service_role;
grant select on public.vendors,public.service_packages,public.reviews,public.vendor_verification_disclosures to anon;
grant select on all tables in schema public to authenticated;
grant insert,update on public.profiles,public.wedding_briefs to authenticated;
grant insert on public.support_messages,public.disputes,public.reviews to authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to authenticated,service_role;
grant execute on function public.submit_booking_request(uuid,uuid,uuid,text,integer,uuid) to authenticated;
grant execute on function public.accept_quote(uuid,uuid) to authenticated;
