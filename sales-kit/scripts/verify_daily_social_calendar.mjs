import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const calendarFile = path.join(rootDir, 'social-launch/daily-calendar-2026-05-18.json');
const languageFile = path.join(rootDir, 'social-launch/global-language-rotation.json');
const packDir = path.join(rootDir, 'social-launch/daily-publish-pack');

const forbiddenPatterns = [
  /\bplaceholder\b/i,
  /\blorem\b/i,
  /migliori al mondo/i,
  /best in the world/i,
  /\bgarantito\b/i,
  /\bguaranteed\b/i,
  /€/,
  /\b(eur|euro|usd|dollari)\b/i,
  /\bcta\b/i,
  /\bhero\b/i
];

const packForbiddenPatterns = [
  /Prova\/metodo:\s*Riferimento/i,
  /Riferimento operativo:\s*Riferimento/i,
  /Riferimento pubblico:\s*Riferimento pubblico/i,
  /Link:\s*Riferimento/i,
  /\b(?:credibilita|visibilita|qualita|velocita|priorita|perche)\b/i,
  /\b(?:Il testo e|lingua principale e|video e stato)\b/i
];

const requiredTopics = [
  ['portfolio', 'Excellentia VIP'],
  ['portfolio', 'Mr Collins Travel'],
  ['portfolio', 'EC8 Platform'],
  ['services', 'e-commerce'],
  ['services', 'app'],
  ['growth', 'AI'],
  ['method', 'audit'],
  ['sales', 'pagamento']
];

function normalize(value) {
  return String(value || '').toLowerCase();
}

function assertNonEmpty(label, value, failures) {
  const text = String(value || '').trim();
  if (!text) failures.push(`${label}: empty`);
}

function assertClean(label, value, failures, minLength = 40) {
  const text = String(value || '').trim();
  if (!text) failures.push(`${label}: empty`);
  if (text.length < minLength) failures.push(`${label}: too short`);
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) failures.push(`${label}: forbidden pattern "${pattern}"`);
  }
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function assertPublishPackFileClean(file, label, failures) {
  const text = await fs.readFile(file, 'utf8');
  assertClean(label, text, failures, 30);
  for (const pattern of packForbiddenPatterns) {
    if (pattern.test(text)) failures.push(`${label}: duplicated proof label "${pattern}"`);
  }
}

async function run() {
  const failures = [];
  const calendar = JSON.parse(await fs.readFile(calendarFile, 'utf8'));
  const languageRotation = JSON.parse(await fs.readFile(languageFile, 'utf8'));

  if (calendar.approval_required !== true) failures.push('calendar.approval_required must be true');
  if (!Array.isArray(calendar.channels) || !['instagram', 'facebook', 'tiktok', 'youtube_shorts'].every((channel) => calendar.channels.includes(channel))) {
    failures.push('calendar.channels must include instagram, facebook, tiktok and youtube_shorts');
  }
  if (!Array.isArray(calendar.entries) || calendar.entries.length < 30) failures.push('calendar must contain at least 30 daily entries');
  if (languageRotation.approval_required !== true) failures.push('languageRotation.approval_required must be true');
  if (!Array.isArray(languageRotation.markets) || languageRotation.markets.length < 6) failures.push('languageRotation.markets must contain at least 6 markets');
  if (!Array.isArray(languageRotation.weekly_rotation) || languageRotation.weekly_rotation.length !== 7) failures.push('languageRotation.weekly_rotation must contain 7 days');
  const locales = new Set((languageRotation.markets || []).map((market) => market.locale));
  for (const [index, day] of (languageRotation.weekly_rotation || []).entries()) {
    if (!locales.has(day.primary_locale)) failures.push(`languageRotation.weekly_rotation[${index}]: unknown primary locale ${day.primary_locale}`);
    if (!locales.has(day.secondary_locale)) failures.push(`languageRotation.weekly_rotation[${index}]: unknown secondary locale ${day.secondary_locale}`);
    assertClean(`languageRotation.weekly_rotation[${index}].theme`, day.theme, failures, 15);
  }

  const ids = new Set();
  const allTextParts = [];
  for (const [index, entry] of (calendar.entries || []).entries()) {
    const prefix = `entries[${index}]`;
    const expectedDate = addDays(calendar.start_date, index);
    if (entry.date !== expectedDate) failures.push(`${prefix}: expected date ${expectedDate}, got ${entry.date}`);
    if (ids.has(entry.id)) failures.push(`${prefix}: duplicate id ${entry.id}`);
    ids.add(entry.id);

    for (const field of ['id', 'date', 'pillar', 'asset_id']) assertNonEmpty(`${prefix}.${field}`, entry[field], failures);
    assertClean(`${prefix}.title`, entry.title, failures, 15);
    assertClean(`${prefix}.proof`, entry.proof, failures, 25);
    assertClean(`${prefix}.instagram`, entry.instagram, failures, 80);
    assertClean(`${prefix}.facebook`, entry.facebook, failures, 70);
    if (!entry.tiktok || typeof entry.tiktok !== 'object') {
      failures.push(`${prefix}.tiktok: missing object`);
    } else {
      assertClean(`${prefix}.tiktok.hook`, entry.tiktok.hook, failures, 24);
      assertClean(`${prefix}.tiktok.caption`, entry.tiktok.caption, failures, 45);
      if (!Array.isArray(entry.tiktok.scenes) || entry.tiktok.scenes.length < 3) failures.push(`${prefix}.tiktok.scenes: expected at least 3 scenes`);
      for (const [sceneIndex, scene] of (entry.tiktok.scenes || []).entries()) {
        assertClean(`${prefix}.tiktok.scenes[${sceneIndex}]`, scene, failures, 20);
      }
    }

    const asset = path.join(rootDir, 'social-launch/output', `${entry.asset_id}.png`);
    if (!(await fileExists(asset))) failures.push(`${prefix}: missing asset ${entry.asset_id}.png`);

    allTextParts.push(entry.title, entry.proof, entry.instagram, entry.facebook, entry.tiktok?.hook, entry.tiktok?.caption);
  }

  const allText = allTextParts.join('\n');
  for (const [label, fragment] of requiredTopics) {
    if (!allText.includes(fragment)) failures.push(`missing required ${label} topic: ${fragment}`);
  }

  if (await fileExists(packDir)) {
    const manifest = path.join(packDir, 'manifest.md');
    const preview = path.join(packDir, 'index.html');
    if (!(await fileExists(manifest))) failures.push('daily publish pack exists but manifest.md is missing');
    if (!(await fileExists(preview))) failures.push('daily publish pack exists but index.html review page is missing');
    for (const entry of calendar.entries || []) {
      const dayDir = path.join(packDir, `${entry.date}-${entry.id}`);
      for (const filename of ['instagram.caption.txt', 'facebook.caption.txt', 'tiktok.script.txt', 'youtube-shorts.script.txt', 'language-plan.md', 'approval-checklist.md']) {
        const file = path.join(dayDir, filename);
        if (!(await fileExists(file))) {
          failures.push(`${entry.id}: missing publish pack file ${filename}`);
        } else {
          await assertPublishPackFileClean(file, `${entry.id}/${filename}`, failures);
        }
      }
    }
  }

  const result = {
    ok: failures.length === 0,
    entries: calendar.entries?.length || 0,
    channels: calendar.channels,
    failures
  };
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
