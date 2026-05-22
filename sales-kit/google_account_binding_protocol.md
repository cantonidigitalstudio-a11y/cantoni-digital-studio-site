# Google Account Binding Protocol

## Objective
Force this project to operate only with `cantonidigitalstudio@gmail.com` using one dedicated persistent browser profile.

## Binding rules
- One profile only: `/Volumes/Lexar/playwright-profiles/cantoni-gmail`
- One expected Google account only: `cantonidigitalstudio@gmail.com`
- One auth context only: value from `.gmail-env.sh`
- No operations based on the frontmost Chrome tab

## Verification flow
1. `scripts/gmail_session_setup.sh`
2. `sales-kit/scripts/gmail_preflight.mjs`
3. Binding marker written to `sales-kit/queue/account_binding.json`
4. Only then run outreach / reply / worker scripts

## Why this matters
- Multiple Codex agents may run on the same machine.
- Multiple Google accounts may be open at once.
- Frontmost browser state is not a reliable trust boundary.

## Binding marker
File: `sales-kit/queue/account_binding.json`

It records:
- verified account email
- authuser
- dedicated profile dir
- verification timestamp

## Rule
If the verified account in the binding marker is not `cantonidigitalstudio@gmail.com`, operations must stop.
