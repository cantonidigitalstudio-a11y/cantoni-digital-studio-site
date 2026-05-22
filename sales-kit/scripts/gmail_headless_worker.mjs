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
const queueFile = path.join(queueDir, 'outreach_queue.json');
const repliesFile = path.join(queueDir, 'replies_snapshot.json');
const stateFile = path.join(queueDir, 'worker_state.json');
const csvFile = path.join(rootDir, 'lead_pipeline.csv');

const MAX_PER_RUN = Number(process.env.GMAIL_MAX_PER_RUN || 20);
const MIN_DELAY_MS = Number(process.env.GMAIL_MIN_DELAY_MS || 120000);
const MAX_DELAY_MS = Number(process.env.GMAIL_MAX_DELAY_MS || 240000);
const HEADLESS = process.env.GMAIL_HEADLESS !== 'false';
const SEND_ENABLED = process.env.GMAIL_SEND_ENABLED === 'true';
const BROWSER_CHANNEL = process.env.GMAIL_BROWSER_CHANNEL || 'chrome';
const PLAYWRIGHT_CLI_SESSION =
  process.env.PLAYWRIGHT_CLI_SESSION || 'google-cantoni';
const PROFILE_DIR =
  process.env.PLAYWRIGHT_PROFILE_DIR ||
  process.env.GMAIL_PROFILE_DIR ||
  '/Volumes/Lexar/playwright-profiles/cantoni-gmail';
const AUTHUSER = process.env.GMAIL_AUTHUSER || '0';
const EXPECTED_ACCOUNT_EMAIL =
  (process.env.GMAIL_EXPECTED_ACCOUNT_EMAIL || 'cantonidigitalstudio@gmail.com').toLowerCase();
const CHROME_PROFILE_DIRECTORY =
  process.env.GMAIL_CHROME_PROFILE_DIRECTORY || 'Profile 18';
const LOCK_FILE = path.join(queueDir, '.worker.lock');

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
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
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isPending(item) {
  return (item.status || 'pending') === 'pending';
}

async function acquireLock() {
  const writeCurrentPid = async () => {
    const fd = await fs.open(LOCK_FILE, 'wx');
    await fd.writeFile(String(process.pid), 'utf8');
    await fd.close();
  };

  try {
    await writeCurrentPid();
    return;
  } catch {
    // continue to stale-lock check
  }

  try {
    const raw = await fs.readFile(LOCK_FILE, 'utf8');
    const pid = Number(String(raw || '').trim());
    let alive = false;
    if (Number.isFinite(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        alive = true;
      } catch {
        alive = false;
      }
    }
    if (!alive) {
      await fs.unlink(LOCK_FILE).catch(() => {});
      await writeCurrentPid();
      return;
    }
  } catch {
    // lock unreadable/missing after race; fall through to final error
  }

  throw new Error(`Worker lock exists: ${LOCK_FILE}. Another worker is running.`);
}

async function releaseLock() {
  try {
    await fs.unlink(LOCK_FILE);
  } catch {
    // no-op
  }
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error(
      'Playwright non installato. Esegui: npm i -D playwright && npx playwright install chromium'
    );
  }
}

async function waitForGmailReady(page) {
  await page.goto(`https://mail.google.com/mail/u/${AUTHUSER}/#inbox`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });

  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    const composeRole = page.getByRole('button', {
      name: /compose|scrivi|redactar|rédiger|schrijven|schreiben/i
    });
    if ((await composeRole.count()) > 0) return;

    const composeSelectors = [
      'div[gh="cm"]',
      'div[role="button"][gh="cm"]',
      '[aria-label*="Compose"]',
      '[aria-label*="Scrivi"]',
      '[aria-label*="Redactar"]',
      '[aria-label*="Rédiger"]',
      '[data-tooltip*="Compose"]',
      '[data-tooltip*="Scrivi"]'
    ];

    for (const sel of composeSelectors) {
      const el = await page.$(sel);
      if (el) return;
    }

    const url = page.url();
    if (/accounts\.google\.com/i.test(url)) {
      // Waiting for manual login on the same persistent profile.
      await page.waitForTimeout(2000);
      continue;
    }

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(1500);
  }

  throw new Error(
    'Gmail non pronto o sessione non autenticata. Apri una volta il profilo e completa login/2FA.'
  );
}

