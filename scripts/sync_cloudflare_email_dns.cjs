#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const GENERATED_HANDOFF_DIR = path.join(PROJECT_ROOT, 'sales-kit/generated/email-dns-handoff');
const EXPECTED_DOMAIN = process.env.CANTONI_EMAIL_DOMAIN || 'cantonidigitalstudio.com';
const API_BASE_URL = (process.env.CLOUDFLARE_API_BASE_URL || 'https://api.cloudflare.com/client/v4').replace(/\/+$/u, '');
const REQUIRED_APPROVAL = 'apply-cantoni-email-dns';
const API_PAYLOAD_PATTERN = /^cantoni-email-dns-handoff-.+\.cloudflare-api-records\.json$/u;

function usage() {
  return [
    'Usage: node scripts/sync_cloudflare_email_dns.cjs [--input file] [--fixture-existing file] [--dry-run|--apply]',
    '',
    'Default mode is dry-run.',
    '',
    'Apply mode requires:',
    '- CLOUDFLARE_API_TOKEN',
    '- CLOUDFLARE_ZONE_ID',
    `- CANTONI_DNS_APPROVAL=${REQUIRED_APPROVAL}`,
    '',
    'Optional safety valve for updating an existing non-matching SPF/DMARC/MX record:',
    '- CANTONI_DNS_ALLOW_EXISTING_REPLACE=yes'
  ].join('\n');
}

