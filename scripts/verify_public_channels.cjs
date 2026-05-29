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
    status: 'login-gated-ok',
    requiredWhenPublic: [
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
  },
  {
    id: 'youtube',
    url: 'https://www.youtube.com/@cantonidigitalstudio',
    status: 'public-proof',
    requiredText: [
      'Cantoni Digital Studio',
      '@cantonidigitalstudio'
    ],
    forbiddenText: ['EmanueleCantoni']
  }
];

const IDENTITY_CONTRACT = {
  file: 'identita-operativa.html',
  requiredText: [
    'Canali ufficiali',
    'instagram.com/cantonidigitalstudio',
    'facebook.com/Cantoni-Digital-Studio',
    'TikTok configurato',
    'youtube.com/@cantonidigitalstudio',
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
  if (/consent\.(?:youtube|google)\.com/i.test(page.url())) {
    const reject = page.getByRole('button', { name: /Rifiuta tutto|Reject all|Tout refuser|Rechazar todo|Alle ablehnen/i });
    await reject.click({ timeout: 7000 }).catch(async () => {
      await page.getByText(/Rifiuta tutto|Reject all|Tout refuser|Rechazar todo|Alle ablehnen/i)
        .click({ timeout: 3000 })
        .catch(() => {});
    });
    await page.waitForLoadState('domcontentloaded', { timeout: 12000 }).catch(() => {});
  }
  await page.waitForTimeout(channel.id === 'tiktok' ? 2500 : 1800);
  if (channel.id === 'youtube') {
    await waitForPublicProofText(page, channel.requiredText || [], 18000).catch(async () => {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await waitForPublicProofText(page, channel.requiredText || [], 12000).catch(() => {});
    });
  }
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
  await page.screenshot({ path: screenshot, fullPage: false, animations: 'disabled', timeout: 15000 }).catch(() => {});
  return {
    statusCode: response ? response.status() : 0,
    title: data.title,
    finalUrl: data.url,
    text: normalize(data.text),
    proofText: normalize([data.title, data.url, data.metadata, data.text].join(' ')),
    screenshot
  };
}

async function waitForPublicProofText(page, requiredText, timeout) {
  if (!requiredText.length) return;
  await page.waitForFunction(
    (required) => {
      const meta = Array.from(document.querySelectorAll('meta'))
        .map((item) => item.getAttribute('content') || '')
        .join(' ');
      const text = [
        document.title || '',
        window.location.href || '',
        meta,
        document.body ? document.body.innerText || '' : ''
      ].join(' ').toLowerCase();
      return required.some((snippet) => text.includes(String(snippet).toLowerCase()));
    },
    requiredText,
    { timeout }
  );
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

  for (const snippet of channel.forbiddenText || []) {
    assert.equal(
      result.proofText.toLowerCase().includes(snippet.toLowerCase()),
      false,
      `${channel.id}: forbidden stale text "${snippet}"`
    );
  }
  return 'public-proof';
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
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
