#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  OUTBOUND_PAUSE_RELATIVE_PATH,
  OUTBOUND_PAUSE_REQUIRED_SNIPPETS,
  missingOutboundPauseReleaseConditions
} = require('./lib/outbound_pause_contract.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const allowBlocked = process.argv.includes('--allow-blocked') || process.argv.includes('--allow-missing');
const OUTBOUND_PAUSE_PATH = path.join(PROJECT_ROOT, OUTBOUND_PAUSE_RELATIVE_PATH);

function runJson(command, args) {
  const run = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    shell: false
  });

  const stdout = String(run.stdout || '').trim();
  const stderr = String(run.stderr || '').trim();
  let parsed = null;
  let parseError = null;

  if (stdout) {
    try {
      parsed = JSON.parse(stdout);
    } catch (error) {
      parseError = error.message;
    }
  }

  return {
    command: [command, ...args].join(' '),
    status: run.status,
    signal: run.signal || null,
    error: run.error ? run.error.message : null,
    stderr: stderr.slice(0, 1600),
    parsed,
    parse_error: parseError
  };
}

function failure(id, reason) {
  return { id, reason };
}

function failuresFromRun(stepId, run, fallbackReason) {
  const parsedFailures = Array.isArray(run.parsed?.failures) ? run.parsed.failures : [];
  if (parsedFailures.length) {
    return parsedFailures.map((item) => (
      typeof item === 'string'
        ? failure(stepId, item)
        : failure(item.id || stepId, item.reason || fallbackReason)
    ));
  }
  if (run.parse_error) return [failure('parse_error', run.parse_error)];
  if (run.error) return [failure('command_error', run.error)];
  if (run.status !== 0) return [failure('command_failed', run.stderr || fallbackReason)];
  return [failure('not_ok', fallbackReason)];
}

function stepFromRun({ id, label, category, run, ok, details, blockerWhenFailed = true }) {
  const commandOk = run.status === 0 && !run.error && !run.parse_error;
  const stepOk = Boolean(ok(run.parsed, run)) && commandOk;
  return {
    id,
    label,
    category,
    ok: stepOk,
    severity: stepOk ? 'pass' : blockerWhenFailed ? 'blocker' : 'hold',
    command: run.command,
    command_status: run.status,
    failures: stepOk ? [] : failuresFromRun(id, run, `${label} did not report an acceptable post-unblock state.`),
    details: details(run.parsed, run)
  };
}

function outboundPauseContractStep() {
  let source = null;
  try {
    source = fs.readFileSync(OUTBOUND_PAUSE_PATH, 'utf8');
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      return {
        id: 'outbound_pause_contract',
        label: 'Outbound pause release contract',
        category: 'outbound',
        ok: false,
        severity: 'blocker',
        command: `read ${path.relative(PROJECT_ROOT, OUTBOUND_PAUSE_PATH)}`,
        command_status: null,
        failures: [failure('read_error', error.message || String(error))],
        details: { present: false, required_snippets: OUTBOUND_PAUSE_REQUIRED_SNIPPETS }
      };
    }
  }

  const missing = missingOutboundPauseReleaseConditions(source);
  const ok = source !== null && missing.length === 0;
  return {
    id: 'outbound_pause_contract',
    label: 'Outbound pause release contract',
    category: 'outbound',
    ok,
    severity: ok ? 'pass' : 'blocker',
    command: `read ${path.relative(PROJECT_ROOT, OUTBOUND_PAUSE_PATH)}`,
    command_status: source === null ? 1 : 0,
    failures: ok ? [] : [
      ...(source === null ? [failure('outbound_pause_missing', 'sales-kit/outbound_pause.flag must remain until launch, email DNS, social/public channels, lead endpoint, outreach readiness, exact batch approval and sender approval are all cleared.')] : []),
      ...missing.map((snippet) => failure('missing_release_condition', `sales-kit/outbound_pause.flag is missing required release condition: ${snippet}`))
    ],
    details: {
      present: source !== null,
      required_snippets: OUTBOUND_PAUSE_REQUIRED_SNIPPETS,
      missing
    }
  };
}

