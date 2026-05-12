(function () {
  var app = window.CDSApp || {};

  app.createAnalyticsModule = function () {
    function getConfig() {
      var root = window.CDS_CONFIG || {};
      return root.analytics || {};
    }

    function getEndpoint() {
      var root = window.CDS_CONFIG || {};
      var analytics = getConfig();
      return analytics.endpoint || root.leadCaptureEndpoint || '';
    }

    function getStorageKey(name, fallback) {
      var analytics = getConfig();
      return analytics[name] || fallback;
    }

    function consentKey() {
      return getStorageKey('consentStorageKey', 'cds_cookie_consent_v1');
    }

    function requiresConsent() {
      var analytics = getConfig();
      return analytics.requiresConsent !== false;
    }

    function readConsent() {
      if (!requiresConsent()) return { analytics: true, source: 'config' };
      try {
        var raw = localStorage.getItem(consentKey());
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    function hasAnalyticsConsent() {
      var consent = readConsent();
      return Boolean(consent && consent.analytics === true);
    }

    function storeConsent(analyticsAllowed) {
      try {
        localStorage.setItem(consentKey(), JSON.stringify({
          essential: true,
          analytics: Boolean(analyticsAllowed),
          accepted_at: new Date().toISOString(),
          version: 1
        }));
      } catch (e) {}
    }

    function consentText() {
      var lang = document.documentElement.lang || 'it';
      if (lang === 'it') {
        return {
          title: 'Privacy e cookie',
          body: 'Usiamo dati essenziali per lingua, bozze e funzionamento del sito. Analytics e misurazione commerciale partono solo se li autorizzi.',
          essential: 'Solo essenziali',
          analytics: 'Accetta analytics',
          privacy: 'Privacy e cookie'
        };
      }
      return {
        title: 'Privacy and cookies',
        body: 'We use essential data for language, drafts and site operation. Analytics and commercial measurement run only if you allow them.',
        essential: 'Essential only',
        analytics: 'Accept analytics',
        privacy: 'Privacy notice'
      };
    }

    function removeConsentBanner() {
      var existing = document.getElementById('cdsCookieConsent');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }

    function renderConsentBanner() {
      if (!requiresConsent() || readConsent() || document.getElementById('cdsCookieConsent')) return;
      var copy = consentText();
      var banner = document.createElement('section');
      banner.id = 'cdsCookieConsent';
      banner.className = 'cookie-consent';
      banner.setAttribute('aria-label', copy.title);
      banner.innerHTML =
        '<div class="cookie-consent-copy">' +
          '<h2>' + copy.title + '</h2>' +
          '<p>' + copy.body + ' <a href="privacy.html">' + copy.privacy + '</a></p>' +
        '</div>' +
        '<div class="cookie-consent-actions">' +
          '<button type="button" class="btn btn-ghost" data-cookie-choice="essential">' + copy.essential + '</button>' +
          '<button type="button" class="btn btn-primary" data-cookie-choice="analytics">' + copy.analytics + '</button>' +
        '</div>';

      banner.addEventListener('click', function (event) {
        var button = event.target && event.target.closest ? event.target.closest('[data-cookie-choice]') : null;
        if (!button) return;
        var allowAnalytics = button.getAttribute('data-cookie-choice') === 'analytics';
        storeConsent(allowAnalytics);
        removeConsentBanner();
        if (allowAnalytics) {
          track('cookie_consent_updated', { category: 'privacy', label: 'analytics accepted' });
          track('page_view', { category: 'page', label: document.title || '' });
        }
      });

      document.body.appendChild(banner);
    }

    function getSessionId() {
      var key = getStorageKey('sessionKey', 'cds_analytics_session_v1');
      try {
        var existing = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (existing) return existing;
        var next = 'cds_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(key, next);
        localStorage.setItem(key, next);
        return next;
      } catch (e) {
        return 'cds_' + Date.now().toString(36);
      }
    }

    function bufferEvent(payload) {
      var key = getStorageKey('localBufferKey', 'cds_analytics_buffer_v1');
      var max = Number(getConfig().maxBufferedEvents || 250);
      try {
        var current = JSON.parse(localStorage.getItem(key) || '[]');
        current.push(payload);
        if (current.length > max) current = current.slice(current.length - max);
        localStorage.setItem(key, JSON.stringify(current));
      } catch (e) {}
    }

    function buildPayload(eventName, details) {
      var lang = document.documentElement.lang || 'en';
      var path = window.location.pathname || '/';
      var title = document.title || '';
      var detailsSafe = details || {};
      return {
        action: getConfig().action || 'track_event',
        event_name: eventName,
        event_category: detailsSafe.category || '',
        event_label: detailsSafe.label || '',
        page: detailsSafe.pageOverride || (app.getPageKey ? app.getPageKey(path) : path),
        path: path,
        url: window.location.href || '',
        language: lang,
        title: title,
        session_id: getSessionId(),
        href: detailsSafe.href || '',
        referrer: document.referrer || '',
        viewport: window.innerWidth + 'x' + window.innerHeight,
        screen: (window.screen && window.screen.width ? window.screen.width : 0) + 'x' + (window.screen && window.screen.height ? window.screen.height : 0),
        market: detailsSafe.market || '',
        form_type: detailsSafe.formType || '',
        project_type: detailsSafe.projectType || '',
        payment_path: detailsSafe.paymentPath || '',
        payment_mode: detailsSafe.paymentMode || '',
        payment_state: detailsSafe.paymentState || '',
        checkout_session_id: detailsSafe.checkoutSessionId || '',
        source: 'website',
        user_agent: navigator.userAgent || '',
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        occurred_at: new Date().toISOString()
      };
    }

    function send(payload) {
      var endpoint = getEndpoint();
      if (!endpoint) return;
      var params = new URLSearchParams();
      Object.keys(payload).forEach(function (key) {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') return;
        params.set(key, String(payload[key]));
      });
      var img = new Image();
      img.src = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + params.toString();
    }

    function track(eventName, details) {
      var analytics = getConfig();
      if (analytics.enabled === false) return;
      if (!hasAnalyticsConsent()) return;
      var payload = buildPayload(eventName, details);
      bufferEvent(payload);
      send(payload);
    }

    function cleanText(value) {
      return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    }

    function isStripeHref(href) {
      return /^https?:\/\/buy\.stripe\.com\//i.test(String(href || ''));
    }

    function classifyClick(target) {
      if (!target) return null;
      var href = target.getAttribute && target.getAttribute('href') ? target.getAttribute('href') : '';
      var label = cleanText(target.getAttribute('data-track-label') || target.textContent || target.getAttribute('aria-label') || href);
      if (!label && !href) return null;

      if (href && isStripeHref(href)) {
        return {
          name: 'stripe_checkout_started',
          category: 'payment',
          href: href,
          label: label || 'Stripe checkout',
          paymentPath: target.getAttribute('data-payment-path') || '',
          paymentMode: target.getAttribute('data-payment-mode') || '',
          paymentState: 'started'
        };
      }

      if (href && href.indexOf('instagram.com') !== -1) {
        return { name: 'social_click', category: 'social', href: href, label: label || 'Instagram' };
      }
      if (href && href.indexOf('facebook.com') !== -1) {
        return { name: 'social_click', category: 'social', href: href, label: label || 'Facebook' };
      }
      if (href && href.indexOf('github.com') !== -1) {
        return { name: 'social_click', category: 'social', href: href, label: label || 'GitHub' };
      }
      if (href && href.indexOf('mailto:') === 0) {
        return { name: 'email_click', category: 'contact', href: href, label: label || 'Email' };
      }
      if (target.classList && target.classList.contains('btn')) {
        return { name: 'cta_click', category: 'cta', href: href, label: label };
      }
      if (href) {
        return { name: 'nav_click', category: 'navigation', href: href, label: label };
      }
      if (target.tagName === 'BUTTON') {
        return { name: 'button_click', category: 'interaction', href: href, label: label };
      }
      return null;
    }

    function bindClicks() {
      document.addEventListener('click', function (event) {
        var target = event.target && event.target.closest ? event.target.closest('a,button') : null;
        var meta = classifyClick(target);
        if (!meta) return;
        track(meta.name, meta);
      });
    }

    function bindLeadEvents() {
      document.addEventListener('cds:lead-submit', function (event) {
        var detail = event.detail || {};
        track(detail.mode === 'success' ? 'lead_submit_success' : 'lead_submit_fallback', {
          category: 'lead_form',
          label: detail.formType || 'lead_form',
          formType: detail.formType || '',
          projectType: detail.projectType || '',
          market: detail.market || ''
        });
      });
    }

    function bindPaymentEvents() {
      document.addEventListener('cds:payment-complete', function (event) {
        var detail = event.detail || {};
        track('stripe_checkout_completed', {
          category: 'payment',
          label: detail.label || detail.paymentPath || 'Stripe checkout completed',
          paymentPath: detail.paymentPath || '',
          paymentMode: detail.paymentMode || '',
          paymentState: 'completed',
          checkoutSessionId: detail.checkoutSessionId || '',
          pageOverride: detail.pageOverride || ''
        });
      });

      document.addEventListener('cds:payment-cancelled', function (event) {
        var detail = event.detail || {};
        track('stripe_checkout_cancelled', {
          category: 'payment',
          label: detail.label || detail.paymentPath || 'Stripe checkout cancelled',
          paymentPath: detail.paymentPath || '',
          paymentMode: detail.paymentMode || '',
          paymentState: 'cancelled',
          checkoutSessionId: detail.checkoutSessionId || '',
          pageOverride: detail.pageOverride || ''
        });
      });
    }

    function init() {
      renderConsentBanner();
      if (hasAnalyticsConsent()) track('page_view', { category: 'page', label: document.title || '' });
      bindClicks();
      bindLeadEvents();
      bindPaymentEvents();
    }

    return {
      init: init,
      track: track,
      hasAnalyticsConsent: hasAnalyticsConsent,
      renderConsentBanner: renderConsentBanner
    };
  };
})();
