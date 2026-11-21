\set ON_ERROR_STOP on
begin;

-- Serialize all requests by owner, including retries from different devices.
create or replace function public.qmaps_account_closure(operation text)
returns table(id uuid, status text, requested_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  item public.account_deletion_requests%rowtype;
begin
  if owner_id is null then raise insufficient_privilege; end if;
  if operation not in ('read', 'request', 'cancel') or operation is null then
    raise invalid_parameter_value;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  select r.* into item from public.account_deletion_requests r
    where r.user_id = owner_id
    order by (r.status in ('pending','processing')) desc, r.requested_at desc, r.id limit 1 for update;
  if operation = 'request' and (item.id is null or item.status not in ('pending','processing')) then
    insert into public.account_deletion_requests(user_id) values(owner_id) returning * into item;
    insert into public.account_deletion_request_events(request_id, actor_user_id, event_type, new_status)
      values(item.id, owner_id, 'created', 'pending');
  elsif operation = 'cancel' and item.status = 'pending' then
    update public.account_deletion_requests r set status='canceled' where r.id=item.id returning * into item;
    insert into public.account_deletion_request_events(request_id, actor_user_id, event_type, previous_status, new_status)
      values(item.id, owner_id, 'status_changed', 'pending', 'canceled');
  elsif operation = 'cancel' and (item.status is distinct from 'canceled') then
    raise exception 'La demande ne peut plus être annulée' using errcode='P0001';
  end if;
  if item.id is not null then return query select item.id, item.status, item.requested_at; end if;
end;
$$;
revoke all on function public.qmaps_account_closure(text) from public;
grant execute on function public.qmaps_account_closure(text) to authenticated;

-- A case can be claimed in the owner's console. Completion follows actual data processing.
grant select(id, user_id, status, requested_at) on public.account_deletion_requests to authenticated;
create or replace function public.qmaps_start_closure(case_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  item public.account_deletion_requests%rowtype;
begin
  if public.has_role(auth.uid(), 'admin') is not true or auth.uid() is null then raise insufficient_privilege; end if;
  update public.account_deletion_requests r set status='processing',processed_by=auth.uid()
    where r.id=case_id and r.status='pending' returning * into item;
  if not found then return false; end if;
  insert into public.account_deletion_request_events(request_id,actor_user_id,event_type,previous_status,new_status)
    values(case_id,auth.uid(),'status_changed','pending','processing');
  return true;
end;
$$;
revoke all on function public.qmaps_start_closure(uuid) from public;
grant execute on function public.qmaps_start_closure(uuid) to authenticated;
-- Finish a reviewed case only when the remaining records are safe to erase.
-- Unhandled relationships (including future tables) require the operator to resolve them first.
create or replace function public.qmaps_finish_closure(case_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare
  item public.account_deletion_requests%rowtype;
  ref record;
  linked boolean;
begin
  if public.has_role(auth.uid(),'admin') is not true then raise insufficient_privilege; end if;
  select * into item from public.account_deletion_requests where id=case_id for update;
  if not found then return 'missing'; end if;
  if item.status='completed' then return 'completed'; end if;
  if item.status<>'processing' then return 'not_processing'; end if;
  if item.user_id=auth.uid() or public.has_role(item.user_id,'admin') then return 'protected'; end if;
  perform 1 from auth.users where id=item.user_id for update;
  if not found or not exists(select 1 from qmaps_private.accounts where user_id=item.user_id) then
    return 'missing_account';
  end if;
  -- Check both declared foreign keys and UUID columns used by earlier schemas without a foreign key.
  for ref in
    select n.nspname, t.relname, a.attname
    from pg_catalog.pg_class t join pg_catalog.pg_namespace n on n.oid=t.relnamespace
    join pg_catalog.pg_attribute a on a.attrelid=t.oid
    where n.nspname in ('public','qmaps_private','storage') and t.relkind in ('r','p')
      and a.attnum>0 and not a.attisdropped and a.atttypid='uuid'::regtype
      and (n.nspname,t.relname,a.attname) not in (
        ('public','profiles','id'),('public','user_roles','user_id'),('public','bookmarks','user_id'),
        ('public','guest_requests','user_id'),('qmaps_private','accounts','user_id'),('qmaps_private','sessions','user_id'),
        ('public','account_deletion_requests','user_id'),('public','account_deletion_requests','processed_by'),
        ('public','account_deletion_request_events','actor_user_id'))
  loop
    execute format('select exists(select 1 from %I.%I where %I=$1)',ref.nspname,ref.relname,ref.attname)
      into linked using item.user_id;
    if linked then return 'review_required'; end if;
  end loop;
  delete from auth.users where id=item.user_id;
  update public.account_deletion_requests set status='completed',processed_at=now(),processed_by=auth.uid() where id=case_id;
  insert into public.account_deletion_request_events(request_id,actor_user_id,event_type,previous_status,new_status)
    values(case_id,auth.uid(),'status_changed','processing','completed');
  return 'completed';
end;
$$;
revoke all on function public.qmaps_finish_closure(uuid) from public;
grant execute on function public.qmaps_finish_closure(uuid) to authenticated;
commit;
