const fs = require('fs/promises');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ARTIFACT_ROOT = path.resolve(
  process.env.ARTIFACT_ROOT ||
  process.env.SITE_ROOT ||
  path.join(PROJECT_ROOT, '.cloudflare-pages')
);
const jsonOutput = process.argv.includes('--json');

const REQUIRED_FILES = new Set([
  '_headers',
  'app-analytics.js',
  'app-bootstrap.js',
  'app-forms.js',
  'app-fx.js',
  'app-i18n.js',
  'app-quote-estimator.js',
  'app-seo.js',
  'app.js',
  'assets/logo/cantoni_icona_quadrata.png',
  'assets/logo/cantoni_icona_quadrata.svg',
  'assets/logo/cantoni_primary_horizontal_small.svg',
  'case-studies.html',
  'favicon.svg',
  'i18n.json',
  'identita-operativa.html',
  'index.html',
  'pagamento-confermato.html',
  'preventivo.html',
  'privacy.html',
  'robots.txt',
  'sales-kit/fx_rates.json',
  'servizi.html',
  'sitemap.xml',
  'site-config.js',
  'studio.html',
  'styles.css',
  'termini-commerciali.html'
]);

const DISALLOWED_PATTERNS = [
  /^\.DS_Store$/,
  /^AUTOMATION_/,
  /^CLOUDFLARE_DEPLOY_RUNBOOK\.md$/,
  /^DEPLOY_RUNBOOK\.md$/,
  /^EXCELLENTIA_/,
  /^client-documents\//,
  /^functions\//,
  /^node_modules\//,
  /^output\//,
  /^sales-kit\/(?!fx_rates\.json$)/,
  /^scripts\//,
  /^server\//,
  /^studio-admin/,
  /^supabase\//,
  /^wrangler\.toml$/,
  /^netlify\.toml$/,
  /^package(?:-lock)?\.json$/
];

function normalizeRel(value) {
  return value.split(path.sep).join('/');
}

function fail(message) {
  throw new Error(message);
}

function writeReport(report) {
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (report.ok) {
    console.log(`PASS deploy-artifact (${report.files_count} files checked in ${ARTIFACT_ROOT})`);
  } else {
    console.error(`FAIL deploy-artifact (${report.issues.length} issues)`);
    for (const issue of report.issues) console.error(`- ${issue}`);
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath, base));
    } else {
      files.push(normalizeRel(path.relative(base, fullPath)));
    }
  }
  return files.sort();
}

function attrValues(html, attrName) {
  return Array.from(html.matchAll(new RegExp(`\\b${attrName}\\s*=\\s*["']([^"']+)["']`, 'gi'))).map((match) => match[1]);
}

function cssUrls(css) {
  return Array.from(css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)).map((match) => match[1]);
}

function isSkippableUrl(value) {
  return !value ||
    value === '#' ||
    value.startsWith('#') ||
    /^(https?:|mailto:|tel:|sms:|whatsapp:|data:|javascript:)/i.test(value);
}

function cleanRef(value) {
  return String(value || '').split('#')[0].split('?')[0];
}

function resolveLocalRef(sourceFile, value) {
  const clean = cleanRef(value);
  if (isSkippableUrl(clean)) return null;
  const decoded = decodeURIComponent(clean);
  return decoded.startsWith('/')
    ? path.join(ARTIFACT_ROOT, decoded.replace(/^\/+/, ''))
    : path.join(ARTIFACT_ROOT, path.dirname(sourceFile), decoded);
}

async function checkLocalReferences(fileName, issues) {
  const filePath = path.join(ARTIFACT_ROOT, fileName);
  const content = await fs.readFile(filePath, 'utf8');
  const refs = [
    ...attrValues(content, 'href'),
    ...attrValues(content, 'src')
  ];
  if (fileName.endsWith('.css')) refs.push(...cssUrls(content));

  for (const ref of refs) {
    const resolved = resolveLocalRef(fileName, ref);
    if (!resolved) continue;
    if (!resolved.startsWith(ARTIFACT_ROOT)) {
      issues.push(`${fileName}: unsafe local reference ${ref}`);
      continue;
    }
    if (!await pathExists(resolved)) issues.push(`${fileName}: missing local reference ${ref}`);
  }
}

