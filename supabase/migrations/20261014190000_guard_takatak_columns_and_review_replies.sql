-- Guard TAKATAK workspace associations and public owner-reply fields.
-- Required after 20261011120000_takatak_workspace_and_review_reply.sql.
-- Applies to all PostgREST authenticated callers, including an author editing
-- their own review and a merchant editing their own business.
-- Service-role calls are allowed only from trusted Edge Functions that
-- independently check client/business ownership and authentication.
-- This migration does not change existing rows or client ownership policies.

create or replace function public.qmaps_guard_takatak_workspace()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.takatak_client_id is distinct from old.takatak_client_id
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  then
    raise exception 'TAKATAK workspace association requires QMAPS administrator access'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists qmaps_guard_takatak_workspace_update on public.businesses;
create trigger qmaps_guard_takatak_workspace_update
before update of takatak_client_id on public.businesses
for each row execute function public.qmaps_guard_takatak_workspace();

create or replace function public.qmaps_guard_review_owner_reply()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (
      new.owner_reply is distinct from old.owner_reply
      or new.owner_replied_at is distinct from old.owner_replied_at
     )
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  then
    raise exception 'Only verified business owners via the reply API or QMAPS admins can modify an owner reply'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists qmaps_guard_review_owner_reply_update on public.reviews;
create trigger qmaps_guard_review_owner_reply_update
before update of owner_reply, owner_replied_at on public.reviews
for each row execute function public.qmaps_guard_review_owner_reply();
