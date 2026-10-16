-- QMAPS: do not expose category assignments of unpublished business drafts.
-- The original "Business categories readable by all" policy allowed anyone
-- to enumerate business_id/category_id pairs, even for is_active = false.
-- The business table itself already distinguishes public and owned drafts.
-- Preserve public discovery of active listings, owner draft editing and
-- verified admin access; do not modify any existing row or ownership.
--
-- Apply ONLY to the authorized QMAPS project after verifying backups,
-- existing policy names, and pending migration history.

drop policy if exists "Business categories readable by all"
  on public.business_categories;

drop policy if exists "Visible business categories only"
  on public.business_categories;

create policy "Visible business categories only"
on public.business_categories
for select
using (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or exists (
    select 1
    from public.businesses as b
    where b.id = business_id
      and (b.is_active = true or b.owner_user_id = auth.uid())
  )
);

-- Keep "Owners can manage business categories" (FOR ALL) in place.
-- Postgres combines its SELECT predicate with this one via OR; both branches
-- authorize only legitimate owners or visible businesses.
