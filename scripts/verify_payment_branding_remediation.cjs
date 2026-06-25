#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REMEDIATION_PATH = 'sales-kit/payment_branding_remediation.md';
const EVIDENCE_PATH = 'sales-kit/payment_branding_review_evidence.json';

function read(file) {
  return fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
}

function main() {
  const failures = [];
  const remediation = read(REMEDIATION_PATH);
  const evidence = JSON.parse(read(EVIDENCE_PATH));

  for (const required of [
    'https://docs.stripe.com/payments/paypal',
    'https://docs.stripe.com/payments/paypal/activate',
    'https://docs.stripe.com/payment-links',
    'https://docs.stripe.com/payments/checkout/payment-methods',
    'cantonidigitalstudio@gmail.com',
    'Cantoni Digital Studio',
    'sales-kit/payment_branding_review_evidence.json',
    'sales-kit/payment_branding_review.flag',
    'release_ready=true',
    'blocked_paypal_not_visible',
    'do not submit the final payment step',
    'https://buy.stripe.com/aFa6oG0TAdf3cOY70zd3i00',
    'https://buy.stripe.com/8x2eVc6dUfnbg1a2Kjd3i01'
  ]) {
    if (!remediation.includes(required)) {
      failures.push(`Payment branding remediation must include ${required}.`);
    }
  }

  if (evidence?.summary?.release_ready === true && remediation.includes('blocked_paypal_not_visible')) {
    failures.push('Payment branding remediation still describes blocked PayPal even though evidence is release_ready=true.');
  }
  if (evidence?.summary?.release_ready !== true && !remediation.includes('Se anche uno solo di questi punti manca, il flag resta.')) {
    failures.push('Payment branding remediation must preserve the hold when evidence is not release_ready=true.');
  }

  const report = {
    ok: failures.length === 0,
    checked: [
      REMEDIATION_PATH,
      EVIDENCE_PATH
    ],
    evidence_status: evidence?.status || null,
    release_ready: evidence?.summary?.release_ready === true,
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main();
