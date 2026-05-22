import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  nextActionDateFrom,
  readLeadPipeline,
  resolveMarketSummary,
  resolveCurrency,
  resolveLanguage,
  splitAuditField,
  validateLeadForQuote,
  writeLeadPipeline
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const defaultCsvFile = process.env.LEAD_PIPELINE_CSV
  ? path.resolve(process.env.LEAD_PIPELINE_CSV)
  : path.resolve(salesKitDir, 'lead_pipeline.csv');
const defaultRepliesFile = process.env.REPLIES_INBOX_FILE
  ? path.resolve(process.env.REPLIES_INBOX_FILE)
  : path.resolve(salesKitDir, 'queue/replies_inbox.json');
const replyDraftsDir = process.env.REPLY_DRAFTS_DIR
  ? path.resolve(process.env.REPLY_DRAFTS_DIR)
  : path.resolve(salesKitDir, 'reply-drafts');
const quoteInputsDir = process.env.QUOTE_INPUT_OUTPUT_DIR
  ? path.resolve(process.env.QUOTE_INPUT_OUTPUT_DIR)
  : path.resolve(salesKitDir, 'quote-inputs');

const scenarioConfig = {
  interested: { crm_status: 'REPLIED', temperature: 'HOT', next_action_days: 1 },
  asks_price: { crm_status: 'QUOTE_IN_PROGRESS', temperature: 'HOT', next_action_days: 1 },
  asks_call: { crm_status: 'REPLIED', temperature: 'WARM', next_action_days: 1 },
  asks_details: { crm_status: 'QUOTE_IN_PROGRESS', temperature: 'WARM', next_action_days: 1 },
  not_interested: { crm_status: 'CLOSED_LOST', temperature: 'NOT_RELEVANT', next_action_days: 0 }
};

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
    .replace(/^-+|-+$/g, '') || 'item';
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

function classifyReply(body) {
  const text = String(body || '').toLowerCase();

  const notInterested = [
    'not interested', 'non interess', 'no interesa', 'pas interess', 'kein interesse',
    'no gracias', 'non mi interessa', 'keine interesse', 'no need', 'already have', 'gia lavor'
  ];
  if (notInterested.some((token) => text.includes(token))) return 'not_interested';

  const asksPrice = [
    'price', 'pricing', 'budget', 'quote', 'cost', 'prezzo', 'preventivo', 'costo',
    'presupuesto', 'precio', 'tarif', 'devis', 'angebot', 'preis'
  ];
  if (asksPrice.some((token) => text.includes(token))) return 'asks_price';

  const asksCall = [
    'call', 'zoom', 'meet', 'meeting', 'telefon', 'phone', 'chiamata', 'llamada', 'appel'
  ];
  if (asksCall.some((token) => text.includes(token))) return 'asks_call';

  const asksDetails = [
    'details', 'detail', 'more info', 'more information', 'piu info', 'piu dettagli',
    'mas info', 'mas detalles', 'plus de details', 'mehr details'
  ];
  if (asksDetails.some((token) => text.includes(token))) return 'asks_details';

  return 'interested';
}

