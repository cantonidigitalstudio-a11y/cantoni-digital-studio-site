import { spawnSync } from 'node:child_process';

const allowMissing = process.argv.includes('--allow-missing');
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME || 'cantonidigitalstudio';
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const wranglerBin = process.env.WRANGLER_BIN || 'wrangler';
const versionArgs = ['--version'];
const whoamiArgs = ['whoami'];
const pagesProjectListArgs = ['pages', 'project', 'list', '--json'];

function cleanOutput(value) {
  return String(value || '')
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/(\/accounts\/)[0-9a-f]{32}/gi, '$1********************************')
    .replace(/["']?\/Users\/[^"'\s]+\/Library\/Preferences\/\.wrangler\/logs\/wrangler-[^"'\s]+["']?/g, '<wrangler-log-redacted>')
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

const versionRun = runWrangler(versionArgs);
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

const versionOutput = outputFor(versionRun);
const whoamiOutput = outputFor(whoamiRun);
const pagesOutput = outputFor(pagesRun);

const stderr = whoamiOutput.stderr;
const stdout = whoamiOutput.stdout;
const combined = `${stdout}\n${stderr}\n${pagesOutput.stdout}\n${pagesOutput.stderr}`.trim();
const failures = [];

function parseJsonOutput(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (_error) {
    return null;
  }
}

function objectContainsProject(value, name) {
  if (!value) return false;
  if (Array.isArray(value)) return value.some((item) => objectContainsProject(item, name));
  if (typeof value === 'object') {
    if (value.name === name || value.project_name === name) return true;
    return Object.values(value).some((item) => objectContainsProject(item, name));
  }
  return false;
}

const pagesJson = parseJsonOutput(pagesOutput.stdout);
const projectListed = pagesRun?.status === 0 &&
  (objectContainsProject(pagesJson, projectName) || pagesOutput.stdout.includes(projectName));

function diagnosticFromOutputs() {
  if (whoamiRun.error) return 'wrangler_executable_unavailable';
  if (whoamiRun.status !== 0) return 'wrangler_not_authenticated';
  if (!pagesRun) return 'pages_api_not_checked';
  const pagesCombined = `${pagesOutput.stdout}\n${pagesOutput.stderr}`;
  if (pagesRun.error) return 'pages_api_command_error';
  if (/Authentication error\s*\[code:\s*10000\]/i.test(pagesCombined)) {
    return 'pages_api_authentication_error_10000';
  }
  if (pagesRun.status !== 0) return 'pages_api_access_error';
  if (!projectListed) return 'pages_project_not_listed';
  return 'ok';
}

function nextActionsFor(diagnosticCode) {
  if (diagnosticCode === 'ok') return [];
  if (diagnosticCode === 'wrangler_executable_unavailable') {
    return [
      `Install or expose the Wrangler executable used by WRANGLER_BIN=${wranglerBin}.`,
      'Re-run `npm run audit:cloudflare-auth` before any deploy attempt.'
    ];
  }
  if (diagnosticCode === 'wrangler_not_authenticated') {
    return [
      'Authenticate Wrangler with the Cantoni Digital Studio Cloudflare account.',
      'Do not reuse Excellentia, EC8, Mr Collins, Diogomes, or personal Cloudflare sessions.',
      'Re-run `npm run audit:cloudflare-auth` and require Pages project listing to pass.'
    ];
  }
  if (diagnosticCode === 'pages_api_authentication_error_10000') {
    return [
      'Refresh the active Wrangler OAuth session or provide a Cloudflare token for the Cantoni account with Account > Cloudflare Pages > Edit.',
      'Confirm the active Cloudflare account can list Pages projects before deploying.',
      'Keep using the verified manual upload/operator pack as handoff material until the audit passes.'
    ];
  }
  if (diagnosticCode === 'pages_project_not_listed') {
    return [
      `Confirm the active Cantoni Cloudflare account has a Pages project named ${projectName}.`,
      'Do not let deploy scripts create a new Pages project implicitly; create or link the intended project in Cloudflare first.',
      'Re-run `npm run audit:cloudflare-auth` and require project_listed=true before any deploy attempt.'
    ];
  }
  return [
    'Inspect the sanitized pages_project_list stderr/stdout in this audit.',
    'Fix Cloudflare account, token, or Pages permission scope for the Cantoni account.',
    'Re-run `npm run audit:cloudflare-auth` before deploy.'
  ];
}

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

const diagnosticCode = diagnosticFromOutputs();
const nextActions = nextActionsFor(diagnosticCode);

if (pagesRun?.error) {
  failures.push({
    id: 'cloudflare_pages_api',
    reason: `Unable to verify Cloudflare Pages access: ${pagesRun.error.message}`
  });
} else if (diagnosticCode === 'pages_api_authentication_error_10000') {
  failures.push({
    id: 'cloudflare_pages_api',
    reason: 'Cloudflare Pages API returned Authentication error [code: 10000] for the active token/session.'
  });
} else if (pagesRun && pagesRun.status !== 0) {
  failures.push({
    id: 'cloudflare_pages_api',
    reason: 'Cloudflare token/session cannot access the Pages projects API for the selected account.'
  });
} else if (pagesRun && pagesRun.status === 0 && !projectListed) {
  failures.push({
    id: 'cloudflare_pages_project',
    reason: `Cloudflare Pages project ${projectName} was not listed for the active token/session.`
  });
}

if (!accountId && /account IDs|CLOUDFLARE_ACCOUNT_ID|account_id/i.test(combined)) {
  failures.push({
    id: 'cloudflare_account_id',
    reason: 'Wrangler could not infer an account ID; set a verified CLOUDFLARE_ACCOUNT_ID only for the Cantoni Cloudflare account.'
  });
}

const result = {
  ok: failures.length === 0,
  allow_missing: allowMissing,
  project_name: projectName,
  project_listed: projectListed,
  has_cloudflare_account_id: Boolean(accountId),
  diagnostic_code: diagnosticCode,
  next_actions: nextActions,
  commands: {
    version: commandLabel(versionArgs),
    whoami: commandLabel(whoamiArgs),
    pages_project_list: commandLabel(pagesProjectListArgs)
  },
  version: versionOutput,
  whoami: whoamiOutput,
  pages_project_list: pagesOutput,
  failures
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0 && !allowMissing) {
  process.exit(1);
}
