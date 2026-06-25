#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { gitProvenance } = require('./lib/git_provenance.cjs');
const { HTML_PAGES } = require('./lib/live_site_contract.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OPERATOR_PACK_DIR = path.resolve(process.env.LAUNCH_OPERATOR_PACK_DIR || path.join(PROJECT_ROOT, 'sales-kit/generated/launch-operator-pack'));
const REQUIRE_EXECUTION_READY = process.argv.includes('--require-execution-ready');
const PACK_PATTERN = /^cantoni-launch-operator-pack-(?!latest\b).+\.json$/u;

function normalizeRel(value) {
  return String(value || '').split(path.sep).join('/');
}

function relativeToRoot(filePath) {
  if (!filePath) return null;
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(PROJECT_ROOT + path.sep)) return filePath;
  return normalizeRel(path.relative(PROJECT_ROOT, resolved));
}

function artifactFileForContractPage(pagePath) {
  if (pagePath === '/') return 'index.html';
  return String(pagePath || '').replace(/^\/+/, '');
}

async function latestOperatorPackPath() {
  const entries = await fs.readdir(OPERATOR_PACK_DIR, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isFile() && PACK_PATTERN.test(entry.name))
    .map((entry) => path.join(OPERATOR_PACK_DIR, entry.name))
    .sort()
    .reverse();
  return matches[0] || null;
}

function resolveRepoPath(relPath) {
  if (!relPath || typeof relPath !== 'string') return null;
  if (path.isAbsolute(relPath)) return null;
  const resolved = path.resolve(PROJECT_ROOT, relPath);
  if (!resolved.startsWith(PROJECT_ROOT + path.sep)) return null;
  return resolved;
}

