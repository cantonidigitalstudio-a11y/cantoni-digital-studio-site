#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const allowBlocked = process.argv.includes('--allow-blocked') || process.argv.includes('--allow-missing');

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
    return parsedFailures.map((item) => failure(item.id || stepId, item.reason || fallbackReason));
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

const runs = {
  git: runJson(process.execPath, ['scripts/verify_git_deploy_state.cjs']),
  live: runJson(process.execPath, ['scripts/verify_live_site.cjs']),
  cloudflareAuth: runJson(process.execPath, ['scripts/verify_cloudflare_deploy_auth.mjs', '--allow-missing']),
  cloudflarePagesApi: runJson(process.execPath, ['scripts/verify_cloudflare_api_credentials.mjs', '--allow-missing', '--pages-only']),
  cloudflareDnsApi: runJson(process.execPath, ['scripts/verify_cloudflare_api_credentials.mjs', '--allow-missing', '--dns-only']),
  emailDns: runJson(process.execPath, ['sales-kit/scripts/verify_cantoni_email_dns.mjs', '--allow-missing']),
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
      deploy_candidate_status: parsed?.deploy_candidate_status || null,
      checked_tasks: parsed?.checked_tasks || []
    }),
    blockerWhenFailed: false
  })
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
    'Keep sales-kit/outbound_pause.flag until email DNS, exact batch review and sender-account approval are all explicitly cleared.',
    'Run npm run test:social-public and npm run test:lead-endpoint before starting any public outbound or campaign work.',
    'Do not store Cloudflare, Google, OTP, cookie or recovery values in repository files.'
  ]
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok && !allowBlocked) process.exit(1);
