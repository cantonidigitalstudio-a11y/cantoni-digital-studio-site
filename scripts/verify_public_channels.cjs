const assert = require('assert/strict');
const fs = require('fs/promises');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = process.env.PUBLIC_CHANNEL_SCREENSHOT_DIR || '/tmp';

const CHANNELS = [
  {
    id: 'instagram',
    url: 'https://www.instagram.com/cantonidigitalstudio/',
    status: 'public-proof',
    requiredText: [
      'Cantoni Digital Studio',
      'cantonidigitalstudio',
      'Siti, e-commerce, web app e app',
      'Automazioni AI e crescita digitale',
      'cantonidigitalstudio.com'
    ],
    forbiddenText: ['zumu.be/ecantoni']
  },
  {
    id: 'facebook',
    url: 'https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/',
    status: 'public-proof',
    requiredText: [
      'Cantoni Digital Studio',
      'Web designer',
      'cantonidigitalstudio@gmail.com',
      'cantonidigitalstudio.com'
    ],
    forbiddenText: ['zumu.be/ecantoni']
  },
  {
    id: 'tiktok',
    url: 'https://www.tiktok.com/@cantonidigitalstudio',
    status: 'login-gated-ok',
    requiredWhenPublic: [
      'Cantoni Digital Studio',
      'cantonidigitalstudio'
    ]
  }
];

const IDENTITY_CONTRACT = {
  file: 'identita-operativa.html',
  requiredText: [
    'Canali ufficiali',
    'instagram.com/cantonidigitalstudio',
    'facebook.com/Cantoni-Digital-Studio',
    'TikTok configurato',
    '@cantonidigitalstudio',
    'cantonidigitalstudio@gmail.com'
  ],
  forbiddenText: ['zumu.be/ecantoni']
};

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasLoginGate(finalUrl, text) {
  return /\/login\b|accounts\/login|enter_method=mandatory/i.test(finalUrl) ||
    /log in to tiktok|accedi a tiktok|continue with google|usa qr code/i.test(text);
}

async function snapshotPage(page, channel) {
  const response = await page.goto(channel.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(channel.id === 'tiktok' ? 2500 : 1800);
  const data = await page.evaluate(() => ({
    title: document.title || '',
    url: window.location.href || '',
    text: document.body ? document.body.innerText || '' : '',
    metadata: Array.from(document.querySelectorAll('meta'))
      .map((meta) => meta.getAttribute('content') || '')
      .filter(Boolean)
      .join(' ')
  }));
  const screenshot = path.join(SCREENSHOT_DIR, `cantoni-public-channel-${channel.id}-${Date.now()}.png`);
  await page.screenshot({ path: screenshot, fullPage: false }).catch(() => {});
  return {
    statusCode: response ? response.status() : 0,
    title: data.title,
    finalUrl: data.url,
    text: normalize(data.text),
    proofText: normalize([data.title, data.metadata, data.text].join(' ')),
    screenshot
  };
}

function validatePublicProof(channel, result) {
  assert.ok(result.statusCode >= 200 && result.statusCode < 400, `${channel.id}: HTTP status ${result.statusCode}`);
  assert.equal(hasLoginGate(result.finalUrl, result.text), false, `${channel.id}: should be readable without mandatory login`);

  for (const snippet of channel.requiredText || []) {
    assert.ok(
      result.proofText.toLowerCase().includes(snippet.toLowerCase()),
      `${channel.id}: missing public proof text "${snippet}"`
    );
  }

  for (const snippet of channel.forbiddenText || []) {
    assert.equal(
      result.proofText.toLowerCase().includes(snippet.toLowerCase()),
      false,
      `${channel.id}: forbidden stale text "${snippet}"`
    );
  }

  return 'public-proof';
}

function validateLoginGated(channel, result) {
  assert.ok(result.statusCode >= 200 && result.statusCode < 400, `${channel.id}: HTTP status ${result.statusCode}`);

  if (hasLoginGate(result.finalUrl, result.text)) {
    return 'login-gated';
  }

  for (const snippet of channel.requiredWhenPublic || []) {
    assert.ok(
      result.proofText.toLowerCase().includes(snippet.toLowerCase()),
      `${channel.id}: public profile opened but missing "${snippet}"`
    );
  }
  return 'public-proof';
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    locale: 'it-IT'
  });
  const results = [];

  try {
    for (const channel of CHANNELS) {
      const page = await context.newPage();
      try {
        const result = await snapshotPage(page, channel);
        const observed = channel.status === 'login-gated-ok'
          ? validateLoginGated(channel, result)
          : validatePublicProof(channel, result);
        results.push({
          id: channel.id,
          expected: channel.status,
          observed,
          statusCode: result.statusCode,
          finalUrl: result.finalUrl,
          title: result.title,
          screenshot: result.screenshot,
          ok: true
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const identityHtml = await fs.readFile(path.join(ROOT_DIR, IDENTITY_CONTRACT.file), 'utf8');
  for (const snippet of IDENTITY_CONTRACT.requiredText) {
    assert.ok(identityHtml.includes(snippet), `identity-page: missing local official-channel contract "${snippet}"`);
  }
  for (const snippet of IDENTITY_CONTRACT.forbiddenText) {
    assert.equal(identityHtml.includes(snippet), false, `identity-page: stale forbidden text "${snippet}"`);
  }
  results.push({
    id: 'identity-page',
    expected: 'local-official-channel-contract',
    observed: 'local-contract',
    file: IDENTITY_CONTRACT.file,
    ok: true
  });

  console.log(JSON.stringify({ ok: true, checked: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(`FAIL public-channel-verification: ${error.message}`);
  process.exitCode = 1;
});
