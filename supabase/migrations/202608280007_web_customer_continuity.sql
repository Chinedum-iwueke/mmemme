-- Milestone 11: durable anonymous-to-authenticated web state and platform-neutral routing.
create table public.customer_drafts (
  customer_id uuid primary key references public.profiles(id) on delete cascade,
  brief jsonb not null default '{}',
  revision integer not null default 1 check (revision > 0),
  source_device_id text not null check (char_length(source_device_id) between 8 and 100),
  updated_at timestamptz not null default now()
);

create table public.shortlist_items (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, vendor_id)
);

alter table public.customer_notifications add column if not exists web_path text;
update public.customer_notifications set web_path='/bookings/'||booking_id where booking_id is not null and web_path is null;

alter table public.customer_drafts enable row level security;
alter table public.shortlist_items enable row level security;
create policy "customer owns cross device draft" on public.customer_drafts for all
  using(customer_id=auth.uid()) with check(customer_id=auth.uid());
create policy "customer owns shortlist" on public.shortlist_items for all
  using(customer_id=auth.uid()) with check(customer_id=auth.uid());

grant select,insert,update,delete on public.customer_drafts,public.shortlist_items to authenticated;

create or replace function public.save_customer_draft(
  p_brief jsonb, p_expected_revision integer, p_source_device_id text
) returns public.customer_drafts language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_row public.customer_drafts;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if jsonb_typeof(p_brief)<>'object' then raise exception 'invalid draft'; end if;
  select * into v_row from public.customer_drafts where customer_id=v_user for update;
  if not found then
    insert into public.customer_drafts(customer_id,brief,source_device_id)
    values(v_user,p_brief,p_source_device_id) returning * into v_row;
  elsif v_row.revision<>p_expected_revision then
    raise exception 'draft conflict';
  else
    update public.customer_drafts set brief=p_brief,revision=revision+1,
      source_device_id=p_source_device_id,updated_at=now()
      where customer_id=v_user returning * into v_row;
  end if;
  return v_row;
end $$;
grant execute on function public.save_customer_draft(jsonb,integer,text) to authenticated;

create or replace function public.enqueue_booking_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare v_title text; v_body text;
begin if old.status=new.status then return new; end if;
 v_title:=case new.status when 'quote_ready' then 'Your MMEMME quote is ready' when 'confirmed' then 'Your booking is confirmed' when 'cancelled' then 'Your booking was cancelled' when 'disputed' then 'Your dispute is open' when 'service_due' then 'Your event is approaching' when 'completed' then 'Your booking is complete' else null end;
 if v_title is not null then v_body:='Booking status: '||replace(new.status::text,'_',' '); insert into public.customer_notifications(customer_id,booking_id,kind,title,body,deep_link,web_path) values(new.customer_id,new.id,'booking_status',v_title,v_body,'mmemme://booking/'||new.id,'/bookings/'||new.id); end if;
 if new.status='confirmed' then
   insert into public.booking_reminders(booking_id,customer_id,remind_at,kind) values
   (new.id,new.customer_id,(new.event_date-30)::timestamp,'event_30_days'),
   (new.id,new.customer_id,(new.event_date-7)::timestamp,'event_7_days'),
   (new.id,new.customer_id,(new.event_date-1)::timestamp,'event_1_day') on conflict do nothing;
 end if; return new; end $$;

create or replace function public.enqueue_support_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare v_customer uuid; begin select customer_id into v_customer from public.bookings where id=new.booking_id;
 if new.author_id<>v_customer then insert into public.customer_notifications(customer_id,booking_id,kind,title,body,deep_link,web_path) values(v_customer,new.booking_id,'support','MMEMME replied to your booking',left(new.body,180),'mmemme://booking/manage/'||new.booking_id,'/bookings/'||new.booking_id||'#support'); end if; return new; end $$;
