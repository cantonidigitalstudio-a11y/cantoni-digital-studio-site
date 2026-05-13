import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import path from 'node:path';

const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9226';
const avatarPath =
  process.env.INSTAGRAM_AVATAR_PATH ||
  path.resolve('sales-kit/social-launch/output/instagram-avatar-cantoni.png');
const code = process.env.IG_2FA_CODE || '';

if (!existsSync(avatarPath)) {
  throw new Error(`Missing Instagram avatar asset: ${avatarPath}`);
}

const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0] || (await browser.newContext());
const page =
  context.pages().find((candidate) => candidate.url().includes('instagram.com')) ||
  (await context.newPage());

async function visibleText() {
  return page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
}

async function maybeSubmitTwoFactorCode() {
  const body = await visibleText();
  const needs2fa =
    page.url().includes('/two_factor') ||
    /codice di sicurezza|security code|two-factor|autenticazione/i.test(body);

  if (!needs2fa) return false;
  if (!code) {
    throw new Error('Instagram is waiting for 2FA. Set IG_2FA_CODE and rerun this script.');
  }

  const codeInput = page
    .locator('input[type="text"], input[type="tel"], input[name*="code" i]')
    .first();
  await codeInput.fill(code, { timeout: 15_000 });

  const confirm = page.getByText('Conferma', { exact: true });
  if ((await confirm.count()) > 0) {
    await confirm.click({ timeout: 15_000 });
  } else {
    await codeInput.press('Enter', { timeout: 15_000 });
  }

  await page.waitForTimeout(8_000);
  return true;
}

async function clickIfVisibleByText(text) {
  const locator = page.getByText(text, { exact: true });
  if ((await locator.count()) > 0 && (await locator.first().isVisible().catch(() => false))) {
    await locator.first().click({ timeout: 15_000 });
    await page.waitForTimeout(2_000);
    return true;
  }
  return false;
}

await maybeSubmitTwoFactorCode();

await page.goto('https://www.instagram.com/cantonidigitalstudio/?v=avatar-upload', {
  waitUntil: 'domcontentloaded',
  timeout: 45_000,
});
await page.waitForTimeout(4_000);

let body = await visibleText();
if (/Accedi|Log in/i.test(body) && !/Modifica profilo|Edit profile/i.test(body)) {
  throw new Error('Instagram session is not authenticated after 2FA.');
}

const changePhoto = page.getByRole('button', {
  name: /Cambia immagine del profilo|Change profile photo/i,
});
await changePhoto.click({ timeout: 20_000 });
await page.waitForTimeout(1_500);

const fileInputs = page.locator('input[type="file"]');
const fileInputCount = await fileInputs.count();
if (fileInputCount === 0) {
  throw new Error('Instagram profile-photo upload input was not found.');
}
await fileInputs.nth(fileInputCount - 1).setInputFiles(avatarPath);
await page.waitForTimeout(5_000);

await clickIfVisibleByText('Avanti');
await clickIfVisibleByText('Next');
await clickIfVisibleByText('Salva');
await clickIfVisibleByText('Save');
await clickIfVisibleByText('Fine');
await clickIfVisibleByText('Done');

await page.waitForTimeout(8_000);
await page.goto('https://www.instagram.com/cantonidigitalstudio/?v=avatar-final-check', {
  waitUntil: 'domcontentloaded',
  timeout: 45_000,
});
await page.waitForTimeout(5_000);

body = await visibleText();
await page.screenshot({
  path: '/tmp/instagram-cantoni-avatar-final-check.png',
  fullPage: false,
});

console.log(
  JSON.stringify(
    {
      ok: true,
      url: page.url(),
      hasStudioLink: body.includes('cantonidigitalstudio.com'),
      hasOldLink: body.includes('zumu.be/ecantoni'),
      screenshot: '/tmp/instagram-cantoni-avatar-final-check.png',
    },
    null,
    2,
  ),
);

await browser.close();
