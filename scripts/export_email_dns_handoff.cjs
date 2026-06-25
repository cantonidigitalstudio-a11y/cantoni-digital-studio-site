const fs = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(process.env.EMAIL_DNS_HANDOFF_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/email-dns-handoff'));
const VERSION = process.env.EMAIL_DNS_HANDOFF_VERSION || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

if (!/^[A-Za-z0-9._-]+$/.test(VERSION)) {
  throw new Error('EMAIL_DNS_HANDOFF_VERSION may contain only letters, numbers, dots, underscores and dashes.');
}

const BASE_NAME = `cantoni-email-dns-handoff-${VERSION}`;
const MARKDOWN_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.md`);
const JSON_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.json`);
const CSV_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.cloudflare-records.csv`);
const API_PAYLOAD_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.cloudflare-api-records.json`);

function normalizeRel(value) {
  return String(value || '').split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  return normalizeRel(path.relative(PROJECT_ROOT, filePath));
}

function runJson(command, args) {
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    shell: false
  });

  const stdout = String(result.stdout || '').trim();
  let parsed = null;

  try {
    parsed = stdout ? JSON.parse(stdout) : null;
  } catch (error) {
    throw new Error(`${[command, ...args].join(' ')} did not return JSON: ${error.message}`);
  }

  return {
    status: result.status,
    error: result.error ? result.error.message : null,
    parsed
  };
}

function dashboardRecord(record) {
  return {
    id: record.id,
    type: record.type,
    name: record.name,
    content: record.value,
    priority: record.priority ?? '',
    ttl: record.ttl || 'Auto',
    proxied: record.cloudflare_proxy === true ? 'true' : 'false',
    required: record.required === true,
    manual_value_required: record.manual_value_required === true,
    note: record.note || ''
  };
}

function absoluteDnsName(name, domain) {
  if (name === '@') return domain;
  if (String(name || '').endsWith(`.${domain}`)) return name;
  return `${name}.${domain}`;
}

