import { adminKeyFallbackEnabled } from './supabase-auth.js';

function hasValue(value) {
  return Boolean(String(value || '').trim());
}

function check(id, label, status, detail) {
  return { id, label, status, detail };
}

function requireAll(env, keys) {
  return keys.every((key) => hasValue(env[key]));
}

function missingKeys(env, keys) {
  return keys.filter((key) => !hasValue(env[key]));
}

function checkWithKeys(id, label, env, keys, detail) {
  const missing = missingKeys(env, keys);
  return check(
    id,
    label,
    missing.length ? 'missing' : 'ready',
    missing.length
      ? `Missing ${missing.join(', ')}.`
      : detail
  );
}

function summarize(checks) {
  const totals = checks.reduce((summary, item) => {
    summary.total += 1;
    summary[item.status] = (summary[item.status] || 0) + 1;
    return summary;
  }, { total: 0, ready: 0, partial: 0, missing: 0 });

  let overall = 'missing';
  if (totals.missing === 0 && totals.partial === 0) {
    overall = 'ready';
  } else if (totals.ready > 0 || totals.partial > 0) {
    overall = 'partial';
  }

  return {
    overall,
    ready: totals.ready,
    partial: totals.partial,
    missing: totals.missing,
    total: totals.total
  };
}

export function buildBookingReadiness(env = process.env) {
  const staffSessionReady = requireAll(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  const adminKeyFallbackReady = hasValue(env.VIP_ADMIN_API_KEY) && adminKeyFallbackEnabled(env);
  const emailCoreReady = requireAll(env, ['RESEND_API_KEY', 'BOOKING_EMAIL_FROM']);
  const whatsappCoreReady = requireAll(env, ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM']);
  const cardnetCoreReady = requireAll(env, ['CARDNET_ENABLED', 'CARDNET_CHECKOUT_URL', 'CARDNET_MERCHANT_ID', 'CARDNET_TERMINAL_ID']);

  const checks = [
    checkWithKeys(
      'supabase-storage',
      'Shared Supabase storage',
      env,
      ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      'Booking records can persist to the controlled shared ledger.'
    ),
    staffSessionReady
      ? check(
          'admin-api',
          'Cloud admin API access',
          'ready',
          adminKeyFallbackReady
            ? 'The internal desk can load the shared booking ledger through staff sessions, with emergency admin-key fallback enabled.'
            : 'The internal desk can load the shared booking ledger through staff sessions. Admin-key fallback stays off unless explicitly enabled.'
        )
      : check(
          'admin-api',
          'Cloud admin API access',
          'missing',
          'Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.'
        ),
    checkWithKeys(
      'customer-auth',
      'Customer magic-link account',
      env,
      ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      'Customer login, profile persistence and account booking history are ready to use.'
    ),
    emailCoreReady
      ? check(
          'guest-email',
          'Guest email confirmations',
          'ready',
          'Booking capture can send a structured receipt/acknowledgement by email.'
        )
      : check(
          'guest-email',
          'Guest email confirmations',
          'missing',
          'Missing RESEND_API_KEY and/or BOOKING_EMAIL_FROM.'
        ),
    emailCoreReady && hasValue(env.BOOKING_OWNER_EMAIL)
      ? check(
          'owner-email',
          'Owner email alerts',
          'ready',
          'New booking requests can be mirrored to the reservations owner inbox.'
        )
      : check(
          'owner-email',
          'Owner email alerts',
          emailCoreReady ? 'partial' : 'missing',
          emailCoreReady
            ? 'Missing BOOKING_OWNER_EMAIL.'
            : 'Missing RESEND_API_KEY and/or BOOKING_EMAIL_FROM.'
        ),
    whatsappCoreReady
      ? check(
          'guest-whatsapp',
          'Guest WhatsApp updates',
          'ready',
          'Booking capture can send a guest WhatsApp recap through Twilio.'
        )
      : check(
          'guest-whatsapp',
          'Guest WhatsApp updates',
          'missing',
          'Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and/or TWILIO_WHATSAPP_FROM.'
        ),
    whatsappCoreReady && hasValue(env.BOOKING_OWNER_WHATSAPP)
      ? check(
          'owner-whatsapp',
          'Owner WhatsApp alerts',
          'ready',
          'New booking requests can be mirrored to the owner WhatsApp line.'
        )
      : check(
          'owner-whatsapp',
          'Owner WhatsApp alerts',
          whatsappCoreReady ? 'partial' : 'missing',
          whatsappCoreReady
            ? 'Missing BOOKING_OWNER_WHATSAPP.'
            : 'Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and/or TWILIO_WHATSAPP_FROM.'
        ),
    check(
      'relay-webhook',
      'Ops relay webhook',
      hasValue(env.BOOKING_NOTIFICATION_WEBHOOK_URL) ? 'ready' : 'missing',
      hasValue(env.BOOKING_NOTIFICATION_WEBHOOK_URL)
        ? 'Booking events can also be relayed to an external automation/webhook endpoint.'
        : 'BOOKING_NOTIFICATION_WEBHOOK_URL is not configured.'
    ),
    check(
      'lead-recovery',
      'Lead recovery automation',
      emailCoreReady && requireAll(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])
        ? 'ready'
        : emailCoreReady || requireAll(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])
          ? 'partial'
          : 'missing',
      emailCoreReady && requireAll(env, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])
        ? 'Lead capture, offer codes and recovery jobs can be stored and dispatched.'
        : 'Lead recovery needs Supabase storage plus RESEND_API_KEY and BOOKING_EMAIL_FROM.'
    ),
    check(
      'cardnet-session',
      'CardNET checkout session creation',
      cardnetCoreReady ? 'ready' : 'missing',
      cardnetCoreReady
        ? 'CardNET booking sessions can be created from book-now services.'
        : 'Missing CARDNET_ENABLED, CARDNET_CHECKOUT_URL, CARDNET_MERCHANT_ID and/or CARDNET_TERMINAL_ID.'
    ),
    check(
      'cardnet-webhook',
      'CardNET payment webhook',
      hasValue(env.CARDNET_WEBHOOK_SHARED_SECRET) ? 'ready' : 'missing',
      hasValue(env.CARDNET_WEBHOOK_SHARED_SECRET)
        ? 'CardNET payment confirmations can be reconciled through a signed webhook.'
        : 'CARDNET_WEBHOOK_SHARED_SECRET is not configured.'
    ),
    check(
      'stripe-fallback',
      'Stripe fallback adapter',
      hasValue(env.STRIPE_SECRET_KEY) ? 'ready' : 'missing',
      hasValue(env.STRIPE_SECRET_KEY)
        ? 'Stripe remains available as a secondary payment adapter.'
        : 'STRIPE_SECRET_KEY is not configured.'
    )
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: summarize(checks),
    checks
  };
}
