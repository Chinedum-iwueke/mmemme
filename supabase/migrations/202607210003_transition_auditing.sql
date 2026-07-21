create or replace function public.valid_payout_transition(old_state public.payout_status, new_state public.payout_status) returns boolean language sql immutable as $$
  select (old_state, new_state) in (
    ('held','eligible'),('held','reversed'),('eligible','processing'),('eligible','reversed'),
    ('processing','paid'),('processing','failed'),('failed','processing'),('failed','reversed'),('paid','reversed')
  )
$$;
create or replace function public.enforce_payout_transition() returns trigger language plpgsql as $$ begin
  if old.status <> new.status and not public.valid_payout_transition(old.status, new.status) then
    raise exception 'invalid payout transition: % -> %', old.status, new.status;
  end if;
  new.updated_at = now(); return new;
end $$;
create trigger payout_transition_guard before update on public.payouts for each row execute function public.enforce_payout_transition();

create or replace function public.audit_status_transition() returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_entity text := tg_argv[0];
  v_correlation uuid;
begin
  if old.status = new.status then return new; end if;
  if v_entity = 'booking' then
    v_correlation := new.correlation_id;
  elsif v_entity = 'payment' then
    select correlation_id into v_correlation from public.bookings where id = new.booking_id;
  elsif v_entity = 'payout' then
    select correlation_id into v_correlation from public.bookings where id = new.booking_id;
  else
    v_correlation := gen_random_uuid();
  end if;
  insert into public.state_transition_events(entity_type,entity_id,actor_id,previous_state,new_state,reason,correlation_id)
  values (v_entity,new.id,auth.uid(),old.status::text,new.status::text,coalesce(nullif(current_setting('app.transition_reason',true),''),'system transition'),v_correlation);
  return new;
end $$;
create trigger audit_booking_status after update of status on public.bookings for each row execute function public.audit_status_transition('booking');
create trigger audit_payment_status after update of status on public.payments for each row execute function public.audit_status_transition('payment');
create trigger audit_payout_status after update of status on public.payouts for each row execute function public.audit_status_transition('payout');
