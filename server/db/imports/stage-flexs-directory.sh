#!/bin/sh
set -eu

if [ "$#" -ne 2 ] || [ ! -f "$2" ]; then
  echo 'Usage: sh stage-flexs-directory.sh open|odbl /path/to/public-catalogue.csv' >&2
  exit 2
fi
case "$1" in
  open|odbl) ;;
  *) echo 'Expected a separate open or odbl snapshot.' >&2; exit 2 ;;
esac

import_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
psql -X --single-transaction --set=ON_ERROR_STOP=1 --set=source_family="$1" \
  --file="$import_dir/flexs-directory-stage-init.sql" \
  --command='\copy flexs_stage_input (id,source,source_ref,name,other_name,city,region,province,trade,category_slug,status) FROM STDIN WITH (FORMAT csv, HEADER MATCH)' \
  --file="$import_dir/flexs-directory-stage-check.sql" <"$2"
