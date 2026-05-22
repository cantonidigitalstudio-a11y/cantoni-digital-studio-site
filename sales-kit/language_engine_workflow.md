# Global Language Engine Workflow

## Objective
Send proposals and replies in the client's native language with commercial consistency.

## Process
1. Detect lead language.
2. Generate response from master template in source language (EN base).
3. Localize to target language preserving structure:
   - problem
   - solution
   - timeline
   - pricing
   - CTA
4. Run quality check:
   - no mixed language
   - numbers unchanged
   - legal/payment terms preserved
5. Save sent version in CRM note.

## Languages
Primary: IT, EN, ES, FR, DE, PT, AR, RU, ZH, JA, HI.
Extended: any language on request using same workflow.

## Quote Currency Rule
- Internal pricing baseline: EUR.
- Client-facing quote currency: local market currency where useful.
- Include line: "Reference conversion timestamp: {ISO_DATETIME_UTC}".
