import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  parseCsv,
  resolveCurrency,
  resolveLanguage,
  splitAuditField,
  validateLeadForQueue
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const defaultBatchCsv = path.resolve(salesKitDir, 'lead-batches/2026-05-15-global-50/leads.csv');
const marketRulesFile = path.resolve(salesKitDir, 'market_locale_rules.json');

const ALL_STATUSES = new Set([
  'RESEARCH_PENDING',
  'RESEARCH_VERIFIED',
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

const BLOCKED_GENERIC_PATTERNS = [
  /\bplaceholder\b/i,
  /\bexample\.com\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
  /\bdummy\b/i,
  /\blorem\b/i
];

const TECHNICAL_JARGON_PATTERNS = [
  /\b(?:CTA|hero|funnel|CRO|UX)\b/
];

const PRICE_PATTERNS = [
  /\b(?:EUR|USD|GBP|MXN|DOP|CAD|BRL|JPY|AED|SAR|INR|CNY)\s*[\d.,]+/i,
  /(?:€|\$|£|RD\$|MX\$|C\$|R\$|¥|د\.إ|ر\.س)\s*[\d.,]+/
];

const REVIEW_SIGNAL_PATTERN = /\b(?:google|maps|tripadvisor|booking|yelp|trustpilot|reviews?|recension|reseñas|avis|bewertung)\b/i;
const SOCIAL_SIGNAL_PATTERN = /\b(?:instagram|facebook|tiktok|youtube|linkedin|x\.com|twitter|social|none found|non trovato|no encontrado)\b/i;

function getArgValue(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function countryRule(country, rules) {
  const key = normalize(country);
  return rules.countries?.[key] || null;
}

function hasBadGenericCopy(value) {
  return BLOCKED_GENERIC_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function hasTechnicalJargon(value) {
  return TECHNICAL_JARGON_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function hasPrice(value) {
  return PRICE_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function validateUrl(value) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return 'website_must_be_absolute_url';
  try {
    new URL(value);
    return null;
  } catch {
    return 'website_invalid_url';
  }
}

function validateEmail(value) {
  if (!value) return null;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? null : 'invalid_email';
}

function requiresExactMarket(row) {
  return ['READY_TO_CONTACT', ...CONTACTED_STATUSES].includes(row.status);
}

function validateMarket(row, rules) {
  const problems = [];
  const rule = countryRule(row.country, rules);
  const language = resolveLanguage(row);
  const currency = resolveCurrency(row);

  if (!language) problems.push('language_unresolved');
  if (!currency) problems.push('currency_unresolved');

  if (rule && requiresExactMarket(row)) {
    if (language !== rule.language) {
      problems.push(`language_mismatch:${language || 'EMPTY'}_expected_${rule.language}`);
    }
    if (currency !== rule.currency) {
      problems.push(`currency_mismatch:${currency || 'EMPTY'}_expected_${rule.currency}`);
    }
    ['preferred_language', 'first_contact_language', 'current_quote_language', 'recommended_language'].forEach((field) => {
      if (row[field] && normalize(row[field]) !== rule.language) {
        problems.push(`${field}_mismatch:${row[field]}_expected_${rule.language}`);
      }
    });
    ['currency', 'recommended_currency'].forEach((field) => {
      if (row[field] && String(row[field]).trim().toUpperCase() !== rule.currency) {
        problems.push(`${field}_mismatch:${row[field]}_expected_${rule.currency}`);
      }
    });
  }

  return problems;
}

function validateReadyDepth(row) {
  const problems = [];
  const issues = splitAuditField(row.top_3_issues_found);
  const improvements = splitAuditField(row.top_3_improvements_proposed);
  const evidenceRefs = splitAuditField(row.evidence_refs);

  if (issues.length < 3) problems.push('ready_requires_3_issues');
  if (improvements.length < 3) problems.push('ready_requires_3_improvements');
  if (evidenceRefs.length < 3) problems.push('ready_requires_3_evidence_refs');
  if (!REVIEW_SIGNAL_PATTERN.test(row.review_platforms_checked || '')) {
    problems.push('review_platforms_must_include_google_maps_or_review_source');
  }
  if (!SOCIAL_SIGNAL_PATTERN.test(row.social_channels_checked || '')) {
    problems.push('social_channels_must_be_checked');
  }
  if (!/mobile|telefono|móvil|celular|phone|smartphone/i.test(row.mobile_experience_checked || '')) {
    problems.push('mobile_check_must_be_explicit');
  }
  if (!/contact|contatt|contacto|booking|prenot|lead|form|whatsapp|email/i.test(row.contact_flow_checked || '')) {
    problems.push('contact_flow_must_be_explicit');
  }
  if (!/google|search|ai|intelligen|visibility|visibil|answer|ricerca/i.test(row.search_ai_visibility_checked || '')) {
    problems.push('search_ai_visibility_must_be_explicit');
  }
  if (!String(row.notes || '').toLowerCase().includes('browser')) {
    problems.push('ready_notes_must_include_browser_or_live_review');
  }
  if (hasBadGenericCopy(row.email_angle) || hasTechnicalJargon(row.email_angle)) {
    problems.push('email_angle_contains_generic_or_technical_language');
  }
  if (hasPrice(row.email_angle)) {
    problems.push('first_email_angle_must_not_include_prices');
  }

  return problems;
}

function validateRow(row, index, rules) {
  const problems = [];
  if (!row.lead_id) problems.push('missing:lead_id');
  if (!row.business_name) problems.push('missing:business_name');
  if (!row.country) problems.push('missing:country');
  if (!row.status) problems.push('missing:status');
  if (row.status && !ALL_STATUSES.has(row.status)) problems.push(`invalid_status:${row.status}`);
  if (Object.values(row).some(hasBadGenericCopy)) problems.push('placeholder_or_forbidden_generic_copy_detected');

  const urlProblem = validateUrl(row.website);
  if (urlProblem) problems.push(urlProblem);
  const emailProblem = validateEmail(row.email);
  if (emailProblem) problems.push(emailProblem);
  problems.push(...validateMarket(row, rules));

  if (row.status === 'READY_TO_CONTACT') {
    const validation = validateLeadForQueue(row);
    if (!validation.ok) problems.push(...validation.problems);
    problems.push(...validateReadyDepth(row));
  }

  if (CONTACTED_STATUSES.has(row.status)) {
    if (!/sent|inviata|inviato|replied|quote|follow/i.test(row.last_action || '')) {
      problems.push('contacted_requires_sent_or_reply_last_action');
    }
    if (['CONTACTED', 'FOLLOWUP_D3', 'FOLLOWUP_D7'].includes(row.status) && !/^\d{4}-\d{2}-\d{2}$/.test(row.next_action_date || '')) {
      problems.push('contacted_requires_next_action_date');
    }
    if (/nessuna email inviata|not sent|no email sent/i.test(row.notes || '')) {
      problems.push('contacted_notes_contradict_send_state');
    }
  }

  return problems.length
    ? { row: index + 2, lead_id: row.lead_id, business_name: row.business_name, problems }
    : null;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function run() {
  const csvFile = path.resolve(getArgValue('--csv', process.env.LEAD_BATCH_CSV || defaultBatchCsv));
  const maxReadyPerRun = Number(getArgValue('--max-ready-per-run', process.env.MAX_READY_PER_RUN || 10));
  const maxRows = Number(getArgValue('--max-rows', process.env.MAX_BATCH_ROWS || 60));
  const rules = await readJson(marketRulesFile);
  const rows = parseCsv(await fs.readFile(csvFile, 'utf8'));
  const websites = new Set();
  const emails = new Set();
  const problems = [];

  if (rows.length > maxRows) {
    problems.push({ batch: 'too_many_rows', count: rows.length, max: maxRows });
  }

  rows.forEach((row, index) => {
    const rowProblems = validateRow(row, index, rules);
    const website = normalize(row.website);
    const email = normalize(row.email);
    if (website) {
      if (websites.has(website)) {
        (rowProblems || problems[problems.push({ row: index + 2, lead_id: row.lead_id, business_name: row.business_name, problems: [] }) - 1]).problems.push('duplicate_website');
      }
      websites.add(website);
    }
    if (email) {
      if (emails.has(email)) {
        (rowProblems || problems[problems.push({ row: index + 2, lead_id: row.lead_id, business_name: row.business_name, problems: [] }) - 1]).problems.push('duplicate_email');
      }
      emails.add(email);
    }
    if (rowProblems) problems.push(rowProblems);
  });

  const ready = rows.filter((row) => row.status === 'READY_TO_CONTACT');
  if (ready.length > maxReadyPerRun) {
    problems.push({
      batch: 'ready_to_contact_too_many_for_one_run',
      count: ready.length,
      max: maxReadyPerRun,
      reason: 'protect deliverability and review quality'
    });
  }

  const byCountry = rows.reduce((acc, row) => {
    const key = row.country || 'EMPTY';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byCurrency = rows.reduce((acc, row) => {
    const key = resolveCurrency(row) || 'EMPTY';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byLanguage = rows.reduce((acc, row) => {
    const key = resolveLanguage(row) || 'EMPTY';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    ok: problems.length === 0,
    file: csvFile,
    rows: rows.length,
    ready_to_contact: ready.length,
    contacted_or_later: rows.filter((row) => CONTACTED_STATUSES.has(row.status)).length,
    by_country: byCountry,
    by_language: byLanguage,
    by_currency: byCurrency,
    problems
  }, null, 2));

  if (problems.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
