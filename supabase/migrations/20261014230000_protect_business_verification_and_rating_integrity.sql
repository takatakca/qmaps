-- QMAPS: protect moderation-only verification and database-derived review statistics.
-- Forward-only migration; run after earlier 20261014 owner/TakataK field guards.
-- Authenticated merchants may update their legitimate profile fields, but must
-- never award themselves a verified-owner badge or fabricate review metrics.
-- Existing values are preserved; review-score recomputation remains handled
-- by the existing SECURITY DEFINER public.refresh_business_rating() trigger.
--
-- This trigger must run alongside existing business owner and TAKATAK guards.

create or replace function public.qmaps_guard_business_trust_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  restricted_change boolean;
begin
  if tg_op = 'INSERT' then
    restricted_change := new.is_claimed is distinct from false
      or new.avg_rating is distinct from 0::numeric
      or new.reviews_count is distinct from 0;
  else
    restricted_change := new.is_claimed is distinct from old.is_claimed
      or new.avg_rating is distinct from old.avg_rating
      or new.reviews_count is distinct from old.reviews_count;
  end if;

  if restricted_change
    and current_user not in ('service_role', 'postgres', 'supabase_admin')
    and not coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
  then
    raise exception 'Verified ownership and review aggregates require QMAPS administrative authorization'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists qmaps_guard_business_trust_insert on public.businesses;
create trigger qmaps_guard_business_trust_insert
before insert on public.businesses
for each row execute function public.qmaps_guard_business_trust_fields();

drop trigger if exists qmaps_guard_business_trust_update on public.businesses;
create trigger qmaps_guard_business_trust_update
before update of is_claimed, avg_rating, reviews_count on public.businesses
for each row execute function public.qmaps_guard_business_trust_fields();

-- The RLS owner UPDATE policy still enforces owner_user_id and previous
-- INSERT policy forbids pre-claimed rows. These guards are defense in depth.
