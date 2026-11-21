\set ON_ERROR_STOP on
begin;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create role qmaps_gateway login noinherit password :'gateway_password';
grant anon, authenticated to qmaps_gateway;
revoke create on schema public from public;
create extension if not exists unaccent;
create schema auth;
create schema storage;
create schema qmaps_private;
revoke all on schema qmaps_private from public;
grant usage on schema qmaps_private to qmaps_gateway;
grant usage on schema auth to anon,authenticated,qmaps_gateway;
grant usage on schema storage to anon,authenticated;
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('qmaps.user_id',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
create table auth.users (
 id uuid primary key default gen_random_uuid(), email text unique, email_confirmed_at timestamptz,
 raw_user_meta_data jsonb not null default '{}', deleted_at timestamptz, created_at timestamptz not null default now()
);
create table qmaps_private.accounts (
 user_id uuid primary key references auth.users on delete cascade, handle text not null unique,
 password_hash text not null, recovery_hash text not null
);
create table qmaps_private.sessions (
 token_hash text primary key, user_id uuid not null references auth.users on delete cascade,
 expires_at timestamptz not null
);
create index on qmaps_private.sessions(user_id);
create table qmaps_private.attempts (key text primary key, expires_at timestamptz not null, attempts integer not null);
create table qmaps_private.media (
 id uuid primary key, business_id uuid not null, user_id uuid not null references auth.users on delete cascade,
 mime text not null, data bytea not null, created_at timestamptz not null default now()
);
create index on qmaps_private.media(user_id);
grant insert(id,raw_user_meta_data) on auth.users to qmaps_gateway;
grant select,insert,update,delete on all tables in schema qmaps_private to qmaps_gateway;
create table storage.buckets (id text primary key, name text not null, public boolean not null default false);
create table storage.objects (
 id uuid primary key default gen_random_uuid(), bucket_id text not null references storage.buckets,
 name text not null, owner uuid, metadata jsonb, unique(bucket_id,name)
);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
$$ select (string_to_array(name,'/'))[1:greatest(cardinality(string_to_array(name,'/'))-1,0)] $$;
create function storage.extension(name text) returns text language sql immutable as
$$ select substring(regexp_replace(name, '^.*/', '') from '\.([^.]+)$') $$;
commit;
