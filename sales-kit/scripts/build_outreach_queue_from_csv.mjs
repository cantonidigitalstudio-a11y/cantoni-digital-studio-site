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
const OUTREACH_STYLE = String(process.env.OUTREACH_STYLE || 'complete_audit')
  .toLowerCase()
  .replace(/-/g, '_');

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
  [/Direct booking value is not clear in the first screen/gi, 'Il valore della prenotazione diretta non è chiaro nella prima schermata'],
  [/Mobile visitors need a shorter path to request availability/gi, 'Chi visita da telefono ha bisogno di un percorso più breve per chiedere disponibilità'],
  [/Trust proof is not grouped before the contact step/gi, 'Le prove di fiducia non sono raccolte prima del momento di contatto'],
  [/Clarify the first screen with one booking or request path/gi, 'Rendere subito chiaro il percorso per prenotare o chiedere informazioni'],
  [/Reduce mobile steps between room review and contact/gi, 'Ridurre i passaggi da telefono tra la scelta della camera e il contatto'],
  [/Group reviews direct benefits and contact options before the final request/gi, 'Raccogliere recensioni, vantaggi diretti e contatti prima della richiesta finale'],
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

function clientFriendlyCopy(value, language = 'it') {
  if (language !== 'it') return String(value || '');
  return CLIENT_FRIENDLY_REWRITES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value || '')
  );
}

function polishCopyForLanguage(value, language = 'it') {
  let text = String(value || '');
  if (language === 'it') {
    const replacements = [
      [/\bpuo\b/gi, 'può'],
      [/\bpiu\b/gi, 'più'],
      [/\bvisibilita\b/gi, 'visibilità'],
      [/\battivita\b/gi, 'attività'],
      [/\bqualita\b/gi, 'qualità'],
      [/\bperche\b/gi, 'perché'],
      [/\bpoiche\b/gi, 'poiché'],
      [/\bL Essenziale\b/g, "L'Essenziale"],
      [/\bdell esperienza\b/gi, "dell'esperienza"],
      [/\bl utente\b/gi, "l'utente"]
    ];
    replacements.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });
  }
  if (language === 'es') {
    const replacements = [
      [/\bhistorico\b/gi, 'histórico'],
      [/\bequipada\b/gi, 'equipada'],
      [/\btodavia\b/gi, 'todavía'],
      [/\bmovil\b/gi, 'móvil'],
      [/\butil\b/gi, 'útil'],
      [/\bdispersion\b/gi, 'dispersión'],
      [/\bintencion\b/gi, 'intención'],
      [/\bpeticion\b/gi, 'petición'],
      [/\bubicacion\b/gi, 'ubicación'],
      [/\bpagina\b/gi, 'página'],
      [/\bdecision\b/gi, 'decisión'],
      [/\bacompana\b/gi, 'acompaña'],
      [/\bMas\b/g, 'Más'],
      [/\bmas\b/g, 'más'],
      [/\bperdida\b/gi, 'pérdida'],
      [/\bMejor\b/g, 'Mejor'],
      [/\bbusqueda\b/gi, 'búsqueda'],
      [/\banalisis\b/gi, 'análisis'],
      [/\bque conviene\b/gi, 'qué conviene'],
      [/\bte envio\b/gi, 'te envío']
    ];
    replacements.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });
  }
  return text;
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
    pt: `a presença online de ${business}`,
    ja: `${business}のオンライン導線`,
    ar: `الحضور الرقمي الخاص بـ ${business}`,
    zh: `${business} 的线上呈现`,
    hi: `${business} ki online presence`
  };
  return fallback[language] || fallback.en;
}

function subjectByLanguage(language, row) {
  const name = row.business_name || 'your website';
  const solution = String(row.recommended_solution_type || '').toLowerCase();
  const sector = String(row.sector || '').toLowerCase();
  const isHospitality = /hotel|suite|hospitality|restaurant|resort|guest|booking|reservation/i.test(sector);
  const isCharter = /yacht|charter|boat|marine/i.test(sector);
  const isPlatform = ['platform', 'app', 'mobile_app', 'application'].includes(solution);

  if (language === 'en') {
    if (isPlatform) return `${name}: clearer client paths for bookings and services`;
    if (isCharter) return `${name}: a clearer path to qualified charter requests`;
    if (isHospitality) return `${name}: 3 ways to improve direct bookings`;
    return `${name}: 3 concrete improvements for the website`;
  }
  if (language === 'it') return `${name}: 3 osservazioni concrete sul sito`;
  if (language === 'es') return `${name}: 3 mejoras concretas para reservas directas`;
  if (language === 'pt') return `${name}: 3 melhorias concretas para reservas diretas`;
  if (language === 'fr') return `${name} : 3 observations concrètes sur le site`;
  if (language === 'de') return `${name}: 3 konkrete Website-Beobachtungen`;
  if (language === 'ja') return `${name} サイトに関する3つの具体的な所見`;
  if (language === 'zh') return `${name}：网站上的3个具体观察`;
  if (language === 'hi') return `${name}: website par 3 concrete observations`;
  return `${name}: 3 concrete improvements for the website`;
}