function buildReplyDraft(language, scenario, row) {
  const business = row.business_name || '';
  const contact = row.contact_name || business;
  const website = row.website || business;
  const packageName = row.recommended_package || 'Growth';
  const packagePrice = row.recommended_package_price || row.price_range_hint || row.price_range || '';
  const timeline = row.timeline || '3-5 weeks';

  const copy = {
    it: {
      interested: {
        subject: `Re: ${business} - roadmap operativa`,
        body: [
          `Ciao ${contact},`,
          '',
          `perfetto, allora preparo io la roadmap pratica per ${website}.`,
          'Mi concentro su priorita, pagine da sistemare e leva commerciale per aumentare richieste e conversione.',
          '',
          'Entro 24 ore ti mando una proposta chiara con problemi prioritari, interventi consigliati, impatto atteso, tempi e investimento.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - investimento e proposta`,
        body: [
          `Ciao ${contact},`,
          '',
          packagePrice ? `la fascia piu sensata oggi, per come e impostato il sito, e ${packagePrice} sul pacchetto ${packageName}.` : `ti preparo oggi stesso la fascia economica corretta per il pacchetto ${packageName}.`,
          'Nel preventivo ti spiego in modo diretto cosa sistemiamo, perche ha impatto sul business e in quanto tempo si puo mettere online.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - prossimo step`,
        body: [
          `Ciao ${contact},`,
          '',
          'possiamo sentirci, ma per velocizzare ti conviene prima ricevere la proposta scritta.',
          `In questo modo hai subito numeri, priorita e struttura del lavoro su ${website}.`,
          'Poi, se ha senso, facciamo una call breve solo per chiudere.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - dettagli operativi`,
        body: [
          `Ciao ${contact},`,
          '',
          `ti mando volentieri piu dettaglio su come imposterei il lavoro per ${website}.`,
          `L'obiettivo e creare un percorso piu chiaro dalla visita alla richiesta, con tempi stimati in ${timeline}.`,
          packagePrice ? `Come riferimento iniziale, il pacchetto piu adatto oggi e ${packagePrice}.` : ''
        ].filter(Boolean)
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Ciao ${contact},`,
          '',
          'ricevuto, nessun problema.',
          'Chiudo qui il follow-up.',
          'Se piu avanti vorrai rimettere mano al sito per aumentare richieste o conversioni, ti preparo volentieri una proposta mirata.'
        ]
      }
    },
    en: {
      interested: {
        subject: `Re: ${business} - practical roadmap`,
        body: [
          `Hi ${contact},`,
          '',
          `perfect, I will prepare the practical roadmap for ${website}.`,
          'I will focus on priorities, key pages and the commercial improvements that can lift inquiries and conversion.',
          '',
          'Within 24 hours I will send a clear proposal covering priority issues, recommended fixes, expected impact, timing and investment.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - pricing and proposal`,
        body: [
          `Hi ${contact},`,
          '',
          packagePrice ? `the most realistic range right now is ${packagePrice} for the ${packageName} package.` : `I will prepare the most accurate price range for the ${packageName} package today.`,
          'In the proposal I will keep it simple: what we fix, why it matters commercially, and how fast it can go live.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - next step`,
        body: [
          `Hi ${contact},`,
          '',
          'we can do a call, but the fastest move is to send you the written proposal first.',
          `That gives you the numbers, priorities and scope for ${website} immediately.`,
          'If it makes sense after that, we can do a short call just to close details.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - more detail`,
        body: [
          `Hi ${contact},`,
          '',
          `happy to send more detail on how I would structure the work for ${website}.`,
          `The goal is to build a clearer path from visit to inquiry, with a delivery window around ${timeline}.`,
          packagePrice ? `As a starting benchmark, the strongest fit is ${packagePrice}.` : ''
        ].filter(Boolean)
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Hi ${contact},`,
          '',
          'understood, no problem.',
          'I will close the follow-up here.',
          'If later you want to improve the site to generate more qualified inquiries, I can prepare a focused proposal.'
        ]
      }
    },
    es: {
      interested: {
        subject: `Re: ${business} - hoja de ruta practica`,
        body: [
          `Hola ${contact},`,
          '',
          `perfecto, preparo la hoja de ruta practica para ${website}.`,
          'La enfocare en prioridades, paginas a corregir y mejoras comerciales para aumentar contactos y conversiones.',
          '',
          'En 24 horas te envio una propuesta clara con problemas prioritarios, mejoras recomendadas, impacto esperado, tiempos e inversion.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - inversion y propuesta`,
        body: [
          `Hola ${contact},`,
          '',
          packagePrice ? `la referencia economica mas sensata hoy es ${packagePrice} para el paquete ${packageName}.` : `hoy mismo te preparo la franja economica correcta para el paquete ${packageName}.`,
          'En la propuesta te dire de forma directa que corregimos, por que impacta en el negocio y en cuanto tiempo se puede lanzar.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - siguiente paso`,
        body: [
          `Hola ${contact},`,
          '',
          'podemos hablar, pero para ir mas rapido te conviene recibir primero la propuesta escrita.',
          `Asi tienes de inmediato numeros, prioridades y alcance para ${website}.`,
          'Si despues tiene sentido, hacemos una llamada corta solo para cerrar detalles.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - mas detalle`,
        body: [
          `Hola ${contact},`,
          '',
          `con gusto te envio mas detalle sobre como estructuraria el trabajo para ${website}.`,
          `La idea es construir un camino mas claro desde la visita hasta el contacto, con una entrega estimada en ${timeline}.`,
          packagePrice ? `Como referencia inicial, la mejor opcion hoy es ${packagePrice}.` : ''
        ].filter(Boolean)
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Hola ${contact},`,
          '',
          'recibido, sin problema.',
          'Cierro aqui el seguimiento.',
          'Si mas adelante quieres mejorar el sitio para conseguir mas contactos cualificados, te preparo una propuesta concreta.'
        ]
      }
    }
  };

  const locale = copy[language] || copy.en;
  return locale[scenario];
}

function buildEmailOpening(row, language) {
  const website = row.website || '';
  const businessLabel = row.business_name || 'this business';
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
  const business = row.what_the_business_does || '';
  const copy = {
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
  return copy[language] || copy.en;
}

function buildAuditEvidence(row) {
  return [
    row.current_domain_verified,
    row.mobile_experience_checked,
    row.contact_flow_checked,
    ...splitAuditField(row.social_channels_checked),
    ...splitAuditField(row.review_platforms_checked),
    ...splitAuditField(row.competitors_checked),
    row.search_ai_visibility_checked,
    ...splitAuditField(row.evidence_refs).map((item) => `Evidence reference checked: ${item}`)
  ].map((item) => String(item || '').trim()).filter(Boolean);
}

function buildMarketScope(row) {
  const resolved = resolveMarketSummary(row);
  if (String(resolved || '').trim().length >= 15) return resolved;
  return [row.city, row.country, row.sector].map((item) => String(item || '').trim()).filter(Boolean).join(' - ');
}

function buildQuoteInput(row) {
  const language = resolveLanguage(row);
  return {
    business_name: row.business_name || '',
    contact_name: row.contact_name || '',
    email: row.email || '',
    recipient_email: row.email || '',
    country: row.country || '',
    city: row.city || '',
    market_scope_summary: buildMarketScope(row),
    website: row.website || '',
    language,
    currency: resolveCurrency(row),
    email_opening: buildEmailOpening(row, language),
    project_summary: row.what_the_business_does || '',
    issues: splitAuditField(row.top_3_issues_found).slice(0, 4),
    solutions: splitAuditField(row.top_3_improvements_proposed).slice(0, 4),
    business_impact: splitAuditField(row.expected_business_impact_range).slice(0, 4),
    timeline: row.timeline || '',
    base_deliverables: splitAuditField(row.base_deliverables).slice(0, 4),
    growth_deliverables: splitAuditField(row.growth_deliverables).slice(0, 4),
    monthly_deliverables: splitAuditField(row.monthly_deliverables).slice(0, 4),
    recommended_solution_type: row.recommended_solution_type || '',
    solution_type_rationale: row.solution_type_rationale || '',
    payment_readiness: row.payment_readiness || '',
    audit_evidence: buildAuditEvidence(row),
    pricing_rationale: row.pricing_rationale || '',
    social_channels_checked: splitAuditField(row.social_channels_checked),
    review_platforms_checked: splitAuditField(row.review_platforms_checked),
    competitors_checked: splitAuditField(row.competitors_checked),
    search_ai_visibility_checked: row.search_ai_visibility_checked || '',
    internal_notes: row.notes || '',
    source_lead_id: row.lead_id || '',
    recommended_package: row.recommended_package || 'Growth',
    recommended_package_price: row.recommended_package_price || ''
  };
}

async function run() {
  const inputFile = getArgValue('--input') || defaultRepliesFile;
  const csvFile = getArgValue('--csv-file') || defaultCsvFile;
  const dryRun = process.argv.includes('--dry-run');

  const replies = await readJson(inputFile, []);
  if (!Array.isArray(replies)) throw new Error('Reply inbox must be a JSON array.');

  const rows = await readLeadPipeline(csvFile);
  const processed = [];

  await fs.mkdir(replyDraftsDir, { recursive: true });
  await fs.mkdir(quoteInputsDir, { recursive: true });

  for (const reply of replies) {
    const leadId = String(reply.lead_id || '').trim();
    if (!leadId) {
      processed.push({ ok: false, error: 'missing_lead_id', reply });
      continue;
    }

    const row = rows.find((item) => item.lead_id === leadId);
    if (!row) {
      processed.push({ ok: false, error: 'lead_not_found', lead_id: leadId });
      continue;
    }

    const scenario = reply.scenario || classifyReply(reply.body || reply.snippet || reply.subject || '');
    const meta = scenarioConfig[scenario];
    if (!meta) {
      processed.push({ ok: false, error: 'unsupported_scenario', lead_id: leadId, scenario });
      continue;
    }

    const language = resolveLanguage(row);
    const currency = resolveCurrency(row);
    const draft = buildReplyDraft(language, scenario, row);
    const receivedAt = String(reply.received_at || new Date().toISOString());

    const draftPayload = {
      lead_id: leadId,
      business_name: row.business_name || '',
      scenario,
      lead_temperature: meta.temperature,
      recommended_crm_status: meta.crm_status,
      language,
      currency,
      subject: draft.subject,
      body: draft.body.join('\n')
    };

    const draftFile = path.join(replyDraftsDir, `${slugify(row.business_name)}-${slugify(leadId)}-${slugify(scenario)}.json`);
    await writeJson(draftFile, draftPayload);

    let quoteInputFile = null;
    if (meta.crm_status === 'QUOTE_IN_PROGRESS') {
      const quoteValidation = validateLeadForQuote({ ...row, status: meta.crm_status });
      if (!quoteValidation.ok) {
        processed.push({
          ok: false,
          error: 'quote_input_gate_failed',
          lead_id: leadId,
          scenario,
          problems: quoteValidation.problems
        });
        continue;
      }

      const quoteInput = buildQuoteInput(row);
      quoteInputFile = path.join(quoteInputsDir, `${slugify(row.business_name)}-${slugify(row.country)}-${slugify(leadId)}.json`);
      await writeJson(quoteInputFile, quoteInput);
    }

    if (!dryRun) {
      row.status = meta.crm_status;
      row.last_action = `Reply received and classified as ${scenario} (${reply.from || row.email || 'unknown sender'})`;
      row.last_error = '';
      row.next_action_date = meta.next_action_days > 0 ? nextActionDateFrom(receivedAt, meta.next_action_days) : '';
    }

    processed.push({
      ok: true,
      lead_id: leadId,
      scenario,
      lead_temperature: meta.temperature,
      crm_status: meta.crm_status,
      draft_file: draftFile,
      quote_input_file: quoteInputFile
    });
  }

  if (!dryRun) {
    await writeLeadPipeline(csvFile, rows);
  }

  console.log(JSON.stringify({
    ok: true,
    dry_run: dryRun,
    input: inputFile,
    csv_file: csvFile,
    processed
  }, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
