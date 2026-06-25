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
  const payload = {
    ok: audit.ok === true,
    generated_at: new Date().toISOString(),
    domain: audit.domain,
    sender_profile: audit.sender_profile,
    checked_at: audit.checked_at,
    cloudflare_dashboard_records: records,
    checks: audit.checks || [],
    failures: audit.failures || [],
    references: audit.references || []
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, JSON.stringify(payload, null, 2) + '\n');
  await fs.writeFile(CSV_PATH, renderCsv(records));
  await fs.writeFile(MARKDOWN_PATH, renderMarkdown({ audit, records }));

  console.log(JSON.stringify({
    ok: true,
    email_dns_ok: payload.ok,
    records_count: records.length,
    manual_value_records: records.filter((record) => record.manual_value_required).map((record) => record.id),
    markdown: MARKDOWN_PATH,
    json: JSON_PATH,
    csv: CSV_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
