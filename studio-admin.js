(function () {
  var SECRET_STORAGE_KEY = 'cds_admin_secret_v1';

  function byId(id) {
    return document.getElementById(id);
  }

  function getConfig() {
    return window.CDS_CONFIG || {};
  }

  function getAnalyticsConfig() {
    return getConfig().analytics || {};
  }

  function getEndpoint() {
    return getAnalyticsConfig().endpoint || getConfig().leadCaptureEndpoint || '';
  }

  function getSummaryAction() {
    return (getConfig().studioAdmin && getConfig().studioAdmin.summaryAction) || 'admin_summary';
  }

  function readSecret() {
    try {
      return sessionStorage.getItem(SECRET_STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function saveSecret(value) {
    try {
      if (!value) sessionStorage.removeItem(SECRET_STORAGE_KEY);
      else sessionStorage.setItem(SECRET_STORAGE_KEY, value);
    } catch (e) {}
  }

  function setNote(id, text, mode) {
    var el = byId(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('is-success', 'is-warning');
    if (mode) el.classList.add(mode === 'success' ? 'is-success' : 'is-warning');
  }

  function jsonp(params) {
    return new Promise(function (resolve, reject) {
      var endpoint = getEndpoint();
      if (!endpoint) {
        reject(new Error('Missing analytics endpoint.'));
        return;
      }
      var callbackName = '__cdsAdminCallback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      var script = document.createElement('script');
      var timeout = setTimeout(function () {
        cleanup();
        reject(new Error('Admin summary timeout.'));
      }, 12000);

      function cleanup() {
        clearTimeout(timeout);
        try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (payload) {
        cleanup();
        resolve(payload);
      };

      var search = new URLSearchParams(params || {});
      search.set('callback', callbackName);
      script.async = true;
      script.src = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + search.toString();
      script.onerror = function () {
        cleanup();
        reject(new Error('Unable to load admin summary.'));
      };
      document.body.appendChild(script);
    });
  }

  function parseStoredEvents() {
    try {
      var key = getAnalyticsConfig().localBufferKey || 'cds_analytics_buffer_v1';
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  function bucketLastDays(days) {
    var out = [];
    var now = new Date();
    for (var i = days - 1; i >= 0; i -= 1) {
      var date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      out.push({
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        pageviews: 0,
        ctas: 0,
        leads: 0
      });
    }
    return out;
  }

  function tally(items, limit) {
    var arr = Object.keys(items).map(function (key) {
      return { label: key || 'Direct / unknown', value: items[key] };
    }).sort(function (a, b) {
      return b.value - a.value;
    });
    return arr.slice(0, limit || 6);
  }

  function humanizePaymentPath(value) {
    var normalized = String(value || '').trim();
    if (!normalized) return 'Stripe checkout';
    var map = {
      consultation_phase_1: 'Consultation phase 1',
      consultation_phase_2: 'Consultation phase 2',
      direct_package: 'Direct package',
      ecosystem_membership: 'Ecosystem membership'
    };
    if (map[normalized]) return map[normalized];
    return normalized.replace(/_/g, ' ').replace(/\b\w/g, function (char) { return char.toUpperCase(); });
  }

  function humanizePaymentState(value) {
    var normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return 'Unknown';
    var map = {
      started: 'Checkout started',
      completed: 'Pagamento confermato',
      cancelled: 'Checkout annullato'
    };
    return map[normalized] || normalized.replace(/_/g, ' ');
  }

  function buildLocalSummary() {
    var events = parseStoredEvents();
    var now = Date.now();
    var sevenDays = now - (7 * 24 * 60 * 60 * 1000);
    var fourteenDays = now - (14 * 24 * 60 * 60 * 1000);
    var thirtyDays = now - (30 * 24 * 60 * 60 * 1000);
    var recentEvents = [];
    var recentLeads = [];
    var sessions = {};
    var pages = {};
    var eventMap = {};
    var referrers = {};
    var paymentPaths = {};
    var paymentStates = {};
    var daily = bucketLastDays(14);
    var dailyIndex = {};
    daily.forEach(function (item) { dailyIndex[item.key] = item; });
    var pageviews7d = 0;
    var ctas7d = 0;
    var fallbacks7d = 0;
    var stripeStarts7d = 0;
    var leads30d = 0;
    var quoteRequests30d = 0;
    var paymentsCompleted30d = 0;
    var recentPayments = [];

    events.forEach(function (event) {
      var ts = Date.parse(event.occurred_at || '');
      if (!ts) return;
      var eventName = event.event_name || 'unknown';
      if (ts >= fourteenDays) {
        recentEvents.push(event);
        var key = new Date(ts).toISOString().slice(0, 10);
        if (dailyIndex[key]) {
          if (eventName === 'page_view') dailyIndex[key].pageviews += 1;
          if (eventName === 'cta_click' || eventName === 'stripe_checkout_started') dailyIndex[key].ctas += 1;
          if (eventName === 'lead_submit_success' || eventName === 'stripe_checkout_completed') dailyIndex[key].leads += 1;
        }
      }
      if (ts >= sevenDays) {
        if (eventName === 'page_view') {
          pageviews7d += 1;
          sessions[event.session_id || 'unknown'] = true;
          pages[event.path || '/'] = (pages[event.path || '/'] || 0) + 1;
          var ref = event.referrer || '';
          var refKey = ref ? ref.replace(/^https?:\/\//, '').split('/')[0] : 'Direct / unknown';
          referrers[refKey] = (referrers[refKey] || 0) + 1;
        }
        if (eventName === 'cta_click') ctas7d += 1;
        if (eventName === 'lead_submit_fallback') fallbacks7d += 1;
        if (eventName === 'stripe_checkout_started') stripeStarts7d += 1;
        eventMap[eventName] = (eventMap[eventName] || 0) + 1;
      }
      if (ts >= thirtyDays && (event.event_name === 'lead_submit_success' || event.event_name === 'lead_submit_fallback')) {
        if (event.event_name === 'lead_submit_success') leads30d += 1;
        if ((event.form_type || '') === 'quote') quoteRequests30d += 1;
        recentLeads.push({
          timestamp: event.occurred_at || '',
          business: event.project_type ? String(event.project_type) : 'Lead da browser locale',
          form_type: event.form_type || 'lead',
          email: 'n/d',
          status: event.event_name === 'lead_submit_success' ? 'captured' : 'fallback'
        });
      }

      if (ts >= thirtyDays && eventName.indexOf('stripe_checkout_') === 0) {
        var paymentPath = humanizePaymentPath(event.payment_path || event.event_label || '');
        var paymentState = humanizePaymentState(event.payment_state || eventName.replace('stripe_checkout_', ''));
        if (eventName === 'stripe_checkout_completed') paymentsCompleted30d += 1;
        paymentPaths[paymentPath] = (paymentPaths[paymentPath] || 0) + 1;
        paymentStates[paymentState] = (paymentStates[paymentState] || 0) + 1;
        recentPayments.push({
          occurred_at: event.occurred_at || '',
          payment_path: paymentPath,
          payment_mode: event.payment_mode || 'payment',
          payment_state: paymentState,
          checkout_session_id: event.checkout_session_id || ''
        });
      }
    });

    recentEvents.sort(function (a, b) {
      return Date.parse(b.occurred_at || '') - Date.parse(a.occurred_at || '');
    });
    recentLeads.sort(function (a, b) {
      return Date.parse(b.timestamp || '') - Date.parse(a.timestamp || '');
    });

    var normalizedRecentEvents = recentEvents.slice(0, 10).map(function (event) {
      return {
        occurred_at: formatDateTime(event.occurred_at),
        event_name: event.event_name || '',
        path: event.path || '',
        event_label: event.event_label || ''
      };
    });

    var normalizedRecentLeads = recentLeads.slice(0, 10).map(function (lead) {
      return {
        timestamp: formatDateTime(lead.timestamp),
        business: lead.business,
        form_type: lead.form_type,
        email: lead.email,
        status: lead.status
      };
    });

    var normalizedRecentPayments = recentPayments.sort(function (a, b) {
      return Date.parse(b.occurred_at || '') - Date.parse(a.occurred_at || '');
    }).slice(0, 10).map(function (item) {
      return {
        occurred_at: formatDateTime(item.occurred_at),
        payment_path: item.payment_path,
        payment_mode: item.payment_mode,
        payment_state: item.payment_state,
        checkout_session_id: item.checkout_session_id || 'n/d'
      };
    });

    return {
      ok: true,
      source: 'local_buffer',
      generated_at: new Date().toISOString(),
      kpis: {
        pageviews7d: pageviews7d,
        uniqueSessions7d: Object.keys(sessions).length,
        ctaClicks7d: ctas7d,
        stripeStarts7d: stripeStarts7d,
        leads30d: leads30d,
        quoteRequests30d: quoteRequests30d,
        paymentsCompleted30d: paymentsCompleted30d,
        fallbacks7d: fallbacks7d
      },
      charts: {
        daily: daily,
        topPages: tally(pages, 6),
        topEvents: tally(eventMap, 6),
        topReferrers: tally(referrers, 6),
        paymentPaths: tally(paymentPaths, 6),
        paymentStates: tally(paymentStates, 6)
      },
      recentLeads: normalizedRecentLeads,
      recentEvents: normalizedRecentEvents,
      recentPayments: normalizedRecentPayments
    };
  }

  function formatDateTime(value) {
    var ts = Date.parse(value || '');
    if (!ts) return value || '';
    return new Date(ts).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function maxValue(items, key) {
    return items.reduce(function (max, item) {
      return Math.max(max, Number(item[key] || 0));
    }, 0) || 1;
  }

  function renderBarList(targetId, items, emptyText) {
    var el = byId(targetId);
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<p class="admin-empty">' + emptyText + '</p>';
      return;
    }
    var max = maxValue(items, 'value');
    el.innerHTML = items.map(function (item) {
      var width = Math.max(8, Math.round((Number(item.value || 0) / max) * 100));
      return '<div class="admin-bar-row">' +
        '<div class="admin-bar-meta"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(String(item.value || 0)) + '</span></div>' +
        '<div class="admin-bar-track"><div class="admin-bar-fill" style="width:' + width + '%"></div></div>' +
      '</div>';
    }).join('');
  }

  function renderDailyChart(items) {
    var el = byId('dailyChart');
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<p class="admin-empty">Nessun dato giornaliero disponibile.</p>';
      return;
    }
    var max = 0;
    items.forEach(function (item) {
      max = Math.max(max, item.pageviews || 0, item.ctas || 0, item.leads || 0);
    });
    if (max <= 0) {
      el.innerHTML = '<p class="admin-empty">Nessuna attività registrata ancora negli ultimi 14 giorni.</p>';
      return;
    }
    el.innerHTML = items.map(function (item) {
      return '<div class="admin-daily-row">' +
        '<div class="admin-daily-label">' + escapeHtml(item.label) + '</div>' +
        '<div class="admin-daily-bars">' +
          '<span class="admin-daily-bar admin-daily-bar-page" style="width:' + Math.round(((item.pageviews || 0) / max) * 100) + '%"></span>' +
          '<span class="admin-daily-bar admin-daily-bar-cta" style="width:' + Math.round(((item.ctas || 0) / max) * 100) + '%"></span>' +
          '<span class="admin-daily-bar admin-daily-bar-lead" style="width:' + Math.round(((item.leads || 0) / max) * 100) + '%"></span>' +
        '</div>' +
        '<div class="admin-daily-values">' + escapeHtml([item.pageviews || 0, item.ctas || 0, item.leads || 0].join(' / ')) + '</div>' +
      '</div>';
    }).join('');
  }

  function renderTable(targetId, columns, rows, emptyText) {
    var el = byId(targetId);
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = '<p class="admin-empty">' + emptyText + '</p>';
      return;
    }
    var thead = '<thead><tr>' + columns.map(function (col) {
      return '<th>' + escapeHtml(col.label) + '</th>';
    }).join('') + '</tr></thead>';
    var tbody = '<tbody>' + rows.map(function (row) {
      return '<tr>' + columns.map(function (col) {
        return '<td>' + escapeHtml(String(row[col.key] || '')) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    el.innerHTML = '<div class="admin-table-wrap"><table class="admin-table">' + thead + tbody + '</table></div>';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function render(summary, statusText) {
    var kpis = summary.kpis || {};
    byId('kpiPageviews').textContent = String(kpis.pageviews7d || 0);
    byId('kpiSessions').textContent = String(kpis.uniqueSessions7d || 0);
    byId('kpiCtas').textContent = String(kpis.ctaClicks7d || 0);
    byId('kpiStripeStarts').textContent = String(kpis.stripeStarts7d || 0);
    byId('kpiLeads').textContent = String(kpis.leads30d || 0);
    byId('kpiQuotes').textContent = String(kpis.quoteRequests30d || 0);
    byId('kpiStripeCompleted').textContent = String(kpis.paymentsCompleted30d || 0);
    byId('kpiFallbacks').textContent = String(kpis.fallbacks7d || 0);

    renderDailyChart((summary.charts && summary.charts.daily) || []);
    renderBarList('topPages', (summary.charts && summary.charts.topPages) || [], 'Nessuna pagina ancora tracciata.');
    renderBarList('topEvents', (summary.charts && summary.charts.topEvents) || [], 'Nessun evento ancora tracciato.');
    renderBarList('topReferrers', (summary.charts && summary.charts.topReferrers) || [], 'Nessun referrer disponibile.');
    renderBarList('paymentPaths', (summary.charts && summary.charts.paymentPaths) || [], 'Nessun checkout Stripe tracciato ancora.');
    renderBarList('paymentStates', (summary.charts && summary.charts.paymentStates) || [], 'Nessuno stato pagamento disponibile.');

    renderTable('recentLeads', [
      { key: 'timestamp', label: 'Quando' },
      { key: 'business', label: 'Azienda' },
      { key: 'form_type', label: 'Form' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Stato' }
    ], summary.recentLeads || [], 'Nessun lead recente disponibile.');

    renderTable('recentEvents', [
      { key: 'occurred_at', label: 'Quando' },
      { key: 'event_name', label: 'Evento' },
      { key: 'path', label: 'Pagina' },
      { key: 'event_label', label: 'Label' }
    ], summary.recentEvents || [], 'Nessun evento recente disponibile.');

    renderTable('recentPayments', [
      { key: 'occurred_at', label: 'Quando' },
      { key: 'payment_path', label: 'Percorso' },
      { key: 'payment_mode', label: 'Modalità' },
      { key: 'payment_state', label: 'Stato' },
      { key: 'checkout_session_id', label: 'Sessione' }
    ], summary.recentPayments || [], 'Nessun pagamento o checkout recente disponibile.');

    byId('adminStatusText').textContent = statusText;
    byId('adminDataSource').textContent = summary.source === 'local_buffer' ? 'Fonte: buffer locale browser' : 'Fonte: Apps Script live';
    byId('adminLastUpdated').textContent = 'Aggiornato: ' + formatDateTime(summary.generated_at || new Date().toISOString());
  }

  async function loadSummary() {
    var secret = readSecret();
    if (!secret) {
      render(buildLocalSummary(), 'Vista locale browser attiva. Inserisci il secret admin per leggere il riepilogo completo da Apps Script.');
      return;
    }

    try {
      var payload = await jsonp({
        action: getSummaryAction(),
        secret: secret
      });
      if (!payload || !payload.ok) throw new Error(payload && payload.error ? payload.error : 'Unknown admin error');
      render(payload, 'Backend Apps Script connesso. Dati aggregati live caricati.');
      setNote('adminSecretNote', 'Secret valido. Dashboard completa attiva.', 'success');
    } catch (error) {
      render(buildLocalSummary(), 'Backend admin non raggiungibile o secret non valido. Vista locale browser attiva.');
      setNote('adminSecretNote', error.message || 'Secret non valido.', 'warning');
    }
  }

  function bindUi() {
    var secretInput = byId('adminSecretInput');
    if (secretInput) secretInput.value = readSecret();

    byId('adminSecretForm').addEventListener('submit', function (event) {
      event.preventDefault();
      saveSecret(secretInput.value.trim());
      loadSummary();
    });

    byId('adminClearSecret').addEventListener('click', function () {
      saveSecret('');
      if (secretInput) secretInput.value = '';
      setNote('adminSecretNote', 'Secret rimosso. Vista locale browser attiva.', 'warning');
      render(buildLocalSummary(), 'Vista locale browser attiva. Inserisci il secret admin per leggere il riepilogo completo da Apps Script.');
    });

    byId('adminRefreshButton').addEventListener('click', function () {
      loadSummary();
    });
  }

  bindUi();
  loadSummary();
})();
