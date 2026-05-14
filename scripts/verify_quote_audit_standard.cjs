const fs = require('fs');
const path = require('path');

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
      'Non inviare il preventivo'
    ]
  },
  {
    file: 'sales-kit/global_outreach_playbook.md',
    contains: [
      'Protocollo operativo completo: `sales-kit/full_quote_audit_standard.md`',
      'sono stati controllati i canali social pubblici del cliente',
      'sono state controllate le recensioni',
      'https://wa.me/393471961113'
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

function main() {
  const failures = [];

  for (const doc of REQUIRED_DOCS) {
    const text = readText(doc.file);
    for (const expected of doc.contains) {
      if (!text.includes(expected)) failures.push(`${doc.file}: missing "${expected}"`);
    }
  }

  if (failures.length) {
    console.error(`FAIL quote-audit-standard (${failures.length} issues)`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('PASS quote-audit-standard');
}

main();
