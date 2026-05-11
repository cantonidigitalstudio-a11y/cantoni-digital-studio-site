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

const CLIENT_FRIENDLY_REWRITES = [
  [/Hero con CTA unica verso disponibilità o richiesta preventivo/gi, 'Prima parte del sito con un invito chiaro a verificare disponibilità o chiedere un preventivo'],
  [/Sezione hero con vantaggi diretti e CTA prenota\/richiedi offerta più chiara/gi, "Prima parte del sito con vantaggi diretti e pulsanti chiari per prenotare o richiedere un'offerta"],
  [/Le CTA principali sono chiamata\/email e non costruiscono un percorso di disponibilità\/preventivo/gi, 'Oggi i principali inviti sono solo chiamata ed email: manca un percorso semplice per verificare disponibilità o chiedere un preventivo'],
  [/La promessa di prenotazione diretta non porta subito a un booking flow visibile/gi, 'La promessa di prenotare direttamente dal sito non porta subito a una pagina chiara dove controllare disponibilità o chiedere informazioni'],
  [/Servizi, camere e fiducia sono sparsi e poco orientati alla conversione mobile/gi, 'Servizi, camere e motivi per fidarsi sono distribuiti in più punti: da telefono non guidano abbastanza verso una richiesta'],
  [/Servizi, offerte ed eventi sono presenti ma non ordinati come funnel commerciale mobile/gi, 'Servizi, offerte ed eventi ci sono, ma da telefono non seguono un percorso semplice che porti alla richiesta o alla prenotazione'],
  [/Il booking è demandato a un flusso esterno e il valore diretto non è spiegato prima del click/gi, 'La prenotazione porta fuori dal sito e prima del click non è abbastanza chiaro perché convenga prenotare direttamente'],
  [/Contatti hotel e ufficio booking sono separati e possono creare frizione/gi, 'I contatti dell’hotel e quelli per prenotare sono separati: questo può creare confusione nel momento in cui una persona vuole informazioni'],
  [/Sequenza camere-servizi-recensioni-offerte con percorso commerciale più corto/gi, 'Ordine più chiaro tra camere, servizi, recensioni e offerte, così il visitatore capisce prima cosa fare'],
  [/Barra mobile con prenota\/WhatsApp\/email e tracking richieste/gi, 'Da telefono, pulsanti sempre visibili per prenotare, scrivere su WhatsApp o mandare una email, con controllo delle richieste ricevute'],
  [/Percorso contatti unico con booking, telefono, email e WhatsApp ordinati/gi, 'Un solo percorso contatti, con prenotazione, telefono, email e WhatsApp messi in ordine chiaro'],
  [/Landing offerte\/famiglie con trust, servizi e disponibilità in sequenza/gi, 'Pagina dedicata alle offerte e alle famiglie, con servizi, motivi di fiducia e disponibilità spiegati in ordine'],
  [/\bCTA\b/gi, 'pulsanti o inviti a prenotare'],
  [/\bhero\b/gi, 'prima parte della pagina'],
  [/\bfunnel commerciale mobile\b/gi, 'percorso semplice da telefono'],
  [/\bfunnel\b/gi, 'percorso'],
  [/\bbooking flow\b/gi, 'percorso di prenotazione'],
  [/\bbooking\b/gi, 'prenotazione'],
  [/\btracking richieste\b/gi, 'controllo delle richieste ricevute'],
  [/\bconversione mobile\b/gi, 'richieste da telefono'],
  [/\bconversioni\b/gi, 'richieste o prenotazioni'],
  [/\bconversione\b/gi, 'richiesta o prenotazione'],
  [/\btrust layer\b/gi, 'elementi di fiducia'],
  [/\bconversion-oriented\b/gi, 'pensate per far arrivare richieste'],
  [/\blanding\b/gi, 'pagina dedicata'],
  [/\bbreakdown\b/gi, 'riepilogo chiaro'],
  [/\bfrizione\b/gi, 'confusione']
];

function clientFriendlyCopy(value) {
  return CLIENT_FRIENDLY_REWRITES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value || '')
  );
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
  const friendlyIssues = issues.map(clientFriendlyCopy);
  const friendlyImprovements = improvements.map(clientFriendlyCopy);
  const friendlyImpact = impact.map(clientFriendlyCopy);
  const cta = clientFriendlyCopy(row.email_angle || '');
  const opening = row.what_the_business_does || '';

  const templates = {
    it: {
      subject: `${row.business_name}: 3 osservazioni concrete sul sito`,
      lines: [
        'Buongiorno,',
        '',
        `ho analizzato ${website}${marketSuffix} e il punto che mi ha colpito subito è questo: ${opening}`,
        '',
        'Ho visto 3 aspetti concreti che oggi possono ridurre richieste, prenotazioni e contatti:',
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Le 3 prime cose che sistemerei sono:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Risultato commerciale realistico: ${friendlyImpact.join(' | ')}` : '',
        cta || 'Se può essere utile, vi invio un riepilogo chiaro con priorità, tempi indicativi e cosa avrebbe senso sistemare prima.',
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'The 3 improvements I would prioritize are:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Realistic business impact: ${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Las 3 mejoras que aplicaría primero son:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Impacto comercial realista: ${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Les 3 actions prioritaires seraient :',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Impact commercial realiste : ${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Diese 3 Verbesserungen wuerde ich zuerst umsetzen:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Realistischer Business-Effekt: ${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'As 3 melhorias prioritarias seriam:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Impacto comercial realista: ${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        '優先すべき改善は次の3点です。',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `想定できる事業効果: ${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'هذه هي 3 التحسينات التي ابدأ بها مباشرة:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `الاثر التجاري الواقعي: ${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        '我会优先做的3个改进是：',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `可预期的商业效果：${friendlyImpact.join(' | ')}` : '',
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
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Main sabse pehle yeh 3 improvements implement karta:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Realistic business impact: ${friendlyImpact.join(' | ')}` : '',
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
