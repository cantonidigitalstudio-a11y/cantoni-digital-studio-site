# Next Batch Lead Quality Standard

## Priority sectors
- dental
- clinic
- beauty / med spa
- legal
- hospitality
- real estate
- high-ticket local services

## Minimum qualification
- real business website
- visible verified email
- clear service offer
- obvious conversion weakness or positioning weakness
- enough information to write a personalized commercial opening

## Disqualifiers
- no usable email
- fake / parked / placeholder site
- marketplace profile only
- no clear service value
- low-ticket business with unclear ROI
- outreach copy would become generic

## Mandatory audit before READY_TO_CONTACT
- what business does
- 3 concrete issues
- 3 concrete improvements
- expected business impact range
- recommended package
- recommended solution type: website / ecommerce / web_app / mobile_app / platform / automation_ai / monthly_growth
- reason why that solution fits and why heavier alternatives are not priority
- subject line that names the business and the audited area
- local language
- local currency

## First-contact copy standard
- first email uses `OUTREACH_STYLE=micro_audit`
- one specific observation only
- one plain business consequence
- one permission-based question
- no prices
- no full 3-point audit in the first touch
- the full 3 issues and 3 improvements stay in `internal_audit` until the lead replies or asks for detail

## Batch rule
- better 20 strong leads than 100 weak leads
- do not move to READY_TO_CONTACT until audit is commercially specific
- run `npm run test:outreach-micro` for first-touch copy and `npm run test:outreach-queue-quality` for complete-audit/internal review batches
- if the proposal could be reused for another client by changing only the name, it is not ready
