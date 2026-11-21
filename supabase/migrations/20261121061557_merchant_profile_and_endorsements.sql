alter table public.businesses
  add column founding_year smallint check (founding_year between 1000 and 9999),
  add column business_history text check (length(business_history) <= 2000),
  add column logo_url text check (length(logo_url) <= 2048 and logo_url ~ '^https://[^/@?#[:space:]]+([/?#][^[:space:]]*)?$'),
  add column profile_highlights text[] not null default '{}'
    check (cardinality(profile_highlights) <= 6 and profile_highlights <@ array['family','local','women','eco','handmade','pet','kid','gift','outdoor','commercial','delivery','cafe']::text[]);
create table public.business_endorsements (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recommended boolean not null,
  primary key (business_id,user_id)
);
alter table public.business_endorsements enable row level security;
revoke all on public.business_endorsements from public, anon, authenticated;
grant select, insert(business_id,recommended), update(recommended), delete on public.business_endorsements to authenticated;
create policy own_endorsement on public.business_endorsements for all to authenticated using(user_id=(select auth.uid()))
with check(user_id=(select auth.uid()) and exists(select 1 from public.businesses b where b.id=business_id and b.is_active));
