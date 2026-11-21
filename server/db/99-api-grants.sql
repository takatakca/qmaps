\set ON_ERROR_STOP on
begin;
grant usage on schema public to anon,authenticated;
grant select on public.businesses,public.business_categories,public.categories to anon,authenticated;
grant select,insert,delete on public.bookmarks to authenticated;
grant select on public.user_roles to authenticated;
alter table qmaps_private.media add foreign key (business_id) references public.businesses(id) on delete cascade;
commit;
grant insert(name,city,address,owner_user_id) on public.businesses to authenticated;
grant select (id,is_active) on public.businesses to qmaps_gateway;
