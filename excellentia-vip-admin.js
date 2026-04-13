(function () {
  if (!document.body || !document.body.classList.contains('vip-admin')) {
    return;
  }

  var shared = window.ExcellentiaVipShared || null;
  var store = storage();
  var sessionStore = sessionStorageSafe();
  var LEDGER_STORAGE_KEY = shared && shared.storageKeys && shared.storageKeys.ledger ? shared.storageKeys.ledger : 'vip_booking_admin_ledger_v1';
  var SELECTED_STORAGE_KEY = 'vip_admin_selected_record_v1';
  var FILTER_STORAGE_KEY = 'vip_admin_filter_v1';
  var SEARCH_STORAGE_KEY = 'vip_admin_search_v1';
  var STATUS_OPTIONS = ['all', 'requested', 'quoted', 'confirmed', 'invoiced', 'paid', 'completed', 'cancelled'];
  var STATUS_LABELS = {
    all: 'All records',
    requested: 'Requested',
    quoted: 'Quoted',
    confirmed: 'Confirmed',
    invoiced: 'Invoiced',
    paid: 'Paid',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  var PAYMENT_LABELS = {
    pending: 'Payment pending',
    deposit: 'Deposit paid',
    paid: 'Paid in full',
    refunded: 'Refunded'
  };
  var INVOICE_LABELS = {
    not_issued: 'Not issued',
    drafted: 'Drafted',
    sent: 'Sent',
    paid: 'Paid'
  };
  var remoteConfig = bookingsConfig();
  var remoteRuntime = {
    message: '',
    state: remoteConfig.adminEndpoint ? 'idle' : 'disabled',
    diagnostics: null
  };

  var ledger = loadLedger();
  var activeFilter = persistedValue(FILTER_STORAGE_KEY, 'all');
  var searchTerm = persistedValue(SEARCH_STORAGE_KEY, '');
  var selectedId = persistedValue(SELECTED_STORAGE_KEY, ledger[0] ? ledger[0].id : '');

  function storage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function sessionStorageSafe() {
    try {
      return window.sessionStorage;
    } catch (error) {
      return null;
    }
  }

  function bookingsConfig() {
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipBookings ? window.CDS_CONFIG.vipBookings : {};
    return {
      adminEndpoint: String(raw.adminEndpoint || '').trim(),
      adminSessionStorageKey: String(raw.adminSessionStorageKey || 'vip_admin_api_key_v1').trim() || 'vip_admin_api_key_v1'
    };
  }

  function routingConfig() {
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipRouting ? window.CDS_CONFIG.vipRouting : {};
    return {
      ownerName: String(raw.ownerName || 'Excellentia VIP Reservations').trim() || 'Excellentia VIP Reservations',
      ownerEmail: String(raw.ownerEmail || '').trim(),
      ownerWhatsapp: String(raw.ownerWhatsapp || '').trim()
    };
  }

  function adminApiKey() {
    if (!sessionStore || !remoteConfig.adminSessionStorageKey) return '';
    return String(sessionStore.getItem(remoteConfig.adminSessionStorageKey) || '').trim();
  }

  function staffBearerToken() {
    if (!sessionStore) return '';
    try {
      var raw = JSON.parse(sessionStore.getItem('vip_customer_session_v1') || 'null');
      return raw && raw.accessToken ? String(raw.accessToken).trim() : '';
    } catch (error) {
      return '';
    }
  }

  function remoteHeaders(includeJson) {
    var headers = {};
    if (includeJson) headers['Content-Type'] = 'application/json';
    if (adminApiKey()) headers['x-vip-admin-key'] = adminApiKey();
    if (staffBearerToken()) headers.Authorization = 'Bearer ' + staffBearerToken();
    return headers;
  }

  function saveAdminApiKey(value) {
    if (!sessionStore || !remoteConfig.adminSessionStorageKey) return;
    var trimmed = String(value || '').trim();
    if (!trimmed) {
      sessionStore.removeItem(remoteConfig.adminSessionStorageKey);
      return;
    }
    sessionStore.setItem(remoteConfig.adminSessionStorageKey, trimmed);
  }

  function renderRemoteAccess() {
    var input = byId('adminApiKeyInput');
    var status = byId('adminApiKeyStatus');
    if (!status) return;

    if (input) {
      input.value = '';
    }

    if (!remoteConfig.adminEndpoint) {
      status.textContent = 'Shared cloud ledger endpoint is not configured for this build yet.';
      return;
    }

    if (!adminApiKey() && !staffBearerToken()) {
      status.textContent = 'No staff session detected yet. Sign in with the staff account or load the emergency admin key only if fallback is enabled.';
      return;
    }

    if (remoteRuntime.message) {
      status.textContent = remoteRuntime.message;
      return;
    }

    status.textContent = adminApiKey()
      ? 'Emergency admin key is loaded in this browser session.'
      : 'Shared cloud ledger will use the authenticated staff session in this browser.';
  }

  function canUseRemoteLedger() {
    return Boolean(remoteConfig.adminEndpoint && (adminApiKey() || staffBearerToken()));
  }

  function setRemoteState(state, message) {
    remoteRuntime.state = state;
    remoteRuntime.message = message || '';
  }

  async function remoteRequest(method, body) {
    var response = await fetch(remoteConfig.adminEndpoint, {
      method: method,
      headers: remoteHeaders(true),
      body: body == null ? undefined : JSON.stringify(body)
    });
    var result = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      var error = new Error(result.error || 'Cloud ledger request failed.');
      error.payload = result;
      throw error;
    }
    return result;
  }

  function persistedValue(key, fallback) {
    if (!store) return fallback;
    return store.getItem(key) || fallback;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function compactText(value, max) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!max || text.length <= max) {
      return text;
    }
    return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  }

  function money(value, currency) {
    var resolvedCurrency = String(currency || 'USD').toUpperCase() === 'USD' ? 'USD' : 'USD';
    if (shared && shared.formatMoney) {
      return shared.formatMoney(value, resolvedCurrency);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: resolvedCurrency,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function toNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function statusLabel(value) {
    return STATUS_LABELS[value] || STATUS_LABELS.requested;
  }

  function paymentLabel(value) {
    return PAYMENT_LABELS[value] || PAYMENT_LABELS.pending;
  }

  function invoiceLabel(value) {
    return INVOICE_LABELS[value] || INVOICE_LABELS.not_issued;
  }

  function statusClass(value) {
    return 'status-pill status-pill-' + String(value || 'muted').replace(/[^a-z]/g, '');
  }

  function readinessClass(value) {
    if (value === 'ready') return statusClass('ready');
    if (value === 'partial') return statusClass('partial');
    if (value === 'missing') return statusClass('missing');
    if (value === 'pending') return statusClass('pending');
    return statusClass('muted');
  }

  function readinessLabel(value) {
    if (value === 'ready') return 'Ready';
    if (value === 'partial') return 'Partial';
    if (value === 'missing') return 'Missing';
    if (value === 'pending') return 'Checking';
    return 'Waiting';
  }

  function todayStamp() {
    var now = new Date();
    var yy = String(now.getFullYear()).slice(-2);
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    var dd = String(now.getDate()).padStart(2, '0');
    return yy + mm + dd;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function generateId() {
    return 'vip-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8);
  }

  function nextBookingCode() {
    var stamp = todayStamp();
    var count = ledger.filter(function (record) {
      return String(record.code || '').indexOf('EV-' + stamp + '-') === 0;
    }).length + 1;
    return 'EV-' + stamp + '-' + String(count).padStart(3, '0');
  }

  function defaultRecord() {
    var now = nowIso();
    return {
      id: generateId(),
      code: nextBookingCode(),
      createdAt: now,
      updatedAt: now,
      source: 'Manual desk record',
      requestChannel: 'desk',
      leadName: '',
      country: '',
      guestEmail: '',
      guestWhatsapp: '',
      pickupDate: '',
      pickupTime: '',
      pickupPoint: '',
      reference: '',
      requestMode: 'Ask first',
      serviceLabel: 'Manual request',
      status: 'requested',
      paymentStatus: 'pending',
      invoiceStatus: 'not_issued',
      invoiceRef: '',
      estimatedTotal: 0,
      invoiceAmount: 0,
      depositAmount: 0,
      paidAmount: 0,
      currency: 'USD',
      operatorName: '',
      operatorEmail: '',
      operatorWhatsapp: '',
      clientEmailSent: false,
      clientWhatsappSent: false,
      operatorEmailSent: false,
      operatorWhatsappSent: false,
      paymentProvider: '',
      paymentReference: '',
      internalNotes: '',
      metadata: {},
      items: [],
      events: []
    };
  }

  function normalizeEvent(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var payload = raw.payload && typeof raw.payload === 'object' && !Array.isArray(raw.payload)
      ? raw.payload
      : {};
    return {
      id: raw.id == null ? generateId() : String(raw.id),
      type: compactText(raw.type || raw.eventType || 'booking_event', 64),
      payload: payload,
      createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : nowIso()
    };
  }

  function appendLocalEvent(record, type, payload) {
    var event = normalizeEvent({
      id: generateId(),
      type: type,
      payload: payload || {},
      createdAt: nowIso()
    });
    record.events = [event].concat(Array.isArray(record.events) ? record.events.map(normalizeEvent).filter(Boolean) : []);
    return record;
  }

  function normalizeRecord(raw) {
    var base = defaultRecord();
    var record = raw && typeof raw === 'object' ? raw : {};
    return {
      id: typeof record.id === 'string' && record.id ? record.id : base.id,
      code: typeof record.code === 'string' && record.code ? record.code : base.code,
      createdAt: typeof record.createdAt === 'string' && record.createdAt ? record.createdAt : base.createdAt,
      updatedAt: typeof record.updatedAt === 'string' && record.updatedAt ? record.updatedAt : base.updatedAt,
      source: compactText(record.source || base.source, 80),
      requestChannel: compactText(record.requestChannel || base.requestChannel, 32),
      leadName: compactText(record.leadName || '', 80),
      country: compactText(record.country || '', 64),
      guestEmail: compactText(record.guestEmail || '', 120),
      guestWhatsapp: compactText(record.guestWhatsapp || '', 40),
      pickupDate: /^\d{4}-\d{2}-\d{2}$/.test(record.pickupDate || '') ? record.pickupDate : '',
      pickupTime: /^\d{2}:\d{2}$/.test(record.pickupTime || '') ? record.pickupTime : '',
      pickupPoint: compactText(record.pickupPoint || '', 120),
      reference: compactText(record.reference || '', 120),
      requestMode: compactText(record.requestMode || base.requestMode, 48),
      serviceLabel: compactText(record.serviceLabel || base.serviceLabel, 80),
      status: STATUS_LABELS[record.status] ? record.status : base.status,
      paymentStatus: PAYMENT_LABELS[record.paymentStatus] ? record.paymentStatus : base.paymentStatus,
      invoiceStatus: INVOICE_LABELS[record.invoiceStatus] ? record.invoiceStatus : base.invoiceStatus,
      invoiceRef: compactText(record.invoiceRef || '', 48),
      estimatedTotal: Math.max(0, Math.round(toNumber(record.estimatedTotal))),
      invoiceAmount: Math.max(0, Math.round(toNumber(record.invoiceAmount))),
      depositAmount: Math.max(0, Math.round(toNumber(record.depositAmount))),
      paidAmount: Math.max(0, Math.round(toNumber(record.paidAmount))),
      currency: record.currency === 'USD' ? 'USD' : 'USD',
      operatorName: compactText(record.operatorName || '', 80),
      operatorEmail: compactText(record.operatorEmail || '', 120),
      operatorWhatsapp: compactText(record.operatorWhatsapp || '', 40),
      clientEmailSent: Boolean(record.clientEmailSent),
      clientWhatsappSent: Boolean(record.clientWhatsappSent),
      operatorEmailSent: Boolean(record.operatorEmailSent),
      operatorWhatsappSent: Boolean(record.operatorWhatsappSent),
      paymentProvider: compactText(record.paymentProvider || '', 32),
      paymentReference: compactText(record.paymentReference || '', 120),
      internalNotes: compactText(record.internalNotes || '', 600),
      metadata: record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata) ? record.metadata : {},
      items: Array.isArray(record.items) ? record.items.map(normalizeItem).filter(Boolean) : [],
      events: Array.isArray(record.events)
        ? record.events.map(normalizeEvent).filter(Boolean).sort(function (left, right) {
            return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
          })
        : []
    };
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
      serviceLabel: compactText(raw.serviceLabel || 'Service', 80),
      routeLabel: compactText(raw.routeLabel || '', 120),
      vehicleLabel: compactText(raw.vehicleLabel || '', 80),
      packageLabel: compactText(raw.packageLabel || '', 80),
      guests: Math.max(1, Math.min(16, Math.round(toNumber(raw.guests) || 1))),
      timingLabel: compactText(raw.timingLabel || '', 64),
      requestMode: compactText(raw.requestMode || '', 32),
      extras: Array.isArray(raw.extras) ? raw.extras.map(function (entry) { return compactText(entry, 48); }).filter(Boolean) : [],
      notes: compactText(raw.notes || '', 180),
      total: Math.max(0, Math.round(toNumber(raw.total)))
    };
  }

  function loadLedger() {
    if (!store) return [];
    try {
      var raw = JSON.parse(store.getItem(LEDGER_STORAGE_KEY) || '[]');
      return Array.isArray(raw) ? raw.map(normalizeRecord) : [];
    } catch (error) {
      store.removeItem(LEDGER_STORAGE_KEY);
      return [];
    }
  }

  function persistLedger() {
    if (!store) return;
    store.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledger));
  }

  function persistUiState() {
    if (!store) return;
    store.setItem(FILTER_STORAGE_KEY, activeFilter);
    store.setItem(SEARCH_STORAGE_KEY, searchTerm);
    if (selectedId) {
      store.setItem(SELECTED_STORAGE_KEY, selectedId);
    } else {
      store.removeItem(SELECTED_STORAGE_KEY);
    }
  }

  function currentCartSnapshot() {
    if (!shared || !shared.loadStoredCart) {
      return { cart: [], intake: {} };
    }
    return {
      cart: shared.loadStoredCart(),
      intake: shared.loadStoredIntake ? shared.loadStoredIntake() : {}
    };
  }

  function requestModeLabelFor(serviceId) {
    if (!shared || !shared.requestModeKey) return 'Ask first';
    return shared.requestModeKey(serviceId) === 'bookNow' ? 'Book now' : 'Ask first';
  }

  function createRecordFromCurrentItinerary() {
    var snapshot = currentCartSnapshot();
    var cart = snapshot.cart || [];
    var intake = snapshot.intake || {};
    var lang = shared && shared.currentLang ? shared.currentLang() : 'en';
    if (!cart.length || !shared || !shared.summarizeItem) {
      return null;
    }

    var record = defaultRecord();
    var items = cart.map(function (item) {
      var view = shared.summarizeItem(item, lang);
      if (!view) return null;
      return normalizeItem({
        serviceLabel: view.title,
        routeLabel: view.route,
        vehicleLabel: view.vehicle,
        packageLabel: view.packageLabel,
        guests: view.guests,
        timingLabel: view.timing,
        requestMode: requestModeLabelFor(item.serviceId),
        extras: view.extras,
        notes: view.notes,
        total: view.total
      });
    }).filter(Boolean);

    var total = items.reduce(function (sum, item) { return sum + item.total; }, 0);
    var summary = items[0] || null;
    var createdAt = nowIso();

    record.code = nextBookingCode();
    record.createdAt = createdAt;
    record.updatedAt = createdAt;
    record.source = 'Website booking configurator';
    record.leadName = compactText(intake.leadName || '', 80);
    record.country = compactText(intake.country || '', 64);
    record.guestEmail = compactText(intake.email || '', 120);
    record.guestWhatsapp = compactText(intake.whatsapp || '', 40);
    record.pickupDate = /^\d{4}-\d{2}-\d{2}$/.test(intake.date || '') ? intake.date : '';
    record.pickupTime = /^\d{2}:\d{2}$/.test(intake.time || '') ? intake.time : '';
    record.pickupPoint = compactText(intake.pickupPoint || '', 120);
    record.reference = compactText(intake.reference || '', 120);
    record.requestMode = items.length === 1 && summary ? summary.requestMode : 'Mixed itinerary';
    record.serviceLabel = items.length === 1 && summary ? summary.serviceLabel : cart.length + '-item itinerary';
    record.status = 'requested';
    record.paymentStatus = 'pending';
    record.invoiceStatus = 'not_issued';
    record.invoiceAmount = total;
    record.estimatedTotal = total;
    record.items = items;
    record.events = [{
      id: generateId(),
      type: 'browser_itinerary_imported',
      payload: {
        source: 'Website booking configurator',
        items: String(items.length),
        estimatedTotal: String(total)
      },
      createdAt: createdAt
    }];
    return normalizeRecord(record);
  }

  function filteredLedger() {
    var term = searchTerm.trim().toLowerCase();
    return ledger.filter(function (record) {
      if (activeFilter !== 'all' && record.status !== activeFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      var haystack = [
        record.code,
        record.leadName,
        record.country,
        record.reference,
        record.pickupPoint,
        record.serviceLabel,
        record.operatorName,
        record.invoiceRef
      ].join(' ').toLowerCase();
      return haystack.indexOf(term) !== -1;
    });
  }

  function selectedRecord() {
    return ledger.find(function (record) { return record.id === selectedId; }) || null;
  }

  function ensureSelection() {
    if (!selectedRecord()) {
      selectedId = ledger[0] ? ledger[0].id : '';
    }
    persistUiState();
  }

  async function updateRecord(record) {
    record.updatedAt = nowIso();
    var normalized = normalizeRecord(record);

    if (canUseRemoteLedger()) {
      try {
        setRemoteState('pending', 'Saving changes to shared cloud ledger…');
        var result = await remoteRequest('PATCH', { record: normalized });
        if (!result.record) {
          throw new Error('Cloud ledger did not return the updated record.');
        }
        normalized = normalizeRecord(result.record);
        setRemoteState('success', 'Shared cloud ledger active.');
      } catch (error) {
        setRemoteState('warning', 'Cloud ledger update failed. The previous server record is unchanged.');
        renderAll();
        return;
      }
    }

    normalized = appendLocalEvent(normalized, 'admin_record_updated', {
      status: normalized.status,
      paymentStatus: normalized.paymentStatus,
      invoiceStatus: normalized.invoiceStatus
    });
    ledger = ledger.map(function (entry) {
      return entry.id === normalized.id ? normalized : entry;
    });
    persistLedger();
    ensureSelection();
    renderAll();
  }

  async function addRecord(record) {
    var normalized = normalizeRecord(record);

    if (canUseRemoteLedger()) {
      try {
        setRemoteState('pending', 'Saving new record to shared cloud ledger…');
        var result = await remoteRequest('POST', { record: normalized });
        if (!result.record) {
          throw new Error('Cloud ledger did not return the created record.');
        }
        normalized = normalizeRecord(result.record);
        setRemoteState('success', 'Shared cloud ledger active.');
      } catch (error) {
        setRemoteState('warning', 'Cloud ledger create failed. The record was not added server-side.');
        renderAll();
        return;
      }
    }

    if (!normalized.events.length) {
      normalized = appendLocalEvent(normalized, 'admin_record_created', {
        source: normalized.source,
        status: normalized.status
      });
    }
    ledger.unshift(normalized);
    selectedId = normalized.id;
    persistLedger();
    persistUiState();
    renderAll();
  }

  async function deleteSelectedRecord() {
    if (!selectedId) return;

    if (canUseRemoteLedger()) {
      try {
        setRemoteState('pending', 'Deleting record from shared cloud ledger…');
        var deleteUrl = remoteConfig.adminEndpoint + '?id=' + encodeURIComponent(selectedId);
        var response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: remoteHeaders(false)
        });
        var result = await response.json().catch(function () { return {}; });
        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'Delete failed.');
        }
        setRemoteState('success', 'Shared cloud ledger active.');
      } catch (error) {
        setRemoteState('warning', 'Cloud ledger delete failed. The server record is unchanged.');
        renderAll();
        return;
      }
    }

    ledger = ledger.filter(function (record) { return record.id !== selectedId; });
    selectedId = ledger[0] ? ledger[0].id : '';
    persistLedger();
    persistUiState();
    renderAll();
  }

  async function duplicateSelectedRecord() {
    var record = selectedRecord();
    if (!record) return;
    var duplicated = normalizeRecord(Object.assign({}, record, {
      id: generateId(),
      code: nextBookingCode(),
      status: 'requested',
      paymentStatus: 'pending',
      invoiceStatus: 'not_issued',
      invoiceRef: '',
      clientEmailSent: false,
      clientWhatsappSent: false,
      operatorEmailSent: false,
      operatorWhatsappSent: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      events: [{
        id: generateId(),
        type: 'record_duplicated',
        payload: {
          fromCode: record.code
        },
        createdAt: nowIso()
      }]
    }));
    await addRecord(duplicated);
  }

  function recordMetaLabel(record) {
    var bits = [];
    if (record.country) bits.push(record.country);
    if (record.pickupDate) bits.push(record.pickupDate);
    if (record.pickupTime) bits.push(record.pickupTime);
    if (record.items.length) bits.push(record.items.length + (record.items.length === 1 ? ' item' : ' items'));
    return bits.join(' · ') || 'No travel timing yet';
  }

  function primaryRoute(record) {
    if (!record.items.length) {
      return record.pickupPoint || 'No itinerary items yet';
    }
    return compactText(record.items.map(function (item) { return item.routeLabel || item.serviceLabel; }).join(' • '), 130);
  }

  function renderKpis() {
    var openCount = ledger.filter(function (record) {
      return ['requested', 'quoted', 'confirmed', 'invoiced'].indexOf(record.status) !== -1;
    }).length;
    var awaitingCount = ledger.filter(function (record) {
      return ['confirmed', 'invoiced', 'paid'].indexOf(record.status) !== -1 && record.paymentStatus !== 'paid';
    }).length;
    var revenue = ledger.reduce(function (sum, record) { return sum + record.estimatedTotal; }, 0);
    byId('adminKpiTotal').textContent = String(ledger.length);
    byId('adminKpiOpen').textContent = String(openCount);
    byId('adminKpiAwaiting').textContent = String(awaitingCount);
    byId('adminKpiRevenue').textContent = money(revenue);
  }

  function parseRecordDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    var parts = String(value).split('-');
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addDays(date, amount) {
    var clone = new Date(date.getTime());
    clone.setDate(clone.getDate() + amount);
    return clone;
  }

  function isOpenRecord(record) {
    return ['completed', 'cancelled'].indexOf(record.status) === -1;
  }

  function recordNeedsCoreDetails(record) {
    return !record.leadName || !record.guestEmail || !record.pickupDate || !record.pickupPoint;
  }

  function recordNeedsOperator(record) {
    return !record.operatorName && !record.operatorEmail && !record.operatorWhatsapp;
  }

  function recordNeedsDispatch(record) {
    if (['confirmed', 'invoiced', 'paid'].indexOf(record.status) === -1) return false;
    return !record.clientEmailSent || !record.clientWhatsappSent || !record.operatorEmailSent || !record.operatorWhatsappSent;
  }

  function renderPriorityBoard() {
    var grid = byId('adminPriorityGrid');
    if (!grid) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var inTwoDays = addDays(today, 2);

    var arrivalsSoon = ledger.filter(function (record) {
      var date = parseRecordDate(record.pickupDate);
      return Boolean(date) && isOpenRecord(record) && date >= today && date <= inTwoDays;
    }).length;
    var missingCore = ledger.filter(function (record) {
      return isOpenRecord(record) && recordNeedsCoreDetails(record);
    }).length;
    var unassigned = ledger.filter(function (record) {
      return isOpenRecord(record) && recordNeedsOperator(record);
    }).length;
    var dispatchPending = ledger.filter(function (record) {
      return isOpenRecord(record) && recordNeedsDispatch(record);
    }).length;

    var cards = [
      {
        label: 'Next 48 hours',
        value: String(arrivalsSoon),
        detail: 'Open records with a service date landing today or within the next two days.'
      },
      {
        label: 'Missing core details',
        value: String(missingCore),
        detail: 'Records still missing lead, email, date or pickup context and likely to create follow-up friction.'
      },
      {
        label: 'Unassigned operator',
        value: String(unassigned),
        detail: 'Open records without a coordinator, driver or host attached yet.'
      },
      {
        label: 'Dispatch still pending',
        value: String(dispatchPending),
        detail: 'Confirmed, invoiced or paid records where client or operator notifications are still not fully marked.'
      }
    ];

    grid.innerHTML = cards.map(function (card) {
      return '<article class="admin-priority-card">' +
        '<span>' + escapeHtml(card.label) + '</span>' +
        '<strong>' + escapeHtml(card.value) + '</strong>' +
        '<p>' + escapeHtml(card.detail) + '</p>' +
      '</article>';
    }).join('');
  }

  function renderStageNote() {
    var snapshot = currentCartSnapshot();
    var cart = snapshot.cart || [];
    var intake = snapshot.intake || {};
    var note = 'No staged browser itinerary detected yet.';
    if (cart.length) {
      note = 'Current browser cart ready: ' + cart.length + (cart.length === 1 ? ' item' : ' items');
      if (intake.leadName) {
        note += ' for ' + intake.leadName;
      }
      if (intake.date) {
        note += ' on ' + intake.date;
      }
      note += '.';
    }
    var syncNote = cart.length ? note + ' Importing does not clear the cart.' : note;

    if (remoteConfig.adminEndpoint && !canUseRemoteLedger()) {
      syncNote += ' Shared cloud ledger is configured but this browser still has no staff session and no emergency key fallback loaded.';
    } else if (remoteRuntime.message) {
      syncNote += ' ' + remoteRuntime.message;
    }

    byId('adminStageNote').textContent = note;
    byId('adminSyncNote').textContent = syncNote;
  }

  function renderFilters() {
    var visible = filteredLedger();
    byId('adminFilterChips').innerHTML = STATUS_OPTIONS.map(function (status) {
      var count = status === 'all'
        ? ledger.length
        : ledger.filter(function (record) { return record.status === status; }).length;
      return '<button type="button" class="choice-chip admin-filter-chip' + (activeFilter === status ? ' is-active' : '') + '" data-filter-status="' + status + '">' +
        '<span class="choice-copy">' +
          '<span class="choice-kicker">Status</span>' +
          '<strong>' + escapeHtml(statusLabel(status)) + '</strong>' +
          '<span>' + count + ' visible records</span>' +
        '</span>' +
      '</button>';
    }).join('');

    byId('adminVisibleCount').textContent = String(visible.length);
    byId('adminLedgerTitle').textContent = visible.length ? statusLabel(activeFilter) + ' ledger view' : 'No records match the current filters';
    byId('adminSearch').value = searchTerm;
  }

  function renderLedgerList() {
    var visible = filteredLedger();
    var ledgerList = byId('adminLedgerList');
    if (!visible.length) {
      ledgerList.innerHTML = '<article class="cart-item cart-item-empty"><strong>No booking records visible</strong><p>Import the current itinerary, create a manual record, or clear the current filters.</p></article>';
      return;
    }

    ledgerList.innerHTML = visible.map(function (record) {
      return '<article class="admin-record' + (record.id === selectedId ? ' is-active' : '') + '">' +
        '<button class="admin-record-hit" type="button" data-select-record="' + record.id + '">' +
          '<div class="admin-record-head">' +
            '<div>' +
              '<span class="mini-label">' + escapeHtml(record.code) + '</span>' +
              '<strong>' + escapeHtml(record.leadName || 'Unnamed lead') + '</strong>' +
            '</div>' +
            '<div class="admin-record-pills">' +
              '<span class="' + statusClass(record.status) + '">' + escapeHtml(statusLabel(record.status)) + '</span>' +
              '<span class="' + statusClass(record.paymentStatus) + '">' + escapeHtml(paymentLabel(record.paymentStatus)) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="admin-record-meta">' +
            '<span>' + escapeHtml(recordMetaLabel(record)) + '</span>' +
            '<strong>' + money(record.estimatedTotal) + '</strong>' +
          '</div>' +
          '<p>' + escapeHtml(primaryRoute(record)) + '</p>' +
        '</button>' +
      '</article>';
    }).join('');
  }

  function populateField(id, value) {
    var input = byId(id);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = Boolean(value);
      return;
    }
    input.value = value == null ? '' : String(value);
  }

  function renderItems(record) {
    var title = byId('adminItemsTitle');
    var list = byId('adminItemsList');
    var total = byId('adminEstimatedTotalValue');
    if (!record.items.length) {
      title.textContent = 'No itinerary items attached yet';
      list.innerHTML = '<article class="cart-item cart-item-empty"><strong>No imported itinerary yet</strong><p>This record can still be used manually for quotes, invoice refs and operator follow-up.</p></article>';
      total.textContent = money(record.estimatedTotal);
      return;
    }

    title.textContent = record.items.length === 1 ? '1 itinerary item' : record.items.length + ' itinerary items';
    total.textContent = money(record.estimatedTotal);
    list.innerHTML = record.items.map(function (item, index) {
      var extrasLine = item.extras.length ? '<p><strong>Add-ons:</strong> ' + escapeHtml(item.extras.join(', ')) + '</p>' : '';
      var notesLine = item.notes ? '<p><strong>Notes:</strong> ' + escapeHtml(item.notes) + '</p>' : '';
      return '<article class="cart-item">' +
        '<div class="cart-item-head">' +
          '<div><span class="cart-item-index">Item ' + (index + 1) + '</span><h4>' + escapeHtml(item.serviceLabel) + '</h4></div>' +
          '<strong>' + money(item.total) + '</strong>' +
        '</div>' +
        '<p><strong>Route:</strong> ' + escapeHtml(item.routeLabel || 'Not set') + '</p>' +
        '<p><strong>Vehicle:</strong> ' + escapeHtml(item.vehicleLabel || 'Not set') + ' · <strong>Package:</strong> ' + escapeHtml(item.packageLabel || 'Not set') + '</p>' +
        '<p><strong>Guests:</strong> ' + item.guests + ' · <strong>Timing:</strong> ' + escapeHtml(item.timingLabel || 'Not set') + '</p>' +
        extrasLine +
        notesLine +
      '</article>';
    }).join('');
  }

  function eventTypeLabel(type) {
    var map = {
      booking_captured: 'Booking captured',
      booking_capture_notifications: 'Capture notifications',
      admin_record_created: 'Admin record created',
      admin_record_updated: 'Admin record updated',
      stripe_payment_completed: 'Stripe payment completed',
      browser_itinerary_imported: 'Browser itinerary imported',
      record_duplicated: 'Record duplicated'
    };
    return map[type] || compactText(String(type || 'booking_event').replace(/_/g, ' '), 80);
  }

  function formatEventTime(value) {
    if (!value) return 'Time unavailable';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return compactText(value, 40);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function eventSummary(event, record) {
    var payload = event.payload || {};
    if (event.type === 'booking_captured') {
      return [
        payload.requestChannel ? 'Channel: ' + payload.requestChannel : '',
        payload.items ? 'Items: ' + payload.items : '',
        payload.estimatedTotal ? 'Value: ' + money(payload.estimatedTotal) : ''
      ].filter(Boolean).join(' · ');
    }
    if (event.type === 'booking_capture_notifications') {
      return [
        payload.clientEmail ? 'Client email: ' + payload.clientEmail : '',
        payload.clientWhatsApp ? 'Client WhatsApp: ' + payload.clientWhatsApp : '',
        payload.ownerEmail ? 'Owner email: ' + payload.ownerEmail : '',
        payload.ownerWhatsApp ? 'Owner WhatsApp: ' + payload.ownerWhatsApp : ''
      ].filter(Boolean).join(' · ');
    }
    if (event.type === 'admin_record_created') {
      return [
        payload.source ? 'Source: ' + payload.source : '',
        payload.status ? 'Status: ' + statusLabel(payload.status) : ''
      ].filter(Boolean).join(' · ');
    }
    if (event.type === 'admin_record_updated') {
      return [
        payload.status ? 'Status: ' + statusLabel(payload.status) : '',
        payload.paymentStatus ? 'Payment: ' + paymentLabel(payload.paymentStatus) : '',
        payload.invoiceStatus ? 'Invoice: ' + invoiceLabel(payload.invoiceStatus) : ''
      ].filter(Boolean).join(' · ');
    }
    if (event.type === 'stripe_payment_completed') {
      var paidAmount = payload.totalAmount || payload.amount;
      return [
        payload.paymentKind ? 'Kind: ' + payload.paymentKind : '',
        paidAmount ? 'Paid: ' + money(paidAmount, record && record.currency ? record.currency : 'USD') : '',
        payload.sessionId ? 'Session: ' + compactText(payload.sessionId, 28) : ''
      ].filter(Boolean).join(' · ');
    }
    if (event.type === 'browser_itinerary_imported') {
      return [
        payload.items ? 'Items: ' + payload.items : '',
        payload.estimatedTotal ? 'Value: ' + money(payload.estimatedTotal) : ''
      ].filter(Boolean).join(' · ');
    }
    if (event.type === 'record_duplicated') {
      return payload.fromCode ? 'Duplicated from ' + payload.fromCode : 'A local copy was created.';
    }

    var generic = Object.keys(payload).slice(0, 4).map(function (key) {
      return key + ': ' + payload[key];
    });
    return generic.join(' · ') || 'No additional payload attached.';
  }

  function renderEvents(record) {
    var title = byId('adminEventsTitle');
    var count = byId('adminEventsCount');
    var list = byId('adminEventsList');
    if (!title || !count || !list) return;

    var events = Array.isArray(record.events) ? record.events : [];
    count.textContent = String(events.length);

    if (!events.length) {
      title.textContent = 'No activity logged yet';
      list.innerHTML = '<article class="cart-item cart-item-empty"><strong>No timeline entries yet</strong><p>This record will start showing capture, payment and admin events here as the shared ledger gets used.</p></article>';
      return;
    }

    title.textContent = events.length === 1 ? '1 activity entry' : events.length + ' activity entries';
    list.innerHTML = events.map(function (event) {
      return '<article class="admin-event-card">' +
        '<div class="admin-event-head">' +
          '<div>' +
            '<span class="mini-label">' + escapeHtml(formatEventTime(event.createdAt)) + '</span>' +
            '<strong>' + escapeHtml(eventTypeLabel(event.type)) + '</strong>' +
          '</div>' +
          '<span class="' + statusClass('muted') + '">' + escapeHtml(compactText(event.type, 32)) + '</span>' +
        '</div>' +
        '<p>' + escapeHtml(eventSummary(event, record)) + '</p>' +
      '</article>';
    }).join('');
  }

  function renderDetail() {
    var record = selectedRecord();
    var empty = byId('adminDetailEmpty');
    var form = byId('adminDetailForm');
    var contactRail = byId('adminContactRail');
    if (!record) {
      empty.hidden = false;
      form.hidden = true;
      if (contactRail) {
        contactRail.hidden = true;
      }
      byId('adminDetailTitle').textContent = 'Select or create a booking record';
      byId('adminDetailLead').textContent = 'The selected record keeps guest data, itinerary items, invoice fields and operator routing in one place.';
      byId('adminDetailStatus').className = 'status-pill status-pill-muted';
      byId('adminDetailStatus').textContent = 'No record selected';
      byId('adminDetailPayment').className = 'status-pill status-pill-muted';
      byId('adminDetailPayment').textContent = 'Payment pending';
      renderEvents(defaultRecord());
      return;
    }

    empty.hidden = true;
    form.hidden = false;
    if (contactRail) {
      contactRail.hidden = false;
    }
    byId('adminDetailTitle').textContent = record.leadName ? record.code + ' · ' + record.leadName : record.code;
    byId('adminDetailLead').textContent = primaryRoute(record);
    byId('adminDetailStatus').className = statusClass(record.status);
    byId('adminDetailStatus').textContent = statusLabel(record.status);
    byId('adminDetailPayment').className = statusClass(record.paymentStatus);
    byId('adminDetailPayment').textContent = paymentLabel(record.paymentStatus);

    populateField('detailCode', record.code);
    populateField('detailSource', record.source);
    populateField('detailLeadName', record.leadName);
    populateField('detailCountry', record.country);
    populateField('detailEmail', record.guestEmail);
    populateField('detailWhatsapp', record.guestWhatsapp);
    populateField('detailDate', record.pickupDate);
    populateField('detailTime', record.pickupTime);
    populateField('detailPickup', record.pickupPoint);
    populateField('detailReference', record.reference);
    populateField('detailStatusSelect', record.status);
    populateField('detailPaymentSelect', record.paymentStatus);
    populateField('detailInvoiceStatus', record.invoiceStatus);
    populateField('detailInvoiceRef', record.invoiceRef);
    populateField('detailEstimatedTotal', record.estimatedTotal);
    populateField('detailInvoiceAmount', record.invoiceAmount);
    populateField('detailDepositAmount', record.depositAmount);
    populateField('detailPaidAmount', record.paidAmount);
    populateField('detailOperatorName', record.operatorName);
    populateField('detailOperatorEmail', record.operatorEmail);
    populateField('detailOperatorWhatsapp', record.operatorWhatsapp);
    populateField('detailClientEmailSent', record.clientEmailSent);
    populateField('detailClientWhatsappSent', record.clientWhatsappSent);
    populateField('detailOperatorEmailSent', record.operatorEmailSent);
    populateField('detailOperatorWhatsappSent', record.operatorWhatsappSent);
    populateField('detailInternalNotes', record.internalNotes);
    renderContactRail(record);
    renderItems(record);
    renderEvents(record);
  }

  function phoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function setContactLink(id, href, enabled) {
    var link = byId(id);
    if (!link) return;
    link.href = enabled ? href : '#';
    link.classList.toggle('is-disabled', !enabled);
    link.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    if (!enabled) {
      link.setAttribute('tabindex', '-1');
      return;
    }
    link.removeAttribute('tabindex');
  }

  function renderContactRail(record) {
    if (!record) return;
    var routing = routingConfig();
    var clientSubject = encodeURIComponent('Excellentia VIP | ' + record.code);
    var clientBody = encodeURIComponent(summaryText(record));
    var operatorSubject = encodeURIComponent('Excellentia VIP ops brief | ' + record.code);
    var operatorBody = encodeURIComponent(opsBriefText(record));
    var clientWhatsapp = phoneDigits(record.guestWhatsapp);
    var operatorEmail = record.operatorEmail || routing.ownerEmail;
    var operatorWhatsapp = phoneDigits(record.operatorWhatsapp || routing.ownerWhatsapp);
    var operatorEmailLink = byId('adminOperatorEmailLink');
    var operatorWhatsappLink = byId('adminOperatorWhatsappLink');

    if (operatorEmailLink) {
      operatorEmailLink.textContent = record.operatorEmail ? 'Email operator' : 'Email reservations';
    }
    if (operatorWhatsappLink) {
      operatorWhatsappLink.textContent = record.operatorWhatsapp ? 'WhatsApp operator' : 'WhatsApp reservations';
    }

    setContactLink(
      'adminClientEmailLink',
      'mailto:' + record.guestEmail + '?subject=' + clientSubject + '&body=' + clientBody,
      Boolean(record.guestEmail)
    );
    setContactLink(
      'adminClientWhatsappLink',
      'https://wa.me/' + clientWhatsapp + '?text=' + clientBody,
      Boolean(clientWhatsapp)
    );
    setContactLink(
      'adminOperatorEmailLink',
      'mailto:' + operatorEmail + '?subject=' + operatorSubject + '&body=' + operatorBody,
      Boolean(operatorEmail)
    );
    setContactLink(
      'adminOperatorWhatsappLink',
      'https://wa.me/' + operatorWhatsapp + '?text=' + operatorBody,
      Boolean(operatorWhatsapp)
    );
  }

  function renderReadiness() {
    var pill = byId('adminReadinessPill');
    var note = byId('adminReadinessNote');
    var grid = byId('adminReadinessGrid');
    if (!pill || !note || !grid) return;

    if (!remoteConfig.adminEndpoint) {
      pill.className = readinessClass('missing');
      pill.textContent = readinessLabel('missing');
      note.textContent = 'This build has no shared cloud ledger endpoint configured yet.';
      grid.innerHTML = '';
      return;
    }

    if (!canUseRemoteLedger()) {
      pill.className = readinessClass('muted');
      pill.textContent = readinessLabel('waiting');
      note.textContent = 'Sign in with a staff session to inspect the live booking, notification and payment environment. Use the admin key only as a local fallback.';
      grid.innerHTML = '';
      return;
    }

    if (remoteRuntime.state === 'pending') {
      pill.className = readinessClass('pending');
      pill.textContent = readinessLabel('pending');
      note.textContent = remoteRuntime.message || 'Checking live environment…';
      grid.innerHTML = '';
      return;
    }

    var diagnostics = remoteRuntime.diagnostics;
    if (!diagnostics || !Array.isArray(diagnostics.checks)) {
      pill.className = readinessClass(remoteRuntime.state === 'warning' ? 'partial' : 'muted');
      pill.textContent = readinessLabel(remoteRuntime.state === 'warning' ? 'partial' : 'waiting');
      note.textContent = remoteRuntime.message || 'No live readiness data has been loaded yet.';
      grid.innerHTML = '';
      return;
    }

    var summary = diagnostics.summary || {};
    var overall = String(summary.overall || 'partial');
    pill.className = readinessClass(overall);
    pill.textContent = readinessLabel(overall);
    note.textContent = 'Live check: ' +
      String(summary.ready || 0) + ' ready, ' +
      String(summary.partial || 0) + ' partial, ' +
      String(summary.missing || 0) + ' missing.';

    grid.innerHTML = diagnostics.checks.map(function (item) {
      return '<article class="admin-readiness-card">' +
        '<div class="admin-readiness-card-head">' +
          '<strong>' + escapeHtml(item.label || 'Check') + '</strong>' +
          '<span class="' + readinessClass(item.status) + '">' + escapeHtml(readinessLabel(item.status)) + '</span>' +
        '</div>' +
        '<p>' + escapeHtml(item.detail || '') + '</p>' +
      '</article>';
    }).join('');
  }

  function renderAll() {
    ensureSelection();
    renderKpis();
    renderPriorityBoard();
    renderStageNote();
    renderRemoteAccess();
    renderReadiness();
    renderFilters();
    renderLedgerList();
    renderDetail();
  }

  function updateSelectedField(field, value) {
    var record = selectedRecord();
    if (!record) return;
    record[field] = value;
    void updateRecord(record);
  }

  function handleDetailChange(event) {
    var field = event.target && event.target.getAttribute('data-record-field');
    if (!field) return;
    if (event.target.type === 'checkbox') {
      updateSelectedField(field, Boolean(event.target.checked));
      return;
    }
    if (event.target.type === 'number') {
      updateSelectedField(field, Math.max(0, Math.round(toNumber(event.target.value))));
      return;
    }
    updateSelectedField(field, event.target.value);
  }

  function downloadBlob(filename, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function toCsvValue(value) {
    var text = String(value == null ? '' : value).replace(/"/g, '""');
    return '"' + text + '"';
  }

  function exportLedgerJson() {
    downloadBlob('excellentia-vip-ledger.json', JSON.stringify(ledger, null, 2), 'application/json;charset=utf-8');
  }

  function exportLedgerCsv() {
    var header = [
      'booking_code',
      'status',
      'payment_status',
      'invoice_status',
      'lead_name',
      'country',
      'guest_email',
      'guest_whatsapp',
      'pickup_date',
      'pickup_time',
      'pickup_point',
      'reference',
      'estimated_total',
      'invoice_amount',
      'deposit_amount',
      'paid_amount',
      'invoice_ref',
      'operator_name',
      'operator_email',
      'operator_whatsapp',
      'items'
    ];
    var rows = ledger.map(function (record) {
      var itemSummary = record.items.map(function (item) {
        return item.serviceLabel + ' / ' + item.routeLabel + ' / ' + money(item.total);
      }).join(' | ');
      return [
        record.code,
        record.status,
        record.paymentStatus,
        record.invoiceStatus,
        record.leadName,
        record.country,
        record.guestEmail,
        record.guestWhatsapp,
        record.pickupDate,
        record.pickupTime,
        record.pickupPoint,
        record.reference,
        record.estimatedTotal,
        record.invoiceAmount,
        record.depositAmount,
        record.paidAmount,
        record.invoiceRef,
        record.operatorName,
        record.operatorEmail,
        record.operatorWhatsapp,
        itemSummary
      ].map(toCsvValue).join(',');
    });
    downloadBlob('excellentia-vip-ledger.csv', [header.join(',')].concat(rows).join('\n'), 'text/csv;charset=utf-8');
  }

  function notificationStateSummary(record) {
    var parts = [];
    parts.push(record.clientEmailSent ? 'Client email sent' : 'Client email pending');
    parts.push(record.clientWhatsappSent ? 'Client WhatsApp sent' : 'Client WhatsApp pending');
    parts.push(record.operatorEmailSent ? 'Operator email sent' : 'Operator email pending');
    parts.push(record.operatorWhatsappSent ? 'Operator WhatsApp sent' : 'Operator WhatsApp pending');
    return parts.join(' · ');
  }

  function recordNextStep(record) {
    if (record.status === 'requested') return 'Review the request and send the first confirmation or quote.';
    if (record.status === 'quoted') return 'Confirm guest approval and lock the payment path.';
    if (record.status === 'confirmed' && record.paymentStatus !== 'paid') return 'Chase payment and keep the booking code consistent across channels.';
    if (record.status === 'paid') return 'Finalize operator routing and dispatch details.';
    if (record.status === 'completed') return 'Archive supporting notes and keep the ledger clean.';
    if (record.status === 'cancelled') return 'Keep the cancellation trail attached to the same record.';
    return 'Keep the guest, payment and operator follow-up aligned in one record.';
  }

  function summaryText(record) {
    var lines = [
      'Excellentia VIP',
      '',
      'Booking code: ' + record.code,
      'Summary: ' + primaryRoute(record),
      'Request mode: ' + record.requestMode,
      'Status: ' + statusLabel(record.status),
      'Payment: ' + paymentLabel(record.paymentStatus),
      'Guest: ' + (record.leadName || 'Not set')
    ];
    if (record.country) lines.push('Country: ' + record.country);
    if (record.guestEmail) lines.push('Email: ' + record.guestEmail);
    if (record.guestWhatsapp) lines.push('WhatsApp: ' + record.guestWhatsapp);
    if (record.pickupDate) lines.push('Date: ' + record.pickupDate);
    if (record.pickupTime) lines.push('Time: ' + record.pickupTime);
    if (record.pickupPoint) lines.push('Pickup: ' + record.pickupPoint);
    if (record.reference) lines.push('Reference: ' + record.reference);
    lines.push('Estimated total: ' + money(record.estimatedTotal));
    lines.push('Next step: ' + recordNextStep(record));
    return lines.join('\n');
  }

  function opsBriefText(record) {
    var routing = routingConfig();
    var operatorLine = [record.operatorName, record.operatorEmail, record.operatorWhatsapp].filter(Boolean).join(' · ');
    if (!operatorLine) {
      operatorLine = [routing.ownerName, routing.ownerEmail, routing.ownerWhatsapp].filter(Boolean).join(' · ');
    }
    var lines = [
      'Excellentia VIP ops brief',
      '',
      'Booking code: ' + record.code,
      'Summary: ' + primaryRoute(record),
      'Lead: ' + (record.leadName || 'Not set'),
      'Contact: ' + [record.guestEmail, record.guestWhatsapp].filter(Boolean).join(' · '),
      'Request mode: ' + record.requestMode,
      'Status: ' + statusLabel(record.status),
      'Payment: ' + paymentLabel(record.paymentStatus),
      'Invoice: ' + invoiceLabel(record.invoiceStatus),
      'Notification state: ' + notificationStateSummary(record),
      'Next step: ' + recordNextStep(record)
    ];
    if (operatorLine) {
      lines.push('');
      lines.push('Operator / reservations: ' + operatorLine);
    }
    lines.push('');
    record.items.forEach(function (item, index) {
      lines.push('Item ' + (index + 1) + ': ' + item.serviceLabel);
      lines.push('Route: ' + (item.routeLabel || 'Not set'));
      lines.push('Vehicle: ' + (item.vehicleLabel || 'Not set'));
      lines.push('Package: ' + (item.packageLabel || 'Not set'));
      lines.push('Guests: ' + item.guests + ' · Timing: ' + (item.timingLabel || 'Not set'));
      if (item.extras.length) lines.push('Add-ons: ' + item.extras.join(', '));
      if (item.notes) lines.push('Notes: ' + item.notes);
      lines.push('Value: ' + money(item.total));
      lines.push('');
    });
    if (record.internalNotes) {
      lines.push('Internal notes: ' + record.internalNotes);
      lines.push('');
    }
    lines.push('Invoice ref: ' + (record.invoiceRef || 'Not set'));
    lines.push('Invoice amount: ' + money(record.invoiceAmount));
    lines.push('Paid amount: ' + money(record.paidAmount));
    return lines.join('\n');
  }

  function copyText(text, button) {
    if (!text) return;
    var original = button.textContent;
    function show(temp) {
      button.textContent = temp;
      window.clearTimeout(button._copyTimer);
      button._copyTimer = window.setTimeout(function () {
        button.textContent = original;
      }, 1600);
    }
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (error) {}
      document.body.removeChild(area);
      show(ok ? 'Copied' : 'Copy failed');
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallback();
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      show('Copied');
    }).catch(function () {
      fallback();
    });
  }

  function handleAdminAction(event) {
    var actionButton = event.target.closest('[data-admin-action]');
    if (!actionButton) return;
    var action = actionButton.getAttribute('data-admin-action');
    if (action === 'connect-cloud') {
      var input = byId('adminApiKeyInput');
      var key = input ? input.value : '';
      if (key && key.trim()) {
        saveAdminApiKey(key);
      }
      if (!canUseRemoteLedger()) {
        setRemoteState('warning', 'Load a valid staff session first, or use the emergency admin key only when fallback is enabled.');
        renderAll();
        return;
      }
      void hydrateRemoteLedger();
      return;
    }
    if (action === 'reload-cloud') {
      if (!canUseRemoteLedger()) {
        setRemoteState('warning', 'Cloud ledger refresh needs a staff session or an explicitly enabled emergency admin key.');
        renderAll();
        return;
      }
      void hydrateRemoteLedger();
      return;
    }
    if (action === 'clear-cloud-key') {
      saveAdminApiKey('');
      remoteRuntime.diagnostics = null;
      setRemoteState('idle', 'Cloud ledger access key cleared from this browser session.');
      renderAll();
      return;
    }
    if (action === 'import-current') {
      var imported = createRecordFromCurrentItinerary();
      if (imported) {
        void addRecord(imported);
      }
      return;
    }
    if (action === 'create-record') {
      void addRecord(defaultRecord());
      return;
    }
    if (action === 'export-json') {
      exportLedgerJson();
      return;
    }
    if (action === 'export-csv') {
      exportLedgerCsv();
      return;
    }
    if (action === 'duplicate-record') {
      void duplicateSelectedRecord();
      return;
    }
    if (action === 'delete-record') {
      void deleteSelectedRecord();
      return;
    }
    if (action === 'copy-client-summary') {
      var record = selectedRecord();
      if (record) copyText(summaryText(record), actionButton);
      return;
    }
    if (action === 'copy-ops-summary') {
      var current = selectedRecord();
      if (current) copyText(opsBriefText(current), actionButton);
    }
  }

  document.addEventListener('click', function (event) {
    var selectButton = event.target.closest('[data-select-record]');
    if (selectButton) {
      selectedId = selectButton.getAttribute('data-select-record');
      persistUiState();
      renderAll();
      return;
    }
    handleAdminAction(event);
  });

  byId('adminSearch').addEventListener('input', function (event) {
    searchTerm = event.target.value || '';
    persistUiState();
    renderFilters();
    renderLedgerList();
  });

  var adminApiKeyInput = byId('adminApiKeyInput');
  if (adminApiKeyInput) {
    adminApiKeyInput.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      var target = event.currentTarget;
      if (target && target.value && target.value.trim()) {
        saveAdminApiKey(target.value);
      }
      void hydrateRemoteLedger();
    });
  }

  byId('adminDetailForm').addEventListener('change', handleDetailChange);

  byId('adminFilterChips').addEventListener('click', function (event) {
    var chip = event.target.closest('[data-filter-status]');
    if (!chip) return;
    activeFilter = chip.getAttribute('data-filter-status') || 'all';
    persistUiState();
    renderFilters();
    renderLedgerList();
  });

  async function hydrateRemoteLedger() {
    if (!canUseRemoteLedger()) {
      remoteRuntime.diagnostics = null;
      renderAll();
      return;
    }

    try {
      setRemoteState('pending', 'Loading shared cloud ledger…');
      var result = await remoteRequest('GET');
      if (!Array.isArray(result.records)) {
        throw new Error('Cloud ledger response is invalid.');
      }
      remoteRuntime.diagnostics = result.diagnostics || null;
      ledger = result.records.map(normalizeRecord);
      selectedId = persistedValue(SELECTED_STORAGE_KEY, ledger[0] ? ledger[0].id : '');
      ensureSelection();
      persistLedger();
      setRemoteState('success', 'Shared cloud ledger active.');
    } catch (error) {
      remoteRuntime.diagnostics = error && error.payload && error.payload.diagnostics ? error.payload.diagnostics : null;
      setRemoteState('warning', 'Cloud ledger could not load. Using browser ledger only.');
    }

    renderAll();
  }

  renderAll();
  void hydrateRemoteLedger();
})();
