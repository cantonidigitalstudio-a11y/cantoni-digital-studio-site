import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_QUEUE = 'sales-kit/lead-batches/2026-05-15-global-50/outreach_queue.json';

const FORBIDDEN_GENERIC = /\b(?:placeholder|example\.com|tbd|dummy|lorem|template|todo)\b/i;
const FORBIDDEN_CLIENT_JARGON = /\b(?:CTA|hero|funnel|CRO|UX|scope|wireframe|backend|frontend)\b/i;
const PRICE_PATTERN = /\b(?:EUR|USD|GBP|MXN|DOP|CAD|BRL|JPY|AED|SAR|INR|CNY|AUD|SGD|THB)\s*[\d.,]+|(?:€|\$|£|RD\$|MX\$|C\$|R\$|¥|د\.إ|ر\.س)\s*[\d.,]+/i;
const REVIEW_SIGNAL = /\b(?:google|maps|tripadvisor|booking|yelp|trustpilot|review|reviews|recension|reseñas|avis|bewertung)\b/i;
const SOCIAL_SIGNAL = /\b(?:instagram|facebook|tiktok|youtube|linkedin|x\.com|twitter|social)\b/i;
const SEARCH_AI_SIGNAL = /\b(?:google|maps|search|ricerca|visibil|visibility|ai|ia|intelligen|answers|risposte)\b/i;
const PERMISSION_CTA = /\b(?:se puo essere utile|se può essere utile|vi mando|posso inviare|posso mandar|ti mando|if useful|i can send|should i send|si os parece útil|si os parece util|puedo enviar|puedo mand|se fizer sentido|posso enviar|si cela vous semble utile|je peux envoyer|wenn sinnvoll|sende ich|必要であれば)\b/i;

