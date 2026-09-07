create type public.admin_role as enum ('owner','operations','verification','support','finance','auditor');

create table public.admin_access (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role public.admin_role not null,
  active boolean not null default true,
  session_timeout_minutes integer not null default 30 check(session_timeout_minutes between 5 and 480),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.admin_access(user_id,role)
select id,'owner' from public.profiles where is_admin=true on conflict(user_id) do nothing;

create table public.operations_assignments (
  entity_type text not null check(entity_type in ('booking','vendor_application','support','cancellation','refund','dispute','payout','reconciliation')),
  entity_id uuid not null,
  assigned_to uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  due_at timestamptz,
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  updated_at timestamptz not null default now(),
  primary key(entity_type,entity_id)
);
create index operations_assignments_owner_due on public.operations_assignments(assigned_to,due_at);

create table public.operations_case_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  summary text not null check(char_length(summary) between 2 and 1000),
  visibility text not null default 'internal' check(visibility in ('internal','customer')),
  actor_id uuid not null references public.profiles(id),
  correlation_id uuid not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index operations_case_events_entity on public.operations_case_events(entity_type,entity_id,created_at desc);

create table public.saved_operation_queues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check(char_length(name) between 2 and 80),
  scope text not null check(scope in ('bookings','vendors','support','money','audit')),
  filters jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(owner_id,name)
);

create table public.reconciliation_exceptions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.reconciliation_runs(id) on delete cascade,
  payment_id uuid references public.payments(id),
  kind text not null,
  expected_kobo bigint,
  actual_kobo bigint,
  status text not null default 'open' check(status in ('open','investigating','resolved')),
  assigned_to uuid references public.profiles(id),
  resolution text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index reconciliation_exception_once on public.reconciliation_exceptions(run_id,payment_id,kind);

create or replace function public.admin_has_capability(p_capability text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(
   select 1 from public.admin_access a where a.user_id=auth.uid() and a.active=true and a.revoked_at is null and (
     a.role='owner' or
     (a.role='operations' and p_capability in ('dashboard','bookings','support','vendors','audit','export')) or
     (a.role='verification' and p_capability in ('dashboard','vendors','audit','export')) or
     (a.role='support' and p_capability in ('dashboard','support','bookings','audit','export')) or
     (a.role='finance' and p_capability in ('dashboard','money','support','audit','export')) or
     (a.role='auditor' and p_capability in ('dashboard','audit','export'))
   )
 )
$$;

create or replace function public.touch_admin_session() returns public.admin_access
language plpgsql security definer set search_path=public as $$
declare v_row public.admin_access;
begin
 update public.admin_access set last_seen_at=now(),updated_at=now()
 where user_id=auth.uid() and active=true and revoked_at is null returning * into v_row;
 if not found then raise exception 'administrator access revoked or unavailable'; end if;
 return v_row;
end $$;

create or replace function public.assign_operations_case(p_entity_type text,p_entity_id uuid,p_assigned_to uuid,p_due_at timestamptz,p_priority text,p_reason text,p_correlation_id uuid)
returns public.operations_assignments language plpgsql security definer set search_path=public as $$
declare v_row public.operations_assignments;
begin
 if not public.admin_has_capability(case when p_entity_type='vendor_application' then 'vendors' when p_entity_type in ('refund','payout','reconciliation') then 'money' else 'support' end) then raise exception 'not authorized'; end if;
 if not exists(select 1 from public.admin_access where user_id=p_assigned_to and active=true and revoked_at is null) then raise exception 'assignee is not active'; end if;
 if char_length(trim(p_reason))<5 then raise exception 'reason is required'; end if;
 insert into public.operations_assignments(entity_type,entity_id,assigned_to,assigned_by,due_at,priority)
 values(p_entity_type,p_entity_id,p_assigned_to,auth.uid(),p_due_at,p_priority)
 on conflict(entity_type,entity_id) do update set assigned_to=excluded.assigned_to,assigned_by=excluded.assigned_by,due_at=excluded.due_at,priority=excluded.priority,updated_at=now()
 returning * into v_row;
 insert into public.operations_case_events(entity_type,entity_id,event_type,summary,actor_id,correlation_id,metadata)
 values(p_entity_type,p_entity_id,'assignment',left(trim(p_reason),1000),auth.uid(),p_correlation_id,jsonb_build_object('assignedTo',p_assigned_to,'priority',p_priority,'dueAt',p_due_at));
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,correlation_id,metadata)
 values(auth.uid(),'operations.assigned',p_entity_type,p_entity_id,left(trim(p_reason),1000),p_correlation_id,jsonb_build_object('assignedTo',p_assigned_to,'priority',p_priority));
 return v_row;
end $$;

