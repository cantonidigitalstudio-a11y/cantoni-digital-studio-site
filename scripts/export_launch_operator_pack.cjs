const fs = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(process.env.LAUNCH_OPERATOR_PACK_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/launch-operator-pack'));
const VERSION = process.env.LAUNCH_OPERATOR_PACK_VERSION || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

if (!/^[A-Za-z0-9._-]+$/.test(VERSION)) {
  throw new Error('LAUNCH_OPERATOR_PACK_VERSION may contain only letters, numbers, dots, underscores and dashes.');
}

const BASE_NAME = `cantoni-launch-operator-pack-${VERSION}`;
const MARKDOWN_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.md`);
const JSON_PATH = path.join(OUTPUT_DIR, `${BASE_NAME}.json`);

function normalizeRel(value) {
  return String(value || '').split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  if (!filePath) return null;
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(PROJECT_ROOT + path.sep)) return filePath;
  return normalizeRel(path.relative(PROJECT_ROOT, resolved));
}

function runJsonStep(id, label, scriptPath) {
  console.error(`step=${id}`);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    shell: false
  });

  if (result.stderr) process.stderr.write(result.stderr);

  const stdout = String(result.stdout || '').trim();
  let parsed = null;
  try {
    parsed = stdout ? JSON.parse(stdout) : null;
  } catch (error) {
    throw new Error(`${label} did not return JSON: ${error.message}`);
  }

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed: ${result.error?.message || `${scriptPath} exited with ${result.status}`}`);
  }

  return {
    id,
    label,
    command: `node ${scriptPath}`,
    ok: parsed?.ok === true,
    output: parsed
  };
}

async function readJsonArtifact(filePath) {
  if (!filePath) return null;
  return JSON.parse(await fs.readFile(path.resolve(PROJECT_ROOT, filePath), 'utf8'));
}

function normalizeStepOutput(step) {
  const output = { ...(step.output || {}) };
  for (const key of ['markdown', 'json', 'csv', 'manifest', 'checksums', 'readme']) {
    if (output[key]) output[key] = relativeToRoot(output[key]);
  }
  if (output.zip?.path) {
    output.zip = {
      ...output.zip,
      path: relativeToRoot(output.zip.path)
    };
  }
  return {
    ...step,
    output
  };
}

function failureLines(items) {
  if (!Array.isArray(items) || !items.length) return ['- none'];
  return items.flatMap((item) => {
    const failures = Array.isArray(item.failures) ? item.failures : [];
    if (!failures.length) return [`- ${item.id}: ${item.label || 'Gate failed'}`];
    return failures.map((failure) => `- ${item.id} / ${failure.id}: ${failure.reason}`);
  });
}

function artifactRows(payload) {
  const packageStep = payload.steps.cloudflare_manual_upload.output;
  const emailStep = payload.steps.email_dns_handoff.output;
  const driftStep = payload.steps.live_drift.output;
  const handoffStep = payload.steps.launch_handoff.output;
  const rows = [
    ['Cloudflare upload ZIP', packageStep.zip?.path],
    ['Cloudflare manifest', packageStep.manifest],
    ['Cloudflare checksums', packageStep.checksums],
    ['Cloudflare README', packageStep.readme],
    ['Email DNS handoff', emailStep.markdown],
    ['Email DNS CSV', emailStep.csv],
    ['Live drift report', driftStep.markdown],
    ['Launch handoff', handoffStep.markdown],
    ['Operator pack JSON', payload.operator_pack.json],
    ['Operator pack Markdown', payload.operator_pack.markdown]
  ];

  return [
    '| Purpose | Path |',
    '| --- | --- |',
    ...rows.map(([label, filePath]) => `| ${label} | ${filePath ? `\`${filePath}\`` : 'n/a'} |`)
  ];
}

function renderMarkdown(payload) {
  const readiness = payload.readiness || {};
  const liveDrift = payload.steps.live_drift.output;
  const cloudflarePackage = payload.steps.cloudflare_manual_upload.output;

  return [
    '# Cantoni Launch Operator Pack',
    '',
    `Generated: ${payload.generated_at}`,
    `Readiness ok: ${readiness.ok === true ? 'yes' : 'no'}`,
    `Deploy-only live drift: ${liveDrift.deploy_only_drift ? 'yes' : 'no'}`,
    '',
    '## Scope',
    '',
    'This pack is an operational index for the artifacts generated in one verified run.',
    'It does not grant approval to deploy, change DNS, send email, or remove outbound holds.',
    '',
    '## Current Blockers',
    '',
    ...failureLines(readiness.blockers),
    '',
    '## Current Holds',
    '',
    ...failureLines(readiness.holds),
    '',
    '## Artifact Index',
    '',
    ...artifactRows(payload),
    '',
    '## Cloudflare Package Evidence',
    '',
    `- Project: ${cloudflarePackage.project_name}`,
    `- Domain: ${cloudflarePackage.domain_name}`,
    `- Files: ${cloudflarePackage.files_count}`,
    `- ZIP SHA-256: \`${cloudflarePackage.zip?.sha256 || 'unknown'}\``,
    '',
    '## Required Sequence',
    '',
    '1. Fix Cloudflare auth for the Cantoni Digital Studio account only.',
    '2. Run `npm run audit:cloudflare-auth` and require it to pass.',
    '3. Deploy only the verified `.cloudflare-pages` artifact or ZIP referenced in this pack, after explicit deploy approval.',
    '4. Add Google Workspace DNS records from the email DNS handoff; generate the DKIM value in Google Admin.',
    '5. Run `npm run audit:email-dns` after DNS propagation.',
    '6. Run `npm run test:live-site` and `npm run audit:launch-readiness` after deploy.',
    '7. Keep outbound paused until all gates are green and the exact send batch is approved.',
    ''
  ].join('\n');
}

async function main() {
  const rawSteps = [
    runJsonStep('cloudflare_manual_upload', 'Cloudflare manual upload package', 'scripts/export_cloudflare_manual_upload_package.cjs'),
    runJsonStep('email_dns_handoff', 'Email DNS handoff', 'scripts/export_email_dns_handoff.cjs'),
    runJsonStep('live_drift', 'Live drift report', 'scripts/export_live_drift_report.cjs'),
    runJsonStep('launch_handoff', 'Launch handoff', 'scripts/export_launch_handoff.cjs')
  ];

  const steps = Object.fromEntries(rawSteps.map((step) => [step.id, normalizeStepOutput(step)]));
  const launchHandoffJson = await readJsonArtifact(steps.launch_handoff.output.json);

  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    readiness: launchHandoffJson?.readiness || null,
    steps,
    operator_pack: {
      markdown: relativeToRoot(MARKDOWN_PATH),
      json: relativeToRoot(JSON_PATH)
    }
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(JSON_PATH, JSON.stringify(payload, null, 2) + '\n');
  await fs.writeFile(MARKDOWN_PATH, renderMarkdown(payload));

  console.log(JSON.stringify({
    ok: true,
    readiness_ok: payload.readiness?.ok === true,
    blocker_count: payload.readiness?.blockers?.length || 0,
    hold_count: payload.readiness?.holds?.length || 0,
    deploy_only_drift: steps.live_drift.output.deploy_only_drift === true,
    cloudflare_zip: steps.cloudflare_manual_upload.output.zip?.path || null,
    markdown: payload.operator_pack.markdown,
    json: payload.operator_pack.json
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
