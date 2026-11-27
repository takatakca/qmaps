#!/bin/sh
set -eu

query() {
  psql -X -Atq -v ON_ERROR_STOP=1 -c "$1"
}

[ "$(query 'select current_database()')" = qmaps_flexs_stage_test ] || {
  echo 'The preview test requires an isolated qmaps_flexs_stage_test database.' >&2
  exit 2
}

import_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../db/imports" && pwd)
fixtures=$(mktemp -d)

preview() {
  PGOPTIONS="${PGOPTIONS:+$PGOPTIONS }-c default_transaction_read_only=on" \
    psql -X -Atq -v ON_ERROR_STOP=1 -f "$import_dir/preview-flexs-montreal-restaurants.sql"
}

refused() {
  if preview >"$fixtures/preview.out" 2>"$fixtures/preview.err"; then
    echo 'Preview unexpectedly succeeded.' >&2
    exit 1
  fi
  grep -F "$1" "$fixtures/preview.err" >/dev/null || { cat "$fixtures/preview.err" >&2; exit 1; }
  [ ! -s "$fixtures/preview.out" ]
}

verify_report() {
  # psql quotes the whole report as a single SQL literal. A second JSON
  # document, non-JSON output or the wrong object shape then fails the test.
  matched=$(psql -X -Atq -v ON_ERROR_STOP=1 -v report_json="$(cat "$1")" <<SQL
select 1 from (select :'report_json'::jsonb as report) payload where $2;
SQL
  ) || return 1
  [ "$matched" = 1 ]
}

fingerprint() {
  category_row='to_jsonb(t)'
  if [ "${1-}" = cleanup ]; then
    # Only fixture setup restores is_active. PostgreSQL also refreshes its timestamp.
    category_row="case when slug = 'restaurants' then to_jsonb(t) - 'updated_at' else to_jsonb(t) end"
  fi
  query "select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), '')) from public.businesses t;
    select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by business_id, category_id), '')) from public.business_categories t;
    select md5(coalesce(string_agg(($category_row)::text, E'\n' order by id), '')) from public.categories t;
    select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by flexs_id), '')) from qmaps_ops.flexs_directory_stage t;"
}

# The staging harness starts fresh. Check the missing snapshot before inserting
# any fixtures so this case never needs to remove an existing staged source.
trap 'rm -rf "$fixtures"' EXIT HUP INT TERM
if [ -z "$(query "select to_regclass('qmaps_ops.flexs_directory_stage')")" ]; then
  refused 'QMAPS FLEXS staging is not initialized'
  psql -X -Atq -v ON_ERROR_STOP=1 -v source_family=open --single-transaction \
    -f "$import_dir/flexs-directory-stage-init.sql" >/dev/null
fi
[ "$(query "select count(*) from qmaps_ops.flexs_directory_stage where source = 'mtl_food'")" = 0 ]
[ "$(query "select count(*) from public.categories where slug = 'restaurants' and is_active")" = 1 ]
[ "$(query "select count(*) from public.businesses where left(id::text, 9) = 'ca000059-'")" = 0 ]
[ "$(query "select count(*) from qmaps_ops.flexs_directory_stage where left(flexs_id::text, 9) = 'ca000059-'")" = 0 ]
refused 'No Montréal food snapshot is staged'

baseline=$(fingerprint cleanup)
cleanup() {
  query "delete from qmaps_ops.flexs_directory_stage where left(flexs_id::text, 9) = 'ca000059-';
    delete from public.businesses where left(id::text, 9) = 'ca000059-';
    update public.categories set is_active = true where slug = 'restaurants' and not is_active;" >/dev/null
  rm -rf "$fixtures"
}
trap cleanup EXIT HUP INT TERM

psql -X -Atq -v ON_ERROR_STOP=1 <<'SQL'
insert into public.businesses (id, name, address, city, is_active) values
  ('ca000059-0000-4000-8000-0000000000aa', 'QA fiche historique', 'Adresse de recette', 'Québec', false),
  ('ca000059-0000-4000-8000-0000000000bb', 'Café du Quartier d’Or', 'Adresse de recette', 'Saint-Léonard', false),
  ('ca000059-0000-4000-8000-0000000000cc', 'QA aperçu 01', 'Adresse de recette', 'Laval', true),
  ('ca000059-0000-4000-8000-0000000000dd', 'Café Place-des-Arts', 'Adresse de recette', 'Ville-Marie', true);

insert into qmaps_ops.flexs_directory_stage (source, source_ref, flexs_id, licence, name, other_name, city, trade, staged_at)
select 'mtl_food', (490000 + i)::text,
  ('ca000059-0000-4000-8000-' || lpad(to_hex(i), 12, '0'))::uuid,
  'CC-BY-4.0', 'QA aperçu ' || lpad(i::text, 2, '0'),
  case when i = 2 then 'QA-apercu 02' end,
  case when i = 30 then '  mOnTrÉaL  ' else 'Montréal' end,
  case when i = 30 then ' RESTAURANT ' else 'Restaurant' end,
  '2099-02-01T00:00:00Z'::timestamptz
from generate_series(1, 30) i
order by i desc;

