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
const LATEST_MARKDOWN_PATH = path.join(OUTPUT_DIR, 'cantoni-launch-operator-pack-latest.md');
const LATEST_JSON_PATH = path.join(OUTPUT_DIR, 'cantoni-launch-operator-pack-latest.json');
const DEFAULT_DIRECT_DEPLOY_BRANCH = 'preview-cantoni-site';
const PRODUCTION_DEPLOY_BRANCH = 'main';

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
  if (output.latest && typeof output.latest === 'object' && !Array.isArray(output.latest)) {
    output.latest = Object.fromEntries(Object.entries(output.latest).map(([key, value]) => [
      key,
      typeof value === 'string' ? relativeToRoot(value) : value
    ]));
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
    `- DNS zone identity: ${cloudflareApi.dns_zone_identity_ok ? 'ok' : 'not ok'}`,
    `- DNS zone name: \`${cloudflareApi.dns_zone_name || 'unknown'}\``,
    `- DNS zone status: \`${cloudflareApi.dns_zone_status || 'unknown'}\``,
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

function buildCloudflareDeployCandidate({ cloudflarePackage, liveDrift, readiness, git }) {
  const gates = Array.isArray(readiness?.gates) ? readiness.gates : [];
  const blockers = Array.isArray(readiness?.blockers) ? readiness.blockers : [];
  const artifactGate = gates.find((gate) => gate.id === 'cloudflare_artifact_contract');
  const gitGate = gates.find((gate) => gate.id === 'git_deploy_state');
  const authBlocked = blockers.some((blocker) => blocker.id === 'cloudflare_pages_deploy_auth');
  const liveSiteBlocked = blockers.some((blocker) => blocker.id === 'live_site_contract');
  const dnsBlockers = blockers
    .filter((blocker) => ['cloudflare_dns_api_credentials', 'cantoni_email_dns'].includes(blocker.id))
    .map((blocker) => blocker.id);
  const patch = liveDrift?.contract_drift_patch || {};
  const patchFiles = Array.isArray(patch.files) ? patch.files : [];
  const artifactReady = artifactGate?.ok === true &&
    artifactGate.details?.build_ok === true &&
    artifactGate.details?.artifact_ok === true &&
    cloudflarePackage?.ok === true &&
    Boolean(cloudflarePackage?.zip?.path) &&
    Boolean(cloudflarePackage?.zip?.sha256);
  const gitReady = gitGate?.ok === true &&
    git?.dirty === false &&
    git?.ahead === 0 &&
    git?.behind === 0;
  const driftReady = liveDrift?.deploy_only_drift === true &&
    patch.full_artifact_required === true &&
    patch.partial_upload_safe === false &&
    patchFiles.length > 0;

  return {
    type: 'cloudflare_pages_deploy_candidate_v1',
    artifact_ready: artifactReady,
    git_ready: gitReady,
    would_fix_live_contract: driftReady,
    execution_ready: artifactReady && gitReady && driftReady && !authBlocked,
    deployment_approval_required: true,
    deploy_allowed_without_approval: false,
    status: artifactReady && gitReady && driftReady
      ? authBlocked
        ? 'artifact_ready_execution_blocked'
        : 'ready_for_explicit_deploy_approval'
      : 'not_ready',
    execution_blockers: [
      ...(!artifactReady ? ['cloudflare_artifact_contract'] : []),
      ...(!gitReady ? ['git_deploy_state'] : []),
      ...(authBlocked ? ['cloudflare_pages_deploy_auth'] : []),
      ...(!liveSiteBlocked && !driftReady ? ['live_site_contract_not_proven_deploy_only'] : [])
    ],
    non_site_blockers: dnsBlockers,
    target: {
      project_name: cloudflarePackage?.project_name || null,
      domain_name: cloudflarePackage?.domain_name || null,
      public_dir: '.cloudflare-pages',
      upload_root: 'zip root contains the public artifact files directly'
    },
    git: {
      commit: git?.commit || null,
      short_commit: git?.short_commit || null,
      branch: git?.branch || null,
      upstream: git?.upstream || null,
      remote_name: git?.remote_name || null,
      ahead: git?.ahead ?? null,
      behind: git?.behind ?? null,
      dirty: git?.dirty === true
    },
    package: {
      zip_path: cloudflarePackage?.zip?.path || null,
      zip_sha256: cloudflarePackage?.zip?.sha256 || null,
      zip_bytes: cloudflarePackage?.zip?.bytes ?? null,
      manifest: cloudflarePackage?.manifest || null,
      checksums: cloudflarePackage?.checksums || null,
      readme: cloudflarePackage?.readme || null,
      files_count: cloudflarePackage?.files_count ?? null,
      files_total_bytes: cloudflarePackage?.files_total_bytes ?? null
    },
    live_drift_patch: {
      full_artifact_required: patch.full_artifact_required === true,
      partial_upload_safe: patch.partial_upload_safe === true,
      files_count: patch.files_count ?? patchFiles.length,
      pages: patchFiles.map((file) => file.page),
      artifact_files: patchFiles.map((file) => file.artifact_file),
      missing_required_by_page: Object.fromEntries(patchFiles.map((file) => [
        file.page,
        Array.isArray(file.live_missing_required) ? file.live_missing_required : []
      ]))
    },
    allowed_commands_after_approval: [
      'npm run deploy:cloudflare:direct',
      'Cloudflare dashboard manual upload of the referenced ZIP only'
    ],
    deploy_branch_policy: {
      default_direct_deploy_branch: DEFAULT_DIRECT_DEPLOY_BRANCH,
      production_branch: PRODUCTION_DEPLOY_BRANCH,
      preview_deploy_clears_live_site_contract: false,
      live_site_contract_fix_requires_production_branch: true,
      production_approval_required: true,
      production_approval_environment: [
        'CLOUDFLARE_PAGES_BRANCH=main',
        'ALLOW_PRODUCTION_DEPLOY=yes',
        'CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production'
      ]
    },
    required_post_deploy_checks: [
      'npm run test:live-site',
      'npm run audit:post-unblock-launch',
      'npm run audit:launch-readiness'
    ]
  };
}

function cloudflareDeployCandidateLines(candidate) {
  if (!candidate) return ['- No Cloudflare deploy candidate payload was available.'];
  return [
    `- Status: \`${candidate.status || 'unknown'}\``,
    `- Artifact ready: ${candidate.artifact_ready ? 'yes' : 'no'}`,
    `- Git ready: ${candidate.git_ready ? 'yes' : 'no'}`,
    `- Would fix live contract: ${candidate.would_fix_live_contract ? 'yes' : 'no'}`,
    `- Execution ready: ${candidate.execution_ready ? 'yes' : 'no'}`,
    `- Deploy allowed without approval: ${candidate.deploy_allowed_without_approval ? 'yes' : 'no'}`,
    `- ZIP: \`${candidate.package?.zip_path || 'unknown'}\``,
    `- ZIP SHA-256: \`${candidate.package?.zip_sha256 || 'unknown'}\``,
    `- Manifest: \`${candidate.package?.manifest || 'unknown'}\``,
    `- Drift pages: ${(candidate.live_drift_patch?.pages || []).map((page) => `\`${page}\``).join(', ') || 'none'}`,
    `- Execution blockers: ${(candidate.execution_blockers || []).map((item) => `\`${item}\``).join(', ') || 'none'}`,
    `- Non-site blockers: ${(candidate.non_site_blockers || []).map((item) => `\`${item}\``).join(', ') || 'none'}`,
    `- Default direct deploy branch: \`${candidate.deploy_branch_policy?.default_direct_deploy_branch || 'unknown'}\``,
    `- Production live-contract branch: \`${candidate.deploy_branch_policy?.production_branch || 'unknown'}\``,
    `- Preview clears live contract: ${candidate.deploy_branch_policy?.preview_deploy_clears_live_site_contract === true ? 'yes' : 'no'}`
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
    '## Cloudflare Deploy Candidate',
    '',
    ...cloudflareDeployCandidateLines(payload.cloudflare_deploy_candidate),
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
    '2. Run `npm run audit:git-deploy-state` and require clean, pushed Cantoni Git provenance before any deploy.',
    '3. Run `npm run audit:cloudflare-auth` for OAuth, or `node scripts/verify_cloudflare_api_credentials.mjs --pages-only` for direct token deploy.',
    '4. Deploy only the verified `.cloudflare-pages` artifact or ZIP referenced in this pack, after explicit deploy approval; use `npm run deploy:cloudflare:direct` for the token path.',
    '   Preview branch `preview-cantoni-site` validates the artifact but does not clear the production `live_site_contract`; clearing production requires `CLOUDFLARE_PAGES_BRANCH=main` plus the separate production approvals.',
    '5. Run `npm run dns:cloudflare:plan`; apply only if the plan is ready and explicit DNS approval is present.',
    '6. Run `npm run audit:email-dns` after DNS propagation.',
    '7. Generate and publish the Google DKIM value from Google Admin.',
    '8. Run `npm run test:live-site`, `npm run audit:post-unblock-launch` and `npm run audit:launch-readiness` after deploy.',
    '9. Keep outbound paused until all gates are green and the exact send batch is approved.',
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
  payload.cloudflare_deploy_candidate = buildCloudflareDeployCandidate({
    cloudflarePackage: steps.cloudflare_manual_upload.output,
    liveDrift: steps.live_drift.output,
    readiness: payload.readiness,
    git: payload.git
  });

  const jsonSource = JSON.stringify(payload, null, 2) + '\n';
  const markdownSource = renderMarkdown(payload);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(JSON_PATH, jsonSource),
    fs.writeFile(MARKDOWN_PATH, markdownSource),
    fs.writeFile(LATEST_JSON_PATH, jsonSource),
    fs.writeFile(LATEST_MARKDOWN_PATH, markdownSource)
  ]);

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
