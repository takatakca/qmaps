#!/bin/sh
set -eu
script=$(mktemp)
trap 'rm -f "$script"' EXIT
cat > "$script" <<'SQL'
SELECT pg_advisory_lock(hashtextextended('QMAPS database migrations',0));
CREATE TABLE IF NOT EXISTS qmaps_private.schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL
for migration in /opt/qmaps/server/db/upgrades/[0-9][0-9][0-9]-*.sql; do
    name=$(basename "$migration")
    case "$name" in *[!a-z0-9.-]*) echo "Invalid migration filename" >&2; exit 1;; esac
    cat >> "$script" <<SQL
SELECT NOT EXISTS (SELECT 1 FROM qmaps_private.schema_migrations WHERE filename='$name') AS pending \gset
\if :pending
\ir $migration
INSERT INTO qmaps_private.schema_migrations(filename) VALUES ('$name');
\endif
SQL
done
psql -X -v ON_ERROR_STOP=1 -f "$script"
