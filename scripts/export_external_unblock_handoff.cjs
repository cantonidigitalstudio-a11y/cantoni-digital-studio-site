#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { gitProvenance } = require('./lib/git_provenance.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OPERATOR_PACK_DIR = path.resolve(process.env.LAUNCH_OPERATOR_PACK_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/launch-operator-pack'));
const OUTPUT_DIR = path.resolve(process.env.EXTERNAL_UNBLOCK_HANDOFF_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/external-unblock-handoff'));
const VERSION = process.env.EXTERNAL_UNBLOCK_HANDOFF_VERSION || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const OPERATOR_PACK_PATTERN = /^cantoni-launch-operator-pack-(?!latest\b).+\.json$/u;

if (!/^[A-Za-z0-9._-]+$/.test(VERSION)) {
  throw new Error('EXTERNAL_UNBLOCK_HANDOFF_VERSION may contain only letters, numbers, dots, underscores and dashes.');
}

const BASE_NAME = `cantoni-external-unblock-handoff-${VERSION}`;
const JSON_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.json`);
const MARKDOWN_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.md`);
const LATEST_JSON_PATH = path.join(OUTPUT_DIR, 'cantoni-external-unblock-handoff-latest.json');
const LATEST_MARKDOWN_PATH = path.join(OUTPUT_DIR, 'cantoni-external-unblock-handoff-latest.md');

