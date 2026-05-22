# Background Outreach Worker

Script: `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/scripts/gmail_background_worker.mjs`

## Objective
Send outreach in background via Google Apps Script, without controlling Chrome or Gmail UI.

## Why this is the preferred path
- no foreground browser automation
- no interference with other Codex sessions
- no dependency on focused windows or tabs
- CRM and queue still update locally after each send

## Required one-time Apps Script setup
1. Open the Apps Script project already linked to the Cantoni session.
2. In `Project Settings > Script properties`, set:
   - `OUTREACH_SHARED_SECRET=<strong random secret>`
3. Replace the deployed code with `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/google_apps_script_leads.gs`
4. Deploy a new web app version.

## Health check
The endpoint must respond to:

```bash
curl "https://script.google.com/macros/s/.../exec?action=health"
```

Expected:

```json
{"ok":true,"action":"health","service":"cantoni-digital-studio-leads"}
```

## Dry run
No email is sent. Queue and CRM are updated as `dry_run` only.

```bash
cd "/Volumes/Lexar/Siti internet mondiale /cantoni_site"
OUTREACH_APPS_SCRIPT_SECRET="set-this" \
OUTREACH_SEND_ENABLED=false \
OUTREACH_QUEUE_FILE="sales-kit/queue/internal_test_queue.json" \
npm run outreach:background
```

## Real send

```bash
cd "/Volumes/Lexar/Siti internet mondiale /cantoni_site"
OUTREACH_APPS_SCRIPT_SECRET="set-this" \
OUTREACH_SEND_ENABLED=true \
OUTREACH_QUEUE_FILE="sales-kit/queue/outreach_queue.json" \
OUTREACH_MAX_PER_RUN=20 \
npm run outreach:background
```

## Output files
- queue updated:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/outreach_queue.json`
- CRM updated:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/lead_pipeline.csv`
- worker state:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/background_worker_state.json`

## Notes
- This worker does not require Chrome.
- Branding is sent inside `html_body` with the Cantoni logo header.
- The browser-based Playwright worker remains available as fallback only.
