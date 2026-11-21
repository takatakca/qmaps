#!/bin/sh
# An operator runs this inside the owned database container after verifying the account holder.
set -eu
: "${1:?Provide the UUID of the verified QMAPS owner account}"
case "${PGHOST:-/var/run/postgresql}" in /*|127.0.0.1|localhost) ;; *) echo 'Local database required' >&2; exit 1;; esac
export PGUSER="${PGUSER:-supabase_admin}" PGDATABASE="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"
psql -X -q -v ON_ERROR_STOP=1 -v qmaps_owner="$1" <<'SQL'
begin;
select id as confirmed_id from auth.users
where id=:'qmaps_owner'::uuid and email is not null and email_confirmed_at is not null
and deleted_at is null for update \gset
insert into public.user_roles(user_id,role) values (:'confirmed_id','admin') on conflict(user_id,role) do nothing;
commit;
SQL
