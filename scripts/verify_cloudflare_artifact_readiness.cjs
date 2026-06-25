const { spawnSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    shell: false,
    ...options
  });

  return {
    command: [command, ...args].join(' '),
    status: result.status,
    signal: result.signal || null,
    error: result.error ? result.error.message : null,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim()
  };
}

function failure(id, reason) {
  return { id, reason };
}

function parseJson(stdout) {
  try {
    return stdout ? JSON.parse(stdout) : null;
  } catch (error) {
    return {
      ok: false,
      failures: [failure('artifact_json_parse_error', error.message)]
    };
  }
}

function main() {
  const build = run('npm', ['run', 'build:cloudflare']);
  let artifact = null;
  let parsed = null;
  const failures = [];

  if (build.error || build.status !== 0) {
    failures.push(failure('build_cloudflare_failed', build.error || build.stderr || `build:cloudflare exited with ${build.status}`));
  } else {
    artifact = run(process.execPath, ['scripts/verify_deploy_artifact.cjs', '--json'], {
      env: { ...process.env, SITE_ROOT: '.cloudflare-pages' }
    });
    parsed = parseJson(artifact.stdout);

    if (artifact.error || artifact.status !== 0) {
      failures.push(...((parsed?.failures || []).length ? parsed.failures : [
        failure('artifact_contract_failed', artifact.error || artifact.stderr || `verify_deploy_artifact exited with ${artifact.status}`)
      ]));
    } else if (parsed?.ok !== true) {
      failures.push(...((parsed?.failures || []).length ? parsed.failures : [
        failure('artifact_contract_failed', 'Cloudflare Pages artifact did not report ok=true.')
      ]));
    }
  }

  const report = {
    ok: failures.length === 0,
    checked_at: new Date().toISOString(),
    public_dir: '.cloudflare-pages',
    build: {
      command: build.command,
      status: build.status,
      ok: build.status === 0 && !build.error
    },
    artifact: parsed ? {
      command: artifact?.command || null,
      status: artifact?.status ?? null,
      ok: parsed.ok === true,
      files_count: parsed.files_count ?? null,
      required_files_count: parsed.required_files_count ?? null,
      artifact_root: parsed.artifact_root || null
    } : null,
    failures
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main();
