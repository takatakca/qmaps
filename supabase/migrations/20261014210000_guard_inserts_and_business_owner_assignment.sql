-- QMAPS hardening, additive follow-up to the 20261014190000 column guards.
-- IMPORTANT: Do not edit or replay already-applied migrations in production.
-- Prevent INSERT bypass of the UPDATE-only guard triggers, and prevent
-- authenticated callers from assigning a business to an unrelated user.
-- Must be deployed after 20261011120000 and 20261014190000 migrations.

create or replace function public.qmaps_guard_takatak_workspace()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed boolean;
begin
  if tg_op = 'INSERT' then
    changed := new.takatak_client_id is not null;
  else
    changed := new.takatak_client_id is distinct from old.takatak_client_id;
  end if;

  if changed
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  then
    raise exception 'TAKATAK workspace association requires QMAPS administrator access'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists qmaps_guard_takatak_workspace_insert on public.businesses;
create trigger qmaps_guard_takatak_workspace_insert
before insert on public.businesses
for each row execute function public.qmaps_guard_takatak_workspace();

create or replace function public.qmaps_guard_review_owner_reply()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed boolean;
begin
  if tg_op = 'INSERT' then
    changed := new.owner_reply is not null or new.owner_replied_at is not null;
  else
    changed := new.owner_reply is distinct from old.owner_reply
      or new.owner_replied_at is distinct from old.owner_replied_at;
  end if;

  if changed
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  then
    raise exception 'Only verified business owners via the reply API or QMAPS admins can modify an owner reply'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists qmaps_guard_review_owner_reply_insert on public.reviews;
create trigger qmaps_guard_review_owner_reply_insert
before insert on public.reviews
for each row execute function public.qmaps_guard_review_owner_reply();

-- Existing INSERT RLS for businesses only requires auth.uid() IS NOT NULL.
-- Reject a foreign owner_user_id. Null remains permitted for an unclaimed
-- listing, matching the existing "Add business" workflow.
create or replace function public.qmaps_guard_business_owner_assignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner_user_id is not null
     and (tg_op = 'INSERT' or new.owner_user_id is distinct from old.owner_user_id)
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
     and new.owner_user_id is distinct from auth.uid()
  then
    raise exception 'Cannot assign a QMAPS business to another user'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists qmaps_guard_business_owner_insert on public.businesses;
create trigger qmaps_guard_business_owner_insert
before insert on public.businesses
for each row execute function public.qmaps_guard_business_owner_assignment();

drop trigger if exists qmaps_guard_business_owner_update on public.businesses;
create trigger qmaps_guard_business_owner_update
before update of owner_user_id on public.businesses
for each row execute function public.qmaps_guard_business_owner_assignment();
