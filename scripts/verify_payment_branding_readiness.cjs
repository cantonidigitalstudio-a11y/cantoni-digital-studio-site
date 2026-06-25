#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  PAYMENT_BRANDING_REVIEW_RELATIVE_PATH,
  PAYMENT_BRANDING_REQUIRED_SNIPPETS,
  missingPaymentBrandingReleaseConditions
} = require('./lib/payment_branding_contract.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const allowBlocked = process.argv.includes('--allow-blocked') || process.argv.includes('--allow-missing');
const flagPath = path.join(PROJECT_ROOT, PAYMENT_BRANDING_REVIEW_RELATIVE_PATH);

let source = null;
let readFailure = null;
try {
  source = fs.readFileSync(flagPath, 'utf8');
} catch (error) {
  if (error && error.code === 'ENOENT') {
    source = null;
  } else {
    readFailure = error.message || String(error);
  }
}

const missingReleaseConditions = missingPaymentBrandingReleaseConditions(source);
const flagPresent = source !== null;
const ok = !readFailure && !flagPresent;
const failures = [
  ...(readFailure ? [{
    id: 'payment_branding_flag_read_error',
    reason: readFailure
  }] : []),
  ...(flagPresent ? [{
    id: 'payment_branding_review_pending',
    reason: `PayPal/Stripe brand review is still pending before final go-live; keep ${PAYMENT_BRANDING_REVIEW_RELATIVE_PATH} until verification is complete.`
  }] : []),
  ...missingReleaseConditions.map((snippet) => ({
    id: 'missing_release_condition',
    reason: `${PAYMENT_BRANDING_REVIEW_RELATIVE_PATH} is missing required release condition: ${snippet}`
  }))
];

const report = {
  ok,
  allow_blocked: allowBlocked,
  checked_at: new Date().toISOString(),
  flag: {
    path: PAYMENT_BRANDING_REVIEW_RELATIVE_PATH,
    present: flagPresent,
    required_release_conditions: PAYMENT_BRANDING_REQUIRED_SNIPPETS,
    missing_release_conditions: missingReleaseConditions
  },
  next_actions: flagPresent ? [
    'Open both public Stripe Payment Links in a real browser session.',
    'Confirm Stripe Checkout identifies the merchant as Cantoni Digital Studio.',
    'Confirm PayPal is selectable and does not expose EC8, EC8 Platform, or another unrelated brand/account.',
    'Stop before submitting the final payment step.',
    `Remove ${PAYMENT_BRANDING_REVIEW_RELATIVE_PATH} only after the review is complete and documented.`
  ] : [],
  failures
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok && !allowBlocked) process.exit(1);
