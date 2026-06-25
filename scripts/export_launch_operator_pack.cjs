const fs = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');
const { gitProvenance } = require('./lib/git_provenance.cjs');

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

function runJsonStep(id, label, scriptPath, args = [], options = {}) {
  console.error(`step=${id}`);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
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

  if (result.error || (result.status !== 0 && options.allowFailure !== true)) {
    throw new Error(`${label} failed: ${result.error?.message || `${[scriptPath, ...args].join(' ')} exited with ${result.status}`}`);
  }

  return {
    id,
    label,
    command: `node ${[scriptPath, ...args].join(' ')}`,
    command_status: result.status,
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
  for (const key of ['markdown', 'json', 'csv', 'cloudflare_api_json', 'manifest', 'checksums', 'readme']) {
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

function passingGateLines(gates) {
  const passing = (Array.isArray(gates) ? gates : []).filter((gate) => gate.ok === true);
  if (!passing.length) return ['- none'];
  return passing.map((gate) => {
    const details = gate.details || {};
    const suffix = gate.id === 'cloudflare_artifact_contract'
      ? ` (${details.files_count ?? 'unknown'}/${details.required_files_count ?? 'unknown'} files)`
      : '';
    return `- ${gate.id}: ${gate.label || 'Gate passed'}${suffix}`;
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
    ['Email DNS API JSON', emailStep.cloudflare_api_json],
    ['Email DNS Cloudflare plan', 'embedded in operator pack JSON'],
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

function cloudflareDiagnosticLines(cloudflareAuth) {
  if (!cloudflareAuth) return ['- No Cloudflare auth diagnostic payload was available.'];
  if (cloudflareAuth.ok) return ['- Cloudflare Pages auth: ok'];
  return [
    `- Diagnostic: \`${cloudflareAuth.diagnostic_code || 'unknown'}\``,
    `- Project listed: ${cloudflareAuth.project_listed ? 'yes' : 'no'}`,
    `- CLOUDFLARE_ACCOUNT_ID set: ${cloudflareAuth.has_cloudflare_account_id ? 'yes' : 'no'}`,
    '',
    'Next auth actions:',
    ...((cloudflareAuth.next_actions || []).map((action, index) => `${index + 1}. ${action}`))
  ];
}

function cloudflareApiDiagnosticLines(cloudflareApi) {
  if (!cloudflareApi) return ['- No Cloudflare direct API diagnostic payload was available.'];
  if (cloudflareApi.ok) return ['- Cloudflare DNS API credentials: ok'];
  return [
    `- Scope: \`${cloudflareApi.scope || 'unknown'}\``,
    `- CLOUDFLARE_API_TOKEN set: ${cloudflareApi.has_cloudflare_api_token ? 'yes' : 'no'}`,
    `- CLOUDFLARE_ACCOUNT_ID set: ${cloudflareApi.has_cloudflare_account_id ? 'yes' : 'no'}`,
    `- CLOUDFLARE_ZONE_ID set: ${cloudflareApi.has_cloudflare_zone_id ? 'yes' : 'no'}`,
    `- Token verify: ${cloudflareApi.token_verify_ok ? 'ok' : 'not ok'}`,
    `- Pages read: ${cloudflareApi.pages_read_ok ? 'ok' : 'not ok'}`,
    `- DNS read: ${cloudflareApi.dns_read_ok ? 'ok' : 'not ok'}`,
    '',
    'Next API actions:',
    ...((cloudflareApi.next_actions || []).map((action, index) => `${index + 1}. ${action}`))
  ];
}

function cloudflareDnsPlanLines(plan) {
  if (!plan) return ['- No Cloudflare DNS plan payload was available.'];
  const actions = Array.isArray(plan.actions) ? plan.actions : [];
  const counts = actions.reduce((acc, action) => {
    acc[action.action] = (acc[action.action] || 0) + 1;
    return acc;
  }, {});

  return [
    `- Source: \`${plan.source || 'unknown'}\``,
    `- Ready to apply: ${plan.ready_to_apply ? 'yes' : 'no'}`,
    `- Records in API-safe payload: ${plan.records_count ?? 'unknown'}`,
    `- Changes required: ${plan.changes_required ?? 'unknown'}`,
    `- Token present: ${plan.cloudflare?.token_present ? 'yes' : 'no'}`,
    `- Zone ID present: ${plan.cloudflare?.zone_id_present ? 'yes' : 'no'}`,
    `- Actions: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`,
    '',
    'DNS plan rule:',
    '- Apply only with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, and `CANTONI_DNS_APPROVAL=apply-cantoni-email-dns`.',
    '- `google_dkim` stays excluded until Google Admin provides the real DKIM TXT value.'
  ];
}

function liveDriftPatchLines(liveDrift) {
  const patch = liveDrift?.contract_drift_patch;
  if (!patch) return ['- No live drift patch payload was available.'];
  const files = Array.isArray(patch.files) ? patch.files : [];
  if (!files.length) {
    return [
      `- Type: \`${patch.type || 'unknown'}\``,
      '- Current live drift patch files: none'
    ];
  }

  return [
    `- Type: \`${patch.type || 'unknown'}\``,
    `- Deploy action: \`${patch.deploy_action || 'unknown'}\``,
    `- Full artifact required: ${patch.full_artifact_required === true ? 'yes' : 'no'}`,
    `- Partial upload safe: ${patch.partial_upload_safe === true ? 'yes' : 'no'}`,
    `- Upload root: \`${patch.upload_root || 'unknown'}\``,
    `- Contract-failing live files fixed by the artifact: ${files.length}`,
    '',
    '| Page | Artifact file | Live missing snippets |',
    '| --- | --- | --- |',
    ...files.map((file) => {
      const missingRequired = Array.isArray(file.live_missing_required) ? file.live_missing_required : [];
      return `| \`${file.page}\` | \`${file.artifact_file}\` | ${missingRequired.map((snippet) => `\`${snippet}\``).join('<br>')} |`;
    }),
    '',
    'Deploy rule:',
    '- Use the full verified Cloudflare ZIP/artifact from this pack; the file list above is evidence for the drift, not a partial-deploy instruction.'
  ];
}

function gitProvenanceLines(git) {
  if (!git) return ['- No Git provenance payload was available.'];
  return [
    `- Commit: \`${git.short_commit || 'unknown'}\``,
    `- Branch: \`${git.branch || 'unknown'}\``,
    `- Upstream: \`${git.upstream || 'unknown'}\``,
    `- Remote: \`${git.remote_url || 'unknown'}\``,
    `- Ahead/behind: ${git.ahead ?? 'unknown'}/${git.behind ?? 'unknown'}`,
    `- Dirty worktree at generation: ${git.dirty ? 'yes' : 'no'}`
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
    '## Verified Passing Gates',
    '',
    ...passingGateLines(readiness.gates),
    '',
    '## Git Provenance',
    '',
    ...gitProvenanceLines(payload.git),
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
    '## Live Drift Deploy Patch',
    '',
    ...liveDriftPatchLines(liveDrift),
    '',
    '## Cloudflare Auth Diagnostic',
    '',
    ...cloudflareDiagnosticLines(payload.cloudflare_auth),
    '',
    '## Cloudflare DNS API Credential Diagnostic',
    '',
    ...cloudflareApiDiagnosticLines(payload.cloudflare_api),
    '',
    '## Cloudflare Email DNS Plan',
    '',
    ...cloudflareDnsPlanLines(payload.steps.email_dns_cloudflare_plan?.output),
    '',
    '## Required Sequence',
    '',
    '1. Fix Cloudflare auth for the Cantoni Digital Studio account only, or provide direct token credentials for that same account.',
    '2. Run `npm run audit:cloudflare-auth` for OAuth, or `node scripts/verify_cloudflare_api_credentials.mjs --pages-only` for direct token deploy.',
    '3. Deploy only the verified `.cloudflare-pages` artifact or ZIP referenced in this pack, after explicit deploy approval; use `npm run deploy:cloudflare:direct` for the token path.',
    '4. Run `npm run dns:cloudflare:plan`; apply only if the plan is ready and explicit DNS approval is present.',
    '5. Run `npm run audit:email-dns` after DNS propagation.',
    '6. Generate and publish the Google DKIM value from Google Admin.',
    '7. Run `npm run test:live-site` and `npm run audit:launch-readiness` after deploy.',
    '8. Keep outbound paused until all gates are green and the exact send batch is approved.',
    ''
  ].join('\n');
}

async function main() {
  const rawSteps = [
    runJsonStep('cloudflare_manual_upload', 'Cloudflare manual upload package', 'scripts/export_cloudflare_manual_upload_package.cjs'),
    runJsonStep('email_dns_handoff', 'Email DNS handoff', 'scripts/export_email_dns_handoff.cjs'),
    runJsonStep('email_dns_cloudflare_plan', 'Email DNS Cloudflare plan', 'scripts/sync_cloudflare_email_dns.cjs', ['--dry-run'], { allowFailure: true }),
    runJsonStep('live_drift', 'Live drift report', 'scripts/export_live_drift_report.cjs'),
    runJsonStep('launch_handoff', 'Launch handoff', 'scripts/export_launch_handoff.cjs')
  ];

  const steps = Object.fromEntries(rawSteps.map((step) => [step.id, normalizeStepOutput(step)]));
  const launchHandoffJson = await readJsonArtifact(steps.launch_handoff.output.json);

  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    git: gitProvenance(PROJECT_ROOT),
    readiness: launchHandoffJson?.readiness || null,
    cloudflare_auth: launchHandoffJson?.cloudflare_auth || null,
    cloudflare_api: launchHandoffJson?.cloudflare_api || null,
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
    dns_plan_ready: steps.email_dns_cloudflare_plan.output.ready_to_apply === true,
    cloudflare_zip: steps.cloudflare_manual_upload.output.zip?.path || null,
    markdown: payload.operator_pack.markdown,
    json: payload.operator_pack.json
  }, null, 2));
}

main().catch((error) => {
  console.error(`error=${error.message || error}`);
  process.exitCode = 1;
});
