import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const queueFile = process.env.OUTREACH_QUEUE_FILE
  ? path.resolve(process.env.OUTREACH_QUEUE_FILE)
  : path.resolve(__dirname, '../queue/outreach_queue.json');

const forbiddenBodyPatterns = [
  { label: 'cantoni_tiktok_link', pattern: /https:\/\/www\.tiktok\.com\/@cantonidigitalstudio/i },
  { label: 'cantoni_facebook_link', pattern: /https:\/\/www\.facebook\.com\/cantonidigitalstudio/i },
  { label: 'recommended_package_line', pattern: /\b(?:Pacchetto consigliato|Recommended package|Paquete recomendado|Pack recommande|Empfohlenes Paket|Pacote recomendado)\b/i },
  { label: 'recommended_investment_line', pattern: /\b(?:Investimento consigliato|Recommended investment)\b/i },
  { label: 'currency_amount', pattern: /\b(?:EUR|USD|GBP|MXN|DOP|AED|SAR|JPY|INR|CNY)\s*[\d.,]+/i },
  { label: 'symbol_amount', pattern: /(?:€|\$|£)\s*[\d.,]+/ }
];

function fail(message) {
  throw new Error(message);
}

async function run() {
  const raw = await fs.readFile(queueFile, 'utf8').catch(() => '[]');
  const queue = JSON.parse(raw);
  if (!Array.isArray(queue)) fail(`Queue is not an array: ${queueFile}`);

  const failures = [];
  queue.forEach((item, index) => {
    const prefix = item.lead_id || item.id || `index_${index}`;
    const kind = item.email_kind || '';
    if (kind !== 'cold_intro') return;

    if ('recommended_package' in item) failures.push(`${prefix}: public recommended_package present`);
    if ('recommended_package_price' in item) failures.push(`${prefix}: public recommended_package_price present`);
    if ((item.reply_to || '') !== 'cantonidigitalstudio@gmail.com') failures.push(`${prefix}: reply_to mismatch`);

    const publicCopy = `${item.subject || ''}\n${item.body || ''}\n${item.html_body || ''}`;
    for (const rule of forbiddenBodyPatterns) {
      if (rule.pattern.test(publicCopy)) failures.push(`${prefix}: forbidden ${rule.label}`);
    }
  });

  console.log(JSON.stringify({ ok: failures.length === 0, queue_file: queueFile, checked: queue.length, failures }, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
