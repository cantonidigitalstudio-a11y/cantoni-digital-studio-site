var DEFAULT_OUTREACH_SHARED_SECRET = 'P3wcVS7_dyUspIoed2SzDTOxrbLEUi0s_MYqxyVLyiI';
var DEFAULT_ADMIN_SHARED_SECRET = 'P3wcVS7_dyUspIoed2SzDTOxrbLEUi0s_MYqxyVLyiI';

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = String(params.action || 'health').toLowerCase();

  if (action === 'lead') {
    return handleLead_(buildPayloadFromParams_(params), params.callback);
  }

  if (action === 'track_event') {
    return handleTrackEvent_(buildEventPayloadFromParams_(params), params.callback);
  }

  if (action === 'send_outreach') {
    return handleOutreachSend_(params, params.callback);
  }

  if (action === 'admin_summary') {
    return handleAdminSummary_(params, params.callback);
  }

  return respond_(params.callback, {
    ok: true,
    action: 'health',
    service: 'cantoni-digital-studio-leads'
  });
}

function doPost(e) {
  var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
  var payload = {};
  var action = 'lead';

  try {
    payload = JSON.parse(raw);
  } catch (err) {
    payload = {};
  }

  action = String(payload.action || 'lead').toLowerCase();

  if (action === 'send_outreach') {
    return handleOutreachSend_(payload);
  }

  if (action === 'track_event') {
    return handleTrackEvent_(payload);
  }

  if (action === 'admin_summary') {
    return handleAdminSummary_(payload);
  }

  return handleLead_(payload);
}

