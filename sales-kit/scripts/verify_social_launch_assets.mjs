import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const launchDir = path.join(rootDir, 'social-launch');
const postsFile = path.join(launchDir, 'posts.json');
const outputDir = path.join(launchDir, 'output');
const profileCopyFile = path.join(launchDir, 'social-profile-copy.md');
const runbookFile = path.join(launchDir, 'launch-runbook.md');
const ipadRunbookFile = path.join(rootDir, 'ipad-wireless-fallback-runbook.md');
const facebookCoverFile = path.join(outputDir, 'facebook-cover-cantoni.png');

const forbiddenFragments = [
  '/Volumes/',
  '/Users/',
  'placeholder',
  'lorem',
  'migliori al mondo',
  'best in the world'
];

function readPngSize(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error('not a png file');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function assertTextClean(label, value) {
  const text = String(value || '');
  if (!text.trim()) {
    throw new Error(`${label} is empty`);
  }
  for (const fragment of forbiddenFragments) {
    if (text.toLowerCase().includes(fragment.toLowerCase())) {
      throw new Error(`${label} contains forbidden fragment: ${fragment}`);
    }
  }
}

async function assertFileContains(file, fragments) {
  const text = await fs.readFile(file, 'utf8');
  for (const fragment of fragments) {
    if (!text.includes(fragment)) {
      throw new Error(`${path.basename(file)} missing: ${fragment}`);
    }
  }
  assertTextClean(path.basename(file), text);
}

async function run() {
  const posts = JSON.parse(await fs.readFile(postsFile, 'utf8'));
  if (!Array.isArray(posts) || posts.length < 5) {
    throw new Error('posts.json must contain at least five launch posts');
  }

  const ids = new Set();
  for (const post of posts) {
    const required = ['id', 'type', 'title', 'subtitle', 'proof', 'body', 'caption_it', 'cta'];
    for (const key of required) {
      assertTextClean(`${post.id || 'post'}.${key}`, post[key]);
    }
    if (ids.has(post.id)) {
      throw new Error(`duplicate post id: ${post.id}`);
    }
    ids.add(post.id);

    const pngPath = path.join(outputDir, `${post.id}.png`);
    const png = await fs.readFile(pngPath);
    const { width, height } = readPngSize(png);
    if (width !== 1080 || height !== 1080) {
      throw new Error(`${post.id}.png has ${width}x${height}, expected 1080x1080`);
    }
    if (png.length < 120_000) {
      throw new Error(`${post.id}.png is unexpectedly small`);
    }
  }

  const facebookCover = await fs.readFile(facebookCoverFile);
  const facebookCoverSize = readPngSize(facebookCover);
  if (facebookCoverSize.width !== 1640 || facebookCoverSize.height !== 624) {
    throw new Error(`facebook-cover-cantoni.png has ${facebookCoverSize.width}x${facebookCoverSize.height}, expected 1640x624`);
  }
  if (facebookCover.length < 180_000) {
    throw new Error('facebook-cover-cantoni.png is unexpectedly small');
  }

  await assertFileContains(profileCopyFile, [
    '@cantonidigitalstudio',
    'cantonidigitalstudio@gmail.com',
    'https://cantonidigitalstudio.com',
    'Facebook is accepted as a standalone proof link',
    'Do not use TikTok as a standalone proof link'
  ]);
  await assertFileContains(runbookFile, [
    'Instagram handle exists',
    'Facebook Page exists',
    'TikTok profile exists',
    'iPad wireless fallback is enabled and verified',
    'zumu.be/ecantoni',
    'Facebook logged-out QA',
    'TikTok logged-out QA',
    'Browser QA Gate'
  ]);
  await assertFileContains(ipadRunbookFile, [
    'CoreDevice transport after USB removal: `localNetwork`',
    'Developer Mode: `enabled`',
    '`idevice_id -n` lists `00008103-001E45811133001E`',
    'Instagram (`com.burbn.instagram`) on this iPad',
    'xcrun devicectl device info displays'
  ]);

  console.log(JSON.stringify({
    ok: true,
    posts: posts.length,
    output_dir: outputDir
  }, null, 2));
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
