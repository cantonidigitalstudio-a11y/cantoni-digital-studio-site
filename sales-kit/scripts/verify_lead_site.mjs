import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readLeadPipeline } from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const defaultCsvFile = path.resolve(salesKitDir, 'lead_pipeline.csv');

const IGNORED_SIGNAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  'google.com',
  'googleapis.com',
  'gstatic.com',
  'googletagmanager.com',
  'google-analytics.com',
  'w3.org',
  'schema.org',
  'wordpress.org',
  'wp.com',
  'cloudflare.com',
  'cloudfront.net',
  'jsdelivr.net',
  'fontawesome.com'
];

const COMMON_TLDS = new Set([
  'ae', 'agency', 'app', 'ar', 'at', 'be', 'biz', 'br', 'ca', 'ch', 'clinic', 'club', 'cn', 'co',
  'com', 'consulting', 'de', 'dental', 'edu', 'es', 'eu', 'fr', 'gov', 'in', 'info', 'io', 'it',
  'jp', 'law', 'me', 'media', 'mx', 'net', 'nl', 'online', 'org', 'pro', 'pt', 'ru', 'shop',
  'store', 'studio', 'travel', 'uk', 'us'
]);

const FILE_EXTENSIONS = new Set([
  'avif', 'bmp', 'css', 'gif', 'ico', 'jpeg', 'jpg', 'js', 'json', 'mp4', 'pdf', 'png', 'svg',
  'webm', 'webp', 'woff', 'woff2', 'xml'
]);

const GENERIC_NAME_TOKENS = new Set([
  'com', 'email', 'http', 'https', 'info', 'mail', 'net', 'org', 'www',
  'agenzia', 'avvocato', 'clinic', 'clinica', 'dental', 'dentistico', 'digital', 'firm', 'group',
  'hotel', 'immobiliare', 'legale', 'limited', 'milano', 'online', 'platform', 'srl', 'studio',
  'website'
]);

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] || null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function safeUrl(value, base) {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function hostOf(value) {
  const parsed = safeUrl(value);
  return parsed ? parsed.hostname.replace(/^www\./i, '').toLowerCase() : '';
}

function isIgnoredHost(host) {
  const normalized = String(host || '').replace(/^www\./i, '').toLowerCase();
  return IGNORED_SIGNAL_HOSTS.some((ignored) => normalized === ignored || normalized.endsWith(`.${ignored}`));
}

function isLikelyBusinessHost(host) {
  const parts = String(host || '').replace(/^www\./i, '').toLowerCase().split('.').filter(Boolean);
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1];
  if (FILE_EXTENSIONS.has(tld)) return false;
  return COMMON_TLDS.has(tld);
}

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !GENERIC_NAME_TOKENS.has(token));
}

function buildIdentityTokens({ name, inputHost, lead }) {
  const values = [
    name,
    inputHost,
    lead && lead.business_name,
    lead && lead.email ? String(lead.email).split('@').pop() : ''
  ];
  return Array.from(new Set(values.flatMap(tokenize)));
}

function isPossibleAlternateDomain(host, identityTokens) {
  const normalized = String(host || '').replace(/^www\./i, '').toLowerCase();
  if (!isLikelyBusinessHost(normalized)) return false;
  return identityTokens.some((token) => normalized.includes(token));
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractTitle(html) {
  const match = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities(match ? match[1].replace(/\s+/g, ' ').trim() : '');
}

function extractMetaContent(html, matcher) {
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!matcher(tag)) continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (content) return decodeEntities(content[1].trim());
  }
  return '';
}

