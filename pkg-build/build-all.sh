#!/usr/bin/env bash
set -euo pipefail

# Build all extras bundles and then package the RexxJS binary with pkg.

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"

echo "[build-all] Building extras bundles..."
for rel in "extras/addresses/container-and-vm-orchestration" "extras/addresses/remote"; do
  dir="$root/$rel"
  echo "[build-all] -> $rel"
  pushd "$dir" >/dev/null
  if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
    npm ci
  else
    npm install
  fi
  npm run build
  popd >/dev/null
done

echo "[build-all] Building pkg binary..."
pushd "$here" >/dev/null
# Adjust targets as needed; mirrors package.json pkg.targets
npx pkg -t node18-linux-x64 .
popd >/dev/null

echo "[build-all] Done. Binary available per pkg output."
