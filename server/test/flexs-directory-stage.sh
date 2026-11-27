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
  grep -F "$3" "$fixtures/stage.log" >/dev/null || { cat "$fixtures/stage.log" >&2; exit 1; }
}
fingerprint() {
  query "select md5(coalesce(string_agg(to_jsonb(s)::text, E'\n' order by flexs_id), ''))
    from qmaps_ops.flexs_directory_stage s;
    select md5(coalesce(string_agg(to_jsonb(r)::text, E'\n' order by source_family), ''))
    from qmaps_ops.flexs_directory_snapshots r;"
}

header='id,source,source_ref,name,other_name,city,region,province,trade,category_slug,status'
open='78a51b78-9fd5-55fa-bb19-e66ec342463f,mtl_food,alpha,Café Stage,,Montréal,,QC,Restaurant,restaurants,listed'
older='da000058-0000-4000-8000-000000000001,mtl_food,stage-archived,Café Archivé,,Québec,,QC,Restaurant,restaurants,listed'
extra='da000058-0000-4000-8000-000000000002,rbq,stage-rbq,QA RBQ,,Québec,,QC,Construction,,listed
da000058-0000-4000-8000-000000000003,mtl_shops,stage-shops,QA Magasin,,Montréal,,QC,Commerce,,listed
da000058-0000-4000-8000-000000000004,opc,stage-opc,QA OPC,,Québec,,QC,Commerce,,listed
da000058-0000-4000-8000-000000000005,sit,stage-sit,QA SIT,,Québec,,QC,Tourisme,,listed
da000058-0000-4000-8000-000000000006,shb,stage-shb,QA Sherbrooke,,Sherbrooke,,QC,Commerce,,listed'
osm='d1223df3-da15-5a0d-901d-b9c76f411a58,osm,bravo,Cafe Stage,,Montreal,,QC,Restaurant,restaurants,claimed'
printf '%s\n' "$header" "$open" "$older" "$extra" >"$fixtures/open.csv"
printf '%s\n%s\n' "$header" "$osm" >"$fixtures/osm.csv"
sh "$(dirname -- "$0")/flexs-restaurant-preview.sh"
baseline=$(query 'select count(*) from public.businesses')
[ "$(query 'select count(*) from qmaps_ops.flexs_directory_stage')" = 0 ]
[ "$(query 'select count(*) from qmaps_ops.flexs_directory_snapshots')" = 0 ]

stage open "$fixtures/open.csv" || { cat "$fixtures/stage.log" >&2; exit 1; }
stage odbl "$fixtures/osm.csv" || { cat "$fixtures/stage.log" >&2; exit 1; }
stage open "$fixtures/open.csv" || { cat "$fixtures/stage.log" >&2; exit 1; }
[ "$(query 'select count(*) from qmaps_ops.flexs_directory_stage')" = 8 ]
[ "$(query "select count(*) from qmaps_ops.flexs_directory_stage where (source, licence) in (('mtl_food','CC-BY-4.0'),('osm','ODbL-1.0'),('shb','CC0-1.0'))")" = 4 ]
[ "$(query "select source_counts = '{\"rbq\":1,\"mtl_food\":2,\"mtl_shops\":1,\"opc\":1,\"sit\":1,\"shb\":1}'::jsonb
  from qmaps_ops.flexs_directory_snapshots where source_family='open'")" = t ]
[ "$(query "select source_counts = '{\"osm\":1}'::jsonb from qmaps_ops.flexs_directory_snapshots where source_family='odbl'")" = t ]
grep -A2 'tentative_name_city_collisions' "$fixtures/stage.log" | grep -Eq '[[:space:]]1[[:space:]]*$'

before=$(fingerprint)
sed '/,mtl_shops,/d; s/QA RBQ/QA rejected update/' "$fixtures/open.csv" >"$fixtures/missing-source.csv"
refused open "$fixtures/missing-source.csv" 'Snapshot missing required source(s): mtl_shops'
[ "$(fingerprint)" = "$before" ]

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

[ "$(fingerprint)" = "$before" ]

# One discontinued record is not a missing source. Its old row stays archived
# while the complete new open receipt names only the current rows.
sed '/,stage-archived,/d' "$fixtures/open.csv" >"$fixtures/new-open.csv"
stage open "$fixtures/new-open.csv" || { cat "$fixtures/stage.log" >&2; exit 1; }
[ "$(query "select source_counts->>'mtl_food' from qmaps_ops.flexs_directory_snapshots where source_family='open'")" = 1 ]
[ "$(query "select count(*) from qmaps_ops.flexs_directory_stage s, qmaps_ops.flexs_directory_snapshots r
  where r.source_family='open' and s.source='mtl_food' and s.source_ref='stage-archived' and s.staged_at < r.staged_at")" = 1 ]
[ "$(query "select count(*) from qmaps_ops.flexs_directory_stage s, qmaps_ops.flexs_directory_snapshots r
  where r.source_family='open' and s.source <> 'osm' and s.staged_at = r.staged_at")" = 6 ]

[ "$(query 'select count(*) from public.businesses')" = "$baseline" ]
[ "$(query 'select count(*) from qmaps_ops.flexs_directory_stage')" = 8 ]
[ "$(query "select count(*) from unnest(array['anon','authenticated','qmaps_gateway','service_role']) role_name
  cross join unnest(array['qmaps_ops.flexs_directory_stage','qmaps_ops.flexs_directory_snapshots']) table_name
  where has_table_privilege(role_name, table_name, 'SELECT,INSERT,UPDATE,DELETE')")" = 0 ]

# Leave the empty, initialized schema for the subsequent no-receipt pilot test.
query "delete from qmaps_ops.flexs_directory_stage where flexs_id::text like 'da000058-%'
  or flexs_id in ('78a51b78-9fd5-55fa-bb19-e66ec342463f','d1223df3-da15-5a0d-901d-b9c76f411a58');
  delete from qmaps_ops.flexs_directory_snapshots where source_family in ('open','odbl');" >/dev/null
echo 'FLEXS staging verified: complete source receipts, omitted row archives, atomic refusal, private results, unchanged public catalogue'