const runs = {
  git: runJson(process.execPath, ['scripts/verify_git_deploy_state.cjs']),
  live: runJson(process.execPath, ['scripts/verify_live_site.cjs']),
  cloudflareAuth: runJson(process.execPath, ['scripts/verify_cloudflare_deploy_auth.mjs', '--allow-missing']),
  cloudflarePagesApi: runJson(process.execPath, ['scripts/verify_cloudflare_api_credentials.mjs', '--allow-missing', '--pages-only']),
  cloudflareDnsApi: runJson(process.execPath, ['scripts/verify_cloudflare_api_credentials.mjs', '--allow-missing', '--dns-only']),
  emailDns: runJson(process.execPath, ['sales-kit/scripts/verify_cantoni_email_dns.mjs', '--allow-missing']),
  publicChannels: runJson(process.execPath, ['scripts/verify_public_channels.cjs']),
  leadEndpoint: runJson(process.execPath, ['scripts/verify_lead_capture_endpoint.cjs']),
  paymentBranding: runJson(process.execPath, ['scripts/verify_payment_branding_readiness.cjs', '--allow-blocked']),
  launchReadiness: runJson(process.execPath, ['scripts/verify_launch_readiness.mjs', '--allow-blocked']),
  externalHandoff: runJson(process.execPath, ['scripts/verify_external_unblock_handoff.cjs'])
};

function pagesAccessOk(authParsed, pagesApiParsed) {
  return authParsed?.ok === true ||
    (pagesApiParsed?.checks?.token_verify?.ok === true &&
      pagesApiParsed?.checks?.pages_project_deployments_read?.ok === true);
}

const readinessBlockers = Array.isArray(runs.launchReadiness.parsed?.blockers)
  ? runs.launchReadiness.parsed.blockers
  : [];
const readinessHolds = Array.isArray(runs.launchReadiness.parsed?.holds)
  ? runs.launchReadiness.parsed.holds
  : [];
const unexpectedHolds = readinessHolds.filter((hold) => hold.id !== 'commercial_outbound_pause');

