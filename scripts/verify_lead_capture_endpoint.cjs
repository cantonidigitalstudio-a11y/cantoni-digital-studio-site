const assert = require('assert/strict');
const fs = require('fs/promises');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

async function readConfig() {
  const configSource = await fs.readFile(path.join(ROOT_DIR, 'site-config.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(configSource, sandbox, { filename: 'site-config.js' });
  return sandbox.window.CDS_CONFIG || {};
}

function parseJsonp(body, callbackName) {
  const prefix = `${callbackName}(`;
  assert.ok(body.startsWith(prefix), 'endpoint should return JSONP callback');
  assert.ok(body.endsWith(');'), 'endpoint JSONP should end with );');
  return JSON.parse(body.slice(prefix.length, -2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableProbeError(error) {
  return /endpoint HTTP (?:404|408|429|5\d\d)\b|fetch failed|network|timeout/i.test(error?.message || String(error));
}

async function requestJsonp(endpoint, params, options = {}) {
  const attempts = options.attempts || 1;
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestJsonpOnce(endpoint, params);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryableProbeError(error)) break;
      await sleep(500 * attempt);
    }
  }
  throw lastError;
}

async function requestJsonpOnce(endpoint, params) {
  const callback = `__cdsEndpointProbe_${Date.now()}`;
  const search = new URLSearchParams({ ...params, callback });
  const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${search.toString()}`;
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'CantoniDigitalStudioEndpointProbe/1.0' }
  });
  const body = await response.text();
  assert.ok(response.ok, `endpoint HTTP ${response.status}`);
  return parseJsonp(body, callback);
}

async function main() {
  const config = await readConfig();
  const endpoint = config.leadCaptureEndpoint || '';
  assert.match(endpoint, /^https:\/\/script\.google\.com\/macros\/s\//, 'leadCaptureEndpoint should be a Google Apps Script HTTPS endpoint');

  const health = await requestJsonp(endpoint, { action: 'health' }, { attempts: 3 });
  assert.equal(health.ok, true, 'health probe should return ok=true');
  assert.equal(health.service, 'cantoni-digital-studio-leads', 'health probe should identify Cantoni lead service');

  const result = {
    ok: true,
    endpointHost: new URL(endpoint).host,
    health
  };

  if (process.env.ALLOW_LIVE_LEAD_PROBE === 'yes') {
    const lead = await requestJsonp(endpoint, {
      action: 'lead',
      form_type: 'qa_probe',
      page: '/qa-endpoint-probe',
      language: 'it',
      currency: 'EUR',
      business: 'QA synthetic endpoint probe - Cantoni Digital Studio',
      contact: 'Automated QA',
      email: 'cantonidigitalstudio@gmail.com',
      website: 'https://cantonidigitalstudio.com',
      market: 'Italy',
      goal: 'Verify lead capture endpoint',
      source: 'qa_probe',
      submitted_at: new Date().toISOString()
    });
    assert.equal(lead.ok, true, 'live lead probe should return ok=true');
    result.liveLeadProbe = lead;
  } else {
    result.liveLeadProbe = 'skipped; set ALLOW_LIVE_LEAD_PROBE=yes to write a synthetic qa_probe lead row';
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`FAIL lead-capture-endpoint: ${error.message}`);
  process.exitCode = 1;
});
