# Cantoni Digital Studio - Social Launch Runbook

## Current State

- Instagram handle exists and opens publicly: `https://www.instagram.com/cantonidigitalstudio/`. Browser QA on 2026-05-12 confirmed title `Cantoni Digital Studio (@cantonidigitalstudio)`, public profile copy, 3 posts and visible follower count after rejecting optional cookies.
- Facebook Page exists at `https://www.facebook.com/profile.php?id=61589398630376` / `https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/`. Browser QA on 2026-05-12 confirmed Meta blocks duplicate creation with "gestisci già una Pagina di nome Cantoni Digital Studio". Logged-out/public Browser QA also shows the page name, follower area, category `Web designer` and live bio. Page management is reachable after switching into Page mode, but contact-field cleanup is currently blocked by Meta reCAPTCHA during re-login.
- TikTok profile exists and is configured at `https://www.tiktok.com/@cantonidigitalstudio`. Authenticated Browser QA on 2026-05-12 confirmed handle, logo, name `Cantoni Digital Studio` and bio `Siti, e-commerce, web app e app. Automazioni AI e crescita digitale.`. Logged-out QA is still required before treating TikTok as a fully public proof channel.

## Browser Attempt - 2026-05-12

- Instagram: opened `https://www.instagram.com/cantonidigitalstudio/`, rejected optional cookies, and confirmed the profile is visible with `Cantoni Digital Studio`, 3 posts and public follower data.
- Instagram authenticated update: after phone approval/2FA, the profile bio was updated and verified live as `Siti, e-commerce, web app e app / Automazioni AI e crescita digitale / cantonidigitalstudio.com`.
- Instagram link limitation: the clickable website field still points to `zumu.be/ecantoni`; Instagram desktop shows that field as disabled and says link edits are available only from the mobile app. Fix from the phone app before treating Instagram as fully production-clean.
- Facebook: opened `https://www.facebook.com/pages/create`, entered `Cantoni Digital Studio` and `Web designer`, then Meta reported an existing managed Page with the same name. The existing Page was opened and Page mode was activated. Marketing-email opt-in in the Page welcome modal was disabled before continuing. Public business details still need final edit after manual reCAPTCHA completion; do not publish the private shipping/home address.
- TikTok: opened `https://www.tiktok.com/@cantonidigitalstudio`, was redirected to mandatory login, selected email/username login, and received an internal server error from TikTok. Retry later or complete login manually from a normal browser session before adding the link publicly.
- TikTok authenticated update: Google OAuth was completed from the TikTok login flow, the profile opened as `@cantonidigitalstudio`, and the live profile now shows the Cantoni logo, name `Cantoni Digital Studio`, handle `cantonidigitalstudio`, and bio `Siti, e-commerce, web app e app. Automazioni AI e crescita digitale.`.
- Facebook cover asset: `npm run build:social` now generates `sales-kit/social-launch/output/facebook-cover-cantoni.png` at 1640 x 624 for the existing Page. Upload it only after reCAPTCHA is cleared and Page management is available.
- Logged-out QA update: Facebook public page resolves and shows brand content; TikTok still redirects to mandatory login, so TikTok remains a reserved/branded handle rather than a public proof link.

## Browser Attempt - 2026-05-11

- TikTok: opened `https://www.tiktok.com/signup`, selected Google login, chose "Usa un altro account" and entered the official studio email. Google then requested the account password before OAuth/consent, so the flow is paused at manual authentication.
- Facebook: opened `https://www.facebook.com/pages/create`, selected the business/brand path, entered `Cantoni Digital Studio` as page name and `Web designer` as category. Facebook then opened "Non hai effettuato l'accesso" and requires login before the Page can be created.
- Do not use a personal Facebook profile named as the company. The correct target is a Facebook Page owned by a real admin account or Meta Business setup, with the public page URL set to `facebook.com/cantonidigitalstudio` when Meta allows it.

## Sequence

1. Fix the Instagram clickable website link from the mobile app: replace `zumu.be/ecantoni` with `https://cantonidigitalstudio.com`.
2. Publish or schedule the first portfolio post only after checking asset and caption.
3. Complete Facebook reCAPTCHA manually if Meta requests it during login.
4. Open the existing Facebook Page `61589398630376` in Page management mode.
5. Set category, about text, website, email and phone; do not add the private shipping/home address unless explicitly approved for public use.
6. Re-run logged-out TikTok QA for `https://www.tiktok.com/@cantonidigitalstudio`; current result is mandatory login.
7. Add first TikTok portfolio/method post or at least branded profile content.
8. If logged-out TikTok QA passes, add TikTok to public social references.
9. Verify Facebook and TikTok logged out.
10. Only then update `identita-operativa.html`, footer, JSON-LD `sameAs`, outreach templates and integrity tests.

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
