#!/bin/sh
set -eu

query() {
  psql -X -Atq -v ON_ERROR_STOP=1 -c "$1"
}

[ "$(query 'select current_database()')" = qmaps_flexs_stage_test ] || {
  echo 'The pilot test requires an isolated qmaps_flexs_stage_test database.' >&2
  exit 2
}

import_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../db/imports" && pwd)
fixtures=$(mktemp -d)
trap 'rm -rf "$fixtures"' EXIT
trap 'exit 1' HUP INT TERM

run() {
  sh "$import_dir/run-flexs-montreal-pilot.sh" "$@" >"$fixtures/result.json" 2>"$fixtures/result.err"
}

report() (
  action=$1 batch_id=$2 csv=$3 status=$4 published=$5 withdrawn=$6 preserved=$7 members=$8
  run "$action" "$batch_id" "$csv" || { cat "$fixtures/result.err" >&2; exit 1; }
  matched=$(psql -X -Atq -v ON_ERROR_STOP=1 -v result="$(cat "$fixtures/result.json")" \
    -v action="$action" -v batch="$batch_id" -v status="$status" -v published="$published" \
    -v withdrawn="$withdrawn" -v preserved="$preserved" -v members="$members" <<'SQL'
select 1 from (select :'result'::jsonb as report) p
where report->>'batch' = :'batch' and report->>'action' = :'action' and report->>'status' = :'status'
  and report->'published' = to_jsonb(:'published'::integer)
  and report->'withdrawn' = to_jsonb(:'withdrawn'::integer)
  and report->'preserved' = to_jsonb(:'preserved'::integer)
  and report->'members' = to_jsonb(:'members'::integer);
SQL
  )
  [ "$matched" = 1 ] || { cat "$fixtures/result.json" >&2; exit 1; }
)

fingerprint() {
  query "select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), ''))
    from public.businesses t $1;
    select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by business_id, category_id), ''))
    from public.business_categories t ${2:-};
    select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by flexs_id), ''))
    from qmaps_ops.flexs_directory_stage t;"
}

ledger_fingerprint() {
  if [ -n "$(query "select to_regclass('qmaps_ops.flexs_montreal_pilot_batches')")" ]; then
    query "select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by batch_id), ''))
        from qmaps_ops.flexs_montreal_pilot_batches t;
      select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by business_id), ''))
        from qmaps_ops.flexs_montreal_pilot_members t;"
  fi
}

refused() {
  expected_error=$1
  shift
  before=$(fingerprint '')
  prior_ledger=$(ledger_fingerprint)
  if run "$@"; then
    echo "Unsafe $1 unexpectedly passed for $(basename -- "$3")." >&2
    cat "$fixtures/result.json" >&2
    exit 1
  fi
  grep -F "$expected_error" "$fixtures/result.err" >/dev/null || { cat "$fixtures/result.err" >&2; exit 1; }
  [ "$(fingerprint '')" = "$before" ] && [ "$(ledger_fingerprint)" = "$prior_ledger" ] || {
    echo "Rejected $1 changed rows for $(basename -- "$3")." >&2
    exit 1
  }
}

prefix=fa000060-0000-5000-8000-
pilot=mtl-2099-02-01-fixture
renew=mtl-2099-02-01-renew
alpha=${prefix}000000000001
beta=${prefix}000000000002
gamma=${prefix}000000000003
delta=${prefix}000000000004
conflict_uuid=${prefix}000000000005
conflict_inactive=${prefix}000000000006
stale=${prefix}000000000007

[ "$(query "select count(*) from public.businesses where id::text like '$prefix%'")" = 0 ]
[ "$(query "select count(*) from qmaps_ops.flexs_directory_stage where flexs_id::text like '$prefix%'")" = 0 ]

# Seed a fresh snapshot directly in the disposable staging table. Keep a
# genuinely older source row, an unrelated existing listing sharing a UUID,
# and an inactive existing record sharing a normalized name and street.
psql -X -Atq -v ON_ERROR_STOP=1 <<'SQL'
insert into qmaps_ops.flexs_directory_stage
  (source, source_ref, flexs_id, licence, name, city, trade, category_slug, staged_at)
