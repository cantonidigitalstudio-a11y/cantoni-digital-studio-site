import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { readLeadPipeline, writeLeadPipeline } from './lib/lead_pipeline_utils.mjs';

const execFile = promisify(execFileCb);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectDir = path.resolve(rootDir, '..');
const csvFile = path.join(rootDir, 'lead_pipeline.csv');
const queueDir = path.join(rootDir, 'queue');
const researchDir = path.join(rootDir, 'research');
const generatedDir = path.join(rootDir, 'generated');
const pauseFlagFile = path.join(rootDir, 'outbound_pause.flag');
const sendScript = path.join(projectDir, 'scripts/day1_send_background.sh');
const emailLogoPath = path.resolve(rootDir, '../assets/logo/cantoni_icona_quadrata.png');

const TARGET_COUNT = Number(process.env.TARGET_COUNT || 100);
const OVERPASS_FETCH_TIMEOUT_MS = Number(process.env.OVERPASS_FETCH_TIMEOUT_MS || 20000);
const CRAWL_TIMEOUT_MS = Number(process.env.CRAWL_TIMEOUT_MS || 9000);
const MAX_CRAWLS_PER_CITY = Number(process.env.MAX_CRAWLS_PER_CITY || 10);
const CITY_NAMES = String(
  process.env.LEAD_CITIES || 'Milano,Monza,Torino,Roma,Bologna,Firenze,Verona'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const SEND_ENABLED = process.env.SEND_ENABLED === 'true';
const SAVE_LEADS = process.env.SAVE_LEADS !== 'false';
const MAX_DOMAIN_REPEATS = Number(process.env.MAX_DOMAIN_REPEATS || 4);
const CANTONI_SITE_URL = 'https://cantonidigitalstudio.com';
const CANTONI_STUDIO_URL = `${CANTONI_SITE_URL}/studio.html`;
const CANTONI_CASE_STUDIES_URL = `${CANTONI_SITE_URL}/case-studies.html`;
const CANTONI_INSTAGRAM_URL = 'https://www.instagram.com/cantonidigitalstudio/';
const CANTONI_TIKTOK_URL = 'https://www.tiktok.com/@cantonidigitalstudio';
const CANTONI_YOUTUBE_URL = 'https://www.youtube.com/@cantonidigitalstudio';
const CANTONI_TERMS_URL = `${CANTONI_SITE_URL}/termini-commerciali.html`;

async function assertOutboundNotPaused() {
  if (process.env.OUTBOUND_FORCE_RUN === '1') return;
  try {
    const message = await fs.readFile(pauseFlagFile, 'utf8');
    throw new Error(`OUTBOUND_PAUSED\n${message.trim()}`);
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    throw error;
  }
}

const SECTOR_CONFIG = [
  { overpass: 'dentist', label: 'Dental clinic' },
  { overpass: 'lawyer', label: 'Legal services' },
  { overpass: 'estate_agent', label: 'Real estate' },
  { overpass: 'beauty', label: 'Beauty / med spa' }
];

const BAD_HOST_FRAGMENTS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'youtube.com',
  'treatwell.',
  'myshopify.com',
  'whatsapp.com',
  'wa.me'
];

const CONTACT_HINTS = [
  'contatti',
  'contatto',
  'contact',
  'contacts',
  'prenota',
  'book',
  'booking',
  'appuntamento',
  'dove-siamo',
  'find-us'
];

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

await assertOutboundNotPaused();

const GENERIC_INBOX_PREFIXES = [
  'info',
  'hello',
  'contact',
  'contatti',
  'booking',
  'bookings',
  'office',
  'segreteria',
  'amministrazione',
  'commerciale',
  'sales'
];

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function rootHost(raw) {
  const url = normalizeUrl(raw);
  if (!url) return '';
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return hostname;
  } catch {
    return '';
  }
}

function isBadHost(raw) {
  const host = rootHost(raw);
  if (!host) return true;
  return BAD_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
}

function pickEmail(raw) {
  const matches = String(raw || '')
    .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const unique = [...new Set(matches.map((item) => item.trim().toLowerCase()))];
  if (!unique.length) return '';
  const nonPec = unique.find((item) => !item.includes('pec'));
  return nonPec || unique[0];
}