const SOLUTION_REQUIREMENTS = {
  website: /\b(?:website|site|sito|web|mobile|telefono|phone|contact|contatt|fiducia|trust|prenot|booking|richiest|inquir)\b/i,
  website_redesign: /\b(?:website|site|sito|web|mobile|telefono|phone|contact|contatt|fiducia|trust|prenot|booking|richiest|inquir|redesign|rifare)\b/i,
  ecommerce: /\b(?:e-?commerce|shop|store|catalog|catalogo|prodott|products|cart|carrello|checkout|pagament|payment|ordini|orders|stripe|paypal)\b/i,
  web_app: /\b(?:web app|login|dashboard|area cliente|portal|portale|ruoli|roles|data|dati|workflow|gestione|management)\b/i,
  mobile_app: /\b(?:mobile app|app store|play store|notific|push|native|nativo|install|installabile|ricorrente|offline)\b/i,
  platform: /\b(?:platform|piattaforma|multi|ruoli|roles|workflow|pagament|payment|dashboard|dati|data|marketplace|scalabil)\b/i,
  automation_ai: /\b(?:automation|automazion|ai|ia|follow-?up|routing|lead|document|support|contenut|content|intelligen)\b/i,
  monthly_growth: /\b(?:monthly|continu|growth|crescita|contenut|content|posizion|google|maps|search|ricerca|visibil|visibility|ai|ia|conversion|fiducia|trust)\b/i
};

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function normalizeStyle(value) {
  return String(value || 'complete_audit').toLowerCase().replace(/-/g, '_');
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function countNumberedIssues(body) {
  return String(body || '').split('\n').filter((line) => /^\d+\.\s+\S/.test(line.trim())).length;
}

function countBullets(body) {
  return String(body || '').split('\n').filter((line) => /^-\s+\S/.test(line.trim())).length;
}

function includesBusinessAnchor(item) {
  const subject = compact(item.subject).toLowerCase();
  const body = compact(item.body).toLowerCase();
  const business = compact(item.business_name).toLowerCase();
  let domain = '';
  try {
    domain = item.website ? new URL(item.website).hostname.replace(/^www\./, '').toLowerCase() : '';
  } catch {}
  return Boolean(
    (business && (subject.includes(business) || body.includes(business))) ||
    (domain && body.includes(domain))
  );
}

function validateItem(item, index, style) {
  const failures = [];
  const prefix = `item_${index + 1}:${item.lead_id || 'NO_ID'}`;
  const subject = compact(item.subject);
  const body = String(item.body || '');
  const audit = item.internal_audit || {};
  const solutionType = compact(item.internal_recommended_solution_type);
  const solutionText = [
    item.internal_solution_type_rationale,
    item.internal_payment_readiness,
    audit.what_the_business_does,
    ...(audit.issues || []),
    ...(audit.improvements || [])
  ].join(' ');

  if (!item.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(item.to)) failures.push(`${prefix}:invalid_recipient`);
  if (!item.reply_to || item.reply_to !== 'cantonidigitalstudio@gmail.com') failures.push(`${prefix}:reply_to_invalid`);
  if (!item.language) failures.push(`${prefix}:missing_language`);
  if (!item.currency) failures.push(`${prefix}:missing_currency`);
  if (!item.website || !/^https?:\/\//i.test(item.website)) failures.push(`${prefix}:missing_verified_website`);
  if (!subject || subject.length < 18 || subject.length > 95) failures.push(`${prefix}:subject_length_not_professional`);
  if (!includesBusinessAnchor(item)) failures.push(`${prefix}:missing_business_or_domain_anchor`);
  if (FORBIDDEN_GENERIC.test(subject) || FORBIDDEN_GENERIC.test(body)) failures.push(`${prefix}:generic_placeholder_detected`);
  if (FORBIDDEN_CLIENT_JARGON.test(body)) failures.push(`${prefix}:client_unfriendly_jargon`);
  if (PRICE_PATTERN.test(body)) failures.push(`${prefix}:first_email_must_not_include_price`);
  if (style === 'micro_audit') {
    if (compact(body).length > 1400) failures.push(`${prefix}:micro_audit_body_too_long`);
    if (countNumberedIssues(body) > 1) failures.push(`${prefix}:micro_audit_must_not_send_full_numbered_audit`);
    if (countBullets(body) > 1) failures.push(`${prefix}:micro_audit_must_not_send_full_bullet_audit`);
    if (!PERMISSION_CTA.test(body)) failures.push(`${prefix}:micro_audit_missing_permission_cta`);
    if (!/Cantoni Digital Studio/i.test(body)) failures.push(`${prefix}:missing_cantoni_identity`);
  } else {
    if (countNumberedIssues(body) < 3) failures.push(`${prefix}:body_requires_3_numbered_observations`);
    if (countBullets(body) < 3) failures.push(`${prefix}:body_requires_3_priority_bullets`);
  }
  if (compact(audit.what_the_business_does).length < 70) failures.push(`${prefix}:audit_business_summary_too_short`);
  if (!Array.isArray(audit.issues) || audit.issues.length < 3) failures.push(`${prefix}:audit_requires_3_issues`);
  if (!Array.isArray(audit.improvements) || audit.improvements.length < 3) failures.push(`${prefix}:audit_requires_3_improvements`);
  if (!SOCIAL_SIGNAL.test(audit.social_channels_checked || '')) failures.push(`${prefix}:social_channels_not_verified`);
  if (!REVIEW_SIGNAL.test(audit.review_platforms_checked || '')) failures.push(`${prefix}:review_platforms_not_verified`);
  if (!SEARCH_AI_SIGNAL.test(audit.search_ai_visibility_checked || '')) failures.push(`${prefix}:search_ai_visibility_not_verified`);
  if (!compact(audit.competitors_checked).includes('|')) failures.push(`${prefix}:competitors_require_at_least_2_items`);
  if (!/https?:\/\/|browser|screenshot|google|maps/i.test(audit.evidence_refs || '')) failures.push(`${prefix}:missing_evidence_refs`);
  if (!SOLUTION_REQUIREMENTS[solutionType]) failures.push(`${prefix}:invalid_solution_type:${solutionType || 'EMPTY'}`);
  if (SOLUTION_REQUIREMENTS[solutionType] && !SOLUTION_REQUIREMENTS[solutionType].test(solutionText)) {
    failures.push(`${prefix}:solution_type_not_supported_by_audit:${solutionType}`);
  }
  if (compact(item.internal_solution_type_rationale).length < 100) failures.push(`${prefix}:solution_type_rationale_too_short`);
  if (compact(item.internal_payment_readiness).length < 80) failures.push(`${prefix}:payment_readiness_too_short`);

  return failures;
}

async function run() {
  const queueFile = path.resolve(argValue('--queue', process.env.OUTREACH_QUEUE_FILE || DEFAULT_QUEUE));
  const style = normalizeStyle(argValue('--style', process.env.OUTREACH_QUALITY_STYLE || 'complete_audit'));
  const allowEmpty = hasFlag('--allow-empty');
  const queue = JSON.parse(await fs.readFile(queueFile, 'utf8'));
  const failures = [];

  if (!Array.isArray(queue)) failures.push('queue_must_be_array');
  if (Array.isArray(queue) && queue.length === 0 && !allowEmpty) failures.push('queue_empty');

  if (Array.isArray(queue)) {
    queue.forEach((item, index) => failures.push(...validateItem(item, index, style)));
  }

  console.log(JSON.stringify({
    ok: failures.length === 0,
    file: queueFile,
    items: Array.isArray(queue) ? queue.length : 0,
    standard: style === 'micro_audit' ? 'pre_send_micro_audit_quality_v1' : 'pre_send_outreach_quality_v2',
    style,
    failures
  }, null, 2));

  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
