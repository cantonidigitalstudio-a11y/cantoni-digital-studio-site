const assert = require('assert/strict');

const BASE_URL = (process.env.LIVE_SITE_BASE_URL || 'https://cantonidigitalstudio.com').replace(/\/+$/, '');
const WWW_URL = process.env.LIVE_SITE_WWW_URL || 'https://www.cantonidigitalstudio.com';
const TIMEOUT_MS = Number(process.env.LIVE_SITE_TIMEOUT_MS || 12000);

const HTML_PAGES = [
  { path: '/', canonical: `${BASE_URL}/`, title: 'Cantoni Digital Studio', required: ['cantonidigitalstudio@gmail.com', 'https://wa.me/393471961113'] },
  { path: '/studio.html', canonical: `${BASE_URL}/studio.html`, title: 'Cantoni Digital Studio', required: ['privacy.html', 'termini-commerciali.html'] },
  { path: '/servizi.html', canonical: `${BASE_URL}/servizi.html`, title: 'Cantoni Digital Studio', required: ['privacy.html', 'termini-commerciali.html'] },
  { path: '/case-studies.html', canonical: `${BASE_URL}/case-studies.html`, title: 'Cantoni Digital Studio', required: ['https://excellentiavip.com', 'https://mrcollinstravel.com', 'https://ec8platform.com'] },
  { path: '/preventivo.html', canonical: `${BASE_URL}/preventivo.html`, title: 'Cantoni Digital Studio', required: ['name="privacyAccepted"', 'https://buy.stripe.com/'] },
  { path: '/identita-operativa.html', canonical: `${BASE_URL}/identita-operativa.html`, title: 'Cantoni Digital Studio', required: ['https://github.com/cantonidigitalstudio-a11y', 'https://www.instagram.com/cantonidigitalstudio/'] },
  { path: '/termini-commerciali.html', canonical: `${BASE_URL}/termini-commerciali.html`, title: 'Cantoni Digital Studio', required: ['privacy.html', 'cantonidigitalstudio@gmail.com'] },
  { path: '/privacy.html', canonical: `${BASE_URL}/privacy.html`, title: 'Cantoni Digital Studio', required: ['termini-commerciali.html', 'cantonidigitalstudio@gmail.com'] },
  { path: '/pagamento-confermato.html', canonical: null, title: 'Cantoni Digital Studio', noindex: true, required: ['Pagamento confermato'] }
];

const SECURITY_HEADERS = [
  { name: 'content-security-policy', includes: ["default-src 'self'", "frame-ancestors 'none'"] },
  { name: 'x-content-type-options', equals: 'nosniff' },
  { name: 'x-frame-options', equals: 'DENY' },
  { name: 'referrer-policy', equals: 'strict-origin-when-cross-origin' },
  { name: 'permissions-policy', includes: ['camera=()', 'microphone=()', 'geolocation=()'] }
];

function liveUrl(path) {
  return `${BASE_URL}${path}`;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'CantoniDigitalStudioLiveSiteAudit/1.0' },
      signal: controller.signal,
      ...options
    });
  } finally {
    clearTimeout(timeout);
  }
}

function headerValue(response, name) {
  return response.headers.get(name) || '';
}

function assertSecurityHeaders(response, url) {
  for (const rule of SECURITY_HEADERS) {
    const value = headerValue(response, rule.name);
    assert.ok(value, `${url}: missing security header ${rule.name}`);
    if (rule.equals) {
      assert.equal(value.toLowerCase(), rule.equals.toLowerCase(), `${url}: ${rule.name} mismatch`);
    }
    for (const snippet of rule.includes || []) {
      assert.ok(value.includes(snippet), `${url}: ${rule.name} missing ${snippet}`);
    }
  }
}

function canonicalFrom(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || '';
}

function robotsFrom(html) {
  return html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
}

