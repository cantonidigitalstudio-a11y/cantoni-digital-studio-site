#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"
NETLIFY_BIN="${NETLIFY_BIN:-netlify}"

if [ "${ALLOW_NETLIFY_FALLBACK:-}" != "yes" ]; then
  echo "error=netlify_fallback_requires_explicit_allow" >&2
  echo "Cloudflare Pages is the primary Cantoni deploy channel. Set ALLOW_NETLIFY_FALLBACK=yes only after verifying this Netlify team/site belongs to Cantoni Digital Studio." >&2
  exit 1
fi

if [ "${NETLIFY_TEAM_VERIFIED_AS_CANTONI:-}" != "yes" ]; then
  echo "error=netlify_team_identity_unverified" >&2
  echo "Verify the visible Netlify team/site is Cantoni Digital Studio before any fallback deploy, then set NETLIFY_TEAM_VERIFIED_AS_CANTONI=yes." >&2
  exit 1
fi

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "error=missing_netlify_auth_token" >&2
  exit 1
fi

if [ -z "${NETLIFY_SITE_ID:-}" ] && [ -z "${NETLIFY_SITE_NAME:-}" ]; then
  echo "error=missing_site_target" >&2
  echo "Set NETLIFY_SITE_ID or NETLIFY_SITE_NAME before fallback preview deploy." >&2
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
