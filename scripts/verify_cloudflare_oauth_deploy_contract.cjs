#!/usr/bin/env node

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEPLOY_SCRIPT = path.join(PROJECT_ROOT, 'scripts/deploy_cloudflare_pages.sh');
const COMMIT = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const BRANCH = 'codex/cantoni-production-grade-preview';
const UPSTREAM = `cantoni/${BRANCH}`;
const REMOTE_URL = 'https://github.com/cantonidigitalstudio-a11y/cantoni-digital-studio-site.git';
const PROJECT_NAME = 'cantonidigitalstudio';
const DOMAIN = 'cantonidigitalstudio.com';
const POST_DEPLOY_CHECKS = [
  'npm run test:live-site',
  'npm run audit:post-unblock-launch',
  'npm run audit:launch-readiness'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function writeTool(filePath, source) {
  await fs.writeFile(filePath, source);
  await fs.chmod(filePath, 0o755);
}

async function createFakeTools() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cantoni-oauth-deploy-contract-'));
  const toolsDir = path.join(tmpDir, 'bin');
  const logPath = path.join(tmpDir, 'tool-log.jsonl');
  const packDir = path.join(PROJECT_ROOT, 'sales-kit/generated', `oauth-deploy-contract-${path.basename(tmpDir)}`);
  const zipRel = path.relative(PROJECT_ROOT, path.join(packDir, 'candidate.zip')).split(path.sep).join('/');
  const manifestRel = path.relative(PROJECT_ROOT, path.join(packDir, 'candidate.manifest.json')).split(path.sep).join('/');
  const checksumsRel = path.relative(PROJECT_ROOT, path.join(packDir, 'candidate.SHA256SUMS')).split(path.sep).join('/');
  await fs.mkdir(toolsDir, { recursive: true });

  const toolPrelude = [
    '#!/usr/bin/env node',
    "const fs = require('fs');",
    "const path = require('path');",
    "const crypto = require('crypto');",
    "const logPath = process.env.CANTONI_OAUTH_DEPLOY_CONTRACT_LOG;",
    "function write(entry) { fs.appendFileSync(logPath, JSON.stringify(entry) + '\\n'); }",
    ''
  ].join('\n');

  await writeTool(path.join(toolsDir, 'npm'), `${toolPrelude}
const args = process.argv.slice(2);
write({ tool: 'npm', args, site_root: process.env.SITE_ROOT || null });
const joined = args.join(' ');
const allowed = new Set([
  'run audit:cloudflare-auth',
  'run test:full',
  'run test:artifact',
  'run test:browser',
  'run test:payments'
]);
if (!allowed.has(joined)) {
  console.error('unexpected npm call: ' + joined);
  process.exit(91);
}
if (joined === 'run test:full') {
  const projectRoot = process.env.CANTONI_OAUTH_DEPLOY_CONTRACT_PROJECT_ROOT;
  const packDir = process.env.LAUNCH_OPERATOR_PACK_DIR;
  const zipRel = process.env.CANTONI_OAUTH_DEPLOY_CONTRACT_ZIP_REL;
  const manifestRel = process.env.CANTONI_OAUTH_DEPLOY_CONTRACT_MANIFEST_REL;
  const checksumsRel = process.env.CANTONI_OAUTH_DEPLOY_CONTRACT_CHECKSUMS_REL;
  const zipPath = path.join(projectRoot, zipRel);
  const manifestPath = path.join(projectRoot, manifestRel);
  const checksumsPath = path.join(projectRoot, checksumsRel);
  fs.mkdirSync(packDir, { recursive: true });
  fs.writeFileSync(zipPath, 'oauth deploy candidate fixture\\n');
  const zipHash = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
  const git = {
    commit: '${COMMIT}',
    short_commit: '${COMMIT.slice(0, 7)}',
    branch: '${BRANCH}',
    upstream: '${UPSTREAM}',
    remote_name: 'cantoni',
    remote_url: '${REMOTE_URL}',
    ahead: 0,
    behind: 0,
    dirty: false,
    status_entries: 0
  };
  fs.writeFileSync(manifestPath, JSON.stringify({
    ok: true,
    package_type: 'cloudflare_pages_manual_upload_v1',
    git,
    zip: { path: zipRel, bytes: fs.statSync(zipPath).size, sha256: zipHash },
    files_count: 28
  }, null, 2) + '\\n');
  fs.writeFileSync(checksumsPath, zipHash + '  candidate.zip\\n');
  fs.writeFileSync(path.join(packDir, 'cantoni-launch-operator-pack-fixture.json'), JSON.stringify({
    ok: true,
    git,
    cloudflare_deploy_candidate: {
      type: 'cloudflare_pages_deploy_candidate_v1',
      artifact_ready: true,
      git_ready: true,
      would_fix_live_contract: true,
      execution_ready: true,
      deployment_approval_required: true,
      deploy_allowed_without_approval: false,
      status: 'ready_for_explicit_deploy_approval',
      execution_blockers: [],
      non_site_blockers: ['cloudflare_dns_api_credentials', 'cantoni_email_dns'],
      git,
      package: {
        zip_path: zipRel,
        zip_sha256: zipHash,
        zip_bytes: fs.statSync(zipPath).size,
        manifest: manifestRel,
        checksums: checksumsRel,
        files_count: 28
      },
      live_drift_patch: {
        full_artifact_required: true,
        partial_upload_safe: false,
        files_count: 3,
        pages: ['/case-studies.html', '/termini-commerciali.html', '/privacy.html']
      },
      deploy_branch_policy: {
        default_direct_deploy_branch: 'preview-cantoni-site',
        production_branch: 'main',
        preview_deploy_clears_live_site_contract: false,
        live_site_contract_fix_requires_production_branch: true,
        production_approval_required: true,
        production_approval_environment: [
          'CLOUDFLARE_PAGES_BRANCH=main',
          'ALLOW_PRODUCTION_DEPLOY=yes',
          'CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production'
        ]
      }
    }
  }, null, 2) + '\\n');
}
`);

  await writeTool(path.join(toolsDir, 'bash'), `${toolPrelude}
const args = process.argv.slice(2);
write({ tool: 'bash', args });
if (args[0] && args[0].endsWith('/scripts/build_cloudflare_public_dir.sh')) process.exit(0);
console.error('unexpected bash call: ' + args.join(' '));
process.exit(92);
`);

  await writeTool(path.join(toolsDir, 'git'), `${toolPrelude}
const args = process.argv.slice(2);
write({ tool: 'git', args });
const joined = args.join(' ');
if (joined === 'rev-parse HEAD') {
  console.log('${COMMIT}');
  process.exit(0);
}
if (joined === 'rev-parse --abbrev-ref HEAD') {
  console.log('${BRANCH}');
  process.exit(0);
}
if (joined === 'rev-parse --abbrev-ref --symbolic-full-name @{u}') {
  console.log('${UPSTREAM}');
  process.exit(0);
}
if (joined === 'config --get remote.cantoni.url') {
  console.log('${REMOTE_URL}');
  process.exit(0);
}
if (joined === 'status --porcelain --untracked-files=normal') {
  if (process.env.CANTONI_OAUTH_DEPLOY_CONTRACT_GIT_DIRTY === '1') console.log(' M index.html');
  process.exit(0);
}
if (joined === 'rev-list --left-right --count HEAD...${UPSTREAM}') {
  console.log('0\\t0');
  process.exit(0);
}
console.error('unexpected git call: ' + joined);
process.exit(94);
`);

  await writeTool(path.join(toolsDir, 'wrangler'), `${toolPrelude}
const args = process.argv.slice(2);
write({ tool: 'wrangler', args });
if (
  args[0] === 'pages' &&
  args[1] === 'deploy' &&
  args.includes('--project-name') &&
  args.includes('--branch')
) {
  console.log('fake oauth wrangler deploy ok');
  process.exit(0);
}
console.error('unexpected wrangler call: ' + args.join(' '));
process.exit(93);
`);

  return { tmpDir, toolsDir, logPath, packDir, zipRel, manifestRel, checksumsRel };
}

