#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const PROJECT_ROOT = require('path').resolve(__dirname, '..');
const SCRIPT_PATH = 'scripts/verify_cloudflare_api_credentials.mjs';
const FAKE_TOKEN = 'cf_test_token_for_contract_only_1234567890';
const ACCOUNT_ID = '11111111111111111111111111111111';
const ZONE_ID = '22222222222222222222222222222222';
const PROJECT_NAME = 'cantonidigitalstudio';
const DOMAIN = 'cantonidigitalstudio.com';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jsonResponse(res, status, payload) {
  res.writeHead(status, {
    'connection': 'close',
    'content-type': 'application/json'
  });
  res.end(JSON.stringify(payload));
}

function startServer() {
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

    if (url.pathname === '/user/tokens/verify') {
      jsonResponse(res, 200, {
        success: true,
        errors: [],
        result: {
          id: 'token-fixture-id',
          status: 'active'
        }
      });
      return;
    }

    if (url.pathname === `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`) {
      jsonResponse(res, 200, {
        success: true,
        errors: [],
        result: [{
          id: 'deployment-fixture-id',
          project_name: PROJECT_NAME
        }]
      });
      return;
    }

    if (url.pathname === `/zones/${ZONE_ID}/dns_records`) {
      jsonResponse(res, 200, {
        success: true,
        errors: [],
        result: [{
          id: 'dns-fixture-id',
          zone_name: DOMAIN,
          type: 'TXT',
          name: DOMAIN,
          content: 'fixture'
        }]
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

function closeServer(server, sockets) {
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

function runAudit(baseUrl) {
  const env = {
    ...process.env,
    CLOUDFLARE_API_BASE_URL: baseUrl,
    CLOUDFLARE_API_TOKEN: FAKE_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
    CLOUDFLARE_ZONE_ID: ZONE_ID,
    CLOUDFLARE_PAGES_PROJECT_NAME: PROJECT_NAME,
    CLOUDFLARE_CUSTOM_DOMAIN: DOMAIN
  };

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      env,
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
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: null, signal: null, stdout, stderr, error, timedOut });
    });
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr, error: null, timedOut });
    });
  });
}

async function main() {
  const { server, sockets, requests, baseUrl } = await startServer();
  try {
    const result = await runAudit(baseUrl);
    assert(!result.timedOut, `audit process should not time out\nstdout=${result.stdout}\nstderr=${result.stderr}`);
    assert(!result.error, `audit process should not error: ${result.error?.message || result.error}`);
    assert(result.status === 0, `audit should pass against fixture server, got ${result.status}\nstdout=${result.stdout}\nstderr=${result.stderr}`);
    assert(!result.stdout.includes(FAKE_TOKEN), 'audit stdout must not leak CLOUDFLARE_API_TOKEN');
    assert(!result.stderr.includes(FAKE_TOKEN), 'audit stderr must not leak CLOUDFLARE_API_TOKEN');

    const parsed = JSON.parse(result.stdout);
    assert(parsed.ok === true, 'audit should return ok=true against fixture server');
    assert(parsed.has_cloudflare_api_token === true, 'token presence should be true');
    assert(parsed.has_cloudflare_account_id === true, 'account id presence should be true');
    assert(parsed.has_cloudflare_zone_id === true, 'zone id presence should be true');
    assert(parsed.account_id_suffix === ACCOUNT_ID.slice(-6), 'account id suffix should be reported');
    assert(parsed.zone_id_suffix === ZONE_ID.slice(-6), 'zone id suffix should be reported');
    assert(parsed.checks.token_verify.ok === true, 'token verify check should pass');
    assert(parsed.checks.pages_project_deployments_read.ok === true, 'Pages read check should pass');
    assert(parsed.checks.dns_records_read.ok === true, 'DNS read check should pass');

    const requestPaths = requests.map((request) => request.path).sort();
    assert(requestPaths.includes('/user/tokens/verify'), 'token verify endpoint should be called');
    assert(requestPaths.includes(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`), 'Pages deployments endpoint should be called');
    assert(requestPaths.includes(`/zones/${ZONE_ID}/dns_records`), 'DNS records endpoint should be called');
    assert(requests.every((request) => request.method === 'GET'), 'all fixture requests should use GET');
    assert(requests.every((request) => request.authorization === `Bearer ${FAKE_TOKEN}`), 'all fixture requests should use bearer auth');
    const pagesRequest = requests.find((request) => request.path === `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`);
    const dnsRequest = requests.find((request) => request.path === `/zones/${ZONE_ID}/dns_records`);
    assert(pagesRequest?.query.per_page === '1', 'Pages deployments check should request one deployment');
    assert(dnsRequest?.query.name === DOMAIN, 'DNS records check should scope by Cantoni domain');
    assert(dnsRequest?.query.per_page === '1', 'DNS records check should request one record page');

    console.log(JSON.stringify({
      ok: true,
      checked: [
        'token_verify_success',
        'pages_deployments_read_success',
        'dns_records_read_success',
        'token_redaction',
        'endpoint_contract',
        'query_contract'
      ]
    }, null, 2));
  } finally {
    await closeServer(server, sockets);
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
