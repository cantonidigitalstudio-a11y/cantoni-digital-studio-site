import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  nextActionDateFrom,
  readLeadPipeline,
  writeLeadPipeline
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const queueDir = path.join(rootDir, 'queue');
const queueFile = process.env.OUTREACH_QUEUE_FILE || path.join(queueDir, 'outreach_queue.json');
const pauseFlagFile = path.join(rootDir, 'outbound_pause.flag');
const stateFile = process.env.OUTREACH_STATE_FILE
  ? path.resolve(process.env.OUTREACH_STATE_FILE)
  : path.join(queueDir, 'background_worker_state.json');
const csvFile = process.env.LEAD_PIPELINE_CSV
  ? path.resolve(process.env.LEAD_PIPELINE_CSV)
  : path.join(rootDir, 'lead_pipeline.csv');
const lockFile = process.env.OUTREACH_LOCK_FILE
  ? path.resolve(process.env.OUTREACH_LOCK_FILE)
  : path.join(queueDir, '.background-worker.lock');
const emailLogoPath = path.resolve(rootDir, '../assets/logo/cantoni_icona_quadrata.png');
const CANTONI_SITE_URL = 'https://cantonidigitalstudio.com';
const CANTONI_STUDIO_URL = `${CANTONI_SITE_URL}/studio.html`;
const CANTONI_CASE_STUDIES_URL = `${CANTONI_SITE_URL}/case-studies.html`;
const CANTONI_INSTAGRAM_URL = 'https://www.instagram.com/cantonidigitalstudio/';
const CANTONI_YOUTUBE_URL = 'https://www.youtube.com/@cantonidigitalstudio';
const CANTONI_TERMS_URL = `${CANTONI_SITE_URL}/termini-commerciali.html`;

const ENDPOINT =
  process.env.OUTREACH_APPS_SCRIPT_ENDPOINT ||
  'https://script.google.com/macros/s/AKfycbwuFXalSZeJUDgqWZlHVqY0CFXipuElIX7lrc-X9FgK1VozP60PuXqiF8IgzF9rbGYWwg/exec';
const SHARED_SECRET = process.env.OUTREACH_APPS_SCRIPT_SECRET || '';
const SEND_ENABLED = process.env.OUTREACH_SEND_ENABLED === 'true';
const MAX_PER_RUN = Number(process.env.OUTREACH_MAX_PER_RUN || 20);
const REQUIRED_REPLY_TO = 'cantonidigitalstudio@gmail.com';
const COLD_INTRO_FORBIDDEN_PATTERNS = [
  /https:\/\/www\.facebook\.com\/cantonidigitalstudio/i,
  /\b(?:Pacchetto consigliato|Recommended package|Paquete recomendado|Pack recommande|Empfohlenes Paket|Pacote recomendado)\b/i,
  /\b(?:Investimento consigliato|Recommended investment)\b/i,
  /\b(?:EUR|USD|GBP|MXN|DOP|AED|SAR|JPY|INR|CNY)\s*[\d.,]+/i,
  /(?:€|\$|£)\s*[\d.,]+/
];

