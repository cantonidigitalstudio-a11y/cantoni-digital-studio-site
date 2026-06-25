#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { gitProvenance } = require('./lib/git_provenance.cjs');

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
  if (candidate.type !== 'cloudflare_pages_deploy_candidate_v1') {
    failures.push('cloudflare_deploy_candidate.type must be cloudflare_pages_deploy_candidate_v1');
  }
  if (candidate.deployment_approval_required !== true || candidate.deploy_allowed_without_approval !== false) {
    failures.push('Cloudflare deploy candidate must require explicit approval and must not allow unapproved deploy.');
  }
  if (candidate.artifact_ready !== true) failures.push('Cloudflare deploy candidate artifact_ready must be true.');
  if (candidate.would_fix_live_contract !== true) failures.push('Cloudflare deploy candidate must prove the full artifact should fix live contract drift.');

  if (pack?.git?.commit !== currentGit.commit) failures.push('Launch operator pack commit does not match current HEAD.');
  if (candidate.git?.commit !== currentGit.commit) failures.push('Cloudflare deploy candidate commit does not match current HEAD.');
  if (pack?.git?.upstream !== currentGit.upstream) failures.push('Launch operator pack upstream does not match current Git upstream.');
  if (REQUIRE_EXECUTION_READY && currentGit.dirty) failures.push('Current Git worktree is dirty.');
  if (REQUIRE_EXECUTION_READY && (currentGit.ahead !== 0 || currentGit.behind !== 0)) failures.push('Current Git branch is not aligned with upstream.');

  const zipPath = resolveRepoPath(candidate.package?.zip_path);
  const manifestPath = resolveRepoPath(candidate.package?.manifest);
  const checksumsPath = resolveRepoPath(candidate.package?.checksums);
  if (!zipPath) failures.push('Cloudflare deploy candidate ZIP path must be repo-relative.');
  else if (!await pathExists(zipPath)) failures.push(`Cloudflare deploy candidate ZIP does not exist: ${candidate.package?.zip_path}`);
  if (!manifestPath) failures.push('Cloudflare deploy candidate manifest path must be repo-relative.');
  else if (!await pathExists(manifestPath)) failures.push(`Cloudflare deploy candidate manifest does not exist: ${candidate.package?.manifest}`);
  if (candidate.package?.checksums) {
    if (!checksumsPath) failures.push('Cloudflare deploy candidate checksums path must be repo-relative.');
    else if (!await pathExists(checksumsPath)) failures.push(`Cloudflare deploy candidate checksums file does not exist: ${candidate.package.checksums}`);
  }
  if (zipPath && await pathExists(zipPath) && candidate.package?.zip_sha256) {
    const actualZipHash = await sha256File(zipPath);
    if (actualZipHash !== candidate.package.zip_sha256) failures.push('Cloudflare deploy candidate ZIP SHA-256 does not match the referenced ZIP.');
  } else if (!candidate.package?.zip_sha256) {
    failures.push('Cloudflare deploy candidate ZIP SHA-256 is missing.');
  }
  if (manifestPath && await pathExists(manifestPath)) {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    if (manifest.git?.commit !== currentGit.commit) failures.push('Cloudflare manual upload manifest commit does not match current HEAD.');
    if (manifest.zip?.sha256 !== candidate.package?.zip_sha256) failures.push('Cloudflare manual upload manifest ZIP SHA-256 does not match deploy candidate.');
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
      manifest: candidate.package?.manifest || null
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
