const fs = require('fs/promises');
const path = require('path');
const { HTML_PAGES } = require('./lib/live_site_contract.cjs');
const { pushLeakFailures } = require('./lib/artifact_leak_scan.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const GENERATED_ROOT = path.join(PROJECT_ROOT, 'sales-kit/generated');
const REQUIRED_POST_DEPLOY_CHECKS = [
  'npm run test:live-site',
  'npm run audit:post-unblock-launch',
  'npm run audit:launch-readiness'
];

const FILE_PATTERNS = {
  launchHandoff: /^cantoni-launch-handoff-(?!latest\b).+\.json$/,
  operatorPack: /^cantoni-launch-operator-pack-(?!latest\b).+\.json$/,
  emailDns: /^cantoni-email-dns-handoff-(?!latest\b)(?!.*\.cloudflare-api-records\.json$).+\.json$/,
  emailDnsApi: /^cantoni-email-dns-handoff-(?!latest\b).+\.cloudflare-api-records\.json$/,
  liveDrift: /^cantoni-live-drift-(?!latest\b).+\.json$/
};

const LAUNCH_HANDOFF_LATEST_ALIASES = [
  {
    label: 'launch_handoff_latest_json',
    alias: 'cantoni-launch-handoff-latest.json',
    timestampedPattern: /^cantoni-launch-handoff-(?!latest\b).+\.json$/
  },
  {
    label: 'launch_handoff_latest_markdown',
    alias: 'cantoni-launch-handoff-latest.md',
    timestampedPattern: /^cantoni-launch-handoff-(?!latest\b).+\.md$/
  }
];

const OPERATOR_PACK_LATEST_ALIASES = [
  {
    label: 'operator_pack_latest_json',
    alias: 'cantoni-launch-operator-pack-latest.json',
    timestampedPattern: /^cantoni-launch-operator-pack-(?!latest\b).+\.json$/
  },
  {
    label: 'operator_pack_latest_markdown',
    alias: 'cantoni-launch-operator-pack-latest.md',
    timestampedPattern: /^cantoni-launch-operator-pack-(?!latest\b).+\.md$/
  }
];

const EMAIL_DNS_LATEST_ALIASES = [
  {
    label: 'email_dns_latest_json',
    alias: 'cantoni-email-dns-handoff-latest.json',
    timestampedPattern: /^cantoni-email-dns-handoff-(?!latest\b)(?!.*\.cloudflare-api-records\.json$).+\.json$/
  },
  {
    label: 'email_dns_latest_markdown',
    alias: 'cantoni-email-dns-handoff-latest.md',
    timestampedPattern: /^cantoni-email-dns-handoff-(?!latest\b).+\.md$/
  },
  {
    label: 'email_dns_latest_csv',
    alias: 'cantoni-email-dns-handoff-latest.cloudflare-records.csv',
    timestampedPattern: /^cantoni-email-dns-handoff-(?!latest\b).+\.cloudflare-records\.csv$/
  },
  {
    label: 'email_dns_latest_api_json',
    alias: 'cantoni-email-dns-handoff-latest.cloudflare-api-records.json',
    timestampedPattern: /^cantoni-email-dns-handoff-(?!latest\b).+\.cloudflare-api-records\.json$/
  }
];

const CLOUDFLARE_UPLOAD_LATEST_ALIASES = [
  {
    label: 'cloudflare_upload_latest_zip',
    alias: 'cantoni-cloudflare-pages-manual-upload-latest.zip',
    timestampedPattern: /^cantoni-cloudflare-pages-manual-upload-(?!latest\b).+\.zip$/
  },
  {
    label: 'cloudflare_upload_latest_manifest',
    alias: 'cantoni-cloudflare-pages-manual-upload-latest.manifest.json',
    timestampedPattern: /^cantoni-cloudflare-pages-manual-upload-(?!latest\b).+\.manifest\.json$/
  },
  {
    label: 'cloudflare_upload_latest_checksums',
    alias: 'cantoni-cloudflare-pages-manual-upload-latest.SHA256SUMS',
    timestampedPattern: /^cantoni-cloudflare-pages-manual-upload-(?!latest\b).+\.SHA256SUMS$/
  },
  {
    label: 'cloudflare_upload_latest_readme',
    alias: 'cantoni-cloudflare-pages-manual-upload-latest.README.txt',
    timestampedPattern: /^cantoni-cloudflare-pages-manual-upload-(?!latest\b).+\.README\.txt$/
  }
];

const LIVE_DRIFT_LATEST_ALIASES = [
  {
    label: 'live_drift_latest_json',
    alias: 'cantoni-live-drift-latest.json',
    timestampedPattern: /^cantoni-live-drift-(?!latest\b).+\.json$/
  },
  {
    label: 'live_drift_latest_markdown',
    alias: 'cantoni-live-drift-latest.md',
    timestampedPattern: /^cantoni-live-drift-(?!latest\b).+\.md$/
  }
];

function normalizeRel(value) {
  return value.split(path.sep).join('/');
}

function artifactFileForContractPage(pagePath) {
  if (pagePath === '/') return 'index.html';
  return String(pagePath || '').replace(/^\/+/, '');
}

function validatePaymentBrandingBoundary({ boundary, label, failures }) {
  if (!boundary || typeof boundary !== 'object' || Array.isArray(boundary)) {
    failures.push(`${label}: missing payment branding boundary payload`);
    return;
  }
  if (boundary.source !== 'sales-kit/payment_branding_review_evidence.json') {
    failures.push(`${label}: payment branding boundary must point to structured evidence`);
  }
  if (boundary.flag !== 'sales-kit/payment_branding_review.flag') {
    failures.push(`${label}: payment branding boundary must point to review flag`);
  }
  if (boundary.stale_paypal_verification_superseded !== true) {
    failures.push(`${label}: payment branding boundary must mark stale PayPal visual checks as superseded`);
  }
  if (boundary.no_ec8_exception !== true || boundary.no_unrelated_brand_exception !== true) {
    failures.push(`${label}: payment branding boundary must disallow EC8 and unrelated-brand exceptions`);
  }
  if (boundary.release_ready_required !== true || boundary.final_payment_submission_allowed !== false) {
    failures.push(`${label}: payment branding boundary must require release_ready and forbid final payment submission`);
  }
  const reviewText = JSON.stringify(boundary.required_review || []);
  for (const required of [
    'Stripe Checkout merchant shows Cantoni Digital Studio',
    'PayPal is selectable in a real browser session',
    'PayPal does not expose EC8',
    'No EC8/EC8 Platform exception is valid for release',
    'The reviewer stops before submitting the final payment step'
  ]) {
    if (!reviewText.includes(required)) {
      failures.push(`${label}: payment branding boundary missing review text: ${required}`);
    }
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function latestFile(dir, pattern) {
  const fullDir = path.join(GENERATED_ROOT, dir);
  const entries = await fs.readdir(fullDir, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => path.join(fullDir, entry.name))
    .sort()
    .reverse();

  return matches[0] || null;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function scanLeaks(filePath, failures) {
  const source = await fs.readFile(filePath, 'utf8');
  const rel = normalizeRel(path.relative(PROJECT_ROOT, filePath));
  pushLeakFailures(source, rel, failures);
}

async function verifyEmailDnsLatestAliases(failures) {
  const emailDnsDir = path.join(GENERATED_ROOT, 'email-dns-handoff');

  for (const item of EMAIL_DNS_LATEST_ALIASES) {
    const aliasPath = path.join(emailDnsDir, item.alias);
    const timestampedPath = await latestFile('email-dns-handoff', item.timestampedPattern).catch((error) => {
      failures.push(`${item.label}: unable to find latest timestamped artifact (${error.message})`);
      return null;
    });

    if (!await pathExists(aliasPath)) {
      failures.push(`${item.label}: missing stable latest alias ${item.alias}`);
      continue;
    }
    if (!timestampedPath) {
      failures.push(`${item.label}: missing timestamped source artifact`);
      continue;
    }

    const [aliasSource, timestampedSource] = await Promise.all([
      fs.readFile(aliasPath, 'utf8'),
      fs.readFile(timestampedPath, 'utf8')
    ]);
    if (aliasSource !== timestampedSource) {
      failures.push(`${item.label}: latest alias does not match latest timestamped artifact`);
    }
  }
}

async function verifyCloudflareUploadLatestAliases(failures) {
  const uploadDir = path.join(GENERATED_ROOT, 'cloudflare-manual-upload');

  for (const item of CLOUDFLARE_UPLOAD_LATEST_ALIASES) {
    const aliasPath = path.join(uploadDir, item.alias);
    const timestampedPath = await latestFile('cloudflare-manual-upload', item.timestampedPattern).catch((error) => {
      failures.push(`${item.label}: unable to find latest timestamped artifact (${error.message})`);
      return null;
    });

    if (!await pathExists(aliasPath)) {
      failures.push(`${item.label}: missing stable latest alias ${item.alias}`);
      continue;
    }
    if (!timestampedPath) {
      failures.push(`${item.label}: missing timestamped source artifact`);
      continue;
    }

    const [aliasSource, timestampedSource] = await Promise.all([
      fs.readFile(aliasPath),
      fs.readFile(timestampedPath)
    ]);
    if (!aliasSource.equals(timestampedSource)) {
      failures.push(`${item.label}: latest alias does not match latest timestamped artifact`);
    }
  }
}

async function verifyOperatorPackLatestAliases(failures) {
  const operatorPackDir = path.join(GENERATED_ROOT, 'launch-operator-pack');

  for (const item of OPERATOR_PACK_LATEST_ALIASES) {
    const aliasPath = path.join(operatorPackDir, item.alias);
    const timestampedPath = await latestFile('launch-operator-pack', item.timestampedPattern).catch((error) => {
      failures.push(`${item.label}: unable to find latest timestamped artifact (${error.message})`);
      return null;
    });

    if (!await pathExists(aliasPath)) {
      failures.push(`${item.label}: missing stable latest alias ${item.alias}`);
      continue;
    }
    if (!timestampedPath) {
      failures.push(`${item.label}: missing timestamped source artifact`);
      continue;
    }

    const [aliasSource, timestampedSource] = await Promise.all([
      fs.readFile(aliasPath, 'utf8'),
      fs.readFile(timestampedPath, 'utf8')
    ]);
    if (aliasSource !== timestampedSource) {
      failures.push(`${item.label}: latest alias does not match latest timestamped artifact`);
    }
  }
}

async function verifyLaunchHandoffLatestAliases(failures) {
  const launchHandoffDir = path.join(GENERATED_ROOT, 'launch-handoff');

  for (const item of LAUNCH_HANDOFF_LATEST_ALIASES) {
    const aliasPath = path.join(launchHandoffDir, item.alias);
    const timestampedPath = await latestFile('launch-handoff', item.timestampedPattern).catch((error) => {
      failures.push(`${item.label}: unable to find latest timestamped artifact (${error.message})`);
      return null;
    });

    if (!await pathExists(aliasPath)) {
      failures.push(`${item.label}: missing stable latest alias ${item.alias}`);
      continue;
    }
    if (!timestampedPath) {
      failures.push(`${item.label}: missing timestamped source artifact`);
      continue;
    }

    const [aliasSource, timestampedSource] = await Promise.all([
      fs.readFile(aliasPath, 'utf8'),
      fs.readFile(timestampedPath, 'utf8')
    ]);
    if (aliasSource !== timestampedSource) {
      failures.push(`${item.label}: latest alias does not match latest timestamped artifact`);
    }
  }
}

async function verifyLiveDriftLatestAliases(failures) {
  const liveDriftDir = path.join(GENERATED_ROOT, 'live-drift');

  for (const item of LIVE_DRIFT_LATEST_ALIASES) {
    const aliasPath = path.join(liveDriftDir, item.alias);
    const timestampedPath = await latestFile('live-drift', item.timestampedPattern).catch((error) => {
      failures.push(`${item.label}: unable to find latest timestamped artifact (${error.message})`);
      return null;
    });

    if (!await pathExists(aliasPath)) {
      failures.push(`${item.label}: missing stable latest alias ${item.alias}`);
      continue;
    }
    if (!timestampedPath) {
      failures.push(`${item.label}: missing timestamped source artifact`);
      continue;
    }

    const [aliasSource, timestampedSource] = await Promise.all([
      fs.readFile(aliasPath, 'utf8'),
      fs.readFile(timestampedPath, 'utf8')
    ]);
    if (aliasSource !== timestampedSource) {
      failures.push(`${item.label}: latest alias does not match latest timestamped artifact`);
    }
  }
}

function requireRelativePath(file, label, failures) {
  if (!file || typeof file !== 'string') {
    failures.push(`${label}: missing path`);
    return;
  }
  if (path.isAbsolute(file) || file.includes('/Volumes/') || file.includes('/Users/')) {
    failures.push(`${label}: path must be repo-relative`);
  }
}

async function requireReferencedFile(relPath, label, failures) {
  requireRelativePath(relPath, label, failures);
  if (relPath && !await pathExists(path.join(PROJECT_ROOT, relPath))) {
    failures.push(`${label}: referenced file does not exist (${relPath})`);
  }
}

function verifyManualUploadContractCoverage(manualPackageManifest, manualPackageReadme, failures) {
  const coverage = manualPackageManifest?.contract_coverage || {};
  const coveragePages = Array.isArray(coverage.pages) ? coverage.pages : [];
  const requiredReadmeSnippets = [
    'Production live-site contract coverage in this ZIP',
    'Full artifact required: yes',
    'Partial upload safe: no',
    'Production branch required: main',
    'CLOUDFLARE_PAGES_BRANCH=main',
    'ALLOW_PRODUCTION_DEPLOY=yes',
    'CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production',
    'Do not upload only these files',
    'complete ZIP/root artifact',
    'production branch main',
    'npm run test:cloudflare-deploy-candidate'
  ];
  const zip = manualPackageManifest?.zip || {};

  if (coverage.type !== 'cloudflare_pages_live_site_contract_coverage_v1') {
    failures.push('cloudflare_manual_upload: manifest must expose live-site contract coverage');
  }
  if (coverage.source !== 'scripts/lib/live_site_contract.cjs') {
    failures.push('cloudflare_manual_upload: contract coverage source must be the shared live-site contract');
  }
  if (coverage.full_artifact_required !== true || coverage.partial_upload_safe !== false) {
    failures.push('cloudflare_manual_upload: contract coverage must require full artifact deployment');
  }
  if (coverage.production_branch !== 'main') {
    failures.push('cloudflare_manual_upload: contract coverage must require production branch main');
  }
  if (coverage.cli_approval_guard?.CLOUDFLARE_PAGES_BRANCH !== 'main' ||
    coverage.cli_approval_guard?.ALLOW_PRODUCTION_DEPLOY !== 'yes' ||
    coverage.cli_approval_guard?.CANTONI_PRODUCTION_DEPLOY_APPROVAL !== 'deploy-cantoni-production') {
    failures.push('cloudflare_manual_upload: contract coverage must preserve production deploy approval guards');
  }
  if (!zip.sha256) {
    failures.push('cloudflare_manual_upload: manifest must expose ZIP SHA-256');
  } else if (!manualPackageReadme.includes(`ZIP SHA-256: ${zip.sha256}`)) {
    failures.push('cloudflare_manual_upload: README must expose the manifest ZIP SHA-256');
  }
  if (!Number.isInteger(zip.bytes) || zip.bytes <= 0) {
    failures.push('cloudflare_manual_upload: manifest must expose positive ZIP byte size');
  } else if (!manualPackageReadme.includes(`ZIP bytes: ${zip.bytes}`)) {
    failures.push('cloudflare_manual_upload: README must expose the manifest ZIP byte size');
  }
  if (!manualPackageManifest?.git?.commit) {
    failures.push('cloudflare_manual_upload: manifest must expose full Git commit');
  } else if (!manualPackageReadme.includes(`Git full commit: ${manualPackageManifest.git.commit}`)) {
    failures.push('cloudflare_manual_upload: README must expose the manifest full Git commit');
  }
  for (const snippet of requiredReadmeSnippets) {
    if (!manualPackageReadme.includes(snippet)) {
      failures.push(`cloudflare_manual_upload: README must include "${snippet}"`);
    }
  }

  for (const page of HTML_PAGES) {
    const artifactFile = artifactFileForContractPage(page.path);
    const coveragePage = coveragePages.find((item) => item.page === page.path);
    if (!coveragePage) {
      failures.push(`cloudflare_manual_upload: contract coverage missing ${page.path}`);
      continue;
    }
    if (coveragePage.artifact_file !== artifactFile) {
      failures.push(`cloudflare_manual_upload: ${page.path} must map to ${artifactFile}`);
    }
    if (coveragePage.artifact_file_present !== true || coveragePage.artifact_satisfies_required !== true) {
      failures.push(`cloudflare_manual_upload: ${page.path} must be satisfied by the packaged artifact`);
    }
    if (Array.isArray(coveragePage.missing_required_snippets) && coveragePage.missing_required_snippets.length) {
      failures.push(`cloudflare_manual_upload: ${page.path} must not have missing required snippets`);
    }
    if (!manualPackageReadme.includes(page.path) || !manualPackageReadme.includes(artifactFile)) {
      failures.push(`cloudflare_manual_upload: README must list contract page ${page.path} and artifact ${artifactFile}`);
    }
    for (const requiredSnippet of page.required || []) {
      if (!Array.isArray(coveragePage.required_snippets) || !coveragePage.required_snippets.includes(requiredSnippet)) {
        failures.push(`cloudflare_manual_upload: ${page.path} coverage must include required snippet ${requiredSnippet}`);
      }
      if (!manualPackageReadme.includes(requiredSnippet)) {
        failures.push(`cloudflare_manual_upload: README must expose required snippet ${requiredSnippet}`);
      }
    }
  }
}

async function main() {
  const failures = [];
  await verifyLaunchHandoffLatestAliases(failures);
  await verifyOperatorPackLatestAliases(failures);
  await verifyEmailDnsLatestAliases(failures);
  await verifyCloudflareUploadLatestAliases(failures);
  await verifyLiveDriftLatestAliases(failures);

  const files = {
    launchHandoff: await latestFile('launch-handoff', FILE_PATTERNS.launchHandoff),
    operatorPack: await latestFile('launch-operator-pack', FILE_PATTERNS.operatorPack),
    emailDns: await latestFile('email-dns-handoff', FILE_PATTERNS.emailDns),
    emailDnsApi: await latestFile('email-dns-handoff', FILE_PATTERNS.emailDnsApi),
    liveDrift: await latestFile('live-drift', FILE_PATTERNS.liveDrift)
  };
  const leakScanFiles = new Set(Object.values(files).filter(Boolean));

  for (const [key, filePath] of Object.entries(files)) {
    if (!filePath) failures.push(`${key}: no generated artifact found`);
  }

  if (!failures.length) {
    const [launchHandoff, operatorPack, emailDns, emailDnsApi, liveDrift] = await Promise.all([
      readJson(files.launchHandoff),
      readJson(files.operatorPack),
      readJson(files.emailDns),
      readJson(files.emailDnsApi),
      readJson(files.liveDrift)
    ]);
    const manualPackageManifestPath = operatorPack.steps?.cloudflare_manual_upload?.output?.manifest;
    const manualPackageReadmePath = operatorPack.steps?.cloudflare_manual_upload?.output?.readme;
    const manualPackageManifest = manualPackageManifestPath
      ? await readJson(path.join(PROJECT_ROOT, manualPackageManifestPath))
      : null;
    const manualPackageReadme = manualPackageReadmePath
      ? await fs.readFile(path.join(PROJECT_ROOT, manualPackageReadmePath), 'utf8')
      : '';
    for (const markdownPath of [
      files.launchHandoff.replace(/\.json$/u, '.md'),
      files.operatorPack.replace(/\.json$/u, '.md'),
      files.emailDns.replace(/\.json$/u, '.md'),
      files.liveDrift.replace(/\.json$/u, '.md')
    ]) {
      if (await pathExists(markdownPath)) leakScanFiles.add(markdownPath);
      else failures.push(`${normalizeRel(path.relative(PROJECT_ROOT, markdownPath))}: paired Markdown artifact missing`);
    }
    if (manualPackageReadmePath) {
      leakScanFiles.add(path.join(PROJECT_ROOT, manualPackageReadmePath));
    }
    verifyManualUploadContractCoverage(manualPackageManifest, manualPackageReadme, failures);

    for (const [label, git] of [
      ['launch_handoff', launchHandoff.git],
      ['operator_pack', operatorPack.git],
      ['cloudflare_manual_upload', manualPackageManifest?.git],
      ['email_dns', emailDns.git],
      ['email_dns_api', emailDnsApi.git],
      ['live_drift', liveDrift.git]
    ]) {
      if (!git || typeof git !== 'object') {
        failures.push(`${label}: missing Git provenance`);
        continue;
      }
      for (const field of ['commit', 'short_commit', 'branch', 'upstream', 'remote_name', 'remote_url']) {
        if (!git[field]) failures.push(`${label}: missing Git provenance field ${field}`);
      }
      if (typeof git.dirty !== 'boolean') failures.push(`${label}: Git provenance dirty must be boolean`);
      if (!Number.isInteger(git.status_entries)) failures.push(`${label}: Git provenance status_entries must be an integer`);
    }
    if (launchHandoff.git?.commit && operatorPack.git?.commit && launchHandoff.git.commit !== operatorPack.git.commit) {
      failures.push('operator_pack: Git commit does not match launch handoff');
    }
    if (launchHandoff.git?.commit && manualPackageManifest?.git?.commit && launchHandoff.git.commit !== manualPackageManifest.git.commit) {
      failures.push('cloudflare_manual_upload: Git commit does not match launch handoff');
    }
    if (launchHandoff.git?.commit && liveDrift.git?.commit && launchHandoff.git.commit !== liveDrift.git.commit) {
      failures.push('live_drift: Git commit does not match launch handoff');
    }
    if (launchHandoff.git?.commit && emailDns.git?.commit && launchHandoff.git.commit !== emailDns.git.commit) {
      failures.push('email_dns: Git commit does not match launch handoff');
    }
    if (emailDns.git?.commit && emailDnsApi.git?.commit && emailDns.git.commit !== emailDnsApi.git.commit) {
      failures.push('email_dns_api: Git commit does not match email DNS handoff');
    }
    if (emailDns.source_commit && emailDns.git?.commit && emailDns.source_commit !== emailDns.git.commit) {
      failures.push('email_dns: source_commit must match Git provenance commit');
    }
    if (emailDnsApi.source_commit && emailDnsApi.git?.commit && emailDnsApi.source_commit !== emailDnsApi.git.commit) {
      failures.push('email_dns_api: source_commit must match Git provenance commit');
    }
    if (launchHandoff.git?.upstream && operatorPack.git?.upstream && launchHandoff.git.upstream !== operatorPack.git.upstream) {
      failures.push('operator_pack: Git upstream does not match launch handoff');
    }
    if (String(normalizeRel(path.relative(PROJECT_ROOT, files.launchHandoff))).includes('-latest.')) {
      failures.push('launch_handoff: verifier must inspect an immutable timestamped launch handoff, not the latest alias');
    }
    if (String(normalizeRel(path.relative(PROJECT_ROOT, files.liveDrift))).includes('-latest.')) {
      failures.push('live_drift: verifier must inspect an immutable timestamped live drift report, not the latest alias');
    }
    if (String(normalizeRel(path.relative(PROJECT_ROOT, files.emailDns))).includes('-latest.')) {
      failures.push('email_dns: verifier must inspect an immutable timestamped email DNS handoff, not the latest alias');
    }
    if (String(normalizeRel(path.relative(PROJECT_ROOT, files.emailDnsApi))).includes('-latest.')) {
      failures.push('email_dns_api: verifier must inspect an immutable timestamped API payload, not the latest alias');
    }
    if (String(launchHandoff.latest_cloudflare_manual_package?.manifest || '').includes('-latest.')) {
      failures.push('launch_handoff: latest Cloudflare manual package manifest must be timestamped, not a latest alias');
    }
    const launchManualPackage = launchHandoff.latest_cloudflare_manual_package || {};
    const manualUploadOutput = operatorPack.steps?.cloudflare_manual_upload?.output || {};
    const manualUploadZip = manualUploadOutput.zip || {};
    const cloudflareDeployCandidate = operatorPack.cloudflare_deploy_candidate || {};
    if (launchManualPackage.zip !== manualUploadZip.path) {
      failures.push('launch_handoff: Cloudflare manual package ZIP must match operator pack package');
    }
    if (launchManualPackage.manifest !== manualPackageManifestPath) {
      failures.push('launch_handoff: Cloudflare manual package manifest must match operator pack package');
    }
    if (launchManualPackage.readme !== manualUploadOutput.readme) {
      failures.push('launch_handoff: Cloudflare manual package README must match operator pack package');
    }
    if (launchManualPackage.checksums !== manualUploadOutput.checksums) {
      failures.push('launch_handoff: Cloudflare manual package checksums must match operator pack package');
    }
    if (launchManualPackage.checksum !== manualUploadZip.sha256) {
      failures.push('launch_handoff: Cloudflare manual package ZIP SHA-256 must match operator pack package');
    }
    if (!Number.isInteger(launchManualPackage.zip_bytes) || launchManualPackage.zip_bytes <= 0) {
      failures.push('launch_handoff: Cloudflare manual package must expose positive ZIP byte size');
    } else {
      if (launchManualPackage.zip_bytes !== manualUploadZip.bytes) {
        failures.push('launch_handoff: Cloudflare manual package ZIP byte size must match operator pack package');
      }
      if (launchManualPackage.zip_bytes !== cloudflareDeployCandidate.package?.zip_bytes) {
        failures.push('launch_handoff: Cloudflare manual package ZIP byte size must match deploy candidate package');
      }
      if (manualPackageManifest?.zip?.bytes !== launchManualPackage.zip_bytes) {
        failures.push('launch_handoff: Cloudflare manual package ZIP byte size must match manifest');
      }
      const launchManualZipPath = launchManualPackage.zip
        ? path.join(PROJECT_ROOT, launchManualPackage.zip)
        : null;
      if (!launchManualZipPath || !await pathExists(launchManualZipPath)) {
        failures.push('launch_handoff: Cloudflare manual package ZIP must exist');
      } else {
        const launchManualZipStats = await fs.stat(launchManualZipPath);
        if (launchManualZipStats.size !== launchManualPackage.zip_bytes) {
          failures.push('launch_handoff: Cloudflare manual package ZIP byte size must match actual ZIP');
        }
      }
    }
    if (launchManualPackage.files_count !== manualUploadOutput.files_count) {
      failures.push('launch_handoff: Cloudflare manual package file count must match operator pack package');
    }
    if (launchManualPackage.files_total_bytes !== manualUploadOutput.files_total_bytes) {
      failures.push('launch_handoff: Cloudflare manual package total file bytes must match operator pack package');
    }
    if (launchManualPackage.files_count !== cloudflareDeployCandidate.package?.files_count) {
      failures.push('launch_handoff: Cloudflare manual package file count must match deploy candidate package');
    }
    if (launchManualPackage.files_total_bytes !== cloudflareDeployCandidate.package?.files_total_bytes) {
      failures.push('launch_handoff: Cloudflare manual package total file bytes must match deploy candidate package');
    }
    if (launchManualPackage.contract_coverage?.type !== 'cloudflare_pages_live_site_contract_coverage_v1') {
      failures.push('launch_handoff: Cloudflare manual package must expose live-site contract coverage');
    }
    if (launchManualPackage.contract_coverage?.full_artifact_required !== true || launchManualPackage.contract_coverage?.partial_upload_safe !== false) {
      failures.push('launch_handoff: Cloudflare manual package must preserve full-artifact contract coverage rules');
    }
    if (String(normalizeRel(path.relative(PROJECT_ROOT, files.operatorPack))).includes('-latest.')) {
      failures.push('operator_pack: verifier must inspect an immutable timestamped operator pack, not the latest alias');
    }
    if (cloudflareDeployCandidate.type !== 'cloudflare_pages_deploy_candidate_v1') {
      failures.push('operator_pack: missing Cloudflare deploy candidate payload');
    }
    if (cloudflareDeployCandidate.deployment_approval_required !== true || cloudflareDeployCandidate.deploy_allowed_without_approval !== false) {
      failures.push('operator_pack: Cloudflare deploy candidate must require explicit approval');
    }
    if (cloudflareDeployCandidate.package?.zip_path !== operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.path) {
      failures.push('operator_pack: Cloudflare deploy candidate ZIP path does not match manual upload package');
    }
    if (String(cloudflareDeployCandidate.package?.zip_path || '').includes('-latest.')) {
      failures.push('operator_pack: Cloudflare deploy candidate must reference an immutable timestamped ZIP, not a latest alias');
    }
    if (cloudflareDeployCandidate.package?.zip_sha256 !== operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.sha256) {
      failures.push('operator_pack: Cloudflare deploy candidate ZIP SHA-256 does not match manual upload package');
    }
    if (cloudflareDeployCandidate.package?.manifest !== manualPackageManifestPath) {
      failures.push('operator_pack: Cloudflare deploy candidate manifest does not match manual upload package');
    }
    if (String(manualPackageManifestPath || '').includes('-latest.')) {
      failures.push('operator_pack: Cloudflare manual upload manifest must be timestamped, not a latest alias');
    }
    if (cloudflareDeployCandidate.git?.commit && operatorPack.git?.commit && cloudflareDeployCandidate.git.commit !== operatorPack.git.commit) {
      failures.push('operator_pack: Cloudflare deploy candidate Git commit does not match operator pack');
    }
    for (const requiredPostDeployCheck of REQUIRED_POST_DEPLOY_CHECKS) {
      if (!cloudflareDeployCandidate.required_post_deploy_checks?.includes(requiredPostDeployCheck)) {
        failures.push(`operator_pack: Cloudflare deploy candidate must require ${requiredPostDeployCheck} after deploy`);
      }
    }
    if (cloudflareDeployCandidate.deploy_branch_policy?.default_direct_deploy_branch !== 'preview-cantoni-site') {
      failures.push('operator_pack: Cloudflare deploy candidate must document preview-cantoni-site as default direct branch');
    }
    if (cloudflareDeployCandidate.deploy_branch_policy?.production_branch !== 'main') {
      failures.push('operator_pack: Cloudflare deploy candidate must document main as production branch');
    }
    if (cloudflareDeployCandidate.deploy_branch_policy?.preview_deploy_clears_live_site_contract !== false) {
      failures.push('operator_pack: Cloudflare deploy candidate must state preview deploys do not clear production live contract');
    }
    if (cloudflareDeployCandidate.deploy_branch_policy?.live_site_contract_fix_requires_production_branch !== true) {
      failures.push('operator_pack: Cloudflare deploy candidate must state live contract fix requires production branch');
    }
    const readinessGates = operatorPack.readiness?.gates || [];
    const artifactGate = readinessGates.find((gate) => gate.id === 'cloudflare_artifact_contract');
    const gitDeployStateGate = readinessGates.find((gate) => gate.id === 'git_deploy_state');
    const publicSocialGate = readinessGates.find((gate) => gate.id === 'public_social_channels');
    const leadEndpointGate = readinessGates.find((gate) => gate.id === 'lead_capture_endpoint');
    const paymentBrandingGate = readinessGates.find((gate) => gate.id === 'payment_branding_review');
    const externalUnblockHandoffGate = readinessGates.find((gate) => gate.id === 'external_unblock_handoff');
    const paymentBrandingFlagPresent = await pathExists(path.join(PROJECT_ROOT, 'sales-kit/payment_branding_review.flag'));
    if (!artifactGate) {
      failures.push('operator_pack: missing cloudflare_artifact_contract readiness gate');
    } else if (artifactGate.ok !== true) {
      failures.push('operator_pack: cloudflare_artifact_contract readiness gate must pass before handoff');
    } else if (artifactGate.details?.artifact_ok !== true || artifactGate.details?.build_ok !== true) {
      failures.push('operator_pack: cloudflare_artifact_contract must include passing build and artifact details');
    }
    if (!gitDeployStateGate) {
      failures.push('operator_pack: missing git_deploy_state readiness gate');
    } else if (!gitDeployStateGate.details || typeof gitDeployStateGate.details.dirty !== 'boolean') {
      failures.push('operator_pack: git_deploy_state gate must include Git cleanliness details');
    }
    if (!publicSocialGate) {
      failures.push('operator_pack: missing public_social_channels readiness gate');
    } else if (publicSocialGate.ok !== true) {
      failures.push('operator_pack: public_social_channels readiness gate must pass before handoff');
    } else if (!Array.isArray(publicSocialGate.details?.results) || publicSocialGate.details.results.length < 5) {
      failures.push('operator_pack: public_social_channels gate must expose checked channel details');
    } else {
      for (const result of publicSocialGate.details.results) {
        if (typeof result.loadError !== 'boolean') {
          failures.push(`operator_pack: public_social_channels result ${result.id || 'unknown'} must expose boolean loadError`);
        }
        if (result.observed === 'metadata-proof-load-error' && result.loadError !== true) {
          failures.push(`operator_pack: public_social_channels result ${result.id || 'unknown'} metadata-proof-load-error must set loadError=true`);
        }
      }
    }
    if (!leadEndpointGate) {
      failures.push('operator_pack: missing lead_capture_endpoint readiness gate');
    } else if (leadEndpointGate.ok !== true) {
      failures.push('operator_pack: lead_capture_endpoint readiness gate must pass before handoff');
    } else if (leadEndpointGate.details?.endpointHost !== 'script.google.com' || leadEndpointGate.details?.health?.service !== 'cantoni-digital-studio-leads') {
      failures.push('operator_pack: lead_capture_endpoint gate must expose Cantoni Apps Script health details');
    }
    if (paymentBrandingFlagPresent) {
      if (!paymentBrandingGate) {
        failures.push('operator_pack: missing payment_branding_review readiness gate while payment branding flag exists');
      } else if (paymentBrandingGate.severity !== 'hold') {
        failures.push('operator_pack: payment_branding_review gate must be a hold while payment branding flag exists');
      } else if (paymentBrandingGate.details?.flag?.present !== true) {
        failures.push('operator_pack: payment_branding_review gate must expose the review flag');
      }
      validatePaymentBrandingBoundary({
        boundary: operatorPack.payment_branding_boundary,
        label: 'operator_pack',
        failures
      });
      validatePaymentBrandingBoundary({
        boundary: launchHandoff.payment_branding_boundary,
        label: 'launch_handoff',
        failures
      });
    }
    if (!externalUnblockHandoffGate) {
      failures.push('operator_pack: missing external_unblock_handoff readiness gate');
    } else if (externalUnblockHandoffGate.ok === true && !String(externalUnblockHandoffGate.details?.handoff || '').endsWith('cantoni-external-unblock-handoff-latest.json')) {
      failures.push('operator_pack: external_unblock_handoff gate must point to latest handoff JSON');
    } else if (externalUnblockHandoffGate.ok !== true && externalUnblockHandoffGate.severity !== 'advisory') {
      failures.push('operator_pack: external_unblock_handoff failures must be advisory during pack generation');
    }
    const expectedArtifactReady = artifactGate?.ok === true &&
      artifactGate.details?.artifact_ok === true &&
      artifactGate.details?.build_ok === true &&
      Boolean(operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.path) &&
      Boolean(operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.sha256);
    const expectedGitReady = gitDeployStateGate?.ok === true &&
      operatorPack.git?.dirty === false &&
      operatorPack.git?.ahead === 0 &&
      operatorPack.git?.behind === 0;
    if (cloudflareDeployCandidate.artifact_ready !== expectedArtifactReady) {
      failures.push('operator_pack: Cloudflare deploy candidate artifact_ready does not match artifact gate/package evidence');
    }
    if (cloudflareDeployCandidate.git_ready !== expectedGitReady) {
      failures.push('operator_pack: Cloudflare deploy candidate git_ready does not match Git deploy gate');
    }
    if (!expectedGitReady && !(cloudflareDeployCandidate.execution_blockers || []).includes('git_deploy_state')) {
      failures.push('operator_pack: Cloudflare deploy candidate must explain Git deploy state blocker when Git is not ready');
    }
    const operatorMarkdown = await fs.readFile(files.operatorPack.replace(/\.json$/u, '.md'), 'utf8');
    const launchMarkdown = await fs.readFile(files.launchHandoff.replace(/\.json$/u, '.md'), 'utf8');
    const emailMarkdown = await fs.readFile(files.emailDns.replace(/\.json$/u, '.md'), 'utf8');
    if (!operatorMarkdown.includes('## Verified Passing Gates') || !operatorMarkdown.includes('cloudflare_artifact_contract')) {
      failures.push('operator_pack: Markdown must expose verified passing readiness gates');
    }
    if (!operatorMarkdown.includes('public_social_channels')) {
      failures.push('operator_pack: Markdown must expose public social channel verification');
    }
    if (!operatorMarkdown.includes('lead_capture_endpoint')) {
      failures.push('operator_pack: Markdown must expose lead capture endpoint verification');
    }
    if (!operatorMarkdown.includes('npm run audit:git-deploy-state')) {
      failures.push('operator_pack: Markdown must require Git deploy state verification before deploy');
    }
    if (paymentBrandingFlagPresent && (!operatorMarkdown.includes('payment_branding_review') || !operatorMarkdown.includes('sales-kit/payment_branding_review.flag'))) {
      failures.push('operator_pack: Markdown must expose payment branding hold while flag exists');
    }
    if (paymentBrandingFlagPresent && (!operatorMarkdown.includes('## Payment Branding Boundary') || !operatorMarkdown.includes('No EC8/EC8 Platform exception valid for release: yes'))) {
      failures.push('operator_pack: Markdown must expose current payment branding boundary and EC8 exception rejection');
    }
    for (const requiredPostDeployCheck of REQUIRED_POST_DEPLOY_CHECKS) {
      if (!operatorMarkdown.includes(requiredPostDeployCheck)) {
        failures.push(`operator_pack: Markdown must require ${requiredPostDeployCheck} after deploy`);
      }
    }
    if (!operatorMarkdown.includes('preview-cantoni-site') || !operatorMarkdown.includes('CLOUDFLARE_PAGES_BRANCH=main')) {
      failures.push('operator_pack: Markdown must document preview-vs-production branch behavior for live contract fix');
    }
    for (const requiredExternalHandoffText of [
      '## External Unblock Handoff Timing',
      'This operator pack is the upstream source for the external unblock handoff.',
      'npm run export:external-unblock-handoff',
      'npm run test:external-unblock-handoff',
      'The latest external unblock handoff must reference this exact operator pack before any external mutation starts.'
    ]) {
      if (!operatorMarkdown.includes(requiredExternalHandoffText)) {
        failures.push(`operator_pack: Markdown must expose external unblock handoff timing text: ${requiredExternalHandoffText}`);
      }
    }
    if (!launchMarkdown.includes('## Verified Passing Gates') || !launchMarkdown.includes('cloudflare_artifact_contract')) {
      failures.push('launch_handoff: Markdown must expose verified passing readiness gates');
    }
    if (!launchMarkdown.includes('public_social_channels')) {
      failures.push('launch_handoff: Markdown must expose public social channel verification');
    }
    if (!launchMarkdown.includes('lead_capture_endpoint')) {
      failures.push('launch_handoff: Markdown must expose lead capture endpoint verification');
    }
    if (paymentBrandingFlagPresent && (!launchMarkdown.includes('payment_branding_review') || !launchMarkdown.includes('sales-kit/payment_branding_review.flag'))) {
      failures.push('launch_handoff: Markdown must expose payment branding hold while flag exists');
    }
    if (paymentBrandingFlagPresent && (!launchMarkdown.includes('## Payment Branding Boundary') || !launchMarkdown.includes('No EC8/EC8 Platform exception valid for release: yes'))) {
      failures.push('launch_handoff: Markdown must expose current payment branding boundary and EC8 exception rejection');
    }
    for (const requiredPostDeployCheck of REQUIRED_POST_DEPLOY_CHECKS) {
      if (!launchMarkdown.includes(requiredPostDeployCheck)) {
        failures.push(`launch_handoff: Markdown must require ${requiredPostDeployCheck} after deploy`);
      }
    }
    for (const requiredLaunchPackageText of [
      'Manual package README',
      'Production live-site contract coverage in this ZIP',
      'Do not upload only these files',
      'ZIP bytes:',
      'Full artifact required: yes',
      'Partial upload safe: no'
    ]) {
      if (!launchMarkdown.includes(requiredLaunchPackageText)) {
        failures.push(`launch_handoff: Markdown must expose Cloudflare manual package safety text: ${requiredLaunchPackageText}`);
      }
    }
    if (!operatorMarkdown.includes('ZIP bytes:')) {
      failures.push('operator_pack: Markdown must expose Cloudflare ZIP byte size');
    }

    const cloudflareAuth = launchHandoff.cloudflare_auth || {};
    const cloudflareAuthOk = cloudflareAuth.ok === true;
    if (!cloudflareAuthOk && cloudflareAuth.diagnostic_code !== 'pages_api_authentication_error_10000') {
      failures.push('launch_handoff: missing actionable Cloudflare auth diagnostic');
    }
    if (!cloudflareAuthOk && (!Array.isArray(cloudflareAuth.next_actions) || cloudflareAuth.next_actions.length === 0)) {
      failures.push('launch_handoff: missing Cloudflare next_actions');
    }
    if ((operatorPack.cloudflare_auth?.ok === true) !== cloudflareAuthOk) {
      failures.push('operator_pack: Cloudflare auth ok state does not match launch handoff');
    }
    if (!cloudflareAuthOk && operatorPack.cloudflare_auth?.diagnostic_code !== cloudflareAuth.diagnostic_code) {
      failures.push('operator_pack: Cloudflare diagnostic does not match launch handoff');
    }

    const cloudflareApi = launchHandoff.cloudflare_api || {};
    const operatorCloudflareApi = operatorPack.cloudflare_api || {};
    if (typeof cloudflareApi.ok !== 'boolean') {
      failures.push('launch_handoff: missing Cloudflare direct API diagnostic');
    }
    if ((operatorCloudflareApi.ok === true) !== (cloudflareApi.ok === true)) {
      failures.push('operator_pack: Cloudflare direct API ok state does not match launch handoff');
    }
    for (const key of ['has_cloudflare_api_token', 'has_cloudflare_account_id', 'has_cloudflare_zone_id', 'token_verify_ok', 'pages_read_ok', 'dns_zone_identity_ok', 'dns_read_ok']) {
      if ((operatorCloudflareApi[key] === true) !== (cloudflareApi[key] === true)) {
        failures.push(`operator_pack: Cloudflare direct API ${key} state does not match launch handoff`);
      }
    }
    if (cloudflareApi.ok !== true && (!Array.isArray(cloudflareApi.next_actions) || cloudflareApi.next_actions.length === 0)) {
      failures.push('launch_handoff: missing Cloudflare direct API next_actions');
    }

    const apiRecords = emailDnsApi.records || [];
    const skippedRecords = emailDnsApi.skipped_records || [];
    if (!emailDns.source_commit || !emailDns.source_short_commit) {
      failures.push('email_dns: must expose source_commit and source_short_commit');
    }
    if (!emailDnsApi.source_commit || !emailDnsApi.source_short_commit) {
      failures.push('email_dns_api: must expose source_commit and source_short_commit');
    }
    if (emailDns.cloudflare_api_payload?.source_commit && emailDns.git?.commit && emailDns.cloudflare_api_payload.source_commit !== emailDns.git.commit) {
      failures.push('email_dns: cloudflare_api_payload source_commit must match handoff Git commit');
    }
    if (emailDns.cloudflare_api_payload?.git?.commit && emailDns.git?.commit && emailDns.cloudflare_api_payload.git.commit !== emailDns.git.commit) {
      failures.push('email_dns: cloudflare_api_payload Git commit must match handoff Git commit');
    }
    if (emailDnsApi.source_handoff?.json !== normalizeRel(path.relative(PROJECT_ROOT, files.emailDns))) {
      failures.push('email_dns_api: source_handoff.json must reference the timestamped email DNS handoff JSON');
    }
    if (emailDns.git?.commit && !emailMarkdown.includes(`Git full commit: ${emailDns.git.commit}`)) {
      failures.push('email_dns: Markdown must expose full Git commit');
    }
    if (emailDns.git?.branch && !emailMarkdown.includes(`Git branch: ${emailDns.git.branch}`)) {
      failures.push('email_dns: Markdown must expose Git branch');
    }
    if (apiRecords.some((record) => record.id === 'google_dkim')) {
      failures.push('email_dns_api: google_dkim must not be included before Google Admin value exists');
    }
    if (!skippedRecords.some((record) => record.id === 'google_dkim' && record.reason === 'manual_value_required')) {
      failures.push('email_dns_api: google_dkim must be listed as skipped manual record');
    }
    if (JSON.stringify(apiRecords).includes('<paste the DKIM TXT value')) {
      failures.push('email_dns_api: DKIM placeholder leaked into API payload');
    }
    if ((emailDns.cloudflare_api_payload || {}).records_count !== apiRecords.length) {
      failures.push('email_dns: API records_count does not match API payload');
    }

    const dnsPlanStep = operatorPack.steps?.email_dns_cloudflare_plan || {};
    const dnsPlan = dnsPlanStep.output || {};
    const dnsPlanActions = Array.isArray(dnsPlan.actions) ? dnsPlan.actions : [];
    if (!dnsPlanStep.command || !dnsPlanStep.command.includes('scripts/sync_cloudflare_email_dns.cjs --dry-run')) {
      failures.push('operator_pack: missing Cloudflare email DNS plan command');
    }
    if (dnsPlan.mode !== 'dry_run') {
      failures.push('operator_pack: Cloudflare email DNS plan must be dry_run');
    }
    if (dnsPlan.input !== 'sales-kit/generated/email-dns-handoff/cantoni-email-dns-handoff-latest.cloudflare-api-records.json') {
      failures.push('operator_pack: Cloudflare email DNS plan must use the stable latest API payload alias');
    }
    if (dnsPlan.payload_source_commit !== operatorPack.git?.commit) {
      failures.push('operator_pack: Cloudflare email DNS plan payload_source_commit must match operator pack Git commit');
    }
    if (dnsPlan.payload_git?.commit !== operatorPack.git?.commit) {
      failures.push('operator_pack: Cloudflare email DNS plan payload_git commit must match operator pack Git commit');
    }
    if (dnsPlan.payload_source_handoff?.json !== normalizeRel(path.relative(PROJECT_ROOT, files.emailDns))) {
      failures.push('operator_pack: Cloudflare email DNS plan must reference the timestamped email DNS handoff source');
    }
    if (!Array.isArray(dnsPlan.skipped_records) || !dnsPlan.skipped_records.some((record) => record.id === 'google_dkim' && record.reason === 'manual_value_required')) {
      failures.push('operator_pack: Cloudflare DNS plan must keep google_dkim skipped as manual');
    }
    if (JSON.stringify(dnsPlanActions).includes('google_dkim') || JSON.stringify(dnsPlanActions).includes('google._domainkey')) {
      failures.push('operator_pack: Cloudflare DNS plan must not include DKIM in apply actions');
    }
    if (dnsPlan.source === 'no_credentials') {
      if (dnsPlan.ready_to_apply !== false) {
        failures.push('operator_pack: no-credentials DNS plan must not be ready to apply');
      }
      if (!dnsPlanActions.length || !dnsPlanActions.every((action) => action.action === 'cloudflare_lookup_required')) {
        failures.push('operator_pack: no-credentials DNS plan must require Cloudflare lookup for all records');
      }
    } else if (dnsPlan.source === 'cloudflare_api') {
      if (dnsPlan.cloudflare?.token_present !== true || dnsPlan.cloudflare?.zone_id_present !== true) {
        failures.push('operator_pack: Cloudflare DNS API source must report token and zone id presence only');
      }
    } else if (dnsPlan.source !== 'fixture') {
      failures.push('operator_pack: unsupported Cloudflare DNS plan source');
    }

    if (liveDrift.artifact_contract_ok !== true) {
      failures.push('live_drift: artifact must be contract-ready');
    }
    if (liveDrift.live_contract_ok !== true && liveDrift.deploy_only_drift !== true) {
      failures.push('live_drift: production must either be contract-ready or have deploy-only drift evidence');
    }
    const driftPatch = liveDrift.contract_drift_patch || {};
    const driftPatchFiles = Array.isArray(driftPatch.files) ? driftPatch.files : [];
    if (liveDrift.deploy_only_drift === true) {
      if (driftPatch.type !== 'cloudflare_pages_contract_drift_patch_v1') {
        failures.push('live_drift: missing contract drift patch payload');
      }
      if (driftPatch.full_artifact_required !== true || driftPatch.partial_upload_safe !== false) {
        failures.push('live_drift: contract drift patch must require full artifact deployment');
      }
      if (!driftPatchFiles.length) {
        failures.push('live_drift: deploy-only drift must list files fixed by the artifact');
      }
      for (const item of driftPatchFiles) {
        if (!item.page || !item.artifact_file || !item.artifact_sha256 || !item.live_sha256) {
          failures.push('live_drift: every patch file must include page, artifact file, and hashes');
        }
        if (item.deploy_should_fix !== true || item.artifact_satisfies_required !== true) {
          failures.push(`live_drift: ${item.page || 'unknown page'} must be marked as fixed by the artifact`);
        }
        if (!Array.isArray(item.live_missing_required) || !item.live_missing_required.length) {
          failures.push(`live_drift: ${item.page || 'unknown page'} must list live missing snippets`);
        }
      }
      if (!operatorMarkdown.includes('## Live Drift Deploy Patch') || !operatorMarkdown.includes('Full artifact required: yes')) {
        failures.push('operator_pack: Markdown must expose the live drift deploy patch and full-artifact rule');
      }
      if (cloudflareDeployCandidate.would_fix_live_contract !== true) {
        failures.push('operator_pack: Cloudflare deploy candidate must mark deploy-only live contract fix');
      }
      if (cloudflareDeployCandidate.live_drift_patch?.full_artifact_required !== true || cloudflareDeployCandidate.live_drift_patch?.partial_upload_safe !== false) {
        failures.push('operator_pack: Cloudflare deploy candidate must preserve full-artifact deploy rule');
      }
      if (cloudflareDeployCandidate.live_drift_patch?.files_count !== driftPatchFiles.length) {
        failures.push('operator_pack: Cloudflare deploy candidate drift file count does not match live drift report');
      }
      const candidatePatchPages = cloudflareDeployCandidate.live_drift_patch?.pages || [];
      for (const item of driftPatchFiles) {
        if (!candidatePatchPages.includes(item.page)) {
          failures.push(`operator_pack: Cloudflare deploy candidate missing drift page ${item.page}`);
        }
      }
      if (!operatorMarkdown.includes('## Cloudflare Deploy Candidate') || !operatorMarkdown.includes('Deploy allowed without approval: no')) {
        failures.push('operator_pack: Markdown must expose the deploy candidate approval boundary');
      }
    }

    const stepOutput = operatorPack.steps?.email_dns_handoff?.output || {};
    const uploadStepOutput = operatorPack.steps?.cloudflare_manual_upload?.output || {};
    if (uploadStepOutput.latest?.zip_path !== 'sales-kit/generated/cloudflare-manual-upload/cantoni-cloudflare-pages-manual-upload-latest.zip') {
      failures.push('operator_pack: Cloudflare manual upload output must expose the latest ZIP alias');
    }
    if (uploadStepOutput.latest?.manifest !== 'sales-kit/generated/cloudflare-manual-upload/cantoni-cloudflare-pages-manual-upload-latest.manifest.json') {
      failures.push('operator_pack: Cloudflare manual upload output must expose the latest manifest alias');
    }
    if (stepOutput.latest?.cloudflare_api_json !== 'sales-kit/generated/email-dns-handoff/cantoni-email-dns-handoff-latest.cloudflare-api-records.json') {
      failures.push('operator_pack: email DNS handoff output must expose the latest API payload alias');
    }
    await requireReferencedFile(cloudflareDeployCandidate.package?.zip_path, 'operator_pack.deploy_candidate_zip', failures);
    await requireReferencedFile(cloudflareDeployCandidate.package?.manifest, 'operator_pack.deploy_candidate_manifest', failures);
    await requireReferencedFile(operatorPack.steps?.cloudflare_manual_upload?.output?.zip?.path, 'operator_pack.cloudflare_zip', failures);
    await requireReferencedFile(manualPackageManifestPath, 'operator_pack.cloudflare_manifest', failures);
    await requireReferencedFile(operatorPack.steps?.cloudflare_manual_upload?.output?.checksums, 'operator_pack.cloudflare_checksums', failures);
    await requireReferencedFile(operatorPack.steps?.cloudflare_manual_upload?.output?.readme, 'operator_pack.cloudflare_readme', failures);
    await requireReferencedFile(launchManualPackage.zip, 'launch_handoff.cloudflare_zip', failures);
    await requireReferencedFile(launchManualPackage.manifest, 'launch_handoff.cloudflare_manifest', failures);
    await requireReferencedFile(launchManualPackage.checksums, 'launch_handoff.cloudflare_checksums', failures);
    await requireReferencedFile(launchManualPackage.readme, 'launch_handoff.cloudflare_readme', failures);
    await requireReferencedFile(stepOutput.cloudflare_api_json, 'operator_pack.email_dns_api_json', failures);
    await requireReferencedFile(operatorPack.steps?.launch_handoff?.output?.json, 'operator_pack.launch_handoff_json', failures);
    await requireReferencedFile(operatorPack.steps?.live_drift?.output?.json, 'operator_pack.live_drift_json', failures);
  }

  for (const filePath of leakScanFiles) {
    await scanLeaks(filePath, failures);
  }

  const report = {
    ok: failures.length === 0,
    checked: Object.fromEntries(Object.entries(files).map(([key, filePath]) => [
      key,
      filePath ? normalizeRel(path.relative(PROJECT_ROOT, filePath)) : null
    ])),
    failures
  };

  console.log(JSON.stringify(report, null, 2));

  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
