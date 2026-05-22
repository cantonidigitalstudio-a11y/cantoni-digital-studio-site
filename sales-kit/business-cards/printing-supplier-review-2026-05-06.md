# Business Card Supplier Review - 2026-05-06

## Decision

MOO remains the safest premium option for the first batch, but it is not the cheapest. For a lower-cost order with similar soft-touch intent, the strongest alternative to test next is HelloPrint "Biglietti da visita nobilitati" configured with:

- 200 cards
- front/back print
- soft touch front/back lamination
- both-side finish
- uploaded print-ready PDF

## Current MOO Cart

- Supplier: MOO Italy
- Product: Super Soft Touch business cards
- Quantity: 200
- Paper: Super, 380 gsm
- Finish: Soft Touch
- Corners: square
- Public price table: 200 cards at 0.40 EUR/card, 96.38 EUR package price.
- Cart observed: 79.00 EUR VAT excluded, 96.38 EUR VAT included before payment details.

Why it is expensive: MOO Super uses thicker 380 gsm card, bundled front/back color printing, soft-touch finish and premium positioning. The price is high for field prospecting, but defensible for a first small batch if the goal is strong tactile impression and fast delivery.

## Alternatives Checked

### HelloPrint

- Page checked: `https://www.helloprint.com/it-it/bigliettidavisitanobilitati`
- Relevant configuration shown by page: soft-touch lamination front/back is available.
- 200 cards: 65.99 EUR VAT excluded in the price table.
- Delivery shown on page: estimated Thursday 14 May 2026 for the visible configuration.
- Risk: paper shown is 300 gsm Invercote by default, so it is cheaper than MOO but not identical to MOO Super 380 gsm.

### Pixartprinting

- Page checked: `https://www.pixartprinting.it/biglietti-da-visita/plastificati/`
- Soft touch is available and described as a velvet-touch laminated card option.
- It supports front/back print and multiple formats including 8.5 x 5.5 cm.
- Risk: live price depends on configurator choices and delivery date; static page does not expose a reliable exact total.

### Ediprint

- Page checked: `https://www.ediprint.it/piccolo-formato/biglietti-da-visita/biglietti-da-visita-plastificati`
- Soft touch is available.
- Public table shows very low base prices, for example 250 cards at 24.00 EUR before VAT in the visible configuration.
- Risk: the visible table may be a default/base configuration, not guaranteed to match our exact front/back soft-touch premium file without configuring every option.

### MPrint

- Page checked: `https://www.mprint.it/prodotto/biglietti-da-visita-plastificati-soft-touch/`
- Soft touch front/back and 24h print are advertised.
- Price range shown: 43.00-82.00 EUR for 100/200/300 and single/front-back variants.
- Risk: exact 200 front/back total is not visible in static text without selecting variants; supplier depth/QA is less clear than MOO or Pixart.

## Recommendation

Do not pay MOO until the final visual proof is accepted. If cost matters more than the premium MOO feel, test HelloPrint next because it exposes a clear 200-card soft-touch front/back price lower than MOO. If print quality and brand impression matter more, keep MOO for the first 200 and treat it as a premium first-contact batch.

## Current Design QA Notes

- The MOO PDF has been rebuilt after correcting the social-icon row.
- Instagram no longer touches the circle border.
- Local proof resolution was increased for sharper review screenshots.
- The PDF remains vector-first; the only raster image detected is the QR code at 300 ppi.
- MOO's web preview can appear softer than the source file because it rasterizes thumbnails in the browser.