function normalizeRel(value) {
  return String(value || '').split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  if (!filePath) return null;
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

async function latestOperatorPackPath() {
  const entries = await fs.readdir(OPERATOR_PACK_DIR, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isFile() && OPERATOR_PACK_PATTERN.test(entry.name))
    .map((entry) => path.join(OPERATOR_PACK_DIR, entry.name))
    .sort()
    .reverse();
  return matches[0] || null;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function readOptionalJson(relPath) {
  const resolved = resolveRepoPath(relPath);
  if (!resolved) return null;
  try {
    return await readJson(resolved);
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

async function sha256File(filePath) {
  return crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
}

function gateById(readiness, id) {
  return (readiness?.gates || []).find((gate) => gate.id === id) || null;
}

function blockerIds(readiness) {
  return (readiness?.blockers || []).map((blocker) => blocker.id);
}

function dashboardRecords(emailDnsHandoff) {
  return Array.isArray(emailDnsHandoff?.cloudflare_dashboard_records)
    ? emailDnsHandoff.cloudflare_dashboard_records
    : [];
}

function recordRows(records) {
  if (!records.length) return ['| Record | Type | Name | Value | Note |', '| --- | --- | --- | --- | --- |', '| n/a | n/a | n/a | n/a | Run `npm run export:email-dns-handoff`. |'];
  return [
    '| Record | Type | Name | Value | Note |',
    '| --- | --- | --- | --- | --- |',
    ...records.map((record) => {
      const value = String(record.content || record.value || '').replace(/\|/g, '\\|');
      const manual = record.manual_value_required ? 'Manual value required. ' : '';
      const note = `${manual}${record.note || ''}`.replace(/\|/g, '\\|');
      return `| ${record.id || ''} | ${record.type || ''} | ${record.name || ''} | \`${value}\` | ${note} |`;
    })
  ];
}

function liveDriftRows(liveSiteContract) {
  const patch = liveSiteContract?.deploy_patch || {};
  const missingByPage = patch.missing_required_by_page || {};
  const pages = Array.isArray(patch.pages) ? patch.pages : Object.keys(missingByPage);

  if (!pages.length) {
    return [
      '| Live page | Artifact file | Missing live snippet |',
      '| --- | --- | --- |',
      '| n/a | n/a | No live-site drift patch recorded. |'
    ];
  }

  return [
    '| Live page | Artifact file | Missing live snippet |',
    '| --- | --- | --- |',
    ...pages.map((page, index) => {
      const artifactFile = Array.isArray(patch.artifact_files) ? patch.artifact_files[index] : '';
      const missing = Array.isArray(missingByPage[page]) ? missingByPage[page].join('; ') : '';
      return `| \`${page}\` | \`${artifactFile || ''}\` | \`${missing.replace(/\|/g, '\\|')}\` |`;
    })
  ];
}

function failuresForGate(gate) {
  return Array.isArray(gate?.failures) ? gate.failures.map((failure) => ({
    id: failure.id || null,
    reason: failure.reason || null
  })) : [];
}

function buildPayload({ operatorPackPath, operatorPack, emailDnsHandoff, paymentBrandingEvidence }) {
  const readiness = operatorPack.readiness || {};
  const candidate = operatorPack.cloudflare_deploy_candidate || {};
  const currentGit = gitProvenance(PROJECT_ROOT);
  const pagesAuthGate = gateById(readiness, 'cloudflare_pages_deploy_auth');
  const dnsApiGate = gateById(readiness, 'cloudflare_dns_api_credentials');
  const emailDnsGate = gateById(readiness, 'cantoni_email_dns');
  const paymentBrandingGate = gateById(readiness, 'payment_branding_review');
  const liveSiteGate = gateById(readiness, 'live_site_contract');
  const records = dashboardRecords(emailDnsHandoff);
  const zipPath = resolveRepoPath(candidate.package?.zip_path);
  const manifestPath = resolveRepoPath(candidate.package?.manifest);

  return {
    ok: true,
    type: 'cantoni_external_unblock_handoff_v1',
    generated_at: new Date().toISOString(),
    source_operator_pack: relativeToRoot(operatorPackPath),
    operator_pack_generated_at: operatorPack.generated_at || null,
    status: readiness.ok === true ? 'no_external_unblock_required' : 'external_access_required',
    account_boundary: {
      brand: 'Cantoni Digital Studio',
      cloudflare_project: candidate.target?.project_name || 'cantonidigitalstudio',
      domain: candidate.target?.domain_name || 'cantonidigitalstudio.com',
      git_remote: 'cantoni',
      git_remote_url_snippet: 'cantonidigitalstudio-a11y/cantoni-digital-studio-site',
      operating_email: 'cantonidigitalstudio@gmail.com'
    },
    git: {
      current: currentGit,
      operator_pack: operatorPack.git || null
    },
    current_blockers: blockerIds(readiness),
    current_hold_ids: (readiness.holds || []).map((hold) => hold.id),
    deploy_candidate: {
      status: candidate.status || null,
      artifact_ready: candidate.artifact_ready === true,
      git_ready: candidate.git_ready === true,
      would_fix_live_contract: candidate.would_fix_live_contract === true,
      execution_ready: candidate.execution_ready === true,
      execution_blockers: candidate.execution_blockers || [],
      package: {
        zip_path: candidate.package?.zip_path || null,
        zip_sha256: candidate.package?.zip_sha256 || null,
        zip_bytes: candidate.package?.zip_bytes ?? null,
        manifest: candidate.package?.manifest || null,
        checksums: candidate.package?.checksums || null,
        readme: candidate.package?.readme || null,
        files_total_bytes: candidate.package?.files_total_bytes ?? null,
        files_count: candidate.package?.files_count ?? null
      },
      zip_exists: Boolean(zipPath),
      manifest_exists: Boolean(manifestPath)
    },
    live_site_contract: {
      ok: liveSiteGate?.ok === true,
      failures: failuresForGate(liveSiteGate),
      deploy_patch: candidate.live_drift_patch || null
    },
    external_tasks: [
      {
        id: 'cloudflare_pages_auth',
        status: pagesAuthGate?.ok === true ? 'ok' : 'blocked',
        destination: 'Cloudflare account that owns the cantonidigitalstudio.com Pages project',
        required_identity: 'Cantoni Digital Studio Cloudflare account only',
        required_environment_names: [
          'CLOUDFLARE_API_TOKEN',
          'CLOUDFLARE_ACCOUNT_ID'
        ],
        token_permissions: [
          'Account > Cloudflare Pages > Edit for the Cantoni account'
        ],
        verification_commands: [
          'npm run audit:cloudflare-auth',
          'npm run audit:cloudflare-pages-api'
        ],
        failures: failuresForGate(pagesAuthGate),
        no_secret_rule: 'Set values only in the live shell or password manager; do not write them to repository files.'
      },
      {
        id: 'cloudflare_pages_deploy',
        status: candidate.execution_ready === true ? 'ready_after_explicit_approval' : 'blocked',
        destination: 'Cloudflare Pages project cantonidigitalstudio',
        artifact_rule: 'Deploy only .cloudflare-pages or the ZIP referenced by this handoff; never deploy the repository root.',
        approved_candidate_package: candidate.package || null,
        approval_tokens_required: [
          'CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct',
          'ALLOW_PRODUCTION_DEPLOY=yes plus CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production only for branch main'
        ],
        branch_policy: candidate.deploy_branch_policy || {
          default_direct_deploy_branch: 'preview-cantoni-site',
          production_branch: 'main',
          preview_deploy_clears_live_site_contract: false,
          live_site_contract_fix_requires_production_branch: true
        },
        verification_commands_before_mutation: [
          'npm run audit:git-deploy-state',
          'npm run audit:cloudflare-pages-api',
          'npm run test:cloudflare-deploy-candidate',
          'node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready'
        ],
        allowed_mutation_command_after_approval: 'npm run deploy:cloudflare:direct',
        post_deploy_commands: [
          'npm run test:live-site',
          'npm run audit:post-unblock-launch',
          'npm run audit:launch-readiness'
        ],
        execution_blockers: candidate.execution_blockers || []
      },
      {
        id: 'cloudflare_dns_api_credentials',
        status: dnsApiGate?.ok === true ? 'ok' : 'blocked',
        destination: 'Cloudflare DNS zone cantonidigitalstudio.com',
        required_environment_names: [
          'CLOUDFLARE_API_TOKEN',
          'CLOUDFLARE_ZONE_ID'
        ],
        token_permissions: [
          'Zone > Zone > Read for cantonidigitalstudio.com',
          'Zone > DNS > Edit for cantonidigitalstudio.com'
        ],
        verification_commands: [
          'npm run audit:cloudflare-dns-api',
          'npm run dns:cloudflare:plan'
        ],
        approval_tokens_required: [
          'CANTONI_DNS_APPROVAL=apply-cantoni-email-dns'
        ],
        allowed_mutation_command_after_approval: 'npm run dns:cloudflare:apply',
        failures: failuresForGate(dnsApiGate)
      },
      {
        id: 'google_workspace_email_dns',
        status: emailDnsGate?.ok === true ? 'ok' : 'blocked',
        destination: 'Google Workspace and Cloudflare DNS for cantonidigitalstudio.com',
        required_workspace_destinations: [
          'hello@cantonidigitalstudio.com',
          'quotes@cantonidigitalstudio.com',
          'support@cantonidigitalstudio.com',
          'dmarc@cantonidigitalstudio.com'
        ],
        prerequisites: [
          'Create the required Google Workspace mailbox, alias, or group destinations before changing MX.',
          'Create or route dmarc@cantonidigitalstudio.com before relying on DMARC aggregate reports.',
          'Generate the Google DKIM TXT value in Google Admin before publishing google._domainkey.'
        ],
        dashboard_records: records,
        api_payload: emailDnsHandoff?.cloudflare_api_payload || null,
        api_payload_latest_alias: 'sales-kit/generated/email-dns-handoff/cantoni-email-dns-handoff-latest.cloudflare-api-records.json',
        manual_value_records: records
          .filter((record) => record.manual_value_required === true)
          .map((record) => ({
            id: record.id || null,
            type: record.type || null,
            name: record.name || null,
            reason: 'manual_value_required'
          })),
        verification_commands: [
          'npm run export:email-dns-handoff',
          'npm run audit:cloudflare-dns-api',
          'npm run dns:cloudflare:plan',
          'npm run audit:email-dns'
        ],
        mutation_command_after_approval: 'npm run dns:cloudflare:apply',
        approval_tokens_required: [
          'CANTONI_DNS_APPROVAL=apply-cantoni-email-dns'
        ],
        apply_safety_rules: [
          'Run npm run dns:cloudflare:plan with live CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID before apply.',
          'Do not apply if the plan reports cloudflare_lookup_required, blocked, or a zone identity mismatch.',
          'Do not publish google._domainkey until the exact Google Admin DKIM TXT value is available.',
          'Do not use CANTONI_DNS_ALLOW_EXISTING_REPLACE=yes unless a human has reviewed the existing SPF, DMARC or MX record conflict.'
        ],
        failures: failuresForGate(emailDnsGate)
      },
      {
        id: 'payment_branding_review',
        status: paymentBrandingGate?.ok === true ? 'ok' : 'blocked',
        destination: 'Stripe Checkout and PayPal wallet branding for Cantoni Digital Studio',
        flag: 'sales-kit/payment_branding_review.flag',
        evidence: 'sales-kit/payment_branding_review_evidence.json',
        remediation: 'sales-kit/payment_branding_remediation.md',
        evidence_status: paymentBrandingEvidence?.status || null,
        evidence_summary: paymentBrandingEvidence?.summary || null,
        current_boundary: {
          source: 'sales-kit/payment_branding_review_evidence.json',
          stale_paypal_verification_superseded: true,
          no_ec8_exception: true,
          no_unrelated_brand_exception: true,
          release_ready_required: true,
          final_payment_submission_allowed: false
        },
        required_review: [
          'Stripe Checkout merchant shows Cantoni Digital Studio on both public Payment Links.',
          'PayPal is selectable in a real browser session.',
          'PayPal does not expose EC8, EC8 Platform, or another unrelated brand/account.',
          'No EC8/EC8 Platform exception is valid for release.',
          'The reviewer stops before submitting the final payment step.'
        ],
        verification_commands: [
          'npm run audit:payment-branding',
          'npm run test:payments'
        ],
        failures: failuresForGate(paymentBrandingGate)
      },
      {
        id: 'post_unblock_checks',
        status: 'pending_external_changes',
        required_commands_after_external_changes: [
          'npm run audit:post-unblock-launch',
          'npm run test:live-site',
          'npm run test:social-public',
          'npm run test:lead-endpoint',
          'npm run test:outreach-readiness',
          'npm run audit:email-dns',
          'npm run audit:payment-branding',
          'npm run audit:cloudflare-pages-api',
          'npm run audit:cloudflare-dns-api',
          'npm run audit:launch-readiness'
        ],
        outbound_rule: 'Keep sales-kit/outbound_pause.flag in place until launch readiness, email DNS, outreach readiness, exact batch review and sender-account approval all pass.'
      }
    ],
    safety: {
      secrets_in_repo_allowed: false,
      final_deploy_requires_explicit_approval: true,
      dns_apply_requires_explicit_approval: true,
      outbound_pause_must_remain: true,
      no_alternate_brand_accounts: true
    }
  };
}

async function enrichArtifactHashes(payload) {
  const zipPath = resolveRepoPath(payload.deploy_candidate.package.zip_path);
  if (zipPath) {
    payload.deploy_candidate.zip_sha256_verified = await sha256File(zipPath);
  }
  return payload;
}

function renderMarkdown(payload) {
  const candidate = payload.deploy_candidate;
  const emailTask = payload.external_tasks.find((task) => task.id === 'google_workspace_email_dns');
  const pagesAuth = payload.external_tasks.find((task) => task.id === 'cloudflare_pages_auth');
  const dnsApi = payload.external_tasks.find((task) => task.id === 'cloudflare_dns_api_credentials');
  const deployTask = payload.external_tasks.find((task) => task.id === 'cloudflare_pages_deploy');
  const paymentBranding = payload.external_tasks.find((task) => task.id === 'payment_branding_review');
  const liveContract = payload.live_site_contract || {};
  const livePatch = liveContract.deploy_patch || {};

  return [
    '# Cantoni External Unblock Handoff',
    '',
    `Generated: ${payload.generated_at}`,
    `Status: \`${payload.status}\``,
    `Source operator pack: \`${payload.source_operator_pack}\``,
    '',
    '## Boundary',
    '',
    `- Brand/account: ${payload.account_boundary.brand}`,
    `- Operating email: \`${payload.account_boundary.operating_email}\``,
    `- Cloudflare project: \`${payload.account_boundary.cloudflare_project}\``,
    `- Domain: \`${payload.account_boundary.domain}\``,
    `- Git remote: \`${payload.account_boundary.git_remote}\` / \`${payload.account_boundary.git_remote_url_snippet}\``,
    '- Do not use Excellentia, EC8, Mr Collins, Diogomez, personal or unrelated accounts for this operation.',
    '',
    '## Current Blockers',
    '',
    ...(payload.current_blockers.length ? payload.current_blockers.map((id) => `- \`${id}\``) : ['- none']),
    '',
    '## Deploy Candidate',
    '',
    `- Status: \`${candidate.status || 'unknown'}\``,
    `- Artifact ready: ${candidate.artifact_ready ? 'yes' : 'no'}`,
    `- Git ready: ${candidate.git_ready ? 'yes' : 'no'}`,
    `- Would fix live contract: ${candidate.would_fix_live_contract ? 'yes' : 'no'}`,
    `- Execution ready: ${candidate.execution_ready ? 'yes' : 'no'}`,
    `- Execution blockers: ${(candidate.execution_blockers || []).map((id) => `\`${id}\``).join(', ') || 'none'}`,
    `- ZIP: \`${candidate.package.zip_path || 'unknown'}\``,
    `- ZIP SHA-256: \`${candidate.package.zip_sha256 || 'unknown'}\``,
    `- Manifest: \`${candidate.package.manifest || 'unknown'}\``,
    `- Checksums: \`${candidate.package.checksums || 'unknown'}\``,
    `- Manual package README: \`${candidate.package.readme || 'unknown'}\``,
    '- Read the manual package README before upload; it contains `Production live-site contract coverage in this ZIP` and the no-partial-upload rule.',
    '',
    '## Live Site Contract Drift',
    '',
    `- Live contract ok: ${liveContract.ok ? 'yes' : 'no'}`,
    `- Full artifact required: ${livePatch.full_artifact_required === true ? 'yes' : 'unknown'}`,
    `- Partial upload safe: ${livePatch.partial_upload_safe === false ? 'no' : 'unknown'}`,
    '- Do not upload only the drift files; deploy the verified full artifact or ZIP referenced above.',
    '',
    ...liveDriftRows(liveContract),
    '',
    '## Cloudflare Pages Auth',
    '',
    `- Status: \`${pagesAuth.status}\``,
    '- Required environment names: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`',
    '- Required permission: Account > Cloudflare Pages > Edit for the Cantoni account.',
    '- Verify with `npm run audit:cloudflare-pages-api` before any deploy attempt.',
    '- Store token values only in the live shell or password manager, never in repo files.',
    '',
    '## Deploy Command Boundary',
    '',
    `- Status: \`${deployTask.status}\``,
    '- Before mutation: `npm run audit:git-deploy-state`, `npm run audit:cloudflare-pages-api`, `npm run test:cloudflare-deploy-candidate`, `node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready`.',
    '- Mutation command after approval only: `npm run deploy:cloudflare:direct`.',
    '- Default direct branch `preview-cantoni-site` validates the artifact but does not clear the production `live_site_contract`.',
    '- To clear the production live contract, set `CLOUDFLARE_PAGES_BRANCH=main` and use the separate production approvals.',
    '- Required approval token name/value: `CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct`.',
    '- Production branch `main` additionally requires `ALLOW_PRODUCTION_DEPLOY=yes` and `CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`.',
    '',
    '## Cloudflare DNS Credentials',
    '',
    `- Status: \`${dnsApi.status}\``,
    '- Required environment names: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`',
    '- Required permissions: Zone > Zone > Read and Zone > DNS > Edit for `cantonidigitalstudio.com`.',
    '- Verify with `npm run audit:cloudflare-dns-api` and `npm run dns:cloudflare:plan`.',
    '- Apply only with `CANTONI_DNS_APPROVAL=apply-cantoni-email-dns`.',
    '',
    '## Google Workspace Email DNS',
    '',
    `- Status: \`${emailTask.status}\``,
    '- Create required Google Workspace mailboxes, aliases or groups before changing MX.',
    `- Required destinations: ${(emailTask.required_workspace_destinations || []).map((item) => `\`${item}\``).join(', ') || 'not recorded'}.`,
    '- Create or route `dmarc@cantonidigitalstudio.com` before relying on DMARC reports.',
    '- Generate the Google DKIM value in Google Admin before publishing `google._domainkey`.',
    `- API-safe payload: \`${emailTask.api_payload?.path || 'not generated'}\` (${emailTask.api_payload?.records_count ?? 0} automatic records).`,
    `- Latest API-safe alias: \`${emailTask.api_payload_latest_alias}\`.`,
    `- Manual-value records: ${(emailTask.manual_value_records || []).map((record) => `\`${record.id}\``).join(', ') || 'none'}.`,
    '- Dry-run before mutation: `npm run export:email-dns-handoff`, `npm run audit:cloudflare-dns-api`, `npm run dns:cloudflare:plan`.',
    '- Mutation command after DNS approval only: `npm run dns:cloudflare:apply`.',
    '- Required approval token name/value: `CANTONI_DNS_APPROVAL=apply-cantoni-email-dns`.',
    '- Stop if the DNS plan reports `cloudflare_lookup_required`, `blocked`, or a zone identity mismatch.',
    '',
    ...recordRows(emailTask.dashboard_records),
    '',
    '## Payment Branding Review',
    '',
    `- Status: \`${paymentBranding.status}\``,
    '- Required flag: `sales-kit/payment_branding_review.flag` remains until review is complete.',
    `- Evidence: \`${paymentBranding.evidence}\` (${paymentBranding.evidence_status || 'not recorded'}; release_ready=${paymentBranding.evidence_summary?.release_ready === true ? 'true' : 'false'})`,
    `- Remediation: \`${paymentBranding.remediation}\``,
    '- Verify with `npm run audit:payment-branding` and `npm run test:payments`.',
    '- Confirm Stripe Checkout and PayPal show Cantoni Digital Studio only; stop before final payment submission.',
    '- Current boundary: the old PayPal visual check is superseded by the latest evidence; no EC8/EC8 Platform exception is valid for release.',
    '',
    '## Post-Unblock Checks',
    '',
    '- `npm run test:live-site`',
    '- `npm run audit:post-unblock-launch`',
    '- `npm run test:social-public`',
    '- `npm run test:lead-endpoint`',
    '- `npm run test:outreach-readiness`',
    '- `npm run audit:email-dns`',
    '- `npm run audit:payment-branding`',
    '- `npm run audit:cloudflare-pages-api`',
    '- `npm run audit:cloudflare-dns-api`',
    '- `npm run audit:launch-readiness`',
    '',
    '## Safety',
    '',
    '- No passwords, tokens, OTPs, cookies or recovery data belong in this repo.',
    '- Keep `sales-kit/payment_branding_review.flag` until Stripe Checkout and PayPal branding are verified.',
    '- Keep `sales-kit/outbound_pause.flag` until all launch, email DNS, outreach readiness, batch approval and sender checks pass.',
    '- This file is a handoff, not deploy/DNS approval.',
    ''
  ].join('\n');
}

