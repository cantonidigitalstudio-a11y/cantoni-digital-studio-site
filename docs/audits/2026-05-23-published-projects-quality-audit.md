# Published Projects Quality Audit - 2026-05-23

## Scope

Published projects audited for Cantoni Digital Studio quality:

- Excellentia VIP: `https://excellentiavip.com`
- Mr Collins Travel / Destination Cocoa: `https://mrcollinstravel.com`

Goal: verify whether the published public sites reflect the quality standard Cantoni Digital Studio wants to show to prospects, and identify what must be closed before using them as public proof without caveats.

## Executive Verdict

Both published sites have a strong technical baseline: core pages return `200`, SEO essentials are present, no console errors were found in the audited pages, no horizontal mobile overflow was found, and the main contact / booking paths are reachable.

They are not fully closed as "Cantoni-standard proof" yet because the discreet Cantoni imprint is not live on either published site. The imprint work exists locally, but deployment is not complete:

- Mr Collins Travel has a local commit ready, but push is blocked by GitHub repository access.
- Excellentia VIP has local imprint and branded-email work, but the repo has many pre-existing dirty changes, so it must be committed and deployed with a narrow allowlist.

## Live Browser Audit

Audited with browser automation on desktop `1440x1100` and mobile `390x844`.

Checks applied:

- HTTP status
- page title
- H1
- canonical URL
- meta description
- console errors
- failed network requests
- `4xx` / `5xx` page responses
- broken images
- mobile horizontal overflow
- placeholder text
- CTA / contact / booking paths
- visible Cantoni footer credit

### Excellentia VIP

Audited live URLs:

- `https://excellentiavip.com/excellentia-vip`
- `https://excellentiavip.com/excellentia-vip-booking`
- `https://excellentiavip.com/excellentia-vip-packages`
- `https://excellentiavip.com/excellentia-vip-fleet`
- `https://excellentiavip.com/excellentia-vip-operations`
- `https://excellentiavip.com/excellentia-vip-account`

Result:

- `200` on audited pages.
- Titles, H1 and canonical URLs present.
- No console errors observed.
- No failed page requests observed.
- No mobile horizontal overflow observed.
- No placeholder copy found.
- Contact / booking paths present.
- Cantoni imprint not live yet.

Note: one lazy-loaded fleet image was flagged during mobile automation, but direct asset verification returned `HTTP 200`. This is not currently treated as a broken asset, but it should be visually checked again after the next deploy.

### Mr Collins Travel

Audited live URLs:

- `https://mrcollinstravel.com/`
- `https://mrcollinstravel.com/booking.html`
- `https://mrcollinstravel.com/services.html`
- `https://mrcollinstravel.com/operations.html`
- `https://mrcollinstravel.com/booking-status.html`
- `https://mrcollinstravel.com/photo-credits.html`

Result:

- `200` on audited pages.
- Titles, H1 and canonical URLs present.
- No console errors observed.
- No failed page requests observed.
- No mobile horizontal overflow observed.
- No placeholder copy found.
- Booking / WhatsApp / mail contact paths present.
- Cantoni imprint not live yet.

Mr Collins is currently stronger than Excellentia on global/AI discovery structure: multilingual SEO, hreflang coverage, sitemap structure and AI-search gates are more mature.

Note: one partner logo was flagged during mobile automation, but direct asset verification returned `HTTP 200`. This is likely lazy loading during the automated pass, not a live missing asset.

## Local Gates Re-run

Excellentia VIP:

- `npm run test:vip-cross-page`
- `npm run test:vip-branded-manual-email`
- `npm run gate:vip-predeploy`

Result: passed.

Mr Collins Travel:

- `npm run test:smoke`
- `npm run test:i18n`
- `npm run test:ai-visibility`

Result: passed.

## Critical Findings

### P1 - Cantoni imprint not live

Both sites should show a discreet, professional "digital partner" or "website by Cantoni Digital Studio" signal in an appropriate footer or credits location. This gives prospects a path back to Cantoni without making the client site look polluted.

Current state:

- Mr Collins: local commit `c85e466 Add Cantoni digital partner credit` exists.
- Excellentia: local files include footer credit and branded-email attribution.
- Published sites: imprint not visible yet.

### P1 - Mr Collins remote push blocked

The Mr Collins local commit cannot be published until GitHub remote access is corrected.

Observed blocker:

```text
remote: Repository not found.
fatal: repository 'https://github.com/mrcollinstravel-dr/destination-cocoa-site.git/' not found
```

This must be fixed by confirming the correct GitHub repository, organization/account, and token/session.

### P1 - Excellentia repo requires controlled commit

Excellentia has many existing dirty files unrelated to the Cantoni imprint. Do not run `git add .`.

Next commit must stage only the intended attribution / branded-email / QA files after a narrow diff review.

### P2 - Live proof strength differs by project

Mr Collins is already strong as multilingual travel infrastructure proof.

Excellentia is solid visually and operationally, but it should be strengthened as a public case study with:

- clearer public proof page / case study,
- visible Cantoni imprint,
- branded email proof,
- AI/search visibility language where truthful,
- post-launch growth narrative.

## Next Actions

1. Fix Mr Collins GitHub remote access and push commit `c85e466`.
2. Deploy Mr Collins and verify the live footer credit on desktop/mobile.
3. Isolate Excellentia attribution/branded-email changes, commit only allowlisted files, run gates, deploy.
4. Verify Excellentia live footer credit and branded email preview.
5. Add a live-production credit check to both projects' QA gates.
6. After deploys, update Cantoni portfolio/case studies so prospects can click from Cantoni to real public proof and back.

## Decision

Use both projects as commercial proof only with this wording until the imprint deploys are complete:

> "Sono progetti reali su cui lavoriamo; stiamo completando anche la firma tecnica pubblica e la documentazione case study."

After the imprint and case-study deploys are live, they can be presented as clean public proof without caveats.
