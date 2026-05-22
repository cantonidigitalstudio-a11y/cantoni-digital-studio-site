#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

QUEUE_FILE="${1:-sales-kit/queue/followup_d3_queue.json}"
SEND_ENABLED="${SEND_ENABLED:-true}"
MAX_PER_RUN="${MAX_PER_RUN:-20}"

SEND_ENABLED="$SEND_ENABLED" MAX_PER_RUN="$MAX_PER_RUN" bash "$ROOT_DIR/scripts/day1_send_background.sh" "$QUEUE_FILE"
