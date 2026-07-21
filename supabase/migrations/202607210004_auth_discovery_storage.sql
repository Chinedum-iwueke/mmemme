create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,full_name,phone,email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'MMEMME customer'),
    new.phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger create_profile_after_signup after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.prevent_profile_privilege_escalation() returns trigger language plpgsql as $$ begin
  if new.is_admin <> old.is_admin and not public.is_admin() then
    raise exception 'admin privileges cannot be changed by this user';
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger protect_profile_privileges before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

create policy "customer updates own profile" on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "public reads approved verification disclosure" on public.verification_records;
create policy "admins read verification records" on public.verification_records for select using (public.is_admin());

create or replace view public.vendor_verification_disclosures
with (security_invoker = false) as
select
  vr.vendor_id,
  vr.identity_checked,
  vr.contact_checked,
  vr.bank_name_checked,
  vr.authority_checked,
  vr.portfolio_checked,
  vr.references_checked,
  vr.physical_site_checked,
  vr.checked_at,
  vr.expires_at,
  vr.public_note
from public.verification_records vr
join public.vendors v on v.id = vr.vendor_id
where vr.status = 'approved' and v.published = true;
revoke all on public.vendor_verification_disclosures from public;
grant select on public.vendor_verification_disclosures to anon, authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('vendor-portfolios','vendor-portfolios',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
  ('verification-evidence','verification-evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "public reads vendor portfolios" on storage.objects for select
using (bucket_id = 'vendor-portfolios');
create policy "admins manage vendor portfolios" on storage.objects for all
using (bucket_id = 'vendor-portfolios' and public.is_admin())
with check (bucket_id = 'vendor-portfolios' and public.is_admin());
create policy "admins manage verification evidence" on storage.objects for all
using (bucket_id = 'verification-evidence' and public.is_admin())
with check (bucket_id = 'verification-evidence' and public.is_admin());

alter table public.vendors add column if not exists hero_image_path text;
alter table public.vendors add column if not exists verification_expires_at timestamptz;
alter table public.service_packages add column if not exists guest_min integer check (guest_min is null or guest_min > 0);
alter table public.service_packages add column if not exists guest_max integer check (guest_max is null or guest_max >= guest_min);
create or replace function public.validate_vendor_publication() returns trigger language plpgsql as $$ begin
  if new.published and (
    new.verification_status <> 'approved' or new.verification_expires_at is null or new.verification_expires_at <= now()
    or char_length(trim(new.name)) < 2 or char_length(trim(new.area)) < 2 or char_length(trim(new.description)) < 20
    or new.capacity_min is null or new.capacity_max is null or new.price_from_kobo is null
    or not exists (select 1 from public.service_packages p where p.vendor_id = new.id and p.active)
    or not exists (select 1 from public.verification_records r where r.vendor_id = new.id and r.status = 'approved'
      and r.identity_checked and r.contact_checked and r.bank_name_checked and r.authority_checked
      and r.portfolio_checked and r.references_checked and r.physical_site_checked and r.expires_at > now())
  ) then raise exception 'vendor does not meet publication requirements'; end if;
  return new;
end $$;
create trigger enforce_vendor_publication before insert or update on public.vendors
for each row execute function public.validate_vendor_publication();
create index if not exists published_vendor_discovery on public.vendors(category,area,price_from_kobo)
where published = true and verification_status = 'approved';
