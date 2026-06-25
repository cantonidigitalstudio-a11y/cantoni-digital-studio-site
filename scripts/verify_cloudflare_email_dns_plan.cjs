#!/usr/bin/env node

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SYNC_SCRIPT = path.join(PROJECT_ROOT, 'scripts/sync_cloudflare_email_dns.cjs');

const fixturePayload = {
  ok: true,
  generated_at: '2026-06-25T00:00:00.000Z',
  domain: 'cantonidigitalstudio.com',
  zone_id_required: true,
  apply_rule: 'Apply only after Google Workspace mailboxes or aliases exist and after explicit DNS approval.',
  records: [
    {
      id: 'mx_google_workspace',
      endpoint: 'POST /zones/{zone_id}/dns_records',
      payload: {
        type: 'MX',
        name: 'cantonidigitalstudio.com',
        content: 'smtp.google.com',
        ttl: 1,
        proxied: false,
        comment: 'Google Workspace inbound mail routing. Create Google Workspace users and aliases before changing MX.',
        priority: 1
      }
    },
    {
      id: 'spf_google_workspace',
      endpoint: 'POST /zones/{zone_id}/dns_records',
      payload: {
        type: 'TXT',
        name: 'cantonidigitalstudio.com',
        content: 'v=spf1 include:_spf.google.com ~all',
        ttl: 1,
        proxied: false,
        comment: 'Use one consolidated SPF TXT record only. Add other senders to this same record if needed.'
      }
    },
    {
      id: 'dmarc_monitoring',
      endpoint: 'POST /zones/{zone_id}/dns_records',
      payload: {
        type: 'TXT',
        name: '_dmarc.cantonidigitalstudio.com',
        content: 'v=DMARC1; p=none; rua=mailto:dmarc@cantonidigitalstudio.com; adkim=s; aspf=s',
        ttl: 1,
        proxied: false,
        comment: 'Create dmarc@cantonidigitalstudio.com as a mailbox, alias, group, or monitored destination before relying on reports.'
      }
    }
  ],
  skipped_records: [
    {
      id: 'google_dkim',
      type: 'TXT',
      name: 'google._domainkey',
      reason: 'manual_value_required'
    }
  ]
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sanitizedEnv(extra = {}) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;
  delete env.CLOUDFLARE_ZONE_ID;
  delete env.CANTONI_DNS_APPLY;
  delete env.CANTONI_DNS_APPROVAL;
  delete env.CANTONI_DNS_ALLOW_EXISTING_REPLACE;
  return { ...env, ...extra };
}

function runSync(args, expectedStatus = 0, extraEnv = {}) {
  const result = spawnSync(process.execPath, [SYNC_SCRIPT, ...args], {
    cwd: PROJECT_ROOT,
    env: sanitizedEnv(extraEnv),
    encoding: 'utf8',
    shell: false
  });

  if (result.status !== expectedStatus) {
    throw new Error([
      `Expected status ${expectedStatus}, got ${result.status}`,
      `stdout=${result.stdout}`,
      `stderr=${result.stderr}`
    ].join('\n'));
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`sync_cloudflare_email_dns.cjs did not return JSON: ${error.message}\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  }
}

function actionMap(report) {
  return new Map(report.actions.map((action) => [action.id, action.action]));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n');
}

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cantoni-dns-plan-'));
  const payloadPath = path.join(tmp, 'email-dns-api-records.json');
  const emptyFixturePath = path.join(tmp, 'empty-existing.json');
  const exactFixturePath = path.join(tmp, 'exact-existing.json');
  const conflictFixturePath = path.join(tmp, 'conflict-existing.json');

  await writeJson(payloadPath, fixturePayload);
  await writeJson(emptyFixturePath, { records: [] });
  await writeJson(exactFixturePath, {
    records: fixturePayload.records.map((record) => ({
      id: `existing-${record.id}`,
      ...record.payload
    }))
  });
  await writeJson(conflictFixturePath, {
    records: [
      {
        id: 'existing-mx-other-provider',
        type: 'MX',
        name: 'cantonidigitalstudio.com',
        content: 'mail.example.net',
        priority: 10,
        ttl: 1,
        proxied: false
      },
      {
        id: 'existing-spf-other-sender',
        type: 'TXT',
        name: 'cantonidigitalstudio.com',
        content: 'v=spf1 include:example.net ~all',
        ttl: 1,
        proxied: false
      },
      {
        id: 'existing-dmarc-old',
        type: 'TXT',
        name: '_dmarc.cantonidigitalstudio.com',
        content: 'v=DMARC1; p=none; rua=mailto:ops@example.net',
        ttl: 1,
        proxied: false
      }
    ]
  });

  const noCredentials = runSync(['--input', payloadPath, '--dry-run']);
  assert(noCredentials.ok === true, 'no-credentials dry-run should be ok');
  assert(noCredentials.source === 'no_credentials', 'no-credentials dry-run should not hit Cloudflare');
  assert(noCredentials.ready_to_apply === false, 'no-credentials dry-run must not be ready to apply');
  assert([...actionMap(noCredentials).values()].every((action) => action === 'cloudflare_lookup_required'), 'no-credentials dry-run should require lookup');

  const dryRunOverride = runSync(
    ['--input', payloadPath, '--fixture-existing', emptyFixturePath, '--dry-run'],
    0,
    {
      CANTONI_DNS_APPLY: 'yes',
      CANTONI_DNS_APPROVAL: 'apply-cantoni-email-dns'
    }
  );
  assert(dryRunOverride.mode === 'dry_run', '--dry-run must override CANTONI_DNS_APPLY=yes');

  const emptyPlan = runSync(['--input', payloadPath, '--fixture-existing', emptyFixturePath, '--dry-run']);
  assert(emptyPlan.ok === true, 'empty fixture plan should be ok');
  assert(emptyPlan.ready_to_apply === true, 'empty fixture plan should be ready to apply');
  assert([...actionMap(emptyPlan).values()].every((action) => action === 'create'), 'empty fixture should create every API-safe record');

  const exactPlan = runSync(['--input', payloadPath, '--fixture-existing', exactFixturePath, '--dry-run']);
  assert(exactPlan.ok === true, 'exact fixture plan should be ok');
  assert(exactPlan.changes_required === 0, 'exact fixture should require no changes');
  assert([...actionMap(exactPlan).values()].every((action) => action === 'noop'), 'exact fixture should noop every record');

  const conflictPlan = runSync(['--input', payloadPath, '--fixture-existing', conflictFixturePath, '--dry-run'], 1);
  assert(conflictPlan.ok === false, 'conflict fixture should fail safe');
  assert(conflictPlan.ready_to_apply === false, 'conflict fixture must not be ready to apply');
  assert([...actionMap(conflictPlan).values()].every((action) => action === 'blocked'), 'conflict fixture should block every divergent email DNS record');
  assert(!JSON.stringify(conflictPlan.actions).includes('google._domainkey'), 'manual DKIM record must not enter apply actions');

  console.log(JSON.stringify({
    ok: true,
    checked: [
      'no_credentials_dry_run',
      'dry_run_flag_overrides_apply_env',
      'empty_fixture_create_plan',
      'exact_fixture_noop_plan',
      'conflict_fixture_fail_safe'
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
