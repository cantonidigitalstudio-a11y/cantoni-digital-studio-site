# Excellentia VIP notification flow

## Goal

After a successful payment, the system must generate four confirmations:

1. Email to the client
2. Email to the operator or driver assigned to the service
3. WhatsApp confirmation to the client
4. WhatsApp dispatch message to the operator or driver

## Trigger

- Event: `payment_succeeded`
- Source: verified checkout callback or payment webhook
- Guard: process once per `booking_id` + `payment_id`

## Required booking payload

- `booking_id`
- `payment_id`
- `payment_status`
- `service_type`
- `route_label`
- `pickup_date`
- `pickup_time`
- `guest_name`
- `guest_phone`
- `guest_email`
- `vehicle_tier`
- `package_name`
- `extras[]`
- `total_amount`
- `currency`
- `occasion_label`
- `internal_operator_name`
- `internal_operator_email`
- `internal_operator_whatsapp`
- `booking_notes`

## Notification outputs

### Client email

- Subject: `Your Excellentia VIP booking is confirmed`
- Include:
  - booking code
  - payment status
  - service selected
  - route
  - date and time
  - vehicle tier
  - package
  - extras
  - total paid
  - WhatsApp support CTA

### Operator email

- Subject: `New paid booking assigned | {booking_id}`
- Include:
  - guest name
  - guest phone
  - pickup timing
  - route
  - vehicle tier
  - package
  - extras
  - occasion details
  - internal notes
  - payment confirmed

### Client WhatsApp

- Include:
  - booking code
  - paid confirmation
  - route
  - date and time
  - vehicle tier
  - extras summary
  - support contact / next coordination step

### Driver WhatsApp

- Include:
  - booking code
  - guest name
  - guest phone
  - service type
  - route
  - time
  - package
  - extras
  - occasion setup required
  - operational note

## Idempotency

- Store a notification ledger keyed by:
  - `booking_id`
  - `payment_id`
  - `channel`
  - `recipient`
- Never resend if the ledger already marks the notification as `sent`
- Allow manual resend only with explicit operator action

## Failure handling

- If WhatsApp fails:
  - keep email path active
  - mark WhatsApp channel as `failed`
  - surface retry action in back office

- If operator is not assigned yet:
  - send the operator email to the operations inbox
  - send the operator WhatsApp only after assignment

- If payment webhook repeats:
  - ignore the duplicate event by ledger check

## Frontend success state

After payment, the frontend success state should show:

- paid confirmation badge
- booking code
- route
- date and time
- package
- extras
- message that email and WhatsApp confirmations are being sent
- support WhatsApp CTA

## Practical implementation order

1. Create booking record
2. Verify payment
3. Persist `payment_succeeded`
4. Send client email
5. Send operations email
6. Send client WhatsApp
7. Send operator WhatsApp
8. Write notification ledger
