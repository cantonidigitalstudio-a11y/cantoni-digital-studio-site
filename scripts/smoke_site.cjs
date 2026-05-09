const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.xml':
      return 'application/xml; charset=utf-8';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function createStaticServer(rootDir) {
  return http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
      const targetPath = path.normalize(path.join(rootDir, pathname));

      if (!targetPath.startsWith(rootDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      const data = await fs.readFile(targetPath);
      res.writeHead(200, { 'Content-Type': contentTypeFor(targetPath) });
      res.end(data);
    } catch (error) {
      const statusCode = error && error.code === 'ENOENT' ? 404 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(statusCode === 404 ? 'Not found' : 'Internal server error');
    }
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server.address();
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function attachPageGuards(page, issues) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.push(`console:${msg.text()}`);
  });
  page.on('pageerror', (error) => {
    issues.push(`pageerror:${error.message}`);
  });
}

async function createContext(browser, baseUrl, options = {}) {
  const context = await browser.newContext({ baseURL: baseUrl });

  if (options.captureWindowOpen) {
    await context.addInitScript(() => {
      window.__cdsOpenedUrls = [];
      window.open = function (url) {
        window.__cdsOpenedUrls.push(String(url));
        return {};
      };
    });
  }

  await context.route('https://api.frankfurter.app/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: '{'
    });
  });

  if (options.leadCapture) {
    const requests = options.leadCapture.requests;
    await context.route('https://script.google.com/macros/s/**', (route) => {
      const requestUrl = new URL(route.request().url());
      const callbackName = requestUrl.searchParams.get('callback');
      const action = requestUrl.searchParams.get('action');
      const payload = {};

      requestUrl.searchParams.forEach((value, key) => {
        if (key === 'callback' || key === 'action') return;
        payload[key] = value;
      });
      if (action === 'lead') requests.push(payload);

      route.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        body: callbackName ? `${callbackName}(${JSON.stringify({ ok: options.leadCapture.ok })});` : ''
      });
    });
  }

  return context;
}

async function readSeoSnapshot(page) {
  return page.evaluate(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    const alternateEn = document.querySelector('link[rel="alternate"][hreflang="en"]');
    const alternateIt = document.querySelector('link[rel="alternate"][hreflang="it"]');
    const alternateDefault = document.querySelector('link[rel="alternate"][hreflang="x-default"]');
    const metaDescription = document.getElementById('metaDescription');
    const ogTitle = document.getElementById('ogTitle');
    const twitterTitle = document.getElementById('twitterTitle');
    return {
      title: document.title,
      description: metaDescription ? metaDescription.getAttribute('content') : '',
      ogTitle: ogTitle ? ogTitle.getAttribute('content') : '',
      twitterTitle: twitterTitle ? twitterTitle.getAttribute('content') : '',
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      canonical: canonical ? canonical.getAttribute('href') : '',
      alternateEn: alternateEn ? alternateEn.getAttribute('href') : '',
      alternateIt: alternateIt ? alternateIt.getAttribute('href') : '',
      alternateDefault: alternateDefault ? alternateDefault.getAttribute('href') : ''
    };
  });
}

async function readStaticSeoSnapshot(relativeFilePath) {
  const html = await fs.readFile(path.join(ROOT_DIR, relativeFilePath), 'utf8');
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]+id="metaDescription"[^>]+content="([^"]*)"/i);
  const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  const ogTitleMatch = html.match(/<meta[^>]+id="ogTitle"[^>]+content="([^"]*)"/i);
  const twitterTitleMatch = html.match(/<meta[^>]+id="twitterTitle"[^>]+content="([^"]*)"/i);
  const alternates = {};

  Array.from(html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]*)"/gi)).forEach((match) => {
    alternates[match[1]] = match[2];
  });

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descriptionMatch ? descriptionMatch[1].trim() : '',
    canonical: canonicalMatch ? canonicalMatch[1].trim() : '',
    ogTitle: ogTitleMatch ? ogTitleMatch[1].trim() : '',
    twitterTitle: twitterTitleMatch ? twitterTitleMatch[1].trim() : '',
    alternates
  };
}

