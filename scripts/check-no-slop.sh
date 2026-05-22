#!/usr/bin/env bash
set -euo pipefail

SLOP_WORDS=(
  "delve"
  "tapestry"
  "holistic"
  "synergy"
  "leverage"
  "utilize"
  "facilitate"
  "streamline"
  "cutting-edge"
  "game-changer"
  "paradigm"
  "empower"
  "revolutionize"
  "groundbreaking"
  "seamless"
  "robust"
  "elevate"
  "foster"
  "harness"
  "spearhead"
  "pivotal"
  "commendable"
  "meticulous"
  "intricate"
  "comprehensive"
)

PATTERN=$(IFS="|"; echo "${SLOP_WORDS[*]}")

FILES=$(git ls-files '*.ts' '*.tsx' '*.rs' 2>/dev/null || find src src-tauri -name '*.ts' -o -name '*.tsx' -o -name '*.rs' 2>/dev/null)

if [ -z "$FILES" ]; then
  exit 0
fi

FOUND=$(echo "$FILES" | xargs grep -inE "\b($PATTERN)\b" 2>/dev/null || true)

if [ -n "$FOUND" ]; then
  echo "ERROR: AI slop detected:"
  echo "$FOUND"
  exit 1
fi

exit 0
