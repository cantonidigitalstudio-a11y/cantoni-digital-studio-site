import dns from 'node:dns/promises';

const domain = process.env.CANTONI_EMAIL_DOMAIN || 'cantonidigitalstudio.com';
const allowMissing = process.argv.includes('--allow-missing');

const GOOGLE_MX_HOSTS = [
  'smtp.google.com',
  'aspmx.l.google.com',
  'alt1.aspmx.l.google.com',
  'alt2.aspmx.l.google.com',
  'alt3.aspmx.l.google.com',
  'alt4.aspmx.l.google.com'
];

const recommendedRecords = [
  {
    id: 'mx_google_workspace',
    type: 'MX',
    name: '@',
    priority: 1,
    value: 'smtp.google.com',
    ttl: 'Auto',
    cloudflare_proxy: false,
    required: true,
    note: 'Google Workspace inbound mail routing. Create Google Workspace users and aliases before changing MX.'
  },
  {
    id: 'spf_google_workspace',
    type: 'TXT',
    name: '@',
    value: 'v=spf1 include:_spf.google.com ~all',
    ttl: 'Auto',
    required: true,
    note: 'Use one consolidated SPF TXT record only. Add other senders to this same record if needed.'
  },
  {
    id: 'dmarc_monitoring',
    type: 'TXT',
    name: '_dmarc',
    value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}; adkim=s; aspf=s`,
    ttl: 'Auto',
    required: true,
    note: `Create dmarc@${domain} as a mailbox, alias, group, or monitored destination before relying on reports.`
  },
  {
    id: 'google_dkim',
    type: 'TXT',
    name: 'google._domainkey',
    value: '<paste the DKIM TXT value generated in Google Admin console>',
    ttl: 'Auto',
    required: true,
    manual_value_required: true,
    note: 'Generate the value in Google Admin > Gmail authentication, then paste the exact TXT value in Cloudflare DNS.'
  }
];

const references = [
  {
    label: 'Google Workspace MX setup',
    url: 'https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace'
  },
  {
    label: 'Google Workspace SPF setup',
    url: 'https://knowledge.workspace.google.com/admin/security/set-up-spf'
  },
  {
    label: 'Google Workspace DMARC setup',
    url: 'https://knowledge.workspace.google.com/admin/security/set-up-dmarc'
  }
];

async function resolveRecords(kind, name) {
  try {
    if (kind === 'mx') return await dns.resolveMx(name);
    if (kind === 'txt') return (await dns.resolveTxt(name)).map((parts) => parts.join(''));
    if (kind === 'cname') return await dns.resolveCname(name);
    throw new Error(`Unsupported DNS record kind: ${kind}`);
  } catch (error) {
    if (['ENODATA', 'ENOTFOUND', 'ENODOMAIN', 'SERVFAIL', 'NOTFOUND'].includes(error.code)) {
      return [];
    }
    throw error;
  }
}

function normalizeHost(value) {
  return String(value || '').trim().toLowerCase().replace(/\.$/, '');
}

function normalizeTxt(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasGoogleWorkspaceMx(mx) {
  const observed = new Set(mx.map((record) => normalizeHost(record.exchange)));
  return GOOGLE_MX_HOSTS.some((host) => observed.has(host));
}

function parseDmarcTags(record) {
  const tags = {};
  for (const part of String(record || '').split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || !rawValue.length) continue;
    tags[rawKey.trim().toLowerCase()] = rawValue.join('=').trim();
  }
  return tags;
}

const [mx, rootTxt, dmarcTxt, googleDkimTxt, googleDkimCname] = await Promise.all([
  resolveRecords('mx', domain),
  resolveRecords('txt', domain),
  resolveRecords('txt', `_dmarc.${domain}`),
  resolveRecords('txt', `google._domainkey.${domain}`),
  resolveRecords('cname', `google._domainkey.${domain}`)
]);

const spfRecords = rootTxt.map(normalizeTxt).filter((record) => /^v=spf1/i.test(record));
const dmarcRecords = dmarcTxt.map(normalizeTxt).filter((record) => /^v=DMARC1/i.test(record));
const dmarcTags = dmarcRecords.length === 1 ? parseDmarcTags(dmarcRecords[0]) : {};
const dkimRecords = [...googleDkimTxt.map(normalizeTxt), ...googleDkimCname.map(normalizeHost)];

const checks = [
  {
    id: 'mx',
    ok: mx.length > 0 && hasGoogleWorkspaceMx(mx),
    records: mx.map((record) => `${record.priority} ${normalizeHost(record.exchange)}`),
    expected: ['1 smtp.google.com'],
    reason: 'Domain must route inbound mail to Google Workspace before using an address on the domain.'
  },
  {
    id: 'spf',
    ok: spfRecords.length === 1 && /\binclude:_spf\.google\.com\b/i.test(spfRecords[0]),
    records: spfRecords,
    expected: ['v=spf1 include:_spf.google.com ~all'],
    reason: 'SPF must exist as one TXT record and authorize Google Workspace.'
  },
  {
    id: 'dmarc',
    ok: dmarcRecords.length === 1 &&
      ['none', 'quarantine', 'reject'].includes(String(dmarcTags.p || '').toLowerCase()) &&
      /^mailto:/i.test(String(dmarcTags.rua || '')),
    records: dmarcRecords,
    expected: [`v=DMARC1; p=none; rua=mailto:dmarc@${domain}; adkim=s; aspf=s`],
    reason: 'DMARC must exist with a valid policy and aggregate reporting destination before scaling outreach.'
  },
  {
    id: 'google_dkim',
    ok: dkimRecords.length > 0,
    records: dkimRecords,
    expected: ['google._domainkey TXT value generated in Google Admin console'],
    reason: 'Google DKIM must be generated in Google Admin and published in DNS.'
  }
];

const failures = checks.filter((check) => !check.ok);
const result = {
  ok: failures.length === 0,
  allow_missing: allowMissing,
  domain,
  sender_profile: 'google_workspace_manual_low_volume',
  checked_at: new Date().toISOString(),
  recommended_records: recommendedRecords,
  checks,
  references,
  failures: failures.map((check) => ({
    id: check.id,
    reason: check.reason,
    expected: check.expected
  }))
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0 && !allowMissing) {
  process.exit(1);
}
