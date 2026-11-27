#!/bin/sh
set -eu

[ "$(psql -X -Atq -c 'select current_database()')" = qmaps_flexs_stage_test ] || {
  echo 'The staging test requires an isolated qmaps_flexs_stage_test database.' >&2
  exit 2
}

import_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../db/imports" && pwd)
fixtures=$(mktemp -d)
trap 'rm -rf "$fixtures"' EXIT HUP INT TERM

query() {
  psql -X -Atq -v ON_ERROR_STOP=1 -c "$1"
}
stage() {
  sh "$import_dir/stage-flexs-directory.sh" "$1" "$2" >"$fixtures/stage.log" 2>&1
}
refused() {
  if stage "$1" "$2"; then
    echo 'Rejected input unexpectedly passed' >&2
    exit 1
  fi
  grep -F "$3" "$fixtures/stage.log" >/dev/null
}

header='id,source,source_ref,name,other_name,city,region,province,trade,category_slug,status'
open='78a51b78-9fd5-55fa-bb19-e66ec342463f,mtl_food,alpha,Café Stage,,Montréal,,QC,Restaurant,restaurants,listed'
osm='d1223df3-da15-5a0d-901d-b9c76f411a58,osm,bravo,Cafe Stage,,Montreal,,QC,Restaurant,restaurants,claimed'
printf '%s\n%s\n' "$header" "$open" >"$fixtures/open.csv"
printf '%s\n%s\n' "$header" "$osm" >"$fixtures/osm.csv"
sh "$(dirname -- "$0")/flexs-restaurant-preview.sh"
baseline=$(query 'select count(*) from public.businesses')

stage open "$fixtures/open.csv" || { cat "$fixtures/stage.log" >&2; exit 1; }
stage odbl "$fixtures/osm.csv" || { cat "$fixtures/stage.log" >&2; exit 1; }
stage open "$fixtures/open.csv" || { cat "$fixtures/stage.log" >&2; exit 1; }
[ "$(query 'select count(*) from qmaps_ops.flexs_directory_stage')" = 2 ]
[ "$(query "select count(*) from qmaps_ops.flexs_directory_stage where (source, licence) in (('mtl_food','CC-BY-4.0'),('osm','ODbL-1.0'))")" = 2 ]
grep -A2 'tentative_name_city_collisions' "$fixtures/stage.log" | grep -Eq '[[:space:]]1[[:space:]]*$'

refused open "$fixtures/osm.csv" 'incompatible source'
printf '%s\n%s\n%s\n' "$header" "$open" "$open" >"$fixtures/duplicate.csv"
refused open "$fixtures/duplicate.csv" 'Duplicate source ID'
sed 's/,QC,/,ON,/' "$fixtures/open.csv" >"$fixtures/out-of-province.csv"
refused open "$fixtures/out-of-province.csv" 'out-of-province'
sed 's/,listed$/,removed/' "$fixtures/open.csv" >"$fixtures/removed.csv"
refused open "$fixtures/removed.csv" 'Non-public'
sed 's/^78a51b78-9fd5-55fa-bb19-e66ec342463f/4683d973-54c5-53e3-bbb3-fee19adbd971/' "$fixtures/open.csv" >"$fixtures/identity.csv"
refused open "$fixtures/identity.csv" 'Source identity changed'
sed '1s/,status$/,email/' "$fixtures/open.csv" >"$fixtures/private-column.csv"
refused open "$fixtures/private-column.csv" 'column name mismatch'

[ "$(query 'select count(*) from public.businesses')" = "$baseline" ]
[ "$(query 'select count(*) from qmaps_ops.flexs_directory_stage')" = 2 ]
[ "$(query "select count(*) from unnest(array['anon','authenticated','qmaps_gateway']) as role_name where has_table_privilege(role_name,'qmaps_ops.flexs_directory_stage','SELECT')")" = 0 ]
echo 'FLEXS staging verified: license separation, idempotence, rollback, private results, unchanged public catalogue'