function handleLead_(payload, callback) {
  try {
    var sheet = getLeadSheet_();
    ensureHeader_(sheet);

    sheet.appendRow([
      new Date(),
      payload.form_type || '',
      payload.page || '',
      payload.language || '',
      payload.currency || '',
      payload.business || payload.company || '',
      payload.contact || '',
      payload.email || '',
      payload.website || '',
      payload.market || payload.country || '',
      payload.sector || '',
      payload.projectType || '',
      payload.budget || '',
      payload.goal || '',
      payload.user_agent || '',
      payload.source || 'website',
      'NEW',
      payload.timeline || '',
      payload.request_channel || '',
      payload.request_mode || '',
      payload.lead_name || payload.contact || '',
      payload.guest_whatsapp || '',
      payload.pickup_point || '',
      payload.reference || '',
      payload.service_label || '',
      payload.route_label || '',
      payload.package_label || '',
      payload.extras_label || '',
      payload.estimated_total || '',
      payload.submitted_at || ''
    ]);

    return respond_(callback, { ok: true });
  } catch (err) {
    return respond_(callback, {
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function buildPayloadFromParams_(params) {
  return {
    form_type: params.form_type || '',
    page: params.page || '',
    language: params.language || '',
    currency: params.currency || '',
    business: params.business || params.company || '',
    company: params.company || '',
    contact: params.contact || '',
    email: params.email || '',
    website: params.website || '',
    market: params.market || params.country || '',
    country: params.country || '',
    sector: params.sector || '',
    projectType: params.projectType || '',
    budget: params.budget || '',
    goal: params.goal || '',
    user_agent: params.user_agent || '',
    source: params.source || 'website',
    timeline: params.timeline || '',
    request_channel: params.request_channel || '',
    request_mode: params.request_mode || '',
    lead_name: params.lead_name || params.contact || '',
    guest_whatsapp: params.guest_whatsapp || '',
    pickup_point: params.pickup_point || '',
    reference: params.reference || '',
    service_label: params.service_label || '',
    route_label: params.route_label || '',
    package_label: params.package_label || '',
    extras_label: params.extras_label || '',
    estimated_total: params.estimated_total || '',
    submitted_at: params.submitted_at || ''
  };
}

function buildEventPayloadFromParams_(params) {
  return {
    event_name: params.event_name || '',
    event_category: params.event_category || '',
    event_label: params.event_label || '',
    page: params.page || '',
    path: params.path || '',
    url: params.url || '',
    language: params.language || '',
    title: params.title || '',
    session_id: params.session_id || '',
    href: params.href || '',
    referrer: params.referrer || '',
    viewport: params.viewport || '',
    screen: params.screen || '',
    market: params.market || '',
    form_type: params.form_type || '',
    project_type: params.project_type || '',
    payment_path: params.payment_path || '',
    payment_mode: params.payment_mode || '',
    payment_state: params.payment_state || '',
    checkout_session_id: params.checkout_session_id || '',
    source: params.source || 'website',
    user_agent: params.user_agent || '',
    tz: params.tz || '',
    occurred_at: params.occurred_at || ''
  };
}

function respond_(callback, payload) {
  var body = JSON.stringify(payload);

  if (callback) {
    return ContentService
      .createTextOutput(String(callback) + '(' + body + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}

function handleOutreachSend_(payload, callback) {
  try {
    assertSecret_(payload.secret || '');

    var to = String(payload.to || '').trim();
    var subject = String(payload.subject || '').trim();
    var body = String(payload.body || '').trim();
    var htmlBody = String(payload.html_body || '').trim();
    var leadId = String(payload.lead_id || payload.id || '').trim();
    var senderName = String(payload.sender_name || 'Cantoni Digital Studio').trim();
    var replyTo = String(payload.reply_to || 'cantonidigitalstudio@gmail.com').trim();
    var inlineImages = buildInlineImages_(payload.inline_images || null);

    if (!to || !subject || (!body && !htmlBody)) {
      throw new Error('Missing required outreach fields.');
    }

    var mailOptions = {
      to: to,
      subject: subject,
      body: body || stripHtml_(htmlBody),
      htmlBody: htmlBody || textToHtml_(body),
      name: senderName,
      replyTo: replyTo
    };

    if (Object.keys(inlineImages).length) {
      mailOptions.inlineImages = inlineImages;
    }

    MailApp.sendEmail(mailOptions);

    return respond_(callback, {
      ok: true,
      action: 'send_outreach',
      sent_to: to,
      lead_id: leadId
    });
  } catch (err) {
    return respond_(callback, {
      ok: false,
      action: 'send_outreach',
      error: String(err && err.message ? err.message : err)
    });
  }
}

function handleTrackEvent_(payload, callback) {
  try {
    var sheet = getEventSheet_();
    ensureEventHeader_(sheet);

    sheet.appendRow([
      new Date(),
      payload.event_name || '',
      payload.event_category || '',
      payload.event_label || '',
      payload.page || '',
      payload.path || '',
      payload.url || '',
      payload.language || '',
      payload.title || '',
      payload.session_id || '',
      payload.href || '',
      payload.referrer || '',
      payload.viewport || '',
      payload.screen || '',
      payload.market || '',
      payload.form_type || '',
      payload.project_type || '',
      payload.payment_path || '',
      payload.payment_mode || '',
      payload.payment_state || '',
      payload.checkout_session_id || '',
      payload.source || 'website',
      payload.user_agent || '',
      payload.tz || '',
      payload.occurred_at || ''
    ]);

    return respond_(callback, { ok: true, action: 'track_event' });
  } catch (err) {
    return respond_(callback, {
      ok: false,
      action: 'track_event',
      error: String(err && err.message ? err.message : err)
    });
  }
}

function handleAdminSummary_(payload, callback) {
  try {
    assertAdminSecret_(payload.secret || '');

    var leads = readSheetObjects_(getLeadSheet_());
    var events = readSheetObjects_(getEventSheet_());
    var summary = buildAdminSummary_(leads, events);

    return respond_(callback, summary);
  } catch (err) {
    return respond_(callback, {
      ok: false,
      action: 'admin_summary',
      error: String(err && err.message ? err.message : err)
    });
  }
}

function getLeadSheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('LEADS_SPREADSHEET_ID');
  var spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create('Cantoni Digital Studio Leads');
    spreadsheetId = spreadsheet.getId();
    props.setProperty('LEADS_SPREADSHEET_ID', spreadsheetId);
  }

  return getOrCreateSheet_(spreadsheet, 'Leads');
}

function getEventSheet_() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('LEADS_SPREADSHEET_ID');
  var spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create('Cantoni Digital Studio Leads');
    spreadsheetId = spreadsheet.getId();
    props.setProperty('LEADS_SPREADSHEET_ID', spreadsheetId);
  }

  return getOrCreateSheet_(spreadsheet, 'Events');
}

function getOrCreateSheet_(spreadsheet, targetName) {
  var normalizedTarget = String(targetName || '').trim();
  var existing = spreadsheet.getSheets().filter(function(sheet) {
    return String(sheet.getName() || '').trim() === normalizedTarget;
  })[0];

  if (existing) return existing;

  try {
    return spreadsheet.insertSheet(normalizedTarget);
  } catch (err) {
    existing = spreadsheet.getSheets().filter(function(sheet) {
      return String(sheet.getName() || '').trim() === normalizedTarget;
    })[0];
    if (existing) return existing;
    throw err;
  }
}

function ensureHeader_(sheet) {
  ensureSheetHeaders_(sheet, [
    'timestamp',
    'form_type',
    'page',
    'language',
    'currency',
    'business_name',
    'contact_name',
    'email',
    'website',
    'market',
    'sector',
    'project_type',
    'budget',
    'goal',
    'user_agent',
    'source',
    'status',
    'timeline',
    'request_channel',
    'request_mode',
    'lead_name',
    'guest_whatsapp',
    'pickup_point',
    'reference',
    'service_label',
    'route_label',
    'package_label',
    'extras_label',
    'estimated_total',
    'submitted_at'
  ]);
}

function ensureEventHeader_(sheet) {
  ensureSheetHeaders_(sheet, [
    'timestamp',
    'event_name',
    'event_category',
    'event_label',
    'page',
    'path',
    'url',
    'language',
    'title',
    'session_id',
    'href',
    'referrer',
    'viewport',
    'screen',
    'market',
    'form_type',
    'project_type',
    'payment_path',
    'payment_mode',
    'payment_state',
    'checkout_session_id',
    'source',
    'user_agent',
    'tz',
    'occurred_at'
  ]);
}

function ensureSheetHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach(function(header) {
    if (existing.indexOf(header) !== -1) return;
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
    existing.push(header);
  });
}

function assertSecret_(candidate) {
  var props = PropertiesService.getScriptProperties();
  var expected = String(props.getProperty('OUTREACH_SHARED_SECRET') || DEFAULT_OUTREACH_SHARED_SECRET || '').trim();

  if (!expected) {
    throw new Error('OUTREACH_SHARED_SECRET not configured.');
  }

  if (String(candidate || '').trim() !== expected) {
    throw new Error('Invalid outreach secret.');
  }
}

function assertAdminSecret_(candidate) {
  var props = PropertiesService.getScriptProperties();
  var expected = String(props.getProperty('ADMIN_SHARED_SECRET') || props.getProperty('OUTREACH_SHARED_SECRET') || DEFAULT_ADMIN_SHARED_SECRET || '').trim();

  if (!expected) {
    throw new Error('ADMIN_SHARED_SECRET not configured.');
  }

  if (String(candidate || '').trim() !== expected) {
    throw new Error('Invalid admin secret.');
  }
}

function readSheetObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  return values.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (header, index) {
      obj[String(header || '')] = row[index];
    });
    return obj;
  });
}

