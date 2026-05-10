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

function stripIssuePrefix(line) {
  return line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
}

function displayLeadName(item) {
  return item.lead_name || item.business_name || String(item.subject || '').split(':')[0].trim() || item.lead_id || item.id || 'Lead';
}

function parsePlainBody(body = '') {
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  const issueIntroIndex = lines.findIndex((line) => /^Ho visto\b/i.test(line));
  const priorityIndex = lines.findIndex((line) => /^Le 3 priorit/i.test(line));
  const impactIndex = lines.findIndex((line) => /^Impatto economico realistico:/i.test(line));
  const ctaIndex = lines.findIndex((line) => /^Se può essere utile/i.test(line));

  const issueStart = issueIntroIndex >= 0 ? issueIntroIndex + 1 : 0;
  const issueEnd = priorityIndex >= 0 ? priorityIndex : lines.length;
  const priorityStart = priorityIndex >= 0 ? priorityIndex + 1 : issueEnd;
  const priorityEnd = impactIndex >= 0 ? impactIndex : lines.length;

  return {
    greeting: lines[0] || 'Buongiorno,',
    opening: issueIntroIndex > 1 ? lines.slice(1, issueIntroIndex).join(' ') : '',
    issueIntro: issueIntroIndex >= 0 ? lines[issueIntroIndex] : 'Ho visto alcuni punti che possono limitare conversione e fiducia.',
    issues: lines.slice(issueStart, issueEnd).map(stripIssuePrefix).filter(Boolean),
    priorities: lines.slice(priorityStart, priorityEnd).map(stripIssuePrefix).filter(Boolean),
    impact: impactIndex >= 0 ? lines[impactIndex].replace(/^Impatto economico realistico:\s*/i, '') : '',
    cta: ctaIndex >= 0 ? lines[ctaIndex] : 'Se può essere utile, preparo una proposta operativa con priorità, tempi e percorso scritto.',
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

function renderReferenceFooter() {
  const pillStyle = 'display:inline-block;margin:0 8px 8px 0;padding:9px 12px;border-radius:999px;background:#eef3f8;color:#13254a;text-decoration:none;font:700 12px Arial,sans-serif;';
  return `
    <tr>
      <td style="padding:22px 32px 30px 32px;background:#f7f9fc;border-top:1px solid #dfe7f0;">
        <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:12px;">Riferimenti pubblici</div>
        <div style="margin-bottom:14px;">
          <a href="${LINKS.studio}" style="${pillStyle}">Studio</a>
          <a href="${LINKS.cases}" style="${pillStyle}">Case studies</a>
          <a href="${LINKS.instagram}" style="${pillStyle}">Instagram</a>
          <a href="${LINKS.site}" style="${pillStyle}">Sito</a>
        </div>
        <div style="font:400 13px/1.55 Arial,sans-serif;color:#5b6678;">
          ${BRAND_NAME}<br>
          Siti, e-commerce, web app, app e automazioni AI con scope scritto, priorità operative e consegna verificabile.<br>
          <a href="mailto:${BRAND_EMAIL}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_EMAIL}</a>
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
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a66a20;margin-bottom:14px;">Priorità suggerite</div>
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
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f29d38;margin-bottom:9px;">Impatto economico realistico</div>
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
  return `${item.body.trim()}

Riferimenti pubblici:
- Studio: ${LINKS.studio}
- Case studies: ${LINKS.cases}
- Instagram: ${LINKS.instagram}
- Sito: ${LINKS.site}

${BRAND_NAME}
${BRAND_EMAIL}
`;
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
                    <div style="font:700 17px/1.5 Arial,sans-serif;color:#20304a;">Primo contatto senza prezzi: si mostra competenza reale, poi si confermano scope, tempi e proposta scritta solo dopo risposta.</div>
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
    await fs.writeFile(path.join(outputDir, `${safeId}-email.html`), html);
    await fs.writeFile(path.join(outputDir, `${safeId}-email.txt`), text);
    brandedQueue.push({
      ...item,
      sender_name: BRAND_NAME,
      reply_to: BRAND_EMAIL,
      html_body: renderBrandedEmail(item, mailLogoSrc),
      text_body: text
    });
  }

  await fs.writeFile(path.join(outputDir, 'outreach_queue_branded.json'), `${JSON.stringify(brandedQueue, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'internal-review-branded.html'), renderInternalReview(queue, previewLogoSrc));
  await fs.writeFile(path.join(outputDir, 'internal-review-branded.txt'), renderInternalText(queue));

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
