# Destination Cocoa notification flow

## Goal

After a verified payment, the system must create one normalized booking payload and fan it out to four destinations:

1. Client email
2. Collins or operations email
3. Client WhatsApp
4. Collins or operations WhatsApp

## Current implementation in repo

- Front-end builder: `destination-cocoa-booking.html`
- Booking logic: `destination-cocoa.js`
- Checkout endpoint: `functions/api/stripe/create-checkout-session.js`
- Payment webhook base: `functions/api/stripe/webhook.js`

## Trigger

- Event: `checkout.session.completed`
- Guard: `payment_status === paid`
- Source: verified Stripe webhook signature
- Idempotency: optional KV ledger keyed by event plus channel plus recipient

## Booking payload expected by downstream channels

- `booking_code`
- `brand_name`
- `payment_status`
- `service_type`
- `route_label`
- `format_label`
- `package_label`
- `extras_label`
- `guest_name`
- `guest_email`
- `guest_phone`
- `country`
- `pickup_point`
- `reference`
- `pickup_date`
- `pickup_time`
- `guest_count`
- `notes`
- `total_amount`
- `deposit_amount`
- `currency`
- `owner_name`
- `owner_email`
- `owner_phone`

## Channel responsibilities

### Client email

- confirm payment
- recap booking details
- include booking code
- include route, date, time, package and extras
- keep one reply path for changes

### Owner email

- operational brief
- include guest contacts
- include route, format, extras and notes
- include paid amount
- keep subject line sortable

### Client WhatsApp

- short confirmation
- include booking code
- confirm next coordination step
- keep message concise enough to read in chat preview

### Owner WhatsApp

- short dispatch brief
- include guest name, phone, route and timing
- include add-ons and notes
- avoid marketing copy

## Required environment for production

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `BOOKING_EMAIL_FROM`
- `BOOKING_OWNER_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `BOOKING_OWNER_WHATSAPP`

Optional:

- `BOOKING_CLIENT_REPLY_TO`
- `BOOKING_NOTIFICATION_WEBHOOK_URL`
- `BOOKING_NOTIFICATION_WEBHOOK_TOKEN`
- `BOOKING_LEDGER` KV binding

## Recommended go-live order

1. Fill the contact config in `destination-cocoa.js`
2. Add live Stripe keys and activate checkout
3. Configure webhook secret and email identity
4. Configure WhatsApp sender and owner phone
5. Run one full paid booking test with all four confirmations
