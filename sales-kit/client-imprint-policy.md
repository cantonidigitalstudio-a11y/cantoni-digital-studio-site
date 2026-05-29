# Cantoni Digital Studio client imprint policy

## Objective

Every public client project should be able to point back to Cantoni Digital Studio in a visible, discreet and professional way, unless the client has a written white-label exception.

The imprint must build trust without weakening the client's brand.

## Default Credit

Use one of these formats:

- English: `Digital infrastructure by Cantoni Digital Studio`
- Italian: `Infrastruttura digitale realizzata da Cantoni Digital Studio`

The credit should link to:

`https://cantonidigitalstudio.com/`

## Where To Place It

- Public website footer.
- Automated customer emails, booking recaps and operational confirmations.
- Dashboard support/about/account pages where a technical provider credit is natural.
- Privacy, cookie or terms pages when Cantoni is a technical or commercial provider.
- Case studies and portfolio pages on Cantoni channels after the client work is public.

## Where Not To Place It

- Above-the-fold hero sections.
- Checkout-critical copy where it could distract from payment or trust.
- Personal/manual emails unless the message is clearly sent by Cantoni Digital Studio.
- Projects sold under a written white-label agreement.
- Hidden SEO-only links, keyword-stuffed text or invisible attribution.

## Visual Rules

- Keep the credit smaller than primary brand copy.
- Use muted color, but keep it readable.
- Do not use near-invisible low-contrast colors: discreet means secondary, not hidden.
- Do not use a loud badge unless the project explicitly needs an agency proof mark.
- Never make the client look like a sub-brand of Cantoni.
- The link must be explicit and human-readable, not hidden in decorative text.

## Commercial Rule

If a client requests removal of the public credit or a fully white-label delivery, that must be agreed before work starts and can affect pricing, portfolio rights and maintenance terms.

Default position: Cantoni can show the work as portfolio proof and can include a discreet technical credit.

## Agent Handoff Rule

Any agent working on a client project connected to Cantoni Digital Studio must check this policy before changing public pages, automated emails, booking flows, QR/NFC cards, admin/about pages or portfolio proof.

Do not add a large Cantoni logo inside the client's primary hero, navigation, checkout copy or sales headline unless the client explicitly asks for a co-branded delivery.

The default imprint is a small technical credit:

`Digital infrastructure by Cantoni Digital Studio`

It must be:

- visible to humans;
- linked to `https://cantonidigitalstudio.com/` with a real clickable `<a>` element, not plain text;
- co-branded with the official Cantoni Digital Studio lockup inside the same link when the surface supports images;
- rendered as one integrated brand unit, not as detached text plus a separate icon;
- strong enough to be noticed: use a small badge/pill when a plain text footer would be too weak;
- clickable as a single object; same-tab navigation is preferred on public footers because the click result is obvious;
- styled smaller than the client brand;
- readable on the actual background in desktop and mobile viewports;
- placed where provider attribution is natural;
- present in static/public output when a project has static localized pages;
- covered by a test or audit when the project has an existing QA suite.

## Client vs Owned Product

Use two different patterns:

- Client projects: `Digital infrastructure by Cantoni Digital Studio`.
- Cantoni-owned products: `A Cantoni Digital Studio project` or `Built by Cantoni Digital Studio`, depending on the brand architecture.

Do not blindly apply the client footer to owned products such as EC8 Platform or Coconut Armor. Those products can point more clearly to Cantoni, but the wording must make the relationship understandable: product owned/operated by the Cantoni ecosystem, not an outside client attribution.

For emails, keep the same distinction:

- Client projects can carry the Cantoni technical credit in automated confirmations, booking recaps and branded manual shells when the client brand remains primary.
- Cantoni-owned products should use Cantoni attribution in footer/about/support/policy surfaces first. Do not force it into checkout/payment/fulfillment emails if it can confuse who sells, charges, ships or supports the product.

## Current Implementation Map

### Mr Collins Travel

Implemented as a footer technical credit in the public site:

`Digital infrastructure by Cantoni Digital Studio`

Coverage:

- runtime footer in `app.js`;
- localized static HTML pages for all generated language folders;
- booking handoff text in `booking.handoff.js`;
- i18n audit now blocks localized pages missing the Cantoni credit/link;
- same-tab link target: `https://cantonidigitalstudio.com/`;
- official Cantoni lockup rendered as one integrated clickable unit.

Reasoning:

Mr Collins is a travel brand, so Cantoni must stay in the footer and technical handoff layer. A large Cantoni logo in the main booking journey would weaken the Mr Collins brand and could distract from booking conversion.

### Excellentia VIP

Implemented as a footer/email/QR technical credit:

`Digital infrastructure by Cantoni Digital Studio`

Coverage:

- public site footer;
- branded manual email shell;
- QR/NFC card support panel;
- same-tab link target: `https://cantonidigitalstudio.com/`;
- official Cantoni lockup rendered as one integrated clickable unit.

Reasoning:

Excellentia VIP is a premium chauffeur brand. Cantoni should appear as infrastructure/provenance, not as a competing visible brand inside the premium sales surface.

### EC8 Platform / Other Cantoni Projects

Before adding public proof, verify the live app/site links and store listings. If the project is a Cantoni-owned product, the imprint can be stronger than a client footer credit, but it still needs to respect the product brand.

Recommended pattern:

`A Cantoni Digital Studio project`

Use this in footer/about/support surfaces, not as a replacement for the EC8 or Coconut Armor primary brand.

### Coconut Armor

Implemented locally as a public footer product credit:

`A Cantoni Digital Studio project`

Coverage:

- public storefront footer and legal/support pages;
- same-tab link target: `https://cantonidigitalstudio.com/`;
- official Cantoni lockup rendered as one integrated clickable unit;
- left-aligned full-row footer placement after the Coconut Armor brand block.

Reasoning:

Coconut Armor is a Cantoni-owned store, so the public site should reveal the studio behind the product. Checkout, payment and fulfillment copy must remain Coconut-first to avoid confusing the customer about seller, payment and delivery identity.

### Future Client Projects

For each client project, add a short local doc or README note named `cantoni-imprint.md` or equivalent, covering:

- where the credit appears;
- whether email/notifications include it;
- whether static pages include it;
- which audit/test protects it;
- whether the project is normal attribution or white-label.
