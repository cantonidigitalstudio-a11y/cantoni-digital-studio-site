const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { gitProvenance } = require('./lib/git_provenance.cjs');
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
const LATEST_MARKDOWN_PATH = path.join(OUTPUT_DIR, 'cantoni-live-drift-latest.md');
const LATEST_JSON_PATH = path.join(OUTPUT_DIR, 'cantoni-live-drift-latest.json');

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

function shortHash(value) {
  return String(value || '').slice(0, 12);
}

function gitProvenanceLines(git) {
  if (!git) return ['- Git provenance unavailable.'];
  return [
    `- Commit: \`${git.short_commit || 'unknown'}\` (${git.commit || 'unknown'})`,
    `- Branch: \`${git.branch || 'unknown'}\``,
    `- Upstream: \`${git.upstream || 'unknown'}\``,
    `- Remote: \`${git.remote_name || 'unknown'}\` / \`${git.remote_url || 'unknown'}\``,
    `- Worktree dirty: ${git.dirty ? 'yes' : 'no'}`
  ];
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

function buildContractDriftPatch(pages) {
  const files = pages
    .filter((page) => page.artifact.required_ok && !page.live.required_ok)
    .map((page) => ({
      page: page.path,
      artifact_file: page.artifact.file,
      live_url: page.live.url,
      final_live_url: page.live.final_url,
      live_status: page.live.status,
      artifact_sha256: page.artifact.sha256,
      live_sha256: page.live.sha256,
      hashes_match: page.hashes_match,
      live_missing_required: page.live.missing_required,
      artifact_satisfies_required: page.artifact.required_ok,
      deploy_should_fix: true
    }));

  return {
    type: 'cloudflare_pages_contract_drift_patch_v1',
    deploy_action: 'deploy_full_cloudflare_pages_artifact',
    full_artifact_required: true,
    partial_upload_safe: false,
    upload_root: '.cloudflare-pages',
    note: 'These are the contract-failing live pages that the current artifact fixes. Deploy the full verified artifact or ZIP, not only this subset.',
    files_count: files.length,
    files
  };
}

function renderMarkdown(payload) {
  const driftRows = payload.pages.map((page) => {
    const deployWillFix = page.artifact.required_ok && !page.live.required_ok;
    return `| \`${page.path}\` | ${page.live.status} | ${page.live.required_ok ? 'yes' : 'no'} | ${page.artifact.required_ok ? 'yes' : 'no'} | ${deployWillFix ? 'yes' : 'no'} | ${page.live.missing_required.map((item) => `\`${item}\``).join('<br>') || ''} |`;
  });
  const patchRows = payload.contract_drift_patch.files.map((item) => (
    `| \`${item.page}\` | \`${item.artifact_file}\` | \`${shortHash(item.artifact_sha256)}\` | \`${shortHash(item.live_sha256)}\` | ${item.live_missing_required.map((snippet) => `\`${snippet}\``).join('<br>')} |`
  ));

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
    '## Git Provenance',
    '',
    ...gitProvenanceLines(payload.git),
    '',
    '## Page Drift',
    '',
    '| Page | Live HTTP | Live contract ok | Artifact contract ok | Deploy should fix | Live missing snippets |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...driftRows,
    '',
    '## Contract Drift Patch',
    '',
    'This is not approval for a partial deploy. It identifies the live contract failures that the current verified artifact resolves; deploy the full Cloudflare Pages artifact or ZIP.',
    '',
    '| Page | Artifact file | Artifact SHA-256 | Live SHA-256 | Live missing snippets |',
    '| --- | --- | --- | --- | --- |',
    ...(patchRows.length ? patchRows : ['| n/a | n/a | n/a | n/a | none |']),
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
  const contractDriftPatch = buildContractDriftPatch(pages);
  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    git: gitProvenance(PROJECT_ROOT),
    base_url: BASE_URL,
    artifact_root: '.cloudflare-pages',
    artifact_contract_ok: artifactContractOk,
    live_contract_ok: liveContractOk,
    deploy_only_drift: deployOnlyDrift,
    contract_drift_patch: contractDriftPatch,
    pages
  };

  const jsonSource = JSON.stringify(payload, null, 2) + '\n';
  const markdownSource = renderMarkdown(payload);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(JSON_PATH, jsonSource),
    fs.writeFile(MARKDOWN_PATH, markdownSource),
    fs.writeFile(LATEST_JSON_PATH, jsonSource),
    fs.writeFile(LATEST_MARKDOWN_PATH, markdownSource)
  ]);

  console.log(JSON.stringify({
    ok: true,
    artifact_contract_ok: artifactContractOk,
    live_contract_ok: liveContractOk,
    deploy_only_drift: deployOnlyDrift,
    contract_drift_patch_files: contractDriftPatch.files_count,
    contract_drift_patch: contractDriftPatch,
    pages_checked: pages.length,
    markdown: MARKDOWN_PATH,
    json: JSON_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
