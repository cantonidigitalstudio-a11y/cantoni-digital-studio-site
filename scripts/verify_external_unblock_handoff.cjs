#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { gitProvenance } = require('./lib/git_provenance.cjs');

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

function taskById(payload, id) {
  return (payload.external_tasks || []).find((task) => task.id === id) || null;
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
  if (payload?.account_boundary?.brand !== 'Cantoni Digital Studio') failures.push('Account boundary must be Cantoni Digital Studio.');
  if (payload?.account_boundary?.git_remote !== 'cantoni') failures.push('Account boundary must require git remote cantoni.');
  if (payload?.account_boundary?.operating_email !== 'cantonidigitalstudio@gmail.com') failures.push('Account boundary must use official Cantoni operating email.');

  const currentGit = gitProvenance(PROJECT_ROOT);
  if (payload?.git?.current?.commit !== currentGit.commit) failures.push('External unblock handoff current Git commit does not match HEAD.');
  if (payload?.git?.current?.upstream !== currentGit.upstream) failures.push('External unblock handoff current Git upstream does not match repository state.');

  const operatorPackPath = resolveRepoPath(payload?.source_operator_pack);
  if (!operatorPackPath) {
    failures.push('Source operator pack path must be repo-relative.');
  } else {
    try {
      const operatorPack = await readJson(operatorPackPath);
      if (operatorPack.git?.commit !== payload.git?.operator_pack?.commit) failures.push('Source operator pack commit does not match handoff payload.');
      if (operatorPack.cloudflare_deploy_candidate?.package?.zip_sha256 !== payload.deploy_candidate?.package?.zip_sha256) {
        failures.push('Source operator pack ZIP SHA-256 does not match handoff deploy candidate.');
      }
    } catch (error) {
      failures.push(`Unable to read source operator pack: ${error.message}`);
    }
  }

  const zipPath = resolveRepoPath(payload?.deploy_candidate?.package?.zip_path);
  const manifestPath = resolveRepoPath(payload?.deploy_candidate?.package?.manifest);
  if (!zipPath) failures.push('Deploy candidate ZIP path must be repo-relative.');
  else {
    try {
      const actualHash = await sha256File(zipPath);
      if (actualHash !== payload.deploy_candidate.package.zip_sha256) failures.push('Deploy candidate ZIP SHA-256 does not match handoff payload.');
      if (payload.deploy_candidate.zip_sha256_verified && payload.deploy_candidate.zip_sha256_verified !== actualHash) {
        failures.push('Deploy candidate verified ZIP SHA-256 does not match actual ZIP.');
      }
    } catch (error) {
      failures.push(`Unable to read deploy candidate ZIP: ${error.message}`);
    }
  }
  if (!manifestPath) failures.push('Deploy candidate manifest path must be repo-relative.');
  else {
    try {
      await fs.access(manifestPath);
    } catch (error) {
      failures.push(`Unable to read deploy candidate manifest: ${error.message}`);
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
  if (deploy?.branch_policy?.default_direct_deploy_branch !== 'preview-cantoni-site') failures.push('Deploy task must document preview-cantoni-site as the default direct branch.');
  if (deploy?.branch_policy?.production_branch !== 'main') failures.push('Deploy task must document main as the production branch.');
  if (deploy?.branch_policy?.preview_deploy_clears_live_site_contract !== false) failures.push('Deploy task must state that preview deploys do not clear the production live-site contract.');
  if (deploy?.branch_policy?.live_site_contract_fix_requires_production_branch !== true) failures.push('Deploy task must state that live-site contract fix requires production branch.');
  if (!deploy?.verification_commands_before_mutation?.includes('node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready')) {
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
  if (paymentBranding?.flag !== 'sales-kit/payment_branding_review.flag') failures.push('Payment branding task must reference sales-kit/payment_branding_review.flag.');
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
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run audit:post-unblock-launch')) {
    failures.push('Post-unblock checks must include the consolidated post-unblock launch audit.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run audit:payment-branding')) {
    failures.push('Post-unblock checks must include payment branding audit.');
  }
  if (!postChecks?.required_commands_after_external_changes?.includes('npm run audit:launch-readiness')) {
    failures.push('Post-unblock checks must include launch readiness audit.');
  }
  if (payload?.safety?.secrets_in_repo_allowed !== false) failures.push('Safety block must forbid secrets in repo.');
  if (payload?.safety?.outbound_pause_must_remain !== true) failures.push('Safety block must preserve outbound pause.');

  if (handoffPath) {
    const markdownPath = handoffPath.replace(/\.json$/u, '.md');
    const markdown = await fs.readFile(markdownPath, 'utf8').catch((error) => {
      failures.push(`Unable to read handoff markdown: ${error.message}`);
      return '';
    });
    const combined = `${JSON.stringify(payload || {})}\n${markdown}`;
    if (/CLOUDFLARE_(?:API_TOKEN|ACCOUNT_ID|ZONE_ID)\s*=/u.test(combined)) {
      failures.push('External unblock handoff must not assign Cloudflare secret/environment values.');
    }
    for (const requiredText of [
      'This file is a handoff, not deploy/DNS approval.',
      'No passwords, tokens, OTPs, cookies or recovery data belong in this repo.',
      'sales-kit/payment_branding_review.flag',
      'sales-kit/outbound_pause.flag'
    ]) {
      if (!markdown.includes(requiredText)) failures.push(`External unblock markdown missing required safety text: ${requiredText}`);
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
    }
  }

  const report = {
    ok: failures.length === 0,
    handoff: handoffPath ? relativeToRoot(handoffPath) : null,
    source_operator_pack: payload?.source_operator_pack || null,
    status: payload?.status || null,
    deploy_candidate_status: payload?.deploy_candidate?.status || null,
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
