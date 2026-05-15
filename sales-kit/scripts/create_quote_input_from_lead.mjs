import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  readLeadPipeline,
  resolveMarketSummary,
  resolveCurrency,
  resolveLanguage,
  splitAuditField,
  validateLeadForQuote
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const csvFile = process.env.LEAD_PIPELINE_CSV
  ? path.resolve(process.env.LEAD_PIPELINE_CSV)
  : path.resolve(salesKitDir, 'lead_pipeline.csv');
const outDir = process.env.QUOTE_INPUT_OUTPUT_DIR
  ? path.resolve(process.env.QUOTE_INPUT_OUTPUT_DIR)
  : path.resolve(salesKitDir, 'quote-inputs');

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lead';
}

function buildEmailOpening(lead, language) {
  const website = lead.website || '';
  const businessLabel = lead.business_name || 'this business';
  const analyzedAsset = website || {
    it: `la presenza online di ${businessLabel}`,
    en: `the online presence of ${businessLabel}`,
    es: `la presencia online de ${businessLabel}`,
    fr: `la presence en ligne de ${businessLabel}`,
    de: `den Online-Auftritt von ${businessLabel}`,
    pt: `a presenca online de ${businessLabel}`,
    ja: `${businessLabel}のオンライン導線`,
    ar: `الحضور الرقمي الخاص بـ ${businessLabel}`,
    zh: `${businessLabel} 的线上呈现`,
    hi: `${businessLabel} ki online presence`
  }[language] || businessLabel;
  const business = lead.what_the_business_does || '';
  const map = {
    it: `Ho analizzato ${analyzedAsset}: ${business}`,
    en: `I reviewed ${analyzedAsset}: ${business}`,
    es: `He analizado ${analyzedAsset}: ${business}`,
    fr: `J'ai analyse ${analyzedAsset} : ${business}`,
    de: `Ich habe ${analyzedAsset} analysiert: ${business}`,
    pt: `Analisei ${analyzedAsset}: ${business}`,
    ja: `${analyzedAsset}を確認しました。${business}`,
    ar: `راجعت ${analyzedAsset}: ${business}`,
    zh: `我查看了 ${analyzedAsset}：${business}`,
    hi: `Maine ${analyzedAsset} review kiya: ${business}`
  };
  return map[language] || map.en;
}

function buildTemplateFromLead(lead) {
  const language = resolveLanguage(lead);
  const auditEvidence = [
    lead.current_domain_verified,
    lead.mobile_experience_checked,
    lead.contact_flow_checked,
    ...splitAuditField(lead.social_channels_checked),
    ...splitAuditField(lead.review_platforms_checked),
    ...splitAuditField(lead.competitors_checked),
    lead.search_ai_visibility_checked,
    ...splitAuditField(lead.evidence_refs).map((item) => `Evidence reference checked: ${item}`)
  ].map((item) => String(item || '').trim()).filter(Boolean);

  return {
    business_name: lead.business_name || '',
    contact_name: lead.contact_name || '',
    country: lead.country || '',
    city: lead.city || '',
    market_scope_summary: resolveMarketSummary(lead),
    website: lead.website || '',
    language,
    currency: resolveCurrency(lead),
    email_opening: buildEmailOpening(lead, language),
    project_summary: lead.what_the_business_does || '',
    issues: splitAuditField(lead.top_3_issues_found).slice(0, 4),
    solutions: splitAuditField(lead.top_3_improvements_proposed).slice(0, 4),
    business_impact: splitAuditField(lead.expected_business_impact_range).slice(0, 4),
    timeline: lead.timeline || '',
    base_deliverables: splitAuditField(lead.base_deliverables).slice(0, 4),
    growth_deliverables: splitAuditField(lead.growth_deliverables).slice(0, 4),
    monthly_deliverables: splitAuditField(lead.monthly_deliverables).slice(0, 4),
    recommended_solution_type: lead.recommended_solution_type || '',
    solution_type_rationale: lead.solution_type_rationale || '',
    payment_readiness: lead.payment_readiness || '',
    audit_evidence: auditEvidence,
    pricing_rationale: lead.pricing_rationale || '',
    social_channels_checked: splitAuditField(lead.social_channels_checked),
    review_platforms_checked: splitAuditField(lead.review_platforms_checked),
    competitors_checked: splitAuditField(lead.competitors_checked),
    search_ai_visibility_checked: lead.search_ai_visibility_checked || '',
    internal_notes: lead.notes || '',
    source_lead_id: lead.lead_id || '',
    recommended_package: lead.recommended_package || 'Growth',
    recommended_package_price: lead.recommended_package_price || ''
  };
}

async function run() {
  const leadId = getArgValue('--lead-id');
  if (!leadId) throw new Error('Use --lead-id <LEAD_ID>');

  const leads = await readLeadPipeline(csvFile);
  const lead = leads.find((row) => row.lead_id === leadId);

  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const quoteValidation = validateLeadForQuote(lead);
  if (!quoteValidation.ok) {
    throw new Error(
      [
        `Quote input gate failed for ${leadId}.`,
        ...quoteValidation.problems.map((problem) => `- ${problem}`)
      ].join('\n')
    );
  }

  await fs.mkdir(outDir, { recursive: true });
  const template = buildTemplateFromLead(lead);
  const filePath = path.join(
    outDir,
    `${slugify(lead.business_name)}-${slugify(lead.country)}-${slugify(leadId)}.json`
  );
  await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        lead_id: leadId,
        output: filePath
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
