-- Run only in a fresh test database. These are the existing identity and listing contracts.
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
                    nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid$$;
grant usage on schema auth to authenticated, anon;
create table public.businesses(id uuid primary key, owner_user_id uuid references auth.users(id), is_active boolean not null);
alter table public.businesses enable row level security;
grant select on public.businesses to anon, authenticated;
create policy listings_visible on public.businesses for select using (is_active or owner_user_id = auth.uid());
insert into auth.users values ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002'),('10000000-0000-0000-0000-000000000003');
insert into public.businesses values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',true),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',true),
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',false);

alter table public.businesses add column name text not null default 'Commerce test';
create schema storage;
create table storage.objects (bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant insert on storage.objects to authenticated;