select 'mtl_food', reference, ('fa000060-0000-5000-8000-' || suffix)::uuid,
   'CC-BY-4.0', nom, 'Montréal', 'Restaurant', 'restaurants', staged_at::timestamptz
from (values
  ('960001', '000000000001', 'QA restaurant Alpha', '2099-02-01T12:00:00Z'),
  ('960002', '000000000002', 'QA restaurant Bêta', '2099-02-01T12:00:00Z'),
  ('960003', '000000000003', 'QA restaurant Gamma', '2099-02-01T12:00:00Z'),
  ('960004', '000000000004', 'QA restaurant Delta', '2099-02-01T12:00:00Z'),
  ('960005', '000000000005', 'QA restaurant ID', '2099-02-01T12:00:00Z'),
  ('960006', '000000000006', 'QA café inactif', '2099-02-01T12:00:00Z'),
  ('960007', '000000000007', 'QA restaurant ancien', '2099-01-01T12:00:00Z')
) seed(reference, suffix, nom, staged_at);

insert into public.businesses (id, name, address, city, is_active, status) values
  ('fa000060-0000-5000-8000-000000000005', 'QA fiche sans lien', 'Adresse existante', 'Québec', true, 'open'),
  ('fa000060-0000-5000-8000-000000000008', 'QA Cafe Inactif', '106 rue Recette', 'Montréal', false, 'hidden');
SQL

header='id_qmaps_propose,reference_municipale,nom,adresse_publique,ville,province,categorie_qmaps,source,licence'
entry() {
  printf '%s,%s,%s,"%s",Montréal,QC,restaurants,Ville de Montréal — Établissements alimentaires,CC BY 4.0\n' "$@"
}

{
  printf '%s\n' "$header"
  entry "$alpha" 960001 'QA restaurant Alpha' '101 rue Recette'
  entry "$beta" 960002 'QA restaurant Bêta' '102 rue Recette'
  entry "$gamma" 960003 'QA restaurant Gamma' '103 rue Recette'
} >"$fixtures/pilot.csv"
{
  printf '%s\n' "$header"
  entry "$delta" 960004 'QA restaurant Delta' '104 rue Recette'
} >"$fixtures/renew.csv"

sed 's/QA restaurant Bêta/QA nom municipal divergent/' "$fixtures/pilot.csv" >"$fixtures/bad-name.csv"
sed 's/960002/969999/' "$fixtures/pilot.csv" >"$fixtures/unknown-reference.csv"
sed 's/CC BY 4.0/ODbL 1.0/' "$fixtures/pilot.csv" >"$fixtures/bad-licence.csv"
cp "$fixtures/renew.csv" "$fixtures/stale.csv"
entry "$stale" 960007 'QA restaurant ancien' '107 rue Recette' >>"$fixtures/stale.csv"
cp "$fixtures/renew.csv" "$fixtures/id-conflict.csv"
entry "$conflict_uuid" 960005 'QA restaurant ID' '105 rue Recette' >>"$fixtures/id-conflict.csv"
cp "$fixtures/renew.csv" "$fixtures/inactive-conflict.csv"
entry "$conflict_inactive" 960006 'QA café inactif' '106 rue Recette' >>"$fixtures/inactive-conflict.csv"

for invalid in bad-name unknown-reference stale; do
  refused 'not in the latest staged Montréal restaurant cohort' publish "$pilot" "$fixtures/$invalid.csv"
done
refused 'Invalid Montréal pilot row' publish "$pilot" "$fixtures/bad-licence.csv"
for invalid in id-conflict inactive-conflict; do
  refused 'collides with an existing QMAPS' publish "$pilot" "$fixtures/$invalid.csv"
done

filter="id not in ('$alpha','$beta','$gamma','$delta')"
link_filter="business_id not in ('$alpha','$beta','$gamma','$delta')"
original=$(fingerprint "where $filter" "where $link_filter")

