\set ON_ERROR_STOP on

do $validate$
declare
  missing_sources text[];
begin
  if not exists (select 1 from flexs_stage_input) then
    raise exception 'The public catalogue snapshot is empty';
  end if;
  if exists (
    select 1 from flexs_stage_input i
    where i.status not in ('listed','claimed')
      or upper(btrim(i.province)) not in ('QC','CA-QC')
      or char_length(btrim(i.name)) not between 1 and 512
      or char_length(btrim(i.city)) not between 1 and 180
      or char_length(btrim(i.source_ref)) not between 1 and 240
      or not exists (select 1 from flexs_stage_expected_source e where e.source = i.source)
  ) then
    raise exception 'Non-public, out-of-province, invalid or incompatible source row in snapshot';
  end if;
  if exists (select 1 from flexs_stage_input group by id having count(*) > 1)
     or exists (select 1 from flexs_stage_input group by source, btrim(source_ref) having count(*) > 1) then
    raise exception 'Duplicate source ID in the snapshot';
  end if;
  if exists (
    select 1 from flexs_stage_input i
    join qmaps_ops.flexs_directory_stage s on s.source = i.source and s.source_ref = btrim(i.source_ref)
    where s.flexs_id <> i.id
  ) then
    raise exception 'Source identity changed since the earlier snapshot';
  end if;
  select array_agg(e.source order by e.source) into missing_sources
  from flexs_stage_expected_source e
  where not exists (select 1 from flexs_stage_input i where i.source = e.source);
  if missing_sources is not null then
    raise exception 'Snapshot missing required source(s): %', array_to_string(missing_sources, ', ');
  end if;
end;
$validate$;

-- One marker for the complete input, generated after the loader lock and
-- validation instead of using a transaction start time prior to lock wait.
-- Never reuse the previous family marker if the wall clock moved backward.
insert into flexs_stage_snapshot_marker
select greatest(clock_timestamp(), previous.staged_at + interval '1 microsecond')
from flexs_stage_kind k left join qmaps_ops.flexs_directory_snapshots previous using (source_family);

insert into qmaps_ops.flexs_directory_stage (
  source, source_ref, flexs_id, licence, name, other_name, city, region, trade, category_slug, staged_at
)
select source, btrim(source_ref), id,
       case source when 'osm' then 'ODbL-1.0' when 'shb' then 'CC0-1.0' else 'CC-BY-4.0' end,
       btrim(name), nullif(btrim(other_name), ''), btrim(city),
       nullif(btrim(region), ''), nullif(btrim(trade), ''), nullif(btrim(category_slug), ''), m.staged_at
from flexs_stage_input cross join flexs_stage_snapshot_marker m
on conflict (source, source_ref) do update set
  name = excluded.name,
  other_name = excluded.other_name,
  city = excluded.city,
  region = excluded.region,
  trade = excluded.trade,
  category_slug = excluded.category_slug,
  staged_at = excluded.staged_at;

insert into qmaps_ops.flexs_directory_snapshots (source_family, staged_at, source_counts)
select k.source_family, m.staged_at, jsonb_object_agg(counts.source, counts.rows_in_snapshot)
from flexs_stage_kind k cross join flexs_stage_snapshot_marker m
cross join (select source, count(*) as rows_in_snapshot from flexs_stage_input group by source) counts
group by k.source_family, m.staged_at
on conflict (source_family) do update set
  staged_at = excluded.staged_at,
  source_counts = excluded.source_counts;

select source, count(*) as rows_in_snapshot from flexs_stage_input group by source order by source;
select count(*) as tentative_name_city_collisions
from (
  select lower(unaccent(btrim(name))), lower(unaccent(btrim(city)))
  from qmaps_ops.flexs_directory_stage
  group by 1, 2
  having count(*) > 1
) as duplicates;

-- Omitted references stay in private staging. The report is aggregate only,
-- and does not confuse another licence family's rows with this input.
select e.source, count(s.source_ref) as older_staged_rows_omitted
from flexs_stage_expected_source e cross join flexs_stage_snapshot_marker m
left join qmaps_ops.flexs_directory_stage s on s.source = e.source and s.staged_at <> m.staged_at
group by e.source order by e.source;
