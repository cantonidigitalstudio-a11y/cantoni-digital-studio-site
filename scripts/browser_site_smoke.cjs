const assert = require('assert/strict');
const fs = require('fs/promises');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(process.env.SITE_ROOT || path.join(__dirname, '..'));

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
    case '.png':
      return 'image/png';
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
    server.close((error) => error ? reject(error) : resolve());
  });
}

async function createContext(browser, baseUrl, viewport, options = {}) {
  const context = await browser.newContext({ baseURL: baseUrl, viewport });

  await context.route('https://fonts.googleapis.com/**', (route) => {
    route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' });
  });
  await context.route('https://fonts.gstatic.com/**', (route) => {
    route.fulfill({ status: 204, body: '' });
  });
  await context.route('https://script.google.com/**', (route) => {
    if (options.scriptGoogleRequests) options.scriptGoogleRequests.push(route.request().url());
    const requestUrl = new URL(route.request().url());
    const callbackName = requestUrl.searchParams.get('callback');
    route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: callbackName ? `${callbackName}(${JSON.stringify({ ok: true })});` : ''
    });
  });

  return context;
}

function attachGuards(page, issues) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.push(`console:${msg.text()}`);
  });
  page.on('pageerror', (error) => {
    issues.push(`pageerror:${error.message}`);
  });
  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('127.0.0.1')) return;
    if (response.status() >= 400) issues.push(`local-http:${response.status()}:${url}`);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith('http://127.0.0.1')) {
      issues.push(`local-request-failed:${url}:${request.failure()?.errorText || 'unknown'}`);
    }
  });
}

async function assertPageHealthy(context, urlPath, expectedTitlePart, options = {}) {
  const page = await context.newPage();
  const issues = [];
  attachGuards(page, issues);
  await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1', { timeout: 10000 });
  const snapshot = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
    privacyLinks: document.querySelectorAll('a[href="privacy.html"]').length,
    termsLinks: document.querySelectorAll('a[href="termini-commerciali.html"], a[href^="termini-commerciali.html#"]').length,
    emailLinks: document.querySelectorAll('a[href^="mailto:cantonidigitalstudio@gmail.com"]').length,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));

  assert.match(snapshot.title, expectedTitlePart, `${urlPath}: title should match expected page`);
  assert.ok(snapshot.h1.length >= 12, `${urlPath}: h1 should be meaningful`);
  if (options.noindex) {
    assert.match(snapshot.robots, /noindex/i, `${urlPath}: noindex page should declare noindex`);
  } else {
    assert.ok(snapshot.canonical.startsWith('https://cantonidigitalstudio.com/'), `${urlPath}: canonical should be production absolute`);
  }
  assert.ok(snapshot.privacyLinks >= 1, `${urlPath}: should expose privacy link`);
  assert.ok(snapshot.termsLinks >= 1 || urlPath.includes('termini-commerciali'), `${urlPath}: should expose commercial terms link`);
  assert.ok(snapshot.emailLinks >= 1, `${urlPath}: should expose operating email`);
  assert.ok(snapshot.horizontalOverflow <= 2, `${urlPath}: should not create horizontal overflow (${snapshot.horizontalOverflow}px)`);
  assert.deepEqual(issues, [], `${urlPath}: browser issues: ${issues.join(' | ')}`);
  await page.close();
}

async function assertFxBehavior(context) {
  const page = await context.newPage();
  const issues = [];
  attachGuards(page, issues);

  await page.goto('/preventivo.html?lang=it&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#fxCurrency')?.value === 'EUR', null, { timeout: 12000 });
  assert.equal(await page.locator('#fxCurrency').inputValue(), 'EUR', 'Italian quote page should default to EUR');

  await page.goto('/preventivo.html?lang=en&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#fxCurrency')?.value === 'USD', null, { timeout: 12000 });
  await page.fill('input[name="country"]', 'Italy');
  await page.waitForFunction(() => document.querySelector('#fxCurrency')?.value === 'EUR', null, { timeout: 12000 });
  assert.equal(await page.locator('#fxCurrency').inputValue(), 'EUR', 'Country field should auto-select EUR before manual override');

  await page.selectOption('#fxCurrency', 'USD');
  await page.fill('input[name="country"]', 'Italy');
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#fxCurrency').inputValue(), 'USD', 'Manual currency selection should stop country auto-overrides');

  await page.goto('/preventivo.html?lang=it&currency=GBP&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#fxCurrency')?.value === 'GBP', null, { timeout: 12000 });
  await page.fill('input[name="country"]', 'Italy');
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#fxCurrency').inputValue(), 'GBP', 'currency URL parameter should be respected as an explicit override');

  assert.deepEqual(issues, [], `FX browser issues: ${issues.join(' | ')}`);
  await page.close();
}