function microSubjectByLanguage(language, row) {
  const name = row.business_name || 'your website';
  const solution = String(row.recommended_solution_type || '').toLowerCase();
  const sector = String(row.sector || '').toLowerCase();
  const isEcommerce = solution === 'ecommerce' || /e-?commerce|shop|store|retail|boutique|product|prodott|moda|fashion/i.test(sector);
  const isProfessional = /architecture|interior|design|creative studio|legal|law|agency|consult/i.test(sector);
  const isBooking = solution === 'web_app' || /booking|class|course|fitness|yoga|clinic|dental|appointment|reserv|prenot|whatsapp/i.test(sector);

  if (language === 'it') return `${name}: una osservazione concreta sul sito`;
  if (language === 'es') {
    if (isEcommerce) return `${name}: una observación concreta sobre la tienda online`;
    if (isProfessional) return `${name}: una observación concreta sobre solicitudes`;
    if (isBooking) return `${name}: una observación concreta sobre reservas`;
    return `${name}: una observación concreta sobre el sitio`;
  }
  if (language === 'pt') {
    if (isEcommerce) return `${name}: uma observação concreta sobre a loja online`;
    if (isBooking) return `${name}: uma observação concreta sobre reservas`;
    return `${name}: uma observação concreta sobre o site`;
  }
  if (language === 'fr') {
    if (isEcommerce) return `${name} : une observation concrète sur l'achat en ligne`;
    if (isProfessional) return `${name} : une observation concrète sur les demandes`;
    if (isBooking) return `${name} : une observation concrète sur les demandes`;
    return `${name} : une observation concrète sur le site`;
  }
  if (language === 'de') {
    if (isBooking) return `${name}: eine konkrete Beobachtung zum Buchungsweg`;
    if (isEcommerce) return `${name}: eine konkrete Beobachtung zum Online-Shop`;
    return `${name}: eine konkrete Website-Beobachtung`;
  }
  if (language === 'ja') return `${name} サイトについて1つの具体的な所見`;
  if (language === 'zh') return `${name}：一个具体的网站观察`;
  if (language === 'hi') return `${name}: website par ek concrete observation`;
  if (language === 'ar') return `${name}: ملاحظة واحدة واضحة على الموقع`;
  if (isEcommerce) return `${name}: one concrete ecommerce path observation`;
  if (isProfessional) return `${name}: one concrete inquiry path observation`;
  if (isBooking) return `${name}: one concrete booking path observation`;
  return `${name}: one concrete website observation`;
}

