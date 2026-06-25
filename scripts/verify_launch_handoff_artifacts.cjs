const fs = require('fs/promises');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const GENERATED_ROOT = path.join(PROJECT_ROOT, 'sales-kit/generated');

const FILE_PATTERNS = {
  launchHandoff: /^cantoni-launch-handoff-.+\.json$/,
  operatorPack: /^cantoni-launch-operator-pack-.+\.json$/,
  emailDns: /^cantoni-email-dns-handoff-.+\.json$/,
  emailDnsApi: /^cantoni-email-dns-handoff-.+\.cloudflare-api-records\.json$/,
  liveDrift: /^cantoni-live-drift-.+\.json$/
};

const LEAK_RULES = [
  { id: 'absolute_volumes_path', pattern: /\/Volumes\// },
  { id: 'absolute_users_path', pattern: /\/Users\// },
  { id: 'bearer_token', pattern: /Bearer\s+[A-Za-z0-9._~+/-]+=*/i },
  { id: 'api_key_assignment', pattern: /api[-_ ]?key\s*[:=]\s*[A-Za-z0-9._~+/-]{16,}/i },
  { id: 'password_assignment', pattern: /password\s*[:=]\s*[^,\n}]{8,}/i },
  { id: 'otp_assignment', pattern: /\botp\s*[:=]\s*[^,\n}]{4,}/i },
  { id: 'passkey_assignment', pattern: /passkey\s*[:=]\s*[^,\n}]{8,}/i }
];

