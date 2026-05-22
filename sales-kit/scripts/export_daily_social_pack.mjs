import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const calendarFile = path.join(rootDir, 'social-launch/daily-calendar-2026-05-18.json');
const languageFile = path.join(rootDir, 'social-launch/global-language-rotation.json');
const sourceDir = path.join(rootDir, 'social-launch/output');
const packDir = path.join(rootDir, 'social-launch/daily-publish-pack');

const PLATFORM_TAGS = {
  instagram: ['#CantoniDigitalStudio', '#SitiWeb', '#Ecommerce', '#WebApp', '#App', '#AutomazioniAI'],
  facebook: ['Cantoni Digital Studio', 'siti web', 'e-commerce', 'web app', 'app'],
  tiktok: ['#cantonidigitalstudio', '#sitiweb', '#ecommerce', '#webapp', '#app', '#automazioniai'],
  youtube: ['#CantoniDigitalStudio', '#SitiWeb', '#Ecommerce', '#App', '#DigitalGrowth']
};
const CONTACT_URL = 'https://cantonidigitalstudio.com/preventivo';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function cleanText(value) {
  return String(value || '').replace(/\s+\n/g, '\n').trim();
}

function localizeProof(value) {
  return cleanText(value)
    .replace(/\bReference pubblica\b/g, 'Riferimento pubblico')
    .replace(/\bReference verificabile\b/g, 'Riferimento verificabile')
    .replace(/\bReference\b/g, 'Riferimento');
}

function stripProofPrefix(value) {
  return localizeProof(value)
    .replace(/^(?:Riferimento(?:\s+(?:pubblico|verificabile|operativo))?|Perimetro|Approccio):\s*/i, '')
    .trim();
}

function proofLine(label, value) {
  const proof = stripProofPrefix(value);
  return proof ? `${label}: ${proof}` : '';
}

function proofLabelFor(entry, fallback = 'Riferimento pubblico') {
  if (entry.pillar === 'method') return 'Approccio';
  if (entry.pillar === 'services' || entry.pillar === 'education') return 'Perimetro';
  return fallback;
}

function contactLine(label = 'Audit e contatto') {
  return `${label}: ${CONTACT_URL}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function indentBlock(value, spaces = 4) {
  const prefix = ' '.repeat(spaces);
  return String(value || '')
    .trim()
    .split('\n')
    .map((line) => (line.trim() ? `${prefix}${line.trimEnd()}` : ''))
    .join('\n');
}

function textForInstagram(entry) {
  const proofLabel = proofLabelFor(entry, 'Prova pubblica');
  return [
    localizeProof(entry.instagram),
    '',
    proofLine(proofLabel, entry.proof),
    contactLine(),
    '',
    PLATFORM_TAGS.instagram.join(' ')
  ].join('\n');
}

function textForFacebook(entry) {
  const proofLabel = proofLabelFor(entry, 'Riferimento pubblico');
  return [
    localizeProof(entry.facebook),
    '',
    proofLine(proofLabel, entry.proof),
    contactLine(),
    '',
    'Per una proposta seria: audit reale, perimetro scritto del lavoro e prossimo passo chiaro.'
  ].join('\n');
}

function textForTikTok(entry) {
  return [
    `Hook: ${cleanText(entry.tiktok.hook)}`,
    '',
    'Scene:',
    ...entry.tiktok.scenes.map((scene, index) => `${index + 1}. ${cleanText(scene)}`),
    '',
    `Caption: ${localizeProof(entry.tiktok.caption)}`,
    '',
    PLATFORM_TAGS.tiktok.join(' ')
  ].join('\n');
}

function textForTikTokCaption(entry) {
  return [
    localizeProof(entry.tiktok.caption),
    '',
    'Metodo Cantoni: prima audit reale, poi proposta chiara.',
    `Link: ${CONTACT_URL}`,
    '',
    PLATFORM_TAGS.tiktok.join(' ')
  ].join('\n');
}

function weekdayForDate(date) {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

function languagePlanForEntry(entry, rotation) {
  if (entry.language_override?.primary_locale && entry.language_override?.secondary_locale) {
    return {
      primary_locale: entry.language_override.primary_locale,
      secondary_locale: entry.language_override.secondary_locale,
      theme: entry.language_override.theme || entry.pillar || 'content adaptation'
    };
  }
  const weekday = weekdayForDate(entry.date);
  return rotation.weekly_rotation.find((item) => item.weekday === weekday) || rotation.weekly_rotation[0];
}

function marketByLocale(rotation, locale) {
  return rotation.markets.find((market) => market.locale === locale);
}

function textForLanguagePlan(entry, rotation) {
  const plan = languagePlanForEntry(entry, rotation);
  const primary = marketByLocale(rotation, plan.primary_locale);
  const secondary = marketByLocale(rotation, plan.secondary_locale);
  return [
    `# Language plan - ${entry.date}`,
    '',
    `Tema: ${cleanText(plan.theme)}`,
    `Lingua principale: ${plan.primary_locale} - ${primary?.label || 'mercato principale'}`,
    `Lingua secondaria: ${plan.secondary_locale} - ${secondary?.label || 'mercato secondario'}`,
    '',
    'Adattamento:',
    `- Angolo principale: ${primary?.angle || 'messaggio Cantoni adattato al mercato'}.`,
    `- Angolo secondario: ${secondary?.angle || 'versione breve di supporto'}.`,
    '- Non tradurre parola per parola: mantenere lo stesso obiettivo ma usare esempi naturali per il mercato.',
    '- Valuta solo se il post parla di offerta approvata; per contenuti pubblici ordinari evitare prezzi.',
    '',
    'Check:',
    '- [ ] Il testo è comprensibile a un cliente non tecnico.',
    '- [ ] La lingua principale è naturale, non tradotta meccanicamente.',
    '- [ ] La seconda lingua non contraddice il messaggio principale.',
    '- [ ] Nessuna promessa assoluta o risultato non verificabile.'
  ].join('\n');
}

