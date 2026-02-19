#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

if ! command -v slither &>/dev/null; then
  echo "Slither not found. Install with: pip install slither-analyzer"
  exit 1
fi

# Use solc directly - avoids Hardhat node_modules and artifact path issues.
# DIDRegistry.sol has no imports, so solc can compile it standalone.
slither contracts/SSI/DIDRegistry.sol --compile-force-framework solc --fail-none
