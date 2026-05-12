import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const postsFile = path.join(rootDir, 'social-launch/posts.json');
const sourceDir = path.join(rootDir, 'social-launch/output');
const packDir = path.join(rootDir, 'social-launch/publish-pack');

function cleanText(value) {
  return String(value || '').trim();
}

function buildCaption(post, index) {
  const tags = [
    '#CantoniDigitalStudio',
    '#SitiWeb',
    '#Ecommerce',
    '#WebApp',
    '#App',
    '#AutomazioniAI',
    '#VisibilitaAI'
  ];
  return [
    cleanText(post.caption_it),
    '',
    index <= 3
      ? 'Portfolio reale, progetto pubblico e metodo operativo scritto.'
      : 'Metodo: audit reale, scope scritto, QA e percorso commerciale chiaro.',
    '',
    tags.join(' ')
  ].join('\n');
}

async function run() {
  const posts = JSON.parse(await fs.readFile(postsFile, 'utf8'));
  await fs.rm(packDir, { recursive: true, force: true });
  await fs.mkdir(packDir, { recursive: true });

  const manifestLines = [
    '# Cantoni Digital Studio - Social Publish Pack',
    '',
    'Pacchetto pronto per pubblicazione manuale. Non pubblicare senza review finale.',
    '',
    '## Ordine consigliato',
    ''
  ];

  for (const [index, post] of posts.entries()) {
    const n = String(index + 1).padStart(2, '0');
    const base = `${n}-${post.id}`;
    const sourcePng = path.join(sourceDir, `${post.id}.png`);
    const targetPng = path.join(packDir, `${base}.png`);
    const targetCaption = path.join(packDir, `${base}.caption.txt`);
    const caption = buildCaption(post, index + 1);

    await fs.copyFile(sourcePng, targetPng);
    await fs.writeFile(targetCaption, `${caption}\n`, 'utf8');
    manifestLines.push(`${index + 1}. ${post.title}`);
    manifestLines.push(`   - immagine: \`${base}.png\``);
    manifestLines.push(`   - caption: \`${base}.caption.txt\``);
  }

  manifestLines.push('');
  manifestLines.push('## Regole');
  manifestLines.push('');
  manifestLines.push('- Pubblicare prima tre contenuti portfolio, poi metodo e servizi.');
  manifestLines.push('- Non modificare link o claim senza verificare il sito pubblico citato.');
  manifestLines.push('- Facebook e TikTok sono brandizzati; usarli come prova pubblica solo dopo logged-out QA finale.');
  manifestLines.push("- Usare Instagram solo dopo login sull'account `@cantonidigitalstudio`.");

  await fs.writeFile(path.join(packDir, 'manifest.md'), `${manifestLines.join('\n')}\n`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    posts: posts.length,
    output_dir: packDir
  }, null, 2));
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
