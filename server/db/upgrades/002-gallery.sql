\set ON_ERROR_STOP on
begin;
grant select(owner_user_id) on public.businesses to qmaps_gateway;
create table if not exists qmaps_private.gallery_covers (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  photo_id uuid not null unique references qmaps_private.media(id) on delete cascade
);
create table if not exists qmaps_private.gallery_reports (
  photo_id uuid references qmaps_private.media(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id,reporter_id)
);
grant select,insert,update,delete on qmaps_private.gallery_covers to qmaps_gateway;
grant select,insert,delete on qmaps_private.gallery_reports to qmaps_gateway;
grant select(name) on public.businesses to qmaps_gateway;
create index if not exists media_business_sort on qmaps_private.media(business_id,created_at desc,id);
commit;
