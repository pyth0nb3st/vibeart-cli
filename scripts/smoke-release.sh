#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VIBEART_BASE_URL:-}" ]]; then
  echo "VIBEART_BASE_URL is required for smoke release." >&2
  exit 1
fi

if [[ -z "${VIBEART_API_KEY:-}" ]]; then
  echo "VIBEART_API_KEY is required for smoke release." >&2
  exit 1
fi

npm run build

node dist/cli.js --version
node dist/cli.js --help >/dev/null
node dist/cli.js models list \
  --base-url "$VIBEART_BASE_URL" \
  --api-key "$VIBEART_API_KEY" \
  --format json >/dev/null

echo "release smoke passed"
