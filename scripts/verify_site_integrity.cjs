const fs = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PRIMARY_PAGES = new Set([
  'index.html',
  'studio.html',
  'servizi.html',
  'case-studies.html',
  'preventivo.html',
  'termini-commerciali.html',
  'privacy.html',
  'identita-operativa.html'
]);

const REQUIRED_PUBLIC_REFERENCES = [
  'https://excellentiavip.com',
  'https://destination-cocoa-site.netlify.app',
  'https://ec8platform.com',
  'https://www.instagram.com/cantonidigitalstudio/'
];

const SAME_SITE_HOSTS = new Set([
  'cantonidigitalstudio.com',
  'www.cantonidigitalstudio.com',
  'excellentiavip.com',
  'www.excellentiavip.com',
  'destination-cocoa-site.netlify.app',
  'ec8platform.com',
  'www.ec8platform.com'
]);

function fail(message) {
  throw new Error(message);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

function tags(html, tagName) {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))).map((match) => match[0]);
}

function attrValues(html, attrName) {
  return Array.from(html.matchAll(new RegExp(`\\b${attrName}\\s*=\\s*["']([^"']+)["']`, 'gi'))).map((match) => match[1]);
}

function isSkippableUrl(value) {
  return !value ||
    value === '#' ||
    value.startsWith('#') ||
    /^(mailto|tel|sms|whatsapp|data|javascript):/i.test(value);
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value);
}

function stripQueryAndHash(value) {
  return String(value || '').split('#')[0].split('?')[0];
}

function resolveLocalPath(fileName, value) {
  const clean = stripQueryAndHash(value);
  if (!clean || isSkippableUrl(clean) || isExternalUrl(clean)) return null;
  const decoded = decodeURIComponent(clean);
  const baseDir = path.dirname(path.join(ROOT_DIR, fileName));
  return decoded.startsWith('/')
    ? path.join(ROOT_DIR, decoded.replace(/^\/+/, ''))
    : path.join(baseDir, decoded);
}

function externalHost(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return '';
  }
}

async function listHtmlFiles() {
  const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name)
    .sort();
}

async function readI18nKeys() {
  const data = JSON.parse(await fs.readFile(path.join(ROOT_DIR, 'i18n.json'), 'utf8'));
  return new Set(Object.keys(data.translations.en || {}));
}

