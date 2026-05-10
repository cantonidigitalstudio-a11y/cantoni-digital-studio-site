import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readLeadPipeline,
  resolveMarketSummary,
  resolveCurrency,
  resolveLanguage,
  splitAuditField,
  validateLeadForQueue
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFile = process.env.LEAD_PIPELINE_CSV
  ? path.resolve(process.env.LEAD_PIPELINE_CSV)
  : path.resolve(__dirname, '../lead_pipeline.csv');
const outFile = process.env.OUTREACH_QUEUE_FILE
  ? path.resolve(process.env.OUTREACH_QUEUE_FILE)
  : path.resolve(__dirname, '../queue/outreach_queue.json');

function moneyLabel(currency, amount) {
  return new Intl.NumberFormat(localeTagFor(currency), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function localeTagFor(currency) {
  const map = {
    EUR: 'it-IT',
    GBP: 'en-GB',
    USD: 'en-US',
    MXN: 'es-MX',
    DOP: 'es-DO',
    AED: 'en-AE',
    SAR: 'ar-SA',
    JPY: 'ja-JP',
    INR: 'hi-IN',
    CNY: 'zh-CN'
  };
  return map[currency] || 'en-US';
}

function normalizeImpact(value) {
  return splitAuditField(value).slice(0, 3);
}

function resolveAuditedAsset(language, row) {
  if (row.website) return row.website;
  const business = row.business_name || 'this business';
  const fallback = {
    it: `la presenza online di ${business}`,
    en: `the online presence of ${business}`,
    es: `la presencia online de ${business}`,
    fr: `la presence en ligne de ${business}`,
    de: `den Online-Auftritt von ${business}`,
    pt: `a presenca online de ${business}`,
    ja: `${business}のオンライン導線`,
    ar: `الحضور الرقمي الخاص بـ ${business}`,
    zh: `${business} 的线上呈现`,
    hi: `${business} ki online presence`
  };
  return fallback[language] || fallback.en;
}

function templateByLanguage(language, row, currency) {
  const contact = row.contact_name || row.business_name || '';
  const website = resolveAuditedAsset(language, row);
  const market = resolveMarketSummary(row);
  const marketSuffix = market ? ` (${market})` : '';
  const issues = splitAuditField(row.top_3_issues_found).slice(0, 3);
  const improvements = splitAuditField(row.top_3_improvements_proposed).slice(0, 3);
  const impact = normalizeImpact(row.expected_business_impact_range);
  const cta = row.email_angle || '';
  const opening = row.what_the_business_does || '';

  const templates = {
    it: {
      subject: `${row.business_name}: 3 osservazioni concrete sul sito`,
      lines: [
        `Ciao ${contact || row.business_name},`,
        '',
        `ho analizzato ${website}${marketSuffix} e il punto che mi ha colpito subito e questo: ${opening}`,
        '',
        'Ho visto 3 problemi concreti che oggi possono frenare richieste e conversioni:',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Le 3 mosse che farei subito sono:',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `Impatto economico realistico: ${impact.join(' | ')}` : '',
        cta || 'Se vuoi, ti invio un breakdown breve con priorita, tempi indicativi e cosa avrebbe senso sistemare prima.'
      ].filter(Boolean)
    },
    en: {
      subject: `${row.business_name}: 3 concrete website observations`,
      lines: [
        `Hi ${contact || row.business_name},`,
        '',
        `I reviewed ${website}${marketSuffix}, and this was the first commercial signal I noticed: ${opening}`,
        '',
        'These are the 3 concrete issues currently holding the site back:',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'The 3 improvements I would prioritize are:',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `Realistic business impact: ${impact.join(' | ')}` : '',
        cta || 'If useful, I can send a short breakdown with priorities, indicative timing and what should be fixed first.'
      ].filter(Boolean)
    },
    es: {
      subject: `${row.business_name}: 3 observaciones concretas sobre la web`,
      lines: [
        `Hola ${contact || row.business_name},`,
        '',
        `analicé ${website}${marketSuffix} y la primera señal comercial que vi fue esta: ${opening}`,
        '',
        'Veo 3 problemas concretos que hoy pueden frenar contactos y conversiones:',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Las 3 mejoras que aplicaría primero son:',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `Impacto comercial realista: ${impact.join(' | ')}` : '',
        cta || 'Si quieres, te envio un breakdown breve con prioridades, tiempos orientativos y que conviene corregir primero.'
      ].filter(Boolean)
    },
    fr: {
      subject: `${row.business_name} : 3 observations concretes sur le site`,
      lines: [
        `Bonjour ${contact || row.business_name},`,
        '',
        `j'ai analyse ${website}${marketSuffix} et le premier signal commercial que j'ai vu est le suivant : ${opening}`,
        '',
        'Je vois 3 problemes concrets qui freinent aujourd hui les demandes et conversions :',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Les 3 actions prioritaires seraient :',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `Impact commercial realiste : ${impact.join(' | ')}` : '',
        cta || 'Si vous voulez, j envoie un bref breakdown avec priorites, delais indicatifs et corrections a traiter en premier.'
      ].filter(Boolean)
    },
    de: {
      subject: `${row.business_name}: 3 konkrete Website-Beobachtungen`,
      lines: [
        `Hallo ${contact || row.business_name},`,
        '',
        `ich habe ${website}${marketSuffix} analysiert, und das erste klare Signal war: ${opening}`,
        '',
        'Ich sehe 3 konkrete Probleme, die aktuell Anfragen und Conversion bremsen:',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Diese 3 Verbesserungen wuerde ich zuerst umsetzen:',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `Realistischer Business-Effekt: ${impact.join(' | ')}` : '',
        cta || 'Wenn sinnvoll, sende ich einen kurzen Breakdown mit Prioritaeten, grobem Timing und den ersten sinnvollen Korrekturen.'
      ].filter(Boolean)
    },
    pt: {
      subject: `${row.business_name}: 3 observacoes concretas sobre o site`,
      lines: [
        `Ola ${contact || row.business_name},`,
        '',
        `analisei ${website}${marketSuffix} e o primeiro sinal comercial que vi foi este: ${opening}`,
        '',
        'Vejo 3 problemas concretos que hoje podem travar leads e conversao:',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'As 3 melhorias prioritarias seriam:',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `Impacto comercial realista: ${impact.join(' | ')}` : '',
        cta || 'Se fizer sentido, envio um breakdown curto com prioridades, prazo indicativo e o que corrigir primeiro.'
      ].filter(Boolean)
    },
    ja: {
      subject: `${row.business_name} サイトに関する3つの具体的な所見`,
      lines: [
        `${contact || row.business_name} 様`,
        '',
        `${website}${marketSuffix}を確認し、最初に感じた商業的な改善余地は次の点です。${opening}`,
        '',
        '現在、反響を減らしている主な課題は3つあります。',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        '優先すべき改善は次の3点です。',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `想定できる事業効果: ${impact.join(' | ')}` : '',
        cta || '必要であれば、優先順位・目安期間・最初に直すべき点を短く整理してお送りします。'
      ].filter(Boolean)
    },
    ar: {
      subject: `${row.business_name}: 3 ملاحظات واضحة على الموقع`,
      lines: [
        `مرحبا ${contact || row.business_name}،`,
        '',
        `راجعت ${website}${marketSuffix} وكانت اول ملاحظة تجارية واضحة لدي هي: ${opening}`,
        '',
        'هناك 3 مشاكل واضحة قد تقلل الطلبات والتحويلات حاليا:',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'هذه هي 3 التحسينات التي ابدأ بها مباشرة:',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `الاثر التجاري الواقعي: ${impact.join(' | ')}` : '',
        cta || 'اذا رغبت، ارسل لك ملخصا قصيرا بالاولوية والمدة التقريبية وما يجب اصلاحه اولا.'
      ].filter(Boolean)
    },
    zh: {
      subject: `${row.business_name}：网站上的3个具体观察`,
      lines: [
        `${contact || row.business_name} 您好，`,
        '',
        `我看了 ${website}${marketSuffix}，首先注意到的商业问题是：${opening}`,
        '',
        '目前影响询盘和转化的3个具体问题是：',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        '我会优先做的3个改进是：',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `可预期的商业效果：${impact.join(' | ')}` : '',
        cta || '如果合适，我可以发一份简短 breakdown，说明优先级、预计周期和应该先修正的内容。'
      ].filter(Boolean)
    },
    hi: {
      subject: `${row.business_name}: website par 3 concrete observations`,
      lines: [
        `Namaste ${contact || row.business_name},`,
        '',
        `maine ${website}${marketSuffix} review kiya aur sabse pehla commercial signal yeh tha: ${opening}`,
        '',
        'Abhi 3 concrete issues hain jo inquiries aur conversion ko rok rahe hain:',
        ...issues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Main sabse pehle yeh 3 improvements implement karta:',
        ...improvements.map((item) => `- ${item}`),
        '',
        impact.length ? `Realistic business impact: ${impact.join(' | ')}` : '',
        cta || 'Agar useful ho, main short breakdown bhej sakta hoon with priorities, indicative timing aur pehle kya fix karna chahiye.'
      ].filter(Boolean)
    }
  };

  const fallback = templates.en;
  return templates[language] || fallback;
}

function buildQueueItem(row) {
  const language = resolveLanguage(row);
  const currency = resolveCurrency(row);
  const market = resolveMarketSummary(row);
  const copy = templateByLanguage(language, row, currency);

  return {
    id: row.lead_id,
    lead_id: row.lead_id,
    email_kind: 'cold_intro',
    to: row.email,
    reply_to: 'cantonidigitalstudio@gmail.com',
    language,
    currency,
    country: row.country || '',
    city: row.city || '',
    market_scope_summary: market,
    internal_recommended_package: row.recommended_package || 'Growth',
    internal_recommended_package_price: row.recommended_package_price || moneyLabel(currency, 3400),
    subject: copy.subject,
    body: copy.lines.join('\n'),
    status: 'pending'
  };
}

async function run() {
  const rows = await readLeadPipeline(csvFile);
  const gateReport = [];
  const queue = [];

  rows.forEach((row) => {
    const validation = validateLeadForQueue(row);
    if (row.status === 'READY_TO_CONTACT') {
      if (validation.ok) {
        queue.push(buildQueueItem(row));
      } else {
        gateReport.push({
          lead_id: row.lead_id,
          business_name: row.business_name,
          problems: validation.problems
        });
      }
    }
  });

  await fs.writeFile(outFile, JSON.stringify(queue, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        queue_count: queue.length,
        blocked_count: gateReport.length,
        blocked: gateReport,
        output: outFile
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
