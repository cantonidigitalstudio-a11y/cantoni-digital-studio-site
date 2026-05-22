#!/usr/bin/env bash
set -euo pipefail

source "/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/.gmail-env.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
QUEUE_DIR="$ROOT_DIR/sales-kit/queue"
LOG_FILE="$QUEUE_DIR/gmail_checks.log"
PID_FILE="$QUEUE_DIR/gmail_checks.pid"
LOCK_FILE="$QUEUE_DIR/.worker.lock"
PREFLIGHT_LOG="$QUEUE_DIR/gmail_preflight.log"
PROFILE_ROOT_A="/Volumes/Lexar/playwright-profiles"
PROFILE_ROOT_B="/Users/emanuelecantoni/Library/Application Support/Google/Chrome"
STARTUP_GRACE_SEC="${GMAIL_STARTUP_GRACE_SEC:-6}"

block() {
  local reason="$1"
  echo "BLOCKED"
  echo "reason=$reason"
  echo "account_verified=no"
  echo "account_expected=$GMAIL_EXPECTED_ACCOUNT_EMAIL"
  echo "files_updated=$PREFLIGHT_LOG,$LOG_FILE,$PID_FILE,$LOCK_FILE"
  echo "next_step=run_/Volumes/Lexar/Siti\ internet\ mondiale\ /cantoni_site/scripts/gmail_session_setup.sh"
  exit 1
}

if [[ "$PLAYWRIGHT_PROFILE_DIR" != "$PROFILE_ROOT_A"/* && "$PLAYWRIGHT_PROFILE_DIR" != "$PROFILE_ROOT_B"* ]]; then
  block "profile_out_of_allowed_root:$PLAYWRIGHT_PROFILE_DIR"
fi

if [[ "$GMAIL_PROFILE_DIR" != "$PLAYWRIGHT_PROFILE_DIR" ]]; then
  block "session_profile_mismatch:gmail_profile_must_equal_playwright_profile"
fi

mkdir -p "$QUEUE_DIR"

# Mandatory preflight: Gmail authenticated and expected account on this exact profile.
cd "$ROOT_DIR"
if ! node "sales-kit/scripts/gmail_preflight.mjs" >"$PREFLIGHT_LOG" 2>&1; then
  if rg -qi "ERROR_CODE=WRONG_GMAIL_ACCOUNT" "$PREFLIGHT_LOG"; then
    block "wrong_gmail_account_stop_and_rerun_gmail_session_setup_same_profile"
  fi
  if rg -qi "ERROR_CODE=AUTH_REQUIRED" "$PREFLIGHT_LOG"; then
    block "auth_required_login_captcha_2fa_human_intervention"
  fi
  if rg -qi "ERROR_CODE=WORKER_LOCKED|ProcessSingleton" "$PREFLIGHT_LOG"; then
    block "processsingleton_or_lock_detected_close_profile_processes_then_retry"
  fi
  block "preflight_failed_check_$PREFLIGHT_LOG"
fi

# PID-safe lock handling: keep live lock, remove only stale lock.
if [[ -f "$LOCK_FILE" ]]; then
  lock_pid="$(cat "$LOCK_FILE" 2>/dev/null || true)"
  if [[ -n "$lock_pid" ]] && ps -p "$lock_pid" >/dev/null 2>&1; then
    echo "$lock_pid" > "$PID_FILE"
    echo "SUCCESS"
    echo "reason=worker_already_running_from_live_lock"
    echo "account_verified=$GMAIL_EXPECTED_ACCOUNT_EMAIL"
    echo "files_updated=$PREFLIGHT_LOG,$LOG_FILE,$PID_FILE,$LOCK_FILE"
    echo "next_step=tail -f '$LOG_FILE'"
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi

# Secondary PID check.
if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && ps -p "$old_pid" >/dev/null 2>&1; then
    echo "SUCCESS"
    echo "reason=worker_already_running_from_pid"
    echo "account_verified=$GMAIL_EXPECTED_ACCOUNT_EMAIL"
    echo "files_updated=$PREFLIGHT_LOG,$LOG_FILE,$PID_FILE,$LOCK_FILE"
    echo "next_step=tail -f '$LOG_FILE'"
    exit 0
  fi
fi

# Single operational launch path.
nohup node "sales-kit/scripts/gmail_headless_worker.mjs" >"$LOG_FILE" 2>&1 &
new_pid=$!
echo "$new_pid" > "$PID_FILE"

sleep "$STARTUP_GRACE_SEC"
if ! ps -p "$new_pid" >/dev/null 2>&1; then
  if rg -qi "ERROR_CODE=WRONG_GMAIL_ACCOUNT" "$LOG_FILE"; then
    block "wrong_gmail_account_stop_and_rerun_gmail_session_setup_same_profile"
  fi
  if rg -qi "ERROR_CODE=AUTH_REQUIRED" "$LOG_FILE"; then
    block "auth_required_login_captcha_2fa_human_intervention"
  fi
  if rg -qi "ERROR_CODE=WORKER_LOCKED|ProcessSingleton" "$LOG_FILE"; then
    block "processsingleton_or_lock_detected_close_profile_processes_then_retry"
  fi
  tail_msg="$(tail -n 8 "$LOG_FILE" 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')"
  block "worker_exited_early:$tail_msg"
fi

echo "SUCCESS"
echo "reason=worker_started_in_background"
echo "account_verified=$GMAIL_EXPECTED_ACCOUNT_EMAIL"
echo "files_updated=$PREFLIGHT_LOG,$LOG_FILE,$PID_FILE,$LOCK_FILE"
echo "next_step=tail -f '$LOG_FILE'"
