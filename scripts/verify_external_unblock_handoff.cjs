#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { gitProvenance } = require('./lib/git_provenance.cjs');
const { pushLeakFailures } = require('./lib/artifact_leak_scan.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(process.env.EXTERNAL_UNBLOCK_HANDOFF_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/external-unblock-handoff'));
const HANDOFF_PATTERN = /^cantoni-external-unblock-handoff-.+\.json$/u;
const TIMESTAMPED_HANDOFF_PATTERN = /^cantoni-external-unblock-handoff-(?!latest\b).+\.json$/u;
const LATEST_JSON_PATH = path.join(OUTPUT_DIR, 'cantoni-external-unblock-handoff-latest.json');
const LATEST_MARKDOWN_PATH = path.join(OUTPUT_DIR, 'cantoni-external-unblock-handoff-latest.md');
const REQUIRED_TASKS = [
  'cloudflare_pages_auth',
  'cloudflare_pages_deploy',
  'cloudflare_dns_api_credentials',
  'google_workspace_email_dns',
  'payment_branding_review',
  'post_unblock_checks'
];

function normalizeRel(value) {
  return String(value || '').split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(PROJECT_ROOT + path.sep)) return normalizeRel(filePath);
  return normalizeRel(path.relative(PROJECT_ROOT, resolved));
}

function resolveRepoPath(relPath) {
  if (!relPath || typeof relPath !== 'string' || path.isAbsolute(relPath)) return null;
  const resolved = path.resolve(PROJECT_ROOT, relPath);
  if (!resolved.startsWith(PROJECT_ROOT + path.sep)) return null;
  return resolved;
}

async function latestHandoffPath() {
  try {
    await fs.access(LATEST_JSON_PATH);
    return LATEST_JSON_PATH;
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error;
  }

  const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isFile() && HANDOFF_PATTERN.test(entry.name))
    .map((entry) => path.join(OUTPUT_DIR, entry.name))
    .sort()
    .reverse();
  return matches[0] || null;
}

async function latestTimestampedHandoffPath() {
  const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isFile() && TIMESTAMPED_HANDOFF_PATTERN.test(entry.name))
    .map((entry) => path.join(OUTPUT_DIR, entry.name))
    .sort()
    .reverse();
  return matches[0] || null;
}

