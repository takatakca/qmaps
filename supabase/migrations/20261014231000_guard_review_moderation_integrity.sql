-- Protect private moderation results and per-review reaction totals from
-- being forged by an authenticated review author via PostgREST.
-- Apply AFTER 20261014190000_guard_takatak_columns_and_review_replies.sql.
-- Existing `reviews.owner_reply` guard is preserved (not recreated here).
--
-- Ordinary authors may still edit their review body and star rating.
-- The original author and business of a review must not be replaced to
-- bypass unique constraints, moderation or automated business rating updates.

create or replace function public.qmaps_guard_review_moderation_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  restricted_change boolean;
begin
  if tg_op = 'INSERT' then
    restricted_change := new.moderation_status is distinct from 'visible'
      or new.hidden_at is not null
      or new.hidden_by is not null
      or new.hidden_reason is not null
      or new.useful is distinct from 0
      or new.funny is distinct from 0
      or new.cool is distinct from 0;
  else
    restricted_change := new.moderation_status is distinct from old.moderation_status
      or new.hidden_at is distinct from old.hidden_at
      or new.hidden_by is distinct from old.hidden_by
      or new.hidden_reason is distinct from old.hidden_reason
      or new.useful is distinct from old.useful
      or new.funny is distinct from old.funny
      or new.cool is distinct from old.cool
      or new.user_id is distinct from old.user_id
      or new.business_id is distinct from old.business_id;
  end if;

  if restricted_change
    and current_user not in ('service_role', 'postgres', 'supabase_admin')
    and not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  then
    raise exception 'QMAPS review moderation, reactions and identity require administrative authorization'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists qmaps_guard_review_moderation_insert on public.reviews;
create trigger qmaps_guard_review_moderation_insert
before insert on public.reviews
for each row execute function public.qmaps_guard_review_moderation_fields();

drop trigger if exists qmaps_guard_review_moderation_update on public.reviews;
create trigger qmaps_guard_review_moderation_update
before update of moderation_status, hidden_at, hidden_by, hidden_reason,
  useful, funny, cool, user_id, business_id
on public.reviews
for each row execute function public.qmaps_guard_review_moderation_fields();
