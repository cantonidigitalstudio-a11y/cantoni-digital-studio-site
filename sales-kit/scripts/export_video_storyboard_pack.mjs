import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const registryFile = path.join(rootDir, 'social-launch/portfolio-content-registry.json');
const outputDir = path.join(rootDir, 'social-launch/video-storyboard-pack');

function clean(value) {
  return String(value || '').trim();
}

function slug(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function serviceLine(project) {
  return project.services_to_show.map((service) => `\`${service}\``).join(', ');
}

function storyboard(project) {
  const safeAssets = project.safe_assets.length
    ? project.safe_assets.map((asset) => `- ${asset}`).join('\n')
    : '- Asset discovery richiesta prima di produrre video.';

  return `# ${project.name} - Video storyboard

Status: ${project.publish_status}
Reference: ${project.public_reference || 'Da verificare prima della pubblicazione'}
Format: ${project.video_format}

## Perche pubblicarlo

${project.proof_angle}

Servizi da far capire: ${serviceLine(project)}.

## Reel / TikTok / Shorts

Hook:
Non e solo un progetto bello da vedere: qui c'e un problema commerciale risolto.

Scene:

1. Logo Cantoni + nome progetto.
2. Schermata reale o asset principale.
3. Problema spiegato in parole semplici.
4. Cosa abbiamo costruito o come abbiamo ragionato.
5. Chiusura: "Prima guardiamo il progetto, poi ti diciamo cosa serve davvero."

Testo su schermo:

- Progetto reale
- Problema chiaro
- Soluzione costruita
- Sito, e-commerce, web app, app o crescita digitale

Voiceover breve:

"Questo e ${project.name}. Lo usiamo come prova per spiegare un punto: ${project.proof_angle}. Un progetto digitale non deve solo esistere online. Deve rendere piu chiaro cosa vendi, aumentare fiducia e aiutare le persone a fare il passo giusto."

Caption:

"${project.name}: ${project.proof_angle}. Cantoni Digital Studio lavora su siti, e-commerce, web app, app, automazioni AI e crescita digitale con audit reale prima della proposta."

## Asset sicuri

${safeAssets}

## Da evitare

${project.avoid.map((item) => `- ${item}`).join('\n')}

## QA prima della pubblicazione

- [ ] Asset reale e leggibile da telefono.
- [ ] Nessun dato privato o admin.
- [ ] Nessun claim non verificabile.
- [ ] Il video non sembra stock o AI generico.
- [ ] Lingua naturale per il mercato scelto.
- [ ] Pubblicazione approvata esplicitamente.
`;
}

function htmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function previewCard(project, markdown) {
  return `<article>
    <p class="status">${htmlEscape(project.publish_status)} · ${htmlEscape(project.category)}</p>
    <h2>${htmlEscape(project.name)}</h2>
    <p>${htmlEscape(project.proof_angle)}</p>
    <p><strong>Servizi:</strong> ${htmlEscape(project.services_to_show.join(', '))}</p>
    <pre>${htmlEscape(markdown)}</pre>
  </article>`;
}

async function run() {
  const registry = JSON.parse(await fs.readFile(registryFile, 'utf8'));
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const manifest = ['# Video Storyboard Pack', '', 'Nessun video va pubblicato senza review finale.', ''];
  const cards = [];
  for (const project of registry.projects) {
    const markdown = storyboard(project);
    const filename = `${slug(project.id)}.md`;
    await fs.writeFile(path.join(outputDir, filename), markdown, 'utf8');
    manifest.push(`- ${project.name}: \`${filename}\` (${project.publish_status})`);
    cards.push(previewCard(project, markdown));
  }
  await fs.writeFile(path.join(outputDir, 'manifest.md'), `${manifest.join('\n')}\n`, 'utf8');
  await fs.writeFile(path.join(outputDir, 'index.html'), `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cantoni Video Storyboard Pack</title>
  <style>
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:#13254a; background:#f6f8fb; }
    main { max-width:1120px; margin:0 auto; padding:32px 20px 60px; }
    h1 { font-size:clamp(2.2rem, 5vw, 4.4rem); line-height:.95; margin:0 0 12px; letter-spacing:0; }
    .lead { color:#52627a; font-size:1.08rem; line-height:1.55; margin:0 0 24px; }
    article { background:#fff; border:1px solid #dbe3ef; border-radius:8px; padding:20px; margin:0 0 18px; }
    h2 { margin:0 0 8px; font-size:1.8rem; }
    .status { margin:0 0 8px; text-transform:uppercase; letter-spacing:.08em; font-weight:800; color:#6b7890; font-size:.8rem; }
    pre { white-space:pre-wrap; word-break:break-word; background:#f2f5f9; border:1px solid #dbe3ef; border-radius:8px; padding:14px; overflow:auto; color:#172d50; line-height:1.45; }
  </style>
</head>
<body>
  <main>
    <h1>Video Storyboard Pack</h1>
    <p class="lead">Storyboard per Reel, TikTok e YouTube Shorts basati su progetti reali. Uso operativo: controllare proof, asset, privacy e naturalezza prima di creare o pubblicare video.</p>
    ${cards.join('\n')}
  </main>
</body>
</html>
`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    projects: registry.projects.length,
    output_dir: outputDir
  }, null, 2));
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