report publish "$pilot" "$fixtures/pilot.csv" published 3 0 0 3
[ "$(query "select count(*) from unnest(array['anon','authenticated','qmaps_gateway','service_role']) role_name
  cross join unnest(array['qmaps_ops.flexs_montreal_pilot_batches','qmaps_ops.flexs_montreal_pilot_members']) table_name
  where has_table_privilege(role_name, table_name, 'SELECT,INSERT,UPDATE,DELETE')")" = 0 ]
[ "$(query "select count(*) from public.businesses b where b.id in ('$alpha','$beta','$gamma')
  and b.is_active and b.status = 'open' and not b.is_open and not b.is_claimed and b.owner_user_id is null
  and b.country = 'CA' and b.region = 'QC' and b.city = 'Montréal'
  and b.latitude is null and b.longitude is null and b.phone is null and b.website is null
  and b.hours is null and b.hours_json is null and b.reviews_count = 0 and b.avg_rating = 0
  and b.attributes #>> '{qmaps_directory_import,source}' = 'mtl_food'
  and b.attributes #>> '{qmaps_directory_import,external_id}' = (960000 + right(b.id::text, 1)::int)::text
  and b.attributes #>> '{qmaps_directory_import,licence}' = 'CC-BY-4.0'
  and b.attributes #>> '{qmaps_directory_import,cohort}' = '$pilot'
  and (select array_agg(c.slug order by c.slug) from public.business_categories bc
       join public.categories c on c.id = bc.category_id where bc.business_id = b.id) = array['restaurants']")" = 3 ]

published=$(fingerprint '')
published_ledger=$(ledger_fingerprint)
report publish "$pilot" "$fixtures/pilot.csv" already_published 0 0 0 3
[ "$(fingerprint '')" = "$published" ]
[ "$(ledger_fingerprint)" = "$published_ledger" ]
refused 'does not match this batch receipt' publish "$pilot" "$fixtures/renew.csv"
refused 'does not match this batch receipt' withdraw "$pilot" "$fixtures/renew.csv"

# Ratings do not block withdrawal of an otherwise unchanged listing. A real
# title edit or a claim must protect the affected listing and all its links.
query "update public.businesses set reviews_count = 4, avg_rating = 4.75 where id = '$alpha';
  update public.businesses set name = 'QA fiche renommée' where id = '$beta';
  update public.businesses set is_claimed = true where id = '$gamma';" >/dev/null
protected_rows() {
  query "select to_jsonb(t)::text from public.businesses t where id in ('$beta','$gamma') order by id;
    select to_jsonb(t)::text from public.business_categories t where business_id in ('$beta','$gamma') order by business_id, category_id;"
}
protected=$(protected_rows)
report withdraw "$pilot" "$fixtures/pilot.csv" preserved 0 1 2 3
[ "$(query "select count(*) from public.businesses where id = '$alpha' and not is_active and reviews_count = 4")" = 1 ]
[ "$(protected_rows)" = "$protected" ]

terminal=$(fingerprint '')
terminal_ledger=$(ledger_fingerprint)
report withdraw "$pilot" "$fixtures/pilot.csv" already_withdrawn 0 0 2 3
report publish "$pilot" "$fixtures/pilot.csv" already_withdrawn 0 0 2 3
[ "$(fingerprint '')" = "$terminal" ]
[ "$(ledger_fingerprint)" = "$terminal_ledger" ]
refused 'already belongs to a Montréal pilot receipt' publish "$renew" "$fixtures/pilot.csv"

report publish "$renew" "$fixtures/renew.csv" published 1 0 0 1
report withdraw "$renew" "$fixtures/renew.csv" withdrawn 0 1 0 1
report publish "$renew" "$fixtures/renew.csv" already_withdrawn 0 0 0 1
[ "$(query "select count(*) from public.businesses where id = '$delta' and not is_active")" = 1 ]
[ "$(fingerprint "where $filter" "where $link_filter")" = "$original" ] || {
  echo 'The pilot altered an unrelated listing, category link or staged row.' >&2
  exit 1
}
echo 'FLEXS pilot verified: exact snapshots, atomic refusal, ownership protection, bounded withdrawal and no resurrection'
