import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseCsv,
  validateLeadForQueue,
  resolveCurrency,
  resolveLanguage,
  splitAuditField
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const batchDir = path.join(rootDir, 'lead-batches/2026-05-11-global-starter');
const csvFile = process.env.LEAD_BATCH_CSV
  ? path.resolve(process.env.LEAD_BATCH_CSV)
  : path.join(batchDir, 'leads.csv');

const allowedStatuses = new Set([
  'RESEARCH_PENDING',
  'RESEARCH_VERIFIED',
  'READY_TO_CONTACT'
]);

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasPlaceholder(value) {
  return /placeholder|example\.com|todo|tbd|lorem|dummy/i.test(String(value || ''));
}

function validateResearchRow(row) {
  const problems = [];
  if (!row.lead_id) problems.push('missing:lead_id');
  if (!row.business_name) problems.push('missing:business_name');
  if (!row.country) problems.push('missing:country');
  if (!row.website) problems.push('missing:website');
  if (!row.status) problems.push('missing:status');
  if (row.status && !allowedStatuses.has(row.status)) problems.push(`invalid_batch_status:${row.status}`);
  if (Object.values(row).some(hasPlaceholder)) problems.push('placeholder_detected');
  if (row.website && !/^https?:\/\//i.test(row.website)) problems.push('website_must_be_absolute_url');
  if (row.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) problems.push('invalid_email');

  const language = resolveLanguage(row);
  const currency = resolveCurrency(row);
  if (!language) problems.push('language_unresolved');
  if (!currency) problems.push('currency_unresolved');

  if (row.status === 'READY_TO_CONTACT') {
    const validation = validateLeadForQueue(row);
    if (!validation.ok) problems.push(...validation.problems);
    if (splitAuditField(row.top_3_issues_found).length < 3) problems.push('ready_requires_3_issues');
    if (splitAuditField(row.top_3_improvements_proposed).length < 3) problems.push('ready_requires_3_improvements');
    if (!String(row.notes || '').toLowerCase().includes('live')) problems.push('ready_notes_must_include_live_verification');
  }

  return problems;
}

async function run() {
  const raw = await fs.readFile(csvFile, 'utf8');
  const rows = parseCsv(raw);
  const problems = [];
  const websites = new Set();
  const emails = new Set();

  if (rows.length > 20) {
    problems.push({ batch: 'too_many_rows', count: rows.length, max: 20 });
  }

  rows.forEach((row, index) => {
    const rowProblems = validateResearchRow(row);
    const website = normalize(row.website);
    const email = normalize(row.email);

    if (website) {
      if (websites.has(website)) rowProblems.push('duplicate_website');
      websites.add(website);
    }
    if (email) {
      if (emails.has(email)) rowProblems.push('duplicate_email');
      emails.add(email);
    }

    if (rowProblems.length) {
      problems.push({
        row: index + 2,
        lead_id: row.lead_id,
        business_name: row.business_name,
        problems: rowProblems
      });
    }
  });

  console.log(JSON.stringify({
    ok: problems.length === 0,
    file: csvFile,
    rows: rows.length,
    ready_to_contact: rows.filter((row) => row.status === 'READY_TO_CONTACT').length,
    problems
  }, null, 2));

  if (problems.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
