const assert = require('assert/strict');
const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(process.env.SITE_ROOT || path.join(__dirname, '..'));
const PAYMENT_LINK_PATTERN = /<a\b[^>]*href=["'](https:\/\/buy\.stripe\.com\/[^"']+)["'][^>]*>/gi;
const EXPECTED_AMOUNT_TEXT = '€250.00';
const EXPECTED_MERCHANT_NAME = process.env.EXPECTED_MERCHANT_NAME || 'Cantoni Digital Studio';
const FORBIDDEN_CHECKOUT_TEXT = (process.env.FORBIDDEN_CHECKOUT_TEXT || 'coaching,Mr Collins,Excellentia,Destination Cocoa')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const EXPECTED_METHODS = (process.env.EXPECTED_PAYMENT_METHODS || 'card,klarna,paypal')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const SESSION_DEPENDENT_METHODS = (process.env.SESSION_DEPENDENT_PAYMENT_METHODS || 'paypal,applepay,googlepay')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const CHECKOUT_TIMEOUT_MS = 45000;

function attrsFromTag(tag) {
  const attrs = {};
  const attrPattern = /([:@a-zA-Z0-9_-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>/]+)))?/g;
  let match;

  while ((match = attrPattern.exec(tag))) {
    const name = match[1].toLowerCase();
    if (!name || name === tag.match(/^<\/?\s*([^\s>/]+)/)?.[1]?.toLowerCase()) continue;
    attrs[name] = match[3] ?? match[4] ?? match[5] ?? '';
  }

  return attrs;
}

async function collectStripeLinks() {
  const files = ['preventivo.html', 'studio.html'];
  const links = new Map();

  for (const fileName of files) {
    const html = await fs.readFile(path.join(ROOT_DIR, fileName), 'utf8');
    let match;
    while ((match = PAYMENT_LINK_PATTERN.exec(html))) {
      const tag = match[0];
      const href = match[1];
      const attrs = attrsFromTag(tag);
      assert.equal(attrs.target, '_blank', `${fileName}: Stripe link must open in a new tab`);
      assert.match(attrs.rel || '', /\bnoreferrer\b/i, `${fileName}: Stripe link must protect referrer`);
      assert.ok(attrs['data-payment-path'], `${fileName}: Stripe link must declare data-payment-path`);
      assert.equal(attrs['data-payment-mode'], 'payment', `${fileName}: Stripe link must declare payment mode`);

      if (!links.has(href)) {
        links.set(href, {
          href,
          paths: new Set(),
          sources: new Set()
        });
      }
      links.get(href).paths.add(attrs['data-payment-path']);
      links.get(href).sources.add(fileName);
    }
  }

  return Array.from(links.values()).map((link) => ({
    href: link.href,
    paths: Array.from(link.paths),
    sources: Array.from(link.sources)
  }));
}

async function verifyCheckoutPage(browser, link) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(link.href, {
      waitUntil: 'domcontentloaded',
      timeout: CHECKOUT_TIMEOUT_MS
    });
    assert.ok(response, `${link.href}: no response from Stripe`);
    assert.ok(response.status() < 400, `${link.href}: Stripe returned HTTP ${response.status()}`);
    assert.match(new URL(page.url()).hostname, /stripe\.com$/i, `${link.href}: final host must remain Stripe`);

    await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
    await page.waitForFunction(({ expectedAmount, expectedMerchant }) => {
      const text = `${document.title}\n${document.body ? document.body.innerText : ''}`;
      return new RegExp(expectedMerchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text) && text.includes(expectedAmount);
    }, { expectedAmount: EXPECTED_AMOUNT_TEXT, expectedMerchant: EXPECTED_MERCHANT_NAME }, { timeout: 25000 });
    const title = await page.title();
    const bodyText = await page.locator('body').innerText({ timeout: 15000 });
    const normalizedText = `${title}\n${bodyText}`.replace(/\s+/g, ' ');
    const forbiddenMatches = FORBIDDEN_CHECKOUT_TEXT.filter((term) => {
      const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return pattern.test(normalizedText);
    });
    const observedMethods = {
      card: /Payment method|Metodo di pagamento|Card|Carta|Numero carta/i.test(normalizedText),
      paypal: /PayPal/i.test(normalizedText),
      klarna: /Klarna/i.test(normalizedText),
      bancontact: /Bancontact/i.test(normalizedText),
      mbway: /MB WAY/i.test(normalizedText),
      eps: /\bEPS\b/i.test(normalizedText),
      applePay: /Apple Pay/i.test(normalizedText),
      googlePay: /Google Pay/i.test(normalizedText)
    };

    assert.match(normalizedText, new RegExp(EXPECTED_MERCHANT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${link.href}: checkout must identify the merchant`);
    assert.deepEqual(forbiddenMatches, [], `${link.href}: checkout must not expose unrelated brand/account text; matched ${JSON.stringify(forbiddenMatches)}`);
    assert.ok(normalizedText.includes(EXPECTED_AMOUNT_TEXT), `${link.href}: checkout must show ${EXPECTED_AMOUNT_TEXT}`);
    assert.match(normalizedText, /Payment method|Metodo di pagamento|Pay|Paga/i, `${link.href}: checkout must render payment UI`);
    assert.doesNotMatch(normalizedText, /404|not found|error loading/i, `${link.href}: checkout must not render an error page`);
    const sessionDependentMisses = [];
    for (const method of EXPECTED_METHODS) {
      if (observedMethods[method]) continue;
      if (SESSION_DEPENDENT_METHODS.includes(method)) {
        sessionDependentMisses.push(method);
        continue;
      }

      assert.equal(observedMethods[method], true, `${link.href}: checkout must expose ${method}; observed ${JSON.stringify(observedMethods)}`);
    }

    return {
      href: link.href,
      paths: link.paths,
      sources: link.sources,
      title,
      expectedMerchant: EXPECTED_MERCHANT_NAME,
      observedMethods,
      sessionDependentMisses,
      ok: true
    };
  } finally {
    await page.close();
  }
}

async function verifyCheckoutPageWithRetry(browser, link) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await verifyCheckoutPage(browser, link);
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw lastError;
}

async function main() {
  const links = await collectStripeLinks();
  assert.ok(links.length >= 2, 'Expected at least two Stripe consultation payment links');

  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const link of links) {
      results.push(await verifyCheckoutPageWithRetry(browser, link));
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({
    ok: true,
    checkedLinks: results.length,
    results
  }, null, 2));
}

main().catch((error) => {
  console.error(`FAIL payment-links: ${error.message}`);
  process.exitCode = 1;
});
