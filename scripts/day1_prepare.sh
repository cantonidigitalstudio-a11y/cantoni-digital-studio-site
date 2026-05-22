#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

npm run validate:day1
npm run queue:build
npm run queue:internal-test

echo "READY"
echo "queue=/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/outreach_queue.json"
echo "internal_test=/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/internal_test_queue.json"
