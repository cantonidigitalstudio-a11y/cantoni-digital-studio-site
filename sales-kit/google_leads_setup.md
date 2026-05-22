# Google Leads Setup

## Objective
Capture website leads into Google Sheets for free, using the same Google account already used operationally.

## Files
- Apps Script source: `sales-kit/google_apps_script_leads.gs`
- Site config: `site-config.js`

## Setup
1. Open Google Sheets with `cantonidigitalstudio@gmail.com`.
2. Create a spreadsheet named `Cantoni Digital Studio Leads`.
3. Open Extensions -> Apps Script.
4. Replace the default code with `google_apps_script_leads.gs`.
5. Deploy as Web App:
- Execute as: Me
- Access: Anyone
6. Copy the Web App URL.
7. Put that URL into `site-config.js` as `leadCaptureEndpoint`.

## Runtime behavior
- If `leadCaptureEndpoint` is set, website forms send lead data to the sheet.
- If no endpoint is set, the site falls back to Gmail draft opening.
- `backupToGmail` can remain `false` for public visitors.

## Lead status flow
- New website lead enters with `status = NEW`
- Then move manually or via workflow to:
  - `AUDIT_PENDING`
  - `QUOTE_PENDING`
  - `QUOTE_SENT`
  - `REPLIED`
  - `WON`
