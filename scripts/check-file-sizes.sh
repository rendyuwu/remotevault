#!/usr/bin/env bash
set -euo pipefail

TS_LIMIT=300
RS_LIMIT=500
FAILED=0

check_files() {
  local pattern="$1"
  local limit="$2"
  local label="$3"

  local files
  files=$(git ls-files "$pattern" 2>/dev/null || find . -name "$pattern" -not -path '*/node_modules/*' -not -path '*/target/*' 2>/dev/null)

  if [ -z "$files" ]; then
    return
  fi

  while IFS= read -r f; do
    [ -f "$f" ] || continue
    local lines
    lines=$(wc -l < "$f")
    if [ "$lines" -gt "$limit" ]; then
      echo "FAIL: $f ($lines lines > $limit limit for $label)"
      FAILED=1
    fi
  done <<< "$files"
}

check_files '*.ts' "$TS_LIMIT" ".ts"
check_files '*.tsx' "$TS_LIMIT" ".tsx"
check_files '*.rs' "$RS_LIMIT" ".rs"

if [ "$FAILED" -eq 1 ]; then
  echo "ERROR: File size limits exceeded."
  exit 1
fi

exit 0
