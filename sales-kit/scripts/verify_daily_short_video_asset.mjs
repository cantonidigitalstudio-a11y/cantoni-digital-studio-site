import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packDir = path.join(rootDir, 'social-launch/daily-publish-pack');
const entryId = process.env.SOCIAL_SHORT_ENTRY || '2026-05-18-2026-05-18-excellentia-vip';
const outDir = path.join(packDir, entryId, 'short-video');
const manifestFile = path.join(outDir, 'manifest.json');
const ffprobeBin = process.env.FFPROBE_BIN || '/opt/homebrew/bin/ffprobe';

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

async function run() {
  if (!(await exists(manifestFile))) fail(`Missing short video manifest: ${manifestFile}`);
  const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
  const videoFile = path.resolve(rootDir, '..', manifest.output_mp4 || '');
  const posterFile = path.resolve(rootDir, '..', manifest.poster || '');
  const failures = [];

  if (!(await exists(videoFile))) failures.push('video_missing');
  if (!(await exists(posterFile))) failures.push('poster_missing');
  if (manifest.status !== 'review_required_before_upload') failures.push('status_must_remain_review_required');

  let probe = { streams: [] };
  if (await exists(videoFile)) {
    const result = await execFileAsync(ffprobeBin, [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,duration',
      '-of', 'json',
      videoFile
    ], { maxBuffer: 1024 * 1024 });
    probe = JSON.parse(result.stdout);
    const stream = probe.streams?.[0] || {};
    const duration = Number(stream.duration || 0);
    if (stream.width !== 1080) failures.push(`width_${stream.width}`);
    if (stream.height !== 1920) failures.push(`height_${stream.height}`);
    if (duration < 8 || duration > 25) failures.push(`duration_${duration}`);
  }

  const output = {
    ok: failures.length === 0,
    entry: entryId,
    manifest: manifestFile,
    video: videoFile,
    poster: posterFile,
    stream: probe.streams?.[0] || null,
    failures
  };
  console.log(JSON.stringify(output, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