async function readToolLog(logPath) {
  try {
    const source = await fs.readFile(logPath, 'utf8');
    return source.trim()
      ? source.trim().split('\n').map((line) => JSON.parse(line))
      : [];
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
}

function runDeploy({ toolsDir, logPath, env = {} }) {
  const deployEnv = {
    ...process.env,
    PATH: `${toolsDir}${path.delimiter}${process.env.PATH || ''}`,
    CANTONI_OAUTH_DEPLOY_CONTRACT_LOG: logPath,
    CLOUDFLARE_PAGES_PROJECT_NAME: PROJECT_NAME,
    CLOUDFLARE_CUSTOM_DOMAIN: DOMAIN,
    CANTONI_OAUTH_DEPLOY_CONTRACT_PROJECT_ROOT: PROJECT_ROOT,
    LAUNCH_OPERATOR_PACK_DIR: env.LAUNCH_OPERATOR_PACK_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/oauth-deploy-contract-missing'),
    CANTONI_OAUTH_DEPLOY_CONTRACT_ZIP_REL: env.CANTONI_OAUTH_DEPLOY_CONTRACT_ZIP_REL || 'sales-kit/generated/oauth-deploy-contract-missing/candidate.zip',
    CANTONI_OAUTH_DEPLOY_CONTRACT_MANIFEST_REL: env.CANTONI_OAUTH_DEPLOY_CONTRACT_MANIFEST_REL || 'sales-kit/generated/oauth-deploy-contract-missing/candidate.manifest.json',
    CANTONI_OAUTH_DEPLOY_CONTRACT_CHECKSUMS_REL: env.CANTONI_OAUTH_DEPLOY_CONTRACT_CHECKSUMS_REL || 'sales-kit/generated/oauth-deploy-contract-missing/candidate.SHA256SUMS',
    ...env
  };
  for (const [key, value] of Object.entries(deployEnv)) {
    if (value === null) delete deployEnv[key];
  }

  return new Promise((resolve) => {
    const child = spawn('/bin/bash', [DEPLOY_SCRIPT], {
      cwd: PROJECT_ROOT,
      env: deployEnv,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, 20000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: null, signal: null, stdout, stderr, error, timedOut });
    });
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr, error: null, timedOut });
    });
  });
}