function textForYoutubeShort(entry, rotation) {
  const plan = languagePlanForEntry(entry, rotation);
  const proofLabel = proofLabelFor(entry, 'Link');
  return [
    `Title: ${cleanText(entry.title)} | Cantoni Digital Studio`,
    '',
    `Primary language: ${plan.primary_locale}`,
    `Secondary adaptation: ${plan.secondary_locale}`,
    '',
    `Opening: ${cleanText(entry.tiktok.hook)}`,
    '',
    'Short structure:',
    ...entry.tiktok.scenes.map((scene, index) => `${index + 1}. ${cleanText(scene)}`),
    '',
    `Description: ${localizeProof(entry.tiktok.caption)} ${proofLine(proofLabel, entry.proof)} ${CONTACT_URL}`.trim(),
    '',
    PLATFORM_TAGS.youtube.join(' ')
  ].join('\n');
}

function textForYoutubeShortCaption(entry) {
  const proofLabel = proofLabelFor(entry, 'Link');
  return [
    `${cleanText(entry.title)} | Cantoni Digital Studio`,
    '',
    `${localizeProof(entry.tiktok.caption)} ${proofLine(proofLabel, entry.proof)} ${CONTACT_URL}`.trim(),
    '',
    PLATFORM_TAGS.youtube.join(' ')
  ].join('\n');
}