async function auditHtmlPage(page) {
  const url = liveUrl(page.path);
  const response = await fetchWithTimeout(url);
  const html = await response.text();
  const contentType = headerValue(response, 'content-type');

  assert.equal(response.status, 200, `${url}: expected HTTP 200`);
  assert.ok(contentType.includes('text/html'), `${url}: expected HTML content-type`);
  assertSecurityHeaders(response, url);
  assert.ok(html.includes(page.title), `${url}: missing title marker ${page.title}`);
  assert.ok(/<h1\b/i.test(html), `${url}: missing h1`);
  assert.equal(/\/Volumes\/|\/Users\/emanuelecantoni\//.test(html), false, `${url}: leaked local filesystem path`);
  assert.equal(/\b(?:TODO|FIXME)\b/.test(html), false, `${url}: leaked TODO/FIXME marker`);

  if (page.canonical) {
    assert.equal(canonicalFrom(html), page.canonical, `${url}: canonical mismatch`);
  }
  if (page.noindex) {
    assert.match(robotsFrom(html), /noindex/i, `${url}: expected noindex robots meta`);
  } else {
    assert.equal(/noindex/i.test(robotsFrom(html)), false, `${url}: unexpected noindex robots meta`);
  }

  for (const snippet of page.required) {
    assert.ok(html.includes(snippet), `${url}: missing required snippet ${snippet}`);
  }

  return {
    path: page.path,
    status: response.status,
    content_type: contentType,
    canonical: canonicalFrom(html) || null
  };
}

async function auditRobots() {
  const url = liveUrl('/robots.txt');
  const response = await fetchWithTimeout(url);
  const text = await response.text();
  assert.equal(response.status, 200, `${url}: expected HTTP 200`);
  assert.ok(text.includes('User-agent: *'), `${url}: missing user-agent`);
  assert.ok(text.includes(`Sitemap: ${BASE_URL}/sitemap.xml`), `${url}: missing sitemap link`);
  assert.equal(/Disallow:\s*\//i.test(text), false, `${url}: must not disallow the full site`);
  return { path: '/robots.txt', status: response.status };
}

async function auditSitemap() {
  const url = liveUrl('/sitemap.xml');
  const response = await fetchWithTimeout(url);
  const xml = await response.text();
  assert.equal(response.status, 200, `${url}: expected HTTP 200`);
  for (const page of HTML_PAGES.filter((item) => item.canonical)) {
    assert.ok(xml.includes(`<loc>${page.canonical}</loc>`), `${url}: missing ${page.canonical}`);
  }
  assert.equal(/example\.|localhost|127\.0\.0\.1|\/Volumes\/|\/Users\//i.test(xml), false, `${url}: contains non-production reference`);
  return { path: '/sitemap.xml', status: response.status };
}

async function auditJsonAsset(path, validator) {
  const url = liveUrl(path);
  const response = await fetchWithTimeout(url);
  const payload = await response.json();
  assert.equal(response.status, 200, `${url}: expected HTTP 200`);
  validator(payload, url);
  return { path, status: response.status };
}

async function auditWwwAlias() {
  const response = await fetchWithTimeout(WWW_URL);
  const html = await response.text();
  assert.equal(response.status, 200, `${WWW_URL}: expected HTTP 200`);
  assertSecurityHeaders(response, WWW_URL);
  assert.equal(canonicalFrom(html), `${BASE_URL}/`, `${WWW_URL}: canonical should point to apex`);
  return { path: WWW_URL, status: response.status, canonical: canonicalFrom(html) };
}

async function main() {
  const results = [];
  const failures = [];

  async function collect(label, fn) {
    try {
      results.push(await fn());
    } catch (error) {
      failures.push({
        id: label,
        reason: String(error.message || error)
      });
    }
  }

  for (const page of HTML_PAGES) {
    await collect(`html:${page.path}`, () => auditHtmlPage(page));
  }

  await collect('robots', () => auditRobots());
  await collect('sitemap', () => auditSitemap());
  await collect('json:/i18n.json', () => auditJsonAsset('/i18n.json', (payload, url) => {
      assert.ok(Array.isArray(payload.langs) && payload.langs.includes('en') && payload.langs.includes('it'), `${url}: missing core languages`);
      assert.ok(payload.translations?.en?.nav_quote, `${url}: missing translation contract`);
    }));
  await collect('json:/sales-kit/fx_rates.json', () => auditJsonAsset('/sales-kit/fx_rates.json', (payload, url) => {
      assert.equal(payload.base, 'EUR', `${url}: FX base must be EUR`);
      assert.ok(Number(payload.rates?.USD) > 0, `${url}: missing USD rate`);
    }));
  await collect('www-alias', () => auditWwwAlias());

  console.log(JSON.stringify({
    ok: failures.length === 0,
    base_url: BASE_URL,
    checked: results.length,
    failures,
    results
  }, null, 2));

  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.log(JSON.stringify({
    ok: false,
    base_url: BASE_URL,
    checked: 0,
    failures: [{
      id: 'live_site_audit_error',
      reason: String(error.message || error)
    }],
    results: []
  }, null, 2));
  process.exitCode = 1;
});
