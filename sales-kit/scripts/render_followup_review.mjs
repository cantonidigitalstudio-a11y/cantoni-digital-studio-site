import fs from 'node:fs/promises';
import path from 'node:path';

const queueFile = path.resolve(
  process.env.FOLLOWUP_QUEUE_FILE ||
    'sales-kit/lead-batches/2026-05-15-global-50/followup_d3_queue.json'
);
const outputFile = path.resolve(
  process.env.FOLLOWUP_REVIEW_HTML ||
    'sales-kit/lead-batches/2026-05-15-global-50/followup-review.html'
);

const BRAND = {
  name: 'Cantoni Digital Studio',
  email: 'cantonidigitalstudio@gmail.com',
  site: 'https://cantonidigitalstudio.com',
  instagram: 'https://www.instagram.com/cantonidigitalstudio/',
  whatsapp: 'https://wa.me/393471961113',
  logo: '../../../assets/logo/cantoni_primary_horizontal_small.svg'
};

const REVIEW = {
  title: process.env.FOLLOWUP_REVIEW_TITLE || 'Follow-up D3 globale - Cantoni Digital Studio',
  batchLabel: process.env.FOLLOWUP_REVIEW_BATCH_LABEL || 'Batch globale 2026-05-15',
  dateLabel: process.env.FOLLOWUP_REVIEW_DATE_LABEL || '18/05',
  leadText:
    process.env.FOLLOWUP_REVIEW_LEAD_TEXT ||
    'Il batch cold è chiuso a zero code residue. Il prossimo passo serio è ricontrollare Gmail Cantoni, togliere eventuali lead che hanno risposto e inviare solo ai lead senza risposta una richiesta breve: mini roadmap, priorità e prossimo passo operativo.'
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countBy(queue, key) {
  return queue.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function chipsFromMap(map) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => `<span class="chip"><strong>${escapeHtml(label)}</strong>${count}</span>`)
    .join('');
}

function sampleByLanguage(queue) {
  const seen = new Set();
  return queue.filter((item) => {
    if (seen.has(item.language)) return false;
    seen.add(item.language);
    return true;
  });
}

