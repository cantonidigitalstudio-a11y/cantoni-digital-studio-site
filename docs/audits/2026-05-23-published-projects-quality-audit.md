# Published Projects Quality Audit - 2026-05-23

## Scope

Published projects audited for Cantoni Digital Studio quality:

- Excellentia VIP: `https://excellentiavip.com`
- Mr Collins Travel / Destination Cocoa: `https://mrcollinstravel.com`

Goal: verify whether the published public sites reflect the quality standard Cantoni Digital Studio wants to show to prospects, and identify what must be closed before using them as public proof without caveats.

## Executive Verdict

Both published sites now have a strong technical baseline: core pages return `200`, SEO essentials are present, no console errors were found in the audited pages, no horizontal mobile overflow was found, the main contact / booking paths are reachable, and both public sites expose a discreet Cantoni Digital Studio attribution path.

They can be used as public Cantoni proof with normal commercial care:

- Mr Collins Travel has the live Cantoni credit rendered in the footer.
- Excellentia VIP now has the live Cantoni credit rendered in the footer after the controlled production deploy.

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
- Cantoni imprint is live: `Digital infrastructure by Cantoni Digital Studio`, linked to `https://cantonidigitalstudio.com`.

Production deploy verified: Netlify site `excellentiavip`, deploy `6a111bdd21ca26924390008a`, published to `https://excellentiavip.com`.

Note: one lazy-loaded fleet image was flagged during an earlier mobile automation pass, but direct asset verification returned `HTTP 200`. This is not currently treated as a broken asset.

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

Note: two MP4 proof assets were reported as `net::ERR_ABORTED` during browser automation, but direct header checks returned `HTTP/2 200` with `content-type: video/mp4`. This is treated as browser media loading behavior, not a missing production asset.

## Local Gates Re-run

Excellentia VIP:

- `npm run test:vip-cross-page`
- `npm run test:vip-branded-manual-email`
- `npm run test:vip-local-flow`
- `npm run gate:vip-predeploy`

Result: passed.

Mr Collins Travel:

- `npm run test:smoke`
- `npm run test:i18n`
- `npm run test:ai-visibility`

Result: passed.

## Critical Findings

### P1 - Excellentia Cantoni imprint live

Excellentia now shows a discreet, professional digital infrastructure credit in the public footer. This gives prospects a path back to Cantoni without making the client site look polluted.

Current state:

- Mr Collins: live footer credit verified in browser render.
- Excellentia: live footer credit verified in production render.
- Excellentia production URL checked: `https://excellentiavip.com/excellentia-vip`.

### P2 - Mr Collins remote/auth issue resolved for current branch

The earlier Mr Collins push blocker was caused by the wrong active GitHub identity. After switching GitHub CLI back to the Cantoni account for Cantoni operations, the Mr Collins working tree is clean and the live site renders the Cantoni credit.

Earlier blocker:

```text
remote: Repository not found.
fatal: repository 'https://github.com/mrcollinstravel-dr/destination-cocoa-site.git/' not found
```

Guardrail: always verify the active GitHub identity before pushing across Cantoni, Mr Collins and Excellentia repositories.

### P1 - Excellentia repo controlled deploy closed

Excellentia had many existing dirty files unrelated to the Cantoni imprint, so the work was isolated in a clean temporary worktree and committed with an allowlist.

Relevant branch and commits:

- Branch: `codex/excellentia-cantoni-imprint`
- `c6b00dd` - Add Cantoni footer credit to VIP pages
- `a2158b6` - Force local mock auth in VIP preview
- `23f3b5e` - Keep VIP local mocks isolated from live env

### P2 - Live proof strength differs by project

Mr Collins is already strong as multilingual travel infrastructure proof.

Excellentia is solid visually and operationally, and now has the live Cantoni imprint. It should still be strengthened as a public case study with:

- clearer public proof page / case study,
- branded email proof,
- AI/search visibility language where truthful,
- post-launch growth narrative.

## Next Actions

1. Add a live-production credit check to Excellentia gates.
2. Keep the Mr Collins live credit check inside the smoke gate.
3. Improve Cantoni portfolio/case studies so prospects can click from Cantoni to real public proof and back.
4. Add Excellentia branded-email proof to the public/private case-study package after final copy review.
5. Keep future project imprint changes isolated per client repo and verify the active GitHub identity before every push.

## Decision

Mr Collins and Excellentia can now both be presented as public proof with live Cantoni attribution. Use truthful wording: Cantoni Digital Studio contributed digital infrastructure / site systems / booking and commercial flow, without overstating ownership of the client's full business operations.