async function checkSitemap(issues) {
  const sitemap = await fs.readFile(path.join(ARTIFACT_ROOT, 'sitemap.xml'), 'utf8');
  const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)).map((match) => match[1]);
  for (const loc of locs) {
    const url = new URL(loc);
    if (url.hostname !== 'cantonidigitalstudio.com') {
      issues.push(`sitemap.xml: unexpected host ${url.hostname}`);
      continue;
    }
    const target = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    if (!await pathExists(path.join(ARTIFACT_ROOT, target))) {
      issues.push(`sitemap.xml: missing artifact page for ${loc}`);
    }
  }
}

async function checkI18nReferences(issues) {
  const i18nPath = path.join(ARTIFACT_ROOT, 'i18n.json');
  const i18n = JSON.parse(await fs.readFile(i18nPath, 'utf8'));
  const keys = new Set(Object.keys((i18n.translations && i18n.translations.en) || {}));
  const htmlFiles = (await walk(ARTIFACT_ROOT)).filter((fileName) => fileName.endsWith('.html'));

  for (const fileName of htmlFiles) {
    const content = await fs.readFile(path.join(ARTIFACT_ROOT, fileName), 'utf8');
    const referenced = new Set([
      ...attrValues(content, 'data-i18n'),
      ...attrValues(content, 'data-i18n-placeholder'),
      ...attrValues(content, 'data-i18n-aria-label')
    ]);

    for (const key of referenced) {
      if (!keys.has(key)) issues.push(`${fileName}: missing i18n key ${key}`);
    }
  }
}

async function checkContentLeaks(fileName, issues) {
  if (!/\.(html|js|css|json|xml|txt)$/.test(fileName)) return;
  const content = await fs.readFile(path.join(ARTIFACT_ROOT, fileName), 'utf8');
  const rules = [
    { label: 'TODO/FIXME marker', pattern: /\b(?:TODO|FIXME)\b/ },
    { label: 'lorem ipsum placeholder', pattern: /lorem ipsum/i },
    { label: 'example domain', pattern: /https?:\/\/(?:www\.)?example\./i },
    { label: 'private workspace path', pattern: /\/Volumes\/|\/Users\/emanuelecantoni\// },
    { label: 'private admin config', pattern: /studioAdmin|vipBookings|vipStripe|vipAccount|adminSessionStorageKey/ }
  ];
  for (const rule of rules) {
    if (rule.pattern.test(content)) issues.push(`${fileName}: ${rule.label}`);
  }
}

async function main() {
  if (!await pathExists(ARTIFACT_ROOT)) fail(`artifact root does not exist: ${ARTIFACT_ROOT}`);

  const files = await walk(ARTIFACT_ROOT);
  const issues = [];
  const fileSet = new Set(files);

  for (const required of REQUIRED_FILES) {
    if (!fileSet.has(required)) issues.push(`missing required artifact file ${required}`);
  }

  for (const fileName of files) {
    if (!REQUIRED_FILES.has(fileName)) issues.push(`unexpected artifact file ${fileName}`);
    for (const pattern of DISALLOWED_PATTERNS) {
      if (pattern.test(fileName)) issues.push(`disallowed artifact file ${fileName}`);
    }
    if (fileName.endsWith('.html') || fileName.endsWith('.css')) {
      await checkLocalReferences(fileName, issues);
    }
    await checkContentLeaks(fileName, issues);
  }

  await checkSitemap(issues);
  await checkI18nReferences(issues);

  const report = {
    ok: issues.length === 0,
    artifact_root: normalizeRel(path.relative(PROJECT_ROOT, ARTIFACT_ROOT)) || '.',
    files_count: files.length,
    required_files_count: REQUIRED_FILES.size,
    issues,
    failures: issues.map((issue) => ({
      id: 'artifact_contract',
      reason: issue
    }))
  };

  writeReport(report);

  if (!report.ok) {
    process.exitCode = 1;
    return;
  }
}

main().catch((error) => {
  const report = {
    ok: false,
    artifact_root: normalizeRel(path.relative(PROJECT_ROOT, ARTIFACT_ROOT)) || '.',
    files_count: 0,
    required_files_count: REQUIRED_FILES.size,
    issues: [error.message],
    failures: [{
      id: 'artifact_error',
      reason: error.message
    }]
  };
  writeReport(report);
  process.exitCode = 1;
});
