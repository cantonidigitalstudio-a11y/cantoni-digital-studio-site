import fs from 'node:fs/promises';
import path from 'node:path';

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--') && arg.includes('='))
    .map((arg) => {
      const [key, ...valueParts] = arg.slice(2).split('=');
      return [key, valueParts.join('=')];
    })
);

const allowEmpty = process.argv.includes('--allow-empty');
const queueFile = path.resolve(
  args.get('queue') ||
    process.env.FOLLOWUP_QUEUE_FILE ||
    'sales-kit/queue/followup_d3_queue.json'
);

const officialReplyTo = 'cantonidigitalstudio@gmail.com';
const amountPatterns = [
  /\b(?:EUR|USD|GBP|MXN|DOP|AED|SAR|JPY|INR|CNY|CAD|AUD|BRL|SGD|THB)\s*[\d.,]+/i,
  /(?:€|\$|£|¥)\s*[\d.,]+/
];
const forbiddenPublicProofPatterns = [
  /https:\/\/www\.tiktok\.com\/@cantonidigitalstudio/i,
  /https:\/\/www\.facebook\.com\/cantonidigitalstudio/i
];
const languageSignals = {
  en: /\b(?:Good morning|following up|short roadmap|simply reply)\b/i,
  es: /\b(?:Hola|te escribí|hoja de ruta|solo responde)\b/i,
  fr: /\b(?:Bonjour|feuille de route|répondez simplement)\b/i,
  it: /\b(?:Buongiorno|Cordiali saluti|rispondere|rispondete|priorità)\b/i,
  pt: /\b(?:Olá|escrevi|rota de ação|basta responder)\b/i,
  de: /\b(?:Hallo|Mini-Roadmap|antworten|Priorität)\b/i,
  ja: /(?:様|返信|ロードマップ)/
};
const weakLocalizationPatterns = {
  es: /\b(?:te escribi|dias despues|seguiria|razon|practico|envio|intencion|movil|utiles|peticion|\bMas\b)\b/i,
  fr: /\b(?:ecrit|apres|priorite|delais|etape concrete|repondez)\b/i,
  it: /\b(?:priorita| e questo| puo | vi e utile|L Essenziale)\b/i,
  pt: /\b(?:Ola| ha alguns| acao| e esta| e concreto| util| proximo| pratico|recebe-la|desde mobile)\b/i,
  de: /\b(?:Prioritat|ware|fur|konnen|Moglichkeit)\b/i
};
const weakCaseSensitivePatterns = {
  es: /\ben Más\b/,
  it: /\bin Più\b/,
  pt: /\bem Mais\b/
};

function fail(message) {
  throw new Error(message);
}

function hasSimpleReplyAsk(copy) {
  return /\b(?:reply|respond|responde|repondez|antworten|rispondere|OK)\b/i.test(copy) ||
    /返信|回复/.test(copy);
}

async function run() {
  const raw = await fs.readFile(queueFile, 'utf8').catch(() => '[]');
  const queue = JSON.parse(raw);
  if (!Array.isArray(queue)) fail(`Queue is not an array: ${queueFile}`);
  if (!allowEmpty && queue.length === 0) fail(`Follow-up queue is empty: ${queueFile}`);

  const failures = [];
  queue.forEach((item, index) => {
    const prefix = item.lead_id || item.id || `index_${index}`;
    const publicCopy = `${item.subject || ''}\n${item.body || ''}\n${item.html_body || ''}`;

    if (item.email_kind !== 'followup_d3') failures.push(`${prefix}: email_kind mismatch`);
    if (item.campaign_type !== 'followup_d3') failures.push(`${prefix}: campaign_type mismatch`);
    if (item.crm_status_on_send !== 'FOLLOWUP_D3') failures.push(`${prefix}: crm status mismatch`);
    if ((item.reply_to || '') !== officialReplyTo) failures.push(`${prefix}: reply_to mismatch`);
    if (!item.to) failures.push(`${prefix}: missing recipient`);
    if (!item.subject) failures.push(`${prefix}: missing subject`);
    if (!item.body) failures.push(`${prefix}: missing body`);
    if (!item.language) failures.push(`${prefix}: missing language`);
    if (!item.currency) failures.push(`${prefix}: missing currency`);
    if (!item.business_name) failures.push(`${prefix}: missing business_name`);
    if (!item.website) failures.push(`${prefix}: missing website`);
    if (!item.first_improvement) failures.push(`${prefix}: missing first_improvement`);
    if (!item.expected_impact) failures.push(`${prefix}: missing expected_impact`);
    if (!hasSimpleReplyAsk(publicCopy)) failures.push(`${prefix}: missing simple reply ask`);
    if (languageSignals[item.language] && !languageSignals[item.language].test(publicCopy)) {
      failures.push(`${prefix}: language copy mismatch for ${item.language}`);
    }
    if (weakLocalizationPatterns[item.language] && weakLocalizationPatterns[item.language].test(publicCopy)) {
      failures.push(`${prefix}: weak localization for ${item.language}`);
    }
    if (weakCaseSensitivePatterns[item.language] && weakCaseSensitivePatterns[item.language].test(publicCopy)) {
      failures.push(`${prefix}: weak sentence fragment casing for ${item.language}`);
    }

    amountPatterns.forEach((pattern, patternIndex) => {
      if (pattern.test(publicCopy)) failures.push(`${prefix}: public amount pattern ${patternIndex + 1}`);
    });
    forbiddenPublicProofPatterns.forEach((pattern, patternIndex) => {
      if (pattern.test(publicCopy)) failures.push(`${prefix}: forbidden proof link ${patternIndex + 1}`);
    });
  });

  console.log(
    JSON.stringify(
      {
        ok: failures.length === 0,
        queue_file: queueFile,
        checked: queue.length,
        failures
      },
      null,
      2
    )
  );

  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
