import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const privateRoot = path.join(repoRoot, 'sales-kit/social-launch/voice-reference-private');
const analysisDir = path.join(privateRoot, 'analysis');
const reviewDir = path.join(privateRoot, 'incoming/review-candidates');
const whatsappSharedRoot = path.join(process.env.HOME || '', 'Library/Group Containers/group.net.whatsapp.WhatsApp.shared');
const whatsappDbPath = process.env.WHATSAPP_CHAT_STORAGE || path.join(whatsappSharedRoot, 'ChatStorage.sqlite');
const whatsappMessageRoot = path.join(whatsappSharedRoot, 'Message');

const defaultRoots = [
  path.join(process.env.HOME || '', 'Library/Group Containers/group.net.whatsapp.WhatsApp.shared/Message/Media'),
  path.join(process.env.HOME || '', 'Library/Group Containers/group.net.whatsapp.WhatsApp.shared/Library/Caches/MediaDownload/WhatsApp')
];

const sourceRoots = (process.env.VOICE_SOURCE_ROOTS || '')
  .split(':')
  .map((item) => item.trim())
  .filter(Boolean);

const roots = sourceRoots.length ? sourceRoots : defaultRoots;
const limit = Number.parseInt(process.env.VOICE_CANDIDATE_LIMIT || '80', 10);
const minSeconds = Number.parseFloat(process.env.VOICE_MIN_SECONDS || '4');
const maxSeconds = Number.parseFloat(process.env.VOICE_MAX_SECONDS || '120');
const direction = process.env.VOICE_DIRECTION || 'sent_by_me';
const extensions = new Set(['.opus', '.m4a', '.mp3', '.caf', '.wav', '.ogg']);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ffprobe(file) {
  const result = spawnSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=codec_name,sample_rate,channels',
    '-of',
    'json',
    file
  ], { encoding: 'utf8' });

  if (result.status !== 0) return null;
  try {
    const parsed = JSON.parse(result.stdout || '{}');
    return {
      duration: Number.parseFloat(parsed.format?.duration || '0') || 0,
      codec: parsed.streams?.[0]?.codec_name || '',
      sample_rate: parsed.streams?.[0]?.sample_rate || '',
      channels: parsed.streams?.[0]?.channels || 0
    };
  } catch {
    return null;
  }
}

async function exists(dir) {
  try {
    await fs.access(dir);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, files = []) {
  if (!(await exists(dir))) return files;
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute, files);
    } else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolute);
    }
  }
  return files;
}

