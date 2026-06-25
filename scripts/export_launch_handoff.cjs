const fs = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');
const { gitProvenance } = require('./lib/git_provenance.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(process.env.LAUNCH_HANDOFF_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/launch-handoff'));
const PACKAGE_DIR = path.resolve(process.env.CLOUDFLARE_UPLOAD_PACKAGE_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/cloudflare-manual-upload'));
const VERSION = process.env.LAUNCH_HANDOFF_VERSION || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

if (!/^[A-Za-z0-9._-]+$/.test(VERSION)) {
  throw new Error('LAUNCH_HANDOFF_VERSION may contain only letters, numbers, dots, underscores and dashes.');
}

const MARKDOWN_PATH = path.join(OUTPUT_DIR, `cantoni-launch-handoff-${VERSION}.md`);
const JSON_PATH = path.join(OUTPUT_DIR, `cantoni-launch-handoff-${VERSION}.json`);

function normalizeRel(value) {
  return value.split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  return normalizeRel(path.relative(PROJECT_ROOT, filePath));
}

function runJson(command, args) {
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    shell: false
  });

  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  let parsed = null;

  try {
    parsed = stdout ? JSON.parse(stdout) : null;
  } catch (error) {
    throw new Error(`${[command, ...args].join(' ')} did not return JSON: ${error.message}`);
  }

  return {
    command: [command, ...args].join(' '),
    status: result.status,
    signal: result.signal || null,
    error: result.error ? result.error.message : null,
    stderr,
    parsed
  };
}

