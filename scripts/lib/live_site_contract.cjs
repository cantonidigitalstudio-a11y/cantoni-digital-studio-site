const CONTRACT_BASE_URL = 'https://cantonidigitalstudio.com';

const HTML_PAGES = [
  { path: '/', canonical: `${CONTRACT_BASE_URL}/`, title: 'Cantoni Digital Studio', required: ['cantonidigitalstudio@gmail.com', 'https://wa.me/393471961113'] },
  { path: '/studio.html', canonical: `${CONTRACT_BASE_URL}/studio.html`, title: 'Cantoni Digital Studio', required: ['privacy.html', 'termini-commerciali.html'] },
  { path: '/servizi.html', canonical: `${CONTRACT_BASE_URL}/servizi.html`, title: 'Cantoni Digital Studio', required: ['privacy.html', 'termini-commerciali.html'] },
  { path: '/case-studies.html', canonical: `${CONTRACT_BASE_URL}/case-studies.html`, title: 'Cantoni Digital Studio', required: ['https://excellentiavip.com', 'https://mrcollinstravel.com', 'https://ec8platform.com'] },
  { path: '/preventivo.html', canonical: `${CONTRACT_BASE_URL}/preventivo.html`, title: 'Cantoni Digital Studio', required: ['name="privacyAccepted"', 'https://buy.stripe.com/'] },
  { path: '/identita-operativa.html', canonical: `${CONTRACT_BASE_URL}/identita-operativa.html`, title: 'Cantoni Digital Studio', required: ['https://github.com/cantonidigitalstudio-a11y', 'https://www.instagram.com/cantonidigitalstudio/'] },
  { path: '/termini-commerciali.html', canonical: `${CONTRACT_BASE_URL}/termini-commerciali.html`, title: 'Cantoni Digital Studio', required: ['privacy.html', 'cantonidigitalstudio@gmail.com'] },
  { path: '/privacy.html', canonical: `${CONTRACT_BASE_URL}/privacy.html`, title: 'Cantoni Digital Studio', required: ['termini-commerciali.html', 'cantonidigitalstudio@gmail.com'] },
  { path: '/pagamento-confermato.html', canonical: null, title: 'Cantoni Digital Studio', noindex: true, required: ['Pagamento confermato'] }
];

module.exports = {
  CONTRACT_BASE_URL,
  HTML_PAGES
};
