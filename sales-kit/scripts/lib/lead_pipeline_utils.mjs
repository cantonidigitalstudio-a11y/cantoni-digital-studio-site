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

export function nextActionDateFrom(baseDate, daysToAdd) {
  const date = new Date(baseDate);
  if (Number.isNaN(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}
