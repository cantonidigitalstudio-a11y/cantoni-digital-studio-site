#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

npm run queue:followup-d3

echo "READY"
echo "queue=/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/followup_d3_queue.json"
