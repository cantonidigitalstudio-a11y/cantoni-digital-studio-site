# Day 1 Outbound Runbook

## Objective
Launch a controlled first outbound batch with 20 verified global leads, high personalization, and zero account/session ambiguity.

## Single source of truth
- CRM file: `sales-kit/lead_pipeline.csv`
- Queue file: `sales-kit/queue/outreach_queue.json`
- Quote inputs: `sales-kit/quote-inputs/`
- Quote/email outputs: `sales-kit/generated/`

## Mandatory lead statuses
- `RESEARCH_PENDING`
- `RESEARCH_VERIFIED`
- `READY_TO_CONTACT`
- `CONTACTED`
- `REPLIED`
- `QUOTE_IN_PROGRESS`
- `QUOTE_SENT`
- `FOLLOWUP_D3`
- `FOLLOWUP_D7`
- `CLOSED_WON`
- `CLOSED_LOST`

## Gate before queue generation
A lead can enter queue only if all of the following are filled:
- `business_name`
- `website`
- `email`
- `country`
- `preferred_language`
- `currency`
- `what_the_business_does`
- `top_3_issues_found`
- `top_3_improvements_proposed`
- `expected_business_impact_range`
- `recommended_package`
- `recommended_currency`
- `recommended_language`
- `email_angle`
- `notes`

## Day 1 execution order
1. Verify Google account binding and Gmail session
   - `./scripts/run_gmail_checks.sh`
   - Continue only if account verified is `cantonidigitalstudio@gmail.com`
2. Validate CRM integrity
   - `npm run day1:prepare`
   - Continue only if `ready_gate_failures=[]`
3. Build outbound queue
   - included in `npm run day1:prepare`
4. Review queue manually
   - check language, currency, subject, body
   - confirm no generic lines or broken multilingual content
5. Send one internal test first
   - included in `npm run day1:prepare`
   - preferred path: Apps Script background worker
   - `SEND_ENABLED=false MAX_PER_RUN=1 npm run day1:send -- sales-kit/queue/internal_test_queue.json`
   - verify response is clean before real send
6. Start first real batch
   - max 20
   - `SEND_ENABLED=true MAX_PER_RUN=20 npm run day1:send -- sales-kit/queue/outreach_queue.json`
   - use Playwright Gmail worker only as fallback
7. Confirm CRM sync after send
   - sent leads must move to `CONTACTED`
   - `next_action_date` must be day+3
   - `last_action` must mention background worker
8. Monitor replies
   - classify to `REPLIED`
   - for warm/hot replies move to `QUOTE_IN_PROGRESS`
9. Generate quotes only where commercially justified
   - hot reply
   - high-value target
   - clear request for proposal

## Quote generation flow
1. Create quote input from lead:
   - `node sales-kit/scripts/create_quote_input_from_lead.mjs --lead-id LD-1001`
2. Review/refine the generated JSON if needed
3. Generate branded quote + email:
   - `node sales-kit/scripts/generate_personalized_quote.mjs --input sales-kit/quote-inputs/<file>.json --output-dir sales-kit/generated`

## Non-negotiable rules
- No queue generation from incomplete audits
- No sending from wrong Google account
- No foreground-browser dependence for day-1 batch
- No generic first email
- No first-touch full quote unless commercially justified
- No manual spreadsheet edits without keeping CSV as source of truth
