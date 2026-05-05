#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
NETLIFY_BIN="${NETLIFY_BIN:-netlify}"

if [ "${ALLOW_PRODUCTION_DEPLOY:-}" != "yes" ]; then
  echo "error=production_deploy_requires_explicit_allow" >&2
  echo "Production deploy is intentionally blocked until a separate approval sets ALLOW_PRODUCTION_DEPLOY=yes." >&2
  exit 1
fi

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "error=missing_netlify_auth_token" >&2
  exit 1
fi

if [ -z "${NETLIFY_SITE_ID:-}" ] && [ -z "${NETLIFY_SITE_NAME:-}" ]; then
  echo "error=missing_site_target" >&2
  echo "Set NETLIFY_SITE_ID or NETLIFY_SITE_NAME before production deploy." >&2
  exit 1
fi

SITE_TARGET=""
if [ -n "${NETLIFY_SITE_ID:-}" ]; then
  SITE_TARGET="--site ${NETLIFY_SITE_ID}"
else
  SITE_TARGET="--site ${NETLIFY_SITE_NAME}"
fi

echo "step=tests"
npm run test:full

PUBLIC_DIR="${CLOUDFLARE_PAGES_OUTPUT_DIR:-$ROOT_DIR/.cloudflare-pages}"

echo "step=deploy_production"
# shellcheck disable=SC2086
"$NETLIFY_BIN" deploy \
  --auth "$NETLIFY_AUTH_TOKEN" \
  --dir "$PUBLIC_DIR" \
  --no-build \
  --prod \
  --json \
  --message "Cantoni site production $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  ${SITE_TARGET}
