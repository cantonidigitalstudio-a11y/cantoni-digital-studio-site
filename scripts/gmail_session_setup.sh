#!/usr/bin/env bash
set -euo pipefail

source "/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/.gmail-env.sh"

export TARGET_GMAIL="${TARGET_GMAIL:-$GMAIL_EXPECTED_ACCOUNT_EMAIL}"
export GOOGLE_ACCOUNT_SETUP_ACTION="login"

exec "/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/google-account-setup.sh"