async function findLatestManualPackage() {
  try {
    const entries = await fs.readdir(PACKAGE_DIR, { withFileTypes: true });
    const manifests = entries
      .filter((entry) => entry.isFile() && /\.manifest\.json$/u.test(entry.name))
      .map((entry) => path.join(PACKAGE_DIR, entry.name))
      .sort()
      .reverse();

    if (!manifests.length) return null;
    const manifestPath = manifests[0];
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const zipPath = manifest.zip?.path
      ? path.resolve(PROJECT_ROOT, manifest.zip.path)
      : null;

    return {
      manifest: relativeToRoot(manifestPath),
      zip: zipPath ? relativeToRoot(zipPath) : null,
      checksum: manifest.zip?.sha256 || null,
      zip_bytes: manifest.zip?.bytes || null,
      files_count: manifest.files_count || null,
      generated_at: manifest.generated_at || null
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

function failureLines(items) {
  if (!Array.isArray(items) || items.length === 0) return ['- none'];
  return items.flatMap((item) => {
    const failures = Array.isArray(item.failures) ? item.failures : [];
    if (!failures.length) return [`- ${item.id}: ${item.label || 'Gate failed'}`];
    return failures.map((failure) => `- ${item.id} / ${failure.id}: ${failure.reason}`);
  });
}

function dnsRecordTable(records) {
  if (!Array.isArray(records) || !records.length) return ['No DNS recommendation payload was available.'];
  return [
    '| Type | Name | Priority | Value |',
    '| --- | --- | ---: | --- |',
    ...records.map((record) => {
      const priority = record.priority === undefined ? '' : String(record.priority);
      const value = String(record.value || '').replace(/\|/g, '\\|');
      return `| ${record.type || ''} | ${record.name || ''} | ${priority} | \`${value}\` |`;
    })
  ];
}

function cloudflareAuthSummary(readiness) {
  const gate = (readiness.gates || []).find((item) => item.id === 'cloudflare_pages_deploy_auth');
  const details = gate?.details || {};
  return {
    ok: gate?.ok === true,
    diagnostic_code: details.diagnostic_code || null,
    next_actions: details.next_actions || [],
    project_name: details.project_name || null,
    project_listed: details.project_listed === true,
    has_cloudflare_account_id: details.has_cloudflare_account_id === true,
    whoami_status: details.whoami_status ?? null,
    pages_project_list_status: details.pages_project_list_status ?? null
  };
}

function cloudflareApiSummary(readiness) {
  const gate = (readiness.gates || []).find((item) => item.id === 'cloudflare_dns_api_credentials') ||
    (readiness.gates || []).find((item) => item.id === 'cloudflare_api_credentials');
  const details = gate?.details || {};
  return {
    ok: gate?.ok === true,
    gate_id: gate?.id || null,
    project_name: details.project_name || null,
    domain: details.domain || null,
    scope: details.scope || null,
    has_cloudflare_api_token: details.has_cloudflare_api_token === true,
    has_cloudflare_account_id: details.has_cloudflare_account_id === true,
    has_cloudflare_zone_id: details.has_cloudflare_zone_id === true,
    token_verify_ok: details.token_verify_ok === true,
    pages_read_ok: details.pages_read_ok === true,
    dns_read_ok: details.dns_read_ok === true,
    next_actions: details.next_actions || []
  };
}

function cloudflareDiagnosticLines(cloudflareAuth) {
  if (!cloudflareAuth || cloudflareAuth.ok) return ['- Cloudflare Pages auth: ok'];
  return [
    `- Diagnostic: \`${cloudflareAuth.diagnostic_code || 'unknown'}\``,
    `- Project: \`${cloudflareAuth.project_name || 'unknown'}\``,
    `- Project listed: ${cloudflareAuth.project_listed ? 'yes' : 'no'}`,
    `- CLOUDFLARE_ACCOUNT_ID set: ${cloudflareAuth.has_cloudflare_account_id ? 'yes' : 'no'}`,
    `- whoami status: ${cloudflareAuth.whoami_status ?? 'unknown'}`,
    `- pages project list status: ${cloudflareAuth.pages_project_list_status ?? 'unknown'}`,
    '',
    'Next auth actions:',
    ...((cloudflareAuth.next_actions || []).map((action, index) => `${index + 1}. ${action}`))
  ];
}

function cloudflareApiDiagnosticLines(cloudflareApi) {
  if (!cloudflareApi || cloudflareApi.ok) return ['- Cloudflare DNS API credentials: ok'];
  return [
    `- Project: \`${cloudflareApi.project_name || 'unknown'}\``,
    `- Domain: \`${cloudflareApi.domain || 'unknown'}\``,
    `- Scope: \`${cloudflareApi.scope || 'unknown'}\``,
    `- CLOUDFLARE_API_TOKEN set: ${cloudflareApi.has_cloudflare_api_token ? 'yes' : 'no'}`,
    `- CLOUDFLARE_ACCOUNT_ID set: ${cloudflareApi.has_cloudflare_account_id ? 'yes' : 'no'}`,
    `- CLOUDFLARE_ZONE_ID set: ${cloudflareApi.has_cloudflare_zone_id ? 'yes' : 'no'}`,
    `- Token verify: ${cloudflareApi.token_verify_ok ? 'ok' : 'not ok'}`,
    `- Pages read: ${cloudflareApi.pages_read_ok ? 'ok' : 'not ok'}`,
    `- DNS read: ${cloudflareApi.dns_read_ok ? 'ok' : 'not ok'}`,
    '',
    'Next API actions:',
    ...((cloudflareApi.next_actions || []).map((action, index) => `${index + 1}. ${action}`))
  ];
}

function gitProvenanceLines(git) {
  if (!git) return ['- No Git provenance payload was available.'];
  return [
    `- Commit: \`${git.short_commit || 'unknown'}\``,
    `- Branch: \`${git.branch || 'unknown'}\``,
    `- Upstream: \`${git.upstream || 'unknown'}\``,
    `- Remote: \`${git.remote_url || 'unknown'}\``,
    `- Ahead/behind: ${git.ahead ?? 'unknown'}/${git.behind ?? 'unknown'}`,
    `- Dirty worktree at generation: ${git.dirty ? 'yes' : 'no'}`
  ];
}

function renderMarkdown({ readiness, emailDns, latestPackage, cloudflareAuth, cloudflareApi, git }) {
  const blockers = readiness.blockers || [];
  const holds = readiness.holds || [];
  const packageLines = latestPackage
    ? [
        `- ZIP: \`${latestPackage.zip}\``,
        `- Manifest: \`${latestPackage.manifest}\``,
        `- SHA-256: \`${latestPackage.checksum}\``,
        `- Files: ${latestPackage.files_count || 'unknown'}`,
        `- Generated: ${latestPackage.generated_at || 'unknown'}`
      ]
    : [
        '- No manual upload package found.',
        '- Run `npm run build:cloudflare-upload-package` before a dashboard handoff.'
      ];

  return [
    '# Cantoni Launch Handoff',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Readiness ok: ${readiness.ok === true ? 'yes' : 'no'}`,
    '',
    '## Current Blockers',
    '',
    ...failureLines(blockers),
    '',
    '## Current Holds',
    '',
    ...failureLines(holds),
    '',
    '## Git Provenance',
    '',
    ...gitProvenanceLines(git),
    '',
    '## Cloudflare Package',
    '',
    ...packageLines,
    '',
    'Rules:',
    '- Do not upload the repository root.',
    '- Upload only the generated Cloudflare Pages artifact ZIP/folder.',
    '- Do not deploy production without explicit approval.',
    '- Use only Cantoni Digital Studio account/session for Cloudflare operations.',
    '',
    'Next Cloudflare steps:',
    '1. Fix Cloudflare Pages auth for the Cantoni account, or provide direct token credentials for the same account.',
    '2. Run `npm run audit:cloudflare-auth` for the OAuth path, or `node scripts/verify_cloudflare_api_credentials.mjs --pages-only` for the token path.',
    '3. If using the token path, deploy only with `npm run deploy:cloudflare:direct` after explicit deploy approval.',
    '4. If using dashboard handoff, use the verified ZIP above only when the Pages project supports that upload path.',
    '5. After any upload/deploy, run `npm run test:live-site` and `npm run audit:launch-readiness`.',
    '',
    '## Cloudflare Auth Diagnostic',
    '',
    ...cloudflareDiagnosticLines(cloudflareAuth),
    '',
    '## Cloudflare DNS API Credential Diagnostic',
    '',
    ...cloudflareApiDiagnosticLines(cloudflareApi),
    '',
    '## Email DNS Records',
    '',
    ...dnsRecordTable(emailDns.recommended_records),
    '',
    'DNS rules:',
    '- Create Google Workspace users/aliases before switching MX.',
    '- Generate Google DKIM in Google Admin; do not invent the DKIM TXT value.',
    '- Keep exactly one SPF TXT record at `@`; merge other senders into that one record if needed.',
    '- Run `npm run export:email-dns-handoff` when a Cloudflare-ready CSV handoff is needed.',
    '- Keep outbound paused until `npm run audit:email-dns` is green and the send batch is explicitly approved.',
    '',
    '## Live Drift',
    '',
    'The source/artifact is ahead of production until the verified artifact is deployed.',
    'Run `npm run export:live-drift` to generate a live-vs-artifact evidence report before deploy.',
    'Run `npm run test:live-site` after deployment; it must pass before treating the live site as current.',
    '',
    '## Verification Commands',
    '',
    '```bash',
    'npm run build:cloudflare-upload-package',
    'npm run export:email-dns-handoff',
    'npm run export:live-drift',
    'npm run test:full',
    'npm run audit:cloudflare-auth',
    'npm run audit:cloudflare-api',
    'node scripts/verify_cloudflare_api_credentials.mjs --pages-only',
    'node scripts/verify_cloudflare_api_credentials.mjs --dns-only',
    'npm run deploy:cloudflare:direct',
    'npm run audit:email-dns',
    'npm run test:live-site',
    'npm run audit:launch-readiness',
    '```',
    ''
  ].join('\n');
}

async function main() {
  const readinessRun = runJson(process.execPath, ['scripts/verify_launch_readiness.mjs', '--allow-blocked']);
  const emailDnsRun = runJson(process.execPath, ['sales-kit/scripts/verify_cantoni_email_dns.mjs', '--allow-missing']);

  const readiness = readinessRun.parsed;
  const emailDns = emailDnsRun.parsed;
  const latestPackage = await findLatestManualPackage();
  const cloudflareAuth = cloudflareAuthSummary(readiness);
  const cloudflareApi = cloudflareApiSummary(readiness);

  const payload = {
    ok: readiness.ok === true,
    generated_at: new Date().toISOString(),
    git: gitProvenance(PROJECT_ROOT),
    readiness: {
      ok: readiness.ok === true,
      checked_at: readiness.checked_at,
      gates: readiness.gates || [],
      blockers: readiness.blockers || [],
      holds: readiness.holds || []
    },
    cloudflare_auth: cloudflareAuth,
    cloudflare_api: cloudflareApi,
    latest_cloudflare_manual_package: latestPackage,
    email_dns: {
      ok: emailDns.ok === true,
      checked_at: emailDns.checked_at,
      recommended_records: emailDns.recommended_records || [],
      failures: emailDns.failures || []
    }
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, JSON.stringify(payload, null, 2) + '\n');
  await fs.writeFile(MARKDOWN_PATH, renderMarkdown({
    readiness: payload.readiness,
    emailDns: payload.email_dns,
    latestPackage,
    cloudflareAuth,
    cloudflareApi,
    git: payload.git
  }));

  console.log(JSON.stringify({
    ok: true,
    readiness_ok: payload.readiness.ok,
    blocker_count: payload.readiness.blockers.length,
    hold_count: payload.readiness.holds.length,
    latest_cloudflare_manual_package: latestPackage,
    markdown: MARKDOWN_PATH,
    json: JSON_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
