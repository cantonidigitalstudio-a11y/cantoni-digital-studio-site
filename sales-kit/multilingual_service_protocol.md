# Multilingual Service Protocol (Worldwide)

## Objective
Deliver outreach, proposals, and replies in the client's language for any market.

## Mandatory Workflow
1. Detect lead language from website + email + country.
2. Store `preferred_language` in CRM.
3. Generate first outreach in same language.
4. Keep all follow-ups in same language unless client changes it.
5. Build quote in same language and currency context.

## Language Strategy
- Tier 1 supported natively in site UX: IT, EN, ES, FR, DE, PT, AR, RU, ZH, JA, HI.
- Tier 2+ markets: use language-preserving response generation using the same master templates.
- Rule: never send mixed-language emails.

## Quality Controls
- Preserve offer structure across languages.
- Preserve legal/payment sections across languages.
- Validate tone: professional, concise, commercial.

## CRM Fields (required)
- preferred_language
- country
- market
- first_contact_language
- current_quote_language
- translation_quality_check (PASS/REVIEW)

## SLA
- New inbound: <24h response in customer language.
- Hot lead: <2h response in customer language.
