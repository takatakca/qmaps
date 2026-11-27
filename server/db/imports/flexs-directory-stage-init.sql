\set ON_ERROR_STOP on
set transaction isolation level read committed;
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

create temporary table flexs_stage_expected_source (
  source text primary key
) on commit drop;
insert into flexs_stage_expected_source
select expected.source
from flexs_stage_kind k
join (values ('open','rbq'), ('open','mtl_food'), ('open','mtl_shops'),
             ('open','opc'), ('open','sit'), ('open','shb'), ('odbl','osm'))
     as expected(source_family,source) on expected.source_family = k.source_family;

create temporary table flexs_stage_snapshot_marker (
  staged_at timestamptz not null
) on commit drop;

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

-- One current receipt per licence family, not one receipt for both files.
-- Earlier staging rows can remain present without being part of this receipt.
create table if not exists qmaps_ops.flexs_directory_snapshots (
  source_family text primary key check (source_family in ('open','odbl')),
  staged_at timestamptz not null,
  source_counts jsonb not null,
  check (jsonb_typeof(source_counts) = 'object' and case source_family
    when 'open' then source_counts ?& array['rbq','mtl_food','mtl_shops','opc','sit','shb']
      and source_counts - array['rbq','mtl_food','mtl_shops','opc','sit','shb'] = '{}'::jsonb
    when 'odbl' then source_counts ? 'osm' and source_counts - 'osm'::text = '{}'::jsonb
    else false
  end)
);

revoke all on table qmaps_ops.flexs_directory_stage, qmaps_ops.flexs_directory_snapshots
  from public, anon, authenticated, qmaps_gateway, service_role;
