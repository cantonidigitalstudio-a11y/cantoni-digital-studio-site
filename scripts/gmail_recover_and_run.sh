#!/usr/bin/env bash
set -euo pipefail

source "/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/.gmail-env.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
QUEUE_DIR="$ROOT_DIR/sales-kit/queue"
LOCK_FILE="$QUEUE_DIR/.worker.lock"
PRECHECK="$ROOT_DIR/sales-kit/scripts/gmail_preflight.mjs"

mkdir -p "$QUEUE_DIR"

echo "[recover] session=$PLAYWRIGHT_CLI_SESSION profile=$PLAYWRIGHT_PROFILE_DIR expected=$GMAIL_EXPECTED_ACCOUNT_EMAIL"

# 1) Stop only processes using this exact profile
pids="$(pgrep -f -- "--user-data-dir=$PLAYWRIGHT_PROFILE_DIR" || true)"
if [[ -n "$pids" ]]; then
  echo "$pids" | xargs kill -TERM || true
  sleep 2
fi

# 2) Clean stale singleton + stale worker lock
rm -f "$PLAYWRIGHT_PROFILE_DIR/SingletonLock" "$PLAYWRIGHT_PROFILE_DIR/SingletonSocket" "$PLAYWRIGHT_PROFILE_DIR/SingletonCookie"
if [[ -f "$LOCK_FILE" ]]; then
  pid="$(cat "$LOCK_FILE" 2>/dev/null || true)"
  if [[ -z "$pid" ]] || ! ps -p "$pid" >/dev/null 2>&1; then
    rm -f "$LOCK_FILE"
  fi
fi

# 3) Quick preflight; if not authenticated open setup and wait until preflight passes
if ! node "$PRECHECK" >/tmp/gmail_preflight_recover.log 2>&1; then
  echo "[recover] preflight not ready -> running setup login on same profile"
  "$ROOT_DIR/scripts/gmail_session_setup.sh" >/tmp/gmail_session_setup_recover.log 2>&1 || true

  # Poll until login is valid
  max_wait_sec="${GMAIL_RECOVER_MAX_WAIT_SEC:-900}"
  elapsed=0
  until node "$PRECHECK" >/tmp/gmail_preflight_recover.log 2>&1; do
    sleep 5
    elapsed=$((elapsed + 5))
    if (( elapsed >= max_wait_sec )); then
      echo "BLOCKED"
      echo "reason=auth_required_timeout_waiting_manual_login"
      echo "account_verified=no"
      echo "account_expected=$GMAIL_EXPECTED_ACCOUNT_EMAIL"
      echo "files_updated=/tmp/gmail_preflight_recover.log,/tmp/gmail_session_setup_recover.log"
      echo "next_step=complete_login_in_opened_window_then_rerun_gmail_recover_and_run.sh"
      exit 1
    fi
  done
fi

echo "[recover] preflight PASS -> start checks"
exec "$ROOT_DIR/scripts/run_gmail_checks.sh"
