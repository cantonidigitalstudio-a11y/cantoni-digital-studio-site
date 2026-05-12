(function () {
  var app = window.CDSApp || {};

  app.createLeadFormsModule = function (i18nModule) {
    function getSiteConfig() {
      return window.CDS_CONFIG || {};
    }

    function buildGmailComposeUrl(subject, body) {
      return 'https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=' +
        app.encode('cantonidigitalstudio@gmail.com') +
        '&su=' + app.encode(subject) +
        '&body=' + app.encode(body);
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function persistDraft(form, storageKey) {
      if (!form || !storageKey) return;
      try {
        var data = {};
        new FormData(form).forEach(function (value, key) {
          data[key] = String(value || '');
        });
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {}
    }

    function restoreDraft(form, storageKey) {
      if (!form || !storageKey) return;
      try {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return;
        var data = JSON.parse(raw);
        Object.keys(data).forEach(function (key) {
          var field = form.elements.namedItem(key);
          if (field && typeof field.value !== 'undefined' && !field.value) field.value = data[key];
        });
      } catch (e) {}
    }

    function watchDraftPersistence(form, storageKey) {
      if (!form || !storageKey) return;
      restoreDraft(form, storageKey);
      form.addEventListener('input', function () { persistDraft(form, storageKey); });
      form.addEventListener('change', function () { persistDraft(form, storageKey); });
    }

    function clearDraft(storageKey) {
      try { localStorage.removeItem(storageKey); } catch (e) {}
    }

    function openLeadDraft(subject, body) {
      var gmailUrl = buildGmailComposeUrl(subject, body);
      var win = null;
      try { win = window.open(gmailUrl, '_blank', 'noopener,noreferrer'); } catch (e) {}
      if (win) return true;
      window.location.href = 'mailto:cantonidigitalstudio@gmail.com?subject=' + app.encode(subject) + '&body=' + app.encode(body);
      return false;
    }

    function getUrlParams() {
      try { return new URLSearchParams(window.location.search || ''); } catch (e) { return new URLSearchParams(); }
    }

    function getAttribution() {
      var params = getUrlParams();
      var utmSource = params.get('utm_source') || '';
      var utmMedium = params.get('utm_medium') || '';
      var utmCampaign = params.get('utm_campaign') || '';
      var fromBusinessCard = /business_card|biglietto/i.test(utmSource) ||
        /print|offline/i.test(utmMedium) ||
        /offline_intro|business_card/i.test(utmCampaign);

      return {
        source: fromBusinessCard ? 'business_card' : (utmSource || 'website'),
        utmSource: utmSource,
        utmMedium: utmMedium,
        utmCampaign: utmCampaign,
        fromBusinessCard: fromBusinessCard
      };
    }

    function applyAttribution(form) {
      if (!form || !form.elements) return;
      var attribution = getAttribution();
      var fields = {
        leadSource: attribution.source,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign
      };

      Object.keys(fields).forEach(function (key) {
        var field = form.elements.namedItem(key);
        if (field) field.value = fields[key] || '';
      });
    }

    function initBusinessCardEntry() {
      var entry = document.getElementById('businessCardEntry');
      if (!entry) return;
      if (!getAttribution().fromBusinessCard) return;
      entry.hidden = false;
      document.body.classList.add('has-business-card-entry');
    }

    function submitLeadWithJsonp(endpoint, payload) {
      return new Promise(function (resolve) {
        var callbackName = '__cdsLeadCallback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        var script = document.createElement('script');
        var cleanup = function (result) {
          try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
          if (script.parentNode) script.parentNode.removeChild(script);
          resolve(Boolean(result && result.ok));
        };
        var timeout = window.setTimeout(function () {
          cleanup({ ok: false });
        }, 12000);
        var params = new URLSearchParams();

        Object.keys(payload).forEach(function (key) {
          if (typeof payload[key] === 'undefined' || payload[key] === null) return;
          params.set(key, String(payload[key]));
        });

        params.set('action', 'lead');
        params.set('callback', callbackName);

        window[callbackName] = function (result) {
          window.clearTimeout(timeout);
          cleanup(result);
        };

        script.async = true;
        script.src = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + params.toString();
        script.onerror = function () {
          window.clearTimeout(timeout);
          cleanup({ ok: false });
        };
        document.body.appendChild(script);
      });
    }

    async function submitLead(payload) {
      var config = getSiteConfig();
      if (!config.leadCaptureEndpoint) return false;

      try {
        if (config.leadCaptureMode === 'google-apps-script') {
          return await submitLeadWithJsonp(config.leadCaptureEndpoint, payload);
        }

        var response = await fetch(config.leadCaptureEndpoint, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        return Boolean(response && response.ok);
      } catch (e) {
        return false;
      }
    }

    function serializeFormData(form) {
      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = String(value || '').trim();
      });
      return data;
    }

    function getFieldLabel(form, key) {
      if (!form || !form.elements || !form.elements.namedItem) return key;
      var field = form.elements.namedItem(key);
      if (!field || !field.closest) return key;
      var label = field.closest('label');
      if (!label) return key;
      var clone = label.cloneNode(true);
      clone.querySelectorAll('input, textarea, select').forEach(function (node) { node.remove(); });
      var text = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
      return text || key;
    }

    function buildLeadBody(form, data) {
      var lines = [];
      Object.keys(data).forEach(function (key) {
        if (!String(data[key]).trim()) return;
        lines.push(getFieldLabel(form, key) + ': ' + String(data[key]).trim());
      });
      return 'New request from Cantoni Digital Studio website\n\n' + lines.join('\n');
    }

    function buildLeadPayload(form, data) {
      var currencyEl = document.getElementById('fxCurrency');
      return {
        form_type: form.id === 'quoteForm' ? 'quote_request' : 'lead_request',
        page: (window.location.pathname || '').toLowerCase() || '/',
        language: document.documentElement.lang || 'en',
        currency: currencyEl ? currencyEl.value : 'EUR',
        business: data.business || data.company || '',
        company: data.company || '',
        contact: data.contact || '',
        email: data.email || '',
        website: data.website || '',
        market: data.market || data.country || '',
        country: data.country || '',
        sector: data.sector || '',
        projectType: data.projectType || '',
        budget: data.budget || '',
        timeline: data.timeline || '',
        goal: data.goal || '',
        materialsReady: data.materialsReady || '',
        assetsReady: data.assetsReady || '',
        instantEstimate: data.instantEstimate || '',
        estimateDetails: data.estimateDetails || '',
        termsAccepted: data.termsAccepted || '',
        privacyAccepted: data.privacyAccepted || '',
        leadSource: data.leadSource || '',
        utmSource: data.utmSource || '',
        utmMedium: data.utmMedium || '',
        utmCampaign: data.utmCampaign || '',
        source: data.leadSource || getAttribution().source || 'website',
        user_agent: navigator.userAgent || '',
        submitted_at: new Date().toISOString()
      };
    }

    function setNoteState(noteEl, text, mode) {
      if (!noteEl) return;
      noteEl.textContent = text || '';
      noteEl.classList.remove('is-success', 'is-warning');
      if (mode === 'success') noteEl.classList.add('is-success');
      if (mode === 'warning') noteEl.classList.add('is-warning');
    }

    function setSubmitState(form, dict, busy) {
      if (!form) return;
      var button = form.querySelector('button[type="submit"]');
      if (!button) return;
      if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
      button.disabled = Boolean(busy);
      button.setAttribute('aria-busy', busy ? 'true' : 'false');
      button.textContent = busy ? (dict.q_submitting || 'Sending request...') : button.dataset.originalText;
    }

    function getStatusPanel(form) {
      if (!form) return null;
      var targetId = form.getAttribute('data-status-target');
      return targetId ? document.getElementById(targetId) : null;
    }

    function renderStatusPanel(form, dict, mode, context) {
      var panel = getStatusPanel(form);
      if (!panel) return;

      if (mode === 'success') {
        panel.className = 'submission-panel is-success';
        panel.innerHTML =
          '<p class="tag">' + escapeHtml(dict.status_success_tag || 'Request stored') + '</p>' +
          '<h3>' + escapeHtml(dict.lead_saved || 'Request received. We will reply by email.') + '</h3>' +
          '<p>' + escapeHtml(dict.status_success_text || 'The brief has been captured in the studio flow. The next step is a manual site review and a written reply.') + '</p>' +
          '<ol class="process-list">' +
            '<li><strong>1.</strong><span>' + escapeHtml(dict.status_success_1 || 'Manual review of the live site and contact path') + '</span></li>' +
            '<li><strong>2.</strong><span>' + escapeHtml(dict.status_success_2 || 'Written direction with priorities and scope logic') + '</span></li>' +
            '<li><strong>3.</strong><span>' + escapeHtml(dict.status_success_3 || 'Reply from the same operating inbox') + '</span></li>' +
          '</ol>' +
          '<div class="footer-links footer-links-stack">' +
            '<a href="studio.html">' + escapeHtml(dict.q_ref_1 || 'Studio profile') + '</a>' +
            '<a href="https://www.instagram.com/cantonidigitalstudio/" target="_blank" rel="noreferrer">' + escapeHtml(dict.q_ref_3 || 'Instagram') + '</a>' +
            '<a href="https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/" target="_blank" rel="noreferrer">Facebook</a>' +
            '<a href="https://github.com/cantonidigitalstudio-a11y" target="_blank" rel="noreferrer">' + escapeHtml(dict.q_ref_4 || 'GitHub') + '</a>' +
          '</div>';
      } else if (mode === 'fallback') {
        var gmailUrl = buildGmailComposeUrl(context.subject, context.body);
        var mailtoUrl = 'mailto:cantonidigitalstudio@gmail.com?subject=' + app.encode(context.subject) + '&body=' + app.encode(context.body);
        panel.className = 'submission-panel is-fallback';
        panel.innerHTML =
          '<p class="tag">' + escapeHtml(dict.q_email_now || 'Email the studio') + '</p>' +
          '<h3>' + escapeHtml(dict.status_fallback_title || 'Direct submission is temporarily unavailable') + '</h3>' +
          '<p>' + escapeHtml(dict.status_fallback_text || 'The brief is still ready. Use the manual email path below so the project stays on the correct studio thread.') + '</p>' +
          '<div class="hero-actions">' +
            '<a class="btn btn-primary" href="' + gmailUrl + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(dict.status_fallback_cta_1 || 'Open email draft') + '</a>' +
            '<a class="btn btn-ghost" href="' + mailtoUrl + '">' + escapeHtml(dict.status_fallback_cta_2 || 'Write directly') + '</a>' +
          '</div>' +
          '<div class="footer-links footer-links-stack">' +
            '<a href="studio.html">' + escapeHtml(dict.q_ref_1 || 'Studio profile') + '</a>' +
            '<a href="case-studies.html">' + escapeHtml(dict.q_ref_2 || 'Case studies') + '</a>' +
          '</div>';
      } else {
        panel.innerHTML = '';
      }

      panel.hidden = false;
      try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    }

    function emitLeadEvent(mode, payload) {
      try {
        document.dispatchEvent(new CustomEvent('cds:lead-submit', {
          detail: {
            mode: mode,
            formType: payload && payload.form_type ? payload.form_type : '',
            page: payload && payload.page ? payload.page : '',
            projectType: payload && payload.projectType ? payload.projectType : '',
            market: payload && (payload.market || payload.country) ? (payload.market || payload.country) : ''
          }
        }));
      } catch (e) {}
    }

    function bindSubmit(form, noteEl, subject, successKey, storageKey) {
      if (!form || !noteEl) return;
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        var dict = i18nModule.getCurrentDict();
        var data = serializeFormData(form);
        var body = buildLeadBody(form, data);
        var payload = buildLeadPayload(form, data);
        var panel = getStatusPanel(form);

        persistDraft(form, storageKey);
        if (panel) {
          panel.hidden = true;
          panel.innerHTML = '';
        }
        setSubmitState(form, dict, true);
        if (await submitLead(payload)) {
          setNoteState(noteEl, dict.lead_saved || 'Request received. We will reply by email.', 'success');
          clearDraft(storageKey);
          form.reset();
          renderStatusPanel(form, dict, 'success', { subject: subject, body: body });
          emitLeadEvent('success', payload);
          setSubmitState(form, dict, false);
          return;
        }

        setNoteState(noteEl, dict[successKey] || dict.lead_saved_fallback || 'Manual email path ready below.', 'warning');
        renderStatusPanel(form, dict, 'fallback', { subject: subject, body: body });
        emitLeadEvent('fallback', payload);
        setSubmitState(form, dict, false);
      });
    }

    function init() {
      var leadForm = document.getElementById('leadForm');
      var quoteForm = document.getElementById('quoteForm');

      initBusinessCardEntry();
      watchDraftPersistence(leadForm, 'cds_draft_lead_form');
      watchDraftPersistence(quoteForm, 'cds_draft_quote_form');
      applyAttribution(leadForm);
      applyAttribution(quoteForm);
      bindSubmit(leadForm, document.getElementById('formNote'), 'Lead Website Request', 'open_email_data', 'cds_draft_lead_form');
      bindSubmit(quoteForm, document.getElementById('quoteNote'), 'Consultation / Package Request', 'open_email_quote', 'cds_draft_quote_form');
    }

    return {
      init: init
    };
  };
})();
