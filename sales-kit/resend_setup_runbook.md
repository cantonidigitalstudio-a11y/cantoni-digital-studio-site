# Resend Setup Runbook (Cantoni Digital Studio)

## Goal
Use Resend as transactional + outreach-safe email infrastructure for multilingual client communication.

## Account
- Login email: cantonidigitalstudio@gmail.com

## Steps
1. Create/enter Resend account with business email.
2. Add sending domain (recommended: mail.cantonidigitalstudio.com).
3. Configure DNS records in domain provider:
   - SPF TXT
   - DKIM CNAME(s)
   - Return-Path / Tracking domain CNAME
4. Verify domain in Resend dashboard.
5. Create API key with `Sending access`.
6. Store API key securely (never in frontend files).
7. Set sender identities:
   - hello@...
   - quotes@...
   - support@...
8. Warm-up plan:
   - Day 1-3: low volume
   - Day 4-7: progressive increase

## Operational Rules
- No bulk spam blasts.
- Always include business context and clear opt-out.
- Keep language consistent with lead preferred_language.

## Environment variables (backend only)
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- RESEND_REPLY_TO
