import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const protocolFile = path.join(rootDir, 'social-launch/voiceover-operating-system.md');
const styleFile = path.join(rootDir, 'social-launch/voice-style-reference.template.json');
const gitignoreFile = path.resolve(rootDir, '..', '.gitignore');

const requiredProtocolFragments = [
  'solo clip selezionate',
  'inviate da Emanuele',
  'VOICE_DIRECTION=sent_by_me',
  'ZWAMESSAGE.ZISFROMME=1',
  'senza audio di altre persone',
  'Non clonare la voce da WhatsApp',
  'provider che supporti custom voice con consenso',
  'entrambe le cartelle sono escluse da git',
  'review si usa per Reel/TikTok/Shorts'
];

const requiredGitignoreFragments = [
  'sales-kit/social-launch/voice-reference-private/',
  'sales-kit/social-launch/voice-renders-private/'
];

function includesAll(text, fragments, prefix, failures) {
  const searchable = text.toLowerCase();
  for (const fragment of fragments) {
    if (!searchable.includes(fragment.toLowerCase())) failures.push(`${prefix}: missing "${fragment}"`);
  }
}

async function run() {
  const failures = [];
  const protocol = await fs.readFile(protocolFile, 'utf8');
  const style = JSON.parse(await fs.readFile(styleFile, 'utf8'));
  const gitignore = await fs.readFile(gitignoreFile, 'utf8');

  includesAll(protocol, requiredProtocolFragments, 'voiceover protocol', failures);
  includesAll(gitignore, requiredGitignoreFragments, '.gitignore', failures);

  if (style.consent_required !== true) failures.push('style reference must require consent');
  if (!Array.isArray(style.rules) || style.rules.length < 5) failures.push('style reference must include safety rules');
  if (!style.private_audio_folder?.includes('voice-reference-private')) failures.push('style reference must point to private audio folder');
  const combinedRules = JSON.stringify(style.rules).toLowerCase();
  for (const required of ['only speaker', 'sent by emanuele', 'zisfromme=1', 'git', 'external voice providers', 'final review', 'private client data']) {
    if (!combinedRules.includes(required)) failures.push(`style rules missing ${required}`);
  }

  const result = {
    ok: failures.length === 0,
    files: [protocolFile, styleFile],
    failures
  };
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
