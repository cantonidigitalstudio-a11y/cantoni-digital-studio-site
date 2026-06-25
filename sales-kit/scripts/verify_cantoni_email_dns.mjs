import dns from 'node:dns/promises';

const domain = process.env.CANTONI_EMAIL_DOMAIN || 'cantonidigitalstudio.com';
const allowMissing = process.argv.includes('--allow-missing');

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

function includesPrefix(records, prefix) {
  return records.some((record) => String(record).trim().toLowerCase().startsWith(prefix.toLowerCase()));
}

const [mx, rootTxt, dmarcTxt, googleDkimTxt, googleDkimCname] = await Promise.all([
  resolveRecords('mx', domain),
  resolveRecords('txt', domain),
  resolveRecords('txt', `_dmarc.${domain}`),
  resolveRecords('txt', `google._domainkey.${domain}`),
  resolveRecords('cname', `google._domainkey.${domain}`)
]);

const checks = [
  {
    id: 'mx',
    ok: mx.length > 0,
    records: mx.map((record) => `${record.priority} ${record.exchange}`),
    reason: 'Domain must have inbound mail routing before using an address on the domain.'
  },
  {
    id: 'spf',
    ok: includesPrefix(rootTxt, 'v=spf1'),
    records: rootTxt.filter((record) => /^v=spf1/i.test(record)),
    reason: 'SPF must authorize the chosen mail sender.'
  },
  {
    id: 'dmarc',
    ok: includesPrefix(dmarcTxt, 'v=DMARC1'),
    records: dmarcTxt.filter((record) => /^v=DMARC1/i.test(record)),
    reason: 'DMARC must exist at least in monitoring mode before scaling cold outreach.'
  },
  {
    id: 'google_dkim',
    ok: googleDkimTxt.length > 0 || googleDkimCname.length > 0,
    records: [...googleDkimTxt, ...googleDkimCname],
    reason: 'Google DKIM must be present if Google Workspace is the sender.'
  }
];

const failures = checks.filter((check) => !check.ok);
const result = {
  ok: failures.length === 0,
  allow_missing: allowMissing,
  domain,
  checked_at: new Date().toISOString(),
  checks,
  failures: failures.map((check) => ({
    id: check.id,
    reason: check.reason
  }))
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0 && !allowMissing) {
  process.exit(1);
}
