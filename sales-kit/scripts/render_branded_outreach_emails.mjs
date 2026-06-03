import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_QUEUE = 'sales-kit/generated/outreach-fixtures/sanitized-starter/outreach_queue.json';
const DEFAULT_OUTPUT_DIR = 'sales-kit/generated/outreach-fixtures/sanitized-starter/branded';
const LOGO_PATH = 'assets/logo/generated/cantoni_primary_horizontal_email.png';
const BRAND_EMAIL = 'cantonidigitalstudio@gmail.com';
const BRAND_NAME = 'Cantoni Digital Studio';
const BRAND_PHONE_DISPLAY = '+39 347 196 1113';
const BRAND_PHONE_TEL = '+393471961113';
const TIKTOK_HANDLE = '@cantonidigitalstudio';
const LINKS = {
  studio: 'https://cantonidigitalstudio.com/studio',
  cases: 'https://cantonidigitalstudio.com/case-studies.html',
  site: 'https://cantonidigitalstudio.com/',
  ec8: 'https://ec8platform.com',
  appStore: 'https://apps.apple.com/ch/app/ec8platform/id6755408340',
  playStore: 'https://play.google.com/store/apps/details?id=com.ec8.platform',
  instagram: 'https://www.instagram.com/cantonidigitalstudio/',
  facebook: 'https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/',
  tiktok: 'https://www.tiktok.com/@cantonidigitalstudio',
  youtube: 'https://www.youtube.com/@cantonidigitalstudio',
  whatsapp: `https://wa.me/${BRAND_PHONE_TEL.replace(/^\+/, '')}`
};