async function main() {
  const fakeTools = await createFakeTools();
  try {
    const productionGuard = await runDeploy({
      toolsDir: fakeTools.toolsDir,
      logPath: fakeTools.logPath,
      env: {
        CLOUDFLARE_PAGES_BRANCH: 'main',
        ALLOW_PRODUCTION_DEPLOY: null,
        CANTONI_PRODUCTION_DEPLOY_APPROVAL: null
      }
    });
    assert(productionGuard.status !== 0, 'OAuth deploy should fail for main without production approvals');
    assert(productionGuard.stderr.includes('error=production_deploy_requires_explicit_allow'), 'production guard should be explicit');
    assert(!productionGuard.stdout.includes('step=git_deploy_state'), 'production guard must stop before git checks');
    assert((await readToolLog(fakeTools.logPath)).length === 0, 'production guard must not invoke tools');

    const dirtyGitGuard = await runDeploy({
      toolsDir: fakeTools.toolsDir,
      logPath: fakeTools.logPath,
      env: {
        CLOUDFLARE_PAGES_BRANCH: 'preview-contract',
        CANTONI_OAUTH_DEPLOY_CONTRACT_GIT_DIRTY: '1'
      }
    });
    assert(dirtyGitGuard.status !== 0, 'OAuth deploy should fail when git deploy state is dirty');
    assert(dirtyGitGuard.stdout.includes('step=git_deploy_state'), 'dirty git guard should run first');
    assert(dirtyGitGuard.stdout.includes('git_worktree_dirty'), 'dirty git guard should report git_worktree_dirty');
    assert(!dirtyGitGuard.stdout.includes('step=cloudflare_auth_preflight'), 'dirty git guard must stop before auth preflight');
    const afterDirtyLog = await readToolLog(fakeTools.logPath);
    assert(!afterDirtyLog.some((entry) => ['npm', 'bash', 'wrangler'].includes(entry.tool)), 'dirty git guard must not invoke npm/bash/wrangler');

    const success = await runDeploy({
      toolsDir: fakeTools.toolsDir,
      logPath: fakeTools.logPath,
      env: {
        CLOUDFLARE_PAGES_BRANCH: 'preview-contract',
        LAUNCH_OPERATOR_PACK_DIR: fakeTools.packDir,
        CANTONI_OAUTH_DEPLOY_CONTRACT_ZIP_REL: fakeTools.zipRel,
        CANTONI_OAUTH_DEPLOY_CONTRACT_MANIFEST_REL: fakeTools.manifestRel,
        CANTONI_OAUTH_DEPLOY_CONTRACT_CHECKSUMS_REL: fakeTools.checksumsRel
      }
    });
    assert(!success.timedOut, `OAuth deploy should not time out\nstdout=${success.stdout}\nstderr=${success.stderr}`);
    assert(!success.error, `OAuth deploy should not error: ${success.error?.message || success.error}`);
    assert(success.status === 0, `OAuth deploy should pass with fixtures\nstdout=${success.stdout}\nstderr=${success.stderr}`);
    assert(success.stdout.includes('step=git_deploy_state'), 'OAuth deploy should verify git state before auth');
    assert(success.stdout.includes('step=cloudflare_auth_preflight'), 'OAuth deploy should verify auth before tests');
    assert(success.stdout.includes('step=cloudflare_auth_recheck'), 'OAuth deploy should recheck auth after artifact checks');
    assert(success.stdout.includes('step=cloudflare_deploy_candidate'), 'OAuth deploy should verify deploy candidate before Wrangler deploy');
    assert(!success.stdout.includes('step=ensure_project'), 'OAuth deploy must not create or ensure projects implicitly');
    assert(success.stdout.includes('post_deploy_checks='), 'OAuth deploy should print post-deploy checks');
    for (const check of POST_DEPLOY_CHECKS) {
      assert(success.stdout.includes(check), `OAuth deploy should instruct operator to run ${check} after deploy`);
    }

    const log = await readToolLog(fakeTools.logPath);
    const npmCalls = log.filter((entry) => entry.tool === 'npm').map((entry) => entry.args.join(' '));
    assert(npmCalls.filter((call) => call === 'run audit:cloudflare-auth').length === 2, 'OAuth deploy should run auth audit twice');
    assert(npmCalls.includes('run test:full'), 'OAuth deploy should run full test suite before deploy');
    assert(npmCalls.includes('run test:artifact'), 'OAuth deploy should verify artifact integrity');
    const browserCall = log.find((entry) => entry.tool === 'npm' && entry.args.join(' ') === 'run test:browser');
    const paymentsCall = log.find((entry) => entry.tool === 'npm' && entry.args.join(' ') === 'run test:payments');
    assert(browserCall?.site_root === '.cloudflare-pages', 'OAuth deploy browser smoke should target artifact');
    assert(paymentsCall?.site_root === '.cloudflare-pages', 'OAuth deploy payment check should target artifact');
    assert(log.some((entry) => entry.tool === 'bash' && entry.args[0].endsWith('/scripts/build_cloudflare_public_dir.sh')), 'OAuth deploy should build Cloudflare public dir');

    const wranglerCalls = log.filter((entry) => entry.tool === 'wrangler');
    assert(wranglerCalls.length === 1, 'OAuth deploy should call wrangler exactly once');
    const deployArgs = wranglerCalls[0].args;
    assert(deployArgs[0] === 'pages' && deployArgs[1] === 'deploy', 'wrangler should deploy Pages');
    assert(deployArgs[2] === path.join(PROJECT_ROOT, '.cloudflare-pages'), 'wrangler should deploy only .cloudflare-pages');
    assert(deployArgs.includes('--project-name') && deployArgs[deployArgs.indexOf('--project-name') + 1] === PROJECT_NAME, 'wrangler should target Cantoni project');
    assert(deployArgs.includes('--branch') && deployArgs[deployArgs.indexOf('--branch') + 1] === 'preview-contract', 'wrangler should target preview branch');
    assert(!wranglerCalls.some((entry) => entry.args.join(' ').includes('project create')), 'OAuth deploy must not create Cloudflare projects implicitly');

    console.log(JSON.stringify({
      ok: true,
      checked: [
        'production_approval_guard',
        'git_deploy_state_guard',
        'oauth_auth_recheck',
        'deploy_candidate_gate',
        'artifact_only_deploy_path',
        'post_deploy_check_handoff',
        'no_implicit_project_create'
      ]
    }, null, 2));
  } finally {
    await fs.rm(fakeTools.packDir, { recursive: true, force: true });
    await fs.rm(fakeTools.tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
