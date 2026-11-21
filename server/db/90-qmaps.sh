#!/bin/sh
set -eu
: "${QMAPS_GATEWAY_PASSWORD:?An application database password is required}"
export PGUSER="${POSTGRES_USER:-postgres}" PGDATABASE="${POSTGRES_DB:-qmaps}" PGHOST=/var/run/postgresql
psql -X -v ON_ERROR_STOP=1 -v gateway_password="$QMAPS_GATEWAY_PASSWORD" -f /opt/qmaps/server/db/00-foundation.sql
sh /opt/qmaps/ops/self-host/install.sh
psql -X -v ON_ERROR_STOP=1 -f /opt/qmaps/server/db/99-api-grants.sql
