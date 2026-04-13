(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var body = document.body;
  if (!body || !body.classList.contains('vip-page')) return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var selectors = [
    '.hero-grid > *',
    '.hero-compact-grid > *',
    '.hero-proof > *',
    '.proof-ribbon-grid > *',
    '.benchmark-grid > *',
    '.offer-grid > *',
    '.signature-grid > *',
    '.experience-grid > *',
    '.fleet-grid > *',
    '.destination-grid > *',
    '.confirmation-grid > *',
    '.channel-grid > *',
    '.trust-grid > *',
    '.builder-sidebar',
    '.builder-panel',
    '.summary-card',
    '.itinerary-card',
    '.admin-shell > *',
    '.section-head',
    '.final-cta-card'
  ];

  var seen = new WeakSet();
  var targets = [];
  document.querySelectorAll(selectors.join(',')).forEach(function (node) {
    if (seen.has(node)) return;
    seen.add(node);
    targets.push(node);
  });

  if (!targets.length) return;

  body.classList.add('vip-fx-ready');

  function initContactLinks() {
    var config = window.CDS_CONFIG && window.CDS_CONFIG.vipRouting;
    if (!config) return;

    var rawPhone = String(config.ownerWhatsapp || '').trim();
    var normalizedPhone = rawPhone.replace(/[^\d+]/g, '');
    var waDigits = normalizedPhone.replace(/\D/g, '');
    var displayPhone = config.ownerWhatsappDisplay || rawPhone || '';
    var publicEmail = config.publicEmail || config.bookingEmail || config.ownerEmail || '';
    var publicAddress = config.publicAddressDisplay || '';
    var defaultMessage = 'Hello, I would like to plan a private transfer or concierge request in Punta Cana.';

    document.querySelectorAll('[data-vip-contact-display]').forEach(function (node) {
      node.textContent = displayPhone;
    });

    document.querySelectorAll('[data-vip-contact-email-display]').forEach(function (node) {
      node.textContent = publicEmail;
    });

    document.querySelectorAll('[data-vip-contact-address-display]').forEach(function (node) {
      node.textContent = publicAddress;
    });

    document.querySelectorAll('[data-vip-contact]').forEach(function (node) {
      var type = node.getAttribute('data-vip-contact');
      if (type === 'whatsapp' && waDigits) {
        node.setAttribute('href', 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent(defaultMessage));
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noreferrer');
      } else if (type === 'call' && normalizedPhone) {
        node.setAttribute('href', 'tel:' + normalizedPhone);
      } else if (type === 'email' && publicEmail) {
        node.setAttribute('href', 'mailto:' + publicEmail);
      }
    });
  }

  initContactLinks();

  targets.forEach(function (node, index) {
    node.classList.add('fx-reveal');
    node.style.setProperty('--fx-delay', String((index % 6) * 90) + 'ms');
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(function (node) {
      node.classList.add('is-visible');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px'
    });

    targets.forEach(function (node) {
      observer.observe(node);
    });
  }

  if (prefersReducedMotion) return;

  var ticking = false;
  function applyScrollFx() {
    ticking = false;
    body.style.setProperty('--vip-scroll-shift', String(Math.min(window.scrollY || 0, 520)) + 'px');
  }

  function requestScrollFx() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(applyScrollFx);
  }

  applyScrollFx();
  window.addEventListener('scroll', requestScrollFx, { passive: true });
})();
