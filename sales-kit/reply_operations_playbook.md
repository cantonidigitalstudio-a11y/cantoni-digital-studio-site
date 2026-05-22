# Reply Operations Playbook

## Objective
Turn inbound replies into fast commercial movement, not generic back-and-forth.

## Temperature model

- `OPERATIVE_URGENT`
  - delivery failed / impossible delivery
  - supplier order issue
  - payment/account/security warning
  - domain/deploy/billing issue
- `OPERATIVE_WAIT`
  - delivery in transit
  - supplier acknowledgement
  - generic account notice with no action needed
- `HOT`
  - asks for price
  - asks for timing
  - asks for proposal
  - asks how to start
- `WARM`
  - asks for more detail
  - asks for examples
  - asks for a call before proposal
- `COLD`
  - vague curiosity, no concrete next step
  - internal forwarding without owner engagement
- `NOT_RELEVANT`
  - no interest
  - wrong contact
  - no budget / no project

## CRM mapping
- `OPERATIVE_URGENT` -> not a lead status; create operational action and notify the user before any irreversible step
- `OPERATIVE_WAIT` -> log only, no commercial pipeline mutation
- `HOT` + pricing/details requested -> `QUOTE_IN_PROGRESS`
- `HOT` + proposal delivered -> `QUOTE_SENT`
- `WARM` + real engagement -> `REPLIED`
- `COLD` -> `REPLIED` until disqualified
- `NOT_RELEVANT` -> `CLOSED_LOST`
- signed / approved -> `CLOSED_WON`

## SLA
- hot reply: answer within 2 hours
- warm reply: answer within 24 hours
- full quote after qualified interest: within 24 hours

## Reply rules
- always reply in the lead language
- keep language commercial and simple
- mention business outcome, not technical stack
- move toward one concrete next step:
  - send roadmap
  - send quote
  - confirm service priority
  - close thread

## Mandatory scenarios
- interested
- asks_price
- asks_call
- asks_details
- not_interested

## Practical decision rule
- if the lead is asking "how much / when / how do we start" -> do not keep chatting; move to proposal
- if the lead wants a call before reading anything -> send written proposal first, then optional call
- if the lead is not interested -> close professionally, keep door open