create or replace function public.resolve_reconciliation_exception(p_exception_id uuid,p_reason text)
returns public.reconciliation_exceptions language plpgsql security definer set search_path=public as $$
declare v_row public.reconciliation_exceptions;
begin
 if not public.admin_has_capability('money') then raise exception 'not authorized'; end if;
 if char_length(trim(p_reason))<10 then raise exception 'resolution reason is required'; end if;
 update public.reconciliation_exceptions set status='resolved',resolution=trim(p_reason),resolved_by=auth.uid(),resolved_at=now()
 where id=p_exception_id and status in('open','investigating') returning * into v_row;
 if not found then raise exception 'exception is not open'; end if;
 insert into public.admin_audit_events(admin_id,action,entity_type,entity_id,reason,correlation_id)
 values(auth.uid(),'reconciliation_exception.resolved','reconciliation',p_exception_id,trim(p_reason),gen_random_uuid());
 return v_row;
end $$;

create or replace function public.prevent_admin_access_self_escalation() returns trigger language plpgsql as $$
begin
 if auth.uid()=old.user_id and (new.role<>old.role or new.active<>old.active or new.revoked_at is distinct from old.revoked_at) then raise exception 'administrators cannot change their own access'; end if;
 return new;
end $$;
create trigger protect_admin_access before update on public.admin_access for each row execute function public.prevent_admin_access_self_escalation();
create or replace function public.prevent_vendor_conflict_approval() returns trigger language plpgsql as $$
begin
 if new.status='approved' and old.status is distinct from new.status and exists(select 1 from public.vendor_memberships where account_id=new.account_id and user_id=auth.uid()) then raise exception 'dual-role operator cannot approve own vendor account'; end if;
 return new;
end $$;
create trigger prevent_vendor_conflict_approval before update of status on public.vendor_applications for each row execute function public.prevent_vendor_conflict_approval();
create or replace function public.validate_vendor_publication() returns trigger language plpgsql as $$
begin
 if new.published and not exists(
   select 1 from public.verification_records v where v.vendor_id=new.id and v.status='approved' and v.expires_at>now()
   and v.identity_checked and v.contact_checked and v.bank_name_checked and v.authority_checked and v.portfolio_checked and v.references_checked and v.physical_site_checked
 ) then raise exception 'current complete verification is required for publication'; end if;
 if new.published and not exists(select 1 from public.service_packages p where p.vendor_id=new.id and p.active=true) then raise exception 'an active package is required for publication'; end if;
 return new;
end $$;
create trigger validate_vendor_publication before insert or update of published on public.vendors for each row execute function public.validate_vendor_publication();
create or replace function public.unpublish_invalid_verification() returns trigger language plpgsql as $$
begin
 if new.status<>'approved' or new.expires_at is null or new.expires_at<=now() then update public.vendors set published=false,verification_status=case when new.status='expired' then 'expired'::public.verification_status else verification_status end where id=new.vendor_id; end if;
 return new;
end $$;
create trigger unpublish_invalid_verification after insert or update of status,expires_at on public.verification_records for each row execute function public.unpublish_invalid_verification();
create trigger immutable_operations_case_events before update or delete on public.operations_case_events for each row execute function public.prevent_update_delete();

alter table public.admin_access enable row level security;
alter table public.operations_assignments enable row level security;
alter table public.operations_case_events enable row level security;
alter table public.saved_operation_queues enable row level security;
alter table public.reconciliation_exceptions enable row level security;
create policy "admins read own access" on public.admin_access for select using(user_id=auth.uid() or public.admin_has_capability('audit'));
create policy "authorized admins read assignments" on public.operations_assignments for select using(public.admin_has_capability('dashboard'));
create policy "authorized admins read case events" on public.operations_case_events for select using(public.admin_has_capability('dashboard'));
create policy "admins own saved queues" on public.saved_operation_queues for all using(owner_id=auth.uid() and public.admin_has_capability('dashboard')) with check(owner_id=auth.uid() and public.admin_has_capability('dashboard'));
create policy "finance reads reconciliation exceptions" on public.reconciliation_exceptions for select using(public.admin_has_capability('money'));

revoke all on function public.touch_admin_session(),public.assign_operations_case(text,uuid,uuid,timestamptz,text,text,uuid),public.resolve_reconciliation_exception(uuid,text) from public,anon;
grant execute on function public.touch_admin_session(),public.assign_operations_case(text,uuid,uuid,timestamptz,text,text,uuid),public.resolve_reconciliation_exception(uuid,text) to authenticated;
grant select on public.admin_access,public.operations_assignments,public.operations_case_events,public.reconciliation_exceptions to authenticated;
grant select,insert,update,delete on public.saved_operation_queues to authenticated;
grant all privileges on public.admin_access,public.operations_assignments,public.operations_case_events,public.saved_operation_queues,public.reconciliation_exceptions to service_role;