let cachedI18nData = null;

async function readI18nData() {
  if (!cachedI18nData) {
    cachedI18nData = JSON.parse(await fs.readFile(path.join(ROOT_DIR, 'i18n.json'), 'utf8'));
  }
  return cachedI18nData;
}

async function testStaticSeoSources() {
  const pages = [
    {
      file: 'index.html',
      canonical: 'https://cantonidigitalstudio.com/',
      alternateIt: 'https://cantonidigitalstudio.com/?lang=it',
      alternateEn: 'https://cantonidigitalstudio.com/?lang=en',
      alternateDefault: 'https://cantonidigitalstudio.com/'
    },
    {
      file: 'case-studies.html',
      canonical: 'https://cantonidigitalstudio.com/case-studies.html',
      alternateIt: 'https://cantonidigitalstudio.com/case-studies.html?lang=it',
      alternateEn: 'https://cantonidigitalstudio.com/case-studies.html?lang=en',
      alternateDefault: 'https://cantonidigitalstudio.com/case-studies.html'
    },
    {
      file: 'preventivo.html',
      canonical: 'https://cantonidigitalstudio.com/preventivo.html',
      alternateIt: 'https://cantonidigitalstudio.com/preventivo.html?lang=it',
      alternateEn: 'https://cantonidigitalstudio.com/preventivo.html?lang=en',
      alternateDefault: 'https://cantonidigitalstudio.com/preventivo.html'
    }
  ];

  for (const page of pages) {
    const seo = await readStaticSeoSnapshot(page.file);
    assert.ok(seo.title, `${page.file} should expose a non-empty static <title>`);
    assert.ok(seo.description, `${page.file} should expose a non-empty static meta description`);
    assert.equal(seo.ogTitle, seo.title, `${page.file} static OG title should match the static document title`);
    assert.equal(seo.twitterTitle, seo.title, `${page.file} static Twitter title should match the static document title`);
    assert.equal(seo.canonical, page.canonical, `${page.file} static canonical should stay correct`);
    assert.equal(seo.alternates.it, page.alternateIt, `${page.file} static Italian hreflang should stay correct`);
    assert.equal(seo.alternates.en, page.alternateEn, `${page.file} static English hreflang should stay correct`);
    assert.equal(seo.alternates['x-default'], page.alternateDefault, `${page.file} static x-default hreflang should stay correct`);
  }
}

