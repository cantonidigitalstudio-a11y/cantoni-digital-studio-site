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

async function readOptional(file) {
  try {
    return await fs.readFile(path.join(rootDir, file), 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

const cloudflareRun = runJson(process.execPath, ['scripts/verify_cloudflare_deploy_auth.mjs', '--allow-missing']);
const emailDnsRun = runJson(process.execPath, ['sales-kit/scripts/verify_cantoni_email_dns.mjs', '--allow-missing']);
const outboundPauseMessage = await readOptional('sales-kit/outbound_pause.flag');

const gates = [
  gateFromRun({
    id: 'cloudflare_pages_deploy_auth',
    label: 'Cloudflare Pages deploy authorization',
    category: 'deploy',
    run: cloudflareRun,
    details: (parsed) => ({
      project_name: parsed?.project_name || null,
      project_listed: parsed?.project_listed === true,
      has_cloudflare_account_id: parsed?.has_cloudflare_account_id === true,
      whoami_status: parsed?.whoami?.status ?? null,
      pages_project_list_status: parsed?.pages_project_list?.status ?? null
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