function parseArgs(argv) {
  const parsed = {
    input: null,
    fixtureExisting: null,
    dryRun: false,
    apply: false,
    help: false
  };

  function nextValue(flag) {
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value after ${flag}.`);
    return value;
  }

  let index = 0;
  for (; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--apply') parsed.apply = true;
    else if (arg === '--input') parsed.input = nextValue(arg);
    else if (arg === '--fixture-existing') parsed.fixtureExisting = nextValue(arg);
    else throw new Error(`Unsupported argument: ${arg}`);
  }

  if (parsed.apply && parsed.dryRun) {
    throw new Error('Use only one of --dry-run or --apply.');
  }
  if (parsed.input === undefined || parsed.fixtureExisting === undefined) {
    throw new Error('Missing value after --input or --fixture-existing.');
  }

  return parsed;
}

function normalizeRel(filePath) {
  return String(filePath || '').split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  return normalizeRel(path.relative(PROJECT_ROOT, filePath));
}

async function latestApiPayloadPath() {
  let entries;
  try {
    entries = await fs.readdir(GENERATED_HANDOFF_DIR, { withFileTypes: true });
  } catch (error) {
    throw new Error(`No generated email DNS handoff directory found. Run npm run export:email-dns-handoff first. (${error.message})`);
  }

  const matches = entries
    .filter((entry) => entry.isFile() && API_PAYLOAD_PATTERN.test(entry.name))
    .map((entry) => path.join(GENERATED_HANDOFF_DIR, entry.name))
    .sort()
    .reverse();

  if (!matches[0]) {
    throw new Error('No Cloudflare API DNS payload found. Run npm run export:email-dns-handoff first.');
  }

  return matches[0];
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\.$/u, '');
}

function normalizeTxt(value) {
  return String(value || '').replace(/\s+/gu, ' ').trim();
}

function normalizeContent(record) {
  if (record.type === 'TXT') return normalizeTxt(record.content);
  return String(record.content || '').trim().toLowerCase().replace(/\.$/u, '');
}

function isSpfRecord(record) {
  return record.type === 'TXT' && /^v=spf1\b/iu.test(normalizeTxt(record.content));
}

function isDmarcRecord(record) {
  return record.type === 'TXT' && /^v=DMARC1\b/iu.test(normalizeTxt(record.content));
}

function isExactMatch(existing, desired) {
  if (normalizeName(existing.name) !== normalizeName(desired.name)) return false;
  if (String(existing.type || '').toUpperCase() !== desired.type) return false;
  if (normalizeContent(existing) !== normalizeContent(desired)) return false;
  if (desired.type === 'MX' && Number(existing.priority) !== Number(desired.priority)) return false;
  return true;
}

function redactRecord(record) {
  return {
    id: record.id,
    type: record.type,
    name: record.name,
    content: record.content,
    priority: record.priority ?? null,
    ttl: record.ttl ?? null,
    proxied: record.proxied === true
  };
}

function validateRecordEnvelope(record) {
  const failures = [];
  if (!record || typeof record !== 'object') return ['record must be an object'];
  if (!record.id || typeof record.id !== 'string') failures.push('record.id is required');
  if (record.id === 'google_dkim') failures.push('google_dkim must not be in the API apply payload');
  if (record.endpoint !== 'POST /zones/{zone_id}/dns_records') failures.push(`${record.id}: unsupported endpoint ${record.endpoint}`);

  const payload = record.payload || {};
  const type = String(payload.type || '').toUpperCase();
  const name = normalizeName(payload.name);
  const content = String(payload.content || '');

  if (!['MX', 'TXT'].includes(type)) failures.push(`${record.id}: unsupported record type ${type || '(missing)'}`);
  if (!name.endsWith(EXPECTED_DOMAIN)) failures.push(`${record.id}: DNS name must stay under ${EXPECTED_DOMAIN}`);
  if (!content || /<paste\b|manual value|generated in Google Admin/iu.test(content)) {
    failures.push(`${record.id}: content is missing or still manual placeholder text`);
  }
  if (payload.proxied === true) failures.push(`${record.id}: email DNS records must not be proxied`);
  if (payload.ttl !== 1) failures.push(`${record.id}: Cloudflare API payload must use ttl=1 for automatic TTL`);
  if (type === 'MX' && typeof payload.priority !== 'number') failures.push(`${record.id}: MX priority is required`);

  return failures;
}

function validatePayload(payload, inputPath) {
  const failures = [];
  if (!payload || typeof payload !== 'object') failures.push('payload must be an object');
  if (payload.domain !== EXPECTED_DOMAIN) failures.push(`payload domain must be ${EXPECTED_DOMAIN}`);
  if (payload.zone_id_required !== true) failures.push('payload.zone_id_required must be true');
  if (!Array.isArray(payload.records) || payload.records.length === 0) failures.push('payload.records must contain at least one record');
  if (payload.records && payload.records.length > 10) failures.push('payload.records unexpectedly contains more than 10 records');
  if (!Array.isArray(payload.skipped_records) || !payload.skipped_records.some((record) => record.id === 'google_dkim' && record.reason === 'manual_value_required')) {
    failures.push('payload.skipped_records must keep google_dkim as manual_value_required');
  }

  const records = [];
  for (const record of payload.records || []) {
    failures.push(...validateRecordEnvelope(record));
    const source = record.payload || {};
    records.push({
      id: record.id,
      type: String(source.type || '').toUpperCase(),
      name: normalizeName(source.name),
      content: source.content,
      ttl: source.ttl,
      proxied: source.proxied === true,
      priority: source.priority,
      comment: source.comment || undefined,
      source_endpoint: record.endpoint,
      source_file: relativeToRoot(inputPath)
    });
  }

  const uniqueKeys = new Set();
  for (const record of records) {
    const key = `${record.type}:${record.name}:${record.type === 'TXT' && isSpfRecord(record) ? 'spf' : normalizeContent(record)}`;
    if (uniqueKeys.has(key)) failures.push(`${record.id}: duplicate planned DNS record`);
    uniqueKeys.add(key);
  }

  return { failures, records };
}

function selectorForRecord(desired) {
  if (desired.type === 'MX') return (record) => record.type === 'MX' && normalizeName(record.name) === desired.name;
  if (desired.id === 'spf_google_workspace') return (record) => normalizeName(record.name) === desired.name && isSpfRecord(record);
  if (desired.id === 'dmarc_monitoring') return (record) => normalizeName(record.name) === desired.name && isDmarcRecord(record);
  return (record) => record.type === desired.type && normalizeName(record.name) === desired.name && isExactMatch(record, desired);
}

function buildDesiredPayload(desired) {
  const payload = {
    type: desired.type,
    name: desired.name,
    content: desired.content,
    ttl: desired.ttl,
    proxied: false
  };

  if (desired.comment) payload.comment = desired.comment;
  if (desired.type === 'MX') payload.priority = desired.priority;
  return payload;
}

function planAction(desired, existingRecords, allowReplace) {
  const relevant = existingRecords.filter(selectorForRecord(desired));
  const exact = relevant.filter((record) => isExactMatch(record, desired));

  if (exact.length > 0) {
    return {
      id: desired.id,
      type: desired.type,
      name: desired.name,
      action: 'noop',
      reason: 'desired record already exists',
      existing_count: relevant.length,
      existing_record_ids: relevant.map((record) => record.id).filter(Boolean)
    };
  }

  if (relevant.length === 0) {
    return {
      id: desired.id,
      type: desired.type,
      name: desired.name,
      action: 'create',
      reason: 'no matching email DNS record exists',
      existing_count: 0,
      method: 'POST',
      endpoint: '/zones/{zone_id}/dns_records',
      payload: buildDesiredPayload(desired)
    };
  }

  if (relevant.length === 1 && allowReplace) {
    return {
      id: desired.id,
      type: desired.type,
      name: desired.name,
      action: 'update',
      reason: 'one existing email DNS record differs and replace was explicitly allowed',
      existing_count: 1,
      existing_record_ids: relevant.map((record) => record.id).filter(Boolean),
      method: 'PATCH',
      endpoint: '/zones/{zone_id}/dns_records/{dns_record_id}',
      dns_record_id: relevant[0].id,
      payload: buildDesiredPayload(desired)
    };
  }

  return {
    id: desired.id,
    type: desired.type,
    name: desired.name,
    action: 'blocked',
    reason: relevant.length === 1
      ? 'one existing email DNS record differs; set CANTONI_DNS_ALLOW_EXISTING_REPLACE=yes only after review'
      : 'multiple existing email DNS records require manual dashboard cleanup before API apply',
    existing_count: relevant.length,
    existing_record_ids: relevant.map((record) => record.id).filter(Boolean),
    existing_records: relevant.map(redactRecord)
  };
}

async function readExistingFixture(filePath) {
  const fixture = await readJson(path.resolve(PROJECT_ROOT, filePath));
  const records = Array.isArray(fixture) ? fixture : fixture.records;
  if (!Array.isArray(records)) throw new Error('--fixture-existing must contain an array or an object with records array');

  return records.map((record) => ({
    id: record.id,
    type: String(record.type || '').toUpperCase(),
    name: normalizeName(record.name),
    content: record.content,
    priority: record.priority,
    ttl: record.ttl,
    proxied: record.proxied === true,
    comment: record.comment || undefined
  }));
}

async function cloudflareRequest({ token, zoneId, method, pathname, query, body }) {
  const url = new URL(`${API_BASE_URL}${pathname.replace('{zone_id}', encodeURIComponent(zoneId))}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const parsed = await response.json().catch(() => null);

  if (!response.ok || !parsed || parsed.success !== true) {
    const message = Array.isArray(parsed?.errors) && parsed.errors.length
      ? parsed.errors.map((error) => error.message || error.code).join('; ')
      : `HTTP ${response.status}`;
    const error = new Error(`Cloudflare API request failed: ${message}`);
    error.status = response.status;
    error.response = parsed;
    throw error;
  }

  return parsed.result;
}

async function loadCloudflareExisting(records, credentials) {
  const byKey = new Map();
  const results = [];

  for (const desired of records) {
    const key = `${desired.type}:${desired.name}`;
    if (byKey.has(key)) {
      results.push(...byKey.get(key));
      continue;
    }
    const found = await cloudflareRequest({
      token: credentials.token,
      zoneId: credentials.zoneId,
      method: 'GET',
      pathname: '/zones/{zone_id}/dns_records',
      query: {
        type: desired.type,
        name: desired.name,
        per_page: 100
      }
    });
    const normalized = (found || []).map((record) => ({
      id: record.id,
      type: String(record.type || '').toUpperCase(),
      name: normalizeName(record.name),
      content: record.content,
      priority: record.priority,
      ttl: record.ttl,
      proxied: record.proxied === true,
      comment: record.comment || undefined
    }));
    byKey.set(key, normalized);
    results.push(...normalized);
  }

  const unique = new Map();
  for (const record of results) {
    const key = record.id || `${record.type}:${record.name}:${record.content}:${record.priority || ''}`;
    unique.set(key, record);
  }
  return [...unique.values()];
}

function planWithoutCredentials(records) {
  return records.map((record) => ({
    id: record.id,
    type: record.type,
    name: record.name,
    action: 'cloudflare_lookup_required',
    reason: 'dry-run has no Cloudflare credentials or fixture, so existing DNS records were not inspected',
    method: 'POST_OR_PATCH_AFTER_LOOKUP',
    endpoint: '/zones/{zone_id}/dns_records'
  }));
}

async function applyActions(actions, credentials) {
  const results = [];

  for (const action of actions) {
    if (action.action === 'noop') {
      results.push({ id: action.id, action: 'noop' });
      continue;
    }
    if (action.action === 'create') {
      const result = await cloudflareRequest({
        token: credentials.token,
        zoneId: credentials.zoneId,
        method: 'POST',
        pathname: '/zones/{zone_id}/dns_records',
        body: action.payload
      });
      results.push({ id: action.id, action: 'created', dns_record_id: result.id || null });
      continue;
    }
    if (action.action === 'update') {
      const result = await cloudflareRequest({
        token: credentials.token,
        zoneId: credentials.zoneId,
        method: 'PATCH',
        pathname: `/zones/{zone_id}/dns_records/${encodeURIComponent(action.dns_record_id)}`,
        body: action.payload
      });
      results.push({ id: action.id, action: 'updated', dns_record_id: result.id || action.dns_record_id });
      continue;
    }
    throw new Error(`Refusing to apply unsupported action ${action.action} for ${action.id}`);
  }

  return results;
}

function buildReport({ ok, mode, inputPath, source, credentials, allowReplace, records, actions, skippedRecords, failures, applyResults }) {
  const blockedActions = actions.filter((action) => action.action === 'blocked');
  const lookupRequired = actions.filter((action) => action.action === 'cloudflare_lookup_required');
  const mutableActions = actions.filter((action) => ['create', 'update'].includes(action.action));

  return {
    ok,
    checked_at: new Date().toISOString(),
    mode,
    domain: EXPECTED_DOMAIN,
    input: relativeToRoot(inputPath),
    source,
    cloudflare: {
      token_present: Boolean(credentials.token),
      zone_id_present: Boolean(credentials.zoneId),
      zone_id_suffix: credentials.zoneId ? credentials.zoneId.slice(-6) : null
    },
    safety: {
      approval_required_for_apply: REQUIRED_APPROVAL,
      existing_replace_allowed: allowReplace
    },
    records_count: records.length,
    skipped_records: skippedRecords,
    ready_to_apply: failures.length === 0 && blockedActions.length === 0 && lookupRequired.length === 0,
    changes_required: mutableActions.length,
    actions,
    apply_results: applyResults,
    failures
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const mode = args.apply
    ? 'apply'
    : args.dryRun
      ? 'dry_run'
      : process.env.CANTONI_DNS_APPLY === 'yes'
        ? 'apply'
        : 'dry_run';
  const inputPath = path.resolve(PROJECT_ROOT, args.input || await latestApiPayloadPath());
  const payload = await readJson(inputPath);
  const { failures, records } = validatePayload(payload, inputPath);
  const skippedRecords = payload.skipped_records || [];
  const credentials = {
    token: process.env.CLOUDFLARE_API_TOKEN || '',
    zoneId: process.env.CLOUDFLARE_ZONE_ID || ''
  };
  const allowReplace = process.env.CANTONI_DNS_ALLOW_EXISTING_REPLACE === 'yes';
  let source = 'not_loaded';
  let existingRecords = [];

  if (args.fixtureExisting) {
    existingRecords = await readExistingFixture(args.fixtureExisting);
    source = 'fixture';
  } else if (credentials.token && credentials.zoneId) {
    existingRecords = await loadCloudflareExisting(records, credentials);
    source = 'cloudflare_api';
  } else {
    source = 'no_credentials';
  }

  let actions = source === 'no_credentials'
    ? planWithoutCredentials(records)
    : records.map((record) => planAction(record, existingRecords, allowReplace));

  if (mode === 'apply') {
    if (!credentials.token) failures.push('CLOUDFLARE_API_TOKEN is required for apply mode');
    if (!credentials.zoneId) failures.push('CLOUDFLARE_ZONE_ID is required for apply mode');
    if (process.env.CANTONI_DNS_APPROVAL !== REQUIRED_APPROVAL) {
      failures.push(`CANTONI_DNS_APPROVAL must equal ${REQUIRED_APPROVAL} for apply mode`);
    }
    if (source === 'fixture') failures.push('Refusing apply mode with --fixture-existing');
  }

  const blockedActions = actions.filter((action) => action.action === 'blocked');
  const lookupRequired = actions.filter((action) => action.action === 'cloudflare_lookup_required');
  if (mode === 'apply' && blockedActions.length) failures.push('Blocked DNS actions require manual cleanup or explicit replacement review before apply');
  if (mode === 'apply' && lookupRequired.length) failures.push('Cloudflare lookup is required before apply');

  let applyResults = [];
  if (mode === 'apply' && failures.length === 0) {
    applyResults = await applyActions(actions, credentials);
    existingRecords = await loadCloudflareExisting(records, credentials);
    actions = records.map((record) => planAction(record, existingRecords, allowReplace));
  }

  const finalBlockedActions = actions.filter((action) => action.action === 'blocked');
  const ok = failures.length === 0 && finalBlockedActions.length === 0;
  const report = buildReport({
    ok,
    mode,
    inputPath,
    source,
    credentials,
    allowReplace,
    records,
    actions,
    skippedRecords,
    failures,
    applyResults
  });

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok || (mode === 'apply' && !report.ready_to_apply)) process.exit(1);
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message || String(error)
  }, null, 2));
  process.exit(1);
});
