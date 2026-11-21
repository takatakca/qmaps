#!/bin/sh
set -eu
# Rehearse a logical restore on a matching QMAPS Coolify PostgreSQL installation.
: "${1:?Supply the PostgreSQL custom-format archive to rehearse}"
case "${PGHOST:-/var/run/postgresql}" in /*|127.0.0.1|localhost) ;; *) echo 'A local PostgreSQL connection is required' >&2; exit 1;; esac
export PGUSER="${PGUSER:-supabase_admin}" PGHOST="${PGHOST:-/var/run/postgresql}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"
archive=$1
test -s "$archive"
umask 077
stage=$(mktemp -d /tmp/qmaps-restore-roles.XXXXXX)
trial=qmaps_restore_roles_$(date -u +%s)_$$
createdb -T template0 "$trial"
trap 'dropdb --if-exists "$trial"; rm -rf -- "$stage"' EXIT
pg_restore -l "$archive" > "$stage/toc"
awk 'index($0, " ACL graphql_public FUNCTION graphql(")==0' "$stage/toc" > "$stage/base"
awk 'index($0, " ACL graphql_public FUNCTION graphql(")>0' "$stage/toc" > "$stage/adapter_acl"
if ! pg_restore --exit-on-error --use-list="$stage/base" --dbname="$trial" "$archive" >"$stage/log" 2>&1; then sed -n '1,3p' "$stage/log"; exit 1; fi
# The image supplies this wrapper. Its ACL can be in a dump without its definition.
# On recovery the donor is the initialized postgres database of the matching template.
if test -s "$stage/adapter_acl"; then
 if test "$(psql -XAtd "$trial" -c "select to_regprocedure('graphql_public.graphql(text,text,jsonb,jsonb)') is null")" = t; then
  psql -XAtd postgres -c "select pg_get_functiondef('graphql_public.graphql(text,text,jsonb,jsonb)'::regprocedure)" > "$stage/adapter.sql"
  psql -Xq -v ON_ERROR_STOP=1 -d "$trial" -f "$stage/adapter.sql"
 fi
 if ! pg_restore --exit-on-error --use-list="$stage/adapter_acl" --dbname="$trial" "$archive" >"$stage/acl.log" 2>&1; then sed -n '1,3p' "$stage/acl.log"; exit 1; fi
fi
psql -XqAt -v ON_ERROR_STOP=1 -d "$trial" <<'QMAPSSQL'
set role anon;
select 'QMAPS_RESTORED_ANON_CATALOGUE '||count(*) from public.businesses;
do $ begin
  if has_table_privilege(current_user,'public.business_mail','select') then
    raise exception 'The anonymous role has access to private merchant mail';
  end if;
end $;
select 'QMAPS_RESTORED_PRIVATE_MAIL_BLOCKED true';
reset role;
select 'QMAPS_RESTORED_MIGRATIONS '||count(*) from qmaps_ops.applied_migrations;
QMAPSSQL
