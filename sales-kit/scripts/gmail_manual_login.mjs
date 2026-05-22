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
const TARGET_GMAIL = process.env.TARGET_GMAIL || 'cantonidigitalstudio@gmail.com';
const AUTHUSER = process.env.GMAIL_AUTHUSER || '0';
const CHROME_PROFILE_DIRECTORY =
  process.env.GMAIL_CHROME_PROFILE_DIRECTORY || 'Profile 18';
const TIMEOUT_MS = Number(process.env.GMAIL_LOGIN_WAIT_MS || 900000);

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
  const selectors = [
    'div[gh="cm"]',
    'div[role="button"][gh="cm"]',
    '[aria-label*="Compose"]',
    '[aria-label*="Scrivi"]'
  ];
  for (const sel of selectors) {
    if (await page.$(sel)) return true;
  }
  return false;
}

async function writeBindingAndExit(context) {
  await fs.mkdir(path.dirname(bindingFile), { recursive: true });
  await fs.writeFile(
    bindingFile,
    JSON.stringify(
      {
        verified_at: new Date().toISOString(),
        account_email: TARGET_GMAIL,
        authuser: AUTHUSER,
        session_name: PLAYWRIGHT_CLI_SESSION,
          profile_dir: PROFILE_DIR,
          chrome_profile_directory: CHROME_PROFILE_DIRECTORY,
          source: 'gmail_manual_login'
        },
      null,
      2
    ),
    'utf8'
  );
  console.log('SUCCESS');
  console.log(`account_verified=${TARGET_GMAIL}`);
  console.log(`session_name=${PLAYWRIGHT_CLI_SESSION}`);
  console.log(`profile_dir=${PROFILE_DIR}`);
  console.log(`binding_file=${bindingFile}`);
  console.log('next_step=run_run_gmail_checks.sh');
  await context.close();
  process.exit(0);
}

async function findReadyGmailPage(context) {
  for (const page of context.pages()) {
    try {
      if (page.isClosed()) continue;
      const url = page.url();
      if (!/mail\.google\.com|accounts\.google\.com/i.test(url)) continue;
      if (await hasCompose(page)) return page;
    } catch {
      // ignore transient page/state errors while Google navigates
    }
  }
  return null;
}

const { chromium } = await loadPlaywright();
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1365, height: 900 },
  args: [
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    `--profile-directory=${CHROME_PROFILE_DIRECTORY}`
  ]
});

const landingPage = context.pages()[0] || (await context.newPage());
await landingPage.goto(
  `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(TARGET_GMAIL)}&continue=https://mail.google.com/mail/u/${AUTHUSER}/#inbox`,
  { waitUntil: 'domcontentloaded', timeout: 120000 }
);

console.log('PENDING');
console.log(`account_expected=${TARGET_GMAIL}`);
console.log(`session_name=${PLAYWRIGHT_CLI_SESSION}`);
console.log(`profile_dir=${PROFILE_DIR}`);
console.log('action=complete_login_in_the_opened_playwright_browser');

const start = Date.now();
while (Date.now() - start < TIMEOUT_MS) {
  const readyPage = await findReadyGmailPage(context);
  if (readyPage) {
    await writeBindingAndExit(context);
  }

  const activePages = context.pages().filter((page) => !page.isClosed());
  if (activePages.length === 0) {
    throw new Error('Playwright browser was closed before login completed.');
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
}

console.log('BLOCKED');
console.log('reason=manual_login_not_completed_in_time');
console.log(`account_verified=pending_manual:${TARGET_GMAIL}`);
console.log(`session_name=${PLAYWRIGHT_CLI_SESSION}`);
console.log(`profile_dir=${PROFILE_DIR}`);
console.log('next_step=rerun_gmail_session_setup.sh_and_complete_login');
await context.close();
process.exit(1);
