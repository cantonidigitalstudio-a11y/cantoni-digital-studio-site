import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'social-launch/output');
const logoFile = path.resolve(rootDir, '../assets/logo/cantoni_primary_horizontal_small.svg');
const iconFile = path.resolve(rootDir, '../assets/logo/cantoni_icona_quadrata.svg');
const coverHtmlFile = path.join(outDir, 'facebook-cover-cantoni.html');
const coverPngFile = path.join(outDir, 'facebook-cover-cantoni.png');
const avatarHtmlFile = path.join(outDir, 'instagram-avatar-cantoni.html');
const avatarPngFile = path.join(outDir, 'instagram-avatar-cantoni.png');

function htmlFor(logoDataUri) {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1640px;
      height: 624px;
      overflow: hidden;
      font-family: Inter, Sora, Manrope, Arial, sans-serif;
      color: #13264a;
      background: #f8fafc;
    }
    .cover {
      position: relative;
      width: 1640px;
      height: 624px;
      padding: 72px 94px;
      background:
        linear-gradient(90deg, #ffffff 0%, #f8fafc 47%, #dce6f2 100%);
    }
    .accent {
      position: absolute;
      top: 0;
      right: 0;
      width: 34px;
      height: 624px;
      background: #f0a23b;
    }
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(19,38,74,.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(19,38,74,.055) 1px, transparent 1px);
      background-size: 56px 56px;
      opacity: .55;
    }
    .content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 72px;
      height: 100%;
      align-items: center;
    }
    .brand img {
      width: 520px;
      height: auto;
      display: block;
      margin-bottom: 46px;
    }
    h1 {
      margin: 0;
      max-width: 830px;
      font-size: 74px;
      line-height: 1.02;
      letter-spacing: 0;
      font-weight: 900;
      color: #13264a;
    }
    .sub {
      margin-top: 26px;
      max-width: 850px;
      font-size: 31px;
      line-height: 1.28;
      letter-spacing: 0;
      font-weight: 760;
      color: #334155;
    }
    .proof {
      align-self: stretch;
      width: 405px;
      padding: 42px;
      border: 2px solid rgba(19,38,74,.12);
      border-radius: 28px;
      background: rgba(255,255,255,.84);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 28px 70px rgba(15,23,42,.10);
    }
    .proof-title {
      margin: 0;
      color: #f0a23b;
      font-size: 19px;
      line-height: 1.18;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .proof-lines {
      margin: 28px 0 0;
      display: grid;
      gap: 18px;
      font-size: 25px;
      line-height: 1.18;
      font-weight: 850;
      color: #13264a;
    }
    .contact {
      display: grid;
      gap: 12px;
      color: #475569;
      font-size: 24px;
      line-height: 1.2;
      font-weight: 780;
    }
    .contact strong {
      color: #13264a;
      font-weight: 900;
    }
    .handle {
      color: #f0a23b;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <main class="cover">
    <div class="grid"></div>
    <div class="accent"></div>
    <section class="content">
      <div class="brand">
        <img src="${logoDataUri}" alt="Cantoni Digital Studio">
        <h1>Siti, e-commerce, web app e app.</h1>
        <p class="sub">Progetti digitali con preventivi chiari, pagamenti, automazioni AI e crescita dopo il lancio.</p>
      </div>
      <aside class="proof">
        <div>
          <p class="proof-title">Studio digitale</p>
          <div class="proof-lines">
            <span>Audit reale</span>
            <span>Scope scritto</span>
            <span>Delivery verificata</span>
          </div>
        </div>
        <div class="contact">
          <strong>cantonidigitalstudio.com</strong>
          <span class="handle">@cantonidigitalstudio</span>
        </div>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

function avatarHtmlFor(iconDataUri) {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      background: #13264a;
      font-family: Inter, Sora, Manrope, Arial, sans-serif;
    }
    .avatar {
      position: relative;
      width: 1080px;
      height: 1080px;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 50% 48%, rgba(255,255,255,.14) 0 0, rgba(255,255,255,0) 57%),
        linear-gradient(135deg, #13264a 0%, #1c345d 60%, #0f1f3e 100%);
    }
    .ring {
      position: absolute;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      border: 10px solid rgba(240,162,59,.90);
      box-shadow:
        0 0 0 28px rgba(255,255,255,.10),
        0 38px 110px rgba(0,0,0,.20);
    }
    .safe {
      position: relative;
      width: 720px;
      height: 720px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: transparent;
    }
    .safe::after {
      content: "";
      position: absolute;
      inset: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,.16);
      pointer-events: none;
    }
    img {
      width: 610px;
      height: auto;
      display: block;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <main class="avatar">
    <div class="ring"></div>
    <section class="safe" aria-label="Cantoni Digital Studio">
      <img src="${iconDataUri}" alt="Cantoni Digital Studio">
    </section>
  </main>
</body>
</html>`;
}

async function run() {
  const logo = await fs.readFile(logoFile, 'utf8');
  const icon = await fs.readFile(iconFile, 'utf8');
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;
  const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}`;
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(coverHtmlFile, htmlFor(logoDataUri), 'utf8');
  await fs.writeFile(avatarHtmlFile, avatarHtmlFor(iconDataUri), 'utf8');

  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1640, height: 624 }, deviceScaleFactor: 1 });
    await page.setContent(htmlFor(logoDataUri), { waitUntil: 'load' });
    await page.screenshot({ path: coverPngFile, fullPage: false, animations: 'disabled', timeout: 60000 });
    await page.setViewportSize({ width: 1080, height: 1080 });
    await page.setContent(avatarHtmlFor(iconDataUri), { waitUntil: 'load' });
    await page.screenshot({ path: avatarPngFile, fullPage: false, animations: 'disabled', timeout: 60000 });
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({
    ok: true,
    cover: coverPngFile,
    avatar: avatarPngFile
  }, null, 2));
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
