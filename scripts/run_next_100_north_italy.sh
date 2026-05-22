#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/Volumes/Lexar/Siti internet mondiale /cantoni_site"
DISCOVERY_SCRIPT="$PROJECT_DIR/sales-kit/scripts/discover_and_send_local_leads.mjs"
REPLY_SCAN_SCRIPT="$PROJECT_DIR/sales-kit/scripts/scan_replies_via_cdp.mjs"
CSV_FILE="$PROJECT_DIR/sales-kit/lead_pipeline.csv"
CDP_HEALTH_URL="${CDP_HEALTH_URL:-http://127.0.0.1:9223/json/version}"
PAUSE_FLAG="$PROJECT_DIR/sales-kit/outbound_pause.flag"

TARGET_NEW="${TARGET_NEW:-100}"
PER_BATCH="${PER_BATCH:-6}"
MAX_DOMAIN_REPEATS="${MAX_DOMAIN_REPEATS:-2}"
REPLY_SCAN_ENABLED="${REPLY_SCAN_ENABLED:-0}"
REPLY_SCAN_TIMEOUT_SECONDS="${REPLY_SCAN_TIMEOUT_SECONDS:-45}"
BATCH_TIMEOUT_SECONDS="${BATCH_TIMEOUT_SECONDS:-120}"

CITY_GROUPS=(
  "Milano,Monza"
  "Bergamo,Brescia"
  "Como,Varese"
  "Pavia,Lecco"
  "Lodi,Cremona"
  "Novara,Piacenza"
  "Parma,Modena"
  "Reggio Emilia,Verona"
  "Padova,Treviso"
  "Vicenza,Trento"
  "Torino,Genova"
  "Bologna,Ferrara"
  "Udine,Trieste"
  "Mantova,Bolzano"
  "Alessandria,Asti"
  "Savona,Imperia"
  "Ravenna,Forli"
  "Cesena,Rimini"
  "Pisa,Lucca"
  "Firenze,Prato"
)

count_total() {
  node --input-type=module -e "
    import { readLeadPipeline } from '$PROJECT_DIR/sales-kit/scripts/lib/lead_pipeline_utils.mjs';
    const rows = await readLeadPipeline('$CSV_FILE');
    console.log(rows.length);
  "
}

ensure_cdp() {
  if curl -fsS "$CDP_HEALTH_URL" >/dev/null 2>&1; then
    return 0
  fi

  open -na '/Applications/Google Chrome.app' --args \
    --user-data-dir='/Volumes/Lexar/playwright-profiles/cantoni-gmail' \
    --profile-directory='Default' \
    --remote-debugging-port=9223 \
    'https://mail.google.com/mail/u/1/#inbox'

  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS "$CDP_HEALTH_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  return 1
}

initial_total="$(count_total)"
target_total="$((initial_total + TARGET_NEW))"

echo "initial_total=$initial_total"
echo "target_total=$target_total"
echo "per_batch=$PER_BATCH"

if [ -f "$PAUSE_FLAG" ] && [ "${OUTBOUND_FORCE_RUN:-0}" != "1" ]; then
  echo "status=paused"
  echo "reason=outbound_pause_flag_present"
  echo "pause_flag=$PAUSE_FLAG"
  cat "$PAUSE_FLAG"
  exit 3
fi

if [ "$REPLY_SCAN_ENABLED" = "1" ]; then
  echo "reply_scan_start"
  if ensure_cdp; then
    python3 - "$REPLY_SCAN_TIMEOUT_SECONDS" "$REPLY_SCAN_SCRIPT" <<'PY' || echo "warning=reply_scan_failed"
import subprocess
import sys

timeout_seconds = int(sys.argv[1])
script = sys.argv[2]

try:
    result = subprocess.run(["node", script], timeout=timeout_seconds, check=False)
    sys.exit(result.returncode)
except subprocess.TimeoutExpired:
    print("warning=reply_scan_timeout")
    sys.exit(124)
PY
  else
    echo "warning=cdp_unavailable"
  fi
  echo "reply_scan_done"
else
  echo "reply_scan_skipped"
fi

for city_group in "${CITY_GROUPS[@]}"; do
  current_total="$(count_total)"
  if [ "$current_total" -ge "$target_total" ]; then
    break
  fi

  echo "batch_start cities=$city_group current_total=$current_total"
  if ! python3 - "$PROJECT_DIR" "$DISCOVERY_SCRIPT" "$PER_BATCH" "$MAX_DOMAIN_REPEATS" "$city_group" "$BATCH_TIMEOUT_SECONDS" <<'PY'
import os
import subprocess
import sys

project_dir, discovery_script, per_batch, max_domain_repeats, city_group, timeout_seconds = sys.argv[1:]
env = dict(os.environ)
env.update({
    "SEND_ENABLED": "true",
    "SAVE_LEADS": "true",
    "TARGET_COUNT": per_batch,
    "MAX_DOMAIN_REPEATS": max_domain_repeats,
    "LEAD_CITIES": city_group,
})

try:
    result = subprocess.run(
        ["node", discovery_script],
        cwd=project_dir,
        env=env,
        timeout=int(timeout_seconds),
        check=False,
    )
    sys.exit(result.returncode)
except subprocess.TimeoutExpired:
    print(f"warning=batch_timeout cities={city_group} timeout_seconds={timeout_seconds}")
    sys.exit(124)
PY
  then
    echo "warning=batch_failed_or_empty cities=$city_group"
    continue
  fi
  current_total="$(count_total)"
  echo "batch_done cities=$city_group current_total=$current_total"
done

final_total="$(count_total)"
echo "final_total=$final_total"

if [ "$final_total" -lt "$target_total" ]; then
  echo "warning=target_not_reached"
  exit 2
fi

echo "status=completed"