function labelsFor(language = 'it') {
  const labels = {
    it: {
      badge: 'Audit rapido sito live',
      observations: 'Osservazioni concrete',
      priorities: 'Prime cose da sistemare',
      impact: 'Risultato commerciale realistico',
      whoWrites: 'Chi ti sta scrivendo',
      siteLabel: 'Sito ufficiale',
      appProofLabel: 'App pubblicata',
      appProofValue: 'EC8 Platform su App Store e Play Store',
      appStoreLabel: 'App Store',
      playStoreLabel: 'Play Store',
      portfolioLabel: 'Portfolio',
      portfolioValue: 'Lavori pubblici',
      facebookValue: 'Pagina ufficiale',
      tiktokLabel: 'TikTok',
      emailLabel: 'Email',
      phoneLabel: 'Telefono/WhatsApp',
      publicRefs: 'Riferimenti pubblici',
      studioPill: 'Chi siamo',
      casesPill: 'Portfolio lavori',
      ec8Pill: 'App EC8 Platform',
      sitePill: 'Sito',
      contactIntro: 'Studio italiano che realizza siti, e-commerce, web app, app e automazioni AI con proposta scritta e lavoro continuativo dopo la consegna.',
      growthIntro: 'Quando serve, continuiamo a migliorare contenuti, fiducia, richieste, presenza su Google e visibilità anche nelle risposte delle intelligenze artificiali.',
      footerLine: 'Siti, e-commerce, web app, app e automazioni AI con accordo scritto su cosa viene fatto, tempi chiari e consegna verificabile.',
      footerGrowth: 'Dopo il lancio possiamo continuare a migliorare contenuti, fiducia, richieste, presenza su Google e visibilità nelle risposte delle intelligenze artificiali.',
      defaultIssueIntro: 'Ho visto alcuni punti che possono ridurre richieste, prenotazioni e contatti.',
      defaultCta: 'Se può essere utile, preparo un riepilogo chiaro con priorità, tempi e percorso scritto.'
    },
    en: {
      badge: 'Live website audit',
      observations: 'Concrete observations',
      priorities: 'First priorities',
      impact: 'Realistic business impact',
      whoWrites: 'Who is writing',
      siteLabel: 'Official website',
      appProofLabel: 'Published app',
      appProofValue: 'EC8 Platform on App Store and Play Store',
      appStoreLabel: 'App Store',
      playStoreLabel: 'Play Store',
      portfolioLabel: 'Portfolio',
      portfolioValue: 'Public work',
      facebookValue: 'Official page',
      tiktokLabel: 'TikTok',
      emailLabel: 'Email',
      phoneLabel: 'Phone/WhatsApp',
      publicRefs: 'Public references',
      studioPill: 'Studio profile',
      casesPill: 'Case studies',
      ec8Pill: 'EC8 Platform app',
      sitePill: 'Website',
      contactIntro: 'Italian studio building websites, e-commerce, web apps, mobile apps and AI automations with a written project outline and continuous work after launch.',
      growthIntro: 'When useful, we keep improving content, trust, inquiries, Google presence and visibility in AI-generated answers.',
      footerLine: 'Websites, e-commerce, web apps, apps and AI automations with a written project outline, clear timing and verifiable delivery.',
      footerGrowth: 'After launch we can continue improving content, trust, inquiries, Google presence and visibility in AI-generated answers.',
      defaultIssueIntro: 'I noticed a few points that can reduce inquiries, bookings and contacts.',
      defaultCta: 'If useful, I can prepare a clear breakdown with priorities, timing and next steps.'
    },
    fr: {
      badge: 'Audit rapide du site',
      observations: 'Observations concrètes',
      priorities: 'Premières améliorations',
      impact: 'Impact commercial réaliste',
      whoWrites: 'Qui écrit',
      siteLabel: 'Site officiel',
      appProofLabel: 'App publiée',
      appProofValue: 'EC8 Platform sur App Store et Play Store',
      appStoreLabel: 'App Store',
      playStoreLabel: 'Play Store',
      portfolioLabel: 'Portfolio',
      portfolioValue: 'Travaux publics',
      facebookValue: 'Page officielle',
      tiktokLabel: 'TikTok',
      emailLabel: 'Email',
      phoneLabel: 'Téléphone/WhatsApp',
      publicRefs: 'Références publiques',
      studioPill: 'Profil du studio',
      casesPill: 'Études de cas',
      ec8Pill: 'App EC8 Platform',
      sitePill: 'Site',
      contactIntro: 'Studio italien qui crée des sites, e-commerce, web apps, apps et automatisations IA avec un périmètre écrit et un travail continu après le lancement.',
      growthIntro: "Quand cela a du sens, nous continuons à améliorer les contenus, la confiance, les demandes, la présence Google et la visibilité dans les réponses de l'intelligence artificielle.",
      footerLine: 'Sites, e-commerce, web apps, apps et automatisations IA avec périmètre écrit, délais clairs et livraison vérifiable.',
      footerGrowth: "Après le lancement, nous pouvons continuer à améliorer les contenus, la confiance, les demandes, la présence Google et la visibilité dans les réponses de l'intelligence artificielle.",
      defaultIssueIntro: 'Je vois quelques points qui peuvent réduire les demandes, réservations et contacts.',
      defaultCta: 'Si cela vous semble utile, je prépare un résumé clair avec priorités, délais et prochaines étapes.'
    },
    es: {
      badge: 'Auditoría rápida del sitio',
      observations: 'Observaciones concretas',
      priorities: 'Primeras mejoras',
      impact: 'Impacto comercial realista',
      whoWrites: 'Quién escribe',
      siteLabel: 'Sitio oficial',
      appProofLabel: 'App publicada',
      appProofValue: 'EC8 Platform en App Store y Play Store',
      appStoreLabel: 'App Store',
      playStoreLabel: 'Play Store',
      portfolioLabel: 'Portfolio',
      portfolioValue: 'Trabajos públicos',
      facebookValue: 'Página oficial',
      tiktokLabel: 'TikTok',
      emailLabel: 'Email',
      phoneLabel: 'Teléfono/WhatsApp',
      publicRefs: 'Referencias públicas',
      studioPill: 'Perfil del estudio',
      casesPill: 'Casos de estudio',
      ec8Pill: 'App EC8 Platform',
      sitePill: 'Sitio',
      contactIntro: 'Estudio italiano que realiza sitios web, e-commerce, web apps, apps y automatizaciones de IA con propuesta escrita y trabajo continuativo después de la entrega.',
      growthIntro: 'Cuando tiene sentido, seguimos mejorando contenidos, confianza, solicitudes, presencia en Google y visibilidad en respuestas de inteligencia artificial.',
      footerLine: 'Sitios web, e-commerce, web apps, apps y automatizaciones de IA con alcance escrito, tiempos claros y entrega verificable.',
      footerGrowth: 'Después del lanzamiento podemos seguir mejorando contenidos, confianza, solicitudes, presencia en Google y visibilidad en respuestas de inteligencia artificial.',
      defaultIssueIntro: 'Veo algunos puntos que pueden reducir consultas, reservas y contactos.',
      defaultCta: 'Si tiene sentido, preparo un resumen claro con prioridades, tiempos y próximos pasos.'
    },
    pt: {
      badge: 'Auditoria rápida do site',
      observations: 'Observações concretas',
      priorities: 'Primeiras melhorias',
      impact: 'Impacto comercial realista',
      whoWrites: 'Quem escreve',
      siteLabel: 'Site oficial',
      appProofLabel: 'App publicada',
      appProofValue: 'EC8 Platform na App Store e Play Store',
      appStoreLabel: 'App Store',
      playStoreLabel: 'Play Store',
      portfolioLabel: 'Portfolio',
      portfolioValue: 'Trabalhos públicos',
      facebookValue: 'Página oficial',
      tiktokLabel: 'TikTok',
      emailLabel: 'Email',
      phoneLabel: 'Telefone/WhatsApp',
      publicRefs: 'Referências públicas',
      studioPill: 'Perfil do estúdio',
      casesPill: 'Cases',
      ec8Pill: 'App EC8 Platform',
      sitePill: 'Site',
      contactIntro: 'Estúdio italiano que cria sites, e-commerce, web apps, apps e automações de IA com escopo escrito e trabalho contínuo após a entrega.',
      growthIntro: 'Quando faz sentido, continuamos melhorando conteúdo, confiança, pedidos, presença no Google e visibilidade em respostas de IA.',
      footerLine: 'Sites, e-commerce, web apps, apps e automações de IA com escopo escrito, prazos claros e entrega verificável.',
      footerGrowth: 'Após o lançamento podemos continuar melhorando conteúdo, confiança, pedidos, presença no Google e visibilidade em respostas de IA.',
      defaultIssueIntro: 'Vejo alguns pontos que podem reduzir contatos, reservas e pedidos.',
      defaultCta: 'Se fizer sentido, preparo um resumo claro com prioridades, prazos e próximos passos.'
    },
    ja: {
      badge: 'ライブサイト監査',
      observations: '具体的な所見',
      priorities: '最初に改善すべき点',
      impact: '現実的な事業効果',
      whoWrites: 'ご連絡している会社',
      siteLabel: '公式サイト',
      appProofLabel: '公開済みアプリ',
      appProofValue: 'EC8 Platform（App Store / Play Store）',
      appStoreLabel: 'App Store',
      playStoreLabel: 'Play Store',
      portfolioLabel: 'ポートフォリオ',
      portfolioValue: '公開実績',
      facebookValue: '公式ページ',
      tiktokLabel: 'TikTok',
      emailLabel: 'メール',
      phoneLabel: '電話/WhatsApp',
      publicRefs: '公開リンク',
      studioPill: 'スタジオ概要',
      casesPill: '実績',
      ec8Pill: 'EC8 Platformアプリ',
      sitePill: 'サイト',
      contactIntro: 'イタリアのスタジオとして、Webサイト、Eコマース、Webアプリ、モバイルアプリ、AI自動化を、明確な提案書と納品後の継続改善まで含めて制作しています。',
      growthIntro: '必要に応じて、コンテンツ、信頼性、問い合わせ導線、Googleでの見え方、AI回答内での発見性も継続的に改善します。',
      footerLine: 'Webサイト、Eコマース、Webアプリ、アプリ、AI自動化を、作業範囲、期間、確認可能な納品内容を明確にして進めます。',
      footerGrowth: '公開後も、コンテンツ、信頼性、問い合わせ、Googleでの存在感、AI回答での見え方を継続的に改善できます。',
      defaultIssueIntro: '問い合わせ、予約、連絡数を減らし得る点がいくつか見えました。',
      defaultCta: '必要であれば、優先順位、目安期間、最初に直すべき点を短く整理してお送りします。'
    }
  };

  return labels[language] || labels.en;
}

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')}`;
}

