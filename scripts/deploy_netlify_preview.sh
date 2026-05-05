#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
NETLIFY_BIN="${NETLIFY_BIN:-netlify}"

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "error=missing_netlify_auth_token" >&2
  exit 1
fi

SITE_TARGET=""
if [ -n "${NETLIFY_SITE_ID:-}" ]; then
  SITE_TARGET="--site ${NETLIFY_SITE_ID}"
elif [ -n "${NETLIFY_SITE_NAME:-}" ]; then
  SITE_TARGET="--site-name ${NETLIFY_SITE_NAME}"
fi

echo "step=tests"
npm run test:full

PUBLIC_DIR="${CLOUDFLARE_PAGES_OUTPUT_DIR:-$ROOT_DIR/.cloudflare-pages}"

echo "step=deploy_preview"
# shellcheck disable=SC2086
"$NETLIFY_BIN" deploy \
  --auth "$NETLIFY_AUTH_TOKEN" \
  --dir "$PUBLIC_DIR" \
  --no-build \
  --json \
  --message "Cantoni site preview $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  ${SITE_TARGET}
