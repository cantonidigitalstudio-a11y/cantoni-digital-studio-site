(function () {
  var STORAGE_KEY = 'destination_cocoa_booking_draft_v1';
  var CONFIG = {
    brandName: 'Destination Cocoa',
    ownerName: 'Collins',
    contactEmail: '',
    ownerEmail: '',
    ownerPhone: '',
    whatsappNumber: '',
    currency: 'usd',
    stripe: {
      enabled: false,
      checkoutEndpoint: '/api/stripe/create-checkout-session',
      depositPercent: 30,
      successPath: '/destination-cocoa-booking.html',
      cancelPath: '/destination-cocoa-booking.html'
    }
  };

  var PACKAGES = {
    classic: {
      label: 'Classic arrival',
      price: 0,
      note: 'The base commercial layer',
      detail: 'Keeps the booking clean and credible without extra theater.'
    },
    signature: {
      label: 'Signature hosted',
      price: 45,
      note: 'The main conversion tier',
      detail: 'Adds a stronger service frame and clearer premium perception.'
    },
    grand: {
      label: 'Grand arrival',
      price: 95,
      note: 'Best for premium spend',
      detail: 'Built for guests who expect a more visibly hosted arrival.'
    }
  };

  var EXTRAS = {
    fastTrack: {
      label: 'Airport fast-track coordination',
      detail: 'Priority airport handoff and arrival support.',
      price: 150
    },
    childSeat: {
      label: 'Child seat request',
      detail: 'Pre-installed child seat before pickup.',
      price: 25
    },
    groceryStop: {
      label: 'Grocery or pharmacy stop',
      detail: 'Quick supply stop on the way to the property.',
      price: 35
    },
    champagne: {
      label: 'Champagne welcome',
      detail: 'Celebration bottle prepared before arrival.',
      price: 110
    },
    birthdayStyling: {
      label: 'Birthday styling setup',
      detail: 'Decor, welcome signage and celebratory touchpoints.',
      price: 135
    },
    floralWelcome: {
      label: 'Flower bouquet welcome',
      detail: 'Curated floral welcome for airport, hotel or villa arrival.',
      price: 70
    },
    host: {
      label: 'Bilingual host assistance',
      detail: 'On-site host support for check-in or coordination.',
      price: 120
    },
    photographer: {
      label: 'Short-form arrival content',
      detail: 'Quick capture package for airport or villa arrival moments.',
      price: 180
    }
  };

  var SERVICES = {
    airport: {
      key: 'airport',
      label: 'Airport transfer',
      mode: 'book',
      modeLabel: 'Book now',
      status: 'Fixed transport service with predictable pricing.',
      support: 'Ideal for guests landing in Punta Cana and heading directly to hotel or villa.',
      routes: {
        capCana: { label: 'Punta Cana Airport to Cap Cana', price: 35 },
        bavaro: { label: 'Punta Cana Airport to Bavaro', price: 39 },
        uveroAlto: { label: 'Punta Cana Airport to Uvero Alto', price: 69 },
        laRomana: { label: 'Punta Cana Airport to La Romana', price: 120 }
      },
      formats: {
        suv: { label: 'Premium SUV', price: 0 },
        vipSuv: { label: 'VIP SUV', price: 20 },
        executiveVan: { label: 'Executive van', price: 35 }
      }
    },
    roundtrip: {
      key: 'roundtrip',
      label: 'Round-trip airport booking',
      mode: 'book',
      modeLabel: 'Book now',
      status: 'Arrival plus return closes the second sale immediately.',
      support: 'The client leaves the checkout with both airport legs already organized.',
      routes: {
        capCana: { label: 'Round trip Airport and Cap Cana', price: 65 },
        bavaro: { label: 'Round trip Airport and Bavaro', price: 72 },
        uveroAlto: { label: 'Round trip Airport and Uvero Alto', price: 128 },
        laRomana: { label: 'Round trip Airport and La Romana', price: 220 }
      },
      formats: {
        suv: { label: 'Premium SUV', price: 0 },
        vipSuv: { label: 'VIP SUV', price: 35 },
        executiveVan: { label: 'Executive van', price: 60 }
      }
    },
    chauffeur: {
      key: 'chauffeur',
      label: 'Private driver coverage',
      mode: 'book',
      modeLabel: 'Book now',
      status: 'Time-based driver coverage can also move into checkout.',
      support: 'Good for shoppers, restaurant plans, nightlife or moving families across the zone.',
      routes: {
        fourHours: { label: '4 hours in Punta Cana', price: 140 },
        eightHours: { label: '8 hours in Punta Cana', price: 260 },
        twelveHours: { label: '12 hours in Punta Cana', price: 380 },
        nightlife: { label: 'Nightlife and dinner coverage', price: 210 }
      },
      formats: {
        sedan: { label: 'Executive sedan', price: 0 },
        suv: { label: 'Premium SUV', price: 35 },
        van: { label: 'Executive van', price: 70 }
      }
    },
    experience: {
      key: 'experience',
      label: 'Experiences and bookings',
      mode: 'quote',
      modeLabel: 'Ask first',
      status: 'Availability-dependent services should stay quote-first.',
      support: 'The site still builds a clean recap so the team does not restart the conversation from zero.',
      routes: {
        saona: { label: 'Saona day coordination', price: 95 },
        catamaran: { label: 'Private catamaran or boat day', price: 580 },
        nightlife: { label: 'Nightlife and table booking request', price: 120 },
        shopping: { label: 'Shopping and city-day request', price: 150 }
      },
      formats: {
        shared: { label: 'Shared premium seat', price: 0 },
        privateGroup: { label: 'Private group setup', price: 180 },
        hostedVip: { label: 'Hosted VIP day', price: 320 }
      }
    },
    concierge: {
      key: 'concierge',
      label: 'Celebration concierge',
      mode: 'quote',
      modeLabel: 'Ask first',
      status: 'Custom coordination is sold best after one real availability check.',
      support: 'Still useful to pre-qualify the request and expose the upsell layer before chat starts.',
      routes: {
        villaArrival: { label: 'Villa arrival setup', price: 85 },
        birthday: { label: 'Birthday room or villa styling', price: 160 },
        dinner: { label: 'Restaurant reservation and transport coordination', price: 75 },
        proposal: { label: 'Proposal or surprise coordination', price: 240 }
      },
      formats: {
        remote: { label: 'Remote coordination', price: 0 },
        hosted: { label: 'Hosted coordination', price: 120 },
        fullOnSite: { label: 'Full on-site presence', price: 260 }
      }
    }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(CONFIG.currency || 'usd').toUpperCase(),
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function query() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (error) {
      return new URLSearchParams();
    }
  }

  function sanitizePhone(value) {
    return String(value || '').replace(/[^\d]/g, '');
  }

  function buildMailUrl(subject, body, to) {
    return 'https://mail.google.com/mail/?view=cm&fs=1&tf=1' +
      '&to=' + encodeURIComponent(to || '') +
      '&su=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function openMailDraft(subject, body) {
    var to = CONFIG.contactEmail || '';
    var url = buildMailUrl(subject, body, to);
    var win = null;

    try {
      win = window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {}

    if (win) return;

    var mailto = 'mailto:' + encodeURIComponent(to) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    window.location.href = mailto;
  }

  function buildWhatsAppUrl(text) {
    var digits = sanitizePhone(CONFIG.whatsappNumber);
    if (digits) return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text);
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function writeDraft(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {}
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px' });

    items.forEach(function (item) { observer.observe(item); });
  }

  function initPaymentBanner() {
    var banner = byId('dcPaymentBanner');
    if (!banner) return;

    var paymentState = query().get('payment');
    if (paymentState === 'success') {
      banner.hidden = false;
      banner.className = 'dc-payment-banner is-success';
      banner.textContent = 'Payment recorded. Once email and WhatsApp channel credentials are connected, the webhook will send client and owner confirmations automatically.';
    } else if (paymentState === 'cancelled') {
      banner.hidden = false;
      banner.className = 'dc-payment-banner is-cancelled';
      banner.textContent = 'Payment was cancelled. The booking summary is still ready to send by email or WhatsApp.';
    }
  }

  function initBookingBuilder() {
    var serviceRoot = byId('serviceChips');
    if (!serviceRoot) return;

    var baseDraft = readDraft();
    var state = {
      serviceKey: baseDraft.serviceKey || 'airport',
      routeKey: baseDraft.routeKey || '',
      formatKey: baseDraft.formatKey || '',
      packageKey: baseDraft.packageKey || 'signature',
      extras: baseDraft.extras || {},
      guestName: baseDraft.guestName || '',
      guestEmail: baseDraft.guestEmail || '',
      guestWhatsapp: baseDraft.guestWhatsapp || '',
      guestCountry: baseDraft.guestCountry || '',
      travelDate: baseDraft.travelDate || '',
      travelTime: baseDraft.travelTime || '',
      pickupPoint: baseDraft.pickupPoint || '',
      referenceField: baseDraft.referenceField || '',
      guestCount: baseDraft.guestCount || '2',
      notesField: baseDraft.notesField || ''
    };

    var qs = query();
    var queriedService = qs.get('service');
    if (queriedService && SERVICES[queriedService]) state.serviceKey = queriedService;
    if (qs.get('package') && PACKAGES[qs.get('package')]) state.packageKey = qs.get('package');

    function serviceDef() {
      return SERVICES[state.serviceKey] || SERVICES.airport;
    }

    function listKeys(obj) {
      return Object.keys(obj || {});
    }

    function currentRouteDef() {
      var routes = serviceDef().routes;
      if (!routes[state.routeKey]) state.routeKey = listKeys(routes)[0];
      return routes[state.routeKey];
    }

    function currentFormatDef() {
      var formats = serviceDef().formats;
      if (!formats[state.formatKey]) state.formatKey = listKeys(formats)[0];
      return formats[state.formatKey];
    }

    function currentPackageDef() {
      return PACKAGES[state.packageKey] || PACKAGES.signature;
    }

    function selectedExtraKeys() {
      return Object.keys(state.extras || {}).filter(function (key) {
        return Boolean(state.extras[key] && EXTRAS[key]);
      });
    }

    function selectedExtrasLabel() {
      var keys = selectedExtraKeys();
      if (!keys.length) return 'No add-ons selected';
      return keys.map(function (key) { return EXTRAS[key].label; }).join(', ');
    }

    function computeTotals() {
      var route = currentRouteDef();
      var format = currentFormatDef();
      var pack = currentPackageDef();
      var extrasTotal = selectedExtraKeys().reduce(function (sum, key) {
        return sum + Number(EXTRAS[key].price || 0);
      }, 0);
      var total = Number(route.price || 0) + Number(format.price || 0) + Number(pack.price || 0) + extrasTotal;
      var deposit = Math.max(0, Math.round(total * Number(CONFIG.stripe.depositPercent || 30)) / 100);
      return {
        total: total,
        deposit: deposit,
        full: total,
        extras: extrasTotal
      };
    }

    function buildRequestText() {
      var service = serviceDef();
      var route = currentRouteDef();
      var format = currentFormatDef();
      var pack = currentPackageDef();
      var totals = computeTotals();
      var lines = [
        'Destination Cocoa booking request',
        '',
        'Service: ' + service.label,
        'Route or request: ' + route.label,
        'Format: ' + format.label,
        'Package: ' + pack.label,
        'Add-ons: ' + selectedExtrasLabel(),
        'Guests: ' + String(state.guestCount || '2'),
        'Date: ' + (state.travelDate || 'Not added yet'),
        'Time: ' + (state.travelTime || 'Not added yet'),
        'Pickup point: ' + (state.pickupPoint || 'Not added yet'),
        'Reference: ' + (state.referenceField || 'Not added yet'),
        'Lead name: ' + (state.guestName || 'Not added yet'),
        'Email: ' + (state.guestEmail || 'Not added yet'),
        'WhatsApp: ' + (state.guestWhatsapp || 'Not added yet'),
        'Country: ' + (state.guestCountry || 'Not added yet'),
        'Notes: ' + (state.notesField || 'None'),
        'Mode: ' + service.modeLabel,
        'Estimated total: ' + formatMoney(totals.total)
      ];

      if (service.mode === 'book') {
        lines.push('Deposit: ' + formatMoney(totals.deposit));
      } else {
        lines.push('Payment: availability and price confirmation required');
      }

      lines.push('');
      lines.push('Please confirm next steps.');
      return lines.join('\n');
    }

    function missingCheckoutFields() {
      var missing = [];
      if (!state.guestName) missing.push('lead name');
      if (!state.guestEmail) missing.push('email');
      if (!state.guestCountry) missing.push('country');
      if (!state.travelDate) missing.push('date');
      if (!state.travelTime) missing.push('time');
      if (!state.pickupPoint) missing.push('pickup point');
      return missing;
    }

    function syncTextInputs() {
      var fieldIds = [
        'guestName',
        'guestEmail',
        'guestWhatsapp',
        'guestCountry',
        'travelDate',
        'travelTime',
        'pickupPoint',
        'referenceField',
        'guestCount',
        'notesField'
      ];
      fieldIds.forEach(function (id) {
        var field = byId(id);
        if (!field) return;
        if (field.value !== String(state[id] || '')) field.value = String(state[id] || '');
      });
    }

    function renderServiceChips() {
      serviceRoot.innerHTML = listKeys(SERVICES).map(function (key) {
        var item = SERVICES[key];
        var activeClass = key === state.serviceKey ? ' is-active' : '';
        return '' +
          '<button class="dc-chip' + activeClass + '" type="button" data-service-key="' + escapeHtml(key) + '">' +
          '<strong>' + escapeHtml(item.label) + '</strong>' +
          '<span>' + escapeHtml(item.modeLabel + ' · ' + item.support) + '</span>' +
          '</button>';
      }).join('');
    }

    function renderRouteOptions() {
      var select = byId('routeSelect');
      var routes = serviceDef().routes;
      currentRouteDef();
      select.innerHTML = listKeys(routes).map(function (key) {
        var route = routes[key];
        return '<option value="' + escapeHtml(key) + '">' + escapeHtml(route.label + ' · ' + formatMoney(route.price)) + '</option>';
      }).join('');
      select.value = state.routeKey;
    }

    function renderFormatOptions() {
      var select = byId('formatSelect');
      var formats = serviceDef().formats;
      currentFormatDef();
      select.innerHTML = listKeys(formats).map(function (key) {
        var item = formats[key];
        var suffix = item.price ? ' · +' + formatMoney(item.price) : '';
        return '<option value="' + escapeHtml(key) + '">' + escapeHtml(item.label + suffix) + '</option>';
      }).join('');
      select.value = state.formatKey;
    }

    function renderPackageCards() {
      var root = byId('packageCards');
      root.innerHTML = listKeys(PACKAGES).map(function (key) {
        var item = PACKAGES[key];
        var activeClass = key === state.packageKey ? ' is-active' : '';
        var suffix = item.price ? '+' + formatMoney(item.price) : 'Included';
        return '' +
          '<button class="dc-tier-card' + activeClass + '" type="button" data-package-key="' + escapeHtml(key) + '">' +
          '<strong>' + escapeHtml(item.label) + '</strong>' +
          '<span>' + escapeHtml(item.note) + '</span>' +
          '<span>' + escapeHtml(item.detail) + '</span>' +
          '<em>' + escapeHtml(suffix) + '</em>' +
          '</button>';
      }).join('');
    }

    function renderExtras() {
      var root = byId('extrasGrid');
      root.innerHTML = listKeys(EXTRAS).map(function (key) {
        var item = EXTRAS[key];
        var activeClass = state.extras[key] ? ' is-active' : '';
        return '' +
          '<button class="dc-extra-card' + activeClass + '" type="button" data-extra-key="' + escapeHtml(key) + '">' +
          '<strong>' + escapeHtml(item.label) + '</strong>' +
          '<span>' + escapeHtml(item.detail) + '</span>' +
          '<em>+' + escapeHtml(formatMoney(item.price)) + '</em>' +
          '</button>';
      }).join('');
    }

    function renderSummary() {
      var service = serviceDef();
      var route = currentRouteDef();
      var format = currentFormatDef();
      var pack = currentPackageDef();
      var totals = computeTotals();
      var missing = missingCheckoutFields();

      byId('summaryHeadline').textContent = service.label + ' for Punta Cana';
      byId('summaryService').textContent = service.label;
      byId('summaryRoute').textContent = route.label;
      byId('summaryFormat').textContent = format.label;
      byId('summaryPackage').textContent = pack.label;
      byId('summaryExtras').textContent = selectedExtrasLabel();
      byId('summaryGuests').textContent = String(state.guestCount || '2') + ' guests';
      byId('summaryTravel').textContent = (state.travelDate || 'Date not added yet') + ' · ' + (state.travelTime || 'Time not added yet');
      byId('summaryContact').textContent = [state.guestEmail, state.guestWhatsapp].filter(Boolean).join(' · ') || 'Email or WhatsApp still missing';
      byId('summaryTotal').textContent = formatMoney(totals.total);
      byId('summaryDeposit').textContent = formatMoney(totals.deposit);
      byId('summaryMode').textContent = service.modeLabel;
      byId('summaryStatus').textContent = service.status;
      byId('summarySupport').textContent = service.support;

      var payDepositBtn = byId('payDepositBtn');
      var payFullBtn = byId('payFullBtn');
      var actionNote = byId('actionNote');

      if (service.mode !== 'book') {
        payDepositBtn.disabled = true;
        payFullBtn.disabled = true;
        actionNote.textContent = 'This service stays quote-first. Use email or WhatsApp and confirm price and availability manually before taking payment.';
      } else if (!CONFIG.stripe.enabled) {
        payDepositBtn.disabled = true;
        payFullBtn.disabled = true;
        actionNote.textContent = 'Stripe checkout is wired in the codebase but still disabled in config until live payment keys and webhook credentials are connected.';
      } else if (missing.length) {
        payDepositBtn.disabled = true;
        payFullBtn.disabled = true;
        actionNote.textContent = 'Add ' + missing.join(', ') + ' to unlock secure checkout.';
      } else {
        payDepositBtn.disabled = false;
        payFullBtn.disabled = false;
        actionNote.textContent = 'This service can move into secure checkout. Deposit and full-payment buttons use the same booking payload.';
      }

      writeDraft(state);
    }

    function renderAll() {
      syncTextInputs();
      renderServiceChips();
      renderRouteOptions();
      renderFormatOptions();
      renderPackageCards();
      renderExtras();
      renderSummary();
    }

    function applyQueryDefaults() {
      var route = qs.get('route');
      var format = qs.get('format');
      var extras = qs.get('extras');

      if (route) state.routeKey = route;
      if (format) state.formatKey = format;
      if (extras) {
        extras.split(',').forEach(function (key) {
          if (EXTRAS[key]) state.extras[key] = true;
        });
      }
    }

    function buildCheckoutPayload(paymentKind) {
      var service = serviceDef();
      var route = currentRouteDef();
      var format = currentFormatDef();
      var pack = currentPackageDef();
      var totals = computeTotals();

      return {
        merchantName: CONFIG.brandName,
        paymentKind: paymentKind,
        amount: paymentKind === 'deposit' ? totals.deposit : totals.full,
        depositAmount: totals.deposit,
        fullAmount: totals.full,
        currency: CONFIG.currency,
        email: state.guestEmail,
        leadName: state.guestName,
        country: state.guestCountry,
        whatsapp: state.guestWhatsapp,
        pickupPoint: state.pickupPoint,
        reference: state.referenceField,
        serviceLabel: service.label,
        routeLabel: route.label,
        vehicleLabel: format.label,
        packageLabel: pack.label,
        extrasLabel: selectedExtrasLabel(),
        notes: state.notesField,
        date: state.travelDate,
        time: state.travelTime,
        successPath: CONFIG.stripe.successPath,
        cancelPath: CONFIG.stripe.cancelPath,
        metadata: {
          brand_slug: 'destination_cocoa',
          service_key: service.key,
          route_key: state.routeKey,
          format_key: state.formatKey,
          package_key: state.packageKey,
          owner_name: CONFIG.ownerName,
          owner_email: CONFIG.ownerEmail,
          owner_phone: CONFIG.ownerPhone,
          guest_count: String(state.guestCount || ''),
          request_mode: service.mode
        }
      };
    }

    async function startCheckout(paymentKind) {
      var note = byId('actionNote');
      note.textContent = paymentKind === 'deposit' ? 'Opening deposit checkout…' : 'Opening full-payment checkout…';

      try {
        var response = await fetch(CONFIG.stripe.checkoutEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildCheckoutPayload(paymentKind))
        });
        var result = await response.json();

        if (!response.ok || !result || !result.url) {
          throw new Error((result && result.error) || 'Checkout did not return a redirect URL.');
        }

        window.location.href = result.url;
      } catch (error) {
        note.textContent = (error && error.message) || 'Secure checkout could not start. Use email or WhatsApp while the payment layer is checked.';
      }
    }

    function bindEvents() {
      serviceRoot.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-service-key]');
        if (!trigger) return;
        state.serviceKey = trigger.getAttribute('data-service-key');
        state.routeKey = '';
        state.formatKey = '';
        renderAll();
      });

      byId('routeSelect').addEventListener('change', function (event) {
        state.routeKey = event.target.value;
        renderSummary();
      });

      byId('formatSelect').addEventListener('change', function (event) {
        state.formatKey = event.target.value;
        renderSummary();
      });

      byId('packageCards').addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-package-key]');
        if (!trigger) return;
        state.packageKey = trigger.getAttribute('data-package-key');
        renderAll();
      });

      byId('extrasGrid').addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-extra-key]');
        if (!trigger) return;
        var key = trigger.getAttribute('data-extra-key');
        state.extras[key] = !state.extras[key];
        renderAll();
      });

      [
        'guestName',
        'guestEmail',
        'guestWhatsapp',
        'guestCountry',
        'travelDate',
        'travelTime',
        'pickupPoint',
        'referenceField',
        'guestCount',
        'notesField'
      ].forEach(function (id) {
        var field = byId(id);
        if (!field) return;
        field.addEventListener('input', function () {
          state[id] = field.value.trim();
          renderSummary();
        });
        field.addEventListener('change', function () {
          state[id] = field.value.trim();
          renderSummary();
        });
      });

      byId('emailRequestBtn').addEventListener('click', function () {
        openMailDraft('Destination Cocoa booking request', buildRequestText());
      });

      byId('whatsappRequestBtn').addEventListener('click', function () {
        window.open(buildWhatsAppUrl(buildRequestText()), '_blank', 'noopener,noreferrer');
      });

      byId('copyRequestBtn').addEventListener('click', async function () {
        var note = byId('actionNote');
        try {
          await navigator.clipboard.writeText(buildRequestText());
          note.textContent = 'Booking recap copied. Paste it into chat, email or your operations system.';
        } catch (error) {
          note.textContent = 'Copy failed in this browser. Use email or WhatsApp routing instead.';
        }
      });

      byId('payDepositBtn').addEventListener('click', function () {
        if (byId('payDepositBtn').disabled) return;
        startCheckout('deposit');
      });

      byId('payFullBtn').addEventListener('click', function () {
        if (byId('payFullBtn').disabled) return;
        startCheckout('full');
      });
    }

    applyQueryDefaults();
    bindEvents();
    renderAll();
  }

  initReveal();
  initPaymentBanner();
  initBookingBuilder();
})();
