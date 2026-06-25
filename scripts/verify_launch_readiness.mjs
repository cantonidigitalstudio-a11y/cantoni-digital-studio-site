import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const allowBlocked = process.argv.includes('--allow-blocked') || process.argv.includes('--allow-missing');

function runJson(command, args) {
  const run = spawnSync(command, args, {
    cwd: rootDir,
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
    stderr: stderr.slice(0, 1200),
    parsed,
    parse_error: parseError
  };
}

function summarizeFailures(failures) {
  return (Array.isArray(failures) ? failures : []).map((failure) => ({
    id: failure.id || 'unknown',
    reason: failure.reason || 'No reason provided.'
  }));
}

function gateFromRun({ id, label, category, run, details }) {
  const parsedOk = run.parsed?.ok === true;
  const commandOk = run.status === 0 && !run.error && !run.parse_error;
  const ok = parsedOk && commandOk;
  const failures = summarizeFailures(run.parsed?.failures);

  return {
    id,
    label,
    category,
    ok,
    severity: ok ? 'pass' : 'blocker',
    command: run.command,
    command_status: run.status,
    failures: failures.length ? failures : ok ? [] : [{
      id: run.parse_error ? 'parse_error' : run.error ? 'command_error' : 'gate_failed',
      reason: run.parse_error || run.error || run.stderr || `${label} did not report ok=true.`
    }],
    details: details(run.parsed)
  };
}

function cloudflareDeployAuthGate({ cloudflareRun, cloudflareApiRun }) {
  const oauthGate = gateFromRun({
    id: 'cloudflare_pages_deploy_auth',
    label: 'Cloudflare Pages deploy authorization',
    category: 'deploy',
    run: cloudflareRun,
    details: (parsed) => ({
      project_name: parsed?.project_name || null,
      project_listed: parsed?.project_listed === true,
      has_cloudflare_account_id: parsed?.has_cloudflare_account_id === true,
      diagnostic_code: parsed?.diagnostic_code || null,
      next_actions: parsed?.next_actions || [],
      whoami_status: parsed?.whoami?.status ?? null,
      pages_project_list_status: parsed?.pages_project_list?.status ?? null
    })
  });
  const apiParsed = cloudflareApiRun.parsed || {};
  const directApiCommandOk = cloudflareApiRun.status === 0 && !cloudflareApiRun.error && !cloudflareApiRun.parse_error;
  const directApiPagesOk = directApiCommandOk &&
    apiParsed.checks?.token_verify?.ok === true &&
    apiParsed.checks?.pages_project_deployments_read?.ok === true;

  const details = {
    ...oauthGate.details,
    oauth_wrangler_ok: oauthGate.ok === true,
    direct_api_pages_ok: directApiPagesOk,
    direct_api_scope: apiParsed.scope || null,
    direct_api_has_token: apiParsed.has_cloudflare_api_token === true,
    direct_api_has_account_id: apiParsed.has_cloudflare_account_id === true
  };

  if (oauthGate.ok || directApiPagesOk) {
    return {
      ...oauthGate,
      ok: true,
      severity: 'pass',
      failures: [],
      details: {
        ...details,
        next_actions: oauthGate.ok
          ? oauthGate.details.next_actions
          : [
              'Cloudflare Pages direct API read checks passed for the Cantoni account.',
              'Use `npm run deploy:cloudflare:direct` only after explicit deploy approval.',
              'Keep DNS changes separate until `npm run dns:cloudflare:plan` is ready and approved.'
            ]
      }
    };
  }

  return {
    ...oauthGate,
    details: {
      ...details,
      next_actions: [
        ...oauthGate.details.next_actions,
        'Alternative direct token path: set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for the Cantoni account, then run `node scripts/verify_cloudflare_api_credentials.mjs --pages-only`.'
      ]
    }
  };
}

async function readOptional(file) {
  try {
    return await fs.readFile(path.join(rootDir, file), 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

const cloudflareRun = runJson(process.execPath, ['scripts/verify_cloudflare_deploy_auth.mjs', '--allow-missing']);
const cloudflarePagesApiRun = runJson(process.execPath, ['scripts/verify_cloudflare_api_credentials.mjs', '--allow-missing', '--pages-only']);
const cloudflareDnsApiRun = runJson(process.execPath, ['scripts/verify_cloudflare_api_credentials.mjs', '--allow-missing', '--dns-only']);
const artifactRun = runJson(process.execPath, ['scripts/verify_cloudflare_artifact_readiness.cjs']);
const emailDnsRun = runJson(process.execPath, ['sales-kit/scripts/verify_cantoni_email_dns.mjs', '--allow-missing']);
const deployPolicyRun = runJson(process.execPath, ['scripts/verify_deploy_channel_policy.cjs']);
const gitDeployStateRun = runJson(process.execPath, ['scripts/verify_git_deploy_state.cjs']);
const liveSiteRun = runJson(process.execPath, ['scripts/verify_live_site.cjs']);
const outboundPauseMessage = await readOptional('sales-kit/outbound_pause.flag');

const gates = [
  gateFromRun({
    id: 'live_site_contract',
    label: 'Production live-site contract',
    category: 'site',
    run: liveSiteRun,
    details: (parsed) => ({
      base_url: parsed?.base_url || null,
      checked: parsed?.checked || 0
    })
  }),
  gateFromRun({
    id: 'deploy_channel_policy',
    label: 'Deploy channel policy',
    category: 'deploy',
    run: deployPolicyRun,
    details: (parsed) => ({
      primary_deploy_channel: parsed?.primary_deploy_channel || null,
      fallback_deploy_channel: parsed?.fallback_deploy_channel || null,
      checked: parsed?.checked || []
    })
  }),
  gateFromRun({
    id: 'git_deploy_state',
    label: 'Git deploy state',
    category: 'deploy',
    run: gitDeployStateRun,
    details: (parsed) => ({
      commit: parsed?.git?.short_commit || null,
      branch: parsed?.git?.branch || null,
      upstream: parsed?.git?.upstream || null,
      remote_name: parsed?.git?.remote_name || null,
      remote_url: parsed?.git?.remote_url || null,
      ahead: parsed?.git?.ahead ?? null,
      behind: parsed?.git?.behind ?? null,
      dirty: parsed?.git?.dirty === true,
      status_entries: parsed?.git?.status_entries ?? null
    })
  }),
  gateFromRun({
    id: 'cloudflare_artifact_contract',
    label: 'Cloudflare Pages artifact contract',
    category: 'deploy',
    run: artifactRun,
    details: (parsed) => ({
      public_dir: parsed?.public_dir || null,
      build_ok: parsed?.build?.ok === true,
      build_status: parsed?.build?.status ?? null,
      artifact_ok: parsed?.artifact?.ok === true,
      artifact_status: parsed?.artifact?.status ?? null,
      files_count: parsed?.artifact?.files_count ?? null,
      required_files_count: parsed?.artifact?.required_files_count ?? null
    })
  }),
  cloudflareDeployAuthGate({ cloudflareRun, cloudflareApiRun: cloudflarePagesApiRun }),
  gateFromRun({
    id: 'cloudflare_dns_api_credentials',
    label: 'Cloudflare DNS API credentials',
    category: 'email',
    run: cloudflareDnsApiRun,
    details: (parsed) => ({
      project_name: parsed?.project_name || null,
      domain: parsed?.domain || null,
      scope: parsed?.scope || null,
      has_cloudflare_api_token: parsed?.has_cloudflare_api_token === true,
      has_cloudflare_account_id: parsed?.has_cloudflare_account_id === true,
      has_cloudflare_zone_id: parsed?.has_cloudflare_zone_id === true,
      token_verify_ok: parsed?.checks?.token_verify?.ok === true,
      pages_read_ok: parsed?.checks?.pages_project_deployments_read?.ok === true,
      dns_read_ok: parsed?.checks?.dns_records_read?.ok === true,
      next_actions: parsed?.next_actions || []
    })
  }),
  gateFromRun({
    id: 'cantoni_email_dns',
    label: 'Cantoni domain email DNS',
    category: 'email',
    run: emailDnsRun,
    details: (parsed) => ({
      domain: parsed?.domain || null,
      checked_at: parsed?.checked_at || null,
      check_count: Array.isArray(parsed?.checks) ? parsed.checks.length : 0
    })
  }),
  {
    id: 'commercial_outbound_pause',
    label: 'Commercial outbound pause',
    category: 'outbound',
    ok: outboundPauseMessage === null,
    severity: outboundPauseMessage === null ? 'pass' : 'hold',
    file: 'sales-kit/outbound_pause.flag',
    failures: outboundPauseMessage === null ? [] : [{
      id: 'outbound_pause_flag_present',
      reason: 'Commercial outbound is intentionally paused until domain/email and send approval gates are cleared.'
    }],
    details: {
      present: outboundPauseMessage !== null,
      message: outboundPauseMessage ? outboundPauseMessage.trim() : null
    }
  }
];

const blockers = gates.filter((gate) => gate.severity === 'blocker' && !gate.ok);
const holds = gates.filter((gate) => gate.severity === 'hold' && !gate.ok);
const result = {
  ok: blockers.length === 0 && holds.length === 0,
  allow_blocked: allowBlocked,
  checked_at: new Date().toISOString(),
  gates,
  blockers: blockers.map((gate) => ({
    id: gate.id,
    label: gate.label,
    failures: gate.failures
  })),
  holds: holds.map((gate) => ({
    id: gate.id,
    label: gate.label,
    failures: gate.failures
  }))
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok && !allowBlocked) {
  process.exit(1);
}
