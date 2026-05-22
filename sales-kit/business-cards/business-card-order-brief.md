# Cantoni Digital Studio - Business Card Order Brief

Status: print-ready files are rebuilt and locally verified, but the MOO cart must not be paid until the rebuilt `premium-v4` PDF with phone, App service tag and updated back copy is visible in the MOO review screen. The print file includes full-color Facebook, Instagram and TikTok icons with `@cantonidigitalstudio`, per the latest order decision.

## Recommendation

Use the current logo system for the first premium run with the new dark premium front and light QR back. The previous light front looked too much like a small brochure; the rebuilt version has stronger contrast, less clutter, larger hierarchy and a clearer first impression.

Selected premium supplier for first order: MOO Italy, Super Business Cards, Soft Touch, square corners. Lower-cost alternatives are documented in `printing-supplier-review-2026-05-06.md`.

For a fast Italian order, prioritize a premium laminated paper card instead of plastic. Plastic is durable, but for a digital studio it can feel more promotional than premium. Best first order:

- Format for MOO: 84 x 55 mm trim, horizontal.
- Print file for MOO: 88 x 59 mm with 2 mm bleed on every side.
- Paper: MOO Super, 380 g/mq.
- Finish: Soft Touch.
- Corners: square for maximum speed.
- Quantity: 200 if keeping the first test controlled; 400 only after the social profiles are live and verified.
- QR: back side, direct to quote page with print UTM.

## Recommended Order

Primary order:

- Supplier: MOO Italy
- Product: Biglietti da visita Super
- Finish: Soft Touch
- Corners: square
- Upload mode: Carica un design completo
- Quantity: 200
- Published product price checked 2026-05-05 and rechecked in cart 2026-05-06: 96,38 EUR VAT included
- Delivery note checked 2026-05-05: MOO states Soft Touch next-day delivery is available if ordered before 12, and general business-card delivery can be within 2 days depending on options.

Upside order if budget is acceptable:

- Same product, quantity 400
- Published product price checked 2026-05-05: 163,48 EUR VAT included

Luxury alternative:

- Supplier: MOO Italy
- Product: Biglietti da visita Luxe
- Quantity 200: 139,08 EUR VAT included
- Quantity 400: 230,58 EUR VAT included
- Note: very premium 600 g/mq, but not soft-touch laminated.

## Supplier Shortlist Checked 2026-05-05

1. MOO - selected for first order because price and delivery information are public and the Super Soft Touch card fits the premium digital-studio positioning.
   - Product to configure: Super Business Cards, Soft Touch, square corners.
   - Price checked: 200 cards 96,38 EUR; 400 cards 163,48 EUR.
   - Link: https://www.moo.com/it/business-cards/super

2. Pixartprinting - backup for a fast Italian laminated run.
   - Product to configure: plasticized business cards, matte or soft-touch both sides.
   - Reason: Italian print-on-demand supplier, dedicated plasticized card product, fast options visible on the product page. Exact product price is produced by the live estimator after selecting options and delivery date.
   - Link: https://www.pixartprinting.it/biglietti-da-visita/plastificati/

3. VistaPrint - backup if the priority becomes speed over premium finish.
   - Product to configure: standard matte cards for 24h delivery, or plastic cards only if delivery date is acceptable.
   - Reason: 24h delivery is mainly for standard matte 85 x 55 mm cards, not all premium finishes.
   - Link: https://www.vistaprint.it/biglietti-da-visita/standard

4. HelloPrint - backup for special materials or PVC.
   - Product to configure: PVC, multistrato, or exclusive finishes.
   - Reason: broad material catalog, including PVC and multistrato.
   - Link: https://www.helloprint.com/it-it/biglietti-da-visita

Operational choice: order 200 MOO Super Soft Touch first only if the new dark-front proof is accepted visually inside MOO. If cost matters more than MOO's tactile finish, test HelloPrint next because the 2026-05-06 review found a lower visible 200-card soft-touch option. If checkout cannot guarantee delivery inside the target date, switch to VistaPrint standard matte for speed or call a local print shop with the Pixart-size PDF.

## Files

- Source proof: `sales-kit/business-cards/cantoni-business-card-print.html`
- QR SVG: `sales-kit/business-cards/qr-cantoni-site.svg`
- Contact data template: `sales-kit/business-cards/contact-data.template.json`
- Export script: `scripts/render_business_card_assets.cjs`

Generated exports after running `npm run build:business-card`:

- MOO file: `sales-kit/business-cards/cantoni-business-card-moo-print.pdf`
- MOO upload file with cache-safe name: `sales-kit/business-cards/cantoni-business-card-moo-premium-v4-2026-05-07.pdf`
- MOO proofs: `sales-kit/business-cards/cantoni-business-card-moo-front-proof.png`, `sales-kit/business-cards/cantoni-business-card-moo-back-proof.png`
- Pixart/local fallback file: `sales-kit/business-cards/cantoni-business-card-print.pdf`
- Pixart/local fallback proofs: `sales-kit/business-cards/cantoni-business-card-front-proof.png`, `sales-kit/business-cards/cantoni-business-card-back-proof.png`

## Current Visual Direction

- Front: dark navy premium field, orange side accent, large Cantoni mark, large name, compact service tags for `Siti`, `E-commerce`, `Web app`, `App`, `Automazioni AI`, and full website/phone/email/social footer.
- Back: light QR-first layout with the headline `Da un'idea a una proposta concreta.`, readable URL split intentionally over two lines.
- Social row: full-color Facebook, Instagram and TikTok icons plus full `@cantonidigitalstudio` handle; no truncation.
- Phone: `+39 347 196 1113`.

## Final Checks Before Order

- Before final payment, verify Facebook and TikTok public profiles are live or acceptable to print as reserved handles.
- Delivery address and target delivery date.

Do not send a version to print if it contains placeholders such as `TO_CONFIRM_BEFORE_PRINT` or `numero da confermare`. The current local MOO PDF avoids those placeholders and includes the confirmed phone number.
