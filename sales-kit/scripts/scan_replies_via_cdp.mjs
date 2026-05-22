import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { readLeadPipeline } from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const csvFile = path.join(rootDir, 'lead_pipeline.csv');
const queueDir = path.join(rootDir, 'queue');

const RECENCY_DAYS = Number(process.env.RECENCY_DAYS || 30);
const STATUS_SET = new Set(['CONTACTED', 'QUOTE_SENT', 'FOLLOWUP_D3']);
const CDP_ENDPOINT = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9223';
const GMAIL_URL = 'https://mail.google.com/mail/u/1/#inbox';

async function getGmailPage(browser) {
  const contexts = browser.contexts();
  if (!contexts.length) {
    throw new Error('No browser context available on CDP session.');
  }
  const context = contexts[0];
  const page = await context.newPage();
  await page.goto(GMAIL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return page;
}

async function waitForSearchSettle(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const body = await page.evaluate(() => document.body.innerText || '');
    if (!/Indicatore di caricamento/i.test(body)) return body;
    await page.waitForTimeout(600);
  }
  return page.evaluate(() => document.body.innerText || '');
}

function compact(value, limit = 700) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

const rows = await readLeadPipeline(csvFile);
const active = rows.filter((row) => STATUS_SET.has(row.status) && row.email);
const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
const page = await getGmailPage(browser);
const hits = [];
const skipped = [];

for (const lead of active) {
  const query = `in:anywhere newer_than:${RECENCY_DAYS}d from:(${lead.email})`;
  try {
    await page.goto(`https://mail.google.com/mail/u/1/#search/${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(900);
    const body = await waitForSearchSettle(page);

    if (/Nessun messaggio corrispondente ai criteri di ricerca/i.test(body)) continue;

    hits.push({
      lead_id: lead.lead_id,
      business_name: lead.business_name,
      email: lead.email,
      status: lead.status,
      snippet: compact(body)
    });
  } catch (error) {
    skipped.push({
      lead_id: lead.lead_id,
      email: lead.email,
      error: String(error?.message || error).slice(0, 240)
    });
  }
}

await page.close().catch(() => {});
await browser.close();
await fs.mkdir(queueDir, { recursive: true });
const outFile = path.join(queueDir, `reply_scan_hits_${new Date().toISOString().slice(0, 10)}.json`);
await fs.writeFile(outFile, JSON.stringify(hits, null, 2));

console.log(
  JSON.stringify(
    {
      checked: active.length,
      hits: hits.length,
      skipped: skipped.length,
      outFile
    },
    null,
    2
  )
);
