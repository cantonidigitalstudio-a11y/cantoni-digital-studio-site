#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MARKER_FILE="$ROOT_DIR/sales-kit/queue/chrome_profile_binding.json"
USER_DATA_DIR="/Volumes/Lexar/playwright-profiles/cantoni-gmail"
PROFILE_DIR="Profile 18"
TARGET_URL="${1:-https://script.google.com/home}"
CHROME_APP="/Applications/Google Chrome.app"

mkdir -p "$(dirname "$MARKER_FILE")"

open -na "$CHROME_APP" --args \
  --user-data-dir="$USER_DATA_DIR" \
  --profile-directory="$PROFILE_DIR" \
  --new-window \
  "$TARGET_URL"

cat >"$MARKER_FILE" <<JSON
{
  "bound_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "chrome_mode": "isolated_user_data_dir",
  "chrome_app": "$CHROME_APP",
  "user_data_dir": "$USER_DATA_DIR",
  "profile_directory": "$PROFILE_DIR",
  "account_expected": "cantonidigitalstudio@gmail.com",
  "target_url": "$TARGET_URL",
  "source": "launch_cantoni_isolated_chrome.sh"
}
JSON

echo "OK"
echo "user_data_dir=$USER_DATA_DIR"
echo "profile_directory=$PROFILE_DIR"
echo "target_url=$TARGET_URL"
echo "marker_file=$MARKER_FILE"