function extractCanonical(html) {
  const links = String(html || '').match(/<link\b[^>]*>/gi) || [];
  for (const link of links) {
    if (!/\brel\s*=\s*["'][^"']*\bcanonical\b/i.test(link)) continue;
    const href = link.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    if (href) return decodeEntities(href[1].trim());
  }
  return '';
}

function collectHrefSignals(html, baseUrl) {
  const counts = new Map();
  const hrefPattern = /\bhref\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = hrefPattern.exec(String(html || '')))) {
    const raw = decodeEntities(match[1].trim());
    if (!raw || /^#|^mailto:|^tel:|^javascript:/i.test(raw)) continue;
    const parsed = safeUrl(raw, baseUrl);
    if (!parsed || !/^https?:$/i.test(parsed.protocol)) continue;
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (!host || isIgnoredHost(host) || !isLikelyBusinessHost(host)) continue;
    counts.set(host, (counts.get(host) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([host, count]) => ({ host, count }))
    .sort((a, b) => b.count - a.count || a.host.localeCompare(b.host));
}

function collectBareDomainSignals(html) {
  const text = String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const counts = new Map();
  const domainPattern = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;
  let match;

  while ((match = domainPattern.exec(text))) {
    const host = match[0].replace(/^www\./i, '').toLowerCase();
    if (/^2f|\.2f|^fwww\.|^2fwww\./i.test(host)) continue;
    if (!host || isIgnoredHost(host) || !isLikelyBusinessHost(host)) continue;
    counts.set(host, (counts.get(host) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([host, count]) => ({ host, count }))
    .sort((a, b) => b.count - a.count || a.host.localeCompare(b.host));
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'CantoniDigitalStudioLeadVerifier/1.0 (+https://cantonidigitalstudio.com)'
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveLead() {
  const leadId = getArgValue('--lead-id');
  const directUrl = getArgValue('--url');
  const csvFile = path.resolve(process.cwd(), getArgValue('--csv') || defaultCsvFile);

  if (leadId) {
    const leads = await readLeadPipeline(csvFile);
    const lead = leads.find((row) => row.lead_id === leadId);
    if (!lead) throw new Error(`Lead not found: ${leadId}`);
    return {
      lead,
      name: lead.business_name || leadId,
      inputUrl: normalizeUrl(lead.website),
      source: csvFile
    };
  }

  if (!directUrl) throw new Error('Use --lead-id <LEAD_ID> or --url <URL>');
  return {
    lead: null,
    name: getArgValue('--name') || directUrl,
    inputUrl: normalizeUrl(directUrl),
    source: 'direct-url'
  };
}

function buildReport({ lead, name, inputUrl, response, html, error }) {
  const checkedAt = new Date().toISOString();
  const inputHost = hostOf(inputUrl);
  const finalUrl = response ? response.url : '';
  const finalHost = hostOf(finalUrl);
  const canonicalRaw = html ? extractCanonical(html) : '';
  const canonicalUrl = canonicalRaw ? String(safeUrl(canonicalRaw, finalUrl) || canonicalRaw) : '';
  const canonicalHost = hostOf(canonicalUrl);
  const ogRaw = html ? extractMetaContent(html, (tag) => /\bproperty\s*=\s*["']og:url["']/i.test(tag)) : '';
  const ogUrl = ogRaw ? String(safeUrl(ogRaw, finalUrl) || ogRaw) : '';
  const ogHost = hostOf(ogUrl);
  const title = html ? extractTitle(html) : '';
  const hrefSignals = html ? collectHrefSignals(html, finalUrl || inputUrl) : [];
  const bareDomainSignals = html ? collectBareDomainSignals(html) : [];
  const signalHosts = new Map();
  const identityTokens = buildIdentityTokens({ name, inputHost, lead });

  [...hrefSignals, ...bareDomainSignals].forEach((signal) => {
    if (!signal.host || signal.host === inputHost || signal.host === finalHost || signal.host === canonicalHost) return;
    const current = signalHosts.get(signal.host) || 0;
    signalHosts.set(signal.host, current + signal.count);
  });

  const candidateDomains = Array.from(signalHosts.entries())
    .map(([host, count]) => ({ host, count }))
    .sort((a, b) => b.count - a.count || a.host.localeCompare(b.host))
    .slice(0, 12);
  const alternateDomainCandidates = candidateDomains
    .filter((item) => isPossibleAlternateDomain(item.host, identityTokens))
    .slice(0, 6);

  const issues = [];
  const reviewFlags = [];

  if (error) issues.push(`fetch_failed:${error}`);
  if (response && (response.status < 200 || response.status >= 400)) issues.push(`http_status:${response.status}`);
  if (inputHost && finalHost && inputHost !== finalHost) reviewFlags.push(`redirect_host_changed:${inputHost}->${finalHost}`);
  if (canonicalHost && finalHost && canonicalHost !== finalHost) reviewFlags.push(`canonical_host_differs:${canonicalHost}`);
  if (ogHost && finalHost && ogHost !== finalHost) reviewFlags.push(`og_url_host_differs:${ogHost}`);
  if (alternateDomainCandidates.length) reviewFlags.push(`possible_alternate_client_domain:${alternateDomainCandidates.map((item) => item.host).join('|')}`);
  if (!title && !error) reviewFlags.push('missing_page_title');

  return {
    ok: issues.length === 0,
    quoteReady: issues.length === 0 && reviewFlags.length === 0,
    checkedAt,
    lead: lead ? {
      lead_id: lead.lead_id || '',
      business_name: lead.business_name || '',
      website: lead.website || '',
      status: lead.status || '',
      email: lead.email || ''
    } : null,
    name,
    inputUrl,
    finalUrl,
    status: response ? response.status : null,
    title,
    canonicalUrl,
    ogUrl,
    inputHost,
    finalHost,
    canonicalHost,
    ogHost,
    candidateDomains,
    alternateDomainCandidates,
    issues,
    reviewFlags,
    recommendation: issues.length
      ? 'Do not generate or send a proposal until the website can be opened and rechecked manually.'
      : reviewFlags.length
        ? 'Manual review required before proposal: verify whether the final/canonical/alternate domain is the real current website.'
        : 'Domain signals are aligned. The lead can move to content-level audit before proposal generation.'
  };
}

async function run() {
  const { lead, name, inputUrl } = await resolveLead();
  const reportPath = getArgValue('--report');
  const timeoutMs = Number(getArgValue('--timeout-ms') || 15000);
  let response = null;
  let html = '';
  let error = '';

  try {
    response = await fetchWithTimeout(inputUrl, timeoutMs);
    const contentType = response.headers.get('content-type') || '';
    html = await response.text();
    if (contentType && !/html|xml|text/i.test(contentType)) {
      error = `unexpected_content_type:${contentType}`;
    }
  } catch (err) {
    error = err && err.name === 'AbortError' ? 'timeout' : String(err && err.message ? err.message : err);
  }

  const report = buildReport({ lead, name, inputUrl, response, html, error });

  if (reportPath) {
    const absoluteReportPath = path.resolve(process.cwd(), reportPath);
    await fs.mkdir(path.dirname(absoluteReportPath), { recursive: true });
    await fs.writeFile(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify(report, null, 2));

  if (hasFlag('--strict') && !report.quoteReady) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
