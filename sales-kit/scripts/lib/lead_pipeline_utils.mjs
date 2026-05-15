import fs from 'node:fs/promises';

export const VALID_STATUSES = [
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
];

export const REQUIRED_READY_FIELDS = [
  'lead_id',
  'business_name',
  'website',
  'email',
  'country',
  'preferred_language',
  'currency',
  'what_the_business_does',
  'top_3_issues_found',
  'top_3_improvements_proposed',
  'expected_business_impact_range',
  'recommended_package',
  'recommended_currency',
  'recommended_language',
  'email_angle',
  'notes'
];

export const REQUIRED_READY_AUDIT_FIELDS = [
  'audit_date',
  'current_domain_verified',
  'mobile_experience_checked',
  'contact_flow_checked',
  'social_channels_checked',
  'review_platforms_checked',
  'competitors_checked',
  'search_ai_visibility_checked',
  'evidence_refs'
];

export const REQUIRED_QUOTE_FIELDS = [
  ...REQUIRED_READY_FIELDS,
  ...REQUIRED_READY_AUDIT_FIELDS,
  'recommended_package_price',
  'timeline',
  'base_deliverables',
  'growth_deliverables',
  'monthly_deliverables',
  'pricing_rationale'
];

const EU_COUNTRIES = new Set([
  'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic', 'czechia', 'denmark',
  'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'ireland', 'italy', 'latvia',
  'lithuania', 'luxembourg', 'malta', 'netherlands', 'poland', 'portugal', 'romania', 'slovakia',
  'slovenia', 'spain', 'sweden'
]);

const COUNTRY_TO_LANGUAGE = {
  italy: 'it',
  spain: 'es',
  france: 'fr',
  germany: 'de',
  austria: 'de',
  portugal: 'pt',
  brazil: 'pt',
  japan: 'ja',
  china: 'zh',
  india: 'hi',
  'dominican republic': 'es',
  mexico: 'es',
  uae: 'en',
  'saudi arabia': 'ar',
  'united kingdom': 'en',
  uk: 'en',
  england: 'en',
  usa: 'en',
  'united states': 'en',
  'united states of america': 'en'
};

const COUNTRY_TO_CURRENCY = {
  italy: 'EUR',
  spain: 'EUR',
  france: 'EUR',
  germany: 'EUR',
  austria: 'EUR',
  portugal: 'EUR',
  'united kingdom': 'GBP',
  uk: 'GBP',
  england: 'GBP',
  usa: 'USD',
  'united states': 'USD',
  'united states of america': 'USD',
  canada: 'CAD',
  mexico: 'MXN',
  brazil: 'BRL',
  japan: 'JPY',
  india: 'INR',
  china: 'CNY',
  'dominican republic': 'DOP',
  uae: 'AED',
  'saudi arabia': 'SAR'
};

export function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      continue;
    }

    cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value !== '')) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = String(cols[index] || '').trim();
    });
    return obj;
  });
}