insert into qmaps_ops.flexs_directory_stage (source, source_ref, flexs_id, licence, name, other_name, city, trade, staged_at) values
  ('mtl_food', '490101', 'ca000059-0000-4000-8000-000000000101', 'CC-BY-4.0', 'QA aperçu 01', null, 'Montréal', 'Restaurant', '2099-01-01T00:00:00Z'),
  ('osm', 'node/490102', 'ca000059-0000-4000-8000-000000000102', 'ODbL-1.0', 'QA aperçu 01', null, 'Montréal', 'Restaurant', '2099-03-01T00:00:00Z'),
  ('mtl_food', '490103', 'ca000059-0000-4000-8000-000000000103', 'CC-BY-4.0', 'QA hors municipalité', null, 'Montréal-Nord', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490104', 'ca000059-0000-4000-8000-000000000104', 'CC-BY-4.0', 'QA hors activité', null, 'Montréal', 'Épicerie', '2099-02-01T00:00:00Z'),
  ('mtl_food', '0490105', 'ca000059-0000-4000-8000-000000000105', 'CC-BY-4.0', 'QA référence invalide', null, 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490106', 'ca000059-0000-4000-8000-000000000106', 'CC-BY-4.0', '— 123 !', null, 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490107', 'ca000059-0000-4000-8000-0000000000aa', 'CC-BY-4.0', 'QA fiche autre nom', null, 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490108', 'ca000059-0000-4000-8000-000000000108', 'CC-BY-4.0', 'cafe-du-quartier d''or', null, 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490109', 'ca000059-0000-4000-8000-000000000109', 'CC-BY-4.0', 'Café D’Or Recette', null, 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490110', 'ca000059-0000-4000-8000-000000000110', 'CC-BY-4.0', 'cafe d or recette', null, 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490111', 'ca000059-0000-4000-8000-000000000111', 'CC-BY-4.0', 'QA Traiteur Mixte', null, 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_shops', '490112', 'ca000059-0000-4000-8000-000000000112', 'CC-BY-4.0', 'QA autre source', 'qa traiteur-mixte', 'Anjou', null, '2099-02-01T00:00:00Z'),
  ('mtl_food', '490114', 'ca000059-0000-4000-8000-000000000114', 'CC-BY-4.0', 'QA enseigne unique', 'cafe place des arts', 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_food', '490115', 'ca000059-0000-4000-8000-000000000115', 'CC-BY-4.0', 'QA collision par alias', 'qa alias 2 etats', 'Montréal', 'Restaurant', '2099-02-01T00:00:00Z'),
  ('mtl_shops', '490116', 'ca000059-0000-4000-8000-000000000116', 'CC-BY-4.0', 'QA Alias 2 États', null, 'Verdun', null, '2099-02-01T00:00:00Z');
SQL

before=$(fingerprint)
preview >"$fixtures/preview.json"
verify_report "$fixtures/preview.json" "
  report->>'source' = 'mtl_food' and report->'scope_rows' = '39'::jsonb
  and report->'counts' = jsonb_build_object(
    'pending_official_verification', 30, 'invalid_reference', 1, 'unusable_name', 1,
    'existing_qmaps', 3, 'stage_name_collision', 4
  )
  and jsonb_array_length(report->'sample') = 24
  and not exists (
    select 1 from jsonb_array_elements(report->'sample') with ordinality sample(item, n)
    where item is distinct from jsonb_build_object(
      'source_ref', (490000 + n)::text,
      'flexs_id', 'ca000059-0000-4000-8000-' || lpad(to_hex(n), 12, '0'),
      'name', 'QA aperçu ' || lpad(n::text, 2, '0'),
      'licence', 'CC-BY-4.0', 'city', 'Montréal', 'category_slug', 'restaurants'
    )
  )" || { cat "$fixtures/preview.json" >&2; exit 1; }
preview >"$fixtures/repeated.json"
cmp "$fixtures/preview.json" "$fixtures/repeated.json"
[ "$(fingerprint)" = "$before" ]

query "update public.categories set is_active = false where slug = 'restaurants'" >/dev/null
refused 'The preview requires an active restaurants category'
query "update public.categories set is_active = true where slug = 'restaurants'" >/dev/null

# A newer mtl_food batch with zero qualifying rows must not resurrect the
# older eligible sample. The ODbL batch above must not drive the batch cut.
query "insert into qmaps_ops.flexs_directory_stage
  (source, source_ref, flexs_id, licence, name, city, trade, staged_at) values
  ('mtl_food', '490113', 'ca000059-0000-4000-8000-000000000113', 'CC-BY-4.0',
    'QA hors dernière recette', 'Québec', 'Restaurant', '2099-04-01T00:00:00Z')" >/dev/null
preview >"$fixtures/empty.json"
verify_report "$fixtures/empty.json" "
  report->'scope_rows' = '0'::jsonb and report->'counts' = '{}'::jsonb and report->'sample' = '[]'::jsonb
" || { cat "$fixtures/empty.json" >&2; exit 1; }

cleanup
trap - EXIT HUP INT TERM
[ "$(fingerprint cleanup)" = "$baseline" ] || { echo 'Preview fixture cleanup changed the database baseline.' >&2; exit 1; }
echo 'FLEXS preview verified: latest snapshot, collisions, bounded read-only sample and fail-closed guards'
