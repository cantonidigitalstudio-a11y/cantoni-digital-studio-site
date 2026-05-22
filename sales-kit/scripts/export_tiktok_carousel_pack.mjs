import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectDir = path.resolve(rootDir, '..');
const packDir = path.join(rootDir, 'social-launch/daily-publish-pack');
const entryId = process.env.SOCIAL_CAROUSEL_ENTRY || process.env.SOCIAL_SHORT_ENTRY || '2026-05-21-2026-05-21-audit-before-price';
const entryDir = path.join(packDir, entryId);
const shortDir = path.join(entryDir, 'short-video');
const outDir = path.join(entryDir, 'tiktok-carousel');
const logoPath = path.join(projectDir, 'assets/logo/generated/cantoni_primary_horizontal_email.png');
const iconPath = path.join(projectDir, 'assets/logo/cantoni_icona_quadrata.png');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function wrapText(value, maxChars = 22, maxLines = 4) {
  const words = clean(value).split(' ').filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/[.,;:!?]+$/, '')}...`;
  return clipped;
}

function textLines(lines, { x, y, size, fill, weight = 900, lineGap = 1.08, anchor = 'start' }) {
  return lines.map((line, index) =>
    `<text x="${x}" y="${y + index * size * lineGap}" text-anchor="${anchor}" fill="${fill}" font-family="Helvetica Neue, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`
  ).join('\n');
}

async function dataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const data = await fs.readFile(filePath);
  return `data:${mime};base64,${data.toString('base64')}`;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function imageSize(filePath) {
  const { stdout } = await execFileAsync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath], {
    maxBuffer: 1024 * 1024
  });
  const width = Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1] || 0);
  const height = Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1] || 0);
  return { width, height };
}

async function writeSvgSlide(svg, targetPng) {
  const targetSvg = targetPng.replace(/\.png$/, '.svg');
  await fs.writeFile(targetSvg, svg, 'utf8');
  await execFileAsync('sips', ['-s', 'format', 'png', targetSvg, '--out', targetPng], {
    maxBuffer: 1024 * 1024 * 4
  });
}

function bulletRows(items, { x = 104, y = 660, width = 872, fill = '#ffffff', ink = '#10254a', accent = '#eca03c' }) {
  return items.map((item, index) => {
    const rowY = y + index * 148;
    return `<rect x="${x}" y="${rowY}" width="${width}" height="112" rx="32" fill="${fill}" opacity=".98"/>
      <circle cx="${x + 58}" cy="${rowY + 56}" r="25" fill="${accent}"/>
      <path d="M${x + 46} ${rowY + 56}l9 10 19-24" fill="none" stroke="#10254a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${x + 104}" y="${rowY + 68}" fill="${ink}" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="900">${escapeXml(item)}</text>`;
  }).join('\n');
}