async function main() {
  const operatorPackPath = await latestOperatorPackPath();
  if (!operatorPackPath) throw new Error('No launch operator pack found. Run npm run export:launch-operator-pack first.');

  const operatorPack = await readJson(operatorPackPath);
  const emailDnsHandoff = await readOptionalJson(operatorPack.steps?.email_dns_handoff?.output?.json);
  const paymentBrandingEvidence = await readOptionalJson('sales-kit/payment_branding_review_evidence.json');
  const payload = await enrichArtifactHashes(buildPayload({
    operatorPackPath,
    operatorPack,
    emailDnsHandoff,
    paymentBrandingEvidence
  }));

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const json = JSON.stringify(payload, null, 2) + '\n';
  const markdown = renderMarkdown(payload);
  await fs.writeFile(JSON_PATH, json);
  await fs.writeFile(MARKDOWN_PATH, markdown);
  await fs.writeFile(LATEST_JSON_PATH, json);
  await fs.writeFile(LATEST_MARKDOWN_PATH, markdown);

  console.log(JSON.stringify({
    ok: true,
    status: payload.status,
    blockers: payload.current_blockers,
    handoff: {
      json: relativeToRoot(JSON_PATH),
      markdown: relativeToRoot(MARKDOWN_PATH),
      latest_json: relativeToRoot(LATEST_JSON_PATH),
      latest_markdown: relativeToRoot(LATEST_MARKDOWN_PATH)
    },
    source_operator_pack: payload.source_operator_pack,
    deploy_candidate_status: payload.deploy_candidate.status
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exit(1);
});
