const PAYMENT_BRANDING_REVIEW_RELATIVE_PATH = 'sales-kit/payment_branding_review.flag';

const PAYMENT_BRANDING_REQUIRED_SNIPPETS = [
  'npm run audit:payment-branding',
  'npm run test:payments',
  'Stripe Checkout merchant shows Cantoni Digital Studio',
  'PayPal is selectable in a real browser session',
  'no EC8 or unrelated brand/account text appears in PayPal',
  'do not submit the final payment step'
];

function missingPaymentBrandingReleaseConditions(source) {
  if (typeof source !== 'string') return PAYMENT_BRANDING_REQUIRED_SNIPPETS.slice();
  return PAYMENT_BRANDING_REQUIRED_SNIPPETS.filter((snippet) => !source.includes(snippet));
}

module.exports = {
  PAYMENT_BRANDING_REVIEW_RELATIVE_PATH,
  PAYMENT_BRANDING_REQUIRED_SNIPPETS,
  missingPaymentBrandingReleaseConditions
};
