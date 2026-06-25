#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REMEDIATION_PATH = 'sales-kit/payment_branding_remediation.md';
const EVIDENCE_PATH = 'sales-kit/payment_branding_review_evidence.json';
const RUNBOOK_PATH = 'CLOUDFLARE_DEPLOY_RUNBOOK.md';
const LEGACY_DEPLOY_RUNBOOK_PATH = 'DEPLOY_RUNBOOK.md';

function read(file) {
  return fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
}

function main() {
  const failures = [];
  const remediation = read(REMEDIATION_PATH);
  const evidence = JSON.parse(read(EVIDENCE_PATH));
  const runbook = read(RUNBOOK_PATH);
  const legacyDeployRunbook = read(LEGACY_DEPLOY_RUNBOOK_PATH);

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
  if (evidence?.review_method?.expanded_additional_payment_methods !== true) {
    failures.push('Payment branding evidence must prove additional payment methods were expanded.');
  }
  if (evidence?.review_method?.payment_submit_button_clicked !== false || evidence?.review_method?.payment_fields_filled !== false) {
    failures.push('Payment branding evidence must prove no payment submit click and no payment field entry.');
  }
  for (const link of evidence?.public_payment_links || []) {
    const methods = Array.isArray(link.observed_payment_methods_after_expanding)
      ? link.observed_payment_methods_after_expanding
      : [];
    if (!methods.includes('amazon_pay') || !methods.includes('eps')) {
      failures.push(`Payment branding evidence for ${link.id || 'unknown'} must preserve expanded Amazon Pay and EPS observations.`);
    }
    if (methods.includes('paypal') !== (link.paypal_selectable === true)) {
      failures.push(`Payment branding evidence for ${link.id || 'unknown'} has inconsistent PayPal method/selectable state.`);
    }
  }
  for (const required of [
    'Stato corrente 2026-06-25',
    'blocked_paypal_not_visible',
    'release_ready=false',
    'La verifica del 2026-05-05 e superata',
    'nessuna eccezione EC8',
    'non deve esporre EC8, EC8 Platform o altri brand/account non correlati',
    'npm run audit:payment-branding'
  ]) {
    if (!runbook.includes(required)) {
      failures.push(`Cloudflare deploy runbook must include current payment branding boundary: ${required}.`);
    }
  }
  for (const required of [
    'Stato corrente 2026-06-25',
    'blocked_paypal_not_visible',
    'release_ready=false',
    'La verifica del 2026-05-05 e superata',
    'nessuna eccezione EC8',
    'PayPal deve risultare selezionabile e non deve esporre EC8, EC8 Platform o',
    'npm run audit:payment-branding',
    'sales-kit/payment_branding_review.flag',
    'sales-kit/payment_branding_review_evidence.json',
    'npm run test:payment-branding-remediation'
  ]) {
    if (!legacyDeployRunbook.includes(required)) {
      failures.push(`Deploy runbook must include current payment branding boundary: ${required}.`);
    }
  }
  for (const forbidden of [
    'Rischio accettato: PayPal puo mostrare o usare riferimenti del conto storico',
    'questa eccezione temporanea resta approvata',
    'Decisione temporanea 2026-05-05',
    'Rischio accettato: nel passaggio PayPal',
    'se PayPal mostra un brand non Cantoni, segnalarlo come rischio commerciale residuo'
  ]) {
    if (runbook.includes(forbidden)) {
      failures.push(`Cloudflare deploy runbook must not keep stale PayPal/EC8 exception text: ${forbidden}.`);
    }
    if (legacyDeployRunbook.includes(forbidden)) {
      failures.push(`Deploy runbook must not keep stale PayPal/EC8 exception text: ${forbidden}.`);
    }
  }

  const report = {
    ok: failures.length === 0,
    checked: [
      REMEDIATION_PATH,
      EVIDENCE_PATH,
      RUNBOOK_PATH,
      LEGACY_DEPLOY_RUNBOOK_PATH
    ],
    evidence_status: evidence?.status || null,
    release_ready: evidence?.summary?.release_ready === true,
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main();
