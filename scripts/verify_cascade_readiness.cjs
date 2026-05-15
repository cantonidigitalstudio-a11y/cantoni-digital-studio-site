const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const REQUIRED_TEXT = [
  {
    file: 'sales-kit/scripts/render_branded_outreach_emails.mjs',
    contains: [
      'https://cantonidigitalstudio.com/',
      'https://www.instagram.com/cantonidigitalstudio/',
      'https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/',
      'https://www.tiktok.com/@cantonidigitalstudio',
      'cantonidigitalstudio@gmail.com',
      '+39 347 196 1113',
      'visibilità anche nelle risposte delle intelligenze artificiali'
    ]
  },
  {
    file: 'sales-kit/global_outreach_playbook.md',
    contains: [
      'siti, e-commerce, web app, app mobile, automazioni AI',
      'Scrivere per persone normali',
      'TikTok: `https://www.tiktok.com/@cantonidigitalstudio`',
      'Gestione continuativa',
      'visibilita nelle risposte delle intelligenze artificiali'
    ]
  },
  {
    file: 'sales-kit/preventivo_template.md',
    contains: [
      'Sito studio: https://cantonidigitalstudio.com',
      'App mobile o piattaforma piu ampia: da 9000 EUR',
      'Il cliente deve capire cosa compra anche se non conosce parole tecniche',
      'Visibilita nelle risposte delle intelligenze artificiali',
      'Vietato lasciare gergo non spiegato'
    ]
  },
  {
    file: 'case-studies.html',
    contains: [
      'What a client can verify immediately',
      'Public proof must answer a simple question',
      'Premium service website with booking logic',
      'Tourism booking surface, upsell and routing',
      'Platform positioning and payment-ready architecture',
      'Where a prospect can verify the studio',
      'https://excellentiavip.com',
      'https://destination-cocoa-site.netlify.app',
      'https://ec8platform.com',
      'https://www.instagram.com/cantonidigitalstudio/',
      'https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/',
      'https://wa.me/393471961113'
    ]
  },
  {
    file: 'sales-kit/social-launch/posts.json',
    contains: [
      'Reference verificabile: https://excellentiavip.com',
      'Reference verificabile: https://destination-cocoa-site.netlify.app',
      'Reference verificabile: https://ec8platform.com',
      'social, recensioni, competitor',
      'web app, app mobile'
    ]
  }
];

const KNOWN_INTERNAL_ROOTS = [
  /^AUTOMATION_HANDOFF\.md$/,
  /^EXCELLENTIA_VIP_CODEX_MASTER_PROMPT\.md$/,
  /^destination-cocoa-notification-flow\.md$/,
  /^functions\//,
  /^sales-kit\//,
  /^scripts\//,
  /^server\//,
  /^studio-admin\.(html|js)$/,
  /^supabase\//
];

const PUBLIC_RELEASE_RISK = [
  /^[^/]+\.(html|js|css|json|xml|svg|png|jpg|jpeg|webp)$/,
  /^assets\//,
  /^client-documents\//,
  /^node_modules\//,
  /^output\//
];

function readText(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function gitStatus() {
  const raw = execFileSync('git', ['status', '--porcelain'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  return raw.split('\n').filter(Boolean).map((line) => ({
    code: line.slice(0, 2),
    file: line.slice(3)
  }));
}

function isKnownInternal(file) {
  return KNOWN_INTERNAL_ROOTS.some((pattern) => pattern.test(file));
}

function isPublicRisk(file) {
  return PUBLIC_RELEASE_RISK.some((pattern) => pattern.test(file));
}

function main() {
  const failures = [];
  const status = gitStatus();
  const untracked = status.filter((item) => item.code === '??').map((item) => item.file);
  const trackedDirty = status.filter((item) => item.code !== '??').map((item) => item.file);
  const untrackedPublicRisk = untracked.filter((file) => isPublicRisk(file) && !isKnownInternal(file));
  const untrackedInternal = untracked.filter((file) => isKnownInternal(file));

  for (const check of REQUIRED_TEXT) {
    const text = readText(check.file);
    for (const expected of check.contains) {
      if (!text.includes(expected)) failures.push(`${check.file}: missing "${expected}"`);
    }
  }

  if (untrackedPublicRisk.length) {
    failures.push(`untracked public release risk: ${untrackedPublicRisk.join(', ')}`);
  }

  const report = {
    ok: failures.length === 0,
    trackedDirty: trackedDirty.length,
    untrackedInternal: untrackedInternal.length,
    untrackedPublicRisk,
    checks: REQUIRED_TEXT.map((item) => item.file),
    note: 'Internal files may remain untracked, but they must stay outside the Cloudflare artifact and must not be sent/published without approval.'
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) {
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}

main();
