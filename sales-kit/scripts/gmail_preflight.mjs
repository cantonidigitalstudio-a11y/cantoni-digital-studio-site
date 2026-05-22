import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bindingFile = path.resolve(__dirname, '../queue/account_binding.json');

const PLAYWRIGHT_CLI_SESSION =
  process.env.PLAYWRIGHT_CLI_SESSION || 'google-cantoni';
const PROFILE_DIR =
  process.env.PLAYWRIGHT_PROFILE_DIR ||
  process.env.GMAIL_PROFILE_DIR ||
  '/Volumes/Lexar/playwright-profiles/cantoni-gmail';
const BROWSER_CHANNEL = process.env.GMAIL_BROWSER_CHANNEL || 'chromium';
const EXPECTED_ACCOUNT_EMAIL =
  (process.env.GMAIL_EXPECTED_ACCOUNT_EMAIL || 'cantonidigitalstudio@gmail.com').toLowerCase();
const AUTHUSER = process.env.GMAIL_AUTHUSER || '0';
const CHROME_PROFILE_DIRECTORY =
  process.env.GMAIL_CHROME_PROFILE_DIRECTORY || 'Profile 18';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error('Playwright non installato.');
  }
}

async function hasCompose(page) {
  const composeRole = page.getByRole('button', {
    name: /compose|scrivi|redactar|rédiger|schrijven|schreiben/i
  });
  if ((await composeRole.count()) > 0) return true;

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
    if (await page.$(sel)) return true;
  }
  return false;
}

async function run() {
  const { chromium } = await loadPlaywright();
  const launchOptions = {
    headless: true,
    viewport: { width: 1280, height: 800 },
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

  try {
    await page.goto(`https://mail.google.com/mail/u/${AUTHUSER}/#inbox`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForTimeout(1200);

    if (/accounts\.google\.com/i.test(page.url())) {
      throw new Error('AUTH_REQUIRED: sessione Gmail non autenticata.');
    }

    if (!(await hasCompose(page))) {
      throw new Error('AUTH_REQUIRED: Gmail non pronta (compose non trovato).');
    }

    await page.goto(
      `https://accounts.google.com/AccountChooser?continue=https://mail.google.com/mail/u/${AUTHUSER}/#inbox`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 120000
      }
    );
    await page.waitForTimeout(1200);
    const html = (await page.content()).toLowerCase();
    if (!html.includes(EXPECTED_ACCOUNT_EMAIL)) {
      throw new Error(`WRONG_GMAIL_ACCOUNT: atteso ${EXPECTED_ACCOUNT_EMAIL}.`);
    }

    await fs.mkdir(path.dirname(bindingFile), { recursive: true });
    await fs.writeFile(
      bindingFile,
      JSON.stringify(
        {
          verified_at: new Date().toISOString(),
          account_email: EXPECTED_ACCOUNT_EMAIL,
          authuser: AUTHUSER,
          session_name: PLAYWRIGHT_CLI_SESSION,
          profile_dir: PROFILE_DIR,
          chrome_profile_directory: CHROME_PROFILE_DIRECTORY,
          source: 'gmail_preflight'
        },
        null,
        2
      ),
      'utf8'
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          account_verified: EXPECTED_ACCOUNT_EMAIL,
          session_name: PLAYWRIGHT_CLI_SESSION,
          profile_dir: PROFILE_DIR,
          authuser: AUTHUSER,
          binding_file: bindingFile
        },
        null,
        2
      )
    );
  } finally {
    await context.close();
  }
}

run().catch((err) => {
  const msg = String(err.message || err);
  if (/WRONG_GMAIL_ACCOUNT/i.test(msg)) {
    console.error('ERROR_CODE=WRONG_GMAIL_ACCOUNT');
  } else if (/AUTH_REQUIRED/i.test(msg)) {
    console.error('ERROR_CODE=AUTH_REQUIRED');
  } else if (/ProcessSingleton|Worker lock exists/i.test(msg)) {
    console.error('ERROR_CODE=WORKER_LOCKED');
  } else {
    console.error('ERROR_CODE=PREFLIGHT_ERROR');
  }
  console.error(msg);
  process.exit(1);
});
