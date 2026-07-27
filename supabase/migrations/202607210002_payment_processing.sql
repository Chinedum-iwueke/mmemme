create or replace function public.valid_payment_transition(old_state public.payment_status, new_state public.payment_status) returns boolean language sql immutable as $$
  select (old_state, new_state) in (
    ('initiated','pending'),('initiated','succeeded'),('initiated','failed'),
    ('pending','succeeded'),('pending','failed'),
    ('succeeded','partially_refunded'),('succeeded','refunded'),('succeeded','charged_back'),
    ('partially_refunded','refunded'),('partially_refunded','charged_back')
  )
$$;
create or replace function public.enforce_payment_transition() returns trigger language plpgsql as $$ begin
  if old.status <> new.status and not public.valid_payment_transition(old.status, new.status) then
    raise exception 'invalid payment transition: % -> %', old.status, new.status;
  end if;
  new.updated_at = now(); return new;
end $$;
create trigger payment_transition_guard before update on public.payments for each row execute function public.enforce_payment_transition();

create or replace function public.process_successful_payment(
  p_reference text, p_amount_kobo bigint, p_event_key text, p_event_hash text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_payment public.payments;
  v_quote public.quotes;
  v_platform_fee bigint;
  v_vendor_net bigint;
begin
  insert into public.provider_events(provider,event_key,event_type,payload_sha256)
  values ('paystack',p_event_key,'charge.success',p_event_hash)
  on conflict (event_key) do nothing;
  if not found then
    select * into v_payment from public.payments where provider_reference = p_reference;
    return v_payment.id;
  end if;

  select * into v_payment from public.payments where provider_reference = p_reference for update;
  if not found then raise exception 'unknown payment reference'; end if;
  if v_payment.amount_kobo <> p_amount_kobo then raise exception 'payment amount mismatch'; end if;
  if v_payment.status = 'succeeded' then return v_payment.id; end if;

  select * into v_quote from public.quotes where id = v_payment.quote_id;
  if v_quote.expires_at <= now() then raise exception 'quote expired'; end if;
  v_platform_fee := floor(p_amount_kobo * v_quote.platform_fee_bps / 10000.0);
  v_vendor_net := p_amount_kobo - v_platform_fee;

  update public.payments set status='succeeded', paid_at=now(), raw_provider_status='success' where id=v_payment.id;
  insert into public.ledger_entries(payment_id,entry_type,amount_kobo,idempotency_key) values
    (v_payment.id,'gross',p_amount_kobo,p_reference||':gross'),
    (v_payment.id,'platform_fee',v_platform_fee,p_reference||':platform_fee'),
    (v_payment.id,'vendor_net',v_vendor_net,p_reference||':vendor_net')
  on conflict (idempotency_key) do nothing;

  update public.bookings set status='confirmed' where id=v_payment.booking_id and status='accepted_awaiting_payment';
  insert into public.payouts(booking_id,payment_id,vendor_id,amount_kobo,status)
    select b.id,v_payment.id,b.vendor_id,v_vendor_net,'held' from public.bookings b where b.id=v_payment.booking_id
    on conflict do nothing;
  return v_payment.id;
end $$;
revoke all on function public.process_successful_payment(text,bigint,text,text) from public, anon, authenticated;
grant execute on function public.process_successful_payment(text,bigint,text,text) to service_role;

create unique index one_payout_per_payment on public.payouts(payment_id);
