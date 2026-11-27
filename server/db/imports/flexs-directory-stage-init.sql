\set ON_ERROR_STOP on
set local lock_timeout = '5s';
select pg_advisory_xact_lock(hashtextextended('QMAPS FLEXS basic catalogue staging', 0));

do $guard$
begin
  if to_regclass('qmaps_private.accounts') is null
     or to_regclass('qmaps_ops.applied_migrations') is null then
    raise exception 'Run only against initialized QMAPS PostgreSQL';
  end if;
end;
$guard$;

create temporary table flexs_stage_kind (
  source_family text not null check (source_family in ('open', 'odbl'))
) on commit drop;
insert into flexs_stage_kind values (:'source_family');

create temporary table flexs_stage_input (
  id uuid not null,
  source text not null,
  source_ref text not null,
  name text not null,
  other_name text,
  city text not null,
  region text,
  province text not null,
  trade text,
  category_slug text,
  status text not null
) on commit drop;

create table if not exists qmaps_ops.flexs_directory_stage (
  source text not null,
  source_ref text not null,
  flexs_id uuid not null unique,
  licence text not null,
  name text not null,
  other_name text,
  city text not null,
  region text,
  trade text,
  category_slug text,
  staged_at timestamptz not null default current_timestamp,
  primary key (source, source_ref),
  check (
    (source in ('rbq', 'mtl_food', 'mtl_shops', 'opc', 'sit') and licence = 'CC-BY-4.0')
    or (source = 'shb' and licence = 'CC0-1.0')
    or (source = 'osm' and licence = 'ODbL-1.0')
  )
);

revoke all on table qmaps_ops.flexs_directory_stage from public, anon, authenticated, qmaps_gateway;
