#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_NAME:-cantonidigitalstudio}"
DOMAIN_NAME="${CLOUDFLARE_CUSTOM_DOMAIN:-cantonidigitalstudio.com}"
PUBLIC_DIR="${CLOUDFLARE_PAGES_OUTPUT_DIR:-$ROOT_DIR/.cloudflare-pages}"
DEPLOY_BRANCH="${CLOUDFLARE_PAGES_BRANCH:-preview-cantoni-site}"
WRANGLER_BIN="${WRANGLER_BIN:-wrangler}"
DIRECT_APPROVAL="${CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL:-}"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "error=missing_cloudflare_api_token" >&2
  echo "Set CLOUDFLARE_API_TOKEN in the environment only; never write it to the repo." >&2
  exit 1
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "error=missing_cloudflare_account_id" >&2
  echo "Set CLOUDFLARE_ACCOUNT_ID for the Cantoni Digital Studio Cloudflare account." >&2
  exit 1
fi

if [ "$DIRECT_APPROVAL" != "deploy-cantoni-pages-direct" ]; then
  echo "error=missing_direct_deploy_approval" >&2
  echo "Set CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct only after reviewing the deploy target." >&2
  exit 1
fi

if [ "$DEPLOY_BRANCH" = "main" ]; then
  if [ "${ALLOW_PRODUCTION_DEPLOY:-}" != "yes" ] || [ "${CANTONI_PRODUCTION_DEPLOY_APPROVAL:-}" != "deploy-cantoni-production" ]; then
    echo "error=production_deploy_requires_explicit_allow" >&2
    echo "Set ALLOW_PRODUCTION_DEPLOY=yes and CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production only after separate production approval." >&2
    exit 1
  fi
fi

echo "step=git_deploy_state"
node scripts/verify_git_deploy_state.cjs

echo "step=cloudflare_pages_api_preflight"
node scripts/verify_cloudflare_api_credentials.mjs --pages-only

echo "step=tests"
npm run test:full

echo "step=build_public_dir"
bash "$ROOT_DIR/scripts/build_cloudflare_public_dir.sh"

echo "step=artifact_integrity"
npm run test:artifact

echo "step=artifact_browser_smoke"
SITE_ROOT=.cloudflare-pages npm run test:browser

echo "step=artifact_payment_links"
SITE_ROOT=.cloudflare-pages npm run test:payments

echo "step=cloudflare_pages_api_recheck"
node scripts/verify_cloudflare_api_credentials.mjs --pages-only

echo "step=deploy_direct"
"$WRANGLER_BIN" pages deploy "$PUBLIC_DIR" --project-name "$PROJECT_NAME" --branch "$DEPLOY_BRANCH"

echo "status=ok"
echo "project_name=$PROJECT_NAME"
echo "domain_name=$DOMAIN_NAME"
echo "branch=$DEPLOY_BRANCH"
echo "deploy_channel=cloudflare-pages-direct-token"
echo "next_step=run npm run test:live-site and npm run audit:launch-readiness after propagation"
