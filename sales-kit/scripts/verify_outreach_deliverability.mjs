import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_QUEUE = 'sales-kit/generated/outreach-fixtures/sanitized-starter/outreach_queue_micro.json';
const BRAND_EMAIL = 'cantonidigitalstudio@gmail.com';
const BRAND_SITE = 'https://cantonidigitalstudio.com';

const SPAMMY_WORDS = /\b(?:garantito|garantita|gratis|gratuito|offerta speciale|ultimo giorno|clicca subito|100%|raddoppia|triplica|guadagna|guaranteed|free offer|limited time|act now|double your|triple your|make money|oferta especial|gratis|garantizado)\b/i;
const CLIENT_JARGON = /\b(?:CTA|hero|funnel|CRO|UX|scope|wireframe|backend|frontend)\b/i;
const PRICE_PATTERN = /\b(?:EUR|USD|GBP|MXN|DOP|CAD|BRL|JPY|AED|SAR|INR|CNY|AUD|SGD|THB)\s*[\d.,]+|(?:€|\$|£|RD\$|MX\$|C\$|R\$|¥|د\.إ|ر\.س)\s*[\d.,]+/i;
const TRACKING_PATTERN = /\b(?:utm_source|utm_medium|utm_campaign|fbclid|gclid|mc_cid|mc_eid|open_pixel|tracking_pixel)\b/i;
const HTML_ASSET_PATTERN = /<\s*(?:img|table|style|script|iframe|svg|link)\b/i;
const ATTACHMENT_FIELDS = ['attachment', 'attachments', 'files', 'pdf', 'deck', 'image'];

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function urlCount(text) {
  return (String(text || '').match(/https?:\/\/[^\s)>\]]+/gi) || []).length;
}

function lineCount(text) {
  return String(text || '').split(/\r?\n/).filter((line) => line.trim()).length;
}

function exclamationCount(text) {
  return (String(text || '').match(/!/g) || []).length;
}

function uppercaseRatio(text) {
  const letters = String(text || '').replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (!letters.length) return 0;
  const upper = letters.replace(/[^A-ZÀ-Ý]/g, '');
  return upper.length / letters.length;
}

function includesAttachmentLikeField(item) {
  return ATTACHMENT_FIELDS.some((field) => {
    const value = item[field];
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(compact(value));
  });
}

function hasBusinessSpecificEvidence(item) {
  const audit = item.internal_audit || {};
  const values = [
    item.website,
    audit.evidence_refs,
    audit.social_channels_checked,
    audit.review_platforms_checked,
    audit.competitors_checked,
    audit.search_ai_visibility_checked
  ].map(compact);
  return values.every(Boolean) && /\|/.test(compact(audit.competitors_checked));
}

function validateDeliverability(item, index) {
  const failures = [];
  const prefix = `item_${index + 1}:${item.lead_id || item.id || 'NO_ID'}`;
  const subject = compact(item.subject);
  const body = String(item.body || '');
  const bodyCompact = compact(body);
  const style = compact(item.outreach_style).replace(/-/g, '_');

  if (item.reply_to !== BRAND_EMAIL) failures.push(`${prefix}:reply_to_must_be_cantoni`);
  if (item.from && item.from !== BRAND_EMAIL) failures.push(`${prefix}:from_must_be_cantoni_when_present`);
  if (style !== 'micro_audit') failures.push(`${prefix}:first_touch_must_be_micro_audit`);
  if (item.email_kind && item.email_kind !== 'cold_intro') failures.push(`${prefix}:unexpected_email_kind:${item.email_kind}`);

  if (subject.length < 24 || subject.length > 82) failures.push(`${prefix}:subject_not_in_deliverable_range`);
  if (exclamationCount(subject) > 0) failures.push(`${prefix}:subject_must_not_use_exclamation`);
  if (uppercaseRatio(subject) > 0.32) failures.push(`${prefix}:subject_too_uppercase`);
  if (!item.business_name || !subject.toLowerCase().includes(String(item.business_name).toLowerCase())) {
    failures.push(`${prefix}:subject_missing_business_name`);
  }

  if (bodyCompact.length < 420 || bodyCompact.length > 1150) failures.push(`${prefix}:body_not_in_micro_range`);
  if (lineCount(body) > 14) failures.push(`${prefix}:too_many_body_lines_for_first_touch`);
  if (urlCount(body) > 2) failures.push(`${prefix}:too_many_links`);
  if (!body.includes(BRAND_SITE)) failures.push(`${prefix}:missing_brand_site_signature`);
  if (!/Cantoni Digital Studio/i.test(body)) failures.push(`${prefix}:missing_cantoni_identity`);
  if (PRICE_PATTERN.test(body)) failures.push(`${prefix}:first_touch_contains_price`);
  if (SPAMMY_WORDS.test(body) || SPAMMY_WORDS.test(subject)) failures.push(`${prefix}:spammy_wording_detected`);
  if (CLIENT_JARGON.test(body)) failures.push(`${prefix}:client_unfriendly_jargon`);
  if (TRACKING_PATTERN.test(body)) failures.push(`${prefix}:tracking_parameter_detected`);
  if (HTML_ASSET_PATTERN.test(body) || HTML_ASSET_PATTERN.test(item.html || '')) failures.push(`${prefix}:html_or_image_asset_in_first_touch`);
  if (includesAttachmentLikeField(item)) failures.push(`${prefix}:attachment_like_field_in_first_touch`);
  if (!hasBusinessSpecificEvidence(item)) failures.push(`${prefix}:missing_client_by_client_evidence`);

  return failures;
}

async function run() {
  const queueFile = path.resolve(argValue('--queue', process.env.OUTREACH_QUEUE_FILE || DEFAULT_QUEUE));
  const allowEmpty = hasFlag('--allow-empty');
  const queue = JSON.parse(await fs.readFile(queueFile, 'utf8'));
  const failures = [];

  if (!Array.isArray(queue)) failures.push('queue_must_be_array');
  if (Array.isArray(queue) && queue.length === 0 && !allowEmpty) failures.push('queue_empty');
  if (Array.isArray(queue)) {
    queue.forEach((item, index) => failures.push(...validateDeliverability(item, index)));
  }

  console.log(JSON.stringify({
    ok: failures.length === 0,
    file: queueFile,
    items: Array.isArray(queue) ? queue.length : 0,
    standard: 'first_touch_deliverability_v1',
    failures
  }, null, 2));

  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
