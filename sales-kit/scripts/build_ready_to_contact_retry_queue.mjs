import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readLeadPipeline } from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const csvFile = path.join(rootDir, 'lead_pipeline.csv');
const queueDir = path.join(rootDir, 'queue');

const LIMIT = Number(process.env.LIMIT || 50);

function money(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

function safe(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildBody(row) {
  const packageLabel = `${row.recommended_package} - ${row.recommended_package_price}`;
  return [
    'Buongiorno,',
    '',
    `ho analizzato con attenzione il sito di ${row.business_name}.`,
    '',
    row.email_angle,
    '',
    'In questa email trovate già la proposta completa per decidere, con:',
    '- criticità osservate sul sito reale',
    '- intervento proposto',
    '- impatto commerciale atteso',
    '- pacchetti',
    '- condizioni operative',
    '',
    `Pacchetto consigliato: ${packageLabel}`,
    'Pagamenti: 50% avvio / 50% consegna finale',
    '',
    '# Cantoni Digital Studio',
    '## Preventivo personalizzato',
    '',
    `- Data: ${new Date().toISOString().slice(0, 10)}`,
    `- Cliente: ${row.business_name}`,
    `- Sito analizzato: ${row.website}`,
    `- Mercato: ${row.city}, ${row.country}`,
    `- Lingua: ${String(row.preferred_language || 'it').toUpperCase()}`,
    `- Valuta: ${row.currency || 'EUR'}`,
    '',
    '## Sintesi progetto',
    row.what_the_business_does,
    '',
    '## Criticità osservate',
    ...String(row.top_3_issues_found || '')
      .split('|')
      .filter(Boolean)
      .map((item, index) => `${index + 1}. ${item.trim()}`),
    '',
    '## Intervento proposto',
    ...String(row.top_3_improvements_proposed || '')
      .split('|')
      .filter(Boolean)
      .map((item) => `- ${item.trim()}`),
    '',
    '## Impatto economico atteso',
    ...String(row.expected_business_impact_range || '')
      .split('|')
      .filter(Boolean)
      .map((item) => `- ${item.trim()}`),
    '',
    '## Pacchetti',
    `Base — ${money(Number(row.base_price || 0))}`,
    ...String(row.base_deliverables || '')
      .split('|')
      .filter(Boolean)
      .map((item) => `- ${item.trim()}`),
    '',
    `Growth — ${money(Number(row.growth_price || 0))}`,
    ...String(row.growth_deliverables || '')
      .split('|')
      .filter(Boolean)
      .map((item) => `- ${item.trim()}`),
    '',
    `Gestione continuativa — ${money(Number(row.monthly_price || 0))}/mese`,
    ...String(row.monthly_deliverables || '')
      .split('|')
      .filter(Boolean)
      .map((item) => `- ${item.trim()}`),
    '',
    '## Tempistiche',
    `- ${row.timeline}`,
    '',
    '## Condizioni commerciali',
    '- 50% avvio / 50% consegna finale',
    '',
    'Resto in attesa di un vostro riscontro. Se desiderate procedere, vi basta rispondere indicando il pacchetto scelto e vi invio subito conferma operativa e dati per l’avvio.',
    '',
    'Cordiali saluti,',
    'Cantoni Digital Studio',
    'cantonidigitalstudio@gmail.com'
  ].join('\n');
}

function buildHtml(row, body) {
  const paragraphs = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px 0;font:16px/1.7 Arial,sans-serif;color:#1f2937;">${safe(line)}</p>`)
    .join('');

  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${safe(row.business_name)} - proposta commerciale</title></head><body style="margin:0;padding:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#1d2433;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1eb;padding:28px 14px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:860px;background:#fffdfa;border:1px solid #e8e0d5;border-radius:24px;overflow:hidden;"><tr><td style="padding:30px 34px 18px 34px;background:linear-gradient(135deg,#f7efe4 0%,#fffdfa 55%,#fff4e7 100%);border-bottom:1px solid #ece1d3;"><div style="margin-bottom:18px;max-width:360px;"><img src="cid:cantoniLogo" alt="Cantoni Digital Studio" style="display:block;max-width:260px;height:auto;"></div><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b4742f;font-weight:700;padding-bottom:10px;">Proposta commerciale riservata</div><div style="font-size:34px;line-height:1.15;font-weight:800;color:#1c345d;padding-bottom:12px;">${safe(row.business_name)} - proposta commerciale</div><div style="font-size:17px;line-height:1.65;color:#334155;max-width:720px;">Questa proposta è costruita sul sito live <strong>${safe(String(row.website || '').replace(/^https?:\/\//, '').replace(/\/$/, ''))}</strong>, con focus su chiarezza del posizionamento, percorso di conversione e qualità del contatto.</div></td></tr><tr><td style="padding:30px 34px 10px 34px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 14px;"><tr><td width="50%" valign="top" style="padding:18px 18px;background:#f8f5ef;border:1px solid #ece3d8;border-radius:18px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#7a8699;font-weight:700;padding-bottom:8px;">Cliente</div><div style="font-size:18px;font-weight:700;color:#16233d;">${safe(row.business_name)}</div><div style="font-size:14px;color:#526074;padding-top:6px;">${safe(row.city)} - ${safe(row.sector)}</div></td><td width="50%" valign="top" style="padding:18px 18px;background:#1c345d;border:1px solid #1c345d;border-radius:18px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#f8d2a6;font-weight:700;padding-bottom:8px;">Investimento consigliato</div><div style="font-size:30px;font-weight:800;color:#ffffff;">${safe(row.recommended_package_price)}</div><div style="font-size:14px;color:#d9e1ec;padding-top:6px;">${safe(row.recommended_package)}</div></td></tr></table></td></tr><tr><td style="padding:0 34px 28px 34px;"><div style="padding:24px;background:#fff;border:1px solid #ebe2d6;border-radius:20px;">${paragraphs}</div></td></tr></table></td></tr></table></body></html>`;
}

const rows = await readLeadPipeline(csvFile);
const selected = rows
  .filter((row) => row.status === 'READY_TO_CONTACT')
  .slice(0, LIMIT);

if (!selected.length) {
  throw new Error('No READY_TO_CONTACT rows found.');
}

const queue = selected.map((row) => {
  const body = buildBody(row);
  return {
    id: `RETRY-${row.lead_id}`,
    lead_id: row.lead_id,
    to: row.email,
    subject: `${row.business_name}: proposta commerciale e preventivo personalizzato`,
    body,
    html_body: buildHtml(row, body),
    crm_status_on_send: 'CONTACTED',
    next_action_days: 3,
    sender_name: 'Cantoni Digital Studio',
    reply_to: 'cantonidigitalstudio@gmail.com'
  };
});

await fs.mkdir(queueDir, { recursive: true });
const queueFile = path.join(queueDir, `ready_to_contact_retry_${Date.now()}.json`);
await fs.writeFile(queueFile, JSON.stringify(queue, null, 2));

console.log(
  JSON.stringify(
    {
      queueFile,
      count: queue.length,
      leadIds: queue.map((item) => item.lead_id)
    },
    null,
    2
  )
);
