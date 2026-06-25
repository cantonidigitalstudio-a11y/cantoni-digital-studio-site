import { spawnSync } from 'node:child_process';

const allowMissing = process.argv.includes('--allow-missing');
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME || 'cantonidigitalstudio';
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const wranglerBin = process.env.WRANGLER_BIN || 'wrangler';
const whoamiArgs = ['whoami'];
const pagesProjectListArgs = ['pages', 'project', 'list'];

function cleanOutput(value) {
  return String(value || '')
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/(\/accounts\/)[0-9a-f]{32}/gi, '$1********************************')
    .replace(/(Authorization:\s*Bearer\s+)[^\s]+/gi, '$1************************************')
    .replace(/gho_[A-Za-z0-9_]+/g, 'gho_************************************')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer ************************************')
    .replace(/(api[-_ ]?key\s*[:=]\s*)[A-Za-z0-9._~+/-]{16,}/gi, '$1************************************')
    .replace(/(token(?:\s+value)?\s*[:=]\s*)[A-Za-z0-9._~+/-]{16,}/gi, '$1************************************')
    .replace(/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{16,}/g, '************************************')
    .trim();
}

function runWrangler(args) {
  return spawnSync(wranglerBin, args, {
    encoding: 'utf8',
    shell: false
  });
}

function commandLabel(args) {
  return [wranglerBin, ...args].join(' ');
}

const whoamiRun = runWrangler(whoamiArgs);
const pagesRun = whoamiRun.error ? null : runWrangler(pagesProjectListArgs);

function outputFor(commandRun) {
  return {
    stdout: cleanOutput(commandRun?.stdout),
    stderr: cleanOutput(commandRun?.stderr),
    status: commandRun?.status ?? null,
    signal: commandRun?.signal ?? null,
    error: commandRun?.error ? cleanOutput(commandRun.error.message) : null
  };
}

const whoamiOutput = outputFor(whoamiRun);
const pagesOutput = outputFor(pagesRun);

const stderr = whoamiOutput.stderr;
const stdout = whoamiOutput.stdout;
const combined = `${stdout}\n${stderr}\n${pagesOutput.stdout}\n${pagesOutput.stderr}`.trim();
const failures = [];

if (whoamiRun.error) {
  failures.push({
    id: 'wrangler_executable',
    reason: `Unable to run ${wranglerBin}: ${whoamiRun.error.message}`
  });
} else if (whoamiRun.status !== 0) {
  failures.push({
    id: 'wrangler_auth',
    reason: 'Cloudflare Wrangler is not authenticated or cannot retrieve account IDs.'
  });
}

if (pagesRun?.error) {
  failures.push({
    id: 'cloudflare_pages_api',
    reason: `Unable to verify Cloudflare Pages access: ${pagesRun.error.message}`
  });
} else if (pagesRun && pagesRun.status !== 0) {
  failures.push({
    id: 'cloudflare_pages_api',
    reason: 'Cloudflare token/session cannot access the Pages projects API for the selected account.'
  });
}

if (!accountId && /account IDs|CLOUDFLARE_ACCOUNT_ID|account_id/i.test(combined)) {
  failures.push({
    id: 'cloudflare_account_id',
    reason: 'Wrangler could not infer an account ID; set a verified CLOUDFLARE_ACCOUNT_ID only for the Cantoni Cloudflare account.'
  });
}

const projectListed = pagesRun?.status === 0 && pagesOutput.stdout.includes(projectName);

const result = {
  ok: failures.length === 0,
  allow_missing: allowMissing,
  project_name: projectName,
  project_listed: projectListed,
  has_cloudflare_account_id: Boolean(accountId),
  commands: {
    whoami: commandLabel(whoamiArgs),
    pages_project_list: commandLabel(pagesProjectListArgs)
  },
  whoami: whoamiOutput,
  pages_project_list: pagesOutput,
  failures
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0 && !allowMissing) {
  process.exit(1);
}
