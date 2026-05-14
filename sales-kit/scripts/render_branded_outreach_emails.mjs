import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_QUEUE = 'sales-kit/lead-batches/2026-05-11-global-starter/outreach_queue.json';
const DEFAULT_OUTPUT_DIR = 'sales-kit/lead-batches/2026-05-11-global-starter/branded';
const LOGO_PATH = 'assets/logo/generated/cantoni_primary_horizontal_email.png';
const BRAND_EMAIL = 'cantonidigitalstudio@gmail.com';
const BRAND_NAME = 'Cantoni Digital Studio';
const BRAND_PHONE_DISPLAY = '+39 347 196 1113';
const BRAND_PHONE_TEL = '+393471961113';
const LINKS = {
  studio: 'https://cantonidigitalstudio.com/studio',
  cases: 'https://cantonidigitalstudio.com/case-studies.html',
  site: 'https://cantonidigitalstudio.com/',
  instagram: 'https://www.instagram.com/cantonidigitalstudio/',
  facebook: 'https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/',
  tiktok: 'https://www.tiktok.com/@cantonidigitalstudio',
  whatsapp: `https://wa.me/${BRAND_PHONE_TEL.replace(/^\+/, '')}`
};

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')}`;
}

const ICONS = {
  site: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#13254a"/><path fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="M24 9.5a14.5 14.5 0 1 0 0 29 14.5 14.5 0 0 0 0-29Zm0 0c4 4 6 8.8 6 14.5S28 34.5 24 38.5c-4-4-6-8.8-6-14.5s2-10.5 6-14.5ZM10.5 24h27"/></svg>`),
  instagram: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#feda75"/><stop offset=".25" stop-color="#fa7e1e"/><stop offset=".5" stop-color="#d62976"/><stop offset=".75" stop-color="#962fbf"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="5" y="5" width="38" height="38" rx="12" fill="url(#g)"/><rect x="14" y="14" width="20" height="20" rx="6" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="5.2" fill="none" stroke="#fff" stroke-width="3"/><circle cx="31" cy="17" r="1.9" fill="#fff"/></svg>`),
  facebook: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#1877f2"/><path fill="#fff" d="M28.8 25.8h4.1l.8-5.1h-4.9v-3.3c0-1.4.7-2.8 2.9-2.8h2.2v-4.4s-2-.3-3.9-.3c-4 0-6.7 2.4-6.7 6.9v3.9h-4.5v5.1h4.5V38h5.5V25.8Z"/></svg>`),
  tiktok: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#111111"/><path fill="#25f4ee" d="M20.7 19.9v12.2a4.2 4.2 0 1 1-4.2-4.2c.4 0 .8.1 1.2.2v-5.4a9.8 9.8 0 1 0 8.7 9.7V17.5c1.9 2 4.3 3.1 7.2 3.2v-5.3c-2.3-.2-4.5-1.5-5.8-3.4h-7.1v7.9Z"/><path fill="#fe2c55" d="M23.1 18.1v13.6a4.2 4.2 0 0 1-6.1 3.7 4.2 4.2 0 0 0 7.2-3V18.9c2 2.1 4.7 3.3 7.7 3.5v-1.8c-2.8-.1-5.3-1.3-7.2-3.2v.7h-1.6Z"/><path fill="#fff" d="M22.4 13.7v18.7a6 6 0 1 1-6-6c.4 0 .9 0 1.3.1v-2a8 8 0 1 0 6.8 7.9V15.6c2 2 4.6 3.2 7.4 3.3V17c-2.9-.2-5.6-1.5-7.5-3.3h-2Z"/></svg>`),
  cases: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#f29d38"/><path fill="#13254a" d="M15 11h18l6 6v20a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Zm17 2.8V18h4.2L32 13.8ZM18 23h15v-3H18v3Zm0 7h15v-3H18v3Zm0 7h10v-3H18v3Z"/></svg>`),
  email: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#eef3f8"/><path fill="none" stroke="#13254a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="M12 16h24v17H12V16Zm0 1 12 10 12-10"/></svg>`),
  phone: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#23a455"/><path fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" d="M18.2 12.5 22 20l-3.1 2.4c1.7 3.6 4.1 6 7.7 7.7L29 27l6.7 3.8c.6.3.9 1 .7 1.7-.8 3.2-2.7 4.7-5.8 4.7-9.9 0-19.8-9.9-19.8-19.8 0-3.1 1.5-5 4.7-5.8.8-.2 1.5.1 1.9.9Z"/></svg>`),
  studio: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#13254a"/><path fill="#f29d38" d="M12 14h24v4H12v-4Zm0 8h18v4H12v-4Zm0 8h24v4H12v-4Z"/><path fill="#fff" d="M34 21h4v14h-4z"/></svg>`)
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

function contactTile({ href, icon, alt, label, value }) {
  return `
    <td width="100%" valign="top" style="padding:6px;">
      <a href="${href}" style="display:block;min-height:54px;padding:11px 12px;background:#ffffff;border:1px solid #dfe7f0;border-radius:13px;text-decoration:none;color:#13254a;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td width="38" valign="middle"><img src="${icon}" width="32" height="32" alt="${alt}" style="display:block;width:32px;height:32px;border:0;border-radius:10px;"></td>
            <td valign="middle" style="padding-left:10px;">
              <div style="font:700 12px Arial,sans-serif;color:#7a8798;text-transform:uppercase;letter-spacing:.08em;">${label}</div>
              <div style="font:700 13px/1.35 Arial,sans-serif;color:#13254a;">${value}</div>
            </td>
          </tr>
        </table>
      </a>
    </td>
  `;
}

function renderContactTiles() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:10px 0 0 0;">
      <tr>
        ${contactTile({
          href: LINKS.site,
          icon: ICONS.site,
          alt: 'Logo sito Cantoni Digital Studio',
          label: 'Sito ufficiale',
          value: 'cantonidigitalstudio.com'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.facebook,
          icon: ICONS.facebook,
          alt: 'Logo ufficiale Facebook Cantoni Digital Studio',
          label: 'Facebook',
          value: 'Pagina ufficiale'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.instagram,
          icon: ICONS.instagram,
          alt: 'Logo ufficiale Instagram Cantoni Digital Studio',
          label: 'Instagram',
          value: '@cantonidigitalstudio'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.tiktok,
          icon: ICONS.tiktok,
          alt: 'Logo ufficiale TikTok Cantoni Digital Studio',
          label: 'TikTok',
          value: '@cantonidigitalstudio'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.cases,
          icon: ICONS.cases,
          alt: 'Icona case studies Cantoni Digital Studio',
          label: 'Case studies',
          value: 'Lavori e risultati'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: `mailto:${BRAND_EMAIL}`,
          icon: ICONS.email,
          alt: 'Icona email Cantoni Digital Studio',
          label: 'Email',
          value: BRAND_EMAIL
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.whatsapp,
          icon: ICONS.phone,
          alt: 'Icona telefono WhatsApp Cantoni Digital Studio',
          label: 'Telefono',
          value: BRAND_PHONE_DISPLAY
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.studio,
          icon: ICONS.studio,
          alt: 'Icona profilo studio Cantoni Digital Studio',
          label: 'Studio',
          value: 'Profilo operativo'
        })}
      </tr>
    </table>
  `;
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
                Quando serve, continuiamo a migliorare contenuti, fiducia, richieste, presenza su Google e visibilità anche nelle risposte delle intelligenze artificiali.<br>
                Sito: <a href="${LINKS.site}" style="color:#13254a;font-weight:700;text-decoration:none;">cantonidigitalstudio.com</a><br>
                Facebook: <a href="${LINKS.facebook}" style="color:#13254a;font-weight:700;text-decoration:none;">pagina ufficiale</a><br>
                Instagram: <a href="${LINKS.instagram}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
                TikTok: <a href="${LINKS.tiktok}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
                Email: <a href="mailto:${BRAND_EMAIL}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_EMAIL}</a><br>
                Telefono/WhatsApp: <a href="${LINKS.whatsapp}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_PHONE_DISPLAY}</a>
              </div>
              ${renderContactTiles()}
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
          Facebook: <a href="${LINKS.facebook}" style="color:#13254a;font-weight:700;text-decoration:none;">pagina ufficiale Cantoni Digital Studio</a><br>
          Instagram: <a href="${LINKS.instagram}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
          TikTok: <a href="${LINKS.tiktok}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
          Case studies: <a href="${LINKS.cases}" style="color:#13254a;font-weight:700;text-decoration:none;">cantonidigitalstudio.com/case-studies.html</a><br>
          Email: <a href="mailto:${BRAND_EMAIL}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_EMAIL}</a><br>
          Telefono/WhatsApp: <a href="${LINKS.whatsapp}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_PHONE_DISPLAY}</a>
        </div>
        ${renderContactTiles()}
        <div style="margin-bottom:14px;">
          <a href="${LINKS.studio}" style="${pillStyle}">Studio</a>
          <a href="${LINKS.cases}" style="${pillStyle}">Case studies</a>
          <a href="${LINKS.facebook}" style="${pillStyle}">Facebook</a>
          <a href="${LINKS.instagram}" style="${pillStyle}">Instagram</a>
          <a href="${LINKS.tiktok}" style="${pillStyle}">TikTok</a>
          <a href="${LINKS.site}" style="${pillStyle}">Sito</a>
        </div>
        <div style="font:400 13px/1.55 Arial,sans-serif;color:#5b6678;">
          Siti, e-commerce, web app, app e automazioni AI con accordo scritto su cosa viene fatto, tempi chiari e consegna verificabile.<br>
          Dopo il lancio possiamo continuare a migliorare contenuti, fiducia, richieste, presenza su Google e visibilità nelle risposte delle intelligenze artificiali.
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
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef2f7;table-layout:fixed;">
    <tr>
      <td align="center" style="padding:26px 0;">
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
- Facebook: ${LINKS.facebook}
- Instagram: ${LINKS.instagram}
- TikTok: ${LINKS.tiktok}
- Telefono/WhatsApp: ${BRAND_PHONE_DISPLAY}
- Sito: ${LINKS.site}

${BRAND_NAME}
${BRAND_EMAIL}
${BRAND_PHONE_DISPLAY}
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
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef2f7;table-layout:fixed;">
    <tr>
      <td align="center" style="padding:26px 0;">
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