async function sha256File(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const failures = [];
  const packPath = await latestOperatorPackPath().catch((error) => {
    failures.push(`Unable to read launch operator pack directory: ${error.message}`);
    return null;
  });
  const currentGit = gitProvenance(PROJECT_ROOT);
  let pack = null;

  if (!packPath) {
    failures.push('No launch operator pack JSON found. Run npm run export:launch-operator-pack first.');
  } else {
    pack = JSON.parse(await fs.readFile(packPath, 'utf8'));
  }

  const candidate = pack?.cloudflare_deploy_candidate || {};
  const branchPolicy = candidate.deploy_branch_policy || {};
  if (candidate.type !== 'cloudflare_pages_deploy_candidate_v1') {
    failures.push('cloudflare_deploy_candidate.type must be cloudflare_pages_deploy_candidate_v1');
  }
  if (candidate.deployment_approval_required !== true || candidate.deploy_allowed_without_approval !== false) {
    failures.push('Cloudflare deploy candidate must require explicit approval and must not allow unapproved deploy.');
  }
  if (candidate.artifact_ready !== true) failures.push('Cloudflare deploy candidate artifact_ready must be true.');
  if (candidate.would_fix_live_contract !== true) failures.push('Cloudflare deploy candidate must prove the full artifact should fix live contract drift.');
  if (branchPolicy.default_direct_deploy_branch !== 'preview-cantoni-site') failures.push('Cloudflare deploy candidate must document preview-cantoni-site as the default direct deploy branch.');
  if (branchPolicy.production_branch !== 'main') failures.push('Cloudflare deploy candidate must document main as the production branch.');
  if (branchPolicy.preview_deploy_clears_live_site_contract !== false) failures.push('Cloudflare deploy candidate must state that preview deploys do not clear the production live-site contract.');
  if (branchPolicy.live_site_contract_fix_requires_production_branch !== true) failures.push('Cloudflare deploy candidate must state that live-site contract fix requires the production branch.');

  if (pack?.git?.commit !== currentGit.commit) failures.push('Launch operator pack commit does not match current HEAD.');
  if (candidate.git?.commit !== currentGit.commit) failures.push('Cloudflare deploy candidate commit does not match current HEAD.');
  if (pack?.git?.upstream !== currentGit.upstream) failures.push('Launch operator pack upstream does not match current Git upstream.');
  if (REQUIRE_EXECUTION_READY && currentGit.dirty) failures.push('Current Git worktree is dirty.');
  if (REQUIRE_EXECUTION_READY && (currentGit.ahead !== 0 || currentGit.behind !== 0)) failures.push('Current Git branch is not aligned with upstream.');

  const zipPath = resolveRepoPath(candidate.package?.zip_path);
  const manifestPath = resolveRepoPath(candidate.package?.manifest);
  const checksumsPath = resolveRepoPath(candidate.package?.checksums);
  const readmePath = resolveRepoPath(candidate.package?.readme);
  if (!zipPath) failures.push('Cloudflare deploy candidate ZIP path must be repo-relative.');
  else if (!await pathExists(zipPath)) failures.push(`Cloudflare deploy candidate ZIP does not exist: ${candidate.package?.zip_path}`);
  if (!manifestPath) failures.push('Cloudflare deploy candidate manifest path must be repo-relative.');
  else if (!await pathExists(manifestPath)) failures.push(`Cloudflare deploy candidate manifest does not exist: ${candidate.package?.manifest}`);
  if (!checksumsPath) failures.push('Cloudflare deploy candidate checksums path must be repo-relative.');
  else if (!await pathExists(checksumsPath)) failures.push(`Cloudflare deploy candidate checksums file does not exist: ${candidate.package?.checksums}`);
  if (!readmePath) failures.push('Cloudflare deploy candidate README path must be repo-relative.');
  else if (!await pathExists(readmePath)) failures.push(`Cloudflare deploy candidate README does not exist: ${candidate.package?.readme}`);
  if (zipPath && await pathExists(zipPath) && candidate.package?.zip_sha256) {
    const actualZipHash = await sha256File(zipPath);
    if (actualZipHash !== candidate.package.zip_sha256) failures.push('Cloudflare deploy candidate ZIP SHA-256 does not match the referenced ZIP.');
  } else if (!candidate.package?.zip_sha256) {
    failures.push('Cloudflare deploy candidate ZIP SHA-256 is missing.');
  }
  if (!Number.isInteger(candidate.package?.zip_bytes) || candidate.package.zip_bytes <= 0) {
    failures.push('Cloudflare deploy candidate ZIP byte size is missing.');
  } else if (zipPath && await pathExists(zipPath)) {
    const actualZipStats = await fs.stat(zipPath);
    if (actualZipStats.size !== candidate.package.zip_bytes) {
      failures.push('Cloudflare deploy candidate ZIP byte size does not match the referenced ZIP.');
    }
  }
  if (manifestPath && await pathExists(manifestPath)) {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const coverage = manifest.contract_coverage || {};
    if (manifest.git?.commit !== currentGit.commit) failures.push('Cloudflare manual upload manifest commit does not match current HEAD.');
    if (manifest.zip?.sha256 !== candidate.package?.zip_sha256) failures.push('Cloudflare manual upload manifest ZIP SHA-256 does not match deploy candidate.');
    if (manifest.zip?.bytes !== candidate.package?.zip_bytes) failures.push('Cloudflare manual upload manifest ZIP byte size does not match deploy candidate.');
    if (coverage.type !== 'cloudflare_pages_live_site_contract_coverage_v1') {
      failures.push('Cloudflare manual upload manifest must expose live-site contract coverage.');
    }
    if (coverage.full_artifact_required !== true || coverage.partial_upload_safe !== false) {
      failures.push('Cloudflare manual upload manifest contract coverage must require full artifact deployment.');
    }
    if (coverage.production_branch !== 'main') {
      failures.push('Cloudflare manual upload manifest contract coverage must require production branch main.');
    }
    if (!Array.isArray(coverage.pages)) {
      failures.push('Cloudflare manual upload manifest contract coverage must include page-level coverage.');
    } else {
      const coverageByPage = new Map(coverage.pages.map((page) => [page.page, page]));
      if (coverage.pages.length !== HTML_PAGES.length) {
        failures.push(`Cloudflare manual upload manifest contract coverage must include exactly ${HTML_PAGES.length} pages.`);
      }
      for (const expectedPage of HTML_PAGES) {
        const coveragePage = coverageByPage.get(expectedPage.path);
        if (!coveragePage) {
          failures.push(`Cloudflare manual upload manifest contract coverage missing page ${expectedPage.path}.`);
          continue;
        }

        const expectedArtifactFile = artifactFileForContractPage(expectedPage.path);
        if (coveragePage.artifact_file !== expectedArtifactFile) {
          failures.push(`Cloudflare manual upload manifest page ${expectedPage.path} artifact file must be ${expectedArtifactFile}.`);
        }
        if ((coveragePage.canonical || null) !== (expectedPage.canonical || null)) {
          failures.push(`Cloudflare manual upload manifest page ${expectedPage.path} canonical does not match live-site contract.`);
        }
        if (coveragePage.title !== expectedPage.title) {
          failures.push(`Cloudflare manual upload manifest page ${expectedPage.path} title marker does not match live-site contract.`);
        }
        if (coveragePage.artifact_file_present !== true) {
          failures.push(`Cloudflare manual upload manifest page ${expectedPage.path} artifact file is not marked present.`);
        }
        if (coveragePage.artifact_satisfies_required !== true) {
          failures.push(`Cloudflare manual upload manifest page ${expectedPage.path} does not satisfy required snippets.`);
        }
        if (Array.isArray(coveragePage.missing_required_snippets) && coveragePage.missing_required_snippets.length > 0) {
          failures.push(`Cloudflare manual upload manifest page ${expectedPage.path} has missing required snippets: ${coveragePage.missing_required_snippets.join(', ')}`);
        }

        const requiredSnippets = Array.isArray(coveragePage.required_snippets) ? coveragePage.required_snippets : [];
        for (const requiredSnippet of expectedPage.required || []) {
          if (!requiredSnippets.includes(requiredSnippet)) {
            failures.push(`Cloudflare manual upload manifest page ${expectedPage.path} missing required snippet coverage for ${requiredSnippet}.`);
          }
        }
      }
      for (const coveragePage of coverage.pages) {
        if (!HTML_PAGES.some((page) => page.path === coveragePage.page)) {
          failures.push(`Cloudflare manual upload manifest contract coverage includes unexpected page ${coveragePage.page || 'unknown'}.`);
        }
      }
    }
  }
  if (checksumsPath && await pathExists(checksumsPath)) {
    const checksums = await fs.readFile(checksumsPath, 'utf8');
    const zipName = path.basename(candidate.package?.zip_path || '');
    if (!checksums.includes(`${candidate.package?.zip_sha256}  ${zipName}`)) {
      failures.push('Cloudflare manual upload checksums must include the deploy candidate ZIP SHA-256.');
    }
  }
  if (readmePath && await pathExists(readmePath)) {
    const readme = await fs.readFile(readmePath, 'utf8');
    for (const requiredReadmeText of [
      `Git full commit: ${currentGit.commit}`,
      'Production live-site contract coverage in this ZIP',
      'Full artifact required: yes',
      'Partial upload safe: no',
      'Do not upload only these files',
      'CLOUDFLARE_PAGES_BRANCH=main',
      'ALLOW_PRODUCTION_DEPLOY=yes',
      'CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production',
      `ZIP SHA-256: ${candidate.package?.zip_sha256}`,
      `ZIP bytes: ${candidate.package?.zip_bytes}`,
      'npm run test:cloudflare-deploy-candidate'
    ]) {
      if (!readme.includes(requiredReadmeText)) {
        failures.push(`Cloudflare manual upload README missing deploy safety text: ${requiredReadmeText}`);
      }
    }
  }

  const executionBlockers = Array.isArray(candidate.execution_blockers) ? candidate.execution_blockers : [];
  if (candidate.git_ready !== true && !executionBlockers.includes('git_deploy_state')) {
    failures.push('Cloudflare deploy candidate git_ready=false must be explained by git_deploy_state.');
  }
  if (REQUIRE_EXECUTION_READY) {
    if (candidate.git_ready !== true) failures.push('Cloudflare deploy candidate git_ready must be true.');
    if (candidate.execution_ready !== true) failures.push(`Cloudflare deploy candidate is not execution-ready: ${(executionBlockers.length ? executionBlockers : ['unknown']).join(', ')}`);
    if (executionBlockers.length) failures.push(`Cloudflare deploy candidate still has execution blockers: ${executionBlockers.join(', ')}`);
    if (candidate.status !== 'ready_for_explicit_deploy_approval') failures.push(`Cloudflare deploy candidate status must be ready_for_explicit_deploy_approval, got ${candidate.status || 'unknown'}.`);
  }

  const report = {
    ok: failures.length === 0,
    require_execution_ready: REQUIRE_EXECUTION_READY,
    operator_pack: packPath ? relativeToRoot(packPath) : null,
    candidate_status: candidate.status || null,
    artifact_ready: candidate.artifact_ready === true,
    git_ready: candidate.git_ready === true,
    would_fix_live_contract: candidate.would_fix_live_contract === true,
    execution_ready: candidate.execution_ready === true,
    execution_blockers: executionBlockers,
    non_site_blockers: Array.isArray(candidate.non_site_blockers) ? candidate.non_site_blockers : [],
    package: {
      zip_path: candidate.package?.zip_path || null,
      zip_sha256: candidate.package?.zip_sha256 || null,
      zip_bytes: candidate.package?.zip_bytes ?? null,
      manifest: candidate.package?.manifest || null,
      checksums: candidate.package?.checksums || null,
      readme: candidate.package?.readme || null
    },
    git: {
      commit: currentGit.commit,
      short_commit: currentGit.short_commit,
      branch: currentGit.branch,
      upstream: currentGit.upstream,
      ahead: currentGit.ahead,
      behind: currentGit.behind,
      dirty: currentGit.dirty
    },
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message || String(error)
  }, null, 2));
  process.exit(1);
});