function nowIso() {
  return new Date().toISOString();
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function assertOutboundNotPaused() {
  if (!SEND_ENABLED || process.env.OUTBOUND_FORCE_RUN === '1') return;
  try {
    const message = await fs.readFile(pauseFlagFile, 'utf8');
    const error = new Error(`OUTBOUND_PAUSED\n${message.trim()}`);
    error.code = 'OUTBOUND_PAUSED';
    error.exitCode = 3;
    throw error;
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    throw error;
  }
}

async function acquireLock() {
  const writePid = async () => {
    const fd = await fs.open(lockFile, 'wx');
    await fd.writeFile(String(process.pid), 'utf8');
    await fd.close();
  };

  try {
    await writePid();
    return;
  } catch {}

  try {
    const pid = Number((await fs.readFile(lockFile, 'utf8')).trim());
    if (Number.isFinite(pid) && pid > 0) {
      process.kill(pid, 0);
      throw new Error(`Worker lock exists: ${lockFile}`);
    }
  } catch (err) {
    if (!/Worker lock exists/.test(String(err.message || err))) {
      await fs.unlink(lockFile).catch(() => {});
      await writePid();
      return;
    }
    throw err;
  }
}

async function releaseLock() {
  await fs.unlink(lockFile).catch(() => {});
}

async function assertHealth() {
  const url = new URL(ENDPOINT);
  url.searchParams.set('action', 'health');
  const response = await fetch(url, { method: 'GET' });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(`Apps Script health failed: ${JSON.stringify(payload)}`);
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function buildEmailLogoDataUri() {
  try {
    const logo = await fs.readFile(emailLogoPath);
    return `data:image/png;base64,${logo.toString('base64')}`;
  } catch {
    return '';
  }
}

async function buildInlineImagesPayload() {
  try {
    const logo = await fs.readFile(emailLogoPath);
    return {
      cantoniLogo: {
        base64: logo.toString('base64'),
        contentType: 'image/png'
      }
    };
  } catch {
    return {};
  }
}

function assertBrandingGuardrails(item, htmlBody, inlineImages) {
  const issues = [];
  const replyTo = String(item.reply_to || REQUIRED_REPLY_TO)
    .trim()
    .toLowerCase();

  if (!htmlBody || !/<html[\s>]/i.test(htmlBody)) {
    issues.push('html_body_missing');
  }
  if (!/cid:cantoniLogo/i.test(htmlBody || '')) {
    issues.push('logo_cid_missing');
  }
  if (!inlineImages?.cantoniLogo?.base64) {
    issues.push('inline_logo_missing');
  }
  if (replyTo !== REQUIRED_REPLY_TO) {
    issues.push(`reply_to_mismatch:${replyTo || 'empty'}`);
  }
  if (item.email_kind === 'cold_intro') {
    const combined = `${item.subject || ''}\n${item.body || ''}\n${htmlBody || ''}`;
    COLD_INTRO_FORBIDDEN_PATTERNS.forEach((pattern) => {
      if (pattern.test(combined)) issues.push(`cold_intro_forbidden:${pattern}`);
    });
  }

  if (issues.length) {
    throw new Error(`Brand QA failed for ${item.to || item.id || 'unknown'}: ${issues.join(', ')}`);
  }
}

function normalizeProvidedHtml(html, logoCid = 'cantoniLogo') {
  if (!html) return '';
  return String(html)
    .replaceAll(emailLogoPath, `cid:${logoCid}`)
    .replaceAll(path.basename(emailLogoPath), `cid:${logoCid}`)
    .replaceAll('src="cid:cantoniLogo"', `src="cid:${logoCid}"`)
    .replaceAll("src='cid:cantoniLogo'", `src='cid:${logoCid}'`);
}

function renderBodyParagraphs(text) {
  return String(text || '')
    .split('\n')
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 14px 0;color:#1f2937;font:16px/1.7 Arial,sans-serif;">${escapeHtml(line)}</p>`
    )
    .join('');
}

function buildPublicReferencesHtml() {
  return `
    <div style="padding:22px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:10px;">Riferimenti verificabili</div>
      <p style="margin:0 0 14px 0;font:15px/1.7 Arial,sans-serif;color:#334155;">Prima di confermare qualsiasi lavoro potete verificare identita pubblica, casi studio, presenza social attiva e condizioni commerciali dello studio.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${escapeHtml(CANTONI_STUDIO_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Profilo studio</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${escapeHtml(CANTONI_CASE_STUDIES_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Case studies</a></td>
        </tr>
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${escapeHtml(CANTONI_INSTAGRAM_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Instagram</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${escapeHtml(CANTONI_YOUTUBE_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">YouTube</a></td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:2px;"><a href="${escapeHtml(CANTONI_TERMS_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #dbe4ee;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">Condizioni commerciali</a></td>
        </tr>
      </table>
      <p style="margin:14px 0 0 0;font:14px/1.7 Arial,sans-serif;color:#526074;">Sede operativa in Italia. Focus su redesign, funnel, consulenza e costruzione di un ecosistema premium in crescita.</p>
    </div>`;
}

async function buildHtmlBody(item, logoCid = 'cantoniLogo') {
  if (item.html_body) {
    return normalizeProvidedHtml(item.html_body, logoCid);
  }

  const isColdIntro = item.email_kind === 'cold_intro';
  const paragraphs = renderBodyParagraphs(item.body || '');
  const offerTitle = escapeHtml(item.offer_title || (isColdIntro ? 'Analisi preliminare riservata' : 'Proposta commerciale riservata'));
  const introTitle = escapeHtml(item.intro_title || item.subject || (isColdIntro ? 'Osservazioni preliminari Cantoni Digital Studio' : 'Proposta Cantoni Digital Studio'));
  const introText = escapeHtml(
    item.intro_text ||
      (
        isColdIntro
          ? 'Questa e una prima nota commerciale basata su segnali pubblici osservabili. Prezzi, scope e condizioni vengono inviati solo dopo confronto o richiesta esplicita.'
          : 'Questa proposta e stata preparata dopo un’analisi commerciale del business, con focus su conversione, chiarezza dell’offerta e crescita delle richieste.'
      )
  );
  const investmentLabel = escapeHtml(item.investment_label || (isColdIntro ? 'Prossimo passo' : 'Investimento consigliato'));
  const investmentValue = escapeHtml(item.investment_value || (isColdIntro ? 'Breakdown breve' : item.recommended_package_price || 'Su misura'));
  const investmentNote = escapeHtml(item.investment_note || (isColdIntro ? 'solo se utile' : item.recommended_package || 'Proposta personalizzata'));
  const issuedLabel = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(item.subject || 'Cantoni Digital Studio')}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#1d2433;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(item.preview_text || item.subject || '')}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:860px;background:#f8fafc;border:1px solid #dbe4ee;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:30px 34px 24px 34px;background:#111c33;border-bottom:1px solid #1f2b45;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" width="110" style="padding-right:18px;">
                    <div style="width:92px;height:92px;border-radius:18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);padding:10px;">
                      <img src="cid:${logoCid}" alt="Cantoni Digital Studio" style="display:block;width:72px;height:72px;border-radius:14px;">
                    </div>
                  </td>
                  <td valign="top" style="padding-left:18px;border-left:2px solid #f5c551;">
                    <div style="font-size:16px;font-weight:800;letter-spacing:.02em;color:#f5c551;">CANTONI DIGITAL STUDIO</div>
                    <div style="font-size:10.5px;font-weight:700;letter-spacing:.04em;color:#d8e1ec;padding-top:8px;">Documento proposta riservato · ${escapeHtml(issuedLabel)}</div>
                    <div style="font-size:34px;line-height:1.12;font-weight:800;color:#ffffff;padding-top:12px;">${introTitle}</div>
                    <div style="font-size:16px;line-height:1.65;color:#d8e1ec;max-width:620px;padding-top:10px;">${introText}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 34px 10px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 14px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right:10px;">
                    <div style="padding:18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;min-height:128px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:800;padding-bottom:10px;">Studio</div>
                      <div style="font-size:20px;font-weight:800;line-height:1.2;color:#0f172a;">Cantoni Digital Studio</div>
                      <div style="font-size:14px;line-height:1.65;color:#526074;padding-top:6px;">Sede operativa: Italia</div>
                      <div style="font-size:14px;line-height:1.65;color:#526074;padding-top:6px;">${escapeHtml(CANTONI_SITE_URL)}</div>
                    </div>
                  </td>
                  <td width="50%" valign="top" style="padding-left:10px;">
                    <div style="padding:18px;background:#111c33;border:1px solid #111c33;border-radius:18px;min-height:128px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#f7c87e;font-weight:800;padding-bottom:10px;">${investmentLabel}</div>
                      <div style="font-size:30px;font-weight:800;color:#ffffff;">${investmentValue}</div>
                      <div style="font-size:14px;color:#dbe4f0;padding-top:6px;">${investmentNote}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 28px 34px;">
              <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;">
                ${paragraphs}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              ${buildPublicReferencesHtml()}
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 34px 34px;">
              <div style="padding:22px 24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" width="58%" style="padding-right:10px;">
                      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:10px;">Cantoni Digital Studio</div>
                      <div style="font-size:15px;line-height:1.75;color:#334155;">Website redesign, funnel, consulenza commerciale e costruzione di un ecosistema premium per aziende che vogliono piu richieste, piu vendite e piu leva strategica.<br>Rispondi direttamente a questa mail per ricevere breakdown operativo e proposta finale.</div>
                    </td>
                    <td valign="top" width="42%" style="padding-left:10px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700;padding-bottom:8px;">Identità studio</div>
                      <div style="font-size:14px;line-height:1.7;color:#526074;">Sede operativa: Italia<br><a href="${escapeHtml(CANTONI_SITE_URL)}" style="color:#1c345d;text-decoration:none;font-weight:700;">${escapeHtml(CANTONI_SITE_URL)}</a><br><a href="mailto:${escapeHtml(REQUIRED_REPLY_TO)}" style="color:#1c345d;text-decoration:none;font-weight:700;">${escapeHtml(REQUIRED_REPLY_TO)}</a></div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendItem(item) {
  const htmlBody = await buildHtmlBody(item);
  const inlineImages = await buildInlineImagesPayload();
  assertBrandingGuardrails(item, htmlBody, inlineImages);

  if (!SEND_ENABLED) {
    return { ok: true, dry_run: true };
  }

  if (!SHARED_SECRET) {
    throw new Error('OUTREACH_APPS_SCRIPT_SECRET missing.');
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'send_outreach',
      secret: SHARED_SECRET,
      id: item.id || '',
      lead_id: item.lead_id || item.id || '',
      to: item.to,
      subject: item.subject,
      body: item.body,
      html_body: htmlBody,
      inline_images: inlineImages,
      sender_name: item.sender_name || 'Cantoni Digital Studio',
      reply_to: item.reply_to || REQUIRED_REPLY_TO
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

function statusAfterSend(item) {
  return item.crm_status_on_send || 'CONTACTED';
}

function lastActionLabel(item) {
  if (item.campaign_type === 'followup_d3') {
    return `Day-3 follow-up sent via Apps Script background worker (${item.to})`;
  }
  if (item.campaign_type === 'followup_d7') {
    return `Day-7 follow-up sent via Apps Script background worker (${item.to})`;
  }
  if (item.campaign_type === 'quote_followup') {
    return `Quote follow-up sent via Apps Script background worker (${item.to})`;
  }
  return `Initial outreach sent via Apps Script background worker (${item.to})`;
}

function nextActionDate(item) {
  if (!item.processed_at) return '';
  const days = Number(item.next_action_days || 3);
  return nextActionDateFrom(item.processed_at, days);
}

async function run() {
  await assertOutboundNotPaused();
  await acquireLock();
  try {
    await assertHealth();

    const queue = await readJson(queueFile, []);
    const rows = await readLeadPipeline(csvFile);
    const state = await readJson(stateFile, {
      last_run_at: null,
      sent_total: 0,
      dry_run_total: 0,
      errors_total: 0
    });

    const pending = queue.filter((item) => (item.status || 'pending') === 'pending').slice(0, MAX_PER_RUN);
    const runLog = [];

    for (const item of pending) {
      try {
        await sendItem(item);
        const processedAt = nowIso();
        if (SEND_ENABLED) {
          item.status = 'sent';
          item.processed_at = processedAt;
        } else {
          item.status = 'pending';
          item.last_dry_run_at = processedAt;
        }
        runLog.push({ id: item.id || null, to: item.to, status: SEND_ENABLED ? 'sent' : 'dry_run', at: processedAt });

        const row = rows.find((entry) => entry.lead_id === (item.lead_id || item.id));
        if (row) {
          row.last_error = '';
          if (SEND_ENABLED) {
            row.status = statusAfterSend(item);
            row.last_action = lastActionLabel(item);
            row.next_action_date = nextActionDate(item);
          } else {
            row.last_action = `Background worker dry run validated (${item.to})`;
          }
        }

        if (SEND_ENABLED) state.sent_total += 1;
        else state.dry_run_total += 1;
      } catch (err) {
        item.status = 'error';
        item.error = String(err.message || err);
        item.processed_at = nowIso();
        runLog.push({ id: item.id || null, to: item.to, status: 'error', at: item.processed_at });
        const row = rows.find((entry) => entry.lead_id === (item.lead_id || item.id));
        if (row) {
          row.last_action = `Apps Script background worker error (${item.to})`;
          row.last_error = item.error;
        }
        state.errors_total += 1;
      }
    }

    state.last_run_at = nowIso();
    await writeJson(queueFile, queue);
    await writeLeadPipeline(csvFile, rows);
    await writeJson(stateFile, state);

    console.log(
      JSON.stringify(
        {
          ok: true,
          endpoint: ENDPOINT,
          send_enabled: SEND_ENABLED,
          processed: runLog.length,
          run_log: runLog
        },
        null,
        2
      )
    );
  } finally {
    await releaseLock();
  }
}

run().catch(async (err) => {
  console.error(`ERROR_CODE=${err.code || 'BACKGROUND_WORKER_ERROR'}`);
  console.error(String(err.message || err));
  await releaseLock();
  process.exit(Number(err.exitCode) || 1);
});