const ICONS = {
  site: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="13" fill="#13254a"/><circle cx="22.5" cy="23.5" r="14" fill="none" stroke="#fff" stroke-width="4.2"/><path fill="#13254a" stroke="#13254a" stroke-width="6" d="M31 12h10v25H31z"/><path fill="none" stroke="#f29d38" stroke-width="4.2" stroke-linecap="round" d="M31 17c3.6 1.8 5.7 5 5.7 8.9 0 6.2-4.8 10.6-11.7 10.6h-9"/><path fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" d="M18 24h12v7H18z"/></svg>`),
  instagram: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><radialGradient id="igA" cx="30%" cy="107%" r="115%"><stop offset="0" stop-color="#feda75"/><stop offset=".18" stop-color="#fa7e1e"/><stop offset=".42" stop-color="#d62976"/><stop offset=".70" stop-color="#962fbf"/><stop offset="1" stop-color="#4f5bd5"/></radialGradient></defs><rect x="4" y="4" width="40" height="40" rx="12" fill="url(#igA)"/><rect x="14" y="14" width="20" height="20" rx="6" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="24" cy="24" r="5.2" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="31" cy="17" r="2" fill="#fff"/></svg>`),
  facebook: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#1877F2"/><path fill="#fff" d="M30 25.6h-4.2V41h-6.4V25.6H16v-5.5h3.4v-3.5c0-4.7 2.8-7.3 7.1-7.3 2.1 0 4.3.4 4.3.4v4.7h-2.4c-2.4 0-3.1 1.5-3.1 3v2.7h5.3l-.6 5.5Z"/></svg>`),
  tiktok: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="13" fill="#010101"/><path fill="#25F4EE" d="M22.2 18.9v13.7a5.7 5.7 0 1 1-5.7-5.7c.5 0 1 .1 1.5.2v-5.8a11.5 11.5 0 1 0 10 11.4V20.4c2.1 2 4.7 3.1 7.5 3.2v-5.8c-2.9-.3-5.2-1.8-6.7-4.5h-6.6v5.6Z"/><path fill="#FE2C55" d="M24.6 16.9v13.7a5.7 5.7 0 0 1-8.1 5.2 5.7 5.7 0 0 0 10.5-3.2V20.4c2.1 2 4.8 3.2 7.7 3.2v-2.2c-2.9-.1-5.5-1.3-7.5-3.2v-1.3h-2.6Z"/><path fill="#fff" d="M23.3 14.2v18.4a7.1 7.1 0 1 1-7.1-7.1c.6 0 1.2.1 1.8.2v-3.1a10.2 10.2 0 1 0 8.9 10.1V18.3c2.1 2 4.8 3.2 7.8 3.3v-3.1c-3-.2-5.7-1.8-7.3-4.3h-4.1Z"/></svg>`),
  cases: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="13" fill="#f29d38"/><rect x="11" y="14" width="26" height="20" rx="4" fill="#13254a"/><path fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" d="M16 21h16M16 27h10"/><path fill="#fff" d="M20 12h8a3 3 0 0 1 3 3h-3a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1h-3a3 3 0 0 1 3-3Z"/></svg>`),
  email: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#eef3f8"/><path fill="none" stroke="#13254a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="M12 16h24v17H12V16Zm0 1 12 10 12-10"/></svg>`),
  phone: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#25D366"/><path fill="#fff" d="M24.1 10.5c-7.4 0-13.4 5.9-13.4 13.2 0 2.5.7 4.9 2 6.9L10.5 38l7.7-2c1.8 1 3.9 1.5 6 1.5 7.4 0 13.4-5.9 13.4-13.2S31.5 10.5 24.1 10.5Zm0 24.4c-1.9 0-3.6-.5-5.2-1.4l-.4-.2-4.5 1.2 1.2-4.3-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6 0-5.9 4.9-10.7 10.9-10.7S35 18.4 35 24.3 30.1 34.9 24.1 34.9Zm6-8c-.3-.2-2-1-2.3-1.1-.3-.1-.6-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.7-1-1-1.7-2.1-1.9-2.4-.2-.3 0-.5.2-.7l.6-.7c.2-.2.3-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.8-1.9-1.1-2.6-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.7.1-1 .5-.3.3-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.3 2.6 4 6.4 5.6.9.4 1.6.6 2.2.8.9.3 1.7.2 2.4.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.2-.1-.4-.2-.7-.4Z"/></svg>`),
  youtube: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="13" fill="#FF0000"/><path fill="#fff" d="M39.5 17.2c-.4-1.6-1.7-2.8-3.2-3.2C33.5 13.2 24 13.2 24 13.2s-9.5 0-12.3.8c-1.6.4-2.8 1.7-3.2 3.2-.8 2.8-.8 8.8-.8 8.8s0 6 .8 8.8c.4 1.6 1.7 2.8 3.2 3.2 2.8.8 12.3.8 12.3.8s9.5 0 12.3-.8c1.6-.4 2.8-1.7 3.2-3.2.8-2.8.8-8.8.8-8.8s0-6-.8-8.8ZM20.8 31.3V20.7L30.6 26l-9.8 5.3Z"/></svg>`)
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

function isMicroAuditItem(item) {
  return String(item.outreach_style || '').replace(/-/g, '_') === 'micro_audit';
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

function clientFriendlyCopy(value, language = 'it') {
  if (language !== 'it') return String(value || '');
  return CLIENT_FRIENDLY_REWRITES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value || '')
  );
}

function displayLeadName(item) {
  return item.lead_name || item.business_name || String(item.subject || '').split(':')[0].trim() || item.lead_id || item.id || 'Lead';
}

function parsePlainBody(body = '', language = 'it', style = 'complete_audit') {
  const labels = labelsFor(language);
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  if (String(style || '').replace(/-/g, '_') === 'micro_audit') {
    const observationIndex = lines.findIndex((line) =>
      /^(Una cosa concreta|One concrete point|Un punto concreto|Um ponto concreto|Un point concret|Ein konkreter Punkt|具体的な所見)/i.test(line)
    );
    const explicitCtaIndex = lines.findIndex((line) =>
      /^(Se può essere utile|If useful|Si os parece útil|Si os parece util|Se fizer sentido|Si cela vous semble utile|Wenn sinnvoll|必要であれば)/i.test(line)
    );
    const ctaIndex = explicitCtaIndex >= 0 ? explicitCtaIndex : lines.length - 1;
    const observationStart = observationIndex >= 0 ? observationIndex : Math.min(2, lines.length - 1);
    return {
      mode: 'micro_audit',
      greeting: clientFriendlyCopy(lines[0] || 'Buongiorno,', language),
      opening: clientFriendlyCopy(lines.slice(1, observationStart).join(' '), language),
      issueIntro: clientFriendlyCopy(lines[observationStart] || labels.defaultIssueIntro, language),
      issues: [],
      priorities: [],
      consequence: clientFriendlyCopy(lines.slice(observationStart + 1, ctaIndex).join(' '), language),
      impact: '',
      cta: clientFriendlyCopy(lines[ctaIndex] || labels.defaultCta, language),
      signoff: lines.slice(ctaIndex + 1)
    };
  }
  const issueIntroIndex = lines.findIndex((line) =>
    /^(Ho visto|Vedo|These are|Veo|Je vois|Ich sehe|Vejo|現在|目前|Abhi)/i.test(line)
  );
  const priorityIndex = lines.findIndex((line) =>
    /^(Le 3|The 3|Las 3|Les 3|Diese 3|As 3|優先|我会|Main sabse)/i.test(line)
  );
  const impactIndex = lines.findIndex((line) =>
    /^(Impatto economico realistico|Risultato commerciale realistico|Realistic business impact|Impacto comercial realista|Impact commercial realiste|Impact commercial réaliste|Realistischer Business-Effekt|Impacto comercial realista|想定できる事業効果|可预期的商业效果)\s*:/i.test(line)
  );
  const explicitCtaIndex = lines.findIndex((line) =>
    /^(Se può essere utile|If useful|Si quieres|Si tiene sentido|Si vous voulez|Si cela vous semble utile|Wenn sinnvoll|Se fizer sentido|必要であれば|如果合适|Agar useful)/i.test(line)
  );
  const ctaIndex = explicitCtaIndex >= 0 ? explicitCtaIndex : impactIndex >= 0 ? impactIndex + 1 : -1;

  const issueStart = issueIntroIndex >= 0 ? issueIntroIndex + 1 : 0;
  const issueEnd = priorityIndex >= 0 ? priorityIndex : lines.length;
  const priorityStart = priorityIndex >= 0 ? priorityIndex + 1 : issueEnd;
  const priorityEnd = impactIndex >= 0 ? impactIndex : lines.length;

  return {
    greeting: clientFriendlyCopy(lines[0] || 'Buongiorno,', language),
    opening: clientFriendlyCopy(issueIntroIndex > 1 ? lines.slice(1, issueIntroIndex).join(' ') : '', language),
    issueIntro: clientFriendlyCopy(issueIntroIndex >= 0 ? lines[issueIntroIndex] : labels.defaultIssueIntro, language),
    issues: lines.slice(issueStart, issueEnd).map(stripIssuePrefix).map((line) => clientFriendlyCopy(line, language)).filter(Boolean),
    priorities: lines.slice(priorityStart, priorityEnd).map(stripIssuePrefix).map((line) => clientFriendlyCopy(line, language)).filter(Boolean),
    consequence: '',
    impact: clientFriendlyCopy(impactIndex >= 0 ? lines[impactIndex].replace(/^(Impatto economico realistico|Risultato commerciale realistico|Realistic business impact|Impacto comercial realista|Impact commercial realiste|Impact commercial réaliste|Realistischer Business-Effekt|想定できる事業効果|可预期的商业效果)\s*:\s*/i, '') : '', language),
    cta: clientFriendlyCopy(ctaIndex >= 0 && ctaIndex < lines.length ? lines[ctaIndex] : labels.defaultCta, language),
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
  const tag = href ? 'a' : 'div';
  const hrefAttr = href ? ` href="${href}"` : '';
  return `
    <td width="100%" valign="top" style="padding:6px;">
      <${tag}${hrefAttr} style="display:block;min-height:54px;padding:11px 12px;background:#ffffff;border:1px solid #dfe7f0;border-radius:13px;text-decoration:none;color:#13254a;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td width="38" valign="middle"><img src="${icon}" width="32" height="32" alt="${alt}" style="display:block;width:32px;height:32px;border:0;border-radius:10px;"></td>
            <td valign="middle" style="padding-left:10px;">
              <div style="font:700 12px Arial,sans-serif;color:#7a8798;text-transform:uppercase;letter-spacing:.08em;">${label}</div>
              <div style="font:700 13px/1.35 Arial,sans-serif;color:#13254a;">${value}</div>
            </td>
          </tr>
        </table>
      </${tag}>
    </td>
  `;
}

function renderContactTiles(language = 'it') {
  const labels = labelsFor(language);
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:10px 0 0 0;">
      <tr>
        ${contactTile({
          href: LINKS.site,
          icon: ICONS.site,
          alt: 'Logo sito Cantoni Digital Studio',
          label: labels.siteLabel,
          value: 'cantonidigitalstudio.com'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.cases,
          icon: ICONS.cases,
          alt: 'Portfolio lavori Cantoni Digital Studio',
          label: labels.portfolioLabel,
          value: labels.portfolioValue
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.ec8,
          icon: ICONS.cases,
          alt: 'EC8 Platform pubblicata su App Store e Play Store',
          label: labels.appProofLabel,
          value: labels.appProofValue
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.instagram,
          icon: ICONS.instagram,
          alt: 'Logo Instagram ufficiale',
          label: 'Instagram',
          value: '@cantonidigitalstudio'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.facebook,
          icon: ICONS.facebook,
          alt: 'Logo Facebook ufficiale',
          label: 'Facebook',
          value: labels.facebookValue
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.tiktok,
          icon: ICONS.tiktok,
          alt: 'Logo TikTok ufficiale',
          label: labels.tiktokLabel,
          value: TIKTOK_HANDLE
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.youtube,
          icon: ICONS.youtube,
          alt: 'Logo YouTube ufficiale',
          label: 'YouTube',
          value: '@cantonidigitalstudio'
        })}
      </tr>
      <tr>
        ${contactTile({
          href: LINKS.whatsapp,
          icon: ICONS.phone,
          alt: 'Logo WhatsApp ufficiale',
          label: 'WhatsApp',
          value: BRAND_PHONE_DISPLAY
        })}
      </tr>
      <tr>
        ${contactTile({
          href: `mailto:${BRAND_EMAIL}`,
          icon: ICONS.email,
          alt: 'Email Cantoni Digital Studio',
          label: labels.emailLabel,
          value: BRAND_EMAIL
        })}
      </tr>
    </table>
  `;
}

