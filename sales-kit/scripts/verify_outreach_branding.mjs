import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const REQUIRED_REPLY_TO = 'cantonidigitalstudio@gmail.com';
const REQUIRED_LINKS = [
  'https://cantonidigitalstudio.com/studio',
  'https://cantonidigitalstudio.com/case-studies.html',
  'https://www.instagram.com/cantonidigitalstudio/',
  'https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/',
  'https://www.tiktok.com/@cantonidigitalstudio',
  'https://www.youtube.com/@cantonidigitalstudio',
  'https://wa.me/393471961113'
];
const FORBIDDEN_LINKS = [];
const REQUIRED_VISIBLE_REFERENCES = [
  'cantonidigitalstudio.com',
  '@cantonidigitalstudio',
  'cantonidigitalstudio@gmail.com',
  '+39 347 196 1113'
];
const REQUIRED_VISIBLE_REFERENCE_GROUPS = [
  ['pagina ufficiale Cantoni Digital Studio', 'Pagina ufficiale', 'Pagina oficial', 'Página oficial', 'Page officielle', 'Official page', '公式ページ'],
  ['TikTok', '@cantonidigitalstudio'],
  ['YouTube', '@cantonidigitalstudio'],
  [
    'visibilità nelle risposte delle intelligenze artificiali',
    'visibilidad en respuestas de inteligencia artificial',
    "visibilité dans les réponses de l'intelligence artificielle",
    'visibility in AI-generated answers',
    'visibilidade em respostas de IA',
    'AI回答'
  ]
];
const REQUIRED_ICON_ALTS = [
  'Logo sito Cantoni Digital Studio',
  'Portfolio lavori Cantoni Digital Studio',
  'Logo Instagram ufficiale',
  'Logo Facebook ufficiale',
  'Logo TikTok ufficiale',
  'Logo YouTube ufficiale',
  'Logo WhatsApp ufficiale',
  'Email Cantoni Digital Studio'
];
const CLIENT_JARGON_PATTERNS = [
  /\bCTA\b/i,
  /\bhero\b/i,
  /\bfunnel\b/i,
  /\bbooking flow\b/i,
  /\btracking richieste\b/i,
  /\btrust layer\b/i,
  /\bconversion-oriented\b/i,
  /\bbreakdown\b/i,
  /\bscope\b/i,
  /\bconversioni?\b/i,
  /\bconversione mobile\b/i
];

function getArg(name) {
  const prefix = `${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function assert(condition, message, bucket) {
  if (!condition) bucket.push(message);
}

function assertNoClientJargon(value, prefix, bucket) {
  const text = String(value || '');
  CLIENT_JARGON_PATTERNS.forEach((pattern) => {
    if (pattern.test(text)) bucket.push(`${prefix}:client_jargon:${pattern}`);
  });
}

async function verifyHtmlFile(filePath) {
  const html = await fs.readFile(filePath, 'utf8');
  const failures = [];
  assert(/Cantoni Digital Studio/i.test(html), 'brand_name_missing', failures);
  assert(/Riferimenti pubblici|Public references|Referencias p[uú]blicas|Références publiques|Öffentliche Referenzen|Referências p[uú]blicas|公開リンク/i.test(html), 'references_block_missing', failures);
  assert(/data:image\/png;base64|cid:cantoniLogo/i.test(html), 'logo_missing', failures);
  for (const link of REQUIRED_LINKS) {
    assert(html.includes(link), `missing_link:${link}`, failures);
  }
  for (const link of FORBIDDEN_LINKS) {
    assert(!html.includes(`href="${link}"`) && !html.includes(`href='${link}'`), `forbidden_public_proof_link:${link}`, failures);
  }
  for (const reference of REQUIRED_VISIBLE_REFERENCES) {
    assert(html.includes(reference), `missing_visible_reference:${reference}`, failures);
  }
  REQUIRED_VISIBLE_REFERENCE_GROUPS.forEach((group) => {
    assert(group.some((reference) => html.includes(reference)), `missing_visible_reference:${group[0]}`, failures);
  });
  for (const alt of REQUIRED_ICON_ALTS) {
    assert(html.includes(`alt="${alt}"`), `missing_reference_icon:${alt}`, failures);
  }
  assert(html.includes(REQUIRED_REPLY_TO), 'reply_to_missing', failures);
  assertNoClientJargon(html, 'html', failures);
  return { file: filePath, kind: 'html', ok: failures.length === 0, failures };
}

async function verifyQueueFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);
  const failures = [];
  if (!Array.isArray(data) || !data.length) {
    if (Array.isArray(data) && data.length === 0 && hasFlag('--allow-empty')) {
      return { file: filePath, kind: 'queue', ok: true, empty: true, failures };
    }
    failures.push('queue_empty');
    return { file: filePath, kind: 'queue', ok: false, failures };
  }

  data.forEach((item, index) => {
    const prefix = `item_${index}`;
    assert((item.sender_name || '') === 'Cantoni Digital Studio', `${prefix}:sender_name_invalid`, failures);
    assert((item.reply_to || '') === REQUIRED_REPLY_TO, `${prefix}:reply_to_invalid`, failures);
    assert(/<html[\s>]/i.test(item.html_body || ''), `${prefix}:html_body_missing`, failures);
    assert((item.html_body || '').includes('cid:cantoniLogo'), `${prefix}:logo_cid_missing`, failures);
    for (const link of REQUIRED_LINKS) {
      assert((item.html_body || '').includes(link), `${prefix}:missing_link:${link}`, failures);
    }
    for (const link of FORBIDDEN_LINKS) {
      assert(
        !(item.html_body || '').includes(`href="${link}"`) && !(item.html_body || '').includes(`href='${link}'`),
        `${prefix}:forbidden_public_proof_link:${link}`,
        failures
      );
    }
    for (const reference of REQUIRED_VISIBLE_REFERENCES) {
      assert((item.html_body || '').includes(reference), `${prefix}:missing_visible_reference:${reference}`, failures);
    }
    REQUIRED_VISIBLE_REFERENCE_GROUPS.forEach((group) => {
      assert(
        group.some((reference) => (item.html_body || '').includes(reference)),
        `${prefix}:missing_visible_reference:${group[0]}`,
        failures
      );
    });
    for (const alt of REQUIRED_ICON_ALTS) {
      assert((item.html_body || '').includes(`alt="${alt}"`), `${prefix}:missing_reference_icon:${alt}`, failures);
    }
    assertNoClientJargon(item.body, `${prefix}:body`, failures);
    assertNoClientJargon(item.text_body, `${prefix}:text_body`, failures);
    assertNoClientJargon(item.html_body, `${prefix}:html_body`, failures);
  });

  return { file: filePath, kind: 'queue', ok: failures.length === 0, failures };
}

async function run() {
  const htmlArg = getArg('--html');
  const queueArg = getArg('--queue');
  const checks = [];

  if (!htmlArg && !queueArg) {
    throw new Error('Use --html=/abs/path/file.html and/or --queue=/abs/path/file.json');
  }

  if (htmlArg) {
    for (const file of htmlArg.split(',').map((item) => item.trim()).filter(Boolean)) {
      checks.push(await verifyHtmlFile(path.resolve(file)));
    }
  }

  if (queueArg) {
    for (const file of queueArg.split(',').map((item) => item.trim()).filter(Boolean)) {
      checks.push(await verifyQueueFile(path.resolve(file)));
    }
  }

  const failed = checks.filter((item) => !item.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
  if (failed.length) process.exit(1);
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