function sqliteRows(query) {
  const result = spawnSync('sqlite3', [
    '-readonly',
    '-separator',
    '\t',
    whatsappDbPath,
    query
  ], { encoding: 'utf8' });

  if (result.status !== 0) return [];
  return String(result.stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t'));
}

async function firstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

async function resolveWhatsAppMediaPath(localPath) {
  if (!localPath) return null;
  if (path.isAbsolute(localPath)) return (await exists(localPath)) ? localPath : null;

  const candidates = [
    path.join(whatsappMessageRoot, localPath),
    path.join(whatsappSharedRoot, localPath),
    path.join(whatsappSharedRoot, 'Message', localPath.replace(/^Message\//, ''))
  ];
  return firstExistingPath(candidates);
}

async function loadOutgoingWhatsAppAudio() {
  if (!(await exists(whatsappDbPath))) return { rowsSeen: 0, media: [] };

  const query = `
    SELECT
      mi.Z_PK,
      mi.ZMEDIALOCALPATH,
      mi.ZFILESIZE,
      mi.ZMOVIEDURATION,
      m.ZMESSAGEDATE
    FROM ZWAMEDIAITEM mi
    JOIN ZWAMESSAGE m ON mi.ZMESSAGE = m.Z_PK
    WHERE m.ZISFROMME = 1
      AND mi.ZMEDIALOCALPATH IS NOT NULL
    ORDER BY m.ZMESSAGEDATE DESC;
  `;
  const rows = sqliteRows(query);
  const media = [];
  const seen = new Set();

  for (const [mediaPk, localPath, dbFileSize, dbDuration, messageDate] of rows) {
    if (!extensions.has(path.extname(localPath || '').toLowerCase())) continue;
    const absolutePath = await resolveWhatsAppMediaPath(localPath);
    if (!absolutePath || seen.has(absolutePath)) continue;
    seen.add(absolutePath);
    media.push({
      source: absolutePath,
      whatsapp_media_pk: mediaPk,
      whatsapp_local_path: localPath,
      whatsapp_db_file_size: Number.parseInt(dbFileSize || '0', 10) || 0,
      whatsapp_db_duration_seconds: Number.parseFloat(dbDuration || '0') || 0,
      whatsapp_message_date: messageDate || '',
      direction: 'sent_by_me',
      direction_source: 'ChatStorage.sqlite ZWAMESSAGE.ZISFROMME=1'
    });
  }

  return { rowsSeen: rows.length, media };
}

function safeName(index, file) {
  const ext = path.extname(file).toLowerCase() || '.audio';
  return `candidate-${String(index + 1).padStart(3, '0')}${ext}`;
}

async function linkCandidate(file, target) {
  try {
    await fs.unlink(target);
  } catch {}
  await fs.symlink(file, target);
}

function htmlFor(candidates, summary) {
  const rows = candidates.map((candidate) => `
    <article>
      <header>
        <p class="kicker">${escapeHtml(candidate.review_id)} · ${escapeHtml(candidate.direction || 'unknown')} · ${escapeHtml(candidate.codec)} · ${candidate.duration_seconds.toFixed(1)}s</p>
        <h2>${escapeHtml(candidate.review_file)}</h2>
      </header>
      <audio controls preload="none" src="${escapeHtml(candidate.review_file)}"></audio>
      <dl>
        <div><dt>Modified</dt><dd>${escapeHtml(candidate.modified_at)}</dd></div>
        <div><dt>Size</dt><dd>${Math.round(candidate.size_bytes / 1024)} KB</dd></div>
        <div><dt>Direction</dt><dd>${escapeHtml(candidate.direction_source || candidate.direction || 'not filtered')}</dd></div>
        <div><dt>Source</dt><dd><code>${escapeHtml(candidate.source)}</code></dd></div>
      </dl>
      <p class="check">Review: only keep this if Emanuele is the only speaker, no private data, clean audio, useful natural cadence.</p>
    </article>`).join('\n');

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cantoni voice reference candidates</title>
  <style>
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#f6f8fb; color:#14284a; }
    main { max-width: 1080px; margin: 0 auto; padding: 32px 20px 60px; }
    h1 { margin:0 0 10px; font-size: clamp(2rem, 5vw, 4rem); line-height: .95; letter-spacing:0; }
    .lead { color:#5d6b82; max-width: 760px; line-height: 1.55; }
    article { background:#fff; border:1px solid #dce4ef; border-radius:8px; padding:18px; margin:0 0 16px; }
    h2 { margin:0 0 12px; font-size:1.25rem; }
    .kicker { margin:0 0 6px; text-transform:uppercase; letter-spacing:.08em; font-weight:800; color:#68768d; font-size:.78rem; }
    audio { width:100%; margin: 0 0 12px; }
    dl { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px; margin:0; }
    dt { font-weight:800; font-size:.78rem; text-transform:uppercase; letter-spacing:.06em; color:#68768d; }
    dd { margin:4px 0 0; overflow-wrap:anywhere; }
    code { font-size:.82rem; }
    .check { margin:14px 0 0; padding:10px 12px; background:#fff8eb; border:1px solid #f0d9a8; border-radius:8px; }
    @media (max-width: 760px) { dl { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main>
    <h1>Voice Reference Candidates</h1>
    <p class="lead">Review privata. Questi file sono candidati tecnici trovati localmente e, di default, filtrati solo tra i vocali WhatsApp inviati da Emanuele. Non usarli per training, trascrizione o pubblicazione finche non sono marcati come solo voce di Emanuele, senza terzi e senza dati privati.</p>
    <p class="lead"><strong>Filtro:</strong> ${escapeHtml(summary.direction_filter)} · <strong>media inviati visti:</strong> ${summary.outgoing_media_rows_seen} · <strong>audio inviati risolti:</strong> ${summary.outgoing_audio_candidates}</p>
    ${rows}
  </main>
</body>
</html>
`;
}

async function run() {
  let discovered = [];
  let outgoing = { rowsSeen: 0, media: [] };
  const sourceMetadata = new Map();

  if (direction === 'sent_by_me') {
    outgoing = await loadOutgoingWhatsAppAudio();
    discovered = outgoing.media.map((item) => item.source);
    for (const item of outgoing.media) sourceMetadata.set(item.source, item);
  } else {
    for (const root of roots) await walk(root, discovered);
  }

  const candidates = [];
  for (const file of discovered) {
    const stat = await fs.stat(file);
    const meta = ffprobe(file);
    if (!meta) continue;
    if (meta.duration < minSeconds || meta.duration > maxSeconds) continue;
    candidates.push({
      source: file,
      duration_seconds: meta.duration,
      codec: meta.codec,
      sample_rate: meta.sample_rate,
      channels: meta.channels,
      size_bytes: stat.size,
      modified_at: stat.mtime.toISOString(),
      ...(sourceMetadata.get(file) || {
        direction,
        direction_source: direction === 'any' ? 'unfiltered filesystem scan' : 'manual source roots'
      })
    });
  }

  candidates.sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at));
  const selected = candidates.slice(0, Math.max(0, limit)).map((candidate, index) => ({
    review_id: `VR-${String(index + 1).padStart(3, '0')}`,
    review_file: safeName(index, candidate.source),
    ...candidate
  }));

  await fs.mkdir(analysisDir, { recursive: true });
  await fs.rm(reviewDir, { recursive: true, force: true });
  await fs.mkdir(reviewDir, { recursive: true });

  for (const candidate of selected) {
    await linkCandidate(candidate.source, path.join(reviewDir, candidate.review_file));
  }

  const summary = {
    generated_at: new Date().toISOString(),
    direction_filter: direction,
    source_roots: roots,
    whatsapp_db_path: whatsappDbPath,
    outgoing_media_rows_seen: outgoing.rowsSeen,
    outgoing_audio_candidates: outgoing.media.length,
    total_audio_files_seen: discovered.length,
    candidates_after_duration_filter: candidates.length,
    staged_for_review: selected.length,
    min_seconds: minSeconds,
    max_seconds: maxSeconds,
    review_dir: reviewDir
  };

  await fs.writeFile(path.join(analysisDir, 'voice-candidates.json'), `${JSON.stringify({
    ...summary,
    candidates: selected
  }, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(reviewDir, 'index.html'), htmlFor(selected, summary), 'utf8');

  console.log(JSON.stringify({
    ok: true,
    direction_filter: direction,
    outgoing_media_rows_seen: outgoing.rowsSeen,
    outgoing_audio_candidates: outgoing.media.length,
    total_audio_files_seen: discovered.length,
    candidates_after_duration_filter: candidates.length,
    staged_for_review: selected.length,
    review_dir: reviewDir,
    review_html: path.join(reviewDir, 'index.html')
  }, null, 2));
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
