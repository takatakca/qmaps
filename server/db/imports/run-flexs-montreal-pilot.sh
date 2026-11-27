#!/bin/sh
set -eu
umask 077

if [ "$#" -ne 3 ] || [ ! -f "$3" ] || [ ! -r "$3" ]; then
  echo 'Usage: sh run-flexs-montreal-pilot.sh publish|withdraw mtl-YYYY-MM-DD-tag /path/to/approved-pilot.csv' >&2
  exit 2
fi
case "$1" in
  publish|withdraw) ;;
  *) echo 'Expected publish or withdraw.' >&2; exit 2 ;;
esac
case "$2" in
  *[!a-z0-9-]*) echo 'Invalid Montréal pilot batch identifier.' >&2; exit 2 ;;
esac
if ! printf '%s\n' "$2" | LC_ALL=C grep -Eq '^mtl-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9][a-z0-9-]{0,31}$'; then
  echo 'Invalid Montréal pilot batch identifier.' >&2
  exit 2
fi

import_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT
trap 'exit 1' HUP INT TERM

# The review CSV can come from a spreadsheet export. Strip only an initial
# UTF-8 signature, and copy to a private file before opening the transaction.
LC_ALL=C head -c 131073 <"$3" >"$work_dir/original"
bytes=$(LC_ALL=C wc -c <"$work_dir/original")
if [ "$bytes" -lt 1 ] || [ "$bytes" -gt 131072 ]; then
  echo 'Invalid Montréal pilot manifest size.' >&2
  exit 2
fi
bom=$(printf '\357\273\277')
LC_ALL=C sed "1s/^$bom//" "$work_dir/original" >"$work_dir/manifest"

PGCLIENTENCODING=UTF8 psql -X -Atq --single-transaction --set=ON_ERROR_STOP=1 \
  --set=pilot_action="$1" --set=pilot_batch="$2" \
  --file="$import_dir/flexs-montreal-pilot-init.sql" \
  --command='\copy flexs_montreal_pilot_input (id_qmaps_propose,reference_municipale,nom,adresse_publique,ville,province,categorie_qmaps,source,licence) FROM STDIN WITH (FORMAT csv, HEADER MATCH)' \
  --file="$import_dir/flexs-montreal-pilot-apply.sql" <"$work_dir/manifest"
