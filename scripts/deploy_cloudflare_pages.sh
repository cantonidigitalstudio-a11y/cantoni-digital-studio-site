#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_NAME:-cantonidigitalstudio}"
DOMAIN_NAME="${CLOUDFLARE_CUSTOM_DOMAIN:-cantonidigitalstudio.com}"
PUBLIC_DIR="${CLOUDFLARE_PAGES_OUTPUT_DIR:-$ROOT_DIR/.cloudflare-pages}"
DEPLOY_BRANCH="${CLOUDFLARE_PAGES_BRANCH:-preview-cantoni-site}"
WRANGLER_BIN="${WRANGLER_BIN:-wrangler}"

if [ "$DEPLOY_BRANCH" = "main" ] && [ "${ALLOW_PRODUCTION_DEPLOY:-}" != "yes" ]; then
  echo "error=production_deploy_requires_explicit_allow" >&2
  echo "Set ALLOW_PRODUCTION_DEPLOY=yes only after a separate production approval." >&2
  exit 1
fi

echo "step=tests"
npm run test:full

echo "step=build_public_dir"
bash "$ROOT_DIR/scripts/build_cloudflare_public_dir.sh"

echo "step=artifact_integrity"
npm run test:artifact

echo "step=whoami"
"$WRANGLER_BIN" whoami

echo "step=ensure_project"
if ! "$WRANGLER_BIN" pages project list | grep -Fq "$PROJECT_NAME"; then
  "$WRANGLER_BIN" pages project create "$PROJECT_NAME" --production-branch main
fi

echo "step=deploy"
"$WRANGLER_BIN" pages deploy "$PUBLIC_DIR" --project-name "$PROJECT_NAME" --branch "$DEPLOY_BRANCH"

echo "status=ok"
echo "project_name=$PROJECT_NAME"
echo "domain_name=$DOMAIN_NAME"
echo "branch=$DEPLOY_BRANCH"
echo "next_step=review_preview_url_before_any_production_binding"