function escapeCsv(value) {
  const stringValue = String(value ?? '');
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function stringifyCsv(rows, headers) {
  const allHeaders = headers || Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const lines = [
    allHeaders.map(escapeCsv).join(','),
    ...rows.map((row) => allHeaders.map((header) => escapeCsv(row[header] || '')).join(','))
  ];
  return `${lines.join('\n')}\n`;
}

export async function readLeadPipeline(csvFile) {
  const raw = await fs.readFile(csvFile, 'utf8');
  return parseCsv(raw);
}

export async function writeLeadPipeline(csvFile, rows, headers) {
  await fs.writeFile(csvFile, stringifyCsv(rows, headers), 'utf8');
}

export function resolveLanguage(row) {
  const explicit = normalize(
    row.recommended_language || row.first_contact_language || row.current_quote_language || row.preferred_language
  );
  if (explicit) return explicit;
  const byCountry = COUNTRY_TO_LANGUAGE[normalize(row.country)];
  return byCountry || 'en';
}

export function resolveCurrency(row) {
  const explicit = String(
    row.recommended_currency || row.currency || ''
  ).trim().toUpperCase();
  if (explicit) return explicit;

  const country = normalize(row.country);
  if (COUNTRY_TO_CURRENCY[country]) return COUNTRY_TO_CURRENCY[country];
  if (EU_COUNTRIES.has(country)) return 'EUR';
  return 'USD';
}

export function splitAuditField(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function containsWeakAuditValue(value) {
  return /\b(?:placeholder|example\.com|todo|tbd|dummy|lorem)\b/i.test(String(value || ''));
}

function containsUnresolvedQuoteValue(value) {
  return /\b(?:partial|second-pass|not ready|hold:|to verify|da verificare|ricontrollare|pending)\b/i
    .test(String(value || ''));
}

function validateDateField(value, field) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${field}_must_be_iso_date`;
  return null;
}

function validatePipeCount(row, field, minimum, label) {
  const values = splitAuditField(row[field]);
  if (values.length < minimum) return `${label || field}_requires_${minimum}_items`;
  if (values.some(containsWeakAuditValue)) return `${label || field}_contains_placeholder`;
  return null;
}

export function validateReadyAuditEvidence(row) {
  const problems = [];
  const missing = REQUIRED_READY_AUDIT_FIELDS.filter((field) => !String(row[field] || '').trim());

  if (missing.length) problems.push(`missing_audit_required:${missing.join('|')}`);

  const dateProblem = row.audit_date ? validateDateField(row.audit_date, 'audit_date') : null;
  if (dateProblem) problems.push(dateProblem);

  [
    'current_domain_verified',
    'mobile_experience_checked',
    'contact_flow_checked',
    'search_ai_visibility_checked'
  ].forEach((field) => {
    const value = String(row[field] || '').trim();
    if (value && value.length < 25) problems.push(`${field}_too_short`);
    if (containsWeakAuditValue(value)) problems.push(`${field}_contains_placeholder`);
  });

  [
    validatePipeCount(row, 'social_channels_checked', 2, 'social_channels'),
    validatePipeCount(row, 'review_platforms_checked', 2, 'review_platforms'),
    validatePipeCount(row, 'competitors_checked', 2, 'competitors'),
    validatePipeCount(row, 'evidence_refs', 2, 'evidence_refs')
  ].filter(Boolean).forEach((problem) => problems.push(problem));

  if (row.evidence_refs && !/https?:\/\/|screenshot|browser|qa|tmp\//i.test(row.evidence_refs)) {
    problems.push('evidence_refs_must_reference_urls_or_screenshots');
  }

  return problems;
}

export function resolveMarketSummary(row) {
  const explicit = [
    row.market_scope_summary,
    row.operating_market,
    row.service_area_summary,
    row.audited_market_summary,
    row.market_served,
    row.target_market_summary,
    row.geo_scope_summary
  ].map((value) => String(value || '').trim()).find(Boolean);

  if (explicit) return explicit;

  const parts = [row.city, row.country].map((value) => String(value || '').trim()).filter(Boolean);
  return parts.join(', ');
}

export function validateLeadForQueue(row) {
  const missing = REQUIRED_READY_FIELDS.filter((field) => !String(row[field] || '').trim());
  const problems = [];

  if (!VALID_STATUSES.includes(row.status)) {
    problems.push(`invalid_status:${row.status || 'EMPTY'}`);
  }

  if (row.status === 'READY_TO_CONTACT' && missing.length) {
    problems.push(`missing_required:${missing.join('|')}`);
  }

  if (row.status === 'READY_TO_CONTACT') {
    problems.push(...validateReadyAuditEvidence(row));
  }

  const currency = resolveCurrency(row);
  const language = resolveLanguage(row);
  if (!currency) problems.push('currency_unresolved');
  if (!language) problems.push('language_unresolved');

  return {
    ok: problems.length === 0,
    missing,
    problems,
    language,
    currency
  };
}

export function validateLeadForQuote(row) {
  const missing = REQUIRED_QUOTE_FIELDS.filter((field) => !String(row[field] || '').trim());
  const problems = [];
  const allowedQuoteStatuses = new Set(['READY_TO_CONTACT', 'REPLIED', 'QUOTE_IN_PROGRESS']);

  if (!allowedQuoteStatuses.has(row.status)) {
    problems.push(`quote_status_not_allowed:${row.status || 'EMPTY'}`);
  }

  if (missing.length) problems.push(`missing_quote_required:${missing.join('|')}`);

  problems.push(...validateReadyAuditEvidence(row));

  REQUIRED_READY_AUDIT_FIELDS.forEach((field) => {
    if (containsUnresolvedQuoteValue(row[field])) problems.push(`${field}_contains_unresolved_quote_note`);
  });

  if (splitAuditField(row.top_3_issues_found).length < 3) problems.push('quote_requires_3_issues');
  if (splitAuditField(row.top_3_improvements_proposed).length < 3) problems.push('quote_requires_3_improvements');
  if (splitAuditField(row.expected_business_impact_range).length < 2) problems.push('quote_requires_2_business_impacts');

  if (String(row.pricing_rationale || '').trim().length < 70) {
    problems.push('pricing_rationale_too_short');
  }

  return {
    ok: problems.length === 0,
    missing,
    problems,
    language: resolveLanguage(row),
    currency: resolveCurrency(row)
  };
}

export function nextActionDateFrom(baseDate, daysToAdd) {
  const date = new Date(baseDate);
  if (Number.isNaN(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}
