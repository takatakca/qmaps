#!/bin/sh
set -eu
export PGHOST=/var/run/postgresql PGUSER=postgres
archive=${1:?Provide the path returned by backup.sh}
target=qmaps_restore_check_$$
createdb --template=template0 "$target"
trap 'dropdb --if-exists "$target"' EXIT
pg_restore --exit-on-error --dbname="$target" "$archive"
psql -X -d "$target" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'public_catalogue', count(*) FROM public.businesses;
SELECT 'private_accounts', count(*) FROM qmaps_private.accounts;
DO $check$
BEGIN
  IF has_table_privilege('anon','qmaps_private.accounts','SELECT') THEN
    RAISE EXCEPTION 'Anonymous account-table access after restore';
  END IF;
END
$check$;
SQL
