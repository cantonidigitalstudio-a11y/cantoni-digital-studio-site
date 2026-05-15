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

function verifyQuoteGateRuntime(failures) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cantoni-quote-gate-'));
  const inputDir = path.join(tempDir, 'input');
  const outputDir = path.join(tempDir, 'generated');
  fs.mkdirSync(inputDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const env = {
    LEAD_PIPELINE_CSV: 'sales-kit/lead-batches/2026-05-11-global-starter/leads.csv',
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
