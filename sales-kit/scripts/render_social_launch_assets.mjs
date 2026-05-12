import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const postsFile = path.join(rootDir, 'social-launch/posts.json');
const outDir = path.join(rootDir, 'social-launch/output');
const logoFile = path.resolve(rootDir, '../assets/logo/cantoni_primary_horizontal_small.svg');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paletteFor(type) {
  const palettes = {
    portfolio: ['#13264a', '#f0a23b', '#f8fafc', '#dce6f2'],
    method: ['#111827', '#2bb3a3', '#f8fafc', '#d8f3ef'],
    services: ['#172554', '#ef6f5e', '#f8fafc', '#ffe0d9']
  };
  return palettes[type] || palettes.portfolio;
}

function htmlFor(post, logoDataUri) {
  const [navy, accent, paper, soft] = paletteFor(post.type);
  const titleClass = post.title.length > 18 ? ' title-long' : '';
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="icon" href="data:,">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      font-family: Inter, Sora, Manrope, Arial, sans-serif;
      background: ${paper};
      color: ${navy};
    }
    .card {
      position: relative;
      width: 1080px;
      height: 1080px;
      padding: 70px;
      background:
        linear-gradient(135deg, ${paper} 0%, #ffffff 44%, ${soft} 100%);
    }
    .brand {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid rgba(19,38,74,.12);
      padding-bottom: 34px;
    }
    .brand img {
      width: 360px;
      height: auto;
      display: block;
    }
    .tag {
      color: ${accent};
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .main {
      position: relative;
      z-index: 1;
      padding-top: 78px;
      max-width: 850px;
    }
    h1 {
      margin: 0;
      color: ${navy};
      font-size: 92px;
      line-height: 0.96;
      font-weight: 900;
      letter-spacing: 0;
      max-width: 830px;
    }
    .title-long h1 {
      font-size: 78px;
      max-width: 760px;
    }
    .title-long h2,
    .title-long .body {
      max-width: 760px;
    }
    h2 {
      margin: 34px 0 0;
      color: #374151;
      font-size: 36px;
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: 0;
    }
    .body {
      margin-top: 44px;
      max-width: 820px;
      color: #1f2937;
      font-size: 34px;
      line-height: 1.32;
      font-weight: 650;
    }
    .proof {
      position: absolute;
      left: 70px;
      right: 70px;
      bottom: 70px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 26px;
      align-items: center;
      padding-top: 34px;
      border-top: 3px solid rgba(19,38,74,.12);
      z-index: 1;
    }
    .proof-text {
      font-size: 26px;
      line-height: 1.28;
      color: #475569;
      font-weight: 750;
    }
    .cta {
      border-radius: 999px;
      background: ${navy};
      color: white;
      padding: 20px 28px;
      font-size: 26px;
      font-weight: 900;
      white-space: nowrap;
      box-shadow: 0 16px 36px rgba(15,23,42,.18);
    }
    .stripe {
      position: absolute;
      top: 0;
      right: 0;
      width: 26px;
      height: 1080px;
      background: ${accent};
    }
    .mark {
      position: absolute;
      right: 92px;
      top: 260px;
      width: 190px;
      height: 190px;
      border-radius: 42px;
      border: 5px solid rgba(19,38,74,.10);
      background: rgba(255,255,255,.55);
      transform: rotate(8deg);
      opacity: .42;
      z-index: 0;
    }
  </style>
</head>
<body>
  <main class="card${titleClass}">
    <div class="stripe"></div>
    <div class="mark"></div>
    <section class="brand">
      <img src="${logoDataUri}" alt="Cantoni Digital Studio">
      <div class="tag">${escapeHtml(post.type)}</div>
    </section>
    <section class="main">
      <h1>${escapeHtml(post.title)}</h1>
      <h2>${escapeHtml(post.subtitle)}</h2>
      <p class="body">${escapeHtml(post.body)}</p>
    </section>
    <section class="proof">
      <div class="proof-text">${escapeHtml(post.proof)}</div>
      <div class="cta">${escapeHtml(post.cta)}</div>
    </section>
  </main>
</body>
</html>`;
}

async function run() {
  const posts = JSON.parse(await fs.readFile(postsFile, 'utf8'));
  const logo = await fs.readFile(logoFile, 'utf8');
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
    for (const post of posts) {
      await page.setContent(htmlFor(post, logoDataUri), { waitUntil: 'load' });
      const pngPath = path.join(outDir, `${post.id}.png`);
      const htmlPath = path.join(outDir, `${post.id}.html`);
      await fs.writeFile(htmlPath, htmlFor(post, logoDataUri), 'utf8');
      await page.screenshot({ path: pngPath, fullPage: false });
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({
    ok: true,
    count: posts.length,
    output_dir: outDir,
    preview: pathToFileURL(outDir).href
  }, null, 2));
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