function money(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

async function previewLogoSrc() {
  try {
    const logoBase64 = await fs.readFile(emailLogoPath, 'base64');
    return `data:image/png;base64,${logoBase64}`;
  } catch {
    return '';
  }
}

function stripHtml(html) {
  return normalizeWhitespace(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function clip(value, size = 220) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= size) return normalized;
  return `${normalized.slice(0, size - 1).trim()}…`;
}

function uniqueSegments(value) {
  const parts = String(value || '')
    .split(/[|•·]+/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
  return [...new Set(parts.map((item) => item.toLowerCase()))].map(
    (lower) => parts.find((item) => item.toLowerCase() === lower) || lower
  );
}

function cleanNarrativeSeed(value) {
  const segments = uniqueSegments(String(value || '').replace(/\s+-\s+/g, ' | '));
  return normalizeWhitespace(
    segments
      .slice(0, 2)
      .join(' | ')
      .replace(/\b(chiamaci|call us|contattaci|contattateci)\b.*$/i, '')
      .replace(/\b(email|phone|telefono|whatsapp|facebook|instagram)\b/gi, ' ')
      .replace(/\+?\d[\d\s().-]{6,}\d/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
  );
}

function isWeakNarrative(value) {
  const normalized = cleanNarrativeSeed(value).toLowerCase();
  if (!normalized || normalized.length < 28) return true;
  if (
    /^(benvenuti!?|welcome!?|home|homepage|contatti|contact|chi siamo|about us|servizi|services)$/.test(normalized)
  ) {
    return true;
  }
  if (/(facebook|instagram|email|phone|telefono|sabato|domenica|lunedì|martedì|mercoledì|giovedì|venerdì|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/.test(normalized)) {
    return true;
  }
  if (/^(studio legale|studio dentistico|agenzia immobiliare|beauty center)$/.test(normalized)) return true;
  const segments = uniqueSegments(normalized);
  if (segments.length === 1 && normalized.length < 42) return true;
  return false;
}

function extractMeaningfulSentence(value) {
  const sentences = normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);

  return (
    sentences.find((sentence) => {
      const lower = sentence.toLowerCase();
      return (
        sentence.length >= 55 &&
        sentence.length <= 220 &&
        !/(cookie|privacy|javascript|whatsapp|clicca|menu|benvenuti|welcome)/.test(lower) &&
        !/(facebook|instagram|email|phone|telefono|lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/.test(lower) &&
        !/^[A-Z0-9\s|,&-]+$/.test(sentence)
      );
    }) || ''
  );
}

function inferSector(tags) {
  if (tags.amenity === 'dentist' || tags.healthcare === 'dentist') return SECTOR_CONFIG[0];
  if (tags.office === 'lawyer') return SECTOR_CONFIG[1];
  if (tags.office === 'estate_agent') return SECTOR_CONFIG[2];
  return SECTOR_CONFIG[3];
}

async function overpassCandidates(city) {
const query = `[out:json][timeout:120];
area["name"="${city}"]["boundary"="administrative"]->.a;
(
  nwr["amenity"="dentist"]["website"](area.a);
  nwr["office"="lawyer"]["website"](area.a);
  nwr["office"="estate_agent"]["website"](area.a);
  nwr["shop"="beauty"]["website"](area.a);
  nwr["amenity"="beauty_salon"]["website"](area.a);
);
out center tags;`;

  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'Mozilla/5.0'
        },
        signal: AbortSignal.timeout(OVERPASS_FETCH_TIMEOUT_MS),
        body: new URLSearchParams({ data: query })
      });

      if (!response.ok) {
        lastError = new Error(`Overpass failed for ${city}: ${response.status} (${endpoint})`);
        if (response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 3500));
          continue;
        }
        continue;
      }

      const payload = await response.json();
      return Array.isArray(payload.elements) ? payload.elements : [];
    } catch (error) {
      lastError =
        error?.name === 'TimeoutError'
          ? new Error(`Overpass timed out for ${city} after ${OVERPASS_FETCH_TIMEOUT_MS}ms (${endpoint})`)
          : error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  throw lastError || new Error(`Overpass failed for ${city}`);
}

