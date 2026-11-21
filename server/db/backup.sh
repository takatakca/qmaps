#!/bin/sh
set -eu
umask 077
export PGHOST=/var/run/postgresql PGUSER=postgres PGDATABASE=qmaps
root=/var/backups/qmaps
stamp=$(date -u +%Y%m%dT%H%M%SZ)
temporary=$(mktemp "$root/.qmaps-$stamp-XXXXXX")
trap 'rm -f "$temporary"' EXIT
pg_dump --format=custom --file="$temporary"
pg_restore --list "$temporary" >/dev/null
archive="$root/qmaps-$stamp-$$.dump"
mv "$temporary" "$archive"
# Only files created by this script match. Keep the latest seven complete dumps.
ls -1t "$root"/qmaps-*.dump | sed -n '8,$p' | while IFS= read -r stale; do rm -f "$stale"; done
printf '%s\n' "$archive"
