# Cantoni Digital Studio - Social Launch Runbook

## Current State

- Instagram handle exists: `https://www.instagram.com/cantonidigitalstudio/`. QA on 2026-05-14 confirmed name, bio, category, 3 posts, visible follower count, clickable website link `cantonidigitalstudio.com`, no old `zumu.be/ecantoni` link, and the centered official profile avatar from `sales-kit/social-launch/output/instagram-avatar-cantoni.png`. Current source of truth is `npm run test:social-public`: use Instagram as standalone public proof only when the current run reports `public-proof` with `loadError=false`; if the run reports `metadata-proof-load-error`, metadata confirms the official profile but the logged-out visible page rendered a load/error page, so treat Instagram as official metadata proof only.
- Facebook Page exists at `https://www.facebook.com/profile.php?id=61589398630376` / `https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/`. Browser QA on 2026-05-13 confirmed the public page opens without account access, shows `Cantoni Digital Studio`, `Web designer`, the about copy, phone, email, website, Instagram and TikTok references. No private address is published.
- TikTok profile exists and is configured at `https://www.tiktok.com/@cantonidigitalstudio`. Authenticated Google OAuth QA on 2026-05-14 confirmed handle, logo, name `Cantoni Digital Studio` and bio `Siti, e-commerce, web app e app. Automazioni AI e crescita digitale.`. Logged-out QA still redirects to mandatory login, so TikTok is not a standalone public proof channel yet.
- iPad wireless fallback is enabled and verified on 2026-05-13: Developer Mode is active, `idevice_id -n` lists the iPad, CoreDevice reports the device as paired/available, display inspection works without USB, and Instagram is installed as `com.burbn.instagram`. The WebDriverAgent runner is installed, but iOS still requires trust of the Apple Development certificate before future automated mobile-only account flows. The Instagram link/avatar task no longer depends on this fallback because the 2026-05-14 QA below confirms it is resolved.

## Browser QA - 2026-05-14

- Instagram QA: profile opens as `cantonidigitalstudio`, visible brand name `Cantoni Digital Studio`, category `Agenzia di marketing`, bio `Siti, e-commerce, web app e app / Automazioni AI e crescita digitale / cantonidigitalstudio.com`, 3 posts and visible follower data. The clickable profile link is `cantonidigitalstudio.com`; `zumu.be/ecantoni` does not appear. Avatar replacement completed with the centered official asset; screenshot evidence: `/tmp/instagram-cantoni-avatar-persistent-final.png` and `/tmp/instagram-cantoni-public-final-clean.png`.
- TikTok authenticated QA: Google login completes through `Continua con Google`, and the profile opens as `@cantonidigitalstudio` with the correct logo, name and bio; screenshot evidence: `/tmp/tiktok-profile-after-google.png`.
- TikTok logged-out QA: `https://www.tiktok.com/@cantonidigitalstudio` still redirects to `tiktok.com/login?...enter_method=mandatory`; screenshot evidence: `/tmp/tiktok-cantoni-public-google-final.png`. Keep TikTok out of standalone proof links.

## Browser QA - 2026-05-13

- Instagram authenticated QA: profile opens as `cantonidigitalstudio`, visible brand name `Cantoni Digital Studio`, category `Agenzia di marketing`, bio `Siti, e-commerce, web app e app / Automazioni AI e crescita digitale / cantonidigitalstudio.com`, 3 posts and visible follower data. Historical note superseded by the 2026-05-14 QA above: the clickable link still used `zumu.be/ecantoni` at this point and Instagram web blocked link edits; the profile link and centered avatar were both fixed on 2026-05-14 before Instagram was accepted as official profile/link proof. It is standalone public proof only when the current public verifier reports `public-proof` with no load/error page; while current QA reports `metadata-proof-load-error`, treat it as metadata proof only.
- Facebook logged-out QA: the public page opens and exposes the studio name, category, about copy, `347 196 1113`, `cantonidigitalstudio@gmail.com`, `cantonidigitalstudio.com`, Instagram and TikTok references. This is now acceptable as a public proof channel.
- TikTok logged-out QA: `https://www.tiktok.com/@cantonidigitalstudio` redirects to mandatory login (`/login?redirect_url=...&enter_method=mandatory`). Keep TikTok out of public site proof links until this changes or until first content/public visibility is verified.