async function collectPageSnapshot(page, targetUrl) {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(400);
  return page.evaluate(({ contactHints }) => {
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    const title = document.title || '';
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    const h1 = Array.from(document.querySelectorAll('h1'))
      .map((node) => (node.textContent || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map((node) => ({
        href: node.href,
        text: (node.textContent || '').trim()
      }))
      .filter((item) => item.href);

    const likelyContactLinks = links
      .filter((item) => {
        const joined = `${item.href} ${item.text}`.toLowerCase();
        return contactHints.some((hint) => joined.includes(hint));
      })
      .slice(0, 4);

    return {
      title,
      metaDescription,
      h1,
      bodyText,
      html: document.documentElement.outerHTML,
      links,
      likelyContactLinks
    };
  }, { contactHints: CONTACT_HINTS });
}

async function crawlSite(browser, website) {
  const context = await browser.newContext({
    locale: 'it-IT',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
  });
  context.setDefaultNavigationTimeout(12000);
  context.setDefaultTimeout(8000);

  const page = await context.newPage();
  const homepage = await collectPageSnapshot(page, website);

  let contact = null;
  const sameHost = rootHost(website);
  for (const candidate of homepage.likelyContactLinks) {
    if (rootHost(candidate.href) !== sameHost) continue;
    try {
      contact = await collectPageSnapshot(page, candidate.href);
      contact.url = candidate.href;
      break;
    } catch {
      // keep trying
    }
  }

  await context.close();
  return { homepage, contact };
}

function extractAuditSignals(website, crawl, tags) {
  const homepageText = stripHtml(crawl.homepage.html);
  const contactText = crawl.contact ? stripHtml(crawl.contact.html) : '';
  const allText = `${homepageText} ${contactText}`.toLowerCase();
  const links = crawl.homepage.links || [];
  const allLinks = [...(crawl.homepage.links || []), ...(crawl.contact?.links || [])];
  const navCount = links.filter((item) => rootHost(item.href) === rootHost(website)).length;
  const hasNews = /(news|blog|articoli|insights|eventi|press|pubblicazioni)/i.test(allText);
  const hasBook = /(prenota|book|booking|appuntamento|prima visita|consulto)/i.test(allText);
  const hasServices =
    (allText.match(/servizi|trattamenti|aree di attivita|practice areas|immobili|case|massaggi|laser|implantologia|endodonzia/gi) || [])
      .length > 4;
  const hasTeam = /(team|professionisti|partners|staff|medici|avvocati)/i.test(allText);
  const hasInternational = /(english|international|multilingua|internazionale|global|worldwide)/i.test(allText);
  const hrefEmailText = allLinks
    .map((item) => {
      const href = String(item.href || '').trim();
      if (!href) return '';
      if (href.toLowerCase().startsWith('mailto:')) {
        return decodeURIComponent(href.slice(7));
      }
      return href;
    })
    .join(' ');
  const contactEmails = pickEmail(
    `${tags.email || ''} ${tags['contact:email'] || ''} ${homepageText} ${contactText} ${hrefEmailText}`
  );
  const websiteHost = rootHost(website);
  const emailMatches =
    String(`${homepageText} ${contactText} ${hrefEmailText}`).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const uniqueEmails = [...new Set(emailMatches.map((item) => item.trim().toLowerCase()))];
  const offDomainEmails = uniqueEmails.filter((email) => !email.endsWith(`@${websiteHost}`));
  const brokenLoadingStates = (
    String(crawl.homepage.bodyText || '').match(/\bloading\b/gi) || []
  ).length + (
    String(crawl.contact?.bodyText || '').match(/\bloading\b/gi) || []
  ).length;
  const hasEmptyInventory =
    /(showing\s+0\s+of\s+0|0 of 0|nessun risultato|no results)/i.test(allText);
  const hasPlaceholderPolicies =
    crawl.homepage.html.includes('href="#"') || (crawl.contact?.html || '').includes('href="#"');
  const genericInbox = contactEmails
    ? GENERIC_INBOX_PREFIXES.includes(contactEmails.split('@')[0].toLowerCase())
    : false;

  return {
    title: crawl.homepage.title,
    description: crawl.homepage.metaDescription,
    h1: crawl.homepage.h1.join(' | '),
    leadSentence: extractMeaningfulSentence(`${crawl.homepage.bodyText || ''} ${crawl.contact?.bodyText || ''}`),
    navCount,
    hasNews,
    hasBook,
    hasServices,
    hasTeam,
    hasInternational,
    contactEmail: contactEmails,
    uniqueEmails,
    offDomainEmails,
    genericInbox,
    brokenLoadingStates,
    hasEmptyInventory,
    hasPlaceholderPolicies,
    phone: normalizeWhitespace(tags.phone || tags['contact:phone'] || ''),
    homepageText: clip(homepageText, 700),
    contactUrl: crawl.contact?.url || ''
  };
}

function sectorNarrative(sector, name, city, signals) {
  const seed = [signals.description, signals.leadSentence, signals.h1, signals.title]
    .map((item) => cleanNarrativeSeed(item))
    .find((item) => !isWeakNarrative(item));
  if (seed) {
    return /[.!?]$/.test(seed) ? clip(seed, 190) : `${clip(seed, 186)}.`;
  }

  switch (sector.label) {
    case 'Dental clinic':
      return `${name} opera a ${city} nell'area odontoiatrica con un posizionamento clinico e un potenziale alto sulla prima visita e sui trattamenti a maggior valore.`;
    case 'Legal services':
      return `${name} opera a ${city} nell'ambito legale con un posizionamento professionale che può convertire meglio le visite in richieste consulenziali qualificate.`;
    case 'Real estate':
      return `${name} opera a ${city} nel mercato immobiliare con una leva forte su acquisizione incarichi, valutazioni e appuntamenti di qualità.`;
    default:
      return `${name} opera a ${city} in ambito beauty/wellness e può trasformare meglio il traffico in prenotazioni e richieste ad alto valore.`;
  }
}

function issuesAndImprovements(sector, signals) {
  const issues = [];
  const improvements = [];
  const navDispersion = signals.navCount > 35;

  if (signals.offDomainEmails.length) {
    issues.push(
      `Nel sito compaiono riferimenti email non coerenti con il dominio principale (${signals.offDomainEmails.slice(0, 2).join(', ')}), elemento che abbassa fiducia e percezione di solidità.`
    );
    improvements.push('Allineare tutti i recapiti commerciali e operativi su un unico dominio coerente.');
  }

  if (signals.brokenLoadingStates > 0 || signals.hasEmptyInventory) {
    issues.push(
      'Alcune sezioni del sito sembrano incomplete o in stato di caricamento vuoto, quindi il visitatore percepisce il progetto come non finito.'
    );
    improvements.push('Ripristinare o sostituire le sezioni incomplete con contenuti reali e navigabili.');
  }

  if (signals.hasPlaceholderPolicies) {
    issues.push(
      'Sono presenti link o sezioni legali non completati, dettaglio che indebolisce qualità percepita e affidabilità del brand.'
    );
    improvements.push('Chiudere privacy, termini e pagine di servizio con contenuti reali e link funzionanti.');
  }

  if (sector.label === 'Dental clinic') {
    issues.push(
      signals.hasBook
        ? 'La prenotazione o la prima visita sono presenti, ma nel percorso iniziale non emergono con forza dominante rispetto al resto dei contenuti.'
        : 'Nel percorso iniziale non emerge con sufficiente chiarezza il primo passo verso prenotazione o prima visita.'
    );
    issues.push(
      signals.hasServices
        ? 'Il sito presenta molti trattamenti e contenuti clinici, ma segmenta poco il paziente per bisogno, priorità o primo trattamento.'
        : 'Il sito comunica bene competenza e servizi, ma guida ancora poco il paziente verso il trattamento o il contatto più adatto.'
    );
    issues.push(
      signals.hasNews
        ? 'La parte informativa e di autorevolezza pesa più del funnel di conversione verso contatto o prima visita.'
        : 'Autorevolezza e contatti ci sono, ma non sono orchestrati in una sequenza commerciale abbastanza compatta, soprattutto su mobile.'
    );

    improvements.push('Rendere la prima visita o la prenotazione la CTA dominante del first screen.');
    improvements.push('Segmentare meglio i percorsi per implantologia, estetica, urgenze o nuovi pazienti.');
    improvements.push('Riorganizzare trust, team e prove in una sequenza più corta e più orientata alla conversione.');
  } else if (sector.label === 'Legal services') {
    issues.push(
      'Il sito trasmette autorevolezza, ma il primo impatto resta più istituzionale che orientato alla richiesta consulenziale.'
    );
    issues.push(
      signals.hasTeam
        ? 'Team, practice areas e standing sono presenti, ma il ponte tra competenza e bisogno concreto del cliente resta poco diretto.'
        : 'Le competenze sono percepibili, ma non vengono ancora tradotte in percorsi chiari per chi deve capire subito se lo studio è il partner giusto.'
    );
    issues.push(
      signals.hasInternational
        ? 'La leva internazionale è presente, ma non viene sfruttata abbastanza come acceleratore del contatto business.'
        : 'La pagina contatti e il percorso verso il primo colloquio possono essere resi molto più chiari e più commerciali.'
    );

    improvements.push('Riposizionare l’apertura con una promessa più netta e una CTA primaria verso la consulenza.');
    improvements.push('Trasformare practice areas e profili in percorsi più leggibili per bisogni e casi d’uso reali.');
    improvements.push('Rendere la richiesta di contatto più evidente, diretta e credibile anche su mobile.');
  } else if (sector.label === 'Real estate') {
    issues.push(
      'Il sito mostra immobili o servizi, ma il valore distintivo dell’agenzia nel primo impatto resta meno dominante del potenziale.'
    );
    issues.push(
      navDispersion
        ? 'Ci sono molti percorsi e molte voci di navigazione, quindi l’utente può disperdersi prima di arrivare a valutazione o appuntamento.'
        : 'Il percorso verso valutazione, appuntamento o richiesta informazioni può essere reso molto più diretto.'
    );
    issues.push(
      'La componente fiduciaria locale esiste, ma può essere resa molto più forte per aumentare richieste qualificate e incarichi.'
    );

    improvements.push('Rendere più chiaro il posizionamento locale e la differenziazione dell’agenzia nel first screen.');
    improvements.push('Rafforzare il funnel verso valutazione immobile, appuntamento e primo contatto commerciale.');
    improvements.push('Ridurre la dispersione tra listing, servizi secondari e contenuti meno strategici.');
  } else {
    issues.push(
      signals.hasBook
        ? 'La prenotazione è presente, ma non domina abbastanza il percorso iniziale rispetto a servizi, visual e contenuti secondari.'
        : 'Il primo passo verso prenotazione o consulenza non è ancora abbastanza evidente nel percorso iniziale.'
    );
    issues.push(
      signals.hasServices
        ? 'Il sito presenta bene servizi e trattamenti, ma li segmenta poco per bisogni, risultati o priorità della cliente.'
        : 'La proposta è leggibile, ma il sito può trasformare molto meglio l’interesse in richieste o prenotazioni concrete.'
    );
    issues.push(
      signals.hasNews
        ? 'Contenuti e materiali accessori prendono spazio rispetto alla parte più orientata alla conversione.'
        : 'Trust, risultati e contatti possono essere orchestrati in una sequenza più corta e più persuasiva.'
    );

    improvements.push('Rendere prenotazione, consulenza o trattamento iniziale la CTA primaria del first screen.');
    improvements.push('Segmentare servizi e offerte in percorsi più chiari per bisogno, trattamento o obiettivo.');
    improvements.push('Accorciare il percorso tra interesse, fiducia e prenotazione, soprattutto su mobile.');
  }

  return { issues, improvements };
}

function verifyCandidate(candidate) {
  const failures = [];
  const websiteHost = rootHost(candidate.website);
  const sameDomainEmail =
    candidate.email && websiteHost ? String(candidate.email).trim().toLowerCase().endsWith(`@${websiteHost}`) : false;

  if (!candidate.email || !candidate.email.includes('@')) {
    failures.push('missing_email');
  }

  if (isWeakNarrative(candidate.whatTheBusinessDoes)) {
    failures.push('weak_narrative');
  }

  if (isWeakNarrative(candidate.emailAngle)) {
    failures.push('weak_email_angle');
  }

  if (!candidate.issues || candidate.issues.length < 3) {
    failures.push('insufficient_issues');
  }

  if (!candidate.improvements || candidate.improvements.length < 3) {
    failures.push('insufficient_improvements');
  }

  if (candidate.signals.genericInbox && !candidate.signals.contactUrl && !sameDomainEmail) {
    failures.push('generic_inbox_without_contact_source');
  }

  if (candidate.signals.brokenLoadingStates === 0 && candidate.signals.hasEmptyInventory === false && candidate.signals.offDomainEmails.length === 0 && candidate.signals.navCount < 8) {
    failures.push('insufficient_specific_audit_signals');
  }

  return {
    ok: failures.length === 0,
    failures
  };
}

function buildEmailAngle(sector, name, signals) {
  if (sector.label === 'Dental clinic') {
    if (signals.hasBook) {
      return `${name} trasmette competenza clinica, ma oggi prima visita, urgenze e trattamenti ad alto valore non emergono con una gerarchia abbastanza netta da trasformare più visite in contatti concreti.`;
    }
    return `${name} comunica bene competenza e trattamenti, ma il percorso iniziale può guidare molto meglio il paziente verso richiesta di prima visita o consulto.`;
  }

  if (sector.label === 'Legal services') {
    if (signals.hasInternational) {
      return `${name} comunica standing professionale e apertura internazionale, ma il sito può trasformare molto meglio questa autorevolezza in richieste consulenziali qualificate.`;
    }
    return `${name} ha una presenza istituzionale solida, ma il percorso tra competenza percepita e richiesta di consulenza può essere reso molto più diretto e convincente.`;
  }

  if (sector.label === 'Real estate') {
    if (signals.navCount > 35) {
      return `${name} presenta servizi e immobili in modo credibile, ma oggi il volume di percorsi e contenuti disperde parte del traffico prima di arrivare a valutazione, appuntamento o richiesta informazioni.`;
    }
    return `${name} ha una base credibile, ma il sito può guidare molto meglio il visitatore verso valutazione, appuntamento o richiesta commerciale qualificata.`;
  }

  if (signals.hasBook) {
    return `${name} ha un’offerta leggibile, ma il sito può trasformare molto meglio interesse e fiducia in prenotazioni e richieste ad alto valore.`;
  }

  return `${name} comunica servizi e posizionamento, ma il percorso iniziale può essere reso molto più diretto per aumentare richieste e prenotazioni qualificate.`;
}

function impactAndPricing(sector, signals) {
  const complexity = Number(signals.navCount > 35) + Number(signals.hasNews) + Number(signals.hasInternational) + Number(signals.hasServices);
  const pricing = {
    'Dental clinic': { base: 3200, growth: 4300, monthly: 590 },
    'Legal services': { base: 4100, growth: 5600, monthly: 780 },
    'Real estate': { base: 3000, growth: 4200, monthly: 620 },
    'Beauty / med spa': { base: 2600, growth: 3600, monthly: 520 }
  }[sector.label];

  const growth = pricing.growth + complexity * 250;
  const base = pricing.base + complexity * 180;
  const monthly = pricing.monthly + complexity * 40;

  let impact;
  if (sector.label === 'Dental clinic') {
    impact = [
      '+12% / +25% richieste qualificate per prima visita',
      '+10% / +20% conversione su trattamenti ad alto valore',
      'Riduzione dell’attrito tra visita del sito e contatto'
    ];
  } else if (sector.label === 'Legal services') {
    impact = [
      '+10% / +18% richieste qualificate',
      '+8% / +15% conversione del traffico ad alta intenzione',
      'Percorso più chiaro tra competenza percepita e contatto'
    ];
  } else if (sector.label === 'Real estate') {
    impact = [
      '+12% / +24% richieste qualificate',
      '+10% / +18% conversione verso valutazione o appuntamento',
      'Maggiore percezione del valore locale e dell’agenzia'
    ];
  } else {
    impact = [
      '+10% / +22% prenotazioni o richieste qualificate',
      '+8% / +18% conversione del traffico esistente',
      'Percorso più diretto tra interesse, fiducia e prenotazione'
    ];
  }

  return { base, growth, monthly, impact };
}

function buildBody(row) {
  const firstIssue = row.top_3_issues_found.split('|')[0]?.trim() || '';
  const secondIssue = row.top_3_issues_found.split('|')[1]?.trim() || '';
  const thirdIssue = row.top_3_issues_found.split('|')[2]?.trim() || '';
  const firstImpact = row.expected_business_impact_range.split('|')[0]?.trim() || '';
  return [
    'Buongiorno,',
    '',
    `ho analizzato con attenzione il sito di ${row.business_name}.`,
    '',
    row.email_angle,
    '',
    'Le tre aree che, a mio avviso, oggi limitano di più il rendimento del sito sono queste:',
    '',
    firstIssue ? `1. ${firstIssue}` : '',
    secondIssue ? `2. ${secondIssue}` : '',
    thirdIssue ? `3. ${thirdIssue}` : '',
    '',
    firstImpact ? `Il motivo per cui lo segnalo e semplice: puo tradursi in ${firstImpact}.` : '',
    '',
    'Se prima di rispondere desiderate verificare chi siamo e come lavoriamo, trovate qui i riferimenti pubblici dello studio:',
    CANTONI_STUDIO_URL,
    'Case studies:',
    CANTONI_CASE_STUDIES_URL,
    'Instagram:',
    CANTONI_INSTAGRAM_URL,
    'Condizioni commerciali:',
    CANTONI_TERMS_URL,
    '',
    'Se di vostro interesse, posso prepararvi una proposta operativa chiara, con priorita, tempi e investimento coerente con il lavoro reale da fare.',
    '',
    'In quel caso, mi basta un vostro riscontro e vi invio il materiale completo.',
    '',
    'Cordiali saluti,',
    'Cantoni Digital Studio',
    'cantonidigitalstudio@gmail.com'
  ].filter(Boolean).join('\n');
}

function buildHtml(row, body) {
  const safe = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const issuedLabel = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const issues = row.top_3_issues_found
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(
      (item) =>
        `<li style="margin:0 0 12px 0;color:#334155;font:15px/1.7 Arial,sans-serif;"><strong style="color:#16233d;">Osservazione:</strong> ${safe(item)}</li>`
    )
    .join('');

  const improvements = row.top_3_improvements_proposed
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(
      (item) =>
        `<li style="margin:0 0 12px 0;color:#334155;font:15px/1.7 Arial,sans-serif;">${safe(item)}</li>`
    )
    .join('');

  const firstImpact = row.expected_business_impact_range
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)[0] || '';

  const verifyBlock = `
    <div style="margin-top:18px;padding:22px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:10px;">Riferimenti verificabili</div>
      <p style="margin:0 0 14px 0;font:15px/1.7 Arial,sans-serif;color:#334155;">Prima di rispondere potete verificare identità pubblica, lavori, presenza social e condizioni commerciali dello studio.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${safe(CANTONI_STUDIO_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Profilo studio</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${safe(CANTONI_CASE_STUDIES_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Case studies</a></td>
        </tr>
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${safe(CANTONI_INSTAGRAM_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Instagram</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${safe(CANTONI_TIKTOK_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">TikTok</a></td>
        </tr>
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${safe(CANTONI_YOUTUBE_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">YouTube</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${safe(CANTONI_TERMS_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Condizioni commerciali</a></td>
        </tr>
      </table>
      <p style="margin:14px 0 0 0;font:14px/1.7 Arial,sans-serif;color:#526074;">Sede operativa in Italia. Focus su redesign, funnel, consulenza e costruzione di un ecosistema premium in crescita.</p>
    </div>`;

  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${safe(row.business_name)} - osservazione sul sito</title></head><body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#1d2433;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f9;padding:28px 14px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:860px;background:#f8fafc;border:1px solid #dbe4ee;border-radius:24px;overflow:hidden;"><tr><td style="padding:30px 34px 24px 34px;background:#111c33;border-bottom:1px solid #1f2b45;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td valign="top" width="110" style="padding-right:18px;"><div style="width:92px;height:92px;border-radius:18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);padding:10px;"><img src="cid:cantoniLogo" alt="Cantoni Digital Studio" style="display:block;width:72px;height:72px;border-radius:14px;"></div></td><td valign="top" style="padding-left:18px;border-left:2px solid #f5c551;"><div style="font-size:16px;font-weight:800;letter-spacing:.02em;color:#f5c551;">CANTONI DIGITAL STUDIO</div><div style="font-size:10.5px;font-weight:700;letter-spacing:.04em;color:#d8e1ec;padding-top:8px;">Analisi iniziale riservata · ${safe(issuedLabel)} · ${safe(rootHost(row.website) || row.website)}</div><div style="font-size:34px;line-height:1.12;font-weight:800;color:#ffffff;padding-top:12px;">${safe(row.business_name)} - osservazione rapida sul sito</div><div style="font-size:16px;line-height:1.65;color:#d8e1ec;max-width:620px;padding-top:10px;">Questa email non contiene ancora un preventivo. È una prima analisi del sito live <strong>${safe(rootHost(row.website) || row.website)}</strong>, utile a capire se vale la pena aprire un confronto serio dentro un ecosistema commerciale più ampio.</div></td></tr></table></td></tr><tr><td style="padding:26px 34px 6px 34px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 14px;"><tr><td width="33.33%" valign="top" style="padding-right:9px;"><div style="padding:18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;min-height:128px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:800;padding-bottom:10px;">Cliente</div><div style="font-size:20px;font-weight:800;line-height:1.2;color:#0f172a;">${safe(row.business_name)}</div><div style="font-size:14px;line-height:1.65;color:#526074;padding-top:6px;">${safe(row.city)} - ${safe(row.sector)}</div></div></td><td width="33.33%" valign="top" style="padding:0 5px;"><div style="padding:18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;min-height:128px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:800;padding-bottom:10px;">Sito analizzato</div><div style="font-size:20px;font-weight:800;line-height:1.2;color:#0f172a;">${safe(rootHost(row.website) || row.website)}</div><div style="font-size:14px;line-height:1.65;color:#526074;padding-top:6px;">Analisi basata sul sito pubblico oggi visibile.</div></div></td><td width="33.33%" valign="top" style="padding-left:9px;"><div style="padding:18px;background:#111c33;border:1px solid #111c33;border-radius:18px;min-height:128px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#f7c87e;font-weight:800;padding-bottom:10px;">Focus</div><div style="font-size:22px;font-weight:800;line-height:1.2;color:#ffffff;">Conversione e credibilità</div><div style="font-size:14px;line-height:1.65;color:#dbe4f0;padding-top:6px;">Posizionamento, chiarezza commerciale e qualità del contatto dentro il network Cantoni.</div></div></td></tr></table></td></tr><tr><td style="padding:0 34px 18px 34px;"><div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;"><p style="margin:0 0 12px 0;font:16px/1.8 Arial,sans-serif;color:#1f2937;">Buongiorno,</p><p style="margin:0 0 12px 0;font:16px/1.8 Arial,sans-serif;color:#1f2937;">ho analizzato con attenzione il sito di <strong>${safe(row.business_name)}</strong>.</p><p style="margin:0;font:16px/1.8 Arial,sans-serif;color:#1f2937;">${safe(row.email_angle)}</p></div></td></tr><tr><td style="padding:0 34px 18px 34px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td valign="top" width="50%" style="padding-right:10px;"><div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;height:100%;"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:12px;">Tre punti che oggi frenano il rendimento</div><ol style="margin:0;padding-left:22px;">${issues}</ol></div></td><td valign="top" width="50%" style="padding-left:10px;"><div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;height:100%;"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:12px;">Come lo imposterei</div><ul style="margin:0;padding-left:22px;">${improvements}</ul></div></td></tr></table></td></tr><tr><td style="padding:0 34px 18px 34px;"><div style="padding:24px;background:#111c33;border-radius:20px;"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#f5c551;padding-bottom:10px;">Impatto atteso</div><div style="font:16px/1.8 Arial,sans-serif;color:#d6dde7;">${safe(firstImpact ? `Il punto non è estetico: questa revisione può tradursi in ${firstImpact}.` : 'Il punto non è estetico: serve aumentare chiarezza, qualità del contatto e conversione reale.')}</div></div></td></tr><tr><td style="padding:0 34px 28px 34px;"><div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;"><div style="font-size:15px;line-height:1.8;color:#334155;">Se il tema vi interessa, preparo una proposta operativa chiara con priorità, tempi e investimento coerente con il lavoro reale da fare.<br><br>In quel caso, mi basta un vostro riscontro e vi invio il materiale completo.</div>${verifyBlock}<div style="margin-top:18px;padding:18px 20px;background:#fff7ef;border:1px solid #f1dcc2;border-radius:18px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b4742f;font-weight:700;padding-bottom:8px;">Prossimo passo</div><p style="margin:0;font:15px/1.7 Arial,sans-serif;color:#334155;">Rispondete a questa mail e preparo una proposta completa, con priorità operative, investimento e ordine di esecuzione.</p></div><div style="margin-top:18px;padding:20px 22px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td valign="top" width="58%" style="padding-right:10px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:800;padding-bottom:8px;">Cantoni Digital Studio</div><div style="font:15px/1.75 Arial,sans-serif;color:#334155;">Website redesign, funnel, consulenza commerciale e costruzione di un ecosistema premium per business che vogliono più richieste, più vendite e più leva strategica.</div></td><td valign="top" width="42%" style="padding-left:10px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700;padding-bottom:8px;">Identità studio</div><div style="font:14px/1.7 Arial,sans-serif;color:#526074;">Sede operativa: Italia<br><a href="${safe(CANTONI_SITE_URL)}" style="color:#1c345d;text-decoration:none;font-weight:700;">${safe(CANTONI_SITE_URL)}</a><br><a href="mailto:cantonidigitalstudio@gmail.com" style="color:#1c345d;text-decoration:none;font-weight:700;">cantonidigitalstudio@gmail.com</a></div></td></tr></table></div></div></td></tr></table></td></tr></table></body></html>`;
}

async function appendRows(newRows) {
  const rows = await readLeadPipeline(csvFile);
  const headers = Object.keys(rows[0]);
  rows.push(...newRows.map((row) => {
    const out = {};
    for (const header of headers) out[header] = row[header] ?? '';
    return out;
  }));
  await writeLeadPipeline(csvFile, rows, headers);
}

function nextLeadId(existingRows, offset) {
  const maxId = existingRows
    .map((row) => row.lead_id || '')
    .map((value) => Number(String(value).split('-').pop()))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 1000);
  return `LD-${String(maxId + offset + 1).padStart(4, '0')}`;
}

