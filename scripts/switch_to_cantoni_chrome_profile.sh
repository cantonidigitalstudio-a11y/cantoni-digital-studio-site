#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MARKER_FILE="$ROOT_DIR/sales-kit/queue/chrome_profile_binding.json"
PROFILE_MENU_LABEL="Emanuele (cantonidigitalstudio@gmail.com)"
TARGET_URL="${1:-https://script.google.com/home}"

osascript <<OSA
tell application "Google Chrome" to activate
delay 0.5
tell application "System Events"
  tell process "Google Chrome"
    tell menu bar 1
      tell menu bar item "Profili"
        click
        delay 0.6
        click menu item "${PROFILE_MENU_LABEL}" of menu 1
      end tell
    end tell
  end tell
end tell
OSA

sleep 1
open -a "/Applications/Google Chrome.app" --args "$TARGET_URL"

mkdir -p "$(dirname "$MARKER_FILE")"
cat > "$MARKER_FILE" <<JSON
{
  "bound_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "chrome_profile_label": "${PROFILE_MENU_LABEL}",
  "target_url": "${TARGET_URL}",
  "source": "switch_to_cantoni_chrome_profile.sh"
}
JSON

echo "OK"
echo "chrome_profile_label=${PROFILE_MENU_LABEL}"
echo "marker_file=${MARKER_FILE}"
