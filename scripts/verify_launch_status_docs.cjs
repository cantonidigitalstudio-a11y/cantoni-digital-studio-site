const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function main() {
  const failures = [];
  const historicalStatus = read('sales-kit/cascade_status_2026-05-16.md');
  const historicalHeader = historicalStatus.split('\n').slice(0, 12).join('\n');
  const readme = read('README.md');
  const cloudflareRunbook = read('CLOUDFLARE_DEPLOY_RUNBOOK.md');
  const outboundPause = read('sales-kit/outbound_pause.flag');

  for (const required of [
    'snapshot storico',
    'npm run audit:launch-readiness',
    'launch operator pack',
    'go-live non e',
    'live_site_contract',
    'cloudflare_pages_deploy_auth',
    'cloudflare_dns_api_credentials',
    'cantoni_email_dns'
  ]) {
    if (!historicalHeader.includes(required)) {
      failures.push(`sales-kit/cascade_status_2026-05-16.md: historical header must include "${required}"`);
    }
  }

  if (!readme.includes('`npm run audit:launch-readiness` ricostruisce anche `.cloudflare-pages`')) {
    failures.push('README.md: launch readiness must be documented as the current deploy gate');
  }
  if (!readme.includes('contract_drift_patch') || !readme.includes('Live Drift Deploy Patch')) {
    failures.push('README.md: must document the live drift patch manifest and operator-pack section');
  }
  if (!readme.includes('export:external-unblock-handoff') || !readme.includes('test:external-unblock-handoff')) {
    failures.push('README.md: must document the external unblock handoff export and verifier');
  }
  if (!readme.includes('cantoni-external-unblock-handoff-latest')) {
    failures.push('README.md: must document the stable latest external unblock handoff aliases');
  }
  if (!readme.includes('cantoni-launch-operator-pack-latest')) {
    failures.push('README.md: must document the stable latest launch operator pack aliases');
  }
  if (!readme.includes('cantoni-launch-handoff-latest')) {
    failures.push('README.md: must document the stable latest launch handoff aliases');
  }
  if (!readme.includes('cantoni-live-drift-latest')) {
    failures.push('README.md: must document the stable latest live drift aliases');
  }
  if (!readme.includes('cantoni-email-dns-handoff-latest')) {
    failures.push('README.md: must document the stable latest email DNS handoff aliases');
  }
  if (!readme.includes('cantoni-cloudflare-pages-manual-upload-latest')) {
    failures.push('README.md: must document the stable latest Cloudflare manual upload aliases');
  }
  if (!readme.includes('external_unblock_handoff')) {
    failures.push('README.md: must document the external unblock handoff readiness gate');
  }
  if (!readme.includes('npm run audit:post-unblock-launch') || !readme.includes('npm run test:post-unblock-launch')) {
    failures.push('README.md: must document strict and nonfatal post-unblock launch audits');
  }
  if (!readme.includes('stato Git deploy') || !readme.includes('npm run audit:git-deploy-state')) {
    failures.push('README.md: must document Git deploy state as part of launch readiness');
  }
  if (!readme.includes('preview-cantoni-site') || !readme.includes('CLOUDFLARE_PAGES_BRANCH=main') || !readme.includes('live_site_contract')) {
    failures.push('README.md: must document preview-vs-production branch behavior for live contract closure');
  }
  if (!cloudflareRunbook.includes('Stato verificato 2026-06-25')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must carry the current verified Cloudflare blocker date');
  }
  if (!/Live\s+Drift\s+Deploy\s+Patch/u.test(cloudflareRunbook) || !/caricare\s+solo\s+quei\s+file/u.test(cloudflareRunbook)) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document that the drift patch is evidence, not a partial upload instruction');
  }
  if (!cloudflareRunbook.includes('npm run audit:git-deploy-state') || !cloudflareRunbook.includes('upstream `cantoni`')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document the Git deploy state gate');
  }
  if (!cloudflareRunbook.includes('npm run export:external-unblock-handoff') || !cloudflareRunbook.includes('sales-kit/generated/external-unblock-handoff/')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document the external unblock handoff path');
  }
  if (!cloudflareRunbook.includes('cantoni-external-unblock-handoff-latest.md/json')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document latest external unblock handoff aliases');
  }
  if (!cloudflareRunbook.includes('cantoni-launch-operator-pack-latest.md/json')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document latest launch operator pack aliases');
  }
  if (!cloudflareRunbook.includes('cantoni-launch-handoff-latest.md/json')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document latest launch handoff aliases');
  }
  if (!cloudflareRunbook.includes('cantoni-live-drift-latest.md/json')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document latest live drift aliases');
  }
  if (!cloudflareRunbook.includes('cantoni-email-dns-handoff-latest')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document latest email DNS handoff aliases');
  }
  if (!cloudflareRunbook.includes('cantoni-cloudflare-pages-manual-upload-latest')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document latest Cloudflare manual upload aliases');
  }
  if (!cloudflareRunbook.includes('external_unblock_handoff')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document the external unblock handoff readiness gate');
  }
  if (!cloudflareRunbook.includes('npm run audit:post-unblock-launch') || !cloudflareRunbook.includes('npm run test:post-unblock-launch')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document strict and nonfatal post-unblock launch audits');
  }
  if (!cloudflareRunbook.includes('preview-cantoni-site') || !cloudflareRunbook.includes('CLOUDFLARE_PAGES_BRANCH=main') || !cloudflareRunbook.includes('live_site_contract')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document preview-vs-production branch behavior for live contract closure');
  }
  for (const required of [
    'npm run audit:post-unblock-launch',
    'npm run audit:email-dns',
    'npm run test:social-public',
    'npm run test:lead-endpoint',
    'exact outbound batch',
    'cantonidigitalstudio@gmail.com',
    'scripts/day1_send_background.sh',
    'OUTBOUND_FORCE_RUN=1'
  ]) {
    if (!outboundPause.includes(required)) {
      failures.push(`sales-kit/outbound_pause.flag: must include outbound release condition "${required}"`);
    }
  }

  const report = {
    ok: failures.length === 0,
    checked: [
      'sales-kit/cascade_status_2026-05-16.md',
      'README.md',
      'CLOUDFLARE_DEPLOY_RUNBOOK.md',
      'sales-kit/outbound_pause.flag'
    ],
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main();
