const { spawnSync } = require('child_process');

function runGit(projectRoot, args) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    shell: false
  });

  if (result.error || result.status !== 0) return null;
  return String(result.stdout || '').trim();
}

function parseAheadBehind(value) {
  const [aheadRaw, behindRaw] = String(value || '').trim().split(/\s+/u);
  const ahead = Number.parseInt(aheadRaw, 10);
  const behind = Number.parseInt(behindRaw, 10);
  return {
    ahead: Number.isFinite(ahead) ? ahead : null,
    behind: Number.isFinite(behind) ? behind : null
  };
}

function gitProvenance(projectRoot) {
  const commit = runGit(projectRoot, ['rev-parse', 'HEAD']);
  const branch = runGit(projectRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = runGit(projectRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const remoteName = upstream && upstream.includes('/') ? upstream.split('/')[0] : null;
  const remoteUrl = remoteName ? runGit(projectRoot, ['config', '--get', `remote.${remoteName}.url`]) : null;
  const statusPorcelain = runGit(projectRoot, ['status', '--porcelain', '--untracked-files=normal']);
  const aheadBehind = upstream ? parseAheadBehind(runGit(projectRoot, ['rev-list', '--left-right', '--count', `HEAD...${upstream}`])) : { ahead: null, behind: null };

  return {
    commit,
    short_commit: commit ? commit.slice(0, 7) : null,
    branch,
    upstream,
    remote_name: remoteName,
    remote_url: remoteUrl,
    ahead: aheadBehind.ahead,
    behind: aheadBehind.behind,
    dirty: Boolean(statusPorcelain),
    status_entries: statusPorcelain ? statusPorcelain.split('\n').filter(Boolean).length : 0
  };
}

module.exports = {
  gitProvenance
};