async function sha256File(filePath) {
  return crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function scanLeaks(source, label, failures) {
  pushLeakFailures(source, label, failures);
}

function taskById(payload, id) {
  return (payload.external_tasks || []).find((task) => task.id === id) || null;
}

function idsFromDetails(details) {
  return (Array.isArray(details) ? details : []).map((item) => item.id);
}

function assertGateDetails({ ids, details, label, failures }) {
  if (!Array.isArray(ids)) {
    failures.push(`${label} IDs must be an array.`);
    return;
  }
  if (!Array.isArray(details)) {
    failures.push(`${label} details must be an array.`);
    return;
  }
  const detailIds = idsFromDetails(details);
  if (details.length !== ids.length) failures.push(`${label} details count must match IDs count.`);
  for (const id of ids) {
    const detail = details.find((item) => item.id === id);
    if (!detail) {
      failures.push(`${label} details missing ${id}.`);
      continue;
    }
    if (!detail.label) failures.push(`${label} detail ${id} must include a label.`);
    if (!detail.category) failures.push(`${label} detail ${id} must include a category.`);
    if (!detail.severity) failures.push(`${label} detail ${id} must include a severity.`);
    if (!Number.isInteger(detail.failure_count)) failures.push(`${label} detail ${id} must include integer failure_count.`);
    if (!Array.isArray(detail.failures)) failures.push(`${label} detail ${id} must include failures array.`);
    if (Array.isArray(detail.failures) && detail.failure_count !== detail.failures.length) {
      failures.push(`${label} detail ${id} failure_count must match failures length.`);
    }
  }
  for (const id of detailIds) {
    if (!ids.includes(id)) failures.push(`${label} details include unexpected ${id}.`);
  }
}

async function main() {
  const failures = [];
  const handoffPath = await latestHandoffPath().catch((error) => {
    failures.push(`Unable to read external unblock handoff directory: ${error.message}`);
    return null;
  });

  let payload = null;
  if (!handoffPath) {
    failures.push('No external unblock handoff JSON found. Run npm run export:external-unblock-handoff first.');
  } else {
    payload = await readJson(handoffPath);
  }

  if (payload?.type !== 'cantoni_external_unblock_handoff_v1') {
    failures.push('External unblock handoff type must be cantoni_external_unblock_handoff_v1.');
  }
  if (!payload?.source_operator_pack) failures.push('External unblock handoff must reference a source operator pack.');
  if (!payload?.source_commit) failures.push('External unblock handoff must expose top-level source_commit.');
  if (!payload?.source_short_commit) failures.push('External unblock handoff must expose top-level source_short_commit.');
  if (payload?.account_boundary?.brand !== 'Cantoni Digital Studio') failures.push('Account boundary must be Cantoni Digital Studio.');
  if (payload?.account_boundary?.git_remote !== 'cantoni') failures.push('Account boundary must require git remote cantoni.');
  if (payload?.account_boundary?.operating_email !== 'cantonidigitalstudio@gmail.com') failures.push('Account boundary must use official Cantoni operating email.');
  if (!payload?.deploy_candidate_status) failures.push('External unblock handoff must expose top-level deploy_candidate_status.');
  if (payload?.deploy_candidate_status !== payload?.deploy_candidate?.status) {
    failures.push('External unblock handoff top-level deploy_candidate_status must match deploy_candidate.status.');
  }

  const currentGit = gitProvenance(PROJECT_ROOT);
  if (payload?.git?.current?.commit !== currentGit.commit) failures.push('External unblock handoff current Git commit does not match HEAD.');
  if (payload?.git?.current?.upstream !== currentGit.upstream) failures.push('External unblock handoff current Git upstream does not match repository state.');

  const operatorPackPath = resolveRepoPath(payload?.source_operator_pack);
  let operatorPack = null;
  if (!operatorPackPath) {
    failures.push('Source operator pack path must be repo-relative.');
  } else {
    try {
      operatorPack = await readJson(operatorPackPath);
      if (operatorPack.git?.commit !== payload.git?.operator_pack?.commit) failures.push('Source operator pack commit does not match handoff payload.');
      if (operatorPack.git?.commit !== payload.source_commit) failures.push('Source operator pack commit does not match top-level source_commit.');
      if (operatorPack.git?.short_commit !== payload.source_short_commit) failures.push('Source operator pack short commit does not match top-level source_short_commit.');
      if (operatorPack.cloudflare_deploy_candidate?.package?.zip_sha256 !== payload.deploy_candidate?.package?.zip_sha256) {
        failures.push('Source operator pack ZIP SHA-256 does not match handoff deploy candidate.');
      }
      if (operatorPack.cloudflare_deploy_candidate?.status !== payload.deploy_candidate_status) {
        failures.push('Source operator pack deploy candidate status does not match handoff payload.');
      }
    } catch (error) {
      failures.push(`Unable to read source operator pack: ${error.message}`);
    }
  }

  assertGateDetails({
    ids: payload?.current_blockers,
    details: payload?.current_blocker_details,
    label: 'Current blocker',
    failures
  });
  assertGateDetails({
    ids: payload?.current_hold_ids,
    details: payload?.current_hold_details,
    label: 'Current hold',
    failures
  });
  if (!Array.isArray(payload?.current_holds)) {
    failures.push('Current holds must be exposed as current_holds array.');
  }
  if (JSON.stringify(payload?.current_holds || []) !== JSON.stringify(payload?.current_hold_ids || [])) {
    failures.push('Current holds must match current_hold_ids compatibility alias.');
  }
  if (operatorPack) {
    const operatorBlockerIds = (operatorPack.readiness?.blockers || []).map((blocker) => blocker.id);
    const operatorHoldIds = (operatorPack.readiness?.holds || []).map((hold) => hold.id);
    const operatorGates = Array.isArray(operatorPack.readiness?.gates) ? operatorPack.readiness.gates : [];
    if (JSON.stringify(payload?.current_blockers || []) !== JSON.stringify(operatorBlockerIds)) {
      failures.push('Current blockers must match source operator pack blockers.');
    }
    if (JSON.stringify(payload?.current_hold_ids || []) !== JSON.stringify(operatorHoldIds)) {
      failures.push('Current holds must match source operator pack holds.');
    }
    if (JSON.stringify(payload?.current_holds || []) !== JSON.stringify(operatorHoldIds)) {
      failures.push('Current holds array must match source operator pack holds.');
    }
    for (const detail of [
      ...(payload?.current_blocker_details || []),
      ...(payload?.current_hold_details || [])
    ]) {
      const gate = operatorGates.find((item) => item.id === detail.id);
      if (!gate) {
        failures.push(`Current gate detail ${detail.id || 'unknown'} must match a source operator pack gate.`);
        continue;
      }
      if (detail.label !== gate.label) failures.push(`Current gate detail ${detail.id} label must match source operator pack gate.`);
      if (detail.category !== gate.category) failures.push(`Current gate detail ${detail.id} category must match source operator pack gate.`);
      if (detail.severity !== gate.severity) failures.push(`Current gate detail ${detail.id} severity must match source operator pack gate.`);
      if (detail.failure_count !== (Array.isArray(gate.failures) ? gate.failures.length : 0)) {
        failures.push(`Current gate detail ${detail.id} failure_count must match source operator pack gate failures.`);
      }
    }
  }

  const zipPath = resolveRepoPath(payload?.deploy_candidate?.package?.zip_path);
  const manifestPath = resolveRepoPath(payload?.deploy_candidate?.package?.manifest);
  const checksumsPath = resolveRepoPath(payload?.deploy_candidate?.package?.checksums);
  const readmePath = resolveRepoPath(payload?.deploy_candidate?.package?.readme);
  if (!zipPath) failures.push('Deploy candidate ZIP path must be repo-relative.');
  else {
    try {
      const actualHash = await sha256File(zipPath);
      if (actualHash !== payload.deploy_candidate.package.zip_sha256) failures.push('Deploy candidate ZIP SHA-256 does not match handoff payload.');
      if (payload.deploy_candidate.zip_sha256_verified && payload.deploy_candidate.zip_sha256_verified !== actualHash) {
        failures.push('Deploy candidate verified ZIP SHA-256 does not match actual ZIP.');
      }
      const actualStats = await fs.stat(zipPath);
      if (!Number.isInteger(payload.deploy_candidate.package.zip_bytes) || payload.deploy_candidate.package.zip_bytes <= 0) {
        failures.push('Deploy candidate ZIP byte size is missing from handoff payload.');
      } else if (actualStats.size !== payload.deploy_candidate.package.zip_bytes) {
        failures.push('Deploy candidate ZIP byte size does not match actual ZIP.');
      }
    } catch (error) {
      failures.push(`Unable to read deploy candidate ZIP: ${error.message}`);
    }
  }
  if (!manifestPath) failures.push('Deploy candidate manifest path must be repo-relative.');
  else {
    try {
      const manifest = await readJson(manifestPath);
      if (manifest.contract_coverage?.type !== 'cloudflare_pages_live_site_contract_coverage_v1') {
        failures.push('Deploy candidate manifest must expose live-site contract coverage.');
      }
      if (manifest.contract_coverage?.full_artifact_required !== true || manifest.contract_coverage?.partial_upload_safe !== false) {
        failures.push('Deploy candidate manifest contract coverage must require full artifact deployment.');
      }
      if (manifest.zip?.bytes !== payload.deploy_candidate.package.zip_bytes) {
        failures.push('Deploy candidate manifest ZIP byte size does not match handoff payload.');
      }
    } catch (error) {
      failures.push(`Unable to read deploy candidate manifest: ${error.message}`);
    }
  }
  if (!checksumsPath) failures.push('Deploy candidate checksums path must be repo-relative.');
  else {
    try {
      await fs.access(checksumsPath);
    } catch (error) {
      failures.push(`Unable to read deploy candidate checksums: ${error.message}`);
    }
  }
  if (!readmePath) failures.push('Deploy candidate README path must be repo-relative.');
  else {
    try {
      const readme = await fs.readFile(readmePath, 'utf8');
      for (const requiredReadmeText of [
        `Git full commit: ${payload.source_commit}`,
        'Production live-site contract coverage in this ZIP',
        'Full artifact required: yes',
        'Partial upload safe: no',
        'Do not upload only these files',
        'CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production',
        `ZIP SHA-256: ${payload.deploy_candidate.package.zip_sha256}`,
        `ZIP bytes: ${payload.deploy_candidate.package.zip_bytes}`,
        'npm run test:cloudflare-deploy-candidate'
      ]) {
        if (!readme.includes(requiredReadmeText)) {
          failures.push(`Deploy candidate README missing contract coverage text: ${requiredReadmeText}`);
        }
      }
    } catch (error) {
      failures.push(`Unable to read deploy candidate README: ${error.message}`);
    }
  }

  for (const id of REQUIRED_TASKS) {
    if (!taskById(payload || {}, id)) failures.push(`External unblock handoff missing task ${id}.`);
  }

  const pagesAuth = taskById(payload || {}, 'cloudflare_pages_auth');
  const deploy = taskById(payload || {}, 'cloudflare_pages_deploy');
  const dnsApi = taskById(payload || {}, 'cloudflare_dns_api_credentials');
  const emailDns = taskById(payload || {}, 'google_workspace_email_dns');
  const paymentBranding = taskById(payload || {}, 'payment_branding_review');
  const postChecks = taskById(payload || {}, 'post_unblock_checks');

  if (!pagesAuth?.required_environment_names?.includes('CLOUDFLARE_API_TOKEN')) failures.push('Pages auth task must name CLOUDFLARE_API_TOKEN.');
  if (!pagesAuth?.required_environment_names?.includes('CLOUDFLARE_ACCOUNT_ID')) failures.push('Pages auth task must name CLOUDFLARE_ACCOUNT_ID.');
  if (!deploy?.approval_tokens_required?.some((item) => item.includes('deploy-cantoni-pages-direct'))) failures.push('Deploy task must require direct deploy approval token.');
  if (!deploy?.approval_tokens_required?.some((item) => item.includes('deploy-cantoni-production'))) failures.push('Deploy task must preserve separate production approval.');
  if (deploy?.approved_candidate_package?.readme !== payload?.deploy_candidate?.package?.readme) failures.push('Deploy task README path must match deploy candidate package README.');
  if (deploy?.approved_candidate_package?.checksums !== payload?.deploy_candidate?.package?.checksums) failures.push('Deploy task checksums path must match deploy candidate package checksums.');
  if (deploy?.branch_policy?.default_direct_deploy_branch !== 'preview-cantoni-site') failures.push('Deploy task must document preview-cantoni-site as the default direct branch.');
  if (deploy?.branch_policy?.production_branch !== 'main') failures.push('Deploy task must document main as the production branch.');
  if (deploy?.branch_policy?.preview_deploy_clears_live_site_contract !== false) failures.push('Deploy task must state that preview deploys do not clear the production live-site contract.');
  if (deploy?.branch_policy?.live_site_contract_fix_requires_production_branch !== true) failures.push('Deploy task must state that live-site contract fix requires production branch.');
  if (!deploy?.verification_commands_before_mutation?.includes('npm run audit:cloudflare-deploy-candidate')) {
    failures.push('Deploy task must require execution-ready candidate verification before mutation.');
  }
  if (!deploy?.post_deploy_commands?.includes('npm run audit:post-unblock-launch')) {
    failures.push('Deploy task must require the post-unblock launch audit after deployment.');
  }
  if (deploy?.allowed_mutation_command_after_approval !== 'npm run deploy:cloudflare:direct') failures.push('Deploy task must use the direct Cloudflare deploy command.');
  if (!dnsApi?.required_environment_names?.includes('CLOUDFLARE_ZONE_ID')) failures.push('DNS API task must name CLOUDFLARE_ZONE_ID.');
  if (!dnsApi?.approval_tokens_required?.includes('CANTONI_DNS_APPROVAL=apply-cantoni-email-dns')) failures.push('DNS API task must require explicit DNS approval.');
  if (dnsApi?.allowed_mutation_command_after_approval !== 'npm run dns:cloudflare:apply') failures.push('DNS API task must use the safe DNS apply command.');

  const dashboardRecords = emailDns?.dashboard_records || [];
  const recordIds = new Set(dashboardRecords.map((record) => record.id));
  for (const requiredRecord of ['mx_google_workspace', 'spf_google_workspace', 'dmarc_monitoring', 'google_dkim']) {
    if (!recordIds.has(requiredRecord)) failures.push(`Email DNS task missing dashboard record ${requiredRecord}.`);
  }
  const dkim = dashboardRecords.find((record) => record.id === 'google_dkim');
  if (dkim && dkim.manual_value_required !== true) failures.push('Google DKIM record must stay manual-value-required.');
  for (const destination of ['hello@cantonidigitalstudio.com', 'quotes@cantonidigitalstudio.com', 'support@cantonidigitalstudio.com', 'dmarc@cantonidigitalstudio.com']) {
    if (!emailDns?.required_workspace_destinations?.includes(destination)) {
      failures.push(`Email DNS task must require Google Workspace destination ${destination}.`);
    }
  }
  if (!String(emailDns?.api_payload?.path || '').includes('sales-kit/generated/email-dns-handoff/')) {
    failures.push('Email DNS task must reference the generated email DNS API-safe payload path.');
  }
  if (!emailDns?.source_commit || !emailDns?.source_short_commit) {
    failures.push('Email DNS task must expose source_commit and source_short_commit.');
  }
  if (!emailDns?.git?.commit) {
    failures.push('Email DNS task must expose handoff Git provenance.');
  }
  if (emailDns?.source_commit && payload?.source_commit && emailDns.source_commit !== payload.source_commit) {
    failures.push('Email DNS task source_commit must match the source operator pack commit.');
  }
  if (emailDns?.api_payload?.source_commit && emailDns?.source_commit && emailDns.api_payload.source_commit !== emailDns.source_commit) {
    failures.push('Email DNS API payload source_commit must match the email DNS handoff source_commit.');
  }
  if (emailDns?.api_payload_latest_alias !== 'sales-kit/generated/email-dns-handoff/cantoni-email-dns-handoff-latest.cloudflare-api-records.json') {
    failures.push('Email DNS task must reference the latest Cloudflare API-safe DNS payload alias.');
  }
  if (!emailDns?.manual_value_records?.some((record) => record.id === 'google_dkim' && record.reason === 'manual_value_required')) {
    failures.push('Email DNS task must keep google_dkim in manual_value_records.');
  }
  if (!emailDns?.verification_commands?.includes('npm run export:email-dns-handoff')) {
    failures.push('Email DNS task must require npm run export:email-dns-handoff.');
  }
  if (!emailDns?.verification_commands?.includes('npm run audit:cloudflare-dns-api')) {
    failures.push('Email DNS task must require npm run audit:cloudflare-dns-api.');
  }
  if (!emailDns?.verification_commands?.includes('npm run dns:cloudflare:plan')) {
    failures.push('Email DNS task must require npm run dns:cloudflare:plan.');
  }
  if (emailDns?.mutation_command_after_approval !== 'npm run dns:cloudflare:apply') {
    failures.push('Email DNS task must name npm run dns:cloudflare:apply as the mutation command after approval.');
  }
  if (!emailDns?.approval_tokens_required?.includes('CANTONI_DNS_APPROVAL=apply-cantoni-email-dns')) {
    failures.push('Email DNS task must preserve the explicit DNS approval token.');
  }
  const dnsSafetyText = JSON.stringify(emailDns?.apply_safety_rules || []);
  for (const requiredText of ['cloudflare_lookup_required', 'zone identity mismatch', 'google._domainkey', 'CANTONI_DNS_ALLOW_EXISTING_REPLACE=yes']) {
    if (!dnsSafetyText.includes(requiredText)) failures.push(`Email DNS task must preserve safety rule text: ${requiredText}`);
  }
  if (paymentBranding?.flag !== 'sales-kit/payment_branding_review.flag') failures.push('Payment branding task must reference sales-kit/payment_branding_review.flag.');
  if (paymentBranding?.evidence !== 'sales-kit/payment_branding_review_evidence.json') failures.push('Payment branding task must reference sales-kit/payment_branding_review_evidence.json.');
  if (paymentBranding?.remediation !== 'sales-kit/payment_branding_remediation.md') failures.push('Payment branding task must reference sales-kit/payment_branding_remediation.md.');
  if (!paymentBranding?.verification_commands?.includes('npm run audit:payment-branding')) {
    failures.push('Payment branding task must require npm run audit:payment-branding.');
  }
  if (!paymentBranding?.verification_commands?.includes('npm run test:payments')) {
    failures.push('Payment branding task must require npm run test:payments.');
  }
  const paymentReviewText = JSON.stringify(paymentBranding?.required_review || []);
  if (!paymentReviewText.includes('Stripe Checkout merchant shows Cantoni Digital Studio')) {
    failures.push('Payment branding task must require Stripe Checkout merchant review.');
  }
  if (!paymentReviewText.includes('PayPal does not expose EC8')) {
    failures.push('Payment branding task must require PayPal unrelated-brand review.');
  }
  if (!paymentReviewText.includes('No EC8/EC8 Platform exception is valid for release')) {
    failures.push('Payment branding task must explicitly reject EC8/EC8 Platform release exceptions.');
  }
  if (paymentBranding?.current_boundary?.source !== 'sales-kit/payment_branding_review_evidence.json') {
    failures.push('Payment branding current boundary must point to structured evidence.');
  }
  if (paymentBranding?.current_boundary?.stale_paypal_verification_superseded !== true) {
    failures.push('Payment branding current boundary must mark stale PayPal visual checks as superseded.');
  }
  if (paymentBranding?.current_boundary?.no_ec8_exception !== true || paymentBranding?.current_boundary?.no_unrelated_brand_exception !== true) {
    failures.push('Payment branding current boundary must disallow EC8 and unrelated-brand exceptions.');
  }
  if (paymentBranding?.current_boundary?.release_ready_required !== true || paymentBranding?.current_boundary?.final_payment_submission_allowed !== false) {
    failures.push('Payment branding current boundary must require release_ready and forbid final payment submission.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run audit:post-unblock-launch')) {
    failures.push('Post-unblock checks must include the consolidated post-unblock launch audit.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run audit:cloudflare-deploy-candidate')) {
    failures.push('Post-unblock checks must include deploy candidate execution-readiness verification.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run test:social-public')) {
    failures.push('Post-unblock checks must include public social channel verification.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run test:lead-endpoint')) {
    failures.push('Post-unblock checks must include lead endpoint verification.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run test:outreach-readiness')) {
    failures.push('Post-unblock checks must include outreach readiness verification.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run audit:payment-branding')) {
    failures.push('Post-unblock checks must include payment branding audit.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run audit:launch-readiness')) {
    failures.push('Post-unblock checks must include launch readiness audit.');
  }
  if (payload?.deploy_candidate?.would_fix_live_contract === true) {
    const patch = payload?.live_site_contract?.deploy_patch;
    if (patch?.full_artifact_required !== true) failures.push('Live-site drift patch must require the full artifact.');
    if (patch?.partial_upload_safe !== false) failures.push('Live-site drift patch must mark partial uploads unsafe.');
    for (const page of ['/case-studies.html', '/termini-commerciali.html', '/privacy.html']) {
      if (!patch?.pages?.includes(page)) failures.push(`Live-site drift patch must include ${page}.`);
    }
  }
  if (payload?.safety?.secrets_in_repo_allowed !== false) failures.push('Safety block must forbid secrets in repo.');
  if (payload?.safety?.outbound_pause_must_remain !== true) failures.push('Safety block must preserve outbound pause.');

  if (handoffPath) {
    const markdownPath = handoffPath.replace(/\.json$/u, '.md');
    const markdown = await fs.readFile(markdownPath, 'utf8').catch((error) => {
      failures.push(`Unable to read handoff markdown: ${error.message}`);
      return '';
    });
    const currentShortCommit = payload?.git?.current?.short_commit;
    const currentCommit = payload?.git?.current?.commit;
    const operatorShortCommit = payload?.git?.operator_pack?.short_commit;
    const combined = `${JSON.stringify(payload || {})}\n${markdown}`;
    scanLeaks(combined, 'External unblock handoff', failures);
    if (/CLOUDFLARE_(?:API_TOKEN|ACCOUNT_ID|ZONE_ID)\s*=/u.test(combined)) {
      failures.push('External unblock handoff must not assign Cloudflare secret/environment values.');
    }
    for (const requiredText of [
      'This file is a handoff, not deploy/DNS approval.',
      'No passwords, tokens, OTPs, cookies or recovery data belong in this repo.',
      'sales-kit/payment_branding_review.flag',
      'sales-kit/payment_branding_review_evidence.json',
      'sales-kit/payment_branding_remediation.md',
      'sales-kit/outbound_pause.flag',
      'cantoni-email-dns-handoff-latest.cloudflare-api-records.json',
      'npm run dns:cloudflare:apply',
      'CANTONI_DNS_APPROVAL=apply-cantoni-email-dns',
      'cloudflare_lookup_required',
      'google._domainkey',
      'Live Site Contract Drift',
      'Do not upload only the drift files',
      'Manual package README',
      'Production live-site contract coverage in this ZIP',
      '/case-studies.html',
      '/termini-commerciali.html',
      '/privacy.html',
      'npm run test:social-public',
      'npm run test:lead-endpoint',
      'npm run test:outreach-readiness',
      'Git Provenance',
      'Source commit:',
      'Current commit:',
      'Current upstream:',
      'Operator pack commit:',
      'If any commit, branch, upstream, ZIP checksum or operator pack reference differs from this handoff',
      'ZIP bytes:',
      'Current Holds',
      'Production live-site contract',
      'Cloudflare Pages deploy authorization',
      'Cloudflare DNS API credentials',
      'Cantoni domain email DNS',
      'Payment branding review',
      'Commercial outbound pause',
      'payment_branding_review',
      'commercial_outbound_pause'
    ]) {
      if (!markdown.includes(requiredText)) failures.push(`External unblock markdown missing required safety text: ${requiredText}`);
    }
    for (const requiredDynamicText of [
      currentShortCommit,
      currentCommit,
      payload?.source_short_commit,
      payload?.source_commit,
      operatorShortCommit,
      payload?.deploy_candidate?.package?.zip_bytes != null ? `ZIP bytes: ${payload.deploy_candidate.package.zip_bytes}` : null,
      payload?.git?.current?.branch,
      payload?.git?.current?.upstream
    ].filter(Boolean)) {
      if (!markdown.includes(requiredDynamicText)) {
        failures.push(`External unblock markdown missing Git provenance value: ${requiredDynamicText}`);
      }
    }

    const timestampedPath = await latestTimestampedHandoffPath().catch((error) => {
      failures.push(`Unable to inspect timestamped handoff files: ${error.message}`);
      return null;
    });
    if (!timestampedPath) {
      failures.push('External unblock handoff must include a timestamped JSON file in addition to latest alias.');
    } else {
      const [latestJson, timestampedJson] = await Promise.all([
        fs.readFile(LATEST_JSON_PATH, 'utf8').catch((error) => {
          failures.push(`Unable to read latest handoff JSON alias: ${error.message}`);
          return null;
        }),
        fs.readFile(timestampedPath, 'utf8')
      ]);
      const latestMarkdown = await fs.readFile(LATEST_MARKDOWN_PATH, 'utf8').catch((error) => {
        failures.push(`Unable to read latest handoff Markdown alias: ${error.message}`);
        return null;
      });
      const timestampedMarkdownPath = timestampedPath.replace(/\.json$/u, '.md');
      const timestampedMarkdown = await fs.readFile(timestampedMarkdownPath, 'utf8').catch((error) => {
        failures.push(`Unable to read timestamped handoff Markdown: ${error.message}`);
        return null;
      });

      if (latestJson !== null && latestJson !== timestampedJson) {
        failures.push('External unblock latest JSON alias does not match latest timestamped JSON.');
      }
      if (latestMarkdown !== null && timestampedMarkdown !== null && latestMarkdown !== timestampedMarkdown) {
        failures.push('External unblock latest Markdown alias does not match latest timestamped Markdown.');
      }
      if (timestampedJson !== null) {
        scanLeaks(timestampedJson, 'External unblock timestamped JSON', failures);
      }
      if (timestampedMarkdown !== null) {
        scanLeaks(timestampedMarkdown, 'External unblock timestamped Markdown', failures);
      }
    }
  }

  const report = {
    ok: failures.length === 0,
    handoff: handoffPath ? relativeToRoot(handoffPath) : null,
    source_operator_pack: payload?.source_operator_pack || null,
    source_commit: payload?.source_commit || null,
    source_short_commit: payload?.source_short_commit || null,
    status: payload?.status || null,
    deploy_candidate_status: payload?.deploy_candidate?.status || null,
    deploy_candidate_package: payload?.deploy_candidate?.package || null,
    checked_tasks: REQUIRED_TASKS,
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message || String(error)
  }, null, 2));
  process.exit(1);
});
