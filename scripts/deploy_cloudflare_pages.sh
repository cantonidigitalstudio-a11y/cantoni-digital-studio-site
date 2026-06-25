#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_NAME:-cantonidigitalstudio}"
DOMAIN_NAME="${CLOUDFLARE_CUSTOM_DOMAIN:-cantonidigitalstudio.com}"
PUBLIC_DIR="${CLOUDFLARE_PAGES_OUTPUT_DIR:-$ROOT_DIR/.cloudflare-pages}"
DEPLOY_BRANCH="${CLOUDFLARE_PAGES_BRANCH:-preview-cantoni-site}"
WRANGLER_BIN="${WRANGLER_BIN:-wrangler}"

if [ "$DEPLOY_BRANCH" = "main" ]; then
  if [ "${ALLOW_PRODUCTION_DEPLOY:-}" != "yes" ] || [ "${CANTONI_PRODUCTION_DEPLOY_APPROVAL:-}" != "deploy-cantoni-production" ]; then
    echo "error=production_deploy_requires_explicit_allow" >&2
    echo "Set ALLOW_PRODUCTION_DEPLOY=yes and CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production only after separate production approval." >&2
    exit 1
  fi
fi

echo "step=git_deploy_state"
node scripts/verify_git_deploy_state.cjs

echo "step=cloudflare_auth_preflight"
npm run audit:cloudflare-auth

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

echo "step=cloudflare_auth_recheck"
npm run audit:cloudflare-auth

echo "step=cloudflare_deploy_candidate"
node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready

echo "step=deploy"
"$WRANGLER_BIN" pages deploy "$PUBLIC_DIR" --project-name "$PROJECT_NAME" --branch "$DEPLOY_BRANCH"

echo "status=ok"
echo "project_name=$PROJECT_NAME"
echo "domain_name=$DOMAIN_NAME"
echo "branch=$DEPLOY_BRANCH"
echo "post_deploy_checks=npm run test:live-site; npm run audit:post-unblock-launch; npm run audit:launch-readiness"
echo "next_step=review_preview_url_before_any_production_binding_then_run_post_deploy_checks"
