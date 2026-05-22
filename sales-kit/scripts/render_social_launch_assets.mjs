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
const projectMarkFiles = {
  '01-excellentia-vip': path.resolve(rootDir, '../assets/portfolio/excellentia-vip/brand/excellentia-vip-logo.svg'),
  '02-destination-cocoa': path.resolve(rootDir, '../../mr-collins-travel/site/output/playwright/destination-cocoa-home.png')
};

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

function mimeFor(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  return 'image/png';
}

async function readDataUri(file) {
  const buffer = await fs.readFile(file);
  return `data:${mimeFor(file)};base64,${buffer.toString('base64')}`;
}

async function readProjectMarks() {
  const marks = {};
  for (const [id, file] of Object.entries(projectMarkFiles)) {
    try {
      marks[id] = await readDataUri(file);
    } catch {
      // Missing optional marks should not block asset generation.
    }
  }
  return marks;
}

function proofDomain(value) {
  return String(value || '')
    .replace(/^Riferimento(?: pubblico| verificabile)?:\s*/i, '')
    .replace(/^Reference(?: pubblica| verificabile)?:\s*/i, '')
    .replace(/^Verificabile:\s*/i, '')
    .replace(/^Prova:\s*/i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/g, '')
    .trim();
}

function initialsFor(title) {
  return String(title || 'CD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function htmlFor(post, logoDataUri, projectMarks) {
  const [navy, accent, paper, soft] = paletteFor(post.type);
  const titleClass = post.title.length > 18 ? ' title-long' : '';
  const proofLabel = post.type === 'portfolio' ? 'Prova pubblica verificabile' : post.type === 'services' ? 'Servizio con perimetro scritto' : 'Metodo operativo';
  const proofText = proofDomain(post.proof || post.cta || 'cantonidigitalstudio.com');
  const markDataUri = projectMarks[post.id];
  const hasProjectMark = Boolean(markDataUri);
  const isProjectPreview = post.id === '02-destination-cocoa' && hasProjectMark;
  const markMode = isProjectPreview ? 'has-project-preview' : hasProjectMark ? 'has-project-mark' : 'has-client-initials';
  const markHtml = markDataUri
    ? `<img class="client-logo" src="${markDataUri}" alt="${escapeHtml(post.title)} logo">`
    : post.type === 'method'
      ? `<div class="method-checklist" aria-hidden="true"><span></span><span></span><span></span></div>`
      : `<div class="client-initials" aria-hidden="true">${escapeHtml(initialsFor(post.title))}</div>`;
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
      padding: 64px;
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
      padding-bottom: 28px;
    }
    .brand img {
      width: 360px;
      height: auto;
      display: block;
    }
    .tag {
      color: ${accent};
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .project-strip {
      position: relative;
      z-index: 1;
      margin-top: 32px;
      min-height: 142px;
      display: grid;
      gap: 28px;
      align-items: center;
      padding: 24px 28px;
      border: 2px solid rgba(19,38,74,.10);
      border-radius: 20px;
      background: rgba(255,255,255,.86);
    }
    .project-strip.has-project-mark {
      grid-template-columns: 292px minmax(0, 1fr);
    }
    .project-strip.has-project-preview {
      grid-template-columns: 342px minmax(0, 1fr);
    }
    .project-strip.has-client-initials {
      grid-template-columns: 128px minmax(0, 1fr);
    }
    .project-mark {
      height: 112px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 24px;
      background: ${hasProjectMark ? '#111827' : '#ffffff'};
      border: 1px solid ${hasProjectMark ? 'rgba(240,162,59,.42)' : 'rgba(19,38,74,.10)'};
      box-shadow: ${hasProjectMark ? '0 18px 36px rgba(15,23,42,.16)' : 'none'};
      overflow: hidden;
    }
    .project-mark.has-project-mark {
      width: 260px;
    }
    .project-mark.has-project-preview {
      width: 312px;
      height: 112px;
      background: #ffffff;
      border-color: rgba(19,38,74,.12);
      box-shadow: 0 18px 36px rgba(15,23,42,.12);
    }
    .project-mark.has-client-initials {
      width: 98px;
      height: 98px;
      border-radius: 22px;
    }
    .client-logo {
      max-width: 226px;
      max-height: 82px;
      display: block;
      object-fit: contain;
    }
    .has-project-preview .client-logo {
      width: 312px;
      height: 112px;
      max-width: 312px;
      max-height: 112px;
      object-fit: cover;
      object-position: left top;
    }
    .client-initials {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: ${navy};
      color: #fff;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0;
    }
    .method-checklist {
      width: 64px;
      display: grid;
      gap: 10px;
    }
    .method-checklist span {
      position: relative;
      display: block;
      height: 10px;
      border-radius: 999px;
      background: ${navy};
    }
    .method-checklist span::before {
      content: "";
      position: absolute;
      left: -18px;
      top: -4px;
      width: 13px;
      height: 20px;
      border-right: 5px solid ${accent};
      border-bottom: 5px solid ${accent};
      transform: rotate(40deg);
      border-radius: 2px;
    }
    .project-proof-label {
      margin: 0 0 8px;
      color: ${accent};
      font-size: 19px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .02em;
    }
    .project-proof-text {
      margin: 0;
      color: ${navy};
      font-size: 30px;
      line-height: 1.22;
      font-weight: 900;
      overflow-wrap: anywhere;
    }
    .main {
      position: relative;
      z-index: 1;
      padding-top: 50px;
      max-width: 920px;
    }
    h1 {
      margin: 0;
      color: ${navy};
      font-size: 84px;
      line-height: 0.98;
      font-weight: 900;
      letter-spacing: 0;
      max-width: 910px;
    }
    .title-long h1 {
      font-size: 70px;
      max-width: 920px;
    }
    .title-long h2,
    .title-long .body {
      max-width: 900px;
    }
    h2 {
      margin: 28px 0 0;
      color: #374151;
      font-size: 34px;
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: 0;
    }
    .body {
      margin-top: 36px;
      max-width: 900px;
      color: #1f2937;
      font-size: 32px;
      line-height: 1.32;
      font-weight: 650;
    }
    .proof {
      position: absolute;
      left: 64px;
      right: 64px;
      bottom: 58px;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 26px;
      align-items: center;
      padding-top: 30px;
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
      width: 18px;
      height: 1080px;
      background: ${accent};
    }
  </style>
</head>
<body>
  <main class="card${titleClass}">
    <div class="stripe"></div>
    <section class="brand">
      <img src="${logoDataUri}" alt="Cantoni Digital Studio">
      <div class="tag">${escapeHtml(post.type)}</div>
    </section>
    <section class="project-strip ${markMode}" aria-label="${escapeHtml(proofLabel)}">
      <div class="project-mark ${markMode}">${markHtml}</div>
      <div>
        <p class="project-proof-label">${escapeHtml(proofLabel)}</p>
        <p class="project-proof-text">${escapeHtml(proofText)}</p>
      </div>
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
  const logoDataUri = await readDataUri(logoFile);
  const projectMarks = await readProjectMarks();
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
    for (const post of posts) {
      await page.setContent(htmlFor(post, logoDataUri, projectMarks), { waitUntil: 'load' });
      const pngPath = path.join(outDir, `${post.id}.png`);
      const htmlPath = path.join(outDir, `${post.id}.html`);
      await fs.writeFile(htmlPath, htmlFor(post, logoDataUri, projectMarks), 'utf8');
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