function auditCarouselSvg({ logo, icon, kicker, title, subtitle, bullets = [], closing, variant = 'dark' }) {
  const dark = variant === 'dark';
  const bg = dark ? '#10254a' : '#f5f7fb';
  const fg = dark ? '#ffffff' : '#10254a';
  const muted = dark ? '#c8d4e8' : '#65728b';
  const accent = '#eca03c';
  const cardFill = dark ? '#ffffff' : '#ffffff';
  const headerLogo = dark
    ? `<rect x="70" y="68" width="590" height="176" rx="38" fill="#ffffff"/><image href="${logo}" x="98" y="93" width="520" height="126" preserveAspectRatio="xMinYMid meet"/>`
    : `<image href="${logo}" x="72" y="84" width="560" height="138" preserveAspectRatio="xMinYMid meet"/>`;
  const bulletBlock = bullets.length
    ? bulletRows(bullets, { fill: cardFill, ink: '#10254a', accent, y: title.length > 42 ? 760 : 700 })
    : '';
  const closingBlock = closing
    ? `<rect x="84" y="1356" width="912" height="242" rx="42" fill="${dark ? '#ffffff' : '#10254a'}"/>
       <image href="${icon}" x="122" y="1418" width="92" height="92" preserveAspectRatio="xMidYMid meet"/>
       ${textLines(wrapText(closing, 28, 3), { x: 240, y: 1450, size: 40, fill: dark ? '#10254a' : '#ffffff', weight: 900, lineGap: 1.12 })}`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <radialGradient id="glow" cx="84%" cy="14%" r="56%">
      <stop offset="0" stop-color="${accent}" stop-opacity="${dark ? '.22' : '.16'}"/>
      <stop offset=".52" stop-color="${accent}" stop-opacity=".05"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="${bg}"/>
  <rect width="1080" height="1920" fill="url(#glow)"/>
  <path d="M0 0h1080v22H0z" fill="${accent}"/>
  <circle cx="910" cy="245" r="260" fill="${dark ? '#1c3b6c' : '#ffffff'}" opacity=".42"/>
  ${headerLogo}
  <text x="88" y="358" fill="${accent}" font-family="Helvetica Neue, Arial, sans-serif" font-size="32" font-weight="900" letter-spacing="8">${escapeXml(kicker)}</text>
  ${textLines(wrapText(title, 18, 4), { x: 88, y: 475, size: 82, fill: fg, weight: 900, lineGap: 1.04 })}
  ${subtitle ? textLines(wrapText(subtitle, 30, 3), { x: 88, y: 695, size: 38, fill: muted, weight: 800, lineGap: 1.14 }) : ''}
  ${bulletBlock}
  ${closingBlock}
  <text x="88" y="1792" fill="${accent}" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="900">cantonidigitalstudio.com</text>
  <text x="88" y="1842" fill="${muted}" font-family="Helvetica Neue, Arial, sans-serif" font-size="25" font-weight="800">@cantonidigitalstudio</text>
</svg>`;
}

async function renderAuditCarousel() {
  const [logo, icon] = await Promise.all([dataUri(logoPath), dataUri(iconPath)]);
  const specs = [
    {
      kicker: 'METODO CANTONI',
      title: 'Prima si capisce. Poi si quota.',
      subtitle: 'Un prezzo senza contesto non aiuta il cliente e non protegge il progetto.',
      closing: 'Preventivi dopo audit, non promesse al buio.',
      variant: 'dark'
    },
    {
      kicker: 'AUDIT REALE',
      title: 'Cosa controlliamo prima',
      bullets: ['sito e mobile', 'contatti e richiesta', 'Google Maps e recensioni', 'social, competitor e ricerche'],
      variant: 'light'
    },
    {
      kicker: 'SOLUZIONE GIUSTA',
      title: 'Non serve sempre la stessa cosa',
      bullets: ['sito professionale', 'e-commerce', 'web app o gestionale', 'app mobile e automazioni AI'],
      variant: 'dark'
    },
    {
      kicker: 'PROPOSTA CHIARA',
      title: 'Cosa deve uscire dal preventivo',
      bullets: ['perimetro scritto', 'tempi realistici', 'pagamenti e priorita', 'crescita dopo il lancio'],
      variant: 'light'
    },
    {
      kicker: 'PROSSIMO PASSO',
      title: 'Ti diciamo cosa serve davvero.',
      subtitle: 'Poi costruiamo il percorso digitale: sito, e-commerce, web app, app o crescita continuativa.',
      closing: 'Cantoni Digital Studio: audit, sviluppo e miglioramento continuo.',
      variant: 'dark'
    }
  ];

  const slides = [];
  for (let index = 0; index < specs.length; index += 1) {
    const file = `slide-${String(index + 1).padStart(2, '0')}.png`;
    const target = path.join(outDir, file);
    await writeSvgSlide(auditCarouselSvg({ logo, icon, ...specs[index] }), target);
    slides.push(file);
  }
  return slides;
}

async function carouselSlides() {
  if (entryId.includes('audit-before-price')) {
    return renderAuditCarousel();
  }
  if (!(await exists(shortDir))) {
    throw new Error(`Missing short-video slides directory: ${shortDir}. Run SOCIAL_SHORT_ENTRY=${entryId} npm run build:social:short first.`);
  }
  const files = (await fs.readdir(shortDir))
    .filter((file) => /^slide-\d+\.png$/.test(file))
    .sort();
  if (files.length < 3) {
    throw new Error(`TikTok carousel needs at least 3 slides; found ${files.length} in ${shortDir}`);
  }
  return files;
}

function reviewHtml({ entryId, slides, caption }) {
  const cards = slides.map((slide, index) => `
    <article class="slide">
      <p>Slide ${index + 1}</p>
      <img src="./${escapeHtml(slide)}" alt="TikTok carousel slide ${index + 1}">
    </article>`).join('\n');
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TikTok carousel review - ${escapeHtml(entryId)}</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314284b'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' fill='white' font-family='Arial'%3EC%3C/text%3E%3C/svg%3E">
  <style>
    :root {
      color: #10254a;
      background: #eef3f8;
      font-family: Arial, Helvetica, sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; }
    main { max-width: 1180px; margin: 0 auto; }
    header { margin: 0 0 22px; }
    h1 { margin: 0 0 8px; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1; letter-spacing: 0; }
    .note { max-width: 860px; color: #5d6b84; font-size: 16px; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; align-items: start; }
    .slide, .caption {
      background: #fff;
      border: 1px solid #dbe4f0;
      border-radius: 10px;
      padding: 12px;
      box-shadow: 0 14px 36px rgba(16, 37, 74, .12);
    }
    .slide p { margin: 0 0 10px; font-weight: 900; color: #e99c36; text-transform: uppercase; letter-spacing: .08em; }
    img { display: block; width: 100%; height: auto; border-radius: 8px; background: #10254a; }
    .caption { margin-top: 22px; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 15px; line-height: 1.48; color: #10254a; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>TikTok carousel review</h1>
      <p class="note">Versione consigliata per contenuti da leggere: immagini separate 1080x1920, musica scelta dentro TikTok, caption sotto. Non pubblicare senza approvazione esplicita.</p>
    </header>
    <section class="grid" aria-label="Slide carousel TikTok">
      ${cards}
    </section>
    <section class="caption">
      <h2>Caption TikTok</h2>
      <pre>${escapeHtml(caption)}</pre>
    </section>
  </main>
</body>
</html>`;
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const generatedAuditCarousel = entryId.includes('audit-before-price');
  const slideFiles = await carouselSlides();
  const copiedSlides = [];
  const failures = [];

  for (const file of slideFiles) {
    const source = path.join(generatedAuditCarousel ? outDir : shortDir, file);
    const target = path.join(outDir, file);
    if (source !== target) await fs.copyFile(source, target);
    const size = await imageSize(target);
    if (size.width !== 1080 || size.height !== 1920) failures.push(`${file}_${size.width}x${size.height}`);
    copiedSlides.push({
      file,
      path: path.relative(projectDir, target),
      ...size
    });
  }

  const captionFile = path.join(entryDir, 'tiktok.caption.txt');
  const caption = (await exists(captionFile))
    ? await fs.readFile(captionFile, 'utf8')
    : '';

  const manifest = {
    ok: failures.length === 0,
    entry: entryId,
    type: 'tiktok_image_carousel',
    output_dir: path.relative(projectDir, outDir),
    slides: copiedSlides,
    caption: path.relative(projectDir, captionFile),
    music: 'choose_trending_sound_inside_tiktok_before_publish',
    status: 'review_required_before_upload',
    failures
  };

  await fs.writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(outDir, 'review.html'), reviewHtml({
    entryId,
    slides: copiedSlides.map((slide) => slide.file),
    caption
  }), 'utf8');
  await fs.writeFile(path.join(outDir, 'README.md'), [
    `# TikTok carousel - ${entryId}`,
    '',
    'Uso consigliato:',
    '',
    '1. Apri l\'app TikTok mobile. Il web uploader/TikTok Studio puo accettare solo video in alcune sessioni.',
    '2. Crea un post foto/carousel e carica le slide PNG in ordine.',
    '3. Scegli una canzone/trend direttamente dentro TikTok.',
    '4. Incolla `tiktok.caption.txt`.',
    '5. Pubblica solo dopo approvazione esplicita.',
    '',
    'Nota: questa versione sostituisce il video MP4 quando il contenuto deve essere letto con calma.'
  ].join('\n') + '\n', 'utf8');

  console.log(JSON.stringify(manifest, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
