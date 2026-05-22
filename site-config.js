window.CDS_CONFIG = {
  leadCaptureEndpoint: 'https://script.google.com/macros/s/AKfycbwuFXalSZeJUDgqWZlHVqY0CFXipuElIX7lrc-X9FgK1VozP60PuXqiF8IgzF9rbGYWwg/exec',
  leadCaptureMode: 'google-apps-script',
  backupToGmail: false,
  analytics: {
    enabled: true,
    requiresConsent: true,
    endpoint: 'https://script.google.com/macros/s/AKfycbwuFXalSZeJUDgqWZlHVqY0CFXipuElIX7lrc-X9FgK1VozP60PuXqiF8IgzF9rbGYWwg/exec',
    action: 'track_event',
    consentStorageKey: 'cds_cookie_consent_v1',
    localBufferKey: 'cds_analytics_buffer_v1',
    sessionKey: 'cds_analytics_session_v1',
    maxBufferedEvents: 250
  },
  fx: {
    mode: 'local',
    ratesPath: 'sales-kit/fx_rates.json',
    remoteEndpoint: 'https://api.frankfurter.app/latest?from=EUR'
  },
  studioAdmin: {
    path: '/studio-admin.html',
    summaryAction: 'admin_summary'
  }
};
