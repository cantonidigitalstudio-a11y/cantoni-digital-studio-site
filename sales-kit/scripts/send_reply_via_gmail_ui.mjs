import fs from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright';

function arg(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.find((item) => item.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : '';
}

const to = arg('to');
const subject = arg('subject');
const bodyFile = arg('body-file');
const authuser = arg('authuser') || '0';
const cdp = arg('cdp') || 'http://127.0.0.1:9223';
const plainTextOk = arg('plain-text-ok') === 'true';

if (!to || !subject || !bodyFile) {
  console.error('usage: node send_reply_via_gmail_ui.mjs --to=... --subject=... --body-file=/abs/path.txt [--authuser=0] [--cdp=http://127.0.0.1:9223]');
  process.exit(1);
}

if (!plainTextOk) {
  console.error('Blocked: this Gmail UI script sends plain text only and is not valid for branded commercial outreach.');
  console.error('Use the Apps Script background worker with html_body instead, or rerun only for non-branded replies with --plain-text-ok=true.');
  process.exit(1);
}

const body = fs.readFileSync(bodyFile, 'utf8');
const browser = await chromium.connectOverCDP(cdp);
const ctx = browser.contexts()[0];
const page = await ctx.newPage();
try {
  const url = 'https://mail.google.com/mail/u/' + authuser + '/?view=cm&fs=1&tf=1&to=' + encodeURIComponent(to) + '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const currentUrl = page.url();
  const bodyText = await page.locator('body').innerText();
  if (/Accedi|ServiceLogin|signin/i.test(bodyText) || /accounts\.google/i.test(currentUrl)) {
    console.log(JSON.stringify({ ok: false, step: 'compose_open', reason: 'auth_required', url: currentUrl, body: bodyText.slice(0, 1000) }, null, 2));
    process.exit(0);
  }
  const sendButton = page.getByRole('button', { name: /Invia|Send/i }).first();
  await sendButton.waitFor({ state: 'visible', timeout: 15000 });
  await sendButton.click();
  await page.waitForTimeout(5000);
  const after = await page.locator('body').innerText();
  console.log(JSON.stringify({ ok: true, url: page.url(), body: after.slice(0, 1200) }, null, 2));
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
