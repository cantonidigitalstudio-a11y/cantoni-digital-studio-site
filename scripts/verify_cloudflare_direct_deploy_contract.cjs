#!/usr/bin/env node

const fs = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEPLOY_SCRIPT = path.join(PROJECT_ROOT, 'scripts/deploy_cloudflare_pages_direct.sh');
const FAKE_TOKEN = 'cf_test_token_for_direct_deploy_contract_only_1234567890';
const ACCOUNT_ID = '33333333333333333333333333333333';
const COMMIT = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
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

function jsonResponse(res, status, payload) {
  res.writeHead(status, {
    'connection': 'close',
    'content-type': 'application/json'
  });
  res.end(JSON.stringify(payload));
}

function startCloudflareFixture() {
  const requests = [];
  const sockets = new Set();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    requests.push({
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      authorization: req.headers.authorization || ''
    });

    if (req.headers.authorization !== `Bearer ${FAKE_TOKEN}`) {
      jsonResponse(res, 403, {
        success: false,
        errors: [{ code: 9109, message: 'Unauthorized token fixture' }]
      });
      return;
    }

    if (url.pathname === '/user/tokens/verify') {
      jsonResponse(res, 200, {
        success: true,
        errors: [],
        result: { id: 'direct-token-fixture-id', status: 'active' }
      });
      return;
    }

    if (url.pathname === `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`) {
      jsonResponse(res, 200, {
        success: true,
        errors: [],
        result: [{ id: 'direct-deployment-fixture-id', project_name: PROJECT_NAME }]
      });
      return;
    }

    jsonResponse(res, 404, {
      success: false,
      errors: [{ code: 1003, message: `Unhandled fixture path ${url.pathname}` }]
    });
  });

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, sockets, requests, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

