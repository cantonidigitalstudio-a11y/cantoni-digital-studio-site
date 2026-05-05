const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const baseUrl = process.env.VIP_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.join(__dirname, '..', 'output', 'playwright', 'vip-audit');

const cases = [
  {
    page: 'fleet',
    lang: 'es',
    url: `${baseUrl}/excellentia-vip-fleet.html?lang=es`,
    texts: ['Ver paquetes']
  },
  {
    page: 'fleet',
    lang: 'it',
    url: `${baseUrl}/excellentia-vip-fleet.html?lang=it`,
    texts: ['Vedi pacchetti']
  },
  {
    page: 'ops',
    lang: 'es',
    url: `${baseUrl}/excellentia-vip-operations.html?lang=es`,
    texts: ['Ver paquetes', 'Ver flota', 'Ver flujo por WhatsApp', 'Ver solicitud base']
  },
  {
    page: 'ops',
    lang: 'it',
    url: `${baseUrl}/excellentia-vip-operations.html?lang=it`,
    texts: ['Vedi pacchetti', 'Vedi flotta', 'Vedi flusso WhatsApp', 'Richiesta']
  }
];

async function auditPage(browser, testCase, mode) {
  const context =
    mode === 'mobile'
      ? await browser.newContext({ ...devices['iPhone 12'] })
      : await browser.newContext({ viewport: { width: 1440, height: 1200 } });

  try {
    const page = await context.newPage();
    await page.goto(testCase.url, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const bodyText = await page.locator('body').innerText();
    const missing = testCase.texts.filter((txt) => !bodyText.includes(txt));

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      finalCtas: Array.from(document.querySelectorAll('.final-cta-actions a')).map((a) => ({
        text: a.textContent.trim(),
        width: Math.round(a.getBoundingClientRect().width)
      })),
      channelCtas: Array.from(document.querySelectorAll('.channel-card a')).map((a) => ({
        text: a.textContent.trim(),
        width: Math.round(a.getBoundingClientRect().width)
      }))
    }));

    const suffix = mode === 'desktop' ? '1440' : '390';
    await page.screenshot({
      path: path.join(outDir, `${testCase.page}-${testCase.lang}-${suffix}.png`),
      fullPage: true
    });

    return {
      case: `${testCase.page}-${testCase.lang}-${mode}`,
      missing,
      metrics
    };
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const results = [];
    for (const testCase of cases) {
      results.push(await auditPage(browser, testCase, 'desktop'));
      results.push(await auditPage(browser, testCase, 'mobile'));
    }

    const failures = results.filter((result) => result.missing.length > 0 || result.metrics.overflow > 0);
    console.log(JSON.stringify({ results, failures }, null, 2));

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
