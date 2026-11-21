#!/bin/sh
# Run in the QMAPS PostgreSQL container, from this checkout. Refuses an existing foreign application database.
set -eu
umask 077
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
batch=$(mktemp)
trap 'rm -f "$batch"' EXIT
export PGUSER="${PGUSER:-supabase_admin}" PGDATABASE="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"
case "${PGHOST:-/var/run/postgresql}" in /*|127.0.0.1|localhost) ;; *) echo "Local PostgreSQL connection required" >&2; exit 1;; esac
cat > "$batch" <<'SQL'
\set ON_ERROR_STOP on
select pg_advisory_lock(hashtext('qmaps-self-host-install'));
do $guard$ begin
  if to_regclass('public.businesses') is not null and to_regclass('qmaps_ops.applied_migrations') is null then
    raise exception 'Existing application data without a QMAPS install ledger';
  end if;
end $guard$;
begin;
create schema if not exists qmaps_ops;
revoke all on schema qmaps_ops from public, anon, authenticated;
create table if not exists qmaps_ops.applied_migrations (version text primary key, checksum text not null, applied_at timestamptz not null default now());
create table if not exists qmaps_ops.initial_examples (id uuid primary key);
commit;
SQL
append_sql() {
  path=$1
  version=$2
  checksum=$(sha256sum "$path" | cut -d' ' -f1)
  cat >> "$batch" <<SQL
begin;
do \$guard\$ begin
  if exists (select 1 from qmaps_ops.applied_migrations where version='$version' and checksum<>'$checksum') then
    raise exception 'Recorded QMAPS migration checksum changed: $version';
  end if;
end \$guard\$;
select not exists(select 1 from qmaps_ops.applied_migrations where version='$version') as run_file \gset
\if :run_file
\i '$path'
SQL
  if [ "$version" = 20260228064647 ]; then
    echo 'insert into qmaps_ops.initial_examples select id from public.businesses;' >> "$batch"
  fi
  cat >> "$batch" <<SQL
insert into qmaps_ops.applied_migrations(version,checksum) values ('$version','$checksum');
\endif
commit;
SQL
}
for path in "$root"/supabase/migrations/*.sql; do
  name=${path##*/}
  append_sql "$path" "${name%%_*}"
done
append_sql "$root/ops/self-host/demo.sql" demo-001
cat >> "$batch" <<'SQL'
notify pgrst, 'reload schema';
select count(*) as recorded_install_steps from qmaps_ops.applied_migrations;
select pg_advisory_unlock(hashtext('qmaps-self-host-install'));
SQL
psql -X -q -f "$batch"
