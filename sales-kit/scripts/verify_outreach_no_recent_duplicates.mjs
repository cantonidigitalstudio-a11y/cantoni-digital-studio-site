import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseCsv, normalize } from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const defaultCsv = path.resolve(salesKitDir, 'lead-batches/2026-05-15-global-50/leads.csv');

const CONTACTED_STATUSES = new Set([
  'CONTACTED',
  'REPLIED',
  'QUOTE_IN_PROGRESS',
  'QUOTE_SENT',
  'FOLLOWUP_D3',
  'FOLLOWUP_D7',
  'CLOSED_WON',
  'CLOSED_LOST'
]);

function argValue(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function emailKey(value) {
  return normalize(value);
}

function domainKey(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = /^https?:\/\//i.test(text) ? new URL(text) : new URL(`https://${text}`);
    return url.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return text.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
  }
}

async function findLeadCsvFiles(root) {
  const out = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'branded' || entry.name === 'queue') continue;
        await walk(full);
      } else if (entry.name === 'leads.csv') {
        out.push(full);
      }
    }
  }
  await walk(path.join(root, 'lead-batches'));
  return out.sort();
}

async function readRows(file) {
  const text = await fs.readFile(file, 'utf8');
  return parseCsv(text).map((row, index) => ({
    ...row,
    __file: file,
    __row: index + 2
  }));
}

function describe(row) {
  return {
    lead_id: row.lead_id,
    business_name: row.business_name,
    email: row.email,
    website: row.website,
    status: row.status,
    file: path.relative(process.cwd(), row.__file),
    row: row.__row
  };
}

async function run() {
  const currentCsv = path.resolve(argValue('--csv', process.env.LEAD_BATCH_CSV || process.env.LEAD_PIPELINE_CSV || defaultCsv));
  const includeContacted = hasFlag('--include-contacted');
  const files = await findLeadCsvFiles(salesKitDir);
  const currentRows = await readRows(currentCsv);
  const archiveRows = (await Promise.all(files.map(readRows))).flat();
  const failures = [];
  const contactedByEmail = new Map();
  const contactedByDomain = new Map();

  for (const row of archiveRows) {
    if (!CONTACTED_STATUSES.has(row.status)) continue;
    const email = emailKey(row.email);
    const domain = domainKey(row.website);
    if (email) {
      if (!contactedByEmail.has(email)) contactedByEmail.set(email, []);
      contactedByEmail.get(email).push(row);
    }
    if (domain) {
      if (!contactedByDomain.has(domain)) contactedByDomain.set(domain, []);
      contactedByDomain.get(domain).push(row);
    }
  }

  const candidates = currentRows.filter((row) => row.status === 'READY_TO_CONTACT' || (includeContacted && CONTACTED_STATUSES.has(row.status)));
  const seenReadyEmail = new Map();
  const seenReadyDomain = new Map();

  for (const row of candidates) {
    const email = emailKey(row.email);
    const domain = domainKey(row.website);

    if (email) {
      const previous = (contactedByEmail.get(email) || []).filter((hit) => hit.__file !== row.__file || hit.__row !== row.__row);
      if (previous.length) failures.push({ type: 'email_already_contacted', candidate: describe(row), previous: previous.map(describe) });
      if (seenReadyEmail.has(email)) failures.push({ type: 'email_duplicate_inside_current_batch', candidate: describe(row), previous: describe(seenReadyEmail.get(email)) });
      seenReadyEmail.set(email, row);
    }

    if (domain) {
      const previous = (contactedByDomain.get(domain) || []).filter((hit) => hit.__file !== row.__file || hit.__row !== row.__row);
      if (previous.length) failures.push({ type: 'domain_already_contacted', candidate: describe(row), previous: previous.map(describe) });
      if (seenReadyDomain.has(domain)) failures.push({ type: 'domain_duplicate_inside_current_batch', candidate: describe(row), previous: describe(seenReadyDomain.get(domain)) });
      seenReadyDomain.set(domain, row);
    }
  }

  console.log(JSON.stringify({
    ok: failures.length === 0,
    file: path.relative(process.cwd(), currentCsv),
    candidates: candidates.length,
    archived_csv_files: files.length,
    standard: 'outreach_no_duplicate_ready_v1',
    failures
  }, null, 2));

  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