async function assertExpectedAccount(page) {
  if (!EXPECTED_ACCOUNT_EMAIL) return;

  const containsExpectedEmail = async () => {
    const html = (await page.content()).toLowerCase();
    return html.includes(EXPECTED_ACCOUNT_EMAIL);
  };

  // Primary path: open account switcher and check visible email.
  const accountBtnCandidates = [
    'a[aria-label*="Google Account"]',
    'a[aria-label*="Account Google"]',
    'a[aria-label*="@"]',
    'header a[aria-label]'
  ];

  let opened = false;
  for (const sel of accountBtnCandidates) {
    const btn = await page.$(sel);
    if (btn) {
      await btn.click();
      opened = true;
      await page.waitForTimeout(1000);
      break;
    }
  }

  if (opened) {
    const ok = await containsExpectedEmail();
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
    if (ok) return;
  }

  // Fallback for headless/localized layouts where the avatar button is not exposed.
  // AccountChooser reliably renders the current Google identities in DOM text.
  await page.goto(
    `https://accounts.google.com/AccountChooser?continue=https://mail.google.com/mail/u/${AUTHUSER}/#inbox`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    }
  );
  await page.waitForTimeout(1200);

  if (await containsExpectedEmail()) {
    await page.goto(`https://mail.google.com/mail/u/${AUTHUSER}/#inbox`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForTimeout(1200);
    return;
  }

  throw new Error(
    `Account Google errato o non verificabile. Atteso: ${EXPECTED_ACCOUNT_EMAIL}. Apri il profilo corretto e rifai login.`
  );
}

async function clickCompose(page) {
  const composeRole = page.getByRole('button', {
    name: /compose|scrivi|redactar|rédiger|schrijven|schreiben/i
  });
  if ((await composeRole.count()) > 0) {
    await composeRole.first().click();
    await page.waitForTimeout(500);
    return;
  }

  const selectors = [
    'div[gh="cm"]',
    'div[role="button"][gh="cm"]',
    '[aria-label*="Compose"]',
    '[aria-label*="Scrivi"]',
    '[aria-label*="Redactar"]',
    '[aria-label*="Rédiger"]',
    '[data-tooltip*="Compose"]',
    '[data-tooltip*="Scrivi"]'
  ];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click();
      await page.waitForTimeout(500);
      return;
    }
  }
  throw new Error('Pulsante Compose non trovato.');
}

async function fillAndSend(page, item) {
  await clickCompose(page);

  const toSelectors = [
    'textarea[name="to"]',
    'input[aria-label*="To"]',
    'input[aria-label*="A"]',
    'input[role="combobox"][aria-autocomplete="list"]',
    'div[aria-label*="Recipients"] input',
    'div[aria-label*="Destinatari"] input'
  ];
  let toFilled = false;
  for (const sel of toSelectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click();
      await page.fill(sel, item.to);
      await page.keyboard.press('Enter').catch(() => {});
      toFilled = true;
      break;
    }
  }
  if (!toFilled) throw new Error('Campo destinatario non trovato.');

  const subjectSelectors = [
    'input[name="subjectbox"]',
    'input[aria-label*="Subject"]',
    'input[aria-label*="Oggetto"]'
  ];
  let subjectFilled = false;
  for (const sel of subjectSelectors) {
    const el = await page.$(sel);
    if (el) {
      await page.fill(sel, item.subject);
      subjectFilled = true;
      break;
    }
  }
  if (!subjectFilled) throw new Error('Campo oggetto non trovato.');

  const bodySelectors = [
    'div[aria-label="Message Body"]',
    'div[aria-label="Corpo del messaggio"]',
    'div[role="textbox"][g_editable="true"]',
    'div[contenteditable="true"][role="textbox"]'
  ];

  let bodyFilled = false;
  for (const sel of bodySelectors) {
    const box = await page.$(sel);
    if (box) {
      await box.click();
      await page.keyboard.type(item.body, { delay: 2 });
      bodyFilled = true;
      break;
    }
  }
  if (!bodyFilled) throw new Error('Body editor non trovato.');

  if (!SEND_ENABLED) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    return 'drafted';
  }

  const sendSelectors = [
    '[data-tooltip^="Send"]',
    '[data-tooltip^="Invia"]',
    '[aria-label^="Send"]',
    '[aria-label^="Invia"]'
  ];

  for (const sel of sendSelectors) {
    const btn = await page.$(sel);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(1500);
      return 'sent';
    }
  }

  // Fallback keyboard
  await page.keyboard.down('Control');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Control');
  await page.waitForTimeout(1500);
  return 'sent';
}

async function snapshotReplies(page) {
  await page.goto(
    `https://mail.google.com/mail/u/${AUTHUSER}/#search/in%3Ainbox%20newer_than%3A7d`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    }
  );
  await page.waitForTimeout(2000);

  const rows = await page.$$eval('tr.zA', (trs) =>
    trs.slice(0, 25).map((row) => {
      const fromEl = row.querySelector('.yW span[email], .yW span');
      const subjectEl = row.querySelector('.y6 span');
      const snippetEl = row.querySelector('.y2');
      const timeEl = row.querySelector('td.xW span');
      return {
        from: fromEl?.getAttribute('email') || fromEl?.textContent?.trim() || '',
        subject: subjectEl?.textContent?.trim() || '',
        snippet: snippetEl?.textContent?.trim() || '',
        time: timeEl?.getAttribute('title') || timeEl?.textContent?.trim() || ''
      };
    })
  );

  return rows.filter((r) => r.from || r.subject);
}

