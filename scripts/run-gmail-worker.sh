#!/usr/bin/env bash
set -euo pipefail

source "/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/.gmail-env.sh"

echo "BLOCKED"
echo "reason=single_entrypoint_enforced_use_run_gmail_checks.sh"
echo "account_verified=no"
echo "account_expected=$GMAIL_EXPECTED_ACCOUNT_EMAIL"
echo "files_updated=/Volumes/Lexar/Siti internet mondiale /cantoni_site/scripts/run-gmail-worker.sh"
echo "next_step=run_/Volumes/Lexar/Siti\ internet\ mondiale\ /cantoni_site/scripts/run_gmail_checks.sh"
exit 1
