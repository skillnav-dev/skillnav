#!/usr/bin/env bash
# Restore drill: restore a `pg_dump -Fc -n public` file into an empty database
# and compare per-table row counts with the live database.
#
# Usage: scripts/db/restore-drill.sh <dump-file> <drill-db-url> <live-db-url>
#
# Exit codes:
#   0 - every table restored; row counts match or differ by at most 5% / 50 rows
#   1 - restore errors, no tables in the dump, a missing table,
#       or a count mismatch beyond tolerance
set -euo pipefail

dump="$1"; drill="$2"; live="$3"
here="$(cd "$(dirname "$0")" && pwd)"
summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

psql "$drill" -X -q -v ON_ERROR_STOP=1 -f "$here/prepare-drill-db.sql"
# The dump recreates `public` itself; an empty drill database already has one.
psql "$drill" -X -q -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE"

# --no-owner/--no-privileges: drill roles differ from Supabase's internal ones.
# Errors are collected rather than fatal so the report lists all of them.
if pg_restore --no-owner --no-privileges -d "$drill" "$dump" 2> restore-errors.log; then
  restore_ok=1
else
  restore_ok=0
fi

tables_sql="SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1"
mapfile -t tables < <(pg_restore --list "$dump" | awk '/ TABLE DATA public /{print $7}' | sort)

fail=0
(( ${#tables[@]} > 0 )) || fail=1
{
  echo "## Restore drill"
  echo
  echo "Dump: \`$(basename "$dump")\` · tables in dump: ${#tables[@]}"
  echo
  echo "| Table | Backup | Live | Status |"
  echo "|---|---:|---:|---|"
} >> "$summary"

restored_tables="$(psql "$drill" -XAtc "$tables_sql")"
for t in "${tables[@]}"; do
  if ! grep -qx "$t" <<< "$restored_tables"; then
    echo "| \`$t\` | — | — | missing after restore |" >> "$summary"; fail=1; continue
  fi
  b=$(psql "$drill" -XAtc "SELECT count(*) FROM public.\"$t\"")
  l=$(psql "$live" -XAtc "SELECT count(*) FROM public.\"$t\"")
  d=$(( b > l ? b - l : l - b ))
  tol=$(( l / 20 > 50 ? l / 20 : 50 ))
  if (( d <= tol )); then status="ok"; else status="**mismatch**"; fail=1; fi
  echo "| \`$t\` | $b | $l | $status |" >> "$summary"
done

if (( restore_ok == 0 )); then
  fail=1
  {
    echo
    echo "pg_restore reported errors:"
    echo '```'
    head -50 restore-errors.log
    echo '```'
  } >> "$summary"
fi

exit "$fail"
