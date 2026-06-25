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
    const manualPackageManifestPath = operatorPack.steps?.cloudflare_manual_upload?.output?.manifest;
    const manualPackageManifest = manualPackageManifestPath
      ? await readJson(path.join(PROJECT_ROOT, manualPackageManifestPath))
      : null;

    for (const [label, git] of [
      ['launch_handoff', launchHandoff.git],
      ['operator_pack', operatorPack.git],
      ['cloudflare_manual_upload', manualPackageManifest?.git]
    ]) {
      if (!git || typeof git !== 'object') {
        failures.push(`${label}: missing Git provenance`);
        continue;
      }
      for (const field of ['commit', 'short_commit', 'branch', 'upstream', 'remote_name', 'remote_url']) {
        if (!git[field]) failures.push(`${label}: missing Git provenance field ${field}`);
      }
      if (typeof git.dirty !== 'boolean') failures.push(`${label}: Git provenance dirty must be boolean`);
      if (!Number.isInteger(git.status_entries)) failures.push(`${label}: Git provenance status_entries must be an integer`);
    }
    if (launchHandoff.git?.commit && operatorPack.git?.commit && launchHandoff.git.commit !== operatorPack.git.commit) {
      failures.push('operator_pack: Git commit does not match launch handoff');
    }
    if (launchHandoff.git?.commit && manualPackageManifest?.git?.commit && launchHandoff.git.commit !== manualPackageManifest.git.commit) {
      failures.push('cloudflare_manual_upload: Git commit does not match launch handoff');
    }
    if (launchHandoff.git?.upstream && operatorPack.git?.upstream && launchHandoff.git.upstream !== operatorPack.git.upstream) {
      failures.push('operator_pack: Git upstream does not match launch handoff');
    }
    const cloudflareDeployCandidate = operatorPack.cloudflare_deploy_candidate || {};
    if (cloudflareDeployCandidate.type !== 'cloudflare_pages_deploy_candidate_v1') {
      failures.push('operator_pack: missing Cloudflare deploy candidate payload');
    }
    if (cloudflareDeployCandidate.deployment_approval_required !== true || cloudflareDeployCandidate.deploy_allowed_without_approval !== false) {
      failures.push('operator_pack: Cloudflare deploy candidate must require explicit approval');
    }
    if (cloudflareDeployCandidate.package?.zip_path !== operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.path) {
      failures.push('operator_pack: Cloudflare deploy candidate ZIP path does not match manual upload package');
    }
    if (cloudflareDeployCandidate.package?.zip_sha256 !== operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.sha256) {
      failures.push('operator_pack: Cloudflare deploy candidate ZIP SHA-256 does not match manual upload package');
    }
    if (cloudflareDeployCandidate.package?.manifest !== manualPackageManifestPath) {
      failures.push('operator_pack: Cloudflare deploy candidate manifest does not match manual upload package');
    }
    if (cloudflareDeployCandidate.git?.commit && operatorPack.git?.commit && cloudflareDeployCandidate.git.commit !== operatorPack.git.commit) {
      failures.push('operator_pack: Cloudflare deploy candidate Git commit does not match operator pack');
    }
    const readinessGates = operatorPack.readiness?.gates || [];
    const artifactGate = readinessGates.find((gate) => gate.id === 'cloudflare_artifact_contract');
    const gitDeployStateGate = readinessGates.find((gate) => gate.id === 'git_deploy_state');
    const externalUnblockHandoffGate = readinessGates.find((gate) => gate.id === 'external_unblock_handoff');
    if (!artifactGate) {
      failures.push('operator_pack: missing cloudflare_artifact_contract readiness gate');
    } else if (artifactGate.ok !== true) {
      failures.push('operator_pack: cloudflare_artifact_contract readiness gate must pass before handoff');
    } else if (artifactGate.details?.artifact_ok !== true || artifactGate.details?.build_ok !== true) {
      failures.push('operator_pack: cloudflare_artifact_contract must include passing build and artifact details');
    }
    if (!gitDeployStateGate) {
      failures.push('operator_pack: missing git_deploy_state readiness gate');
    } else if (!gitDeployStateGate.details || typeof gitDeployStateGate.details.dirty !== 'boolean') {
      failures.push('operator_pack: git_deploy_state gate must include Git cleanliness details');
    }
    if (!externalUnblockHandoffGate) {
      failures.push('operator_pack: missing external_unblock_handoff readiness gate');
    } else if (externalUnblockHandoffGate.ok !== true) {
      failures.push('operator_pack: external_unblock_handoff gate must pass before handoff');
    } else if (!String(externalUnblockHandoffGate.details?.handoff || '').endsWith('cantoni-external-unblock-handoff-latest.json')) {
      failures.push('operator_pack: external_unblock_handoff gate must point to latest handoff JSON');
    }
    const expectedArtifactReady = artifactGate?.ok === true &&
      artifactGate.details?.artifact_ok === true &&
      artifactGate.details?.build_ok === true &&
      Boolean(operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.path) &&
      Boolean(operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.sha256);
    const expectedGitReady = gitDeployStateGate?.ok === true &&
      operatorPack.git?.dirty === false &&
      operatorPack.git?.ahead === 0 &&
      operatorPack.git?.behind === 0;
    if (cloudflareDeployCandidate.artifact_ready !== expectedArtifactReady) {
      failures.push('operator_pack: Cloudflare deploy candidate artifact_ready does not match artifact gate/package evidence');
    }
    if (cloudflareDeployCandidate.git_ready !== expectedGitReady) {
      failures.push('operator_pack: Cloudflare deploy candidate git_ready does not match Git deploy gate');
    }
    if (!expectedGitReady && !(cloudflareDeployCandidate.execution_blockers || []).includes('git_deploy_state')) {
      failures.push('operator_pack: Cloudflare deploy candidate must explain Git deploy state blocker when Git is not ready');
    }
    const operatorMarkdown = await fs.readFile(files.operatorPack.replace(/\.json$/u, '.md'), 'utf8');
    const launchMarkdown = await fs.readFile(files.launchHandoff.replace(/\.json$/u, '.md'), 'utf8');
    if (!operatorMarkdown.includes('## Verified Passing Gates') || !operatorMarkdown.includes('cloudflare_artifact_contract')) {
      failures.push('operator_pack: Markdown must expose verified passing readiness gates');
    }
    if (!operatorMarkdown.includes('external_unblock_handoff')) {
      failures.push('operator_pack: Markdown must expose external unblock handoff gate');
    }
    if (!operatorMarkdown.includes('npm run audit:git-deploy-state')) {
      failures.push('operator_pack: Markdown must require Git deploy state verification before deploy');
    }
    if (!launchMarkdown.includes('## Verified Passing Gates') || !launchMarkdown.includes('cloudflare_artifact_contract')) {
      failures.push('launch_handoff: Markdown must expose verified passing readiness gates');
    }

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
    for (const key of ['has_cloudflare_api_token', 'has_cloudflare_account_id', 'has_cloudflare_zone_id', 'token_verify_ok', 'pages_read_ok', 'dns_zone_identity_ok', 'dns_read_ok']) {
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
    const driftPatch = liveDrift.contract_drift_patch || {};
    const driftPatchFiles = Array.isArray(driftPatch.files) ? driftPatch.files : [];
    if (liveDrift.deploy_only_drift === true) {
      if (driftPatch.type !== 'cloudflare_pages_contract_drift_patch_v1') {
        failures.push('live_drift: missing contract drift patch payload');
      }
      if (driftPatch.full_artifact_required !== true || driftPatch.partial_upload_safe !== false) {
        failures.push('live_drift: contract drift patch must require full artifact deployment');
      }
      if (!driftPatchFiles.length) {
        failures.push('live_drift: deploy-only drift must list files fixed by the artifact');
      }
      for (const item of driftPatchFiles) {
        if (!item.page || !item.artifact_file || !item.artifact_sha256 || !item.live_sha256) {
          failures.push('live_drift: every patch file must include page, artifact file, and hashes');
        }
        if (item.deploy_should_fix !== true || item.artifact_satisfies_required !== true) {
          failures.push(`live_drift: ${item.page || 'unknown page'} must be marked as fixed by the artifact`);
        }
        if (!Array.isArray(item.live_missing_required) || !item.live_missing_required.length) {
          failures.push(`live_drift: ${item.page || 'unknown page'} must list live missing snippets`);
        }
      }
      if (!operatorMarkdown.includes('## Live Drift Deploy Patch') || !operatorMarkdown.includes('Full artifact required: yes')) {
        failures.push('operator_pack: Markdown must expose the live drift deploy patch and full-artifact rule');
      }
      if (cloudflareDeployCandidate.would_fix_live_contract !== true) {
        failures.push('operator_pack: Cloudflare deploy candidate must mark deploy-only live contract fix');
      }
      if (cloudflareDeployCandidate.live_drift_patch?.full_artifact_required !== true || cloudflareDeployCandidate.live_drift_patch?.partial_upload_safe !== false) {
        failures.push('operator_pack: Cloudflare deploy candidate must preserve full-artifact deploy rule');
      }
      if (cloudflareDeployCandidate.live_drift_patch?.files_count !== driftPatchFiles.length) {
        failures.push('operator_pack: Cloudflare deploy candidate drift file count does not match live drift report');
      }
      const candidatePatchPages = cloudflareDeployCandidate.live_drift_patch?.pages || [];
      for (const item of driftPatchFiles) {
        if (!candidatePatchPages.includes(item.page)) {
          failures.push(`operator_pack: Cloudflare deploy candidate missing drift page ${item.page}`);
        }
      }
      if (!operatorMarkdown.includes('## Cloudflare Deploy Candidate') || !operatorMarkdown.includes('Deploy allowed without approval: no')) {
        failures.push('operator_pack: Markdown must expose the deploy candidate approval boundary');
      }
    }

    const stepOutput = operatorPack.steps?.email_dns_handoff?.output || {};
    await requireReferencedFile(cloudflareDeployCandidate.package?.zip_path, 'operator_pack.deploy_candidate_zip', failures);
    await requireReferencedFile(cloudflareDeployCandidate.package?.manifest, 'operator_pack.deploy_candidate_manifest', failures);
    await requireReferencedFile(operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.path, 'operator_pack.cloudflare_zip', failures);
    await requireReferencedFile(manualPackageManifestPath, 'operator_pack.cloudflare_manifest', failures);
    await requireReferencedFile(operatorPack.steps?.cloudflare_manual_upload?.output?.checksums, 'operator_pack.cloudflare_checksums', failures);
    await requireReferencedFile(operatorPack.steps?.cloudflare_manual_upload?.output?.readme, 'operator_pack.cloudflare_readme', failures);
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
