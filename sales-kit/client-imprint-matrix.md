# Cantoni Digital Studio imprint matrix

Updated: 2026-05-24

This matrix is the handoff document for every agent working on projects connected to Cantoni Digital Studio. It separates client attribution from Cantoni-owned product attribution and records what is already implemented, what is local-only, and what still needs live deployment.

## Global rule

Every public project should give people a clean path back to Cantoni Digital Studio unless there is a written white-label exception.

The credit must be:

- visible enough to read;
- one integrated clickable object, not disconnected text plus a loose image;
- linked to `https://cantonidigitalstudio.com/`;
- same-tab on public footers unless the project has a specific reason to open a new tab;
- protected by a local check where the project has a test suite.

## Project status

| Project | Type | Public wording | Current status | Next action |
| --- | --- | --- | --- | --- |
| Excellentia VIP | Client | `Digital infrastructure by Cantoni Digital Studio` | Local footer badge rebuilt as integrated Cantoni lockup, left aligned, clickable same-tab. Branded email/QR support already covered locally. | Deploy Excellentia only after project-specific gate and owner approval. |
| Mr Collins Travel | Client | `Digital infrastructure by Cantoni Digital Studio` | Runtime footer and 66 localized static pages include integrated Cantoni lockup, left aligned, clickable same-tab. `test:i18n` passes. | Deploy Collins only after project-specific gate and owner approval. |
| EC8 Platform | Cantoni-owned product/proof | `A Cantoni Digital Studio project` | Local footer component now includes a left-aligned integrated Cantoni lockup, clickable same-tab. This is product-owner wording, not client-agency wording. | Verify live app/store links, then deploy only after EC8-specific gate and owner approval. |
| Coconut Armor | Cantoni-owned product/store | `A Cantoni Digital Studio project` | Local public footers now include a full-row left-aligned integrated Cantoni lockup, clickable same-tab. Checkout/fulfillment language remains Coconut-first. | Verify storefront/policy pages, then deploy only after Coconut-specific gate and owner approval. |
| Future clients | Client | Default client credit unless white-label | Required standard documented in `client-imprint-policy.md`. | Add `docs/cantoni-imprint.md` in each project and a test/audit where possible. |

## Agent handoff

Before touching a connected project, check this file and `client-imprint-policy.md`.

Do not remove an existing Cantoni credit. Do not add a huge Cantoni logo in the client's hero, navigation, checkout copy or sales headline. Do not apply the client wording to Cantoni-owned products without checking the product brand context.

Email rule: client projects can include the Cantoni technical credit in automated confirmations, booking recaps and branded manual shells. Cantoni-owned products should not force the Cantoni mark into transactional checkout/payment emails when that could confuse seller, payment or fulfillment identity; use footer/about/support/policy surfaces unless a product-specific decision says otherwise.

## Verification checklist

- Link opens `https://cantonidigitalstudio.com/`.
- Logo and text are one clickable lockup.
- Contrast is readable on desktop and mobile.
- The client brand remains primary.
- Static pages and generated pages match the runtime footer.
- Tests or a scripted check cover the credit when practical.
