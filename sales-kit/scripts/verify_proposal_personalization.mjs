import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  parseCsv,
  splitAuditField,
  VALID_SOLUTION_TYPES
} from './lib/lead_pipeline_utils.mjs';

const DEFAULT_CSV = 'sales-kit/lead-batches/2026-05-15-global-50/leads.csv';
const STATUSES_TO_CHECK = new Set([
  'READY_TO_CONTACT',
  'CONTACTED',
  'REPLIED',
  'QUOTE_IN_PROGRESS',
  'QUOTE_SENT',
  'FOLLOWUP_D3',
  'FOLLOWUP_D7',
  'CLOSED_WON',
  'CLOSED_LOST'
]);

const FORBIDDEN_GENERIC = /\b(?:placeholder|example\.com|tbd|dummy|lorem|template)\b|generic placeholder|todo:/i;
const FORBIDDEN_JARGON = /\b(?:CTA|hero|funnel|CRO|UX)\b/i;
const PRICE_PATTERN = /\b(?:EUR|USD|GBP|MXN|DOP|CAD|BRL|JPY|AED|SAR|INR|CNY|AUD|SGD|THB)\s*[\d.,]+|(?:€|\$|£|RD\$|MX\$|C\$|R\$|¥|د\.إ|ر\.س)\s*[\d.,]+/i;
const REVIEW_SIGNAL = /\b(?:google|maps|tripadvisor|booking|yelp|trustpilot|reviews?|recension|reseñas|avis|bewertung)\b/i;
const SOCIAL_SIGNAL = /\b(?:instagram|facebook|tiktok|youtube|linkedin|x\.com|twitter|social|none found|non trovato|no encontrado)\b/i;
const AI_SIGNAL = /\b(?:ai|ia|intelligen|intelligence|google|search|ricerca|visibility|visibil|answer|answers|maps)\b/i;

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function minLength(row, field, length, problems) {
  const value = String(row[field] || '').trim();
  if (value.length < length) problems.push(`${field}_too_short:${value.length}_min_${length}`);
  if (FORBIDDEN_GENERIC.test(value)) problems.push(`${field}_contains_generic_placeholder`);
}

function minPipe(row, field, count, problems, options = {}) {
  const values = splitAuditField(row[field]);
  const minItemLength = options.minItemLength ?? 35;
  if (values.length < count) problems.push(`${field}_requires_${count}_specific_items`);
  values.forEach((value, index) => {
    if (String(value).trim().length < minItemLength) problems.push(`${field}_${index + 1}_too_short`);
    if (FORBIDDEN_GENERIC.test(value)) problems.push(`${field}_${index + 1}_contains_generic_placeholder`);
    if (options.mustReferenceEvidence && !/https?:\/\/|browser|screenshot|google|maps|tmp\//i.test(value)) {
      problems.push(`${field}_${index + 1}_missing_evidence_reference`);
    }
  });
  return values;
}

function checkContains(row, field, pattern, label, problems) {
  if (!pattern.test(row[field] || '')) problems.push(`${field}_missing_${label}_signal`);
}

function validateRow(row, index) {
  const problems = [];
  if (!STATUSES_TO_CHECK.has(row.status)) return null;

  minLength(row, 'what_the_business_does', 70, problems);
  minLength(row, 'email_angle', 90, problems);
  minLength(row, 'solution_type_rationale', 100, problems);
  minLength(row, 'pricing_rationale', 100, problems);
  minLength(row, 'payment_readiness', 100, problems);
  minLength(row, 'current_domain_verified', 80, problems);
  minLength(row, 'mobile_experience_checked', 80, problems);
  minLength(row, 'contact_flow_checked', 80, problems);
  minLength(row, 'search_ai_visibility_checked', 100, problems);

  minPipe(row, 'top_3_issues_found', 3, problems);
  minPipe(row, 'top_3_improvements_proposed', 3, problems);
  minPipe(row, 'expected_business_impact_range', 3, problems, { minItemLength: 15 });
  minPipe(row, 'social_channels_checked', 2, problems, { minItemLength: 20 });
  minPipe(row, 'review_platforms_checked', 2, problems, { minItemLength: 20 });
  minPipe(row, 'competitors_checked', 2, problems, { minItemLength: 20 });
  minPipe(row, 'evidence_refs', 3, problems, { minItemLength: 8, mustReferenceEvidence: true });

  checkContains(row, 'social_channels_checked', SOCIAL_SIGNAL, 'social_channel', problems);
  checkContains(row, 'review_platforms_checked', REVIEW_SIGNAL, 'review_platform', problems);
  checkContains(row, 'search_ai_visibility_checked', AI_SIGNAL, 'search_or_ai_visibility', problems);

  if (!VALID_SOLUTION_TYPES.includes(row.recommended_solution_type)) {
    problems.push(`invalid_recommended_solution_type:${row.recommended_solution_type || 'EMPTY'}`);
  }
  if (FORBIDDEN_JARGON.test(row.email_angle || '')) {
    problems.push('email_angle_contains_client_unfriendly_jargon');
  }
  if (PRICE_PATTERN.test(row.email_angle || '')) {
    problems.push('email_angle_must_not_include_price');
  }
  if (!/browser|live|screenshot|google|maps/i.test(row.notes || '')) {
    problems.push('notes_must_reference_live_review_evidence');
  }

  return problems.length
    ? {
        row: index + 2,
        lead_id: row.lead_id,
        business_name: row.business_name,
        problems
      }
    : null;
}

async function run() {
  const csvFile = path.resolve(argValue('--csv', process.env.LEAD_PIPELINE_CSV || DEFAULT_CSV));
  const rows = parseCsv(await fs.readFile(csvFile, 'utf8'));
  const checkedRows = rows.filter((row) => STATUSES_TO_CHECK.has(row.status));
  const problems = rows.map(validateRow).filter(Boolean);

  console.log(
    JSON.stringify(
      {
        ok: problems.length === 0,
        file: csvFile,
        rows: rows.length,
        checked: checkedRows.length,
        standard: 'client_specific_proposal_v1',
        problems
      },
      null,
      2
    )
  );

  if (problems.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