function normalizeRel(value) {
  return value.split(path.sep).join('/');
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function latestFile(dir, pattern) {
  const fullDir = path.join(GENERATED_ROOT, dir);
  const entries = await fs.readdir(fullDir, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => path.join(fullDir, entry.name))
    .sort()
    .reverse();

  return matches[0] || null;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function scanLeaks(filePath, failures) {
  const source = await fs.readFile(filePath, 'utf8');
  const rel = normalizeRel(path.relative(PROJECT_ROOT, filePath));
  for (const rule of LEAK_RULES) {
    if (rule.pattern.test(source)) failures.push(`${rel}: ${rule.id}`);
  }
}

function requireRelativePath(file, label, failures) {
  if (!file || typeof file !== 'string') {
    failures.push(`${label}: missing path`);
    return;
  }
  if (path.isAbsolute(file) || file.includes('/Volumes/') || file.includes('/Users/')) {
    failures.push(`${label}: path must be repo-relative`);
  }
}

async function requireReferencedFile(relPath, label, failures) {
  requireRelativePath(relPath, label, failures);
  if (relPath && !await pathExists(path.join(PROJECT_ROOT, relPath))) {
    failures.push(`${label}: referenced file does not exist (${relPath})`);
  }
}

async function main() {
  const failures = [];
  const files = {
    launchHandoff: await latestFile('launch-handoff', FILE_PATTERNS.launchHandoff),
    operatorPack: await latestFile('launch-operator-pack', FILE_PATTERNS.operatorPack),
    emailDns: await latestFile('email-dns-handoff', FILE_PATTERNS.emailDns),
    emailDnsApi: await latestFile('email-dns-handoff', FILE_PATTERNS.emailDnsApi),
    liveDrift: await latestFile('live-drift', FILE_PATTERNS.liveDrift)
  };

  for (const [key, filePath] of Object.entries(files)) {
    if (!filePath) failures.push(`${key}: no generated artifact found`);
  }

  if (!failures.length) {
    const [launchHandoff, operatorPack, emailDns, emailDnsApi, liveDrift] = await Promise.all([
      readJson(files.launchHandoff),
      readJson(files.operatorPack),
      readJson(files.emailDns),
      readJson(files.emailDnsApi),
      readJson(files.liveDrift)
    ]);

    const cloudflareAuth = launchHandoff.cloudflare_auth || {};
    const cloudflareAuthOk = cloudflareAuth.ok === true;
    if (!cloudflareAuthOk && cloudflareAuth.diagnostic_code !== 'pages_api_authentication_error_10000') {
      failures.push('launch_handoff: missing actionable Cloudflare auth diagnostic');
    }
    if (!cloudflareAuthOk && (!Array.isArray(cloudflareAuth.next_actions) || cloudflareAuth.next_actions.length === 0)) {
      failures.push('launch_handoff: missing Cloudflare next_actions');
    }
    if ((operatorPack.cloudflare_auth?.ok === true) !== cloudflareAuthOk) {
      failures.push('operator_pack: Cloudflare auth ok state does not match launch handoff');
    }
    if (!cloudflareAuthOk && operatorPack.cloudflare_auth?.diagnostic_code !== cloudflareAuth.diagnostic_code) {
      failures.push('operator_pack: Cloudflare diagnostic does not match launch handoff');
    }

    const cloudflareApi = launchHandoff.cloudflare_api || {};
    const operatorCloudflareApi = operatorPack.cloudflare_api || {};
    if (typeof cloudflareApi.ok !== 'boolean') {
      failures.push('launch_handoff: missing Cloudflare direct API diagnostic');
    }
    if ((operatorCloudflareApi.ok === true) !== (cloudflareApi.ok === true)) {
      failures.push('operator_pack: Cloudflare direct API ok state does not match launch handoff');
    }
    for (const key of ['has_cloudflare_api_token', 'has_cloudflare_account_id', 'has_cloudflare_zone_id', 'token_verify_ok', 'pages_read_ok', 'dns_read_ok']) {
      if ((operatorCloudflareApi[key] === true) !== (cloudflareApi[key] === true)) {
        failures.push(`operator_pack: Cloudflare direct API ${key} state does not match launch handoff`);
      }
    }
    if (cloudflareApi.ok !== true && (!Array.isArray(cloudflareApi.next_actions) || cloudflareApi.next_actions.length === 0)) {
      failures.push('launch_handoff: missing Cloudflare direct API next_actions');
    }

    const apiRecords = emailDnsApi.records || [];
    const skippedRecords = emailDnsApi.skipped_records || [];
    if (apiRecords.some((record) => record.id === 'google_dkim')) {
      failures.push('email_dns_api: google_dkim must not be included before Google Admin value exists');
    }
    if (!skippedRecords.some((record) => record.id === 'google_dkim' && record.reason === 'manual_value_required')) {
      failures.push('email_dns_api: google_dkim must be listed as skipped manual record');
    }
    if (JSON.stringify(apiRecords).includes('<paste the DKIM TXT value')) {
      failures.push('email_dns_api: DKIM placeholder leaked into API payload');
    }
    if ((emailDns.cloudflare_api_payload || {}).records_count !== apiRecords.length) {
      failures.push('email_dns: API records_count does not match API payload');
    }

    const dnsPlanStep = operatorPack.steps?.email_dns_cloudflare_plan || {};
    const dnsPlan = dnsPlanStep.output || {};
    const dnsPlanActions = Array.isArray(dnsPlan.actions) ? dnsPlan.actions : [];
    if (!dnsPlanStep.command || !dnsPlanStep.command.includes('scripts/sync_cloudflare_email_dns.cjs --dry-run')) {
      failures.push('operator_pack: missing Cloudflare email DNS plan command');
    }
    if (dnsPlan.mode !== 'dry_run') {
      failures.push('operator_pack: Cloudflare email DNS plan must be dry_run');
    }
    if (!Array.isArray(dnsPlan.skipped_records) || !dnsPlan.skipped_records.some((record) => record.id === 'google_dkim' && record.reason === 'manual_value_required')) {
      failures.push('operator_pack: Cloudflare DNS plan must keep google_dkim skipped as manual');
    }
    if (JSON.stringify(dnsPlanActions).includes('google_dkim') || JSON.stringify(dnsPlanActions).includes('google._domainkey')) {
      failures.push('operator_pack: Cloudflare DNS plan must not include DKIM in apply actions');
    }
    if (dnsPlan.source === 'no_credentials') {
      if (dnsPlan.ready_to_apply !== false) {
        failures.push('operator_pack: no-credentials DNS plan must not be ready to apply');
      }
      if (!dnsPlanActions.length || !dnsPlanActions.every((action) => action.action === 'cloudflare_lookup_required')) {
        failures.push('operator_pack: no-credentials DNS plan must require Cloudflare lookup for all records');
      }
    } else if (dnsPlan.source === 'cloudflare_api') {
      if (dnsPlan.cloudflare?.token_present !== true || dnsPlan.cloudflare?.zone_id_present !== true) {
        failures.push('operator_pack: Cloudflare DNS API source must report token and zone id presence only');
      }
    } else if (dnsPlan.source !== 'fixture') {
      failures.push('operator_pack: unsupported Cloudflare DNS plan source');
    }

    if (liveDrift.artifact_contract_ok !== true) {
      failures.push('live_drift: artifact must be contract-ready');
    }
    if (liveDrift.live_contract_ok !== true && liveDrift.deploy_only_drift !== true) {
      failures.push('live_drift: production must either be contract-ready or have deploy-only drift evidence');
    }

    const stepOutput = operatorPack.steps?.email_dns_handoff?.output || {};
    await requireReferencedFile(stepOutput.cloudflare_api_json, 'operator_pack.email_dns_api_json', failures);
    await requireReferencedFile(operatorPack.steps?.launch_handoff?.output?.json, 'operator_pack.launch_handoff_json', failures);
    await requireReferencedFile(operatorPack.steps?.live_drift?.output?.json, 'operator_pack.live_drift_json', failures);
  }

  for (const filePath of Object.values(files).filter(Boolean)) {
    await scanLeaks(filePath, failures);
  }

  const report = {
    ok: failures.length === 0,
    checked: Object.fromEntries(Object.entries(files).map(([key, filePath]) => [
      key,
      filePath ? normalizeRel(path.relative(PROJECT_ROOT, filePath)) : null
    ])),
    failures
  };

  console.log(JSON.stringify(report, null, 2));

  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
