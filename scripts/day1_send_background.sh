#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PAUSE_FLAG="$ROOT_DIR/sales-kit/outbound_pause.flag"
if [[ -f "$PAUSE_FLAG" && "${OUTBOUND_FORCE_RUN:-0}" != "1" ]]; then
  echo "Refusing outreach send: outbound pause flag is present." >&2
  echo "pause_flag=$PAUSE_FLAG" >&2
  cat "$PAUSE_FLAG" >&2
  exit 3
fi

source "$ROOT_DIR/sales-kit/queue/outreach_worker.env"
export OUTREACH_APPS_SCRIPT_SECRET OUTREACH_APPS_SCRIPT_ENDPOINT

QUEUE_FILE="${1:-sales-kit/queue/outreach_queue.json}"
SEND_ENABLED="${SEND_ENABLED:-false}"
MAX_PER_RUN="${MAX_PER_RUN:-20}"
OUTREACH_APPROVAL_TOKEN="${OUTREACH_APPROVAL_TOKEN:-}"

if [[ "$SEND_ENABLED" == "true" && "$OUTREACH_APPROVAL_TOKEN" != "APPROVED_REAL_SEND" ]]; then
  cat >&2 <<'MSG'
Refusing real outreach send: SEND_ENABLED=true requires OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND.
This prevents accidental client emails. Confirm the exact batch in chat before running a real send.
MSG
  exit 2
fi

OUTREACH_APPS_SCRIPT_SECRET="$OUTREACH_APPS_SCRIPT_SECRET" \
OUTREACH_SEND_ENABLED="$SEND_ENABLED" \
OUTREACH_QUEUE_FILE="$QUEUE_FILE" \
OUTREACH_MAX_PER_RUN="$MAX_PER_RUN" \
npm run outreach:background
