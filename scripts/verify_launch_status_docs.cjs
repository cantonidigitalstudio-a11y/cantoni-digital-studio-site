const fs = require('fs');
const path = require('path');
const {
  OUTBOUND_PAUSE_REQUIRED_SNIPPETS
} = require('./lib/outbound_pause_contract.cjs');
const {
  PAYMENT_BRANDING_REQUIRED_SNIPPETS
} = require('./lib/payment_branding_contract.cjs');

const ROOT = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function main() {
  const failures = [];
  const historicalStatus = read('sales-kit/cascade_status_2026-05-16.md');
  const historicalHeader = historicalStatus.split('\n').slice(0, 12).join('\n');
  const readme = read('README.md');
  const deployRunbook = read('DEPLOY_RUNBOOK.md');
  const cloudflareRunbook = read('CLOUDFLARE_DEPLOY_RUNBOOK.md');
  const paymentBrandingRemediation = read('sales-kit/payment_branding_remediation.md');
  const socialProfileChecklist = read('sales-kit/business-cards/social-profile-setup-checklist.md');
  const socialLaunchRunbook = read('sales-kit/social-launch/launch-runbook.md');
  const socialClientAcquisition = read('sales-kit/social-launch/client-acquisition-readiness.md');
  const ipadWirelessFallback = read('sales-kit/ipad-wireless-fallback-runbook.md');
  const outboundPause = read('sales-kit/outbound_pause.flag');
  const paymentBranding = read('sales-kit/payment_branding_review.flag');

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
  if (!readme.includes('Live Site Contract Drift') || !readme.includes('non caricare solo i file di drift')) {
    failures.push('README.md: must document live drift in external unblock handoff');
  }
  if (!readme.includes('Production live-site contract coverage in this ZIP') ||
    !readme.includes('Do not upload only these files') ||
    !readme.includes('CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production')) {
    failures.push('README.md: must document manual Cloudflare ZIP README contract coverage and production deploy guards');
  }
  if (!readme.includes('cantoni-email-dns-handoff-latest.cloudflare-api-records.json') || !readme.includes('npm run dns:cloudflare:apply') || !readme.includes('CANTONI_DNS_APPROVAL=apply-cantoni-email-dns')) {
    failures.push('README.md: must document DNS apply boundary in external unblock handoff');
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
  if (!readme.includes('node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready')) {
    failures.push('README.md: must document deploy candidate execution-readiness check in post-unblock closure');
  }
  if (!readme.includes('canali social') || !readme.includes('pubblici')) {
    failures.push('README.md: must document public social channels in post-unblock launch audits');
  }
  if (!readme.includes('endpoint lead')) {
    failures.push('README.md: must document lead endpoint in post-unblock launch audits');
  }
  if (!readme.includes('npm run test:outreach-readiness')) {
    failures.push('README.md: must document outreach readiness before commercial outbound release');
  }
  if (!readme.includes('npm run audit:payment-branding') || !readme.includes('sales-kit/payment_branding_review.flag')) {
    failures.push('README.md: must document payment branding audit and review flag');
  }
  if (!readme.includes('sales-kit/payment_branding_review_evidence.json') || !readme.includes('release_ready=true')) {
    failures.push('README.md: must document payment branding evidence and release_ready gate');
  }
  if (!readme.includes('review_method.expanded_additional_payment_methods=true') || !readme.includes('amazon_pay') || !readme.includes('nessun click sul submit finale')) {
    failures.push('README.md: must document expanded-method payment branding evidence requirements');
  }
  if (!readme.includes('sales-kit/payment_branding_remediation.md') || !readme.includes('npm run test:payment-branding-remediation')) {
    failures.push('README.md: must document payment branding remediation verifier');
  }
  if (!readme.includes('stato Git deploy') || !readme.includes('npm run audit:git-deploy-state')) {
    failures.push('README.md: must document Git deploy state as part of launch readiness');
  }
  if (!readme.includes('preview-cantoni-site') || !readme.includes('CLOUDFLARE_PAGES_BRANCH=main') || !readme.includes('live_site_contract')) {
    failures.push('README.md: must document preview-vs-production branch behavior for live contract closure');
  }
  for (const required of [
    'Stato corrente 2026-06-25',
    'blocked_paypal_not_visible',
    'release_ready=false',
    'La verifica del 2026-05-05 e superata',
    'nessuna eccezione EC8',
    'PayPal deve risultare selezionabile e non deve esporre EC8, EC8 Platform o',
    'npm run audit:payment-branding',
    'sales-kit/payment_branding_review.flag',
    'sales-kit/payment_branding_review_evidence.json',
    'npm run test:payment-branding-remediation',
    'review_method.expanded_additional_payment_methods=true',
    'amazon_pay',
    'nessun click sul submit finale'
  ]) {
    if (!deployRunbook.includes(required)) {
      failures.push(`DEPLOY_RUNBOOK.md: must include current payment branding boundary "${required}"`);
    }
  }
  for (const forbidden of [
    'Decisione temporanea 2026-05-05',
    'Rischio accettato: nel passaggio PayPal',
    'se PayPal mostra un brand non Cantoni, segnalarlo come rischio commerciale residuo'
  ]) {
    if (deployRunbook.includes(forbidden)) {
      failures.push(`DEPLOY_RUNBOOK.md: must not keep stale payment branding exception text "${forbidden}"`);
    }
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
  if (!cloudflareRunbook.includes('Live Site Contract Drift') || !cloudflareRunbook.includes('non\ncaricare solo i file di drift')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document live drift in external unblock handoff');
  }
  if (!cloudflareRunbook.includes('Production live-site contract coverage in this ZIP') ||
    !cloudflareRunbook.includes('Do not upload only these files') ||
    !cloudflareRunbook.includes('CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document manual Cloudflare ZIP README contract coverage and production deploy guards');
  }
  if (!cloudflareRunbook.includes('cantoni-email-dns-handoff-latest.cloudflare-api-records.json') || !cloudflareRunbook.includes('npm run dns:cloudflare:apply') || !cloudflareRunbook.includes('cloudflare_lookup_required')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document DNS apply boundary in external unblock handoff');
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
  if (!cloudflareRunbook.includes('node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document deploy candidate execution-readiness check in post-unblock closure');
  }
  if (!cloudflareRunbook.includes('npm run test:social-public')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document public social channel verification');
  }
  if (!cloudflareRunbook.includes('npm run test:lead-endpoint')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document lead endpoint verification');
  }
  if (!cloudflareRunbook.includes('npm run test:outreach-readiness')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document outreach readiness verification');
  }
  if (!cloudflareRunbook.includes('npm run audit:payment-branding') || !cloudflareRunbook.includes('sales-kit/payment_branding_review.flag')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document payment branding audit and review flag');
  }
  if (!cloudflareRunbook.includes('sales-kit/payment_branding_review_evidence.json') || !cloudflareRunbook.includes('release_ready=true')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document payment branding evidence and release_ready gate');
  }
  if (!cloudflareRunbook.includes('review_method.expanded_additional_payment_methods=true') || !cloudflareRunbook.includes('amazon_pay') || !cloudflareRunbook.includes('nessun click sul submit finale')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document expanded-method payment branding evidence requirements');
  }
  if (!cloudflareRunbook.includes('sales-kit/payment_branding_remediation.md') || !cloudflareRunbook.includes('npm run test:payment-branding-remediation')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document payment branding remediation verifier');
  }
  if (!cloudflareRunbook.includes('preview-cantoni-site') || !cloudflareRunbook.includes('CLOUDFLARE_PAGES_BRANCH=main') || !cloudflareRunbook.includes('live_site_contract')) {
    failures.push('CLOUDFLARE_DEPLOY_RUNBOOK.md: must document preview-vs-production branch behavior for live contract closure');
  }
  for (const required of OUTBOUND_PAUSE_REQUIRED_SNIPPETS) {
    if (!outboundPause.includes(required)) {
      failures.push(`sales-kit/outbound_pause.flag: must include outbound release condition "${required}"`);
    }
  }
  for (const required of PAYMENT_BRANDING_REQUIRED_SNIPPETS) {
    if (!paymentBranding.includes(required)) {
      failures.push(`sales-kit/payment_branding_review.flag: must include payment branding release condition "${required}"`);
    }
  }
  for (const required of [
    'https://docs.stripe.com/payments/paypal',
    'https://docs.stripe.com/payments/paypal/activate',
    'https://docs.stripe.com/payment-links',
    'https://docs.stripe.com/payments/checkout/payment-methods',
    'cantonidigitalstudio@gmail.com',
    'sales-kit/payment_branding_review_evidence.json',
    'release_ready=true'
  ]) {
    if (!paymentBrandingRemediation.includes(required)) {
      failures.push(`sales-kit/payment_branding_remediation.md: must include "${required}"`);
    }
  }
  for (const [file, contents] of [
    ['sales-kit/business-cards/social-profile-setup-checklist.md', socialProfileChecklist],
    ['sales-kit/social-launch/launch-runbook.md', socialLaunchRunbook],
    ['sales-kit/social-launch/client-acquisition-readiness.md', socialClientAcquisition],
    ['sales-kit/ipad-wireless-fallback-runbook.md', ipadWirelessFallback]
  ]) {
    for (const required of [
      '2026-05-14',
      'cantonidigitalstudio.com',
      'zumu.be/ecantoni'
    ]) {
      if (!contents.includes(required)) {
        failures.push(`${file}: must document resolved Instagram profile link status "${required}"`);
      }
    }
    if (file === 'sales-kit/ipad-wireless-fallback-runbook.md') {
      for (const required of [
        'Resolved Instagram Task - 2026-05-14',
        'This is no longer required to accept the current Instagram public proof',
        'Use this procedure only if a future public QA run shows the Instagram profile regressed'
      ]) {
        if (!contents.includes(required)) {
          failures.push(`${file}: must document iPad fallback as future-only after resolved Instagram QA "${required}"`);
        }
      }
    } else if (!contents.includes('Historical note superseded by the 2026-05-14 QA') &&
      !contents.includes('Il task Instagram link/avatar non dipende più da questo fallback')) {
      failures.push(`${file}: must mark pre-2026-05-14 Instagram link blocker as superseded/resolved`);
    }
    for (const forbidden of [
      'Website link issue remains',
      'clickable link is still `zumu.be/ecantoni`',
      'clickable profile website link is still `zumu.be/ecantoni`',
      'Profile avatar must be replaced with the centered generated asset before using Instagram as primary proof',
      'Required fix: change the Instagram app profile link',
      'before full automated mobile control can change the Instagram link and avatar',
      'Do not mark the Instagram link fix as complete until one of these is true',
      '## First Mobile-Only Task'
    ]) {
      if (contents.includes(forbidden)) {
        failures.push(`${file}: must not present superseded Instagram profile blocker as current status "${forbidden}"`);
      }
    }
  }

  const report = {
    ok: failures.length === 0,
    checked: [
      'sales-kit/cascade_status_2026-05-16.md',
      'README.md',
      'DEPLOY_RUNBOOK.md',
      'CLOUDFLARE_DEPLOY_RUNBOOK.md',
      'sales-kit/payment_branding_remediation.md',
      'sales-kit/business-cards/social-profile-setup-checklist.md',
      'sales-kit/social-launch/launch-runbook.md',
      'sales-kit/social-launch/client-acquisition-readiness.md',
      'sales-kit/ipad-wireless-fallback-runbook.md',
      'sales-kit/outbound_pause.flag',
      'sales-kit/payment_branding_review.flag'
    ],
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main();
