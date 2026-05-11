# Cantoni Digital Studio - Social Launch Runbook

## Current State

- Instagram handle exists and opens publicly: `https://www.instagram.com/cantonidigitalstudio/`. Browser QA on 2026-05-12 confirmed title `Cantoni Digital Studio (@cantonidigitalstudio)`, public profile copy, 3 posts and visible follower count after rejecting optional cookies.
- Facebook Page is not created/public yet. Browser reached `Crea una Pagina`, but login with the official studio email returns that the address is not connected to a Facebook account. Do not create a fake personal profile named `Cantoni Digital Studio`; create the Page from a real owner profile or Meta Business account.
- TikTok login/signup remains blocked in the Browser session. Browser QA on 2026-05-12 reached the email login form, but TikTok returned `Errore interno del server. Riprova piu tardi.` before profile access could be verified.

## Browser Attempt - 2026-05-12

- Instagram: opened `https://www.instagram.com/cantonidigitalstudio/`, rejected optional cookies, and confirmed the profile is visible with `Cantoni Digital Studio`, 3 posts and public follower data.
- Facebook: opened `https://www.facebook.com/pages/create`, entered `Cantoni Digital Studio` and `Web designer`, then Facebook required login. The official studio email is not associated with a Facebook account, so Page creation is blocked until a real owner profile or Meta Business account is available.
- TikTok: opened `https://www.tiktok.com/@cantonidigitalstudio`, was redirected to mandatory login, selected email/username login, and received an internal server error from TikTok. Retry later or complete login manually from a normal browser session before adding the link publicly.

## Browser Attempt - 2026-05-11

- TikTok: opened `https://www.tiktok.com/signup`, selected Google login, chose "Usa un altro account" and entered the official studio email. Google then requested the account password before OAuth/consent, so the flow is paused at manual authentication.
- Facebook: opened `https://www.facebook.com/pages/create`, selected the business/brand path, entered `Cantoni Digital Studio` as page name and `Web designer` as category. Facebook then opened "Non hai effettuato l'accesso" and requires login before the Page can be created.
- Do not use a personal Facebook profile named as the company. The correct target is a Facebook Page owned by a real admin account or Meta Business setup, with the public page URL set to `facebook.com/cantonidigitalstudio` when Meta allows it.

## Sequence

1. Update Instagram profile with the copy in `social-profile-copy.md`.
2. Publish or schedule the first portfolio post only after checking asset and caption.
3. Log in to Facebook with the profile that should own the Page.
4. Create Facebook Page as `Cantoni Digital Studio`.
5. Set category, about text, website, email and phone.
6. Create or recover TikTok account with the official Google/Gmail account or email path.
7. Set handle `@cantonidigitalstudio` if available and confirm the profile opens.
8. Add first post or at least branded profile content.
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