async function run() {
  const queue = JSON.parse(await fs.readFile(queueFile, 'utf8'));
  if (!Array.isArray(queue)) throw new Error(`Queue is not an array: ${queueFile}`);

  const publicAmounts = queue.filter((item) =>
    /\b(?:EUR|USD|GBP|MXN|DOP|AED|SAR|JPY|INR|CNY|CAD|AUD|BRL|SGD|THB)\s*[\d.,]+|(?:€|\$|£|¥)\s*[\d.,]+/i.test(
      `${item.subject || ''}\n${item.body || ''}\n${item.html_body || ''}`
    )
  );
  const replyToMismatch = queue.filter((item) => item.reply_to !== BRAND.email);
  const samples = sampleByLanguage(queue);

  const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(REVIEW.title)}</title>
  <link rel="icon" href="../../../favicon.svg">
  <style>
    :root {
      color-scheme: light;
      --ink: #10213f;
      --muted: #5d6980;
      --line: #dde5f1;
      --paper: #f5f8fc;
      --navy: #13254a;
      --orange: #f29d38;
      --green: #0f8a58;
      --danger: #b42318;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    header {
      background: #fff;
      border-bottom: 1px solid var(--line);
      padding: 24px clamp(18px, 4vw, 48px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }
    header img { width: min(290px, 54vw); height: auto; display: block; }
    nav { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    nav a {
      color: var(--navy);
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 999px;
      padding: 8px 12px;
      text-decoration: none;
      font-weight: 800;
      font-size: 13px;
    }
    main { width: min(1180px, calc(100% - 32px)); margin: 32px auto 56px; }
    .hero {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: clamp(22px, 4vw, 38px);
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr);
      gap: 24px;
      align-items: center;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(32px, 5vw, 58px);
      line-height: 1.02;
      letter-spacing: 0;
    }
    h2 { margin: 0 0 14px; font-size: 22px; letter-spacing: 0; }
    p { margin: 0 0 12px; color: var(--muted); font-size: 17px; }
    .status {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .metric {
      border: 1px solid var(--line);
      background: #f9fbfe;
      border-radius: 8px;
      padding: 16px;
      min-height: 104px;
    }
    .metric strong { display: block; font-size: 34px; line-height: 1; color: var(--navy); }
    .metric span { color: var(--muted); font-weight: 800; font-size: 13px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
    section {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 22px;
    }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 8px 11px;
      background: #f9fbfe;
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
    }
    .chip strong { color: var(--navy); }
    .gate {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .gate div {
      border-radius: 8px;
      padding: 14px;
      border: 1px solid #cce8dc;
      background: #f0fbf6;
      color: var(--green);
      font-weight: 900;
    }
    .gate .bad {
      border-color: #ffd0ca;
      background: #fff5f3;
      color: var(--danger);
    }
    .samples { display: grid; gap: 14px; }
    article {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
      background: #fbfdff;
    }
    article h3 { margin: 0 0 8px; font-size: 16px; }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      color: #24334f;
      font: 14px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .note {
      border-left: 4px solid var(--orange);
      padding: 12px 14px;
      background: #fff8ef;
      color: #5e3c10;
      font-weight: 800;
    }
    @media (max-width: 820px) {
      header { align-items: flex-start; flex-direction: column; }
      nav { justify-content: flex-start; }
      .hero, .grid, .gate { grid-template-columns: 1fr; }
      .status { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <img src="${BRAND.logo}" alt="${BRAND.name}">
    <nav>
      <a href="${BRAND.site}">Sito</a>
      <a href="${BRAND.site}/case-studies.html">Portfolio</a>
      <a href="${BRAND.instagram}">Instagram</a>
      <a href="${BRAND.whatsapp}">WhatsApp</a>
    </nav>
  </header>
  <main>
    <div class="hero">
      <div>
        <p><strong>${escapeHtml(REVIEW.batchLabel)}</strong></p>
        <h1>Follow-up D3 pronti per oggi. Invio solo dopo Gmail e approvazione.</h1>
        <p>${escapeHtml(REVIEW.leadText)}</p>
        <div class="note">Nessun prezzo nel testo pubblico: il prezzo entra solo se il cliente risponde e chiede di andare avanti.</div>
      </div>
      <div class="status">
        <div class="metric"><strong>${queue.length}</strong><span>Follow-up pronti</span></div>
        <div class="metric"><strong>${publicAmounts.length}</strong><span>Prezzi pubblici</span></div>
        <div class="metric"><strong>${replyToMismatch.length}</strong><span>Reply-to errati</span></div>
        <div class="metric"><strong>${escapeHtml(REVIEW.dateLabel)}</strong><span>Data D3</span></div>
      </div>
    </div>

    <div class="grid">
      <section>
        <h2>Lingue</h2>
        <div class="chips">${chipsFromMap(countBy(queue, 'language'))}</div>
      </section>
      <section>
        <h2>Valute</h2>
        <div class="chips">${chipsFromMap(countBy(queue, 'currency'))}</div>
      </section>
    </div>

    <section style="margin-top: 18px;">
      <h2>Gate qualità</h2>
      <div class="gate">
        <div class="${queue.length ? '' : 'bad'}">${queue.length ? 'OK' : 'KO'} - coda D3 generata</div>
        <div class="${publicAmounts.length === 0 ? '' : 'bad'}">${publicAmounts.length === 0 ? 'OK' : 'KO'} - nessun importo nel copy</div>
        <div class="${replyToMismatch.length === 0 ? '' : 'bad'}">${replyToMismatch.length === 0 ? 'OK' : 'KO'} - reply-to Cantoni</div>
      </div>
    </section>

    <section style="margin-top: 18px;">
      <h2>Campioni per lingua</h2>
      <div class="samples">
        ${samples
          .map(
            (item) => `<article>
              <h3>${escapeHtml(item.language.toUpperCase())} - ${escapeHtml(item.id)} - ${escapeHtml(item.to)}</h3>
              <pre>${escapeHtml(`${item.subject}\n\n${item.body}`)}</pre>
            </article>`
          )
          .join('')}
      </div>
    </section>
  </main>
</body>
</html>`;

  await fs.writeFile(outputFile, html, 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        queue_file: queueFile,
        output: outputFile,
        count: queue.length,
        public_amounts: publicAmounts.length,
        reply_to_mismatch: replyToMismatch.length
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
