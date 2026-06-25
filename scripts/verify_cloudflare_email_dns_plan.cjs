#!/usr/bin/env node

const fs = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SYNC_SCRIPT = path.join(PROJECT_ROOT, 'scripts/sync_cloudflare_email_dns.cjs');
const FAKE_TOKEN = 'cf_test_token_for_dns_plan_contract_only_1234567890';
const ZONE_ID = '22222222222222222222222222222222';
const DOMAIN = 'cantonidigitalstudio.com';

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

function runSyncJson(args, expectedStatus = 0, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SYNC_SCRIPT, ...args], {
      cwd: PROJECT_ROOT,
      env: sanitizedEnv(extraEnv),
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, 10000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`sync_cloudflare_email_dns.cjs timed out\nstdout=${stdout}\nstderr=${stderr}`));
        return;
      }
      if (status !== expectedStatus) {
        reject(new Error([
          `Expected status ${expectedStatus}, got ${status}`,
          `stdout=${stdout}`,
          `stderr=${stderr}`
        ].join('\n')));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`sync_cloudflare_email_dns.cjs did not return JSON: ${error.message}\nstdout=${stdout}\nstderr=${stderr}`));
      }
    });
  });
}

function actionMap(report) {
  return new Map(report.actions.map((action) => [action.id, action.action]));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n');
}

function jsonResponse(res, status, payload) {
  res.writeHead(status, {
    connection: 'close',
    'content-type': 'application/json'
  });
  res.end(JSON.stringify(payload));
}

function startCloudflareFixture(options = {}) {
  const zoneName = options.zoneName || DOMAIN;
  const zoneStatus = options.zoneStatus || 'active';
  const existingRecords = options.records || [];
  const requests = [];
  const sockets = new Set();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    requests.push({
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      authorization: req.headers.authorization || ''
    });

    if (req.headers.authorization !== `Bearer ${FAKE_TOKEN}`) {
      jsonResponse(res, 403, {
        success: false,
        errors: [{ code: 9109, message: 'Unauthorized token fixture' }]
      });
      return;
    }

    if (url.pathname === `/zones/${ZONE_ID}`) {
      jsonResponse(res, 200, {
        success: true,
        errors: [],
        result: {
          id: ZONE_ID,
          name: zoneName,
          status: zoneStatus
        }
      });
      return;
    }

    if (url.pathname === `/zones/${ZONE_ID}/dns_records`) {
      const requestedType = url.searchParams.get('type');
      const requestedName = url.searchParams.get('name');
      jsonResponse(res, 200, {
        success: true,
        errors: [],
        result: existingRecords.filter((record) => (
          (!requestedType || record.type === requestedType)
          && (!requestedName || record.name === requestedName)
        ))
      });
      return;
    }

    jsonResponse(res, 404, {
      success: false,
      errors: [{ code: 1003, message: `Unhandled fixture path ${url.pathname}` }]
    });
  });

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, sockets, requests, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

