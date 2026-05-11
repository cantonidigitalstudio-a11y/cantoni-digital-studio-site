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

  await assertFileContains(profileCopyFile, [
    '@cantonidigitalstudio',
    'cantonidigitalstudio@gmail.com',
    'https://cantonidigitalstudio.com',
    'Do not publish Facebook/TikTok links'
  ]);
  await assertFileContains(runbookFile, [
    'Instagram handle exists',
    'Facebook Page is not created/public yet',
    'TikTok login/signup remains blocked',
    'Browser QA Gate'
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
