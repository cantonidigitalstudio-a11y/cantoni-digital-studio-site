import { chromium } from 'playwright';
import { createInterface } from 'node:readline';

// Operational helper for profile-avatar maintenance. Credentials and 2FA codes
// must be passed via one JSON line on stdin and are never persisted by this file.
const PROFILE_DIR =
  process.env.CHROME_PROFILE_DIR || '/Volumes/Lexar/playwright-profiles/cantoni-gmail';

function readJsonLine() {
  const rl = createInterface({ input: process.stdin, terminal: false });
  return new Promise((resolve, reject) => {
    rl.once('line', (line) => {
      rl.close();
      try {
        resolve(JSON.parse(line));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function bodyText(page) {
  return page.locator('body').innerText({ timeout: 10_000 }).catch((error) => `ERR:${error.message}`);
}

async function clickText(page, labels) {
  for (const label of labels) {
    const locator = page.getByText(label, { exact: true });
    if ((await locator.count().catch(() => 0)) > 0) {
      const first = locator.first();
      if (await first.isVisible().catch(() => false)) {
        await first.click({ timeout: 15_000 });
        await page.waitForTimeout(2_000);
        return label;
      }
    }
  }
  return null;
}

async function main() {
  const input = await readJsonLine();
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 1000 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });
  const page = context.pages()[0] || (await context.newPage());

  await page.goto('https://www.instagram.com/accounts/login/', {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  await page.waitForTimeout(5_000);
  await clickText(page, [
    'Consenti tutti i cookie',
    'Allow all cookies',
    'Rifiuta cookie non necessari',
    'Decline optional cookies',
  ]).catch(() => {});

  const usernameInput = page
    .locator(
      [
        'input[name="username"]',
        'input[autocomplete="username"]',
        'input[type="email"]',
        'input[type="text"]',
        'input[placeholder*="telefono" i]',
        'input[placeholder*="utente" i]',
        'input[placeholder*="e-mail" i]',
        'input[aria-label*="telefono" i]',
        'input[aria-label*="utente" i]',
        'input[aria-label*="e-mail" i]',
      ].join(', '),
    )
    .first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

  if (await usernameInput.isVisible().catch(() => false)) {
    await usernameInput.fill(input.username);
    await passwordInput.fill(input.password);
    await page.waitForTimeout(1_000);
    const submitClicked =
      (await clickText(page, ['Accedi', 'Log in'])) ||
      (await page
        .getByRole('button', { name: /^Accedi$|^Log in$/i })
        .first()
        .click({ timeout: 10_000 })
        .then(() => 'role-button')
        .catch(() => null));
    if (!submitClicked) {
      await passwordInput.press('Enter', { timeout: 10_000 });
    }
    await page.waitForTimeout(9_000);
  }

  let body = await bodyText(page);
  const result = { afterLoginUrl: page.url(), body: body.slice(0, 700) };

  if (/codice di sicurezza|security code|two-factor|autenticazione/i.test(body)) {
    if (input.code) {
      await page
        .locator('input[type="text"], input[type="tel"], input[name*="code" i]')
        .first()
        .fill(input.code);
      const clicked = await clickText(page, ['Conferma', 'Confirm', 'Continua', 'Continue']);
      if (!clicked) await page.keyboard.press('Enter');
      await page.waitForTimeout(10_000);
      body = await bodyText(page);
      result.after2faUrl = page.url();
      result.after2faBody = body.slice(0, 700);
    }
  }

  if (/non è più valido|not valid|incorrect|sbagliato|wrong/i.test(body)) {
    await page.screenshot({ path: '/tmp/ig-persistent-login-blocked.png', fullPage: false });
    console.log(
      JSON.stringify(
        {
          ok: false,
          phase: '2fa',
          reason: 'invalid_or_expired',
          screenshot: '/tmp/ig-persistent-login-blocked.png',
          result,
        },
        null,
        2,
      ),
    );
    await context.close();
    process.exit(2);
  }

  if (/codice di sicurezza|security code|two-factor|autenticazione/i.test(body)) {
    await page.screenshot({ path: '/tmp/ig-persistent-login-blocked.png', fullPage: false });
    console.log(
      JSON.stringify(
        {
          ok: false,
          phase: '2fa',
          reason: 'still_required',
          screenshot: '/tmp/ig-persistent-login-blocked.png',
          result,
        },
        null,
        2,
      ),
    );
    await context.close();
    process.exit(2);
  }

  await page.goto('https://www.instagram.com/accounts/edit/', {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  await page.waitForTimeout(6_000);
  body = await bodyText(page);
  if (/Accedi|Iscriviti|Log in|Sign up/i.test(body) && !/Modifica profilo|Edit profile/i.test(body)) {
    await page.screenshot({ path: '/tmp/ig-persistent-not-auth.png', fullPage: false });
    console.log(
      JSON.stringify(
        {
          ok: false,
          phase: 'auth',
          reason: 'not_authenticated',
          url: page.url(),
          body: body.slice(0, 800),
          screenshot: '/tmp/ig-persistent-not-auth.png',
          result,
        },
        null,
        2,
      ),
    );
    await context.close();
    process.exit(3);
  }

  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10_000 }).catch(() => null);
  const clickedChange = await clickText(page, [
    'Cambia foto',
    'Change photo',
    'Cambia immagine del profilo',
    'Change profile photo',
  ]);
  if (!clickedChange) {
    await page.getByRole('button', { name: /Cambia|Change|foto|photo|immagine/i }).first().click({
      timeout: 15_000,
    });
  }

  const chooser = await fileChooserPromise;
  if (chooser) {
    await chooser.setFiles(input.avatarPath);
  } else {
    const inputs = page.locator('input[type="file"]');
    const count = await inputs.count();
    if (!count) throw new Error('No profile-photo file input found.');
    await inputs.nth(count - 1).setInputFiles(input.avatarPath);
  }

  await page.waitForTimeout(8_000);
  for (const label of ['Avanti', 'Next', 'Salva', 'Save', 'Fine', 'Done']) {
    await clickText(page, [label]).catch(() => {});
  }
  await page.waitForTimeout(10_000);
  await page.goto('https://www.instagram.com/cantonidigitalstudio/?v=persistent-final', {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  await page.waitForTimeout(7_000);
  body = await bodyText(page);
  await page.screenshot({ path: '/tmp/instagram-cantoni-avatar-persistent-final.png', fullPage: false });

  console.log(
    JSON.stringify(
      {
        ok: true,
        url: page.url(),
        hasEdit: /Modifica profilo|Edit profile/.test(body),
        hasStudioLink: body.includes('cantonidigitalstudio.com'),
        hasOldLink: body.includes('zumu.be/ecantoni'),
        screenshot: '/tmp/instagram-cantoni-avatar-persistent-final.png',
      },
      null,
      2,
    ),
  );
  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
