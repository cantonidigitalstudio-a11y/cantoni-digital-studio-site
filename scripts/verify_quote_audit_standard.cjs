const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const REQUIRED_DOCS = [
  {
    file: 'sales-kit/full_quote_audit_standard.md',
    contains: [
      'Guardare il sito live oggi',
      'dominio vecchio rimanda a un sito nuovo',
      'Mobile',
      'privacy/cookie',
      'WhatsApp',
      'Instagram',
      'Facebook',
      'TikTok',
      'YouTube',
      'LinkedIn',
      'Google Business Profile',
      'Tripadvisor',
      'Trustpilot',
      'Booking',
      'Expedia',
      'TheFork',
      'Airbnb',
      'competitor',
      'AI visibility',
      'nelle risposte delle intelligenze artificiali',
      'screenshot',
      'current_domain_verified',
      'review_platforms_checked',
      'competitors_checked',
      'pricing_rationale',
      'recommended_solution_type',
      'solution_type_rationale',
      'payment_readiness',
      'Non inviare il preventivo'
    ]
  },
  {
    file: 'sales-kit/global_outreach_playbook.md',
    contains: [
      'Protocollo operativo completo: `sales-kit/full_quote_audit_standard.md`',
      'sono stati controllati i canali social pubblici del cliente',
      'sono state controllate le recensioni',
      'create_quote_input_from_lead.mjs --lead-id',
      'https://wa.me/393471961113'
    ]
  },
  {
    file: 'sales-kit/scripts/lib/lead_pipeline_utils.mjs',
    contains: [
      'REQUIRED_READY_AUDIT_FIELDS',
      'validateReadyAuditEvidence',
      'validateLeadForQuote',
      'VALID_SOLUTION_TYPES',
      'social_channels_checked',
      'review_platforms_checked',
      'competitors_checked',
      'evidence_refs'
    ]
  },
  {
    file: 'sales-kit/scripts/create_quote_input_from_lead.mjs',
    contains: [
      'validateLeadForQuote',
      'Quote input gate failed',
      'audit_evidence',
      'recommended_solution_type',
      'payment_readiness',
      'pricing_rationale'
    ]
  },
  {
    file: 'sales-kit/preventivo_template.md',
    contains: [
      '## 0. Audit obbligatorio prima del prezzo',
      '`sales-kit/full_quote_audit_standard.md`',
      'social pubblici: Instagram, Facebook, TikTok, YouTube, LinkedIn',
      'recensioni e reputazione: Google Business Profile, Tripadvisor, Trustpilot, Booking, Expedia, TheFork, Airbnb',
      'WhatsApp diretto: https://wa.me/393471961113'
    ]
  }
];

function readText(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    env: {
      ...process.env,
      ...options.env
    },
    encoding: 'utf8'
  });
}

function createRuntimeFixtureCsv(sourceCsv, outputCsv, failures) {
  const code = `
    import fs from 'node:fs/promises';
    import { parseCsv, stringifyCsv } from './sales-kit/scripts/lib/lead_pipeline_utils.mjs';

    const [sourceCsv, outputCsv] = process.argv.slice(1);
    const raw = await fs.readFile(sourceCsv, 'utf8');
    const headers = raw.split(/\\r?\\n/, 1)[0].split(',');
    const rows = parseCsv(raw);
    const ready = rows.find((row) => row.lead_id === 'LD-GS-0001');
    const blocked = rows.find((row) => row.lead_id === 'LD-GS-0003');
    if (!ready || !blocked) throw new Error('Quote gate fixture leads missing');

    const fixtureReady = {
      ...ready,
      status: 'READY_TO_CONTACT',
      last_action: 'QA fixture prepared for quote gate runtime',
      next_action_date: '',
      notes: 'Browser live QA fixture: homepage, footer, phones and public contact evidence verified for quote gate runtime. No live email action is performed by this fixture.'
    };

    await fs.writeFile(outputCsv, stringifyCsv([fixtureReady, blocked], headers), 'utf8');
  `;

  const result = runNode(['--input-type=module', '-e', code, sourceCsv, outputCsv]);
  if (result.status !== 0) {
    failures.push(`quote gate runtime: could not create fixture csv: ${result.stderr || result.stdout}`);
  }
}

function verifyQuoteGateRuntime(failures) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cantoni-quote-gate-'));
  const inputDir = path.join(tempDir, 'input');
  const outputDir = path.join(tempDir, 'generated');
  const fixtureCsv = path.join(tempDir, 'leads.csv');
  fs.mkdirSync(inputDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  createRuntimeFixtureCsv('sales-kit/lead-batches/2026-05-11-global-starter/leads.csv', fixtureCsv, failures);
  if (failures.length) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    return;
  }

  const env = {
    LEAD_PIPELINE_CSV: fixtureCsv,
    QUOTE_INPUT_OUTPUT_DIR: inputDir
  };

  const createReady = runNode(
    ['sales-kit/scripts/create_quote_input_from_lead.mjs', '--lead-id', 'LD-GS-0001'],
    { env }
  );
  if (createReady.status !== 0) {
    failures.push(`quote gate runtime: READY lead failed unexpectedly: ${createReady.stderr || createReady.stdout}`);
  }

  const readyInput = path.join(inputDir, 'hotel-parco-italy-ld-gs-0001.json');
  const generateReady = runNode(
    ['sales-kit/scripts/generate_personalized_quote.mjs', '--input', readyInput, '--output-dir', outputDir]
  );
  if (generateReady.status !== 0) {
    failures.push(`quote gate runtime: generated quote failed unexpectedly: ${generateReady.stderr || generateReady.stdout}`);
  }

  const createBlocked = runNode(
    ['sales-kit/scripts/create_quote_input_from_lead.mjs', '--lead-id', 'LD-GS-0003'],
    { env }
  );
  if (createBlocked.status === 0) {
    failures.push('quote gate runtime: RESEARCH_VERIFIED lead should be blocked but passed');
  } else if (!String(createBlocked.stderr || createBlocked.stdout).includes('quote_status_not_allowed:RESEARCH_VERIFIED')) {
    failures.push(`quote gate runtime: blocked lead failed with unexpected reason: ${createBlocked.stderr || createBlocked.stdout}`);
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
}

function main() {
  const failures = [];

  for (const doc of REQUIRED_DOCS) {
    const text = readText(doc.file);
    for (const expected of doc.contains) {
      if (!text.includes(expected)) failures.push(`${doc.file}: missing "${expected}"`);
    }
  }

  verifyQuoteGateRuntime(failures);

  if (failures.length) {
    console.error(`FAIL quote-audit-standard (${failures.length} issues)`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('PASS quote-audit-standard');
}

main();
