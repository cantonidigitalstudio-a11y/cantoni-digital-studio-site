import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const REQUIRED_REPLY_TO = 'cantonidigitalstudio@gmail.com';
const REQUIRED_LINKS = [
  'https://cantonidigitalstudio.com/studio',
  'https://cantonidigitalstudio.com/case-studies.html',
  'https://www.instagram.com/cantonidigitalstudio/'
];

function getArg(name) {
  const prefix = `${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : '';
}

function assert(condition, message, bucket) {
  if (!condition) bucket.push(message);
}

async function verifyHtmlFile(filePath) {
  const html = await fs.readFile(filePath, 'utf8');
  const failures = [];
  assert(/Cantoni Digital Studio/i.test(html), 'brand_name_missing', failures);
  assert(/Riferimenti pubblici|Public references|Referencias públicas|Références publiques|Öffentliche Referenzen|Referências públicas/i.test(html), 'references_block_missing', failures);
  assert(/data:image\/png;base64|cid:cantoniLogo/i.test(html), 'logo_missing', failures);
  for (const link of REQUIRED_LINKS) {
    assert(html.includes(link), `missing_link:${link}`, failures);
  }
  assert(html.includes(REQUIRED_REPLY_TO), 'reply_to_missing', failures);
  return { file: filePath, kind: 'html', ok: failures.length === 0, failures };
}

async function verifyQueueFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);
  const failures = [];
  if (!Array.isArray(data) || !data.length) {
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