async function run() {
  await ensureDir(queueDir);
  await acquireLock();

  try {
    const queue = await readJson(queueFile, []);
    const pipelineRows = await readLeadPipeline(csvFile);
    const state = await readJson(stateFile, {
      last_run_at: null,
      sent_total: 0,
      drafted_total: 0,
      errors_total: 0
    });

    const { chromium } = await loadPlaywright();
    const launchOptions = {
      headless: HEADLESS,
      viewport: { width: 1440, height: 900 },
      args: [
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        `--profile-directory=${CHROME_PROFILE_DIRECTORY}`
      ]
    };
    if (BROWSER_CHANNEL && BROWSER_CHANNEL !== 'chromium') {
      launchOptions.channel = BROWSER_CHANNEL;
    }
    const context = await chromium.launchPersistentContext(PROFILE_DIR, launchOptions);
    const page = context.pages()[0] || (await context.newPage());

    await waitForGmailReady(page);
    await assertExpectedAccount(page);

    const pending = queue.filter(isPending).slice(0, MAX_PER_RUN);
    const runLog = [];

    for (const item of pending) {
      try {
        const mode = await fillAndSend(page, item);
        item.status = mode;
        item.processed_at = nowIso();
        runLog.push({ id: item.id || null, to: item.to, status: mode, at: item.processed_at });

        const leadRow = pipelineRows.find((row) => row.lead_id === (item.lead_id || item.id));
        if (leadRow) {
          if (mode === 'sent') {
            leadRow.status = 'CONTACTED';
            leadRow.last_action = `Initial outreach sent via Gmail worker (${item.to})`;
            leadRow.next_action_date = nextActionDateFrom(item.processed_at, 3);
            leadRow.last_error = '';
          } else if (mode === 'drafted') {
            leadRow.last_action = `Draft generated in Gmail worker (${item.to})`;
            leadRow.last_error = '';
          }
        }

        if (mode === 'sent') state.sent_total += 1;
        if (mode === 'drafted') state.drafted_total += 1;
      } catch (err) {
        item.status = 'error';
        item.error = String(err.message || err);
        item.processed_at = nowIso();
        runLog.push({ id: item.id || null, to: item.to, status: 'error', at: item.processed_at });
        const leadRow = pipelineRows.find((row) => row.lead_id === (item.lead_id || item.id));
        if (leadRow) {
          leadRow.last_action = `Gmail worker error on outreach attempt (${item.to})`;
          leadRow.last_error = item.error;
          leadRow.next_action_date = leadRow.next_action_date || todayDate();
        }
        state.errors_total += 1;
      }

      const delay = randomBetween(MIN_DELAY_MS, MAX_DELAY_MS);
      await sleep(delay);
    }

    const replies = await snapshotReplies(page);
    await writeJson(queueFile, queue);
    await writeLeadPipeline(csvFile, pipelineRows);
    await writeJson(repliesFile, {
      captured_at: nowIso(),
      count: replies.length,
      rows: replies
    });

    state.last_run_at = nowIso();
    await writeJson(stateFile, state);

    console.log(
      JSON.stringify(
        {
          ok: true,
          headless: HEADLESS,
          browser_channel: BROWSER_CHANNEL,
          session_name: PLAYWRIGHT_CLI_SESSION,
          send_enabled: SEND_ENABLED,
          expected_account_email: EXPECTED_ACCOUNT_EMAIL,
          profile_dir: PROFILE_DIR,
          chrome_profile_directory: CHROME_PROFILE_DIRECTORY,
          processed: runLog.length,
          run_log: runLog,
          replies_count: replies.length
        },
        null,
        2
      )
    );

    await context.close();
  } finally {
    await releaseLock();
  }
}

run().catch(async (err) => {
  const msg = String(err.message || err);
  let code = 'WORKER_ERROR';

  if (/Account Google errato|errato o non verificabile/i.test(msg)) {
    code = 'WRONG_GMAIL_ACCOUNT';
  } else if (/sessione non autenticata|captcha|2fa|two-step|verification|manual login/i.test(msg)) {
    code = 'AUTH_REQUIRED';
  } else if (/Worker lock exists|ProcessSingleton/i.test(msg)) {
    code = 'WORKER_LOCKED';
  }

  console.error(`ERROR_CODE=${code}`);
  console.error(msg);
  await releaseLock();
  process.exit(1);
});
