#!/usr/bin/env bash
set -euo pipefail

source "/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/.gmail-env.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_GMAIL="${TARGET_GMAIL:-$GMAIL_EXPECTED_ACCOUNT_EMAIL}"
GOOGLE_ACCOUNT_SETUP_ACTION="${GOOGLE_ACCOUNT_SETUP_ACTION:-login}"
PROFILE_ROOT_A="/Volumes/Lexar/playwright-profiles"
PROFILE_ROOT_B="/Users/emanuelecantoni/Library/Application Support/Google/Chrome"

block() {
  local reason="$1"
  echo "BLOCKED"
  echo "reason=$reason"
  echo "account_verified=no"
  echo "account_expected=$TARGET_GMAIL"
  echo "files_updated=$PLAYWRIGHT_PROFILE_DIR"
  echo "next_step=complete_login_in_opened_window_then_run_run_gmail_checks.sh"
  exit 1
}

if [[ "$GOOGLE_ACCOUNT_SETUP_ACTION" != "login" ]]; then
  block "unsupported_action:$GOOGLE_ACCOUNT_SETUP_ACTION"
fi

if [[ "$PLAYWRIGHT_PROFILE_DIR" != "$PROFILE_ROOT_A"/* && "$PLAYWRIGHT_PROFILE_DIR" != "$PROFILE_ROOT_B"* ]]; then
  block "profile_out_of_allowed_root:$PLAYWRIGHT_PROFILE_DIR"
fi

mkdir -p "$PLAYWRIGHT_PROFILE_DIR"
cd "$ROOT_DIR"
node "sales-kit/scripts/gmail_manual_login.mjs"