async function main() {
  const existingRows = await readLeadPipeline(csvFile);
  const existingEmails = new Set(existingRows.map((row) => String(row.email || '').trim().toLowerCase()).filter(Boolean));
  const existingHosts = new Set(existingRows.map((row) => rootHost(row.website)).filter(Boolean));
  const existingNames = new Set(existingRows.map((row) => normalizeWhitespace(row.business_name).toLowerCase()).filter(Boolean));

  const browser = await chromium.launch({ headless: true });
  const candidates = [];
  const hostFrequency = new Map();
  const skipReasons = new Map();
  const gateFailures = new Map();

  const trackReason = (bucket, reason) => {
    bucket.set(reason, (bucket.get(reason) || 0) + 1);
  };

  for (const city of CITY_NAMES) {
    const elements = await overpassCandidates(city);
    let crawledForCity = 0;
    for (const element of elements) {
      if (candidates.length >= TARGET_COUNT * 3) break;
      const tags = element.tags || {};
      const rawWebsite = normalizeUrl(tags.website);
      if (!rawWebsite) {
        trackReason(skipReasons, 'missing_or_invalid_website');
        continue;
      }
      if (isBadHost(rawWebsite)) {
        trackReason(skipReasons, 'bad_host');
        continue;
      }
      const host = rootHost(rawWebsite);
      if (!host) {
        trackReason(skipReasons, 'missing_host');
        continue;
      }
      if (existingHosts.has(host)) {
        trackReason(skipReasons, 'existing_host');
        continue;
      }
      if ((hostFrequency.get(host) || 0) >= MAX_DOMAIN_REPEATS) {
        trackReason(skipReasons, 'host_frequency_cap');
        continue;
      }
      const businessName = normalizeWhitespace(tags.name);
      if (!businessName) {
        trackReason(skipReasons, 'missing_business_name');
        continue;
      }
      if (existingNames.has(businessName.toLowerCase())) {
        trackReason(skipReasons, 'existing_business_name');
        continue;
      }
      if (crawledForCity >= MAX_CRAWLS_PER_CITY) {
        trackReason(skipReasons, 'max_crawls_per_city_reached');
        break;
      }

      try {
        crawledForCity += 1;
        const crawl = await Promise.race([
          crawlSite(browser, rawWebsite),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`crawl timeout after ${CRAWL_TIMEOUT_MS}ms`)), CRAWL_TIMEOUT_MS)
          )
        ]);
        const signals = extractAuditSignals(rawWebsite, crawl, tags);
        const email = pickEmail(tags.email || tags['contact:email'] || signals.contactEmail);
        if (!email) {
          trackReason(skipReasons, 'missing_email_after_crawl');
          continue;
        }
        if (existingEmails.has(email.toLowerCase())) {
          trackReason(skipReasons, 'existing_email');
          continue;
        }

        const sector = inferSector(tags);
        const { issues, improvements } = issuesAndImprovements(sector, signals);
        const pricing = impactAndPricing(sector, signals);
        const slug = slugify(businessName || host);
        const cityLabel = normalizeWhitespace(tags['addr:city'] || city);
        const whatTheBusinessDoes = sectorNarrative(sector, businessName, cityLabel || city, signals);
        const emailAngle = buildEmailAngle(sector, businessName, signals);
        if (isWeakNarrative(whatTheBusinessDoes)) {
          trackReason(skipReasons, 'weak_narrative_pre_gate');
          continue;
        }
        if (isWeakNarrative(emailAngle)) {
          trackReason(skipReasons, 'weak_email_angle_pre_gate');
          continue;
        }

        candidates.push({
          businessName,
          email,
          phone: signals.phone,
          city: cityLabel || city,
          country: 'Italy',
          sector: sector.label,
          website: rawWebsite,
          whatTheBusinessDoes,
          issues,
          improvements,
          impact: pricing.impact,
          basePrice: pricing.base,
          growthPrice: pricing.growth,
          monthlyPrice: pricing.monthly,
          emailAngle,
          signals,
          notes: [
            'Audit live su homepage',
            signals.contactUrl ? `contatti verificati su ${signals.contactUrl}` : 'contatti ricavati da homepage / OSM',
            signals.hasInternational ? 'leva internazionale presente' : '',
            signals.hasNews ? 'contenuti/editoriale visibili nel percorso' : '',
            signals.offDomainEmails.length ? `email incoerenti rilevate: ${signals.offDomainEmails.slice(0, 2).join(', ')}` : '',
            signals.hasEmptyInventory ? 'sezioni con inventory vuota rilevate' : '',
            signals.hasPlaceholderPolicies ? 'link placeholder rilevati' : ''
          ].filter(Boolean).join('; '),
          slug,
          host
        });

        hostFrequency.set(host, (hostFrequency.get(host) || 0) + 1);
        existingEmails.add(email.toLowerCase());
        existingHosts.add(host);
        existingNames.add(businessName.toLowerCase());
      } catch (error) {
        if (String(error?.message || '').includes('crawl timeout')) {
          trackReason(skipReasons, 'crawl_timeout');
        } else {
          trackReason(skipReasons, 'crawl_failure');
        }
      }
    }
    console.log(JSON.stringify({ city, elements: elements.length, crawledForCity, queuedSoFar: candidates.length }));
  }

  const selected = candidates.slice(0, TARGET_COUNT);
  const verified = selected
    .map((candidate) => ({ candidate, gate: verifyCandidate(candidate) }))
    .filter((item) => {
      for (const failure of item.gate.failures) trackReason(gateFailures, failure);
      return item.gate.ok;
    })
    .map((item) => item.candidate);

  const diagnostics = {
    skipReasons: Object.fromEntries([...skipReasons.entries()].sort((a, b) => b[1] - a[1])),
    gateFailures: Object.fromEntries([...gateFailures.entries()].sort((a, b) => b[1] - a[1]))
  };

  if (!verified.length) {
    console.log(JSON.stringify(diagnostics));
    throw new Error('No valid candidates discovered.');
  }

  const createdAt = new Date().toISOString();
  const newRows = [];
  const queue = [];
  const previewItems = [];

  for (const [index, candidate] of verified.entries()) {
    const leadId = nextLeadId(existingRows, index);
    const recommendedPackagePrice = money(candidate.growthPrice);
    const row = {
      lead_id: leadId,
      created_at: createdAt,
      business_name: candidate.businessName,
      contact_name: '',
      email: candidate.email,
      phone: candidate.phone || '',
      country: 'Italy',
      city: candidate.city,
      sector: candidate.sector,
      website: candidate.website,
      status: 'READY_TO_CONTACT',
      last_action: '',
      next_action_date: '',
      priority: 'HIGH',
      budget_range: `${candidate.basePrice}-${candidate.growthPrice} EUR`,
      preferred_language: 'it',
      first_contact_language: 'it',
      current_quote_language: 'it',
      currency: 'EUR',
      translation_quality_check: 'PASS',
      source: 'osm_overpass_live_audit',
      what_the_business_does: candidate.whatTheBusinessDoes,
      top_3_issues_found: candidate.issues.join('|'),
      top_3_improvements_proposed: candidate.improvements.join('|'),
      expected_business_impact_range: candidate.impact.join('|'),
      recommended_package: 'Growth',
      recommended_package_price: recommendedPackagePrice,
      recommended_currency: 'EUR',
      recommended_language: 'it',
      email_angle: candidate.emailAngle,
      timeline: candidate.sector === 'Legal services' ? '5-6 settimane' : '4-5 settimane',
      base_deliverables:
        candidate.sector === 'Legal services'
          ? 'Revisione hero e CTA primaria|Pulizia percorso competenze-contatto|Ottimizzazione contatti'
          : candidate.sector === 'Dental clinic'
            ? 'Revisione hero e CTA prima visita|Pulizia percorso servizi-contatto|Ottimizzazione contatti'
            : candidate.sector === 'Real estate'
              ? 'Revisione opening e CTA agenzia|Pulizia percorso listing-contatto|Ottimizzazione contatti'
              : 'Revisione hero e CTA primaria|Pulizia percorso servizi-prenotazione|Ottimizzazione contatti',
      growth_deliverables:
        candidate.sector === 'Legal services'
          ? 'Funnel consulenziale per bisogno cliente|Trust e contenuti meglio orchestrati|UX mobile conversion-focused'
          : candidate.sector === 'Dental clinic'
            ? 'Funnel prima visita e trattamenti|Trust, team e prove meglio orchestrati|UX mobile conversion-focused'
            : candidate.sector === 'Real estate'
              ? 'Funnel valutazione e appuntamento|Trust locale e differenziazione commerciale|UX mobile conversion-focused'
              : 'Funnel prenotazione e servizi|Trust e prove meglio orchestrati|UX mobile conversion-focused',
      monthly_deliverables: 'Ottimizzazioni CRO mensili|Aggiornamento landing e contenuti|Supporto continuativo',
      notes: candidate.notes,
      last_error: '',
      base_price: String(candidate.basePrice),
      growth_price: String(candidate.growthPrice),
      monthly_price: String(candidate.monthlyPrice)
    };

    const body = buildBody(row);
    const html = buildHtml(row, body);
    queue.push({
      id: `${candidate.city.toUpperCase()}-${candidate.slug.toUpperCase()}-001`.slice(0, 80),
      lead_id: leadId,
      to: candidate.email,
      subject: `${candidate.businessName}: osservazione rapida sul sito`,
      body,
      html_body: html,
      crm_status_on_send: 'CONTACTED',
      next_action_days: 3,
      sender_name: 'Cantoni Digital Studio',
      reply_to: 'cantonidigitalstudio@gmail.com'
    });
    previewItems.push({
      leadId,
      businessName: candidate.businessName,
      html
    });

    newRows.push(row);
  }

  if (SAVE_LEADS) {
    await appendRows(newRows);
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const queueFile = path.join(queueDir, `italy_local_batch_${timestamp}_${Date.now()}.json`);
  await fs.writeFile(queueFile, JSON.stringify(queue, null, 2), 'utf8');

  const researchFile = path.join(researchDir, `italy_batch_${timestamp}_${Date.now()}.md`);
  const researchMd = [
    '# Italy Local Batch',
    '',
    `Generated at: ${createdAt}`,
    `Target count: ${verified.length}`,
    '',
    ...newRows.map((row) => [
      `## ${row.business_name}`,
      `- lead_id: ${row.lead_id}`,
      `- settore: ${row.sector}`,
      `- città: ${row.city}`,
      `- sito: ${row.website}`,
      `- email: ${row.email}`,
      `- stato: READY_TO_CONTACT`,
      `- note: ${row.notes}`,
      ''
    ].join('\n'))
  ].join('\n');
  await fs.writeFile(researchFile, researchMd, 'utf8');

  const previewRoot = path.join(generatedDir, 'day1-previews');
  const logoSrc = await previewLogoSrc();
  await fs.mkdir(previewRoot, { recursive: true });
  for (const item of previewItems) {
    const previewPath = path.join(
      previewRoot,
      `${normalizeWhitespace(item.leadId).toLowerCase()}-${slugify(item.businessName)}.html`
    );
    const previewHtml = logoSrc ? item.html.replaceAll('cid:cantoniLogo', logoSrc) : item.html;
    await fs.writeFile(previewPath, previewHtml, 'utf8');
  }

  if (SEND_ENABLED) {
    await execFile(sendScript, [queueFile], {
      cwd: projectDir,
      env: {
        ...process.env,
        SEND_ENABLED: 'true',
        MAX_PER_RUN: String(selected.length)
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        generated: verified.length,
        discovered: candidates.length,
        queueFile,
        researchFile,
        sendEnabled: SEND_ENABLED,
        leadIds: newRows.map((row) => row.lead_id)
      },
      null,
      2
    )
  );
  console.log(JSON.stringify(diagnostics));
  await browser.close();
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