function renderCredibilityBlock(language = 'it') {
  const labels = labelsFor(language);
  return `
    <tr>
      <td style="padding:0 32px 22px 32px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f7f9fc;border:1px solid #dfe7f0;border-radius:14px;">
          <tr>
            <td style="padding:18px 20px;">
              <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:10px;">${labels.whoWrites}</div>
              <div style="font:700 17px/1.45 Arial,sans-serif;color:#13254a;margin-bottom:8px;">${BRAND_NAME}</div>
              <div style="font:400 14px/1.65 Arial,sans-serif;color:#34435a;">
                ${labels.contactIntro}<br>
                ${labels.growthIntro}<br>
                ${labels.siteLabel}: <a href="${LINKS.site}" style="color:#13254a;font-weight:700;text-decoration:none;">cantonidigitalstudio.com</a><br>
                ${labels.appProofLabel}: <a href="${LINKS.ec8}" style="color:#13254a;font-weight:700;text-decoration:none;">EC8 Platform</a> · <a href="${LINKS.appStore}" style="color:#13254a;font-weight:700;text-decoration:none;">${labels.appStoreLabel}</a> · <a href="${LINKS.playStore}" style="color:#13254a;font-weight:700;text-decoration:none;">${labels.playStoreLabel}</a><br>
          Facebook: <a href="${LINKS.facebook}" style="color:#13254a;font-weight:700;text-decoration:none;">${labels.facebookValue}</a><br>
          Instagram: <a href="${LINKS.instagram}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
          ${labels.tiktokLabel}: <a href="${LINKS.tiktok}" style="color:#13254a;font-weight:700;text-decoration:none;">${TIKTOK_HANDLE}</a><br>
          YouTube: <a href="${LINKS.youtube}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
          ${labels.emailLabel}: <a href="mailto:${BRAND_EMAIL}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_EMAIL}</a><br>
                ${labels.phoneLabel}: <a href="${LINKS.whatsapp}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_PHONE_DISPLAY}</a>
              </div>
              ${renderContactTiles(language)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderReferenceFooter(language = 'it') {
  const labels = labelsFor(language);
  const pillStyle = 'display:inline-block;margin:0 8px 8px 0;padding:9px 12px;border-radius:999px;background:#eef3f8;color:#13254a;text-decoration:none;font:700 12px Arial,sans-serif;';
  return `
    <tr>
      <td style="padding:22px 32px 30px 32px;background:#f7f9fc;border-top:1px solid #dfe7f0;">
        <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:12px;">${labels.publicRefs}</div>
        <div style="font:700 18px/1.35 Arial,sans-serif;color:#13254a;margin-bottom:12px;">${BRAND_NAME}</div>
        <div style="font:400 14px/1.65 Arial,sans-serif;color:#34435a;margin-bottom:14px;">
          ${labels.siteLabel}: <a href="${LINKS.site}" style="color:#13254a;font-weight:700;text-decoration:none;">https://cantonidigitalstudio.com</a><br>
          ${labels.appProofLabel}: <a href="${LINKS.ec8}" style="color:#13254a;font-weight:700;text-decoration:none;">EC8 Platform</a> · <a href="${LINKS.appStore}" style="color:#13254a;font-weight:700;text-decoration:none;">${labels.appStoreLabel}</a> · <a href="${LINKS.playStore}" style="color:#13254a;font-weight:700;text-decoration:none;">${labels.playStoreLabel}</a><br>
          Facebook: <a href="${LINKS.facebook}" style="color:#13254a;font-weight:700;text-decoration:none;">${labels.facebookValue} Cantoni Digital Studio</a><br>
          Instagram: <a href="${LINKS.instagram}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
          ${labels.tiktokLabel}: <a href="${LINKS.tiktok}" style="color:#13254a;font-weight:700;text-decoration:none;">${TIKTOK_HANDLE}</a><br>
          YouTube: <a href="${LINKS.youtube}" style="color:#13254a;font-weight:700;text-decoration:none;">@cantonidigitalstudio</a><br>
          ${labels.portfolioLabel}: <a href="${LINKS.cases}" style="color:#13254a;font-weight:700;text-decoration:none;">cantonidigitalstudio.com/case-studies.html</a><br>
          ${labels.emailLabel}: <a href="mailto:${BRAND_EMAIL}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_EMAIL}</a><br>
          ${labels.phoneLabel}: <a href="${LINKS.whatsapp}" style="color:#13254a;font-weight:700;text-decoration:none;">${BRAND_PHONE_DISPLAY}</a>
        </div>
        ${renderContactTiles(language)}
        <div style="margin-bottom:14px;">
          <a href="${LINKS.studio}" style="${pillStyle}">${labels.studioPill}</a>
          <a href="${LINKS.cases}" style="${pillStyle}">${labels.casesPill}</a>
          <a href="${LINKS.ec8}" style="${pillStyle}">${labels.ec8Pill}</a>
          <a href="${LINKS.facebook}" style="${pillStyle}">Facebook</a>
          <a href="${LINKS.instagram}" style="${pillStyle}">Instagram</a>
          <a href="${LINKS.tiktok}" style="${pillStyle}">TikTok</a>
          <a href="${LINKS.youtube}" style="${pillStyle}">YouTube</a>
          <a href="${LINKS.site}" style="${pillStyle}">${labels.sitePill}</a>
        </div>
        <div style="font:400 13px/1.55 Arial,sans-serif;color:#5b6678;">
          ${labels.footerLine}<br>
          ${labels.footerGrowth}
        </div>
      </td>
    </tr>
  `;
}

function renderBrandedEmail(item, logoSrc, options = {}) {
  const language = item.language || 'it';
  const labels = labelsFor(language);
  const parsed = parsePlainBody(item.body, language, item.outreach_style);
  const leadName = displayLeadName(item);
  const title = item.subject || `${leadName}: verifica sito`;
  const preheader = `${labels.badge} Cantoni Digital Studio - ${leadName || 'lead'}.`;
  const showRecipient = options.showRecipient === true;

  if (parsed.mode === 'micro_audit') {
    return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="color-scheme" content="light">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef2f7;table-layout:fixed;">
    <tr>
      <td align="center" style="padding:26px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:720px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dce4ee;box-shadow:0 18px 45px rgba(19,37,74,.10);">
          <tr>
            <td style="padding:28px 32px;background:#13254a;">
              <div style="display:inline-block;background:#ffffff;border-radius:14px;padding:12px 16px;margin:0 0 20px 0;box-shadow:0 10px 26px rgba(0,0,0,.16);">
                <img src="${logoSrc}" width="230" alt="Cantoni Digital Studio" style="display:block;width:230px;max-width:78vw;height:auto;border:0;margin:0;">
              </div><br>
              <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f29d38;color:#13254a;font:700 11px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;">Micro-audit sito live</div>
              <h1 style="margin:16px 0 0 0;color:#ffffff;font:700 27px/1.18 Arial,sans-serif;letter-spacing:0;">${escapeHtml(title)}</h1>
              ${showRecipient ? `<p style="margin:10px 0 0 0;color:#cdd7e6;font:400 14px/1.5 Arial,sans-serif;">Destinatario: ${escapeHtml(item.to || 'da confermare')}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 10px 32px;">
              <p style="margin:0 0 12px 0;color:#20304a;font:400 16px/1.65 Arial,sans-serif;">${escapeHtml(parsed.greeting)}</p>
              ${parsed.opening ? `<p style="margin:0 0 18px 0;color:#20304a;font:400 16px/1.65 Arial,sans-serif;">${escapeHtml(parsed.opening)}</p>` : ''}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #dfe7f0;border-radius:14px;">
                <tr>
                  <td style="padding:22px;">
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:12px;">Osservazione concreta</div>
                    <p style="margin:0;color:#20304a;font:700 17px/1.55 Arial,sans-serif;">${escapeHtml(parsed.issueIntro)}</p>
                    ${parsed.consequence ? `<p style="margin:14px 0 0 0;color:#34435a;font:400 15px/1.6 Arial,sans-serif;">${escapeHtml(parsed.consequence)}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f2d8b7;background:#fffaf4;border-radius:14px;">
                <tr>
                  <td style="padding:22px;">
                    <p style="margin:0;color:#20304a;font:700 16px/1.6 Arial,sans-serif;">${escapeHtml(parsed.cta)}</p>
                    <p style="margin:18px 0 0 0;color:#5b6678;font:400 14px/1.6 Arial,sans-serif;">Emanuele Cantoni<br>${BRAND_NAME}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${renderReferenceFooter(language)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="color-scheme" content="light">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
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
              <div style="display:inline-block;padding:7px 10px;border-radius:999px;background:#f29d38;color:#13254a;font:700 11px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(labels.badge)}</div>
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
          ${renderCredibilityBlock(language)}
          <tr>
            <td style="padding:0 32px 10px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #dfe7f0;border-radius:14px;">
                <tr>
                  <td style="padding:22px 22px 12px 22px;">
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:14px;">${escapeHtml(labels.observations)}</div>
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
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a66a20;margin-bottom:14px;">${escapeHtml(labels.priorities)}</div>
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
                    <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f29d38;margin-bottom:9px;">${escapeHtml(labels.impact)}</div>
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
          ${renderReferenceFooter(language)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderTextEmail(item) {
  const labels = labelsFor(item.language || 'it');
  if (isMicroAuditItem(item)) {
    return `${item.body}

${labels.publicRefs}:
- ${labels.sitePill}: ${LINKS.site}
- ${labels.casesPill}: ${LINKS.cases}
- WhatsApp: ${BRAND_PHONE_DISPLAY}
`;
  }
  return `${renderClientPlainBody(item)}

${labels.publicRefs}:
- ${labels.studioPill}: ${LINKS.studio}
- ${labels.casesPill}: ${LINKS.cases}
- ${labels.appProofLabel}: EC8 Platform (${LINKS.ec8}) · ${labels.appStoreLabel}: ${LINKS.appStore} · ${labels.playStoreLabel}: ${LINKS.playStore}
- Facebook: ${LINKS.facebook}
- Instagram: ${LINKS.instagram}
- ${labels.tiktokLabel}: ${LINKS.tiktok}
- YouTube: ${LINKS.youtube}
- ${labels.phoneLabel}: ${BRAND_PHONE_DISPLAY}
- ${labels.sitePill}: ${LINKS.site}

${BRAND_NAME}
${BRAND_EMAIL}
${BRAND_PHONE_DISPLAY}
`;
}

function renderClientPlainBody(item) {
  if (isMicroAuditItem(item)) return item.body;
  const labels = labelsFor(item.language || 'it');
  const parsed = parsePlainBody(item.body, item.language || 'it', item.outreach_style);
  const lines = [
    parsed.greeting,
    parsed.opening,
    parsed.issueIntro,
    ...parsed.issues.map((issue, index) => `${index + 1}. ${issue}`),
    '',
    `${labels.priorities}:`,
    ...parsed.priorities.map((item) => `- ${item}`),
    '',
    parsed.impact ? `${labels.impact}: ${parsed.impact}` : '',
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
  const hasItems = items.length > 0;
  const intro = hasItems
    ? 'Queste versioni sostituiscono le bozze statiche: struttura Cantoni, logo, sezioni leggibili, riferimenti pubblici e footer social. Non sono ancora state inviate.'
    : 'Nessuna bozza in coda: l\'ultimo batch risulta processato. Restano visibili i riferimenti pubblici Cantoni usati nei messaggi.';
  const previews = items.map((item) => {
    const parsed = parsePlainBody(item.body, item.language || 'it', item.outreach_style);
    const leadName = displayLeadName(item);
    const isMicro = parsed.mode === 'micro_audit';
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
                ${isMicro ? `
                <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:10px;">Micro-audit primo contatto</div>
                <p style="margin:0 0 14px 0;color:#20304a;font:400 15px/1.6 Arial,sans-serif;">${escapeHtml(parsed.opening)}</p>
                <p style="margin:0 0 14px 0;color:#20304a;font:700 16px/1.55 Arial,sans-serif;">${escapeHtml(parsed.issueIntro)}</p>
                <p style="margin:0 0 14px 0;color:#34435a;font:400 15px/1.6 Arial,sans-serif;">${escapeHtml(parsed.consequence)}</p>
                <p style="margin:0;color:#20304a;font:700 15px/1.6 Arial,sans-serif;">${escapeHtml(parsed.cta)}</p>` : `
                <p style="margin:0 0 16px 0;color:#20304a;font:700 16px/1.55 Arial,sans-serif;">${escapeHtml(parsed.issueIntro)}</p>
                <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a8798;margin-bottom:10px;">Punti usati nella bozza</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${listItems(parsed.issues)}</table>
                <div style="height:12px;"></div>
                <div style="font:700 12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a66a20;margin-bottom:10px;">Azioni proposte</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${listItems(parsed.priorities)}</table>`}
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
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
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
              <p style="margin:12px 0 0 0;color:#d8e1ef;font:400 16px/1.6 Arial,sans-serif;">${escapeHtml(intro)}</p>
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
  const previews = items.map((item) => `--- ${item.lead_name || item.lead_id}
A: ${item.to || 'da confermare'}
Oggetto: ${item.subject || ''}

${renderTextEmail(item)}`).join('\n');
  const intro = items.length
    ? 'Queste versioni sostituiscono le bozze statiche: struttura Cantoni, logo, sezioni leggibili, riferimenti pubblici e footer social. Non sono ancora state inviate.'
    : 'Nessuna bozza in coda: l\'ultimo batch risulta processato. Restano visibili i riferimenti pubblici Cantoni usati nei messaggi.';
  return [
    `Preview interna bozze outreach - ${BRAND_NAME}`,
    '',
    intro,
    previews ? `\n${previews}` : ''
  ].join('\n');
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
  if (!Array.isArray(queue)) {
    throw new Error(`Queue is not an array: ${queuePath}`);
  }

  await fs.mkdir(outputDir, { recursive: true });

  const logoBase64 = await fs.readFile(logoPath, 'base64');
  const previewLogoSrc = `data:image/png;base64,${logoBase64}`;
  const mailLogoSrc = 'cid:cantoniLogo';

  if (queue.length === 0) {
    await fs.writeFile(path.join(outputDir, 'outreach_queue_branded.json'), '[]\n');
    await fs.writeFile(path.join(outputDir, 'internal-review-branded.html'), tidyOutput(renderInternalReview([], previewLogoSrc)));
    await fs.writeFile(path.join(outputDir, 'internal-review-branded.txt'), tidyOutput(renderInternalText([])));
    console.log(JSON.stringify({
      ok: true,
      queue: queuePath,
      outputDir,
      emails: 0,
      empty: true,
      files: [
        'outreach_queue_branded.json',
        'internal-review-branded.html',
        'internal-review-branded.txt'
      ]
    }, null, 2));
    return;
  }

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