function templateByLanguage(language, row, currency) {
  const contact = row.contact_name || '';
  const website = resolveAuditedAsset(language, row);
  const market = resolveMarketSummary(row);
  const marketSuffix = market ? ` (${market})` : '';
  const issues = splitAuditField(row.top_3_issues_found).slice(0, 3);
  const improvements = splitAuditField(row.top_3_improvements_proposed).slice(0, 3);
  const impact = normalizeImpact(row.expected_business_impact_range);
  const friendlyIssues = issues.map((issue) => polishCopyForLanguage(clientFriendlyCopy(issue, language), language));
  const friendlyImprovements = improvements.map((item) => polishCopyForLanguage(clientFriendlyCopy(item, language), language));
  const friendlyImpact = impact.map((item) => polishCopyForLanguage(clientFriendlyCopy(item, language), language));
  const cta = polishCopyForLanguage(clientFriendlyCopy(row.email_angle || '', language), language);
  const opening = polishCopyForLanguage(row.what_the_business_does || '', language);
  const firstIssue = friendlyIssues[0] || opening;
  const microTemplates = {
    it: {
      subject: microSubjectByLanguage(language, row),
      lines: [
        'Buongiorno,',
        '',
        `sono Emanuele Cantoni, di Cantoni Digital Studio. Ho guardato ${website}${marketSuffix} da telefono e con una logica di richieste, non solo estetica.`,
        '',
        `Una cosa concreta: ${firstIssue}`,
        '',
        'Questo può far perdere richieste a persone già interessate, perché il passaggio successivo non è abbastanza immediato.',
        '',
        'Se può essere utile, vi mando una mini-analisi con le 3 priorità da sistemare, senza impegno.',
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
      ]
    },
    en: {
      subject: microSubjectByLanguage(language, row),
      lines: [
        contact ? `Hi ${contact},` : `Hi ${row.business_name} team,`,
        '',
        `I am Emanuele Cantoni from Cantoni Digital Studio. I reviewed ${website}${marketSuffix} from a mobile and client-request perspective, not only visually.`,
        '',
        `One concrete point: ${firstIssue}`,
        '',
        'This can cost qualified inquiries because the next step is not clear enough for someone already interested.',
        '',
        'If useful, I can send a short 3-point audit with the first priorities to fix.',
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
      ]
    },
    es: {
      subject: microSubjectByLanguage(language, row),
      lines: [
        `Hola equipo de ${row.business_name},`,
        '',
        `Soy Emanuele Cantoni, de Cantoni Digital Studio. He revisado ${website}${marketSuffix} desde móvil y con una mirada comercial, no solo estética.`,
        '',
        `Un punto concreto: ${firstIssue}`,
        '',
        'Esto puede hacer perder solicitudes de personas que ya están interesadas, porque el siguiente paso no es lo bastante inmediato.',
        '',
        'Si os parece útil, puedo enviar una mini auditoría con las 3 prioridades que corregiría primero.',
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
      ]
    },
    pt: {
      subject: microSubjectByLanguage(language, row),
      lines: [
        `Olá equipa do ${row.business_name},`,
        '',
        `Sou Emanuele Cantoni, da Cantoni Digital Studio. Analisei ${website}${marketSuffix} no telemóvel e com uma visão comercial, não apenas estética.`,
        '',
        `Um ponto concreto: ${firstIssue}`,
        '',
        'Isto pode fazer perder pedidos de pessoas já interessadas, porque o próximo passo não é suficientemente imediato.',
        '',
        'Se fizer sentido, posso enviar uma mini análise com as 3 prioridades que corrigiria primeiro.',
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
      ]
    },
    fr: {
      subject: microSubjectByLanguage(language, row),
      lines: [
        'Bonjour,',
        '',
        `je suis Emanuele Cantoni, de Cantoni Digital Studio. J'ai regardé ${website}${marketSuffix} sur mobile, avec une logique de demandes clients et pas seulement esthétique.`,
        '',
        `Un point concret : ${firstIssue}`,
        '',
        "Cela peut faire perdre des demandes de personnes déjà intéressées, parce que l'étape suivante n'est pas assez immédiate.",
        '',
        "Si cela vous semble utile, je peux envoyer une mini-analyse avec les 3 priorités à corriger en premier.",
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
      ]
    },
    de: {
      subject: microSubjectByLanguage(language, row),
      lines: [
        `Hallo ${contact || row.business_name},`,
        '',
        `ich bin Emanuele Cantoni von Cantoni Digital Studio. Ich habe ${website}${marketSuffix} mobil und aus Sicht echter Anfragen geprüft, nicht nur visuell.`,
        '',
        `Ein konkreter Punkt: ${firstIssue}`,
        '',
        'Das kann qualifizierte Anfragen kosten, weil der nächste Schritt für interessierte Besucher nicht klar genug ist.',
        '',
        'Wenn sinnvoll, sende ich gern eine kurze 3-Punkte-Analyse mit den wichtigsten Prioritäten.',
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
      ]
    },
    ja: {
      subject: microSubjectByLanguage(language, row),
      lines: [
        `${contact || row.business_name} 様`,
        '',
        `Cantoni Digital StudioのEmanuele Cantoniです。${website}${marketSuffix}をモバイルと問い合わせ導線の視点で確認しました。`,
        '',
        `具体的な所見: ${firstIssue}`,
        '',
        '興味を持った人が次に何をすればよいか分かりにくいと、問い合わせを逃す可能性があります。',
        '',
        '必要であれば、最初に直すべき3つの優先事項を短く整理してお送りします。',
        '',
        'Emanuele Cantoni',
        'Cantoni Digital Studio',
        'https://cantonidigitalstudio.com'
      ]
    }
  };

  if (OUTREACH_STYLE === 'micro_audit') return microTemplates[language] || microTemplates.en;

  const templates = {
    it: {
      subject: subjectByLanguage(language, row),
      lines: [
        'Buongiorno,',
        '',
        `sono Emanuele Cantoni, di Cantoni Digital Studio. Ho analizzato ${website}${marketSuffix} con una logica commerciale, non solo estetica.`,
        '',
        `La base è già chiara: ${opening}`,
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
      subject: subjectByLanguage(language, row),
      lines: [
        contact ? `Hi ${contact},` : `Hi ${row.business_name} team,`,
        '',
        `I am Emanuele Cantoni from Cantoni Digital Studio. I reviewed ${website}${marketSuffix} with a commercial lens, not only a visual one.`,
        '',
        `The strong base is already visible: ${opening}`,
        '',
        'These are 3 concrete points that can reduce qualified inquiries, bookings or direct contacts:',
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
      subject: subjectByLanguage(language, row),
      lines: [
        `Hola equipo de ${row.business_name},`,
        '',
        `Soy Emanuele Cantoni, de Cantoni Digital Studio. He revisado ${website}${marketSuffix} con una mirada comercial, no solo estética.`,
        '',
        `Lo primero que veo es que ya tenéis una base fuerte: ${opening}`,
        '',
        'Veo 3 puntos concretos que hoy pueden frenar solicitudes, reservas y contactos directos:',
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Las 3 mejoras que aplicaría primero son:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Impacto comercial realista: ${friendlyImpact.join(' | ')}` : '',
        'Si os parece útil, puedo enviaros un resumen breve con prioridades, tiempos orientativos y qué conviene corregir primero.'
      ].filter(Boolean)
    },
    fr: {
      subject: subjectByLanguage(language, row),
      lines: [
        'Bonjour,',
        '',
        `j'ai analysé ${website}${marketSuffix} et le premier signal commercial que j'ai vu est le suivant : ${opening}`,
        '',
        "Je vois 3 problèmes concrets qui peuvent freiner les demandes, les réservations et les contacts directs :",
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'Les 3 actions prioritaires seraient :',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Impact commercial réaliste : ${friendlyImpact.join(' | ')}` : '',
        cta || "Si cela vous semble utile, j'envoie un résumé clair avec les priorités, les délais indicatifs et les premières corrections à traiter."
      ].filter(Boolean)
    },
    de: {
      subject: subjectByLanguage(language, row),
      lines: [
        `Hallo ${contact || row.business_name},`,
        '',
        `ich habe ${website}${marketSuffix} analysiert, und das erste klare Signal war: ${opening}`,
        '',
        'Ich sehe 3 konkrete Probleme, die aktuell Anfragen und Entscheidungen erschweren:',
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
      subject: subjectByLanguage(language, row),
      lines: [
        `Olá equipa do ${row.business_name},`,
        '',
        `Sou Emanuele Cantoni, da Cantoni Digital Studio. Analisei ${website}${marketSuffix} com uma visão comercial, não apenas estética.`,
        '',
        `A primeira coisa importante é que já existe uma base muito forte: ${opening}`,
        '',
        'Vejo 3 pontos concretos que hoje podem travar pedidos, reservas e contactos diretos:',
        ...friendlyIssues.map((issue, index) => `${index + 1}. ${issue}`),
        '',
        'As 3 melhorias que priorizaria são:',
        ...friendlyImprovements.map((item) => `- ${item}`),
        '',
        friendlyImpact.length ? `Impacto comercial realista: ${friendlyImpact.join(' | ')}` : '',
        'Se fizer sentido, posso enviar um resumo curto com prioridades, prazo indicativo e o que valeria a pena corrigir primeiro.'
      ].filter(Boolean)
    },
    ja: {
      subject: subjectByLanguage(language, row),
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
      subject: subjectByLanguage(language, row),
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
      subject: subjectByLanguage(language, row),
      lines: [
        `Namaste ${contact || row.business_name},`,
        '',
        `maine ${website}${marketSuffix} review kiya aur sabse pehla commercial signal yeh tha: ${opening}`,
        '',
        'Abhi 3 concrete issues hain jo inquiries aur decision ko rok rahe hain:',
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
    business_name: row.business_name || '',
    website: row.website || '',
    sector: row.sector || '',
    email_kind: 'cold_intro',
    outreach_style: OUTREACH_STYLE,
    to: row.email,
    reply_to: 'cantonidigitalstudio@gmail.com',
    language,
    currency,
    country: row.country || '',
    city: row.city || '',
    market_scope_summary: market,
    internal_recommended_package: row.recommended_package || 'Growth',
    internal_recommended_package_price: row.recommended_package_price || moneyLabel(currency, 3400),
    internal_recommended_solution_type: row.recommended_solution_type || '',
    internal_solution_type_rationale: row.solution_type_rationale || '',
    internal_payment_readiness: row.payment_readiness || '',
    internal_audit: {
      what_the_business_does: row.what_the_business_does || '',
      issues: splitAuditField(row.top_3_issues_found).slice(0, 3),
      improvements: splitAuditField(row.top_3_improvements_proposed).slice(0, 3),
      social_channels_checked: row.social_channels_checked || '',
      review_platforms_checked: row.review_platforms_checked || '',
      competitors_checked: row.competitors_checked || '',
      search_ai_visibility_checked: row.search_ai_visibility_checked || '',
      evidence_refs: row.evidence_refs || ''
    },
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

  await fs.mkdir(path.dirname(outFile), { recursive: true });
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
