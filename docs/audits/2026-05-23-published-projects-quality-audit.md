# Published Projects Quality Audit - 2026-05-23

## Scope

Published projects audited for Cantoni Digital Studio quality:

- Excellentia VIP: `https://excellentiavip.com`
- Mr Collins Travel / Destination Cocoa: `https://mrcollinstravel.com`

Goal: verify whether the published public sites reflect the quality standard Cantoni Digital Studio wants to show to prospects, and identify what must be closed before using them as public proof without caveats.

## Executive Verdict

Both published sites have a strong technical baseline: core pages return `200`, SEO essentials are present, no console errors were found in the audited pages, no horizontal mobile overflow was found, and the main contact / booking paths are reachable.

They are not fully closed as "Cantoni-standard proof" yet because the discreet Cantoni imprint is live on Mr Collins but not yet live on Excellentia VIP. The Excellentia imprint work exists locally, but deployment is not complete:

- Mr Collins Travel has the live Cantoni credit rendered in the footer.
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
- Cantoni imprint is live: `Digital infrastructure by Cantoni Digital Studio`, linked to `https://cantonidigitalstudio.com`.

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

### P1 - Excellentia Cantoni imprint not live

Excellentia should show a discreet, professional "digital partner" or "website by Cantoni Digital Studio" signal in an appropriate footer or credits location. This gives prospects a path back to Cantoni without making the client site look polluted.

Current state:

- Mr Collins: live footer credit verified in browser render.
- Excellentia: local files include footer credit and branded-email attribution.
- Excellentia published site: imprint not visible yet.

### P2 - Mr Collins remote/auth issue resolved for current branch

The earlier Mr Collins push blocker was caused by the wrong active GitHub identity. After switching GitHub CLI back to the Cantoni account for Cantoni operations, the Mr Collins working tree is clean and the live site renders the Cantoni credit.

Earlier blocker:

```text
remote: Repository not found.
fatal: repository 'https://github.com/mrcollinstravel-dr/destination-cocoa-site.git/' not found
```

Guardrail: always verify the active GitHub identity before pushing across Cantoni, Mr Collins and Excellentia repositories.

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

1. Isolate Excellentia attribution/branded-email changes, commit only allowlisted files, run gates, deploy.
2. Verify Excellentia live footer credit and branded email preview.
3. Add a live-production credit check to Excellentia gates.
4. Keep the Mr Collins live credit check inside the smoke gate.
5. After deploys, update Cantoni portfolio/case studies so prospects can click from Cantoni to real public proof and back.

## Decision

Use Excellentia as commercial proof only with this wording until the imprint deploy is complete:

> "Sono progetti reali su cui lavoriamo; stiamo completando anche la firma tecnica pubblica e la documentazione case study."

Mr Collins can already be presented as public proof with the live Cantoni credit. After the Excellentia imprint and case-study deploy are live, both can be presented as clean public proof without caveats.