function htmlForDailyReview(entry, relativeAsset, assetVersion) {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Review social - ${escapeHtml(entry.title)}</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314284b'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' fill='white' font-family='Arial'%3EC%3C/text%3E%3C/svg%3E">
  <style>
    :root {
      color: #14233f;
      background: #eef3f8;
      font-family: Arial, Helvetica, sans-serif;
    }
    body {
      margin: 0;
      padding: 32px;
    }
    main {
      max-width: 980px;
      margin: 0 auto;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
      line-height: 1.2;
    }
    p {
      margin: 0 0 18px;
      color: #53627a;
      font-size: 15px;
      line-height: 1.45;
    }
    .asset {
      padding: 16px;
      background: #fff;
      border: 1px solid #d9e1ec;
      border-radius: 12px;
      box-shadow: 0 16px 44px rgba(20, 35, 63, 0.16);
    }
    img {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(entry.title)} - review visuale social</h1>
    <p>Pack del ${escapeHtml(entry.date)}. Controllo layout, leggibilita, proof pubblico e assenza di sovrapposizioni prima di qualsiasi pubblicazione.</p>
    <div class="asset">
      <img src="./${escapeHtml(path.basename(relativeAsset))}?v=${escapeHtml(assetVersion)}" alt="Asset social ${escapeHtml(entry.title)}">
    </div>
  </main>
</body>
</html>`;
}

async function copyAsset(entry, dir) {
  const source = path.join(sourceDir, `${entry.asset_id}.png`);
  const target = path.join(dir, `${entry.date}-${entry.id}.png`);
  const buffer = await fs.readFile(source);
  await fs.writeFile(target, buffer);
  return {
    target,
    version: crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12)
  };
}

async function run() {
  const calendar = JSON.parse(await fs.readFile(calendarFile, 'utf8'));
  const rotation = JSON.parse(await fs.readFile(languageFile, 'utf8'));
  await fs.mkdir(packDir, { recursive: true });

  const manifest = [
    '# Cantoni Digital Studio - Daily Social Publish Pack',
    '',
    `Calendario: ${calendar.start_date}, timezone ${calendar.timezone}.`,
    '',
    'Pacchetto pronto per pubblicazione manuale. Non pubblicare senza review finale su ogni piattaforma.',
    ''
  ];
  const previewCards = [];

  for (const entry of calendar.entries) {
    const dayDir = path.join(packDir, `${entry.date}-${entry.id}`);
    await fs.mkdir(dayDir, { recursive: true });
    const { target: asset, version: assetVersion } = await copyAsset(entry, dayDir);
    const relativeAsset = path.relative(packDir, asset);
    const languagePlan = textForLanguagePlan(entry, rotation);
    const youtubeShort = textForYoutubeShort(entry, rotation);
    const youtubeShortCaption = textForYoutubeShortCaption(entry);
    await fs.writeFile(path.join(dayDir, 'instagram.caption.txt'), `${textForInstagram(entry)}\n`, 'utf8');
    await fs.writeFile(path.join(dayDir, 'facebook.caption.txt'), `${textForFacebook(entry)}\n`, 'utf8');
    await fs.writeFile(path.join(dayDir, 'tiktok.script.txt'), `${textForTikTok(entry)}\n`, 'utf8');
    await fs.writeFile(path.join(dayDir, 'tiktok.caption.txt'), `${textForTikTokCaption(entry)}\n`, 'utf8');
    await fs.writeFile(path.join(dayDir, 'youtube-shorts.script.txt'), `${youtubeShort}\n`, 'utf8');
    await fs.writeFile(path.join(dayDir, 'youtube-shorts.caption.txt'), `${youtubeShortCaption}\n`, 'utf8');
    await fs.writeFile(path.join(dayDir, 'language-plan.md'), `${languagePlan}\n`, 'utf8');
    await fs.writeFile(path.join(dayDir, 'approval-checklist.md'), [
      `# ${entry.date} - ${entry.title}`,
      '',
      '- [ ] Immagine leggibile su telefono.',
      '- [ ] Caption coerente con la piattaforma.',
      '- [ ] Lingua e mercato adattati in modo naturale.',
      '- [ ] Script YouTube Shorts pronto solo se il video è stato rivisto.',
      '- [ ] Nessun prezzo pubblico.',
      '- [ ] Nessuna promessa assoluta.',
      '- [ ] Prova pubblica/link verificabile se citato.',
      '- [ ] Pubblicazione approvata esplicitamente.'
    ].join('\n') + '\n', 'utf8');
    await fs.writeFile(path.join(dayDir, 'review.html'), htmlForDailyReview(entry, relativeAsset, assetVersion), 'utf8');
    manifest.push(`- ${entry.date}: ${entry.title}`);
    manifest.push(`  - asset: \`${relativeAsset}\``);
    manifest.push(`  - Instagram: \`${entry.date}-${entry.id}/instagram.caption.txt\``);
    manifest.push(`  - Facebook: \`${entry.date}-${entry.id}/facebook.caption.txt\``);
    manifest.push(`  - TikTok: \`${entry.date}-${entry.id}/tiktok.script.txt\``);
    manifest.push(`  - TikTok caption: \`${entry.date}-${entry.id}/tiktok.caption.txt\``);
    manifest.push(`  - YouTube Shorts: \`${entry.date}-${entry.id}/youtube-shorts.script.txt\``);
    manifest.push(`  - YouTube Shorts caption: \`${entry.date}-${entry.id}/youtube-shorts.caption.txt\``);
    manifest.push(`  - Lingue: \`${entry.date}-${entry.id}/language-plan.md\``);
    previewCards.push(`
      <article class="day-card">
        <header>
          <p class="date">${escapeHtml(entry.date)} · ${escapeHtml(entry.pillar)}</p>
          <h2>${escapeHtml(entry.title)}</h2>
          <p class="proof">${escapeHtml(localizeProof(entry.proof))}</p>
        </header>
        <img src="${escapeHtml(relativeAsset)}" alt="${escapeHtml(entry.title)}" loading="lazy">
        <section class="grid">
          <div><h3>Instagram</h3><p>${escapeHtml(entry.instagram)}</p></div>
          <div><h3>Facebook</h3><p>${escapeHtml(entry.facebook)}</p></div>
          <div><h3>TikTok</h3><pre>${escapeHtml(textForTikTok(entry))}</pre></div>
          <div><h3>YouTube Shorts</h3><pre>${escapeHtml(youtubeShort)}</pre></div>
          <div class="wide"><h3>Lingue / Mercati</h3><pre>${escapeHtml(languagePlan)}</pre></div>
        </section>
      </article>`);
  }

  await fs.writeFile(path.join(packDir, 'manifest.md'), `${manifest.join('\n')}\n`, 'utf8');
  await fs.writeFile(path.join(packDir, 'index.html'), `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cantoni Digital Studio - Revisione contenuti social</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; --ink:#13284b; --muted:#62708a; --line:#dce3ee; --soft:#f5f7fb; --accent:#f2a43a; }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); background: #fff; }
    .page { max-width: 1180px; margin: 0 auto; padding: 32px 20px 64px; }
    .top { margin-bottom: 28px; border-bottom: 1px solid var(--line); padding-bottom: 18px; }
    h1 { margin: 0 0 8px; font-size: clamp(2rem, 5vw, 4rem); line-height: 0.95; letter-spacing: 0; }
    .top p, .proof, .date { color: var(--muted); }
    .day-card { border: 1px solid var(--line); border-radius: 8px; padding: 22px; margin: 0 0 22px; background: #fff; }
    .day-card header { margin-bottom: 16px; }
    .date { margin: 0 0 8px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    h2 { margin: 0 0 8px; font-size: clamp(1.45rem, 3vw, 2.3rem); line-height: 1.05; }
    .proof { margin: 0; }
    img { display: block; width: min(100%, 560px); border-radius: 8px; border: 1px solid var(--line); background: var(--soft); margin: 0 0 18px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .grid > div { background: var(--soft); border: 1px solid var(--line); border-radius: 8px; padding: 14px; min-width: 0; }
    .wide { grid-column: 1 / -1; }
    h3 { margin: 0 0 8px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; }
    p, pre { font-size: 0.98rem; line-height: 1.5; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .badge { display: inline-flex; border: 1px solid var(--accent); color: var(--ink); border-radius: 999px; padding: 6px 10px; font-weight: 800; margin-top: 10px; }
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } .day-card { padding: 16px; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="top">
      <h1>Revisione contenuti social</h1>
      <p>Instagram, Facebook, TikTok e YouTube Shorts. Questa pagina serve per controllare testi, immagini e script prima della pubblicazione; nessun contenuto va pubblicato senza approvazione esplicita.</p>
      <span class="badge">${calendar.entries.length} giorni · ${calendar.channels.join(' / ')}</span>
    </section>
${indentBlock(previewCards.join('\n'), 4)}
  </main>
</body>
</html>
`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    days: calendar.entries.length,
    output_dir: packDir
  }, null, 2));
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
