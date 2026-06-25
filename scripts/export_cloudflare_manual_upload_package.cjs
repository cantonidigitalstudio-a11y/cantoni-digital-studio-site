const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { gitProvenance } = require('./lib/git_provenance.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(process.env.CLOUDFLARE_PAGES_OUTPUT_DIR || path.join(PROJECT_ROOT, '.cloudflare-pages'));
const OUTPUT_DIR = path.resolve(process.env.CLOUDFLARE_UPLOAD_PACKAGE_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/cloudflare-manual-upload'));
const PROJECT_NAME = process.env.CLOUDFLARE_PAGES_PROJECT_NAME || 'cantonidigitalstudio';
const DOMAIN_NAME = process.env.CLOUDFLARE_CUSTOM_DOMAIN || 'cantonidigitalstudio.com';
const VERSION = process.env.CLOUDFLARE_UPLOAD_PACKAGE_VERSION || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

if (!/^[A-Za-z0-9._-]+$/.test(VERSION)) {
  throw new Error('CLOUDFLARE_UPLOAD_PACKAGE_VERSION may contain only letters, numbers, dots, underscores and dashes.');
}

const BASE_NAME = `cantoni-cloudflare-pages-manual-upload-${VERSION}`;
const ZIP_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.zip`);
const MANIFEST_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.manifest.json`);
const CHECKSUMS_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.SHA256SUMS`);
const README_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.README.txt`);

function normalizeRel(value) {
  return value.split(path.sep).join('/');
}

function runStep(label, command, args, options = {}) {
  console.error(`step=${label}`);
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    shell: false,
    ...options
  });

  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `${command} exited with ${result.status}`}`);
  }
}

async function walk(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath, base));
    } else {
      files.push(normalizeRel(path.relative(base, fullPath)));
    }
  }
  return files.sort();
}

async function sha256File(filePath) {
  const buffer = await fs.readFile(filePath);
  return {
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex')
  };
}

async function assertPublicDirReady() {
  const required = ['_headers', 'index.html', 'case-studies.html', 'privacy.html', 'termini-commerciali.html', 'site-config.js'];
  for (const file of required) {
    await fs.access(path.join(PUBLIC_DIR, file));
  }
}

async function buildManifest() {
  const files = [];
  let totalBytes = 0;
  for (const file of await walk(PUBLIC_DIR)) {
    const stats = await sha256File(path.join(PUBLIC_DIR, file));
    totalBytes += stats.bytes;
    files.push({
      path: file,
      bytes: stats.bytes,
      sha256: stats.sha256
    });
  }

  return {
    ok: true,
    package_type: 'cloudflare_pages_manual_upload_v1',
    generated_at: new Date().toISOString(),
    git: gitProvenance(PROJECT_ROOT),
    project_name: PROJECT_NAME,
    domain_name: DOMAIN_NAME,
    public_dir: '.cloudflare-pages',
    upload_root: 'zip root contains the public artifact files directly; do not upload the repository root',
    files_count: files.length,
    files_total_bytes: totalBytes,
    files
  };
}

async function writeTextArtifacts(manifest, zipStats) {
  const zipRelativeName = path.basename(ZIP_PATH);
  const zipRelativePath = normalizeRel(path.relative(PROJECT_ROOT, ZIP_PATH));
  const checksums = [
    `${zipStats.sha256}  ${zipRelativeName}`,
    ...manifest.files.map((file) => `${file.sha256}  .cloudflare-pages/${file.path}`)
  ].join('\n') + '\n';

  const readme = [
    'Cantoni Digital Studio - Cloudflare Pages manual upload package',
    '',
    `Project: ${PROJECT_NAME}`,
    `Domain: ${DOMAIN_NAME}`,
    `Generated: ${manifest.generated_at}`,
    `Git commit: ${manifest.git?.short_commit || 'unknown'}`,
    `Git branch: ${manifest.git?.branch || 'unknown'}`,
    `Git upstream: ${manifest.git?.upstream || 'unknown'}`,
    `Git dirty: ${manifest.git?.dirty ? 'yes' : 'no'}`,
    '',
    'Upload artifact:',
    `- ${zipRelativeName}`,
    '',
    'Use this package only after explicit deploy approval.',
    'The ZIP contains only the generated Cloudflare Pages public artifact, not the repository root.',
    '',
    'Required checks already run by this script before packaging:',
    '- npm run build:cloudflare',
    '- npm run test:artifact',
    '- SITE_ROOT=.cloudflare-pages npm run test:browser',
    '- SITE_ROOT=.cloudflare-pages npm run test:payments',
    '',
    'Post-upload checks:',
    '- npm run test:live-site',
    '- npm run audit:launch-readiness',
    '',
    'If Cloudflare dashboard drag-and-drop is not available for this Pages project, use the unzipped .cloudflare-pages folder with Wrangler after Cloudflare auth is fixed.'
  ].join('\n') + '\n';

  await fs.writeFile(MANIFEST_PATH, JSON.stringify({ ...manifest, zip: { ...zipStats, path: zipRelativePath } }, null, 2) + '\n');
  await fs.writeFile(CHECKSUMS_PATH, checksums);
  await fs.writeFile(README_PATH, readme);
}

async function main() {
  runStep('build_cloudflare_public_dir', 'npm', ['run', 'build:cloudflare']);
  await assertPublicDirReady();
  runStep('artifact_integrity', 'npm', ['run', 'test:artifact']);
  runStep('artifact_browser_smoke', 'npm', ['run', 'test:browser'], {
    env: { ...process.env, SITE_ROOT: '.cloudflare-pages' }
  });
  runStep('artifact_payment_links', 'npm', ['run', 'test:payments'], {
    env: { ...process.env, SITE_ROOT: '.cloudflare-pages' }
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.rm(ZIP_PATH, { force: true });

  const manifest = await buildManifest();
  runStep('zip_public_artifact', 'zip', ['-X', '-q', '-r', ZIP_PATH, '.'], {
    cwd: PUBLIC_DIR
  });
  const zipStats = await sha256File(ZIP_PATH);
  await writeTextArtifacts(manifest, {
    path: ZIP_PATH,
    bytes: zipStats.bytes,
    sha256: zipStats.sha256
  });

  console.log(JSON.stringify({
    ok: true,
    package_type: manifest.package_type,
    project_name: PROJECT_NAME,
    domain_name: DOMAIN_NAME,
    files_count: manifest.files_count,
    files_total_bytes: manifest.files_total_bytes,
    git: manifest.git,
    zip: {
      path: ZIP_PATH,
      bytes: zipStats.bytes,
      sha256: zipStats.sha256
    },
    manifest: MANIFEST_PATH,
    checksums: CHECKSUMS_PATH,
    readme: README_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