function cloudflareApiRecord(record, domain) {
  if (record.manual_value_required) return null;
  const payload = {
    type: record.type,
    name: absoluteDnsName(record.name, domain),
    content: record.value,
    ttl: 1,
    proxied: record.cloudflare_proxy === true,
    comment: record.note || undefined
  };

  if (record.priority !== undefined) {
    payload.priority = record.priority;
  }

  return {
    id: record.id,
    endpoint: 'POST /zones/{zone_id}/dns_records',
    payload
  };
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/u.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function renderCsv(records) {
  const headers = ['id', 'type', 'name', 'content', 'priority', 'ttl', 'proxied', 'required', 'manual_value_required', 'note'];
  return [
    headers.join(','),
    ...records.map((record) => headers.map((header) => escapeCsv(record[header])).join(','))
  ].join('\n') + '\n';
}

function renderRecordTable(records) {
  return [
    '| Type | Name | Priority | Content | TTL | Proxied | Manual value |',
    '| --- | --- | ---: | --- | --- | --- | --- |',
    ...records.map((record) => {
      const content = String(record.content || '').replace(/\|/g, '\\|');
      return `| ${record.type} | \`${record.name}\` | ${record.priority || ''} | \`${content}\` | ${record.ttl} | ${record.proxied} | ${record.manual_value_required ? 'yes' : 'no'} |`;
    })
  ];
}

function renderObservedChecks(checks) {
  if (!Array.isArray(checks) || !checks.length) return ['- no checks returned'];
  return checks.map((check) => {
    const status = check.ok ? 'ok' : 'missing';
    const observed = Array.isArray(check.records) && check.records.length
      ? ` observed: ${check.records.join('; ')}`
      : '';
    return `- ${check.id}: ${status}.${observed}`;
  });
}

function renderMarkdown({ audit, records }) {
  return [
    '# Cantoni Email DNS Handoff',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Domain: ${audit.domain}`,
    `Audit ok: ${audit.ok === true ? 'yes' : 'no'}`,
    `Sender profile: ${audit.sender_profile || 'unknown'}`,
    '',
    '## Preconditions',
    '',
    '- Use the Cantoni Digital Studio Cloudflare account only.',
    '- Create Google Workspace users or aliases before relying on MX delivery.',
    '- Required aliases before serious use: `hello@`, `quotes@`, `support@`, `dmarc@`.',
    '- Generate DKIM inside Google Admin; do not invent or reuse a DKIM value.',
    '- Keep outbound paused until `npm run audit:email-dns` is green and the exact send batch is approved.',
    '',
    '## Cloudflare DNS Records',
    '',
    ...renderRecordTable(records),
    '',
    '## Cloudflare API Payload',
    '',
    `A JSON payload for non-manual records is written to \`${path.basename(API_PAYLOAD_PATH)}\`.`,
    'It intentionally excludes `google_dkim` until the real Google Admin value is available.',
    '',
    '## Current Observed State',
    '',
    ...renderObservedChecks(audit.checks),
    '',
    '## Required Sequence',
    '',
    '1. Create or confirm Google Workspace mailbox/aliases for the domain.',
    '2. Add MX, SPF and DMARC in Cloudflare DNS.',
    '3. Generate DKIM for `cantonidigitalstudio.com` in Google Admin.',
    '4. Replace the DKIM placeholder in this handoff with the exact Google Admin TXT value.',
    '5. Add the `google._domainkey` TXT record in Cloudflare.',
    '6. Wait for propagation.',
    '7. Run the verification commands below.',
    '',
    '## Verification Commands',
    '',
    '```bash',
    'npm run audit:email-dns',
    'npm run test:launch-readiness-audit',
    '```',
    '',
    '## References',
    '',
    ...((audit.references || []).map((reference) => `- ${reference.label}: ${reference.url}`)),
    ''
  ].join('\n');
}

async function main() {
  const auditRun = runJson(process.execPath, ['sales-kit/scripts/verify_cantoni_email_dns.mjs', '--allow-missing']);
  if (auditRun.error) throw new Error(auditRun.error);

  const audit = auditRun.parsed;
  const records = (audit.recommended_records || []).map(dashboardRecord);
  const apiRecords = (audit.recommended_records || [])
    .map((record) => cloudflareApiRecord(record, audit.domain))
    .filter(Boolean);
  const skippedApiRecords = (audit.recommended_records || [])
    .filter((record) => record.manual_value_required)
    .map((record) => ({
      id: record.id,
      type: record.type,
      name: record.name,
      reason: 'manual_value_required'
    }));
  const apiPayload = {
    ok: true,
    generated_at: new Date().toISOString(),
    domain: audit.domain,
    zone_id_required: true,
    apply_rule: 'Apply only after Google Workspace mailboxes or aliases exist and after explicit DNS approval.',
    records: apiRecords,
    skipped_records: skippedApiRecords
  };
  const payload = {
    ok: audit.ok === true,
    generated_at: new Date().toISOString(),
    domain: audit.domain,
    sender_profile: audit.sender_profile,
    checked_at: audit.checked_at,
    cloudflare_dashboard_records: records,
    cloudflare_api_payload: {
      path: relativeToRoot(API_PAYLOAD_PATH),
      records_count: apiRecords.length,
      skipped_records: skippedApiRecords
    },
    checks: audit.checks || [],
    failures: audit.failures || [],
    references: audit.references || []
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, JSON.stringify(payload, null, 2) + '\n');
  await fs.writeFile(API_PAYLOAD_PATH, JSON.stringify(apiPayload, null, 2) + '\n');
  await fs.writeFile(CSV_PATH, renderCsv(records));
  await fs.writeFile(MARKDOWN_PATH, renderMarkdown({ audit, records }));

  console.log(JSON.stringify({
    ok: true,
    email_dns_ok: payload.ok,
    records_count: records.length,
    manual_value_records: records.filter((record) => record.manual_value_required).map((record) => record.id),
    markdown: MARKDOWN_PATH,
    json: JSON_PATH,
    csv: CSV_PATH,
    cloudflare_api_json: API_PAYLOAD_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
