import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const postsFile = path.join(rootDir, 'social-launch/posts.json');
const packDir = path.join(rootDir, 'social-launch/publish-pack');
const manifestFile = path.join(packDir, 'manifest.md');

async function fileExists(file) {
  try {
    const stat = await fs.stat(file);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function extractPackReferences(manifest) {
  const matches = manifest.matchAll(/`([^`]+?\.(?:png|caption\.txt))`/g);
  return Array.from(matches, (match) => match[1]);
}

async function run() {
  const failures = [];
  const posts = JSON.parse(await fs.readFile(postsFile, 'utf8'));
  const manifest = await fs.readFile(manifestFile, 'utf8');
  const referenced = extractPackReferences(manifest);

  for (const [index, post] of posts.entries()) {
    const n = String(index + 1).padStart(2, '0');
    const base = `${n}-${post.id}`;
    const expectedPng = `${base}.png`;
    const expectedCaption = `${base}.caption.txt`;

    for (const file of [expectedPng, expectedCaption]) {
      const absolute = path.join(packDir, file);
      if (!(await fileExists(absolute))) {
        failures.push(`${file}: missing or empty publish-pack artifact`);
      }
      if (!referenced.includes(file)) {
        failures.push(`${file}: missing from publish-pack manifest`);
      }
    }

    const captionPath = path.join(packDir, expectedCaption);
    if (await fileExists(captionPath)) {
      const caption = await fs.readFile(captionPath, 'utf8');
      if (/undefined|null|\[object Object\]/i.test(caption)) {
        failures.push(`${expectedCaption}: contains generated placeholder text`);
      }
      if (!caption.includes('#CantoniDigitalStudio')) {
        failures.push(`${expectedCaption}: missing Cantoni hashtag block`);
      }
    }
  }

  for (const file of referenced) {
    if (!(await fileExists(path.join(packDir, file)))) {
      failures.push(`${file}: referenced by manifest but missing from publish pack`);
    }
  }

  console.log(JSON.stringify({
    ok: failures.length === 0,
    posts: posts.length,
    referenced: referenced.length,
    failures
  }, null, 2));

  if (failures.length > 0) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
