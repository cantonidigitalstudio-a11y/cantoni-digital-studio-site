const PAYMENT_BRANDING_REVIEW_RELATIVE_PATH = 'sales-kit/payment_branding_review.flag';
const PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH = 'sales-kit/payment_branding_review_evidence.json';
const PAYMENT_BRANDING_EVIDENCE_TYPE = 'cantoni_payment_branding_review_evidence_v1';

const PAYMENT_BRANDING_REQUIRED_SNIPPETS = [
  'npm run audit:payment-branding',
  'npm run test:payments',
  'Stripe Checkout merchant shows Cantoni Digital Studio',
  'PayPal is selectable in a real browser session',
  'no EC8 or unrelated brand/account text appears in PayPal',
  'do not submit the final payment step',
  'sales-kit/payment_branding_review_evidence.json',
  'release_ready=true'
];

function missingPaymentBrandingReleaseConditions(source) {
  if (typeof source !== 'string') return PAYMENT_BRANDING_REQUIRED_SNIPPETS.slice();
  return PAYMENT_BRANDING_REQUIRED_SNIPPETS.filter((snippet) => !source.includes(snippet));
}

function validatePaymentBrandingEvidence(evidence) {
  const failures = [];
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return {
      ok: false,
      failures: [{
        id: 'payment_branding_evidence_missing',
        reason: `${PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH} must contain structured review evidence before the payment branding flag can be removed.`
      }]
    };
  }

  if (evidence.type !== PAYMENT_BRANDING_EVIDENCE_TYPE) {
    failures.push({
      id: 'payment_branding_evidence_type',
      reason: `${PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH} must use type ${PAYMENT_BRANDING_EVIDENCE_TYPE}.`
    });
  }
  if (!evidence.checked_at || typeof evidence.checked_at !== 'string') {
    failures.push({
      id: 'payment_branding_evidence_checked_at',
      reason: `${PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH} must include checked_at.`
    });
  }

  const links = Array.isArray(evidence.public_payment_links) ? evidence.public_payment_links : [];
  if (links.length !== 2) {
    failures.push({
      id: 'payment_branding_evidence_links',
      reason: `${PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH} must cover exactly both public Stripe Payment Links.`
    });
  }

  for (const link of links) {
    const id = link && typeof link === 'object' ? link.id || 'unknown' : 'unknown';
    if (!link || typeof link !== 'object') {
      failures.push({
        id: 'payment_branding_evidence_link_shape',
        reason: 'Each payment branding evidence link entry must be an object.'
      });
      continue;
    }
    if (!link.url || typeof link.url !== 'string' || !link.url.startsWith('https://buy.stripe.com/')) {
      failures.push({
        id: 'payment_branding_evidence_link_url',
        reason: `Payment branding evidence for ${id} must reference the public Stripe Payment Link URL.`
      });
    }
    if (link.stripe_checkout_merchant !== 'Cantoni Digital Studio' || link.stripe_merchant_visible !== true) {
      failures.push({
        id: 'payment_branding_merchant_not_verified',
        reason: `Payment branding evidence for ${id} must verify Stripe Checkout merchant Cantoni Digital Studio.`
      });
    }
    if (link.paypal_selectable !== true) {
      failures.push({
        id: 'payment_branding_paypal_not_selectable',
        reason: `Payment branding evidence for ${id} does not prove PayPal is selectable in a real browser session.`
      });
    }
    if (link.unrelated_brand_text_detected !== false) {
      failures.push({
        id: 'payment_branding_unrelated_brand_detected',
        reason: `Payment branding evidence for ${id} must prove no EC8 or unrelated brand text appears in the payment flow.`
      });
    }
    if (link.final_payment_submitted !== false) {
      failures.push({
        id: 'payment_branding_final_payment_boundary',
        reason: `Payment branding evidence for ${id} must prove the reviewer stopped before final payment submission.`
      });
    }
  }

  const summary = evidence.summary || {};
  for (const [key, expected] of [
    ['all_stripe_merchant_cantoni', true],
    ['all_paypal_selectable', true],
    ['no_unrelated_brand_text', true],
    ['final_payment_submitted', false],
    ['release_ready', true]
  ]) {
    if (summary[key] !== expected) {
      failures.push({
        id: `payment_branding_summary_${key}`,
        reason: `Payment branding evidence summary ${key} must be ${expected}.`
      });
    }
  }

  return {
    ok: failures.length === 0,
    failures
  };
}

module.exports = {
  PAYMENT_BRANDING_EVIDENCE_RELATIVE_PATH,
  PAYMENT_BRANDING_EVIDENCE_TYPE,
  PAYMENT_BRANDING_REVIEW_RELATIVE_PATH,
  PAYMENT_BRANDING_REQUIRED_SNIPPETS,
  missingPaymentBrandingReleaseConditions,
  validatePaymentBrandingEvidence
};
