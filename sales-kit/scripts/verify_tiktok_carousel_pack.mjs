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
const requestedEntry = process.env.SOCIAL_CAROUSEL_ENTRY || process.env.SOCIAL_SHORT_ENTRY || '';

function fail(message) {
  console.error(message);
  process.exit(1);
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
  return {
    width: Number(stdout.match(/pixelWidth:\s*(\d+)/)?.[1] || 0),
    height: Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1] || 0)
  };
}

function romeDateIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

async function resolveEntryId() {
  if (requestedEntry) return requestedEntry;

  const entries = await fs.readdir(packDir, { withFileTypes: true });
  const carouselEntries = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(packDir, entry.name, 'tiktok-carousel', 'manifest.json');
    if (await exists(manifestPath)) carouselEntries.push(entry.name);
  }

  const today = romeDateIso();
  const todayEntries = carouselEntries.filter((entry) => entry.startsWith(today));
  if (todayEntries.length) return todayEntries.sort().at(-1);
  if (carouselEntries.length) return carouselEntries.sort().at(-1);

  fail(`No TikTok carousel manifests found in ${packDir}`);
}

async function run() {
  const entryId = await resolveEntryId();
  const outDir = path.join(packDir, entryId, 'tiktok-carousel');
  const manifestFile = path.join(outDir, 'manifest.json');

  if (!(await exists(manifestFile))) fail(`Missing carousel manifest: ${manifestFile}`);

  const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
  const failures = [];

  if (manifest.entry !== entryId) failures.push('entry_mismatch');
  if (manifest.type !== 'tiktok_image_carousel') failures.push('type_must_be_tiktok_image_carousel');
  if (manifest.status !== 'review_required_before_upload') failures.push('status_must_remain_review_required');
  if (!Array.isArray(manifest.slides)) failures.push('slides_missing');
  if ((manifest.slides || []).length < 3) failures.push('min_3_slides_required');
  if ((manifest.slides || []).length > 10) failures.push('max_10_slides_required');

  for (const slide of manifest.slides || []) {
    const slidePath = path.resolve(projectDir, slide.path || '');
    if (!(await exists(slidePath))) {
      failures.push(`missing_${slide.path}`);
      continue;
    }
    const size = await imageSize(slidePath);
    if (size.width !== 1080 || size.height !== 1920) failures.push(`${slide.file}_${size.width}x${size.height}`);
  }

  const reviewFile = path.join(outDir, 'review.html');
  if (!(await exists(reviewFile))) failures.push('review_missing');

  const output = {
    ok: failures.length === 0,
    entry: entryId,
    manifest: manifestFile,
    slide_count: manifest.slides?.length || 0,
    review: reviewFile,
    failures
  };

  console.log(JSON.stringify(output, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
