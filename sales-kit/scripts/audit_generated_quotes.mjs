import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const defaultGeneratedDir = path.resolve(salesKitDir, 'generated');

const hardLeakPatterns = [
  { label: 'local filesystem path leaked', pattern: /\/Volumes\/|file:\/\//i },
  { label: 'markdown image points to local or relative asset', pattern: /!\[[^\]]*\]\((?:\/|\.{1,2}\/)/i },
  { label: 'template placeholder leaked', pattern: /\{\{[^}]+\}\}|<cliente>|<url>|\bTODO\b|\bFIXME\b/i },
  { label: 'example domain still present', pattern: /https?:\/\/(?:www\.)?example\./i }
];

const genericIssuePatterns = [
  /\bconvertire meglio\b/i,
  /\bUX non e ottimale\b/i,
  /\bdesign (?:e|è) migliorabile\b/i,
  /\bmigliorare la presenza online\b/i,
  /\bvisibilit(?:a|à) online\b/i,
  /\bsito moderno\b/i
];

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1] || null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function normalize(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

async function listQuoteFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listQuoteFiles(filePath));
    } else if (/-quote-[a-z]{2}\.md$/i.test(entry.name) || entry.name.endsWith('-quote-it.md')) {
      files.push(filePath);
    }
  }

  return files.sort();
}

function extractSection(text, headingPattern) {
  const match = text.match(headingPattern);
  if (!match || match.index == null) return '';

  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const nextHeading = rest.search(/\n##\s+/);
  return normalize(nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function extractNumberedItems(section) {
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

function extractWebsite(text) {
  const match = text.match(/^- Website analyzed:\s*(.+)$/im);
  return match ? match[1].trim() : '';
}

function extractLanguage(text) {
  const match = text.match(/^- Language:\s*([A-Z]{2})$/im);
  return match ? match[1].toLowerCase() : '';
}

function auditQuote(filePath, text) {
  const issues = [];
  const warnings = [];
  const website = extractWebsite(text);
  const language = extractLanguage(text);
  const observedSection = extractSection(text, /\n##\s+(?:Criticità osservate|Observed issues|Problemas observados|Points critiques observes|Beobachtete Schwachstellen|Pontos observados|確認した課題)\s*\n/i);
  const observedItems = extractNumberedItems(observedSection);

  for (const rule of hardLeakPatterns) {
    if (rule.pattern.test(text)) issues.push(rule.label);
  }

  if (!website) {
    issues.push('missing Website analyzed metadata');
  } else if (/No website detected|N\/A|example\.|localhost|127\.0\.0\.1/i.test(website)) {
    issues.push(`website is not a verified public client domain: ${website}`);
  }

  if (!language) warnings.push('missing language metadata');

  if (observedItems.length < 3) {
    issues.push(`less than 3 observed issues (${observedItems.length})`);
  }

  observedItems.forEach((item, index) => {
    if (item.length < 35) issues.push(`observed issue ${index + 1} is too short`);
    if (genericIssuePatterns.some((pattern) => pattern.test(item))) {
      issues.push(`observed issue ${index + 1} is too generic`);
    }
  });

  if (!/(Riferimenti pubblici|Public references|Referencias públicas|Références publiques|Öffentliche Referenzen|Referências públicas)/i.test(text)) {
    warnings.push('missing public reference block');
  }

  if (!/(Pagamenti|Payments|Pagos|Paiements|Zahlungen|お支払い)/i.test(text)) {
    warnings.push('missing payment terms label');
  }

  return {
    file: path.relative(process.cwd(), filePath),
    ok: issues.length === 0,
    issues,
    warnings
  };
}

async function run() {
  const dir = path.resolve(process.cwd(), getArgValue('--dir') || defaultGeneratedDir);
  const reportPath = getArgValue('--report');
  const strict = hasFlag('--strict');
  const files = await listQuoteFiles(dir);
  const results = [];

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    results.push(auditQuote(file, text));
  }

  const failed = results.filter((result) => !result.ok);
  const withWarnings = results.filter((result) => result.warnings.length);
  const report = {
    ok: failed.length === 0,
    scanned: results.length,
    failed: failed.length,
    warnings: withWarnings.length,
    generated_dir: dir,
    results
  };

  const output = JSON.stringify(report, null, 2);
  if (reportPath) {
    await fs.mkdir(path.dirname(path.resolve(process.cwd(), reportPath)), { recursive: true });
    await fs.writeFile(path.resolve(process.cwd(), reportPath), `${output}\n`, 'utf8');
  }

  console.log(output);

  if (strict && failed.length) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
