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
const defaultEntry = '2026-05-18-2026-05-18-excellentia-vip';
const entryId = process.env.SOCIAL_SHORT_ENTRY || defaultEntry;
const entryDir = path.join(packDir, entryId);
const outDir = path.join(entryDir, 'short-video');

const logoPath = path.join(projectDir, 'assets/logo/generated/cantoni_primary_horizontal_email.png');
const iconPath = path.join(projectDir, 'assets/logo/cantoni_icona_quadrata.png');
const portfolioAssetDir = path.join(projectDir, 'assets/portfolio');
const ffmpegBin = process.env.FFMPEG_BIN || '/opt/homebrew/bin/ffmpeg';
const ffprobeBin = process.env.FFPROBE_BIN || '/opt/homebrew/bin/ffprobe';

const CLIENT_CASES = [
  {
    match: 'ec8-platform',
    name: 'EC8 Platform',
    label: 'CLIENTE / PROGETTO',
    proof: 'ec8platform.com',
    accent: '#d7ad5a',
    logoPath: path.join(portfolioAssetDir, 'ec8/logo-ec8.png'),
    wordmarkPath: path.join(portfolioAssetDir, 'ec8/logo-ec8-wordmark-email.png'),
    chips: ['Sito pubblico', 'App Store', 'Play Store', 'Pagamenti']
  }
];

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

function wrapText(value, maxChars = 26, maxLines = 4) {
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

function textBlock(lines, { x, y, size = 58, weight = 800, fill = '#10254a', lineGap = 1.16 }) {
  return lines.map((line, index) =>
    `<text x="${x}" y="${y + index * size * lineGap}" fill="${fill}" font-family="Helvetica Neue, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`
  ).join('\n');
}

async function dataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const data = await fs.readFile(filePath);
  return `data:${mime};base64,${data.toString('base64')}`;
}

async function maybeDataUri(filePath) {
  try {
    await fs.access(filePath);
    return dataUri(filePath);
  } catch {
    return null;
  }
}

function clientForEntry(id) {
  return CLIENT_CASES.find((client) => id.includes(client.match)) || null;
}

async function firstPng(dir) {
  const files = await fs.readdir(dir);
  const pngs = files.filter((file) => file.endsWith('.png')).sort();
  if (!pngs.length) throw new Error(`No PNG asset found in ${dir}`);
  return path.join(dir, pngs[0]);
}

function parseTikTokScript(script) {
  const hook = script.match(/^Hook:\s*(.+)$/m)?.[1] || 'Un progetto digitale deve rendere chiaro il prossimo passo.';
  const caption = script.match(/^Caption:\s*(.+)$/m)?.[1] || '';
  const scenes = [...script.matchAll(/^\d+\.\s*(.+)$/gm)].map((match) => match[1]);
  return { hook: clean(hook), caption: clean(caption), scenes };
}

function pillRow(items, { x, y, fill = '#ffffff', stroke = '#d7ad5a', textFill = '#10254a' }) {
  let cursor = x;
  return items.map((item) => {
    const width = Math.max(150, item.length * 17 + 46);
    const pill = `<rect x="${cursor}" y="${y}" width="${width}" height="56" rx="28" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <text x="${cursor + 23}" y="${y + 36}" fill="${textFill}" font-family="Helvetica Neue, Arial, sans-serif" font-size="23" font-weight="800">${escapeXml(item)}</text>`;
    cursor += width + 16;
    return pill;
  }).join('\n');
}