const steps = [
  stepFromRun({
    id: 'git_deploy_state',
    label: 'Git deploy state',
    category: 'deploy',
    run: runs.git,
    ok: (parsed) => parsed?.ok === true,
    details: (parsed) => ({
      commit: parsed?.git?.short_commit || null,
      branch: parsed?.git?.branch || null,
      upstream: parsed?.git?.upstream || null,
      dirty: parsed?.git?.dirty === true,
      ahead: parsed?.git?.ahead ?? null,
      behind: parsed?.git?.behind ?? null
    })
  }),
  stepFromRun({
    id: 'live_site_contract',
    label: 'Production live-site contract',
    category: 'site',
    run: runs.live,
    ok: (parsed) => parsed?.ok === true,
    details: (parsed) => ({
      base_url: parsed?.base_url || null,
      checked: parsed?.checked ?? null
    })
  }),
  stepFromRun({
    id: 'cloudflare_pages_access',
    label: 'Cloudflare Pages access',
    category: 'deploy',
    run: runs.cloudflareAuth,
    ok: (authParsed) => pagesAccessOk(authParsed, runs.cloudflarePagesApi.parsed),
    details: (authParsed) => ({
      oauth_ok: authParsed?.ok === true,
      oauth_diagnostic_code: authParsed?.diagnostic_code || null,
      project_listed: authParsed?.project_listed === true,
      direct_api_pages_ok: runs.cloudflarePagesApi.parsed?.checks?.pages_project_deployments_read?.ok === true,
      direct_api_has_token: runs.cloudflarePagesApi.parsed?.has_cloudflare_api_token === true,
      direct_api_has_account_id: runs.cloudflarePagesApi.parsed?.has_cloudflare_account_id === true
    })
  }),
  stepFromRun({
    id: 'cloudflare_dns_api_credentials',
    label: 'Cloudflare DNS API credentials',
    category: 'email',
    run: runs.cloudflareDnsApi,
    ok: (parsed) => parsed?.checks?.token_verify?.ok === true &&
      parsed?.checks?.dns_zone_identity_read?.ok === true &&
      parsed?.checks?.dns_records_read?.ok === true,
    details: (parsed) => ({
      domain: parsed?.domain || null,
      has_cloudflare_api_token: parsed?.has_cloudflare_api_token === true,
      has_cloudflare_zone_id: parsed?.has_cloudflare_zone_id === true,
      dns_zone_identity_ok: parsed?.checks?.dns_zone_identity_read?.ok === true,
      dns_zone_name: parsed?.checks?.dns_zone_identity_read?.zone_name || null,
      dns_read_ok: parsed?.checks?.dns_records_read?.ok === true
    })
  }),
  stepFromRun({
    id: 'cantoni_email_dns',
    label: 'Cantoni domain email DNS',
    category: 'email',
    run: runs.emailDns,
    ok: (parsed) => parsed?.ok === true,
    details: (parsed) => ({
      domain: parsed?.domain || null,
      checked_at: parsed?.checked_at || null,
      check_count: Array.isArray(parsed?.checks) ? parsed.checks.length : 0
    })
  }),
  stepFromRun({
    id: 'public_social_channels',
    label: 'Public social channel contract',
    category: 'social',
    run: runs.publicChannels,
    ok: (parsed) => parsed?.ok === true,
    details: (parsed) => ({
      checked: parsed?.checked ?? null,
      results: Array.isArray(parsed?.results)
        ? parsed.results.map((result) => ({
            id: result.id || null,
            expected: result.expected || null,
            observed: result.observed || null,
            statusCode: result.statusCode ?? null,
            finalUrl: result.finalUrl || null,
            title: result.title || null,
            file: result.file || null,
            ok: result.ok === true
          }))
        : []
    })
  }),
  stepFromRun({
    id: 'lead_capture_endpoint',
    label: 'Lead capture endpoint',
    category: 'leads',
    run: runs.leadEndpoint,
    ok: (parsed) => parsed?.ok === true,
    details: (parsed) => ({
      endpointHost: parsed?.endpointHost || null,
      health: parsed?.health || null,
      liveLeadProbe: parsed?.liveLeadProbe || null
    })
  }),
  stepFromRun({
    id: 'payment_branding_review',
    label: 'Payment branding review',
    category: 'payments',
    run: runs.paymentBranding,
    ok: (parsed) => parsed?.ok === true,
    details: (parsed) => ({
      flag: parsed?.flag || null,
      evidence: parsed?.evidence || null,
      next_actions: parsed?.next_actions || []
    })
  }),
  stepFromRun({
    id: 'launch_readiness_without_outbound',
    label: 'Launch readiness without outbound release',
    category: 'launch',
    run: runs.launchReadiness,
    ok: () => runs.launchReadiness.status === 0 &&
      !runs.launchReadiness.error &&
      !runs.launchReadiness.parse_error &&
      readinessBlockers.length === 0 &&
      unexpectedHolds.length === 0,
    details: () => ({
      blocker_ids: readinessBlockers.map((blocker) => blocker.id),
      hold_ids: readinessHolds.map((hold) => hold.id),
      outbound_pause_present: readinessHolds.some((hold) => hold.id === 'commercial_outbound_pause')
    })
  }),
  stepFromRun({
    id: 'external_unblock_handoff',
    label: 'External unblock handoff',
    category: 'handoff',
    run: runs.externalHandoff,
    ok: (parsed) => parsed?.ok === true,
    details: (parsed) => ({
      handoff: parsed?.handoff || null,
      source_operator_pack: parsed?.source_operator_pack || null,
      source_commit: parsed?.source_commit || null,
      source_short_commit: parsed?.source_short_commit || null,
      deploy_candidate_status: parsed?.deploy_candidate_status || null,
      deploy_candidate_package: parsed?.deploy_candidate_package || null,
      checked_tasks: parsed?.checked_tasks || []
    }),
    blockerWhenFailed: false
  }),
  outboundPauseContractStep()
];

const blockers = steps.filter((step) => step.severity === 'blocker' && !step.ok);
const holds = steps.filter((step) => step.severity === 'hold' && !step.ok);
const report = {
  ok: blockers.length === 0,
  allow_blocked: allowBlocked,
  checked_at: new Date().toISOString(),
  launch_closeout_ready: blockers.length === 0,
  outbound_release_ready: false,
  outbound_release_reason: 'Commercial outbound remains separately approval-gated by sales-kit/outbound_pause.flag.',
  steps,
  blockers: blockers.map((step) => ({
    id: step.id,
    label: step.label,
    failures: step.failures
  })),
  holds: holds.map((step) => ({
    id: step.id,
    label: step.label,
    failures: step.failures
  })),
  required_follow_up_when_ok: [
    'Keep sales-kit/outbound_pause.flag until email DNS, outreach readiness, exact batch review and sender-account approval are all explicitly cleared.',
    'Keep sales-kit/payment_branding_review.flag until Stripe Checkout and PayPal branding are verified in a real browser session.',
    'Run npm run test:social-public, npm run test:lead-endpoint and npm run test:outreach-readiness before starting any public outbound or campaign work.',
    'Do not store Cloudflare, Google, OTP, cookie or recovery values in repository files.'
  ]
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok && !allowBlocked) process.exit(1);
