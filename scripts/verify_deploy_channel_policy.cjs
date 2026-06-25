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
      'scripts/verify_cloudflare_deploy_auth.mjs'
    ],
    forbidden: []
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