async function assertBusinessCardEntry(context) {
  const page = await context.newPage();
  const issues = [];
  attachGuards(page, issues);

  await page.setViewportSize({ width: 850, height: 720 });
  await page.goto('/preventivo.html?lang=it&utm_source=business_card&utm_medium=print&utm_campaign=offline_intro&smoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#businessCardEntry:not([hidden])', { timeout: 10000 });
  await page.waitForSelector('#cdsCookieConsent', { timeout: 10000 });
  await page.waitForFunction(() => document.documentElement.lang === 'it', null, { timeout: 10000 });

  const snapshot = await page.evaluate(() => {
    const form = document.querySelector('#quoteForm');
    const cookieRect = document.querySelector('#cdsCookieConsent')?.getBoundingClientRect();
    const actionOverlaps = Array.from(document.querySelectorAll('.business-card-entry-actions .btn')).filter((button) => {
      const buttonRect = button.getBoundingClientRect();
      return Boolean(cookieRect &&
        cookieRect.left < buttonRect.right &&
        cookieRect.right > buttonRect.left &&
        cookieRect.top < buttonRect.bottom &&
        cookieRect.bottom > buttonRect.top);
    }).map((button) => button.textContent.trim());
    return {
      title: document.querySelector('#businessCardEntryTitle')?.textContent?.trim() || '',
      whatsappHref: document.querySelector('#businessCardEntry a[href^="https://wa.me/"]')?.getAttribute('href') || '',
      phoneHref: document.querySelector('#businessCardEntry a[href^="tel:"]')?.getAttribute('href') || '',
      leadSource: form?.elements.namedItem('leadSource')?.value || '',
      utmSource: form?.elements.namedItem('utmSource')?.value || '',
      utmMedium: form?.elements.namedItem('utmMedium')?.value || '',
      utmCampaign: form?.elements.namedItem('utmCampaign')?.value || '',
      hidden: document.querySelector('#businessCardEntry')?.hidden,
      cookieHeight: cookieRect ? Math.round(cookieRect.height) : 0,
      cookieOverlappingActions: actionOverlaps,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  assert.match(snapshot.title, /proposta reale/i, 'Business-card entry should show the Italian QR-specific promise');
  assert.equal(snapshot.hidden, false, 'Business-card entry should be visible for print UTM traffic');
  assert.ok(snapshot.whatsappHref.includes('393471961113'), 'Business-card entry should expose the printed WhatsApp number');
  assert.equal(snapshot.phoneHref, 'tel:+393471961113', 'Business-card entry should expose the printed phone number');
  assert.equal(snapshot.leadSource, 'business_card', 'Quote form should preserve business-card attribution');
  assert.equal(snapshot.utmSource, 'business_card', 'Quote form should preserve utm_source');
  assert.equal(snapshot.utmMedium, 'print', 'Quote form should preserve utm_medium');
  assert.equal(snapshot.utmCampaign, 'offline_intro', 'Quote form should preserve utm_campaign');
  assert.ok(snapshot.cookieHeight <= 170, `Business-card cookie banner should stay compact (${snapshot.cookieHeight}px)`);
  assert.deepEqual(snapshot.cookieOverlappingActions, [], `Business-card cookie banner should not cover contact actions (${snapshot.cookieOverlappingActions.join(', ')})`);
  assert.ok(snapshot.horizontalOverflow <= 2, `Business-card entry should not create horizontal overflow (${snapshot.horizontalOverflow}px)`);
  assert.deepEqual(issues, [], `Business-card entry browser issues: ${issues.join(' | ')}`);

  await page.click('.business-card-entry-actions .btn-primary');
  await page.waitForFunction(() => window.location.hash === '#quoteEstimator', null, { timeout: 10000 });
  const estimatorPosition = await page.evaluate(() => {
    const estimatorRect = document.querySelector('#quoteEstimator')?.getBoundingClientRect();
    const headerRect = document.querySelector('.site-header')?.getBoundingClientRect();
    return {
      estimatorTop: estimatorRect ? Math.round(estimatorRect.top) : -1,
      headerBottom: headerRect ? Math.round(headerRect.bottom) : 0,
      titleVisible: Boolean(document.querySelector('#quoteEstimatorTitle')?.getBoundingClientRect().bottom > 0)
    };
  });
  assert.ok(
    estimatorPosition.estimatorTop >= estimatorPosition.headerBottom + 8,
    `Estimator anchor should land below sticky header (${JSON.stringify(estimatorPosition)})`
  );
  assert.equal(estimatorPosition.titleVisible, true, 'Estimator title should be visible after QR CTA click');
  await page.close();
}

async function assertAnalyticsConsent(browser, baseUrl) {
  const essentialRequests = [];
  const essentialContext = await createContext(browser, baseUrl, { width: 1440, height: 1000 }, {
    scriptGoogleRequests: essentialRequests
  });
  const essentialPage = await essentialContext.newPage();
  const essentialIssues = [];
  attachGuards(essentialPage, essentialIssues);

  await essentialPage.goto('/index.html?lang=it&smoke=1', { waitUntil: 'domcontentloaded' });
  await essentialPage.waitForSelector('#cdsCookieConsent', { timeout: 10000 });
  await essentialPage.waitForTimeout(500);
  assert.deepEqual(essentialRequests, [], 'Analytics must not call Google Apps Script before consent');
  await essentialPage.click('[data-cookie-choice="essential"]');
  await essentialPage.goto('/studio.html?lang=it&smoke=1', { waitUntil: 'domcontentloaded' });
  await essentialPage.waitForTimeout(500);
  assert.deepEqual(essentialRequests, [], 'Essential-only consent must not send analytics events');
  assert.deepEqual(essentialIssues, [], `Essential consent emitted runtime errors: ${essentialIssues.join(' | ')}`);
  await essentialContext.close();

  const analyticsRequests = [];
  const analyticsContext = await createContext(browser, baseUrl, { width: 1440, height: 1000 }, {
    scriptGoogleRequests: analyticsRequests
  });
  const analyticsPage = await analyticsContext.newPage();
  const analyticsIssues = [];
  attachGuards(analyticsPage, analyticsIssues);

  await analyticsPage.goto('/index.html?lang=it&smoke=1', { waitUntil: 'domcontentloaded' });
  await analyticsPage.waitForSelector('#cdsCookieConsent', { timeout: 10000 });
  await analyticsPage.click('[data-cookie-choice="analytics"]');
  await analyticsPage.waitForFunction(() => {
    return localStorage.getItem('cds_cookie_consent_v1')?.includes('"analytics":true');
  }, null, { timeout: 10000 });
  await analyticsPage.waitForTimeout(500);
  assert.ok(analyticsRequests.some((url) => url.includes('action=track_event')), 'Analytics consent should allow tracked events');
  assert.deepEqual(analyticsIssues, [], `Analytics consent emitted runtime errors: ${analyticsIssues.join(' | ')}`);
  await analyticsContext.close();
}

async function main() {
  const server = createStaticServer(ROOT_DIR);
  const address = await listen(server);
  const baseUrl = `http://${address.address}:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } }
  ];
  const pages = [
    { path: '/index.html?lang=it&smoke=1', title: /Cantoni Digital Studio/i },
    { path: '/servizi.html', title: /Servizi digitali/i },
    { path: '/privacy.html', title: /Privacy e cookie/i },
    { path: '/preventivo.html?lang=it&smoke=1', title: /Consulenza|percorso progetto/i },
    { path: '/termini-commerciali.html', title: /Termini commerciali/i },
    { path: '/pagamento-confermato.html?payment_path=consultation_phase_1&payment_mode=payment&session_id=test_session', title: /Pagamento confermato/i, noindex: true }
  ];

  try {
    for (const item of viewports) {
      const context = await createContext(browser, baseUrl, item.viewport);
      try {
        for (const pageItem of pages) {
          await assertPageHealthy(context, pageItem.path, pageItem.title, pageItem);
        }
        if (item.name === 'desktop') {
          await assertFxBehavior(context);
          await assertBusinessCardEntry(context);
          await assertAnalyticsConsent(browser, baseUrl);
        }
      } finally {
        await context.close();
      }
    }

    console.log(`PASS browser-site-smoke (${viewports.length} viewports, ${pages.length} pages, fx default/override and consent checked)`);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

main().catch((error) => {
  console.error(`FAIL browser-site-smoke: ${error.message}`);
  process.exitCode = 1;
});