function checkPrimarySeo(fileName, html, issues) {
  if (!PRIMARY_PAGES.has(fileName)) return;
  if (!/<title[^>]*>[^<]{8,}<\/title>/i.test(html)) issues.push(`${fileName}: missing useful title`);
  if (!/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}["']/i.test(html)) {
    issues.push(`${fileName}: missing useful meta description`);
  }
  if (!/<link[^>]+rel=["']canonical["'][^>]+href=["']https:\/\/[^"']+["']/i.test(html)) {
    issues.push(`${fileName}: missing absolute canonical`);
  }
  if (!/<h1\b[^>]*>/i.test(html)) issues.push(`${fileName}: missing h1`);
}

function checkPublicReferences(fileName, html, issues) {
  if (!['index.html', 'studio.html', 'servizi.html', 'case-studies.html', 'preventivo.html'].includes(fileName)) return;
  const missing = REQUIRED_PUBLIC_REFERENCES.filter((reference) => !html.includes(reference));
  if (missing.length) issues.push(`${fileName}: missing public references ${missing.join(', ')}`);
}

function checkCommercialCompliance(fileName, html, issues) {
  if (!PRIMARY_PAGES.has(fileName)) return;

  if (!html.includes('privacy.html')) {
    issues.push(`${fileName}: missing privacy/cookie notice link`);
  }
  if (!html.includes('termini-commerciali.html')) {
    issues.push(`${fileName}: missing commercial terms link`);
  }
  if (!html.includes('mailto:cantonidigitalstudio@gmail.com')) {
    issues.push(`${fileName}: missing operating email link`);
  }

  if (/<form\b/i.test(html) && !html.includes('name="privacyAccepted"')) {
    issues.push(`${fileName}: form missing explicit privacy acceptance field`);
  }

  if (fileName === 'preventivo.html') {
    const requiredBusinessCardSnippets = [
      'id="businessCardEntry"',
      'https://wa.me/393471961113',
      'href="tel:+393471961113"',
      'name="leadSource"',
      'name="utmSource"',
      'name="utmMedium"',
      'name="utmCampaign"'
    ];
    for (const snippet of requiredBusinessCardSnippets) {
      if (!html.includes(snippet)) issues.push(`${fileName}: missing business-card entry contract ${snippet}`);
    }
  }
}

function checkFxContract(issues) {
  const appFx = require('fs').readFileSync(path.join(ROOT_DIR, 'app-fx.js'), 'utf8');
  const requiredSnippets = [
    'languageCurrencyMap',
    "it: 'EUR'",
    "en: 'USD'",
    'getCurrencyFromUrl',
    'manualCurrencyLock'
  ];

  for (const snippet of requiredSnippets) {
    if (!appFx.includes(snippet)) issues.push(`app-fx.js: missing currency contract snippet ${snippet}`);
  }
}

async function checkDeliveryHygiene(issues) {
  const gitignore = await fs.readFile(path.join(ROOT_DIR, '.gitignore'), 'utf8').catch(() => '');
  const requiredIgnores = ['node_modules/', '.DS_Store', '.cloudflare-pages/', '.excellentia-public/', '.playwright-cli/', 'output/'];
  for (const entry of requiredIgnores) {
    if (!gitignore.includes(entry)) issues.push(`.gitignore: missing ${entry}`);
  }
}

async function checkDeployConfig(issues) {
  const netlifyConfig = await fs.readFile(path.join(ROOT_DIR, 'netlify.toml'), 'utf8').catch(() => '');
  const wranglerConfig = await fs.readFile(path.join(ROOT_DIR, 'wrangler.toml'), 'utf8').catch(() => '');

  if (!/publish\s*=\s*["']\.cloudflare-pages["']/.test(netlifyConfig)) {
    issues.push('netlify.toml: publish must point to .cloudflare-pages, never repository root');
  }
  if (/publish\s*=\s*["']\.["']/.test(netlifyConfig)) {
    issues.push('netlify.toml: repository root publish is forbidden');
  }
  if (/directory\s*=\s*["']functions["']/.test(netlifyConfig)) {
    issues.push('netlify.toml: public preview must not publish local functions directory');
  }
  if (!/pages_build_output_dir\s*=\s*["']\.cloudflare-pages["']/.test(wranglerConfig)) {
    issues.push('wrangler.toml: pages_build_output_dir must point to .cloudflare-pages');
  }
}

function checkContentLeaks(fileName, html, issues) {
  const leakPatterns = [
    { label: 'TODO/FIXME marker', pattern: /\b(?:TODO|FIXME)\b/i },
    { label: 'lorem ipsum placeholder', pattern: /lorem ipsum/i },
    { label: 'example domain', pattern: /https?:\/\/(?:www\.)?example\./i }
  ];

  for (const rule of leakPatterns) {
    if (rule.pattern.test(html)) issues.push(`${fileName}: ${rule.label}`);
  }
}

function checkI18nKeys(fileName, html, keys, issues) {
  if (!PRIMARY_PAGES.has(fileName)) return;
  const referenced = new Set([
    ...attrValues(html, 'data-i18n'),
    ...attrValues(html, 'data-i18n-placeholder'),
    ...attrValues(html, 'data-i18n-aria-label')
  ]);
  for (const key of referenced) {
    if (!keys.has(key)) issues.push(`${fileName}: missing i18n key ${key}`);
  }
}

async function checkLocalReferences(fileName, html, issues) {
  const references = [
    ...attrValues(html, 'href'),
    ...attrValues(html, 'src')
  ];

  for (const value of references) {
    const localPath = resolveLocalPath(fileName, value);
    if (!localPath) continue;
    if (!localPath.startsWith(ROOT_DIR)) {
      issues.push(`${fileName}: unsafe local path ${value}`);
      continue;
    }
    if (!await pathExists(localPath)) issues.push(`${fileName}: missing local reference ${value}`);
  }
}

function checkExternalAnchors(fileName, html, issues) {
  for (const tag of tags(html, 'a')) {
    const attrs = attrsFromTag(tag);
    const href = attrs.href || '';
    if (!isExternalUrl(href)) continue;

    const host = externalHost(href);
    const isSameSite = SAME_SITE_HOSTS.has(host);
    if (isSameSite) continue;

    if (attrs.target !== '_blank') issues.push(`${fileName}: external link missing target _blank (${href})`);
    if (!/\bnoreferrer\b/i.test(attrs.rel || '')) issues.push(`${fileName}: external link missing rel noreferrer (${href})`);
  }
}

function checkStripeLinks(fileName, html, issues) {
  for (const tag of tags(html, 'a')) {
    const attrs = attrsFromTag(tag);
    const href = attrs.href || '';
    if (!href.includes('https://buy.stripe.com/')) continue;

    if (attrs.target !== '_blank') issues.push(`${fileName}: Stripe link missing target _blank`);
    if (!/\bnoreferrer\b/i.test(attrs.rel || '')) issues.push(`${fileName}: Stripe link missing rel noreferrer`);
    if (!attrs['data-payment-path']) issues.push(`${fileName}: Stripe link missing data-payment-path`);
    if (!attrs['data-payment-mode']) issues.push(`${fileName}: Stripe link missing data-payment-mode`);
  }
}

async function auditFile(fileName, keys) {
  const html = await fs.readFile(path.join(ROOT_DIR, fileName), 'utf8');
  const issues = [];

  checkPrimarySeo(fileName, html, issues);
  checkPublicReferences(fileName, html, issues);
  checkCommercialCompliance(fileName, html, issues);
  checkContentLeaks(fileName, html, issues);
  checkI18nKeys(fileName, html, keys, issues);
  checkExternalAnchors(fileName, html, issues);
  checkStripeLinks(fileName, html, issues);
  await checkLocalReferences(fileName, html, issues);

  return issues;
}

async function main() {
  const files = await listHtmlFiles();
  const keys = await readI18nKeys();
  const issues = [];

  for (const fileName of files) {
    issues.push(...await auditFile(fileName, keys));
  }
  checkFxContract(issues);
  await checkDeliveryHygiene(issues);
  await checkDeployConfig(issues);

  if (issues.length) {
    console.error(`FAIL site-integrity (${issues.length} issues)`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log(`PASS site-integrity (${files.length} HTML files checked)`);
}

main().catch((error) => fail(error.message || error));
