# Cantoni Digital Studio - Social Profile Setup Checklist

The current business-card print file includes full-color Facebook, Instagram and TikTok icons with `@cantonidigitalstudio`. Before using these channels in public proposals, verify each profile opens correctly in a logged-out browser, or treat Facebook/TikTok as reserved handles to activate immediately.

## Browser QA - 2026-05-10

- Instagram `https://www.instagram.com/cantonidigitalstudio/`: official handle exists, but the 2026-05-10 logged-out Browser session redirected to Instagram login. Treat it as the official studio handle, not as a standalone public proof channel.
- TikTok `https://www.tiktok.com/@cantonidigitalstudio`: redirects to mandatory login, so it is not accepted yet as a public verification channel.
- Facebook `https://www.facebook.com/cantonidigitalstudio`: shows content unavailable while logged out, so it is not accepted yet as a public verification channel.
- Public site rule: do not publish Facebook/TikTok links on `cantonidigitalstudio.com` until they are public, branded, have first content, and pass logged-out Browser QA.

## Browser QA - 2026-05-12

- Instagram `https://www.instagram.com/cantonidigitalstudio/`: public Browser QA passed after rejecting optional cookies. The page title is `Cantoni Digital Studio (@cantonidigitalstudio)`, and the visible profile shows `Cantoni Digital Studio`, 3 posts and public follower data.
- Facebook Page creation: blocked. The official studio email is not connected to a Facebook account, so Meta will not let the Browser create the Page from that login. Correct path: use a real owner profile or Meta Business account, then create a Page named `Cantoni Digital Studio`; do not create a fake personal profile named as the studio.
- TikTok `https://www.tiktok.com/@cantonidigitalstudio`: still not accepted as a public verification channel in this Browser session. TikTok redirects to mandatory login and the email login flow returned an internal server error on 2026-05-12.

## Browser Setup Attempt - 2026-05-11

- TikTok signup is open and ready, but Google OAuth is paused at password/manual verification for the official studio email.
- Facebook Page creation accepts `Cantoni Digital Studio` and `Web designer`, but Meta blocks the final creation behind login/Page ownership.
- The Facebook target must be a Page, not a personal profile with the company name.

## Handles

- Instagram: `@cantonidigitalstudio` - already used by the site as official handle.
- Facebook Page: `Cantoni Digital Studio` with preferred URL `facebook.com/cantonidigitalstudio`.
- TikTok: `@cantonidigitalstudio`.
- Optional but recommended for B2B: LinkedIn Company Page `Cantoni Digital Studio`.

## Profile Copy

Short bio:

Siti, e-commerce, app e automazioni AI per aziende. Preventivi chiari, pagamenti integrati, delivery multilingua.

Website:

https://cantonidigitalstudio.com

Contact email:

cantonidigitalstudio@gmail.com

Phone / WhatsApp:

+39 347 196 1113

## Launch Checks

- Use the same logo/avatar as the site: `assets/logo/cantoni_icona_quadrata.png`.
- Use the same brand name everywhere: `Cantoni Digital Studio`.
- Facebook/TikTok public links must open without login before being added to the website. Instagram may show a platform login wall, so it must not be used as the only verification proof.
- Bio must not promise impossible delivery or fixed prices without scope.
- Instagram, Facebook and TikTok handles must be tested before adding them to a print order.
- After Facebook/TikTok are public, update `identita-operativa.html`, footer references, JSON-LD `sameAs`, outreach templates and `scripts/verify_site_integrity.cjs`.
