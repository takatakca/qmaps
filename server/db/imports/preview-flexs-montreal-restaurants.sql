-- Operator-only planning report. The sample requires municipal verification.
-- No catalogue rows, import metadata or staging rows are written.
\set ON_ERROR_STOP on
begin isolation level repeatable read read only;
set local statement_timeout = '30s';
set local search_path = pg_catalog, public;

do $guard$
begin
  if to_regclass('qmaps_ops.flexs_directory_stage') is null
     or to_regclass('qmaps_private.accounts') is null then
    raise exception 'QMAPS FLEXS staging is not initialized';
  end if;
  if not exists (
    select 1 from public.categories where slug = 'restaurants' and is_active
  ) then
    raise exception 'The preview requires an active restaurants category';
  end if;
  if not exists (
    select 1 from qmaps_ops.flexs_directory_stage
    where source = 'mtl_food' and licence = 'CC-BY-4.0'
  ) then
    raise exception 'No Montréal food snapshot is staged';
  end if;
end;
$guard$;

with
latest as (
  select max(staged_at) as loaded_at from qmaps_ops.flexs_directory_stage
  where source = 'mtl_food' and licence = 'CC-BY-4.0'
),
-- Include Montréal boroughs in collision checks only. They are not merged
-- into the candidate scope and never rewrite a staged municipality.
collision_municipalities(name_key) as (values
  ('montreal'), ('ahuntsiccartierville'), ('anjou'), ('cotedesneigesnotredamedegrace'),
  ('lachine'), ('lasalle'), ('leplateaumontroyal'), ('lesudouest'),
  ('lilebizardesaintegenevieve'), ('lilebizardsaintegenevieve'),
  ('mercierhochelagamaisonneuve'), ('montrealnord'), ('outremont'),
  ('pierrefondsroxboro'), ('pierrefonds'), ('roxboro'), ('rivieredesprairiespointeauxtrembles'),
  ('rivieredesprairies'), ('pointeauxtrembles'), ('rosemontlapetitepatrie'),
  ('saintlaurent'), ('saintleonard'), ('verdun'), ('villemarie'), ('villeraysaintmichelparcextension')
),
scope as (
  select s.flexs_id, s.source_ref, s.name, s.licence,
    regexp_replace(lower(unaccent(s.name)), '[^[:alnum:]]+', '', 'g') as name_key,
    nullif(regexp_replace(lower(unaccent(s.other_name)), '[^[:alnum:]]+', '', 'g'), '') as alias_key
  from qmaps_ops.flexs_directory_stage s join latest on s.staged_at = latest.loaded_at
  where s.source = 'mtl_food' and s.licence = 'CC-BY-4.0'
    and lower(unaccent(btrim(s.city))) = 'montreal'
    and lower(unaccent(btrim(s.trade))) = 'restaurant'
),
staged_name_keys as (
  select keys.name_key
  from qmaps_ops.flexs_directory_stage s
  join collision_municipalities municipalities
    on regexp_replace(lower(unaccent(s.city)), '[^[:alnum:]]+', '', 'g') = municipalities.name_key
  cross join lateral (
    values (regexp_replace(lower(unaccent(s.name)), '[^[:alnum:]]+', '', 'g')),
           (regexp_replace(lower(unaccent(s.other_name)), '[^[:alnum:]]+', '', 'g'))
  ) as keys(name_key)
  where s.licence in ('CC-BY-4.0', 'CC0-1.0') and keys.name_key <> ''
    and (s.source <> 'mtl_food' or s.staged_at = (select loaded_at from latest))
  group by keys.name_key
  having count(distinct s.flexs_id) > 1
),
qmaps_names as (
  -- Include active and inactive listings to avoid reintroducing a previously
  -- removed listing or colliding with a draft or a closed owned listing.
  select distinct regexp_replace(lower(unaccent(b.name)), '[^[:alnum:]]+', '', 'g') as name_key
  from public.businesses b join collision_municipalities municipalities
    on regexp_replace(lower(unaccent(b.city)), '[^[:alnum:]]+', '', 'g') = municipalities.name_key
),
classified as (
  select scope.flexs_id, scope.source_ref, scope.name, scope.licence,
    case
      when scope.source_ref !~ '^[1-9][0-9]{0,19}$' then 'invalid_reference'
      when scope.name_key !~ '[[:alpha:]]' then 'unusable_name'
      when existing_id.id is not null or qmap_name.name_key is not null or qmap_alias.name_key is not null then 'existing_qmaps'
      when stage_name.name_key is not null or stage_alias.name_key is not null then 'stage_name_collision'
      else 'pending_official_verification'
    end as reason
  from scope
  left join public.businesses existing_id on existing_id.id = scope.flexs_id
  left join qmaps_names qmap_name on qmap_name.name_key = scope.name_key
  left join qmaps_names qmap_alias on qmap_alias.name_key = scope.alias_key
  left join staged_name_keys stage_name on stage_name.name_key = scope.name_key
  left join staged_name_keys stage_alias on stage_alias.name_key = scope.alias_key
),
counts as (
  select reason, count(*) as quantity from classified group by reason
),
sample as (
  select source_ref, flexs_id, name, licence, 'Montréal'::text as city, 'restaurants'::text as category_slug
  from classified where reason = 'pending_official_verification'
  order by flexs_id limit 24
)
select jsonb_build_object(
  'source', 'mtl_food',
  'dataset_url', 'https://www.donneesquebec.ca/recherche/dataset/vmtl-etablissements-alimentaires',
  'licence_url', 'https://creativecommons.org/licenses/by/4.0/',
  'snapshot_at', (select loaded_at from latest),
  'scope_rows', (select count(*) from classified),
  'counts', coalesce((select jsonb_object_agg(reason, quantity) from counts), '{}'::jsonb),
  'sample', coalesce((select jsonb_agg(to_jsonb(sample) order by flexs_id) from sample), '[]'::jsonb)
);
commit;
