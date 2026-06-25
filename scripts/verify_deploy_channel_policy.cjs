const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

const checks = [
  {
    file: 'scripts/deploy_netlify_preview.sh',
    required: [
      'ALLOW_NETLIFY_FALLBACK',
      'NETLIFY_TEAM_VERIFIED_AS_CANTONI',
      'error=missing_site_target',
      '--dir "$PUBLIC_DIR"',
      '--no-build'
    ],
    forbidden: [
      '--prod'
    ]
  },
  {
    file: 'scripts/deploy_netlify_prod.sh',
    required: [
      'ALLOW_NETLIFY_FALLBACK',
      'NETLIFY_TEAM_VERIFIED_AS_CANTONI',
      'ALLOW_PRODUCTION_DEPLOY',
      'error=missing_site_target',
      '--dir "$PUBLIC_DIR"',
      '--no-build',
      '--prod'
    ],
    forbidden: []
  },
  {
    file: 'DEPLOY_RUNBOOK.md',
    required: [
      'fallback',
      'Cloudflare Pages',
      'ALLOW_NETLIFY_FALLBACK=yes',
      'NETLIFY_TEAM_VERIFIED_AS_CANTONI=yes',
      'npm run audit:launch-readiness'
    ],
    forbidden: [
      'blocco attuale: credenziale Netlify invalida'
    ]
  },
  {
    file: 'CLOUDFLARE_DEPLOY_RUNBOOK.md',
    required: [
      'Cloudflare Pages',
      'npm run audit:cloudflare-auth',
      'npm run audit:git-deploy-state',
      'scripts/verify_cloudflare_deploy_auth.mjs',
      'npm run deploy:cloudflare:direct',
      'npm run test:cloudflare-auth-contract',
      'npm run test:cloudflare-direct-deploy-contract',
      'npm run test:cloudflare-oauth-deploy-contract',
      'npm run audit:cloudflare-pages-api',
      'npm run audit:cloudflare-dns-api',
      'CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct',
      '## Cosa fa lo script token diretto\n1. verifica `node scripts/verify_git_deploy_state.cjs`\n2. verifica `node scripts/verify_cloudflare_api_credentials.mjs --pages-only`'
    ],
    forbidden: []
  },
  {
    file: 'scripts/deploy_cloudflare_pages.sh',
    required: [
      'node scripts/verify_git_deploy_state.cjs',
      'npm run audit:cloudflare-auth',
      'npm run test:full',
      'SITE_ROOT=.cloudflare-pages npm run test:browser',
      'SITE_ROOT=.cloudflare-pages npm run test:payments',
      'node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready',
      'ALLOW_PRODUCTION_DEPLOY',
      'CANTONI_PRODUCTION_DEPLOY_APPROVAL',
      'deploy-cantoni-production',
      'pages deploy "$PUBLIC_DIR"',
      '--project-name "$PROJECT_NAME"',
      '--branch "$DEPLOY_BRANCH"'
    ],
    forbidden: [
      'pages project create',
      'step=ensure_project'
    ]
  },
  {
    file: 'scripts/deploy_cloudflare_pages_direct.sh',
    required: [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
      'CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL',
      'deploy-cantoni-pages-direct',
      'node scripts/verify_cloudflare_api_credentials.mjs --pages-only',
      'ALLOW_PRODUCTION_DEPLOY',
      'CANTONI_PRODUCTION_DEPLOY_APPROVAL',
      'deploy-cantoni-production',
      'node scripts/verify_git_deploy_state.cjs',
      'npm run test:full',
      'bash "$ROOT_DIR/scripts/build_cloudflare_public_dir.sh"',
      'pages deploy "$PUBLIC_DIR"',
      '--project-name "$PROJECT_NAME"',
      '--branch "$DEPLOY_BRANCH"'
    ],
    forbidden: [
      'npx'
    ]
  }
];

const failures = [];

for (const check of checks) {
  const source = read(check.file);
  for (const snippet of check.required) {
    try {
      assert.ok(source.includes(snippet));
    } catch {
      failures.push(`${check.file}: missing "${snippet}"`);
    }
  }
  for (const snippet of check.forbidden) {
    if (source.includes(snippet)) failures.push(`${check.file}: forbidden stale text "${snippet}"`);
  }
}

const report = {
  ok: failures.length === 0,
  checked: checks.map((check) => check.file),
  primary_deploy_channel: 'cloudflare-pages',
  fallback_deploy_channel: 'netlify-explicit-only'
};

console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
