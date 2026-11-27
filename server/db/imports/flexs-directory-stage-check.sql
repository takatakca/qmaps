\set ON_ERROR_STOP on

do $validate$
begin
  if not exists (select 1 from flexs_stage_input) then
    raise exception 'The public catalogue snapshot is empty';
  end if;
  if exists (
    select 1 from flexs_stage_input i cross join flexs_stage_kind k
    where i.status not in ('listed','claimed')
      or upper(btrim(i.province)) not in ('QC','CA-QC')
      or char_length(btrim(i.name)) not between 1 and 512
      or char_length(btrim(i.city)) not between 1 and 180
      or char_length(btrim(i.source_ref)) not between 1 and 240
      or (k.source_family = 'open' and i.source not in ('rbq','mtl_food','mtl_shops','opc','sit','shb'))
      or (k.source_family = 'odbl' and i.source <> 'osm')
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
end;
$validate$;

insert into qmaps_ops.flexs_directory_stage (
  source, source_ref, flexs_id, licence, name, other_name, city, region, trade, category_slug
)
select source, btrim(source_ref), id,
       case source when 'osm' then 'ODbL-1.0' when 'shb' then 'CC0-1.0' else 'CC-BY-4.0' end,
       btrim(name), nullif(btrim(other_name), ''), btrim(city),
       nullif(btrim(region), ''), nullif(btrim(trade), ''), nullif(btrim(category_slug), '')
from flexs_stage_input
on conflict (source, source_ref) do update set
  name = excluded.name,
  other_name = excluded.other_name,
  city = excluded.city,
  region = excluded.region,
  trade = excluded.trade,
  category_slug = excluded.category_slug,
  staged_at = current_timestamp;

select source, count(*) as rows_in_snapshot from flexs_stage_input group by source order by source;
select count(*) as tentative_name_city_collisions
from (
  select lower(unaccent(btrim(name))), lower(unaccent(btrim(city)))
  from qmaps_ops.flexs_directory_stage
  group by 1, 2
  having count(*) > 1
) as duplicates;