function buildAdminSummary_(leads, events) {
  var now = new Date();
  var sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  var thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  var fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  var daily = bucketDays_(14);
  var dailyMap = {};
  daily.forEach(function (item) { dailyMap[item.key] = item; });

  var pageviews7d = 0;
  var sessions7d = {};
  var ctaClicks7d = 0;
  var fallbacks7d = 0;
  var stripeStarts7d = 0;
  var leads30d = 0;
  var quoteRequests30d = 0;
  var paymentsCompleted30d = 0;
  var topPages = {};
  var topEvents = {};
  var topReferrers = {};
  var paymentPaths = {};
  var paymentStates = {};
  var recentPayments = [];

  events.forEach(function (event) {
    var occurred = parseDate_(event.occurred_at || event.timestamp);
    if (!occurred) return;
    var eventName = String(event.event_name || '').trim() || 'unknown';
    var path = String(event.path || '').trim() || '/';
    var referrer = String(event.referrer || '').trim();
    var dayKey = Utilities.formatDate(occurred, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (occurred >= fourteenDaysAgo && dailyMap[dayKey]) {
      if (eventName === 'page_view') dailyMap[dayKey].pageviews += 1;
      if (eventName === 'cta_click' || eventName === 'stripe_checkout_started') dailyMap[dayKey].ctas += 1;
      if (eventName === 'lead_submit_success' || eventName === 'stripe_checkout_completed') dailyMap[dayKey].leads += 1;
    }

    if (occurred >= sevenDaysAgo) {
      topEvents[eventName] = (topEvents[eventName] || 0) + 1;
      if (eventName === 'page_view') {
        pageviews7d += 1;
        sessions7d[String(event.session_id || 'unknown')] = true;
        topPages[path] = (topPages[path] || 0) + 1;
        var refKey = referrer ? referrer.replace(/^https?:\/\//, '').split('/')[0] : 'Direct / unknown';
        topReferrers[refKey] = (topReferrers[refKey] || 0) + 1;
      }
      if (eventName === 'cta_click') ctaClicks7d += 1;
      if (eventName === 'lead_submit_fallback') fallbacks7d += 1;
      if (eventName === 'stripe_checkout_started') stripeStarts7d += 1;
    }

    if (occurred >= thirtyDaysAgo && eventName.indexOf('stripe_checkout_') === 0) {
      var paymentPath = labelizePaymentPath_(event.payment_path || event.event_label || '');
      var paymentState = labelizePaymentState_(event.payment_state || eventName.replace('stripe_checkout_', ''));
      if (eventName === 'stripe_checkout_completed') paymentsCompleted30d += 1;
      paymentPaths[paymentPath] = (paymentPaths[paymentPath] || 0) + 1;
      paymentStates[paymentState] = (paymentStates[paymentState] || 0) + 1;
      recentPayments.push({
        occurred_at: formatDateTime_(occurred),
        payment_path: paymentPath,
        payment_mode: String(event.payment_mode || 'payment').trim(),
        payment_state: paymentState,
        checkout_session_id: String(event.checkout_session_id || '').trim() || 'n/d'
      });
    }
  });

  leads.forEach(function (lead) {
    var ts = parseDate_(lead.timestamp);
    if (!ts || ts < thirtyDaysAgo) return;
    leads30d += 1;
    if (String(lead.form_type || '').trim() === 'quote_request') quoteRequests30d += 1;
  });

  return {
    ok: true,
    action: 'admin_summary',
    generated_at: new Date().toISOString(),
    kpis: {
      pageviews7d: pageviews7d,
      uniqueSessions7d: Object.keys(sessions7d).length,
      ctaClicks7d: ctaClicks7d,
      stripeStarts7d: stripeStarts7d,
      leads30d: leads30d,
      quoteRequests30d: quoteRequests30d,
      paymentsCompleted30d: paymentsCompleted30d,
      fallbacks7d: fallbacks7d
    },
    charts: {
      daily: daily,
      topPages: toTopArray_(topPages, 6),
      topEvents: toTopArray_(topEvents, 6),
      topReferrers: toTopArray_(topReferrers, 6),
      paymentPaths: toTopArray_(paymentPaths, 6),
      paymentStates: toTopArray_(paymentStates, 6)
    },
    recentLeads: leads
      .sort(function (a, b) { return parseDate_(b.timestamp) - parseDate_(a.timestamp); })
      .slice(0, 12)
      .map(function (lead) {
        return {
          timestamp: formatDateTime_(parseDate_(lead.timestamp)),
          business: String(lead.business_name || lead.company || '').trim(),
          form_type: String(lead.form_type || '').trim(),
          email: String(lead.email || '').trim(),
          status: String(lead.status || '').trim()
        };
      }),
    recentEvents: events
      .sort(function (a, b) { return parseDate_(b.occurred_at || b.timestamp) - parseDate_(a.occurred_at || a.timestamp); })
      .slice(0, 20)
      .map(function (event) {
        return {
          occurred_at: formatDateTime_(parseDate_(event.occurred_at || event.timestamp)),
          event_name: String(event.event_name || '').trim(),
          path: String(event.path || '').trim(),
          event_label: String(event.event_label || '').trim()
        };
      }),
    recentPayments: recentPayments
      .sort(function (a, b) { return String(b.occurred_at || '').localeCompare(String(a.occurred_at || '')); })
      .slice(0, 12)
  };
}

function labelizePaymentPath_(value) {
  var normalized = String(value || '').trim();
  if (!normalized) return 'Stripe checkout';
  var map = {
    consultation_phase_1: 'Consultation phase 1',
    consultation_phase_2: 'Consultation phase 2',
    direct_package: 'Direct package',
    ecosystem_membership: 'Ecosystem membership'
  };
  if (map[normalized]) return map[normalized];
  return normalized.replace(/_/g, ' ').replace(/\b\w/g, function(char) { return char.toUpperCase(); });
}

function labelizePaymentState_(value) {
  var normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Unknown';
  var map = {
    started: 'Checkout started',
    completed: 'Pagamento confermato',
    cancelled: 'Checkout annullato'
  };
  return map[normalized] || normalized.replace(/_/g, ' ');
}

function bucketDays_(days) {
  var out = [];
  for (var i = days - 1; i >= 0; i -= 1) {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    out.push({
      key: Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      label: Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM'),
      pageviews: 0,
      ctas: 0,
      leads: 0
    });
  }
  return out;
}

function toTopArray_(map, limit) {
  return Object.keys(map).map(function (key) {
    return { label: key, value: map[key] };
  }).sort(function (a, b) {
    return b.value - a.value;
  }).slice(0, limit || 6);
}

function parseDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  var date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function formatDateTime_(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
}

function textToHtml_(text) {
  var safe = escapeHtml_(String(text || ''));
  return safe.replace(/\n/g, '<br>');
}

function stripHtml_(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInlineImages_(source) {
  var images = {};
  if (!source || typeof source !== 'object') {
    return images;
  }

  Object.keys(source).forEach(function(key) {
    var raw = source[key];
    if (!raw) return;
    var base64 = '';
    var contentType = 'image/png';

    if (typeof raw === 'string') {
      base64 = raw;
    } else if (typeof raw === 'object') {
      base64 = String(raw.base64 || '').trim();
      contentType = String(raw.contentType || contentType).trim() || contentType;
    }

    if (!base64) return;

    var extension = '.png';
    if (contentType === 'image/jpeg') extension = '.jpg';
    else if (contentType === 'image/gif') extension = '.gif';
    else if (contentType === 'image/webp') extension = '.webp';

    images[key] = Utilities.newBlob(
      Utilities.base64Decode(base64),
      contentType,
      key + extension
    );
  });

  return images;
}