function closeCloudflareFixture(server, sockets) {
  return new Promise((resolve, reject) => {
    for (const socket of sockets) {
      socket.destroy();
    }
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
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

  const noCredentials = await runSyncJson(['--input', payloadPath, '--dry-run']);
  assert(noCredentials.ok === true, 'no-credentials dry-run should be ok');
  assert(noCredentials.source === 'no_credentials', 'no-credentials dry-run should not hit Cloudflare');
  assert(noCredentials.ready_to_apply === false, 'no-credentials dry-run must not be ready to apply');
  assert([...actionMap(noCredentials).values()].every((action) => action === 'cloudflare_lookup_required'), 'no-credentials dry-run should require lookup');

  const dryRunOverride = await runSyncJson(
    ['--input', payloadPath, '--fixture-existing', emptyFixturePath, '--dry-run'],
    0,
    {
      CANTONI_DNS_APPLY: 'yes',
      CANTONI_DNS_APPROVAL: 'apply-cantoni-email-dns'
    }
  );
  assert(dryRunOverride.mode === 'dry_run', '--dry-run must override CANTONI_DNS_APPLY=yes');

  const emptyPlan = await runSyncJson(['--input', payloadPath, '--fixture-existing', emptyFixturePath, '--dry-run']);
  assert(emptyPlan.ok === true, 'empty fixture plan should be ok');
  assert(emptyPlan.ready_to_apply === true, 'empty fixture plan should be ready to apply');
  assert([...actionMap(emptyPlan).values()].every((action) => action === 'create'), 'empty fixture should create every API-safe record');

  const exactPlan = await runSyncJson(['--input', payloadPath, '--fixture-existing', exactFixturePath, '--dry-run']);
  assert(exactPlan.ok === true, 'exact fixture plan should be ok');
  assert(exactPlan.changes_required === 0, 'exact fixture should require no changes');
  assert([...actionMap(exactPlan).values()].every((action) => action === 'noop'), 'exact fixture should noop every record');

  const conflictPlan = await runSyncJson(['--input', payloadPath, '--fixture-existing', conflictFixturePath, '--dry-run'], 1);
  assert(conflictPlan.ok === false, 'conflict fixture should fail safe');
  assert(conflictPlan.ready_to_apply === false, 'conflict fixture must not be ready to apply');
  assert([...actionMap(conflictPlan).values()].every((action) => action === 'blocked'), 'conflict fixture should block every divergent email DNS record');
  assert(!JSON.stringify(conflictPlan.actions).includes('google._domainkey'), 'manual DKIM record must not enter apply actions');

  const liveFixture = await startCloudflareFixture();
  try {
    const livePlan = await runSyncJson(
      ['--input', payloadPath, '--dry-run'],
      0,
      {
        CLOUDFLARE_API_BASE_URL: liveFixture.baseUrl,
        CLOUDFLARE_API_TOKEN: FAKE_TOKEN,
        CLOUDFLARE_ZONE_ID: ZONE_ID
      }
    );
    assert(livePlan.ok === true, 'live fixture plan should be ok');
    assert(livePlan.source === 'cloudflare_api', 'live fixture plan should use Cloudflare API source');
    assert(livePlan.cloudflare.zone_identity.zone_name === DOMAIN, 'live fixture should report the verified zone name');
    assert(livePlan.cloudflare.zone_identity.name_matches_domain === true, 'live fixture should verify zone identity before DNS planning');
    assert(livePlan.ready_to_apply === true, 'live fixture with no existing records should be ready to apply');
    assert([...actionMap(livePlan).values()].every((action) => action === 'create'), 'live fixture should create every API-safe record');
    assert(liveFixture.requests.some((request) => request.path === `/zones/${ZONE_ID}`), 'live fixture should call zone identity endpoint');
    assert(liveFixture.requests.some((request) => request.path === `/zones/${ZONE_ID}/dns_records`), 'live fixture should call DNS records endpoint after zone identity');
    assert(liveFixture.requests.every((request) => request.method === 'GET'), 'dry-run fixture should only use GET requests');
    assert(liveFixture.requests.every((request) => request.authorization === `Bearer ${FAKE_TOKEN}`), 'dry-run fixture should use bearer auth');
  } finally {
    await closeCloudflareFixture(liveFixture.server, liveFixture.sockets);
  }

  const mismatchFixture = await startCloudflareFixture({ zoneName: 'example.com' });
  try {
    const mismatchApply = await runSyncJson(
      ['--input', payloadPath, '--apply'],
      1,
      {
        CLOUDFLARE_API_BASE_URL: mismatchFixture.baseUrl,
        CLOUDFLARE_API_TOKEN: FAKE_TOKEN,
        CLOUDFLARE_ZONE_ID: ZONE_ID,
        CANTONI_DNS_APPROVAL: 'apply-cantoni-email-dns'
      }
    );
    assert(mismatchApply.ok === false, 'zone mismatch apply should fail');
    assert(mismatchApply.source === 'cloudflare_zone_identity_blocked', 'zone mismatch should use blocked source');
    assert(mismatchApply.ready_to_apply === false, 'zone mismatch must not be ready to apply');
    assert(mismatchApply.cloudflare.zone_identity.zone_name === 'example.com', 'zone mismatch should report the wrong zone name');
    assert(mismatchApply.failures.some((failure) => failure.includes('expected cantonidigitalstudio.com')), 'zone mismatch should explain expected domain');
    assert([...actionMap(mismatchApply).values()].every((action) => action === 'blocked'), 'zone mismatch should block every action');
    assert(mismatchFixture.requests.some((request) => request.path === `/zones/${ZONE_ID}`), 'zone mismatch should call zone identity endpoint');
    assert(!mismatchFixture.requests.some((request) => request.path === `/zones/${ZONE_ID}/dns_records`), 'zone mismatch must not read or mutate DNS records');
  } finally {
    await closeCloudflareFixture(mismatchFixture.server, mismatchFixture.sockets);
  }

  console.log(JSON.stringify({
    ok: true,
    checked: [
      'no_credentials_dry_run',
      'dry_run_flag_overrides_apply_env',
      'empty_fixture_create_plan',
      'exact_fixture_noop_plan',
      'conflict_fixture_fail_safe',
      'live_zone_identity_plan',
      'zone_identity_mismatch_apply_block'
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
