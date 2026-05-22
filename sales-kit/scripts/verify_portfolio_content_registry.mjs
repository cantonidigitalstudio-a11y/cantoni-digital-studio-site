import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const registryFile = path.join(rootDir, 'social-launch/portfolio-content-registry.json');

const allowedStatuses = new Set([
  'ready_after_visual_review',
  'ready_after_store_link_review',
  'internal_review_required',
  'needs_asset_discovery'
]);

const forbiddenAssetFragments = [
  '/secrets/',
  '/private/',
  '/.auth/',
  'private-vault',
  'password',
  'stripe-live',
  'gmail',
  'admin-auth',
  'cdp-google-account'
];

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function resolveAsset(asset) {
  if (path.isAbsolute(asset)) return asset;
  return path.resolve(rootDir, '..', asset);
}

function clean(value) {
  return String(value || '').trim();
}

async function run() {
  const failures = [];
  const registry = JSON.parse(await fs.readFile(registryFile, 'utf8'));
  if (registry.approval_required !== true) failures.push('approval_required must be true');
  if (!Array.isArray(registry.projects) || registry.projects.length < 6) failures.push('registry must contain at least 6 projects');

  const ids = new Set();
  for (const [index, project] of (registry.projects || []).entries()) {
    const prefix = `projects[${index}]`;
    for (const field of ['id', 'name', 'category', 'publish_status', 'proof_angle', 'video_format']) {
      if (!clean(project[field])) failures.push(`${prefix}.${field}: empty`);
    }
    if (ids.has(project.id)) failures.push(`${prefix}.id: duplicate ${project.id}`);
    ids.add(project.id);
    if (!allowedStatuses.has(project.publish_status)) failures.push(`${prefix}.publish_status: unsupported ${project.publish_status}`);
    if (!Array.isArray(project.services_to_show) || project.services_to_show.length < 3) failures.push(`${prefix}.services_to_show: expected at least 3 services`);
    if (!Array.isArray(project.avoid) || project.avoid.length < 3) failures.push(`${prefix}.avoid: expected explicit privacy exclusions`);
    if (!Array.isArray(project.safe_assets)) failures.push(`${prefix}.safe_assets: expected array`);
    if (project.publish_status !== 'needs_asset_discovery' && (!project.safe_assets || project.safe_assets.length === 0)) {
      failures.push(`${prefix}.safe_assets: required for publishable/reviewable projects`);
    }
    for (const asset of project.safe_assets || []) {
      const lower = asset.toLowerCase();
      for (const fragment of forbiddenAssetFragments) {
        if (lower.includes(fragment)) failures.push(`${prefix}.safe_assets: forbidden asset fragment ${fragment} in ${asset}`);
      }
      const absolute = resolveAsset(asset);
      if (!(await exists(absolute))) failures.push(`${prefix}.safe_assets: missing asset ${asset}`);
    }
  }

  const allText = JSON.stringify(registry).toLowerCase();
  for (const required of ['excellentia', 'collins', 'ec8', 'coconut', 'etsy', 'cantoni']) {
    if (!allText.includes(required)) failures.push(`missing project/topic ${required}`);
  }

  const result = {
    ok: failures.length === 0,
    projects: registry.projects?.length || 0,
    failures
  };
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
