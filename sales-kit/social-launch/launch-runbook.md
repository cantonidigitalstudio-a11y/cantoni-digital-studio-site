# Cantoni Digital Studio - Social Launch Runbook

## Current State

- Instagram handle exists and opens in the authenticated Browser: `https://www.instagram.com/cantonidigitalstudio/`. Browser QA on 2026-05-13 confirmed name, bio, category, 3 posts and visible follower count. Open issue: the profile website link still resolves as `zumu.be/ecantoni`; Instagram web disables the website field and states that link edits are available only from the mobile app. Fix from the Instagram mobile app before using Instagram as the cleanest public proof channel.
- Facebook Page exists at `https://www.facebook.com/profile.php?id=61589398630376` / `https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/`. Browser QA on 2026-05-13 confirmed the public page opens without account access, shows `Cantoni Digital Studio`, `Web designer`, the about copy, phone, email, website, Instagram and TikTok references. No private address is published.
- TikTok profile exists and is configured at `https://www.tiktok.com/@cantonidigitalstudio`. Authenticated Browser QA on 2026-05-12 confirmed handle, logo, name `Cantoni Digital Studio` and bio `Siti, e-commerce, web app e app. Automazioni AI e crescita digitale.`. Logged-out QA is still required before treating TikTok as a fully public proof channel.
- iPad wireless fallback is enabled and verified on 2026-05-13: Developer Mode is active, `idevice_id -n` lists the iPad, CoreDevice reports `transportType: localNetwork`, and display inspection works without USB. Instagram is not installed on that iPad (`com.burbn.instagram` absent from the app list), so the Instagram link fix still requires installing Instagram on the iPad or using the already logged-in iPhone.

## Browser QA - 2026-05-13

- Instagram authenticated QA: profile opens as `cantonidigitalstudio`, visible brand name `Cantoni Digital Studio`, category `Agenzia di marketing`, bio `Siti, e-commerce, web app e app / Automazioni AI e crescita digitale / cantonidigitalstudio.com`, 3 posts and visible follower data. Website link issue remains: the clickable link is still `zumu.be/ecantoni`, and Instagram web blocks editing it.
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

1. Install Instagram on the wireless iPad or use the already logged-in iPhone, then fix the Instagram profile link from the mobile app: remove `zumu.be/ecantoni` and set `https://cantonidigitalstudio.com`.
2. Re-run Instagram QA and capture evidence that the clickable profile link is the studio domain.
3. Re-run logged-out TikTok QA for `https://www.tiktok.com/@cantonidigitalstudio`.
4. Publish or schedule the first portfolio post only after checking asset and caption.
5. Add first TikTok portfolio/method post or at least branded profile content.
6. If logged-out TikTok QA passes, add TikTok to public social references.
7. Only after final social QA, update `identita-operativa.html`, footer, JSON-LD `sameAs`, outreach templates and integrity tests.

## First Publishing Batch

Recommended order:
1. Excellentia VIP portfolio proof.
2. Destination Cocoa / Mr Collins booking flow.
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
- confirm no login wall for basic public profile
- take screenshot evidence before adding link to website
