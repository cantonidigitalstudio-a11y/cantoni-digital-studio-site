#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BINDING_FILE="$ROOT_DIR/sales-kit/queue/account_binding.json"

if [[ ! -f "$BINDING_FILE" ]]; then
  echo "BLOCKED"
  echo "reason=google_account_not_bound"
  echo "binding_file=$BINDING_FILE"
  echo "next_step=run_/Volumes/Lexar/Siti\\ internet\\ mondiale\\ /cantoni_site/scripts/gmail_session_setup.sh"
  exit 1
fi

cat "$BINDING_FILE"
