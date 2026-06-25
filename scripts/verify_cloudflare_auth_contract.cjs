#!/usr/bin/env node

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = 'scripts/verify_cloudflare_deploy_auth.mjs';
const PROJECT_NAME = 'cantonidigitalstudio';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function writeTool(filePath, source) {
  await fs.writeFile(filePath, source);
  await fs.chmod(filePath, 0o755);
}

async function createFakeWrangler() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cantoni-cloudflare-auth-contract-'));
  const wranglerPath = path.join(tmpDir, 'wrangler');
  await writeTool(wranglerPath, `#!/usr/bin/env node
const args = process.argv.slice(2);
const mode = process.env.CANTONI_AUTH_CONTRACT_MODE || 'listed';
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME || '${PROJECT_NAME}';

if (args.join(' ') === '--version') {
  console.log('wrangler 4.66.0');
  process.exit(0);
}

if (args.join(' ') === 'whoami') {
  if (mode === 'not_authenticated') {
    console.error('Not logged in.');
    process.exit(1);
  }
  console.log('Account Name: Cantoni Digital Studio');
  console.log('Account ID: 11111111111111111111111111111111');
  process.exit(0);
}

if (args.join(' ') === 'pages project list --json') {
  if (mode === 'auth_error') {
    console.error('Authentication error [code: 10000]');
    process.exit(1);
  }
  if (mode === 'missing_project') {
    console.log(JSON.stringify([{ name: 'other-pages-project' }]));
    process.exit(0);
  }
  console.log(JSON.stringify([{ name: projectName }]));
  process.exit(0);
}

console.error('unexpected wrangler call: ' + args.join(' '));
process.exit(91);
`);
  return { tmpDir, wranglerPath };
}

function runAudit({ wranglerPath, mode, args = [] }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, ...args], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        WRANGLER_BIN: wranglerPath,
        CANTONI_AUTH_CONTRACT_MODE: mode,
        CLOUDFLARE_PAGES_PROJECT_NAME: PROJECT_NAME
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, 10000);

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

function parseResult(run) {
  assert(!run.timedOut, `auth audit timed out\nstdout=${run.stdout}\nstderr=${run.stderr}`);
  assert(!run.error, `auth audit errored: ${run.error?.message || run.error}`);
  return JSON.parse(run.stdout);
}

async function main() {
  const { tmpDir, wranglerPath } = await createFakeWrangler();
  try {
    const listed = await runAudit({ wranglerPath, mode: 'listed' });
    assert(listed.status === 0, `listed project should pass\nstdout=${listed.stdout}\nstderr=${listed.stderr}`);
    const listedParsed = parseResult(listed);
    assert(listedParsed.ok === true, 'listed project should return ok=true');
    assert(listedParsed.diagnostic_code === 'ok', 'listed project diagnostic should be ok');
    assert(listedParsed.project_listed === true, 'listed project should report project_listed=true');

    const missing = await runAudit({ wranglerPath, mode: 'missing_project' });
    assert(missing.status !== 0, 'missing project should fail without --allow-missing');
    const missingParsed = parseResult(missing);
    assert(missingParsed.ok === false, 'missing project should return ok=false');
    assert(missingParsed.diagnostic_code === 'pages_project_not_listed', 'missing project diagnostic should be pages_project_not_listed');
    assert(missingParsed.project_listed === false, 'missing project should report project_listed=false');
    assert(missingParsed.failures.some((failure) => failure.id === 'cloudflare_pages_project'), 'missing project should emit cloudflare_pages_project failure');

    const allowedMissing = await runAudit({
      wranglerPath,
      mode: 'missing_project',
      args: ['--allow-missing']
    });
    assert(allowedMissing.status === 0, 'missing project with --allow-missing should keep audit command nonfatal');
    const allowedMissingParsed = parseResult(allowedMissing);
    assert(allowedMissingParsed.ok === false, '--allow-missing should not convert missing project to ok=true');
    assert(allowedMissingParsed.diagnostic_code === 'pages_project_not_listed', '--allow-missing should preserve diagnostic code');

    const authError = await runAudit({ wranglerPath, mode: 'auth_error' });
    assert(authError.status !== 0, 'Pages API auth error should fail');
    const authErrorParsed = parseResult(authError);
    assert(authErrorParsed.diagnostic_code === 'pages_api_authentication_error_10000', 'auth error diagnostic should preserve Cloudflare 10000 code');
    assert(authErrorParsed.failures.some((failure) => failure.id === 'cloudflare_pages_api'), 'auth error should emit cloudflare_pages_api failure');

    const notAuthenticated = await runAudit({ wranglerPath, mode: 'not_authenticated' });
    assert(notAuthenticated.status !== 0, 'not authenticated should fail');
    const notAuthenticatedParsed = parseResult(notAuthenticated);
    assert(notAuthenticatedParsed.diagnostic_code === 'wrangler_not_authenticated', 'not authenticated diagnostic should be wrangler_not_authenticated');
    assert(notAuthenticatedParsed.failures.some((failure) => failure.id === 'wrangler_auth'), 'not authenticated should emit wrangler_auth failure');

    console.log(JSON.stringify({
      ok: true,
      checked: [
        'listed_project_passes',
        'missing_project_blocks',
        'allow_missing_still_reports_blocked',
        'pages_api_auth_error_detected',
        'wrangler_not_authenticated_detected'
      ]
    }, null, 2));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
