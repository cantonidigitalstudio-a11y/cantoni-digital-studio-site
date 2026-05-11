import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_QUEUE = 'sales-kit/lead-batches/2026-05-11-global-starter/outreach_queue.json';
const DEFAULT_OUTPUT_DIR = 'sales-kit/lead-batches/2026-05-11-global-starter/branded';
const LOGO_PATH = 'assets/logo/generated/cantoni_primary_horizontal_email.png';
const BRAND_EMAIL = 'cantonidigitalstudio@gmail.com';
const BRAND_NAME = 'Cantoni Digital Studio';
const LINKS = {
  studio: 'https://cantonidigitalstudio.com/studio',
  cases: 'https://cantonidigitalstudio.com/case-studies.html',
  site: 'https://cantonidigitalstudio.com/',
  instagram: 'https://www.instagram.com/cantonidigitalstudio/'
};

function getArg(name, fallback = '') {
  const prefix = `${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tidyOutput(value) {
  return String(value || '').replace(/[ \t]+$/gm, '');
}

function stripIssuePrefix(line) {
  return line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
}

const CLIENT_FRIENDLY_REWRITES = [
  [/Hero con CTA unica verso disponibilità o richiesta preventivo/gi, 'Prima parte del sito con un invito chiaro a verificare disponibilità o chiedere un preventivo'],
  [/Sezione hero con vantaggi diretti e CTA prenota\/richiedi offerta più chiara/gi, "Prima parte del sito con vantaggi diretti e pulsanti chiari per prenotare o richiedere un'offerta"],
  [/Le CTA principali sono chiamata\/email e non costruiscono un percorso di disponibilità\/preventivo/gi, 'Oggi i principali inviti sono solo chiamata ed email: manca un percorso semplice per verificare disponibilità o chiedere un preventivo'],
  [/La promessa di prenotazione diretta non porta subito a un booking flow visibile/gi, 'La promessa di prenotare direttamente dal sito non porta subito a una pagina chiara dove controllare disponibilità o chiedere informazioni'],
  [/Servizi, camere e fiducia sono sparsi e poco orientati alla conversione mobile/gi, 'Servizi, camere e motivi per fidarsi sono distribuiti in più punti: da telefono non guidano abbastanza verso una richiesta'],
  [/Servizi, offerte ed eventi sono presenti ma non ordinati come funnel commerciale mobile/gi, 'Servizi, offerte ed eventi ci sono, ma da telefono non seguono un percorso semplice che porti alla richiesta o alla prenotazione'],
  [/Il booking è demandato a un flusso esterno e il valore diretto non è spiegato prima del click/gi, 'La prenotazione porta fuori dal sito e prima del click non è abbastanza chiaro perché convenga prenotare direttamente'],
  [/Contatti hotel e ufficio booking sono separati e possono creare frizione/gi, 'I contatti dell’hotel e quelli per prenotare sono separati: questo può creare confusione nel momento in cui una persona vuole informazioni'],
  [/Sequenza camere-servizi-recensioni-offerte con percorso commerciale più corto/gi, 'Ordine più chiaro tra camere, servizi, recensioni e offerte, così il visitatore capisce prima cosa fare'],
  [/Barra mobile con prenota\/WhatsApp\/email e tracking richieste/gi, 'Da telefono, pulsanti sempre visibili per prenotare, scrivere su WhatsApp o mandare una email, con controllo delle richieste ricevute'],
  [/Percorso contatti unico con booking, telefono, email e WhatsApp ordinati/gi, 'Un solo percorso contatti, con prenotazione, telefono, email e WhatsApp messi in ordine chiaro'],
  [/Landing offerte\/famiglie con trust, servizi e disponibilità in sequenza/gi, 'Pagina dedicata alle offerte e alle famiglie, con servizi, motivi di fiducia e disponibilità spiegati in ordine'],
  [/\bCTA\b/gi, 'pulsanti o inviti a prenotare'],
  [/\bhero\b/gi, 'prima parte della pagina'],
  [/\bfunnel commerciale mobile\b/gi, 'percorso semplice da telefono'],
  [/\bfunnel\b/gi, 'percorso'],
  [/\bbooking flow\b/gi, 'percorso di prenotazione'],
  [/\bbooking\b/gi, 'prenotazione'],
  [/\btracking richieste\b/gi, 'controllo delle richieste ricevute'],
  [/\bconversione mobile\b/gi, 'richieste da telefono'],
  [/\bconversioni\b/gi, 'richieste o prenotazioni'],
  [/\bconversione\b/gi, 'richiesta o prenotazione'],
  [/\btrust layer\b/gi, 'elementi di fiducia'],
  [/\bconversion-oriented\b/gi, 'pensate per far arrivare richieste'],
  [/\blanding\b/gi, 'pagina dedicata'],
  [/\bbreakdown\b/gi, 'riepilogo chiaro'],
  [/\bfrizione\b/gi, 'confusione']
];

function clientFriendlyCopy(value) {
  return CLIENT_FRIENDLY_REWRITES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value || '')
  );
}

function displayLeadName(item) {
  return item.lead_name || item.business_name || String(item.subject || '').split(':')[0].trim() || item.lead_id || item.id || 'Lead';
}

function parsePlainBody(body = '') {
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  const issueIntroIndex = lines.findIndex((line) => /^Ho visto\b/i.test(line));
  const priorityIndex = lines.findIndex((line) => /^Le 3 (priorit|prime cose)/i.test(line));
  const impactIndex = lines.findIndex((line) => /^(Impatto economico realistico|Risultato commerciale realistico):/i.test(line));
  const ctaIndex = lines.findIndex((line) => /^Se può essere utile/i.test(line));

  const issueStart = issueIntroIndex >= 0 ? issueIntroIndex + 1 : 0;
  const issueEnd = priorityIndex >= 0 ? priorityIndex : lines.length;
  const priorityStart = priorityIndex >= 0 ? priorityIndex + 1 : issueEnd;
  const priorityEnd = impactIndex >= 0 ? impactIndex : lines.length;

  return {
    greeting: clientFriendlyCopy(lines[0] || 'Buongiorno,'),
    opening: clientFriendlyCopy(issueIntroIndex > 1 ? lines.slice(1, issueIntroIndex).join(' ') : ''),
    issueIntro: clientFriendlyCopy(issueIntroIndex >= 0 ? lines[issueIntroIndex] : 'Ho visto alcuni punti che possono ridurre richieste, prenotazioni e contatti.'),
    issues: lines.slice(issueStart, issueEnd).map(stripIssuePrefix).map(clientFriendlyCopy).filter(Boolean),
    priorities: lines.slice(priorityStart, priorityEnd).map(stripIssuePrefix).map(clientFriendlyCopy).filter(Boolean),
    impact: clientFriendlyCopy(impactIndex >= 0 ? lines[impactIndex].replace(/^(Impatto economico realistico|Risultato commerciale realistico):\s*/i, '') : ''),
    cta: clientFriendlyCopy(ctaIndex >= 0 ? lines[ctaIndex] : 'Se può essere utile, preparo un riepilogo chiaro con priorità, tempi e percorso scritto.'),
    signoff: lines.slice(Math.max(ctaIndex + 1, 0)).filter((line) => !/^Se può essere utile/i.test(line))
  };
}

function listItems(items) {
  return items.map((item) => `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td width="26" valign="top" style="font:700 13px Arial,sans-serif;color:#f29d38;padding-top:1px;">•</td>
            <td style="font:400 15px/1.55 Arial,sans-serif;color:#20304a;">${escapeHtml(item)}</td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');
}

