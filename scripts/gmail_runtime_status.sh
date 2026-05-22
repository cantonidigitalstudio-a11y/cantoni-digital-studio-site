#!/usr/bin/env bash
set -euo pipefail

source "/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/.gmail-env.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
QUEUE_DIR="$ROOT_DIR/sales-kit/queue"
LOCK_FILE="$QUEUE_DIR/.worker.lock"
PREFLIGHT_LOG="$QUEUE_DIR/gmail_preflight.log"

echo "PLAYWRIGHT_CLI_SESSION=$PLAYWRIGHT_CLI_SESSION"
echo "PLAYWRIGHT_PROFILE_DIR=$PLAYWRIGHT_PROFILE_DIR"
echo "GMAIL_EXPECTED_ACCOUNT_EMAIL=$GMAIL_EXPECTED_ACCOUNT_EMAIL"
echo "GMAIL_AUTHUSER=$GMAIL_AUTHUSER"

if [[ -f "$LOCK_FILE" ]]; then
  lock_pid="$(cat "$LOCK_FILE" 2>/dev/null || true)"
  echo "LOCK_FILE_PRESENT=yes"
  echo "LOCK_PID=${lock_pid:-unknown}"
else
  echo "LOCK_FILE_PRESENT=no"
fi

if [[ -f "$PREFLIGHT_LOG" ]]; then
  echo "LAST_PREFLIGHT_LOG=$PREFLIGHT_LOG"
  tail -n 8 "$PREFLIGHT_LOG"
else
  echo "LAST_PREFLIGHT_LOG=missing"
fi
