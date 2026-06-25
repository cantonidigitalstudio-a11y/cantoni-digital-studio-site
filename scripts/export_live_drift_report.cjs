const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { HTML_PAGES } = require('./lib/live_site_contract.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ARTIFACT_ROOT = path.resolve(process.env.ARTIFACT_ROOT || process.env.SITE_ROOT || path.join(PROJECT_ROOT, '.cloudflare-pages'));
const OUTPUT_DIR = path.resolve(process.env.LIVE_DRIFT_REPORT_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/live-drift'));
const BASE_URL = (process.env.LIVE_SITE_BASE_URL || 'https://cantonidigitalstudio.com').replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.LIVE_DRIFT_TIMEOUT_MS || 12000);
const VERSION = process.env.LIVE_DRIFT_REPORT_VERSION || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

if (!/^[A-Za-z0-9._-]+$/.test(VERSION)) {
  throw new Error('LIVE_DRIFT_REPORT_VERSION may contain only letters, numbers, dots, underscores and dashes.');
}

const BASE_NAME = `cantoni-live-drift-${VERSION}`;
const MARKDOWN_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.md`);
const JSON_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.json`);

function runStep(label, command, args) {
  console.error(`step=${label}`);
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    shell: false
  });

  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `${command} exited with ${result.status}`}`);
  }
}

function artifactFileFor(pagePath) {
  if (pagePath === '/') return 'index.html';
  return pagePath.replace(/^\/+/, '');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'CantoniDigitalStudioLiveDriftReport/1.0' },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readArtifact(page) {
  const file = artifactFileFor(page.path);
  const filePath = path.join(ARTIFACT_ROOT, file);
  const html = await fs.readFile(filePath, 'utf8');
  const missing = page.required.filter((snippet) => !html.includes(snippet));
  return {
    file,
    sha256: sha256Text(html),
    required_ok: missing.length === 0,
    missing_required: missing
  };
}

async function readLive(page) {
  const url = `${BASE_URL}${page.path}`;
  const response = await fetchWithTimeout(url);
  const html = await response.text();
  const missing = page.required.filter((snippet) => !html.includes(snippet));
  return {
    url,
    final_url: response.url,
    status: response.status,
    content_type: response.headers.get('content-type') || '',
    sha256: sha256Text(html),
    required_ok: missing.length === 0,
    missing_required: missing
  };
}

function renderMarkdown(payload) {
  const driftRows = payload.pages.map((page) => {
    const deployWillFix = page.artifact.required_ok && !page.live.required_ok;
    return `| \`${page.path}\` | ${page.live.status} | ${page.live.required_ok ? 'yes' : 'no'} | ${page.artifact.required_ok ? 'yes' : 'no'} | ${deployWillFix ? 'yes' : 'no'} | ${page.live.missing_required.map((item) => `\`${item}\``).join('<br>') || ''} |`;
  });

  return [
    '# Cantoni Live Drift Report',
    '',
    `Generated: ${payload.generated_at}`,
    `Live base URL: ${payload.base_url}`,
    `Artifact root: \`${payload.artifact_root}\``,
    `Artifact contract ok: ${payload.artifact_contract_ok ? 'yes' : 'no'}`,
    `Live contract ok: ${payload.live_contract_ok ? 'yes' : 'no'}`,
    `Deploy-only drift: ${payload.deploy_only_drift ? 'yes' : 'no'}`,
    '',
    '## Page Drift',
    '',
    '| Page | Live HTTP | Live contract ok | Artifact contract ok | Deploy should fix | Live missing snippets |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...driftRows,
    '',
    '## Interpretation',
    '',
    payload.deploy_only_drift
      ? 'The generated artifact satisfies the live-site content contract for every checked page, while production still misses required snippets. This is a deployment-state blocker, not a source-content blocker.'
      : 'At least one checked artifact page does not satisfy the contract, or live production already matches the artifact contract. Inspect the JSON report before deploying.',
    '',
    '## Required Next Steps',
    '',
    '1. Fix Cloudflare Pages auth for the Cantoni account.',
    '2. Deploy only the verified `.cloudflare-pages` artifact after approval.',
    '3. Run `npm run test:live-site` after deployment.',
    '4. Run `npm run audit:launch-readiness` and require `live_site_contract` to pass.',
    ''
  ].join('\n');
}

async function main() {
  runStep('build_cloudflare_public_dir', 'npm', ['run', 'build:cloudflare']);
  runStep('artifact_integrity', 'npm', ['run', 'test:artifact']);

  const pages = [];
  for (const page of HTML_PAGES) {
    const [artifact, live] = await Promise.all([
      readArtifact(page),
      readLive(page)
    ]);
    pages.push({
      path: page.path,
      required: page.required,
      artifact,
      live,
      hashes_match: artifact.sha256 === live.sha256
    });
  }

  const artifactContractOk = pages.every((page) => page.artifact.required_ok);
  const liveContractOk = pages.every((page) => page.live.required_ok);
  const deployOnlyDrift = artifactContractOk && !liveContractOk && pages.some((page) => page.artifact.sha256 !== page.live.sha256);
  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    artifact_root: '.cloudflare-pages',
    artifact_contract_ok: artifactContractOk,
    live_contract_ok: liveContractOk,
    deploy_only_drift: deployOnlyDrift,
    pages
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, JSON.stringify(payload, null, 2) + '\n');
  await fs.writeFile(MARKDOWN_PATH, renderMarkdown(payload));

  console.log(JSON.stringify({
    ok: true,
    artifact_contract_ok: artifactContractOk,
    live_contract_ok: liveContractOk,
    deploy_only_drift: deployOnlyDrift,
    pages_checked: pages.length,
    markdown: MARKDOWN_PATH,
    json: JSON_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
