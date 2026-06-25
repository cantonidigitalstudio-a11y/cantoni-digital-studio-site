const path = require('path');
const { gitProvenance } = require('./lib/git_provenance.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXPECTED_REMOTE_NAME = process.env.CANTONI_GIT_DEPLOY_REMOTE_NAME || 'cantoni';
const EXPECTED_REMOTE_URL_SNIPPET = process.env.CANTONI_GIT_DEPLOY_REMOTE_URL_SNIPPET || 'cantonidigitalstudio-a11y/cantoni-digital-studio-site';
const EXPECTED_BRANCH = process.env.CANTONI_GIT_DEPLOY_BRANCH || '';

function main() {
  const git = gitProvenance(PROJECT_ROOT);
  const failures = [];

  if (!git.commit) {
    failures.push({
      id: 'git_commit_missing',
      reason: 'Unable to resolve HEAD; deploy must start from a committed Cantoni artifact state.'
    });
  }
  if (!git.upstream) {
    failures.push({
      id: 'git_upstream_missing',
      reason: 'Current branch has no upstream; push and track the Cantoni remote before deploy.'
    });
  }
  if (git.remote_name !== EXPECTED_REMOTE_NAME) {
    failures.push({
      id: 'git_remote_name_mismatch',
      reason: `Expected upstream remote ${EXPECTED_REMOTE_NAME}, observed ${git.remote_name || 'none'}.`
    });
  }
  if (!git.remote_url || !git.remote_url.includes(EXPECTED_REMOTE_URL_SNIPPET)) {
    failures.push({
      id: 'git_remote_url_mismatch',
      reason: `Expected upstream remote URL to include ${EXPECTED_REMOTE_URL_SNIPPET}.`
    });
  }
  if (EXPECTED_BRANCH && git.branch !== EXPECTED_BRANCH) {
    failures.push({
      id: 'git_branch_mismatch',
      reason: `Expected branch ${EXPECTED_BRANCH}, observed ${git.branch || 'unknown'}.`
    });
  }
  if (git.dirty) {
    failures.push({
      id: 'git_worktree_dirty',
      reason: `Worktree has ${git.status_entries} uncommitted or untracked entr${git.status_entries === 1 ? 'y' : 'ies'}; commit or remove them before deploy.`
    });
  }
  if (git.ahead !== 0 || git.behind !== 0) {
    failures.push({
      id: 'git_upstream_not_aligned',
      reason: `Branch must be pushed and up to date before deploy; ahead=${git.ahead ?? 'unknown'}, behind=${git.behind ?? 'unknown'}.`
    });
  }

  const report = {
    ok: failures.length === 0,
    checked_at: new Date().toISOString(),
    expected: {
      remote_name: EXPECTED_REMOTE_NAME,
      remote_url_snippet: EXPECTED_REMOTE_URL_SNIPPET,
      branch: EXPECTED_BRANCH || null
    },
    git,
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

main();