## Browser Attempt - 2026-05-12

- Instagram: opened `https://www.instagram.com/cantonidigitalstudio/`, rejected optional cookies, and confirmed the profile is visible with `Cantoni Digital Studio`, 3 posts and public follower data.
- Instagram authenticated update: after phone approval/2FA, the profile bio and public website reference were verified live as `Siti, e-commerce, web app e app / Automazioni AI e crescita digitale / cantonidigitalstudio.com`.
- Facebook: opened `https://www.facebook.com/pages/create`, entered `Cantoni Digital Studio` and `Web designer`, then Meta reported an existing managed Page with the same name. The existing Page was opened and Page mode was activated. Marketing-email opt-in in the Page welcome modal was disabled before continuing. After re-authentication, the Page was updated with `https://cantonidigitalstudio.com`, `cantonidigitalstudio@gmail.com`, `+39 347 196 1113`, Instagram `cantonidigitalstudio`, TikTok `cantonidigitalstudio`, the generated cover image and the square Cantoni profile avatar. The private shipping/home address was intentionally not added.
- TikTok: opened `https://www.tiktok.com/@cantonidigitalstudio`, was redirected to mandatory login, selected email/username login, and received an internal server error from TikTok. Retry later or complete login manually from a normal browser session before adding the link publicly.
- TikTok authenticated update: Google OAuth was completed from the TikTok login flow, the profile opened as `@cantonidigitalstudio`, and the live profile now shows the Cantoni logo, name `Cantoni Digital Studio`, handle `cantonidigitalstudio`, and bio `Siti, e-commerce, web app e app. Automazioni AI e crescita digitale.`.
- TikTok public check: unauthenticated HTTP/browser-adjacent fetch on 2026-05-12 still returned generic TikTok login copy, so TikTok remains configured but not accepted as a standalone public proof channel.
- Facebook cover asset: `npm run build:social` generates `sales-kit/social-launch/output/facebook-cover-cantoni.png` at 1640 x 624 and it has been uploaded to the live Page.
- QA update: Facebook Page has been verified in authenticated Page mode after the update. Earlier public Browser QA showed the brand page resolves; re-run logged-out QA after cache propagation. TikTok has name, bio and avatar configured in the authenticated Browser session; re-run logged-out QA before treating it as a public proof link.

## Browser Attempt - 2026-05-11

- TikTok: opened `https://www.tiktok.com/signup`, selected Google login, chose "Usa un altro account" and entered the official studio email. Google then requested the account password before OAuth/consent, so the flow is paused at manual authentication.
- Facebook: opened `https://www.facebook.com/pages/create`, selected the business/brand path, entered `Cantoni Digital Studio` as page name and `Web designer` as category. Facebook then opened "Non hai effettuato l'accesso" and requires login before the Page can be created.
- Do not use a personal Facebook profile named as the company. The correct target is a Facebook Page owned by a real admin account or Meta Business setup, with the public page URL set to `facebook.com/cantonidigitalstudio` when Meta allows it.

## Sequence

1. Publish or schedule the first portfolio post only after checking asset and caption.
2. Add first TikTok portfolio/method post or at least branded profile content.
3. Re-run TikTok logged-out QA after first content/public-profile propagation.
4. If logged-out TikTok QA passes, add TikTok to public social references.
5. Only after final social QA, update `identita-operativa.html`, footer, JSON-LD `sameAs`, outreach templates and integrity tests.

## First Publishing Batch

Recommended order:
1. Excellentia VIP portfolio proof.
2. Mr Collins Travel booking flow.
3. EC8 Platform positioning.
4. Method: preventivi dopo audit.
5. Service range: siti, e-commerce, app, automazioni AI.

## Quality Rules

- Every portfolio post must link to or show a real public project.
- No absolute superiority claims in public copy.
- No client name unless the project is already public and linkable.
- No pricing in social posts unless tied to a published, scoped offer.
- No paid ads before the profile has at least three credible posts.

## Browser QA Gate

For each social URL:
- open logged out or incognito-equivalent
- confirm title/handle matches Cantoni Digital Studio
- confirm website link is visible or reachable
- for standalone proof, confirm no login wall and no visible load/error page for the basic public profile
- if the verifier reports `metadata-proof-load-error`, treat the channel as official metadata proof only, not as standalone public proof
- take screenshot evidence before adding link to website
