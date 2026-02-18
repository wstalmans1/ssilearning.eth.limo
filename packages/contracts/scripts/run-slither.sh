#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

if ! command -v slither &>/dev/null; then
  echo "Slither not found. Install with: pip install slither-analyzer"
  exit 1
fi

# Compile first so Slither has up-to-date artifacts
pnpm run compile 2>/dev/null || true

slither .