function closeServer(server, sockets) {
  return new Promise((resolve, reject) => {
    for (const socket of sockets) socket.destroy();
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function writeTool(filePath, source) {
  await fs.writeFile(filePath, source);
  await fs.chmod(filePath, 0o755);
}

async function createFakeTools() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cantoni-direct-deploy-contract-'));
  const toolsDir = path.join(tmpDir, 'bin');
  const logPath = path.join(tmpDir, 'tool-log.jsonl');
  const packDir = path.join(PROJECT_ROOT, 'sales-kit/generated', `direct-deploy-contract-${path.basename(tmpDir)}`);
  const zipRel = path.relative(PROJECT_ROOT, path.join(packDir, 'candidate.zip')).split(path.sep).join('/');
  const manifestRel = path.relative(PROJECT_ROOT, path.join(packDir, 'candidate.manifest.json')).split(path.sep).join('/');
  const checksumsRel = path.relative(PROJECT_ROOT, path.join(packDir, 'candidate.SHA256SUMS')).split(path.sep).join('/');
  await fs.mkdir(toolsDir, { recursive: true });

  const toolPrelude = [
    '#!/usr/bin/env node',
    "const fs = require('fs');",
    "const path = require('path');",
    "const crypto = require('crypto');",
    "const logPath = process.env.CANTONI_DIRECT_DEPLOY_CONTRACT_LOG;",
    "function write(entry) { fs.appendFileSync(logPath, JSON.stringify(entry) + '\\n'); }",
    ''
  ].join('\n');

  await writeTool(path.join(toolsDir, 'npm'), `${toolPrelude}
const args = process.argv.slice(2);
write({ tool: 'npm', args, site_root: process.env.SITE_ROOT || null });
const allowed = new Set([
  'run test:full',
  'run test:artifact',
  'run test:browser',
  'run test:payments'
]);
if (!allowed.has(args.join(' '))) {
  console.error('unexpected npm call: ' + args.join(' '));
  process.exit(91);
}
if (args.join(' ') === 'run test:full') {
  const projectRoot = process.env.CANTONI_DIRECT_DEPLOY_CONTRACT_PROJECT_ROOT;
  const packDir = process.env.LAUNCH_OPERATOR_PACK_DIR;
  const zipRel = process.env.CANTONI_DIRECT_DEPLOY_CONTRACT_ZIP_REL;
  const manifestRel = process.env.CANTONI_DIRECT_DEPLOY_CONTRACT_MANIFEST_REL;
  const checksumsRel = process.env.CANTONI_DIRECT_DEPLOY_CONTRACT_CHECKSUMS_REL;
  const zipPath = path.join(projectRoot, zipRel);
  const manifestPath = path.join(projectRoot, manifestRel);
  const checksumsPath = path.join(projectRoot, checksumsRel);
  fs.mkdirSync(packDir, { recursive: true });
  fs.writeFileSync(zipPath, 'direct deploy candidate fixture\\n');
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
  if (process.env.CANTONI_DIRECT_DEPLOY_CONTRACT_GIT_DIRTY === '1') console.log(' M index.html');
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
  console.log('fake wrangler deploy ok');
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

function runDeploy({ apiBaseUrl, toolsDir, logPath, env = {} }) {
  const deployEnv = {
    ...process.env,
    PATH: `${toolsDir}${path.delimiter}${process.env.PATH || ''}`,
    CANTONI_DIRECT_DEPLOY_CONTRACT_LOG: logPath,
    CLOUDFLARE_API_BASE_URL: apiBaseUrl,
    CLOUDFLARE_PAGES_PROJECT_NAME: PROJECT_NAME,
    CLOUDFLARE_CUSTOM_DOMAIN: DOMAIN,
    CANTONI_DIRECT_DEPLOY_CONTRACT_PROJECT_ROOT: PROJECT_ROOT,
    LAUNCH_OPERATOR_PACK_DIR: env.LAUNCH_OPERATOR_PACK_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/direct-deploy-contract-missing'),
    CANTONI_DIRECT_DEPLOY_CONTRACT_ZIP_REL: env.CANTONI_DIRECT_DEPLOY_CONTRACT_ZIP_REL || 'sales-kit/generated/direct-deploy-contract-missing/candidate.zip',
    CANTONI_DIRECT_DEPLOY_CONTRACT_MANIFEST_REL: env.CANTONI_DIRECT_DEPLOY_CONTRACT_MANIFEST_REL || 'sales-kit/generated/direct-deploy-contract-missing/candidate.manifest.json',
    CANTONI_DIRECT_DEPLOY_CONTRACT_CHECKSUMS_REL: env.CANTONI_DIRECT_DEPLOY_CONTRACT_CHECKSUMS_REL || 'sales-kit/generated/direct-deploy-contract-missing/candidate.SHA256SUMS',
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
  const fixture = await startCloudflareFixture();
  const fakeTools = await createFakeTools();
  try {
    const missingToken = await runDeploy({
      apiBaseUrl: fixture.baseUrl,
      toolsDir: fakeTools.toolsDir,
      logPath: fakeTools.logPath,
      env: {
        CLOUDFLARE_API_TOKEN: null,
        CLOUDFLARE_ACCOUNT_ID: null,
        CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL: null
      }
    });
    assert(missingToken.status !== 0, 'deploy should fail without CLOUDFLARE_API_TOKEN');
    assert(missingToken.stderr.includes('error=missing_cloudflare_api_token'), 'missing token guard should be explicit');
    assert(!missingToken.stdout.includes('step=tests'), 'missing token guard must stop before tests');
    assert((await readToolLog(fakeTools.logPath)).length === 0, 'missing token guard must not invoke npm/bash/wrangler');
    assert(fixture.requests.length === 0, 'missing token guard must not call Cloudflare API');

    const productionGuard = await runDeploy({
      apiBaseUrl: fixture.baseUrl,
      toolsDir: fakeTools.toolsDir,
      logPath: fakeTools.logPath,
      env: {
        CLOUDFLARE_API_TOKEN: FAKE_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
        CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL: 'deploy-cantoni-pages-direct',
        CLOUDFLARE_PAGES_BRANCH: 'main',
        ALLOW_PRODUCTION_DEPLOY: null,
        CANTONI_PRODUCTION_DEPLOY_APPROVAL: null
      }
    });
    assert(productionGuard.status !== 0, 'direct deploy should fail for main without production approvals');
    assert(productionGuard.stderr.includes('error=production_deploy_requires_explicit_allow'), 'production guard should be explicit');
    assert(!productionGuard.stdout.includes('step=cloudflare_pages_api_preflight'), 'production guard must stop before API preflight');
    assert((await readToolLog(fakeTools.logPath)).length === 0, 'production guard must not invoke npm/bash/wrangler');
    assert(fixture.requests.length === 0, 'production guard must not call Cloudflare API');

    const dirtyGitGuard = await runDeploy({
      apiBaseUrl: fixture.baseUrl,
      toolsDir: fakeTools.toolsDir,
      logPath: fakeTools.logPath,
      env: {
        CLOUDFLARE_API_TOKEN: FAKE_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
        CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL: 'deploy-cantoni-pages-direct',
        CLOUDFLARE_PAGES_BRANCH: 'preview-contract',
        CANTONI_DIRECT_DEPLOY_CONTRACT_GIT_DIRTY: '1'
      }
    });
    assert(dirtyGitGuard.status !== 0, 'direct deploy should fail when git deploy state is dirty');
    assert(dirtyGitGuard.stdout.includes('step=git_deploy_state'), 'dirty git guard should run before Cloudflare API preflight');
    assert(dirtyGitGuard.stdout.includes('git_worktree_dirty'), 'dirty git guard should report git_worktree_dirty');
    assert(!dirtyGitGuard.stdout.includes('step=cloudflare_pages_api_preflight'), 'dirty git guard must stop before Cloudflare API preflight');
    assert(!dirtyGitGuard.stdout.includes(FAKE_TOKEN), 'dirty git guard stdout must not leak token');
    assert(!dirtyGitGuard.stderr.includes(FAKE_TOKEN), 'dirty git guard stderr must not leak token');
    assert(fixture.requests.length === 0, 'dirty git guard must not call Cloudflare API');
    const afterDirtyLog = await readToolLog(fakeTools.logPath);
    assert(!afterDirtyLog.some((entry) => ['npm', 'bash', 'wrangler'].includes(entry.tool)), 'dirty git guard must not invoke npm/bash/wrangler');

    const success = await runDeploy({
      apiBaseUrl: fixture.baseUrl,
      toolsDir: fakeTools.toolsDir,
      logPath: fakeTools.logPath,
      env: {
        CLOUDFLARE_API_TOKEN: FAKE_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
        CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL: 'deploy-cantoni-pages-direct',
        CLOUDFLARE_PAGES_BRANCH: 'preview-contract',
        LAUNCH_OPERATOR_PACK_DIR: fakeTools.packDir,
        CANTONI_DIRECT_DEPLOY_CONTRACT_ZIP_REL: fakeTools.zipRel,
        CANTONI_DIRECT_DEPLOY_CONTRACT_MANIFEST_REL: fakeTools.manifestRel,
        CANTONI_DIRECT_DEPLOY_CONTRACT_CHECKSUMS_REL: fakeTools.checksumsRel
      }
    });
    assert(!success.timedOut, `direct deploy should not time out\nstdout=${success.stdout}\nstderr=${success.stderr}`);
    assert(!success.error, `direct deploy should not error: ${success.error?.message || success.error}`);
    assert(success.status === 0, `direct deploy should pass with fixture credentials\nstdout=${success.stdout}\nstderr=${success.stderr}`);
    assert(!success.stdout.includes(FAKE_TOKEN), 'direct deploy stdout must not leak token');
    assert(!success.stderr.includes(FAKE_TOKEN), 'direct deploy stderr must not leak token');
    assert(success.stdout.includes('deploy_channel=cloudflare-pages-direct-token'), 'direct deploy should report deploy channel');
    assert(success.stdout.includes('step=git_deploy_state'), 'direct deploy should verify git state before Cloudflare API preflight');
    assert(success.stdout.includes('step=cloudflare_deploy_candidate'), 'direct deploy should verify deploy candidate before Wrangler deploy');
    assert(success.stdout.includes('post_deploy_checks='), 'direct deploy should print post-deploy checks');
    for (const check of POST_DEPLOY_CHECKS) {
      assert(success.stdout.includes(check), `direct deploy should instruct operator to run ${check} after deploy`);
    }

    const apiPaths = fixture.requests.map((request) => request.path);
    assert(apiPaths.filter((item) => item === '/user/tokens/verify').length === 2, 'direct deploy should verify token before and after tests');
    assert(apiPaths.filter((item) => item === `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`).length === 2, 'direct deploy should verify Pages before and after tests');
    assert(!apiPaths.some((item) => item.startsWith('/zones/')), 'direct deploy pages-only preflight must not call DNS API');
    assert(fixture.requests.every((request) => request.method === 'GET'), 'Cloudflare preflight should use GET only');
    assert(fixture.requests.every((request) => request.authorization === `Bearer ${FAKE_TOKEN}`), 'Cloudflare preflight should use bearer auth');

    const log = await readToolLog(fakeTools.logPath);
    const gitCalls = log.filter((entry) => entry.tool === 'git').map((entry) => entry.args.join(' '));
    assert(gitCalls.includes('status --porcelain --untracked-files=normal'), 'direct deploy should check clean worktree');
    assert(gitCalls.includes(`rev-list --left-right --count HEAD...${UPSTREAM}`), 'direct deploy should check upstream alignment');
    const npmCalls = log.filter((entry) => entry.tool === 'npm').map((entry) => entry.args.join(' '));
    assert(npmCalls.includes('run test:full'), 'direct deploy should run full test suite before deploy');
    assert(npmCalls.includes('run test:artifact'), 'direct deploy should verify artifact integrity');
    assert(log.some((entry) => entry.tool === 'bash' && entry.args[0].endsWith('/scripts/build_cloudflare_public_dir.sh')), 'direct deploy should build Cloudflare public dir');
    const browserCall = log.find((entry) => entry.tool === 'npm' && entry.args.join(' ') === 'run test:browser');
    const paymentsCall = log.find((entry) => entry.tool === 'npm' && entry.args.join(' ') === 'run test:payments');
    assert(browserCall?.site_root === '.cloudflare-pages', 'direct deploy browser smoke should target artifact');
    assert(paymentsCall?.site_root === '.cloudflare-pages', 'direct deploy payment check should target artifact');

    const wranglerCalls = log.filter((entry) => entry.tool === 'wrangler');
    assert(wranglerCalls.length === 1, 'direct deploy should call wrangler exactly once');
    const deployArgs = wranglerCalls[0].args;
    assert(deployArgs[0] === 'pages' && deployArgs[1] === 'deploy', 'wrangler should deploy Pages');
    assert(deployArgs[2] === path.join(PROJECT_ROOT, '.cloudflare-pages'), 'wrangler should deploy only .cloudflare-pages');
    assert(deployArgs.includes('--project-name') && deployArgs[deployArgs.indexOf('--project-name') + 1] === PROJECT_NAME, 'wrangler should target Cantoni project');
    assert(deployArgs.includes('--branch') && deployArgs[deployArgs.indexOf('--branch') + 1] === 'preview-contract', 'wrangler should target preview branch in contract');

    console.log(JSON.stringify({
      ok: true,
      checked: [
        'missing_token_guard',
        'production_approval_guard',
        'git_deploy_state_guard',
        'pages_only_preflight',
        'deploy_candidate_gate',
        'artifact_only_deploy_path',
        'preview_branch_deploy',
        'post_deploy_check_handoff',
        'token_redaction'
      ]
    }, null, 2));
  } finally {
    await closeServer(fixture.server, fixture.sockets);
    await fs.rm(fakeTools.packDir, { recursive: true, force: true });
    await fs.rm(fakeTools.tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