function renderCredibilityBlock() {
  return `
    <tr>
      <td style="padding:0 32px 22px 32px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f7f9fc;border:1px solid #dfe7f0;border-radius:14px;">
          <tr>
            <td style="padding:18px 20px;">
              <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:10px;">Chi ti sta scrivendo</div>
              <div style="font:700 17px/1.45 Arial,sans-serif;color:#13254a;margin-bottom:8px;">${BRAND_NAME}</div>
              <div style="font:400 14px/1.65 Arial,sans-serif;color:#34435a;">
                Studio italiano che realizza siti, e-commerce, web app, app e automazioni AI con proposta scritta e lavoro continuativo dopo la consegna.<br>
                Sito: <a href="${LINKS.site}" style="color:#13254a;font-weight:700;text-decoration:none;">cantonidigitalstudio.com</a><br>
                Instagram: <a href="${LINKS.instagram}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
                Email: <a href="mailto:${BRAND_EMAIL}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_EMAIL}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderReferenceFooter() {
  const pillStyle = 'display:inline-block;margin:0 8px 8px 0;padding:9px 12px;border-radius:999px;background:#eef3f8;color:#13254a;text-decoration:none;font:700 12px Arial,sans-serif;';
  return `
    <tr>
      <td style="padding:22px 32px 30px 32px;background:#f7f9fc;border-top:1px solid #dfe7f0;">
        <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:12px;">Riferimenti pubblici</div>
        <div style="font:700 18px/1.35 Arial,sans-serif;color:#13254a;margin-bottom:12px;">${BRAND_NAME}</div>
        <div style="font:400 14px/1.65 Arial,sans-serif;color:#34435a;margin-bottom:14px;">
          Sito ufficiale: <a href="${LINKS.site}" style="color:#13254a;font-weight:700;text-decoration:none;">https://cantonidigitalstudio.com</a><br>
          Instagram: <a href="${LINKS.instagram}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
          Case studies: <a href="${LINKS.cases}" style="color:#13254a;font-weight:700;text-decoration:none;">cantonidigitalstudio.com/case-studies.html</a><br>
          Email: <a href="mailto:${BRAND_EMAIL}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_EMAIL}</a>
        </div>
        <div style="margin-bottom:14px;">
          <a href="${LINKS.studio}" style="${pillStyle}">Studio</a>
          <a href="${LINKS.cases}" style="${pillStyle}">Case studies</a>
          <a href="${LINKS.instagram}" style="${pillStyle}">Instagram</a>
          <a href="${LINKS.site}" style="${pillStyle}">Sito</a>
        </div>
        <div style="font:400 13px/1.55 Arial,sans-serif;color:#5b6678;">
          Siti, e-commerce, web app, app e automazioni AI con accordo scritto su cosa viene fatto, tempi chiari e consegna verificabile.<br>
        </div>
      </td>
    </tr>
  `;
}

function renderBrandedEmail(item, logoSrc, options = {}) {
  const parsed = parsePlainBody(item.body);
  const leadName = displayLeadName(item);
  const title = item.subject || `${leadName}: verifica sito`;
  const preheader = `Audit rapido Cantoni Digital Studio per ${leadName || 'la vostra attività'}.`;
  const showRecipient = options.showRecipient === true;

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef2f7;">
    <tr>
      <td align="center" style="padding:26px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:760px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dce4ee;box-shadow:0 18px 45px rgba(19,37,74,.10);">
          <tr>
            <td style="padding:28px 32px;background:#13254a;">
              <div style="display:inline-block;background:#ffffff;border-radius:14px;padding:12px 16px;margin:0 0 22px 0;box-shadow:0 10px 26px rgba(0,0,0,.16);">
                <img src="${logoSrc}" width="230" alt="Cantoni Digital Studio" style="display:block;width:230px;max-width:78vw;height:auto;border:0;margin:0;">
              </div><br>
              <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f29d38;color:#13254a;font:700 11px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;">Audit rapido sito live</div>
              <h1 style="margin:16px 0 0 0;color:#ffffff;font:700 28px/1.18 Arial,sans-serif;letter-spacing:0;">${escapeHtml(title)}</h1>
              ${showRecipient ? `<p style="margin:10px 0 0 0;color:#cdd7e6;font:400 14px/1.5 Arial,sans-serif;">Destinatario: ${escapeHtml(item.to || 'da confermare')}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0 0 12px 0;color:#20304a;font:400 16px/1.65 Arial,sans-serif;">${escapeHtml(parsed.greeting)}</p>
              ${parsed.opening ? `<p style="margin:0 0 18px 0;color:#20304a;font:400 16px/1.65 Arial,sans-serif;">${escapeHtml(parsed.opening)}</p>` : ''}
              <p style="margin:0 0 20px 0;color:#20304a;font:700 17px/1.55 Arial,sans-serif;">${escapeHtml(parsed.issueIntro)}</p>
            </td>
          </tr>
          ${renderCredibilityBlock()}
          <tr>
            <td style="padding:0 32px 10px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #dfe7f0;border-radius:14px;">
                <tr>
                  <td style="padding:22px 22px 12px 22px;">
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:14px;">Osservazioni concrete</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${listItems(parsed.issues)}</table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fffaf4;border:1px solid #f2d8b7;border-radius:14px;">
                <tr>
                  <td style="padding:22px 22px 12px 22px;">
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a66a20;margin-bottom:14px;">Prime cose da sistemare</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${listItems(parsed.priorities)}</table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${parsed.impact ? `
          <tr>
            <td style="padding:10px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#13254a;border-radius:14px;">
                <tr>
                  <td style="padding:22px;">
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f29d38;margin-bottom:9px;">Risultato commerciale realistico</div>
                    <div style="font:700 18px/1.45 Arial,sans-serif;color:#ffffff;">${escapeHtml(parsed.impact)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:10px 32px 28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #dfe7f0;border-radius:14px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0;color:#20304a;font:700 16px/1.6 Arial,sans-serif;">${escapeHtml(parsed.cta)}</p>
                    <p style="margin:18px 0 0 0;color:#5b6678;font:400 14px/1.6 Arial,sans-serif;">Emanuele Cantoni<br>${BRAND_NAME}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${renderReferenceFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderTextEmail(item) {
  return `${renderClientPlainBody(item)}

Riferimenti pubblici:
- Studio: ${LINKS.studio}
- Case studies: ${LINKS.cases}
- Instagram: ${LINKS.instagram}
- Sito: ${LINKS.site}

${BRAND_NAME}
${BRAND_EMAIL}
`;
}

function renderClientPlainBody(item) {
  const parsed = parsePlainBody(item.body);
  const lines = [
    parsed.greeting,
    parsed.opening,
    parsed.issueIntro,
    ...parsed.issues.map((issue, index) => `${index + 1}. ${issue}`),
    '',
    'Le 3 prime cose che sistemerei sono:',
    ...parsed.priorities.map((item) => `- ${item}`),
    '',
    parsed.impact ? `Risultato commerciale realistico: ${parsed.impact}` : '',
    parsed.cta,
    '',
    'Emanuele Cantoni',
    BRAND_NAME,
    LINKS.site
  ];

  return lines.filter((line, index, all) => {
    if (line) return true;
    return all[index - 1] && all[index + 1];
  }).join('\n');
}

function renderInternalReview(items, logoSrc) {
  const previews = items.map((item) => {
    const parsed = parsePlainBody(item.body);
    const leadName = displayLeadName(item);
    return `
      <tr>
        <td style="padding:0 30px 26px 30px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #dfe7f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:22px 22px 18px 22px;background:#f8fafc;">
                <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:8px;">Bozza pronta per revisione</div>
                <h2 style="margin:0;color:#13254a;font:700 24px/1.2 Arial,sans-serif;">${escapeHtml(leadName)}</h2>
                <p style="margin:8px 0 0 0;color:#5b6678;font:400 14px/1.5 Arial,sans-serif;">A: ${escapeHtml(item.to || 'da confermare')}<br>Oggetto: ${escapeHtml(item.subject || '')}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px;">
                <p style="margin:0 0 16px 0;color:#20304a;font:700 16px/1.55 Arial,sans-serif;">${escapeHtml(parsed.issueIntro)}</p>
                <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:10px;">Punti usati nella bozza</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${listItems(parsed.issues)}</table>
                <div style="height:12px;"></div>
                <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a66a20;margin-bottom:10px;">Azioni proposte</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${listItems(parsed.priorities)}</table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Preview bozze outreach - Cantoni Digital Studio</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef2f7;">
    <tr>
      <td align="center" style="padding:26px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:820px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dce4ee;box-shadow:0 18px 45px rgba(19,37,74,.10);">
          <tr>
            <td style="padding:30px;background:#13254a;">
              <div style="display:inline-block;background:#ffffff;border-radius:14px;padding:12px 16px;margin:0 0 24px 0;box-shadow:0 10px 26px rgba(0,0,0,.16);">
                <img src="${logoSrc}" width="242" alt="Cantoni Digital Studio" style="display:block;width:242px;max-width:78vw;height:auto;border:0;margin:0;">
              </div><br>
              <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f29d38;color:#13254a;font:700 11px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;">Preview interna</div>
              <h1 style="margin:16px 0 0 0;color:#ffffff;font:700 31px/1.15 Arial,sans-serif;">Bozze outreach brandizzate</h1>
              <p style="margin:12px 0 0 0;color:#d8e1ef;font:400 16px/1.6 Arial,sans-serif;">Queste versioni sostituiscono le bozze statiche: struttura Cantoni, logo, sezioni leggibili, riferimenti pubblici e footer social. Non sono state inviate.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 30px 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fffaf4;border:1px solid #f2d8b7;border-radius:14px;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a66a20;margin-bottom:8px;">Regola commerciale</div>
                    <div style="font:700 17px/1.5 Arial,sans-serif;color:#20304a;">Primo contatto senza prezzi: si mostra competenza reale, poi si confermano cosa fare, tempi e proposta scritta solo dopo risposta.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${previews}
          ${renderReferenceFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderInternalText(items) {
  return `Preview interna bozze outreach - ${BRAND_NAME}

Queste versioni sostituiscono le bozze statiche: struttura Cantoni, logo, sezioni leggibili, riferimenti pubblici e footer social. Non sono state inviate.

${items.map((item) => `--- ${item.lead_name || item.lead_id}
A: ${item.to || 'da confermare'}
Oggetto: ${item.subject || ''}

${renderTextEmail(item)}`).join('\n')}
`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const queuePath = path.resolve(getArg('--queue', process.env.OUTREACH_QUEUE_FILE || DEFAULT_QUEUE));
  const outputDir = path.resolve(getArg('--out', process.env.BRANDED_OUTREACH_DIR || DEFAULT_OUTPUT_DIR));
  const logoPath = path.resolve(getArg('--logo', LOGO_PATH));

  if (!(await fileExists(queuePath))) {
    throw new Error(`Queue file not found: ${queuePath}`);
  }
  if (!(await fileExists(logoPath))) {
    throw new Error(`Logo file not found: ${logoPath}`);
  }

  const queue = JSON.parse(await fs.readFile(queuePath, 'utf8'));
  if (!Array.isArray(queue) || queue.length === 0) {
    throw new Error(`Queue is empty: ${queuePath}`);
  }

  await fs.mkdir(outputDir, { recursive: true });

  const logoBase64 = await fs.readFile(logoPath, 'base64');
  const previewLogoSrc = `data:image/png;base64,${logoBase64}`;
  const mailLogoSrc = 'cid:cantoniLogo';

  const brandedQueue = [];
  for (const item of queue) {
    const safeId = String(item.lead_id || item.lead_name || 'lead').replace(/[^a-z0-9-]+/gi, '-');
    const html = renderBrandedEmail(item, previewLogoSrc);
    const text = renderTextEmail(item);
    await fs.writeFile(path.join(outputDir, `${safeId}-email.html`), tidyOutput(html));
    await fs.writeFile(path.join(outputDir, `${safeId}-email.txt`), tidyOutput(text));
    brandedQueue.push({
      ...item,
      sender_name: BRAND_NAME,
      reply_to: BRAND_EMAIL,
      body: renderClientPlainBody(item),
      html_body: tidyOutput(renderBrandedEmail(item, mailLogoSrc)),
      text_body: tidyOutput(text)
    });
  }

  await fs.writeFile(path.join(outputDir, 'outreach_queue_branded.json'), `${JSON.stringify(brandedQueue, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'internal-review-branded.html'), tidyOutput(renderInternalReview(queue, previewLogoSrc)));
  await fs.writeFile(path.join(outputDir, 'internal-review-branded.txt'), tidyOutput(renderInternalText(queue)));

  console.log(JSON.stringify({
    ok: true,
    queue: queuePath,
    outputDir,
    emails: brandedQueue.length,
    files: [
      'outreach_queue_branded.json',
      'internal-review-branded.html',
      'internal-review-branded.txt',
      ...brandedQueue.flatMap((item) => {
        const safeId = String(item.lead_id || item.lead_name || 'lead').replace(/[^a-z0-9-]+/gi, '-');
        return [`${safeId}-email.html`, `${safeId}-email.txt`];
      })
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(String(error.message || error));
  process.exit(1);
});