async function testHomePage(browser, baseUrl) {
  const i18n = await readI18nData();
  const expectedLabel = i18n.translations.it.form_business;
  const context = await createContext(browser, baseUrl);
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/index.html?lang=it&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#leadForm [data-i18n-label]');

  const result = await page.evaluate(() => {
    const firstLabel = document.querySelector('#leadForm label');
    const translated = firstLabel && firstLabel.querySelector('[data-i18n-label]');
    return {
      labelText: translated ? translated.textContent.trim() : '',
      rawText: firstLabel ? firstLabel.textContent.replace(/\s+/g, ' ').trim() : ''
    };
  });

  assert.equal(result.labelText, expectedLabel, 'Home form label should use the translated Italian copy');
  assert.equal(result.rawText, expectedLabel, 'Home form label should not keep legacy fallback text');
  assert.deepEqual(issues, [], `Home page emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testHomeSeoEnglish(browser, baseUrl) {
  const i18n = await readI18nData();
  const expected = i18n.translations.en;
  const staticSeo = await readStaticSeoSnapshot('index.html');
  const context = await createContext(browser, baseUrl);
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/index.html?lang=en&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  const seo = await readSeoSnapshot(page);

  assert.equal(seo.title, expected.seo_home_title, 'Home page should expose the English SEO title');
  assert.equal(seo.description, expected.seo_home_desc, 'Home page should expose the English SEO description');
  assert.equal(seo.ogTitle, seo.title, 'Home OG title should stay aligned with the document title');
  assert.equal(seo.twitterTitle, seo.title, 'Home Twitter title should stay aligned with the document title');
  assert.equal(seo.lang, 'en', 'Home document language should switch to English');
  assert.equal(seo.dir, 'ltr', 'Home English direction should stay LTR');
  assert.equal(seo.canonical, staticSeo.canonical, 'Home runtime canonical should stay aligned with static markup');
  assert.equal(seo.alternateEn, staticSeo.alternates.en, 'Home runtime English hreflang should stay aligned with static markup');
  assert.equal(seo.alternateDefault, staticSeo.alternates['x-default'], 'Home runtime x-default hreflang should stay aligned with static markup');
  assert.deepEqual(issues, [], `Home SEO emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testLeadSubmitSuccess(browser, baseUrl) {
  const i18n = await readI18nData();
  const expected = i18n.translations.en;
  const leadRequests = [];
  const context = await createContext(browser, baseUrl, {
    leadCapture: { ok: true, requests: leadRequests }
  });
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/index.html?lang=en&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="business"]', 'Acme Studio');
  await page.fill('input[name="email"]', 'owner@example.com');
  await page.fill('input[name="website"]', 'https://example.com');
  await page.fill('input[name="market"]', 'United States');
  await page.fill('textarea[name="goal"]', 'Increase qualified leads');
  await page.check('input[name="privacyAccepted"]');
  await page.click('#leadForm button[type="submit"]');

  await page.waitForFunction(() => {
    const note = document.getElementById('formNote');
    return note && note.textContent.includes('Request received');
  });

  const result = await page.evaluate(() => ({
    note: document.getElementById('formNote').textContent.trim(),
    business: document.querySelector('input[name="business"]').value,
    draft: localStorage.getItem('cds_draft_lead_form')
  }));

  assert.equal(leadRequests.length, 1, 'Lead form should submit exactly one mocked endpoint request');
  assert.equal(leadRequests[0].form_type, 'lead_request', 'Lead payload should identify the lead form');
  assert.equal(leadRequests[0].business, 'Acme Studio', 'Lead payload should include the business name');
  assert.equal(leadRequests[0].email, 'owner@example.com', 'Lead payload should include the email');
  assert.equal(leadRequests[0].market, 'United States', 'Lead payload should include the market');
  assert.equal(leadRequests[0].goal, 'Increase qualified leads', 'Lead payload should include the goal');
  assert.equal(leadRequests[0].privacyAccepted, 'yes', 'Lead payload should include privacy consent');
  assert.equal(result.note, expected.lead_saved, 'Lead form should show the success note');
  assert.equal(result.business, '', 'Lead form should reset after a successful submit');
  assert.equal(result.draft, null, 'Lead draft should be cleared after a successful submit');
  assert.deepEqual(issues, [], `Lead submit emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testCaseStudiesLanguageSwitch(browser, baseUrl) {
  const i18n = await readI18nData();
  const expected = i18n.translations.en;
  const context = await createContext(browser, baseUrl);
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/case-studies.html?lang=it&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.selectOption('#langPicker', 'en');
  await page.waitForFunction((expectedTitle) => {
    const heading = document.querySelector('main h1');
    return heading && heading.textContent.trim() === expectedTitle;
  }, expected.cs_title);

  const headingText = await page.locator('main h1').textContent();
  assert.equal((headingText || '').trim(), expected.cs_title, 'Case studies should switch to English');
  assert.deepEqual(issues, [], `Case studies page emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testCaseStudiesSeoItalian(browser, baseUrl) {
  const i18n = await readI18nData();
  const expected = i18n.translations.it;
  const staticSeo = await readStaticSeoSnapshot('case-studies.html');
  const context = await createContext(browser, baseUrl);
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/case-studies.html?lang=it&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.lang === 'it');
  const seo = await readSeoSnapshot(page);

  assert.equal(seo.title, expected.seo_cases_title, 'Case studies page should expose the Italian SEO title');
  assert.equal(seo.description, expected.seo_cases_desc, 'Case studies page should expose the Italian SEO description');
  assert.equal(seo.ogTitle, seo.title, 'Case studies OG title should stay aligned with the document title');
  assert.equal(seo.twitterTitle, seo.title, 'Case studies Twitter title should stay aligned with the document title');
  assert.equal(seo.lang, 'it', 'Case studies document language should stay Italian');
  assert.equal(seo.dir, 'ltr', 'Case studies Italian direction should stay LTR');
  assert.equal(seo.canonical, staticSeo.canonical, 'Case studies runtime canonical should stay aligned with static markup');
  assert.equal(seo.alternateIt, staticSeo.alternates.it, 'Case studies runtime Italian hreflang should stay aligned with static markup');
  assert.equal(seo.alternateDefault, staticSeo.alternates['x-default'], 'Case studies runtime x-default hreflang should stay aligned with static markup');
  assert.deepEqual(issues, [], `Case studies SEO emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testQuoteFxFallback(browser, baseUrl) {
  const context = await createContext(browser, baseUrl);
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/preventivo.html?lang=en&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const starter = document.getElementById('fxStarter');
    return starter && starter.textContent.trim() !== '-';
  });

  await page.fill('input[name="country"]', 'Dominican Republic');
  await page.dispatchEvent('input[name="country"]', 'change');

  await page.waitForFunction(() => {
    const currency = document.getElementById('fxCurrency');
    return currency && currency.value === 'EUR';
  });

  const result = await page.evaluate(() => {
    const currency = document.getElementById('fxCurrency');
    const budget = document.querySelector('select[name="budget"]');
    const dopOption = currency.querySelector('option[value="DOP"]');
    return {
      currency: currency.value,
      dopDisabled: Boolean(dopOption && dopOption.disabled),
      starterText: document.getElementById('fxStarter').textContent.trim(),
      budgetText: budget && budget.options[1] ? budget.options[1].textContent.trim() : ''
    };
  });

  assert.equal(result.currency, 'EUR', 'Unsupported country currency should fall back to EUR');
  assert.equal(result.dopDisabled, true, 'Unsupported DOP option should be disabled');
  assert.match(result.starterText, /€/u, 'FX starter range should stay renderable after fallback');
  assert.match(result.budgetText, /€/u, 'Budget options should stay aligned with the active fallback currency');
  assert.deepEqual(issues, [], `Quote page emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testQuoteArabicSeoState(browser, baseUrl) {
  const i18n = await readI18nData();
  const expected = i18n.translations.ar;
  const staticSeo = await readStaticSeoSnapshot('preventivo.html');
  const context = await createContext(browser, baseUrl);
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/preventivo.html?lang=ar&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.lang === 'ar');
  const seo = await readSeoSnapshot(page);

  assert.equal(seo.lang, 'ar', 'Quote page should switch the document language to Arabic');
  assert.equal(seo.dir, 'rtl', 'Quote page should switch the document direction to RTL for Arabic');
  assert.equal(seo.canonical, staticSeo.canonical, 'Quote runtime canonical should stay aligned with static markup');
  assert.equal(seo.alternateEn, staticSeo.alternates.en, 'Quote runtime English hreflang should stay aligned with static markup');
  assert.equal(seo.alternateDefault, staticSeo.alternates['x-default'], 'Quote runtime x-default hreflang should stay aligned with static markup');
  assert.equal(seo.title, expected.seo_quote_title, 'Quote page should expose the Arabic-mode SEO title from the translation source');
  assert.equal(seo.description, expected.seo_quote_desc, 'Quote page should expose the Arabic-mode SEO description from the translation source');
  assert.deepEqual(issues, [], `Quote Arabic SEO emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testQuoteSubmitFallback(browser, baseUrl) {
  const i18n = await readI18nData();
  const expected = i18n.translations.en;
  const leadRequests = [];
  const context = await createContext(browser, baseUrl, {
    leadCapture: { ok: false, requests: leadRequests },
    captureWindowOpen: true
  });
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/preventivo.html?lang=en&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const starter = document.getElementById('fxStarter');
    return starter && starter.textContent.trim() !== '-';
  });
  const essentialConsent = page.locator('[data-cookie-choice="essential"]');
  if (await essentialConsent.count()) await essentialConsent.click();

  await page.fill('input[name="company"]', 'Beta Group');
  await page.fill('input[name="contact"]', 'Alice Doe');
  await page.fill('input[name="email"]', 'alice@example.com');
  await page.fill('input[name="country"]', 'Italy');
  await page.fill('input[name="website"]', 'https://beta.example');
  await page.fill('input[name="sector"]', 'Consulting');
  await page.selectOption('#estimateProjectType', 'ecommerce');
  await page.selectOption('#estimateComplexity', 'advanced');
  await page.selectOption('#estimateScale', 'large');
  await page.check('[data-estimate-feature][value="payments"]');
  await page.check('[data-estimate-feature][value="automations"]');
  await page.selectOption('select[name="projectType"]', { index: 1 });
  await page.selectOption('select[name="timeline"]', { index: 1 });
  await page.selectOption('select[name="budget"]', { index: 1 });
  await page.selectOption('select[name="materialsReady"]', { index: 1 });
  await page.fill('textarea[name="goal"]', 'Launch a stronger quote funnel');
  await page.check('input[name="termsAccepted"]');
  await page.check('input[name="privacyAccepted"]');
  await page.waitForFunction(() => {
    const estimate = document.getElementById('instantEstimateField');
    return estimate && /€/.test(estimate.value);
  });
  await page.click('#quoteForm button[type="submit"]');

  await page.waitForFunction((expectedNote) => {
    const note = document.getElementById('quoteNote');
    return note && note.textContent.trim() === expectedNote;
  }, expected.open_email_quote);

  const result = await page.evaluate(() => ({
    note: document.getElementById('quoteNote').textContent.trim(),
    draft: localStorage.getItem('cds_draft_quote_form'),
    openedUrls: window.__cdsOpenedUrls || [],
    panelText: document.getElementById('quoteStatus') ? document.getElementById('quoteStatus').textContent.trim() : '',
    gmailHref: document.querySelector('#quoteStatus a[href^="https://mail.google.com"]') ? document.querySelector('#quoteStatus a[href^="https://mail.google.com"]').href : '',
    mailtoHref: document.querySelector('#quoteStatus a[href^="mailto:"]') ? document.querySelector('#quoteStatus a[href^="mailto:"]').href : ''
  }));

  assert.equal(leadRequests.length, 1, 'Quote form should submit exactly one mocked endpoint request');
  assert.equal(leadRequests[0].form_type, 'quote_request', 'Quote payload should identify the quote form');
  assert.equal(leadRequests[0].company, 'Beta Group', 'Quote payload should include the company');
  assert.equal(leadRequests[0].contact, 'Alice Doe', 'Quote payload should include the contact');
  assert.equal(leadRequests[0].country, 'Italy', 'Quote payload should include the country');
  assert.equal(leadRequests[0].sector, 'Consulting', 'Quote payload should include the sector');
  assert.equal(leadRequests[0].goal, 'Launch a stronger quote funnel', 'Quote payload should include the goal');
  assert.equal(leadRequests[0].privacyAccepted, 'yes', 'Quote payload should include privacy consent');
  assert.match(leadRequests[0].instantEstimate || '', /€/u, 'Quote payload should include the instant estimate range');
  assert.match(leadRequests[0].estimateDetails || '', /E-commerce/u, 'Quote payload should include the structured estimate details');
  assert.equal(result.note, expected.open_email_quote, 'Quote form should show the fallback note');
  assert.match(result.draft || '', /"company":"Beta Group"/, 'Quote draft should persist locally on fallback');
  assert.match(result.panelText, new RegExp(expected.status_fallback_title), 'Quote fallback should render the manual email panel');
  assert.equal(result.openedUrls.length, 0, 'Fallback should not force-open a popup');
  assert.match(result.gmailHref, /^https:\/\/mail\.google\.com\/mail\/\?view=cm/u, 'Fallback should expose a Gmail compose link');
  assert.match(result.mailtoHref, /^mailto:cantonidigitalstudio@gmail\.com/u, 'Fallback should expose a direct mailto link');
  assert.deepEqual(issues, [], `Quote fallback emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function testDestinationCocoaFlow(browser, baseUrl) {
  const context = await createContext(browser, baseUrl, { captureWindowOpen: true });
  const page = await context.newPage();
  const issues = [];
  attachPageGuards(page, issues);

  await page.goto('/destination-cocoa.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');

  const landing = await page.evaluate(() => ({
    title: document.title,
    hero: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : ''
  }));

  assert.match(landing.title, /Destination Cocoa/u, 'Destination Cocoa landing should expose the correct document title');
  assert.match(landing.hero, /Airport arrivals, excursions and local bookings/u, 'Destination Cocoa landing should render the intended hero copy');

  await page.goto('/destination-cocoa-booking.html?service=airport&route=bavaro&format=vipSuv&package=grand&extras=fastTrack,champagne', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const total = document.getElementById('summaryTotal');
    return total && total.textContent.trim() !== '$0';
  });

  const booking = await page.evaluate(() => ({
    service: document.getElementById('summaryService').textContent.trim(),
    route: document.getElementById('summaryRoute').textContent.trim(),
    total: document.getElementById('summaryTotal').textContent.trim(),
    deposit: document.getElementById('summaryDeposit').textContent.trim(),
    mode: document.getElementById('summaryMode').textContent.trim(),
    payDisabled: document.getElementById('payDepositBtn').disabled,
    note: document.getElementById('actionNote').textContent.trim()
  }));

  assert.equal(booking.service, 'Airport transfer', 'Booking summary should preselect the airport transfer service');
  assert.match(booking.route, /Bavaro/u, 'Booking summary should preselect the Bavaro route');
  assert.equal(booking.total, '$414', 'Booking total should include route, format, package and selected extras');
  assert.equal(booking.deposit, '$124', 'Booking deposit should reflect the configured 30 percent rule');
  assert.equal(booking.mode, 'Book now', 'Airport transfer should stay book-now');
  assert.equal(booking.payDisabled, true, 'Checkout buttons should stay disabled until Stripe is enabled in config');
  assert.match(booking.note, /Stripe checkout is wired/i, 'Booking note should explain why checkout is disabled');
  assert.deepEqual(issues, [], `Destination Cocoa flow emitted runtime errors: ${issues.join(' | ')}`);

  await context.close();
}

async function main() {
  const server = createStaticServer(ROOT_DIR);
  const address = await listen(server);
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });

  try {
    await testStaticSeoSources();
    console.log('PASS static-seo-sources');

    await testHomePage(browser, baseUrl);
    console.log('PASS home-i18n-labels');

    await testHomeSeoEnglish(browser, baseUrl);
    console.log('PASS home-seo-english');

    await testLeadSubmitSuccess(browser, baseUrl);
    console.log('PASS lead-submit-success');

    await testCaseStudiesLanguageSwitch(browser, baseUrl);
    console.log('PASS case-studies-language-switch');

    await testCaseStudiesSeoItalian(browser, baseUrl);
    console.log('PASS case-studies-seo-italian');

    await testQuoteFxFallback(browser, baseUrl);
    console.log('PASS quote-fx-fallback');

    await testQuoteArabicSeoState(browser, baseUrl);
    console.log('PASS quote-arabic-seo-state');

    await testQuoteSubmitFallback(browser, baseUrl);
    console.log('PASS quote-submit-fallback');

    await testDestinationCocoaFlow(browser, baseUrl);
    console.log('PASS destination-cocoa-flow');
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
