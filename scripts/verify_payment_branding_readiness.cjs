#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH,
  PAYMENT_BRANDING_REVIEW_RELATIVE_PATH,
  PAYMENT_BRANDING_REQUIRED_SNIPPETS,
  missingPaymentBrandingReleaseConditions,
  validatePaymentBrandingEvidence
} = require('./lib/payment_branding_contract.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const allowBlocked = process.argv.includes('--allow-blocked') || process.argv.includes('--allow-missing');
const flagPath = path.join(PROJECT_ROOT, PAYMENT_BRANDING_REVIEW_RELATIVE_PATH);
const evidencePath = path.join(PROJECT_ROOT, PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH);

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

let evidenceSource = null;
let evidence = null;
let evidenceReadFailure = null;
let evidenceParseFailure = null;
try {
  evidenceSource = fs.readFileSync(evidencePath, 'utf8');
  try {
    evidence = JSON.parse(evidenceSource);
  } catch (error) {
    evidenceParseFailure = error.message || String(error);
  }
} catch (error) {
  if (!error || error.code !== 'ENOENT') {
    evidenceReadFailure = error.message || String(error);
  }
}

const missingReleaseConditions = source === null ? [] : missingPaymentBrandingReleaseConditions(source);
const evidenceValidation = evidenceParseFailure || evidenceReadFailure
  ? { ok: false, failures: [] }
  : validatePaymentBrandingEvidence(evidence);
const flagPresent = source !== null;
const ok = !readFailure && !flagPresent && evidenceValidation.ok;
const failures = [
  ...(readFailure ? [{
    id: 'payment_branding_flag_read_error',
    reason: readFailure
  }] : []),
  ...(evidenceReadFailure ? [{
    id: 'payment_branding_evidence_read_error',
    reason: evidenceReadFailure
  }] : []),
  ...(evidenceParseFailure ? [{
    id: 'payment_branding_evidence_parse_error',
    reason: evidenceParseFailure
  }] : []),
  ...(flagPresent ? [{
    id: 'payment_branding_review_pending',
    reason: `PayPal/Stripe brand review is still pending before final go-live; keep ${PAYMENT_BRANDING_REVIEW_RELATIVE_PATH} until verification is complete.`
  }] : []),
  ...evidenceValidation.failures,
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
  evidence: {
    path: PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH,
    present: evidenceSource !== null,
    parse_error: evidenceParseFailure,
    ok: evidenceValidation.ok,
    status: evidence?.status || null,
    checked_at: evidence?.checked_at || null,
    summary: evidence?.summary || null,
    failures: evidenceValidation.failures
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