function ec8CaseStudySvg({ logo, icon, mainImage, client, clientLogo, clientWordmark, title, kicker, body, footer, layout = 'hero' }) {
  const navy = '#0b1b37';
  const navy2 = '#102b55';
  const ink = '#10254a';
  const muted = '#64718a';
  const gold = client?.accent || '#d7ad5a';
  const header = `
    <rect x="70" y="58" width="430" height="132" rx="30" fill="#ffffff" opacity=".98"/>
    <image href="${logo}" x="93" y="77" width="380" height="98" preserveAspectRatio="xMinYMid meet"/>
    <rect x="548" y="58" width="462" height="132" rx="30" fill="#081326" stroke="${gold}" stroke-width="2"/>
    <text x="582" y="101" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="22" font-weight="900" letter-spacing="4">${escapeXml(client?.label || 'PROGETTO')}</text>
    ${clientWordmark ? `<image href="${clientWordmark}" x="582" y="113" width="356" height="60" preserveAspectRatio="xMinYMid meet"/>` : `<text x="582" y="154" fill="#ffffff" font-family="Helvetica Neue, Arial, sans-serif" font-size="42" font-weight="900">${escapeXml(client?.name || '')}</text>`}
  `;
  const proofStrip = `
    <rect x="74" y="1650" width="932" height="118" rx="34" fill="#ffffff" opacity=".96"/>
    <image href="${icon}" x="104" y="1680" width="62" height="62" preserveAspectRatio="xMidYMid meet"/>
    <text x="186" y="1693" fill="${ink}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="900">Cantoni Digital Studio</text>
    <text x="186" y="1732" fill="${muted}" font-family="Helvetica Neue, Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(footer)}</text>
    <text x="74" y="1844" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="29" font-weight="900">cantonidigitalstudio.com</text>
    <text x="706" y="1844" fill="#b9c5d8" font-family="Helvetica Neue, Arial, sans-serif" font-size="23" font-weight="800">${escapeXml(client?.proof || '')}</text>
  `;

  let content = '';
  if (layout === 'compare') {
    content = `
      <text x="76" y="306" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="31" font-weight="900" letter-spacing="7">${escapeXml(kicker)}</text>
      ${textBlock(wrapText(title, 18, 3), { x: 76, y: 410, size: 74, fill: '#ffffff', weight: 900, lineGap: 1.08 })}
      <rect x="76" y="675" width="928" height="208" rx="38" fill="#ffffff"/>
      <text x="122" y="744" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="900">SITO</text>
      <text x="122" y="802" fill="${ink}" font-family="Helvetica Neue, Arial, sans-serif" font-size="40" font-weight="900">Presenta e fa capire.</text>
      <text x="122" y="850" fill="${muted}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="700">Servizi, prova, contatto, fiducia.</text>
      <rect x="76" y="925" width="928" height="208" rx="38" fill="#ffffff"/>
      <text x="122" y="994" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="900">WEB APP</text>
      <text x="122" y="1052" fill="${ink}" font-family="Helvetica Neue, Arial, sans-serif" font-size="40" font-weight="900">Gestisce processi.</text>
      <text x="122" y="1100" fill="${muted}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="700">Accessi, dashboard, dati, pagamenti.</text>
      <rect x="76" y="1175" width="928" height="208" rx="38" fill="#ffffff"/>
      <text x="122" y="1244" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="900">APP</text>
      <text x="122" y="1302" fill="${ink}" font-family="Helvetica Neue, Arial, sans-serif" font-size="40" font-weight="900">Entra nel telefono.</text>
      <text x="122" y="1350" fill="${muted}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="700">Notifiche, abitudine, esperienza nativa.</text>
      ${textBlock(wrapText(body, 36, 2), { x: 76, y: 1484, size: 34, fill: '#dbe4f2', weight: 800, lineGap: 1.15 })}
    `;
  } else if (layout === 'proof') {
    content = `
      <text x="76" y="306" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="31" font-weight="900" letter-spacing="7">${escapeXml(kicker)}</text>
      ${textBlock(wrapText(title, 19, 3), { x: 76, y: 410, size: 76, fill: '#ffffff', weight: 900, lineGap: 1.08 })}
      <rect x="76" y="650" width="928" height="650" rx="46" fill="#ffffff"/>
      <rect x="118" y="696" width="844" height="132" rx="34" fill="#081326"/>
      ${clientLogo ? `<image href="${clientLogo}" x="136" y="716" width="92" height="92" preserveAspectRatio="xMidYMid meet"/>` : ''}
      <text x="252" y="751" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="24" font-weight="900" letter-spacing="4">PROVA PUBBLICA</text>
      <text x="252" y="798" fill="#ffffff" font-family="Helvetica Neue, Arial, sans-serif" font-size="40" font-weight="900">${escapeXml(client?.proof || 'link verificabile')}</text>
      <image href="${mainImage}" x="136" y="860" width="808" height="360" preserveAspectRatio="xMidYMid meet"/>
      ${textBlock(wrapText(body, 34, 2), { x: 118, y: 1388, size: 35, fill: '#dbe4f2', weight: 800, lineGap: 1.15 })}
      ${pillRow(client?.chips || [], { x: 76, y: 1450, fill: '#10254a', stroke: gold, textFill: '#ffffff' })}
    `;
  } else if (layout === 'method') {
    content = `
      <text x="76" y="306" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="31" font-weight="900" letter-spacing="7">${escapeXml(kicker)}</text>
      ${textBlock(wrapText(title, 18, 3), { x: 76, y: 410, size: 76, fill: '#ffffff', weight: 900, lineGap: 1.08 })}
      ${textBlock(wrapText(body, 35, 2), { x: 76, y: 644, size: 36, fill: '#dbe4f2', weight: 800, lineGap: 1.15 })}
      ${['Audit reale', 'Architettura', 'Sviluppo', 'Crescita'].map((step, index) => {
        const y = 745 + index * 170;
        return `<rect x="76" y="${y}" width="928" height="126" rx="36" fill="#ffffff" opacity=".98"/>
        <circle cx="142" cy="${y + 63}" r="36" fill="${gold}"/>
        <text x="128" y="${y + 77}" fill="#081326" font-family="Helvetica Neue, Arial, sans-serif" font-size="36" font-weight="900">${index + 1}</text>
        <text x="204" y="${y + 54}" fill="${ink}" font-family="Helvetica Neue, Arial, sans-serif" font-size="38" font-weight="900">${escapeXml(step)}</text>
        <text x="204" y="${y + 95}" fill="${muted}" font-family="Helvetica Neue, Arial, sans-serif" font-size="24" font-weight="700">${escapeXml([
          'Capire obiettivo, clienti e vincoli.',
          'Scegliere sito, web app o app senza confusione.',
          'Pagamenti, contenuti, UX e dati in un sistema.',
          'Migliorare nel tempo con prove e risultati.'
        ][index])}</text>`;
      }).join('\n')}
    `;
  } else {
    content = `
      <text x="76" y="306" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="31" font-weight="900" letter-spacing="7">${escapeXml(kicker)}</text>
      ${textBlock(wrapText(title, 18, 4), { x: 76, y: 425, size: 76, fill: '#ffffff', weight: 900, lineGap: 1.08 })}
      ${textBlock(wrapText(body, 34, 2), { x: 76, y: 768, size: 38, fill: '#dbe4f2', weight: 800, lineGap: 1.15 })}
      <rect x="76" y="884" width="928" height="468" rx="50" fill="#ffffff"/>
      ${clientLogo ? `<image href="${clientLogo}" x="132" y="940" width="178" height="178" preserveAspectRatio="xMidYMid meet"/>` : ''}
      <text x="344" y="988" fill="${gold}" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" font-weight="900" letter-spacing="4">CASE STUDY</text>
      <text x="344" y="1060" fill="${ink}" font-family="Helvetica Neue, Arial, sans-serif" font-size="58" font-weight="900">${escapeXml(client?.name || '')}</text>
      <text x="344" y="1120" fill="${muted}" font-family="Helvetica Neue, Arial, sans-serif" font-size="31" font-weight="800">Piattaforma, contenuti, pagamenti e app.</text>
      ${pillRow((client?.chips || []).slice(0, 3), { x: 132, y: 1235, fill: '#f5f7fb', stroke: '#dfe7f0', textFill: ink })}
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${navy}"/>
      <stop offset=".58" stop-color="${navy2}"/>
      <stop offset="1" stop-color="#07101f"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="20%" r="55%">
      <stop offset="0" stop-color="${gold}" stop-opacity=".26"/>
      <stop offset=".45" stop-color="${gold}" stop-opacity=".08"/>
      <stop offset="1" stop-color="${gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <rect width="1080" height="1920" fill="url(#glow)"/>
  <path d="M0 0h1080v24H0z" fill="${gold}"/>
  <path d="M0 0h510l-42 24H0z" fill="#f2c56f" opacity=".9"/>
  <circle cx="930" cy="310" r="245" fill="#ffffff" opacity=".05"/>
  ${header}
  ${content}
  ${proofStrip}
</svg>`;
}

function slideSvg({ logo, icon, mainImage, title, kicker, body, footer, variant = 'dark' }) {
  const isDark = variant === 'dark';
  const bg = isDark ? '#10254a' : '#f6f8fb';
  const fg = isDark ? '#ffffff' : '#10254a';
  const muted = isDark ? '#cdd7e8' : '#5b6882';
  const orange = '#eca03c';
  const imageY = body ? 850 : 760;
  const imageHeight = body ? 560 : 644;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="${bg}"/>
  <rect x="0" y="0" width="1080" height="18" fill="${orange}"/>
  <circle cx="900" cy="235" r="250" fill="${isDark ? '#173562' : '#ffffff'}" opacity=".42"/>
  ${isDark ? '<rect x="70" y="62" width="570" height="170" rx="34" fill="#ffffff" opacity=".97"/>' : ''}
  <image href="${logo}" x="88" y="86" width="510" height="165" preserveAspectRatio="xMinYMid meet"/>
  <text x="88" y="335" fill="${orange}" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="7">${escapeXml(kicker)}</text>
  ${textBlock(wrapText(title, 19, 4), { x: 88, y: 450, size: 78, fill: fg, weight: 900, lineGap: 1.08 })}
  ${body ? textBlock(wrapText(body, 31, 4), { x: 88, y: 710, size: 40, fill: muted, weight: 700, lineGap: 1.16 }) : ''}
  <rect x="88" y="${imageY}" width="904" height="${imageHeight + 56}" rx="42" fill="${isDark ? '#ffffff' : '#ffffff'}" opacity="${isDark ? '.98' : '1'}"/>
  <image href="${mainImage}" x="116" y="${imageY + 28}" width="848" height="${imageHeight}" preserveAspectRatio="xMidYMid meet"/>
  <rect x="88" y="1548" width="904" height="2" fill="${isDark ? '#294776' : '#d8e1ef'}"/>
  <image href="${icon}" x="88" y="1608" width="96" height="96" preserveAspectRatio="xMidYMid meet"/>
  ${textBlock(wrapText(footer, 29, 3), { x: 210, y: 1645, size: 42, fill: fg, weight: 800, lineGap: 1.18 })}
  <text x="88" y="1822" fill="${orange}" font-family="Helvetica Neue, Arial, sans-serif" font-size="31" font-weight="900">cantonidigitalstudio.com</text>
</svg>`;
}

async function writeSlide(svg, targetSvg, targetPng) {
  await fs.writeFile(targetSvg, svg, 'utf8');
  await execFileAsync('sips', ['-s', 'format', 'png', targetSvg, '--out', targetPng], { maxBuffer: 1024 * 1024 * 4 });
}

async function renderVideo(slides) {
  const listFile = path.join(outDir, 'ffmpeg-list.txt');
  const lines = [];
  for (const slide of slides) {
    lines.push(`file '${slide.png.replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${slide.duration}`);
  }
  lines.push(`file '${slides.at(-1).png.replace(/'/g, "'\\''")}'`);
  await fs.writeFile(listFile, `${lines.join('\n')}\n`, 'utf8');

  const output = path.join(outDir, `${entryId}-short.mp4`);
  await execFileAsync(ffmpegBin, [
    '-y',
    '-hide_banner',
    '-loglevel', 'error',
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-f', 'lavfi',
    '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-vf', 'fps=30,format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-c:a', 'aac',
    '-shortest',
    '-movflags', '+faststart',
    output
  ], { maxBuffer: 1024 * 1024 * 8 });

  const probe = await execFileAsync(ffprobeBin, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,duration',
    '-of', 'json',
    output
  ], { maxBuffer: 1024 * 1024 });

  return { output, probe: JSON.parse(probe.stdout) };
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const mainAsset = await firstPng(entryDir);
  const client = clientForEntry(entryId);
  const [logo, icon, mainImage, tikTokScript, clientLogo, clientWordmark] = await Promise.all([
    dataUri(logoPath),
    dataUri(iconPath),
    dataUri(mainAsset),
    fs.readFile(path.join(entryDir, 'tiktok.script.txt'), 'utf8'),
    client?.logoPath ? maybeDataUri(client.logoPath) : null,
    client?.wordmarkPath ? maybeDataUri(client.wordmarkPath) : null
  ]);
  const parsed = parseTikTokScript(tikTokScript);
  const isExcellentia = entryId.includes('excellentia');
  const isDestinationCocoa = entryId.includes('destination-cocoa');
  const isEc8Platform = entryId.includes('ec8-platform');
  const isServicesPost = entryId.includes('services') || entryId.includes('servizi') || entryId.includes('ecommerce') || entryId.includes('mobile-first') || entryId.includes('payments-login') || entryId.includes('dashboard-admin') || entryId.includes('automation-ai');
  const isMethodPost = entryId.includes('audit') || entryId.includes('perimetro') || entryId.includes('quote') || entryId.includes('quality') || entryId.includes('lead-quality');
  const publicReference = isExcellentia
    ? 'excellentiavip.com'
    : isDestinationCocoa
      ? 'destination-cocoa-site.netlify.app'
      : isEc8Platform
        ? 'ec8platform.com'
        : 'cantonidigitalstudio.com';
  const footerReference = isExcellentia
    ? 'Excellentia VIP: prova pubblica, non grafica generica.'
    : isDestinationCocoa
      ? 'Destination Cocoa: prenotazioni, servizi e percorso operativo.'
      : isEc8Platform
        ? 'EC8 Platform: sito, app e sistema verificabile.'
        : isServicesPost
          ? 'Siti, e-commerce, web app, app e crescita digitale.'
          : isMethodPost
            ? 'Metodo Cantoni: audit reale e perimetro scritto.'
            : 'Cantoni Digital Studio: lavoro verificabile e perimetro chiaro.';
  const firstKicker = isExcellentia || isDestinationCocoa
    ? 'PORTFOLIO REALE'
    : isServicesPost
      ? 'SERVIZI CANTONI'
      : isMethodPost
        ? 'METODO CANTONI'
        : 'CANTONI DIGITAL STUDIO';
  const title = isExcellentia
    ? 'Un sito luxury deve vendere fiducia'
    : parsed.hook;
  const sceneOne = parsed.scenes[0] || 'Mostra il progetto reale';
  const sceneTwo = parsed.scenes[1] || 'Spiega il problema in parole semplici';
  const sceneThree = parsed.scenes[2] || 'Chiudi con un prossimo passo chiaro';

  const slideSpecs = isEc8Platform ? [
    {
      kicker: 'PORTFOLIO REALE',
      title: 'Un progetto vero: sito, piattaforma e app pubblicata',
      body: 'EC8 diventa una prova concreta di cosa sappiamo costruire.',
      footer: 'Caso reale, non mockup: progetto verificabile online.',
      layout: 'hero',
      duration: 3.1
    },
    {
      kicker: 'CHIAREZZA',
      title: parsed.hook,
      body: 'Ogni scelta cambia costo, tempi e risultato.',
      footer: 'La soluzione giusta dipende dal lavoro reale.',
      layout: 'compare',
      duration: 3.5
    },
    {
      kicker: 'PROVA PUBBLICA',
      title: 'Il cliente vede un sistema, non una promessa',
      body: 'Sito pubblico, percorso digitale, pagamenti e app distribuita.',
      footer: 'EC8 Platform come proof Cantoni.',
      layout: 'proof',
      duration: 3.5
    },
    {
      kicker: 'METODO CANTONI',
      title: 'Prima capiamo, poi costruiamo',
      body: sceneThree.replace(/^Chiudi con:\s*/i, ''),
      footer: 'Audit, perimetro, sviluppo e crescita.',
      layout: 'method',
      duration: 3.3
    },
    {
      kicker: 'PROSSIMO PASSO',
      title: 'Ti diciamo cosa serve davvero, senza proporti soluzioni inutili',
      body: `Riferimento: ${publicReference}`,
      footer: 'Siti, e-commerce, web app, app e automazioni AI.',
      layout: 'hero',
      duration: 3.4
    }
  ] : [
    {
      kicker: firstKicker,
      title,
      body: '',
      footer: footerReference,
      variant: 'dark',
      duration: 2.8
    },
    {
      kicker: isServicesPost ? 'SCELTA GIUSTA' : 'COSA DEVE FARE',
      title: isServicesPost ? 'Capire se serve sito, e-commerce, web app o app' : 'Rendere chiari valore, servizi e richiesta',
      body: sceneTwo.replace(/^Spiega:\s*/i, ''),
      footer: 'Da telefono il cliente deve capire e chiedere senza confusione.',
      variant: 'light',
      duration: 3.2
    },
    {
      kicker: 'METODO CANTONI',
      title: 'Prima audit, poi struttura',
      body: sceneThree.replace(/^Chiudi con:\s*/i, ''),
      footer: 'Siti, e-commerce, web app, app e crescita digitale.',
      variant: 'dark',
      duration: 3.1
    },
    {
      kicker: 'PROSSIMO PASSO',
      title: 'Guardiamo il progetto e diciamo cosa serve davvero',
      body: isServicesPost ? `Partenza: ${publicReference}` : `Riferimento pubblico: ${publicReference}`,
      footer: 'Cantoni Digital Studio',
      variant: 'light',
      duration: 3.4
    }
  ];

  const slides = [];
  for (let index = 0; index < slideSpecs.length; index += 1) {
    const spec = slideSpecs[index];
    const base = `slide-${String(index + 1).padStart(2, '0')}`;
    const svgFile = path.join(outDir, `${base}.svg`);
    const pngFile = path.join(outDir, `${base}.png`);
    const svg = isEc8Platform
      ? ec8CaseStudySvg({ logo, icon, mainImage, client, clientLogo, clientWordmark, ...spec })
      : slideSvg({ logo, icon, mainImage, ...spec });
    await writeSlide(svg, svgFile, pngFile);
    slides.push({ png: pngFile, duration: spec.duration });
  }
  await fs.copyFile(slides[0].png, path.join(outDir, 'poster.png'));
  const rendered = await renderVideo(slides);
  const manifest = {
    ok: true,
    entry: entryId,
    source_asset: path.relative(projectDir, mainAsset),
    output_mp4: path.relative(projectDir, rendered.output),
    poster: path.relative(projectDir, path.join(outDir, 'poster.png')),
    width: rendered.probe.streams?.[0]?.width,
    height: rendered.probe.streams?.[0]?.height,
    duration_seconds: Number(rendered.probe.streams?.[0]?.duration || 0),
    client_logo: client?.logoPath ? path.relative(projectDir, client.logoPath) : null,
    client_wordmark: client?.wordmarkPath ? path.relative(projectDir, client.wordmarkPath) : null,
    status: 'review_required_before_upload'
  };
  await fs.writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(outDir, 'README.md'), [
    `# Short video asset - ${entryId}`,
    '',
    'Asset verticale preparato per TikTok / YouTube Shorts.',
    '',
    `- MP4: \`${manifest.output_mp4}\``,
    `- Poster: \`${manifest.poster}\``,
    `- Dimensioni: ${manifest.width}x${manifest.height}`,
    `- Durata: ${manifest.duration_seconds.toFixed(2)}s`,
    '- Stato: review richiesta prima dell upload pubblico.',
    '',
    'Non pubblicare se non e stato rivisto su telefono e se il canale social non e autenticato con identita Cantoni Digital Studio.'
  ].join('\n') + '\n', 'utf8');
  console.log(JSON.stringify(manifest, null, 2));
}

run().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
