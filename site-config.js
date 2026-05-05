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
  },
  vipRouting: {
    bookingEmail: 'excellentiavip@gmail.com',
    publicEmail: 'excellentiavip@gmail.com',
    ownerName: 'Excellentia VIP Reservations',
    ownerEmail: 'excellentiavip@gmail.com',
    ownerWhatsapp: '+18495922222',
    ownerWhatsappDisplay: '+1 849-592-2222',
    publicAddressDisplay: 'Av. España, Punta Cana 23301'
  },
  vipSeo: {
    productionHosts: ['excellentiavip.com', 'www.excellentiavip.com', 'excellentia-vip.com', 'www.excellentia-vip.com'],
    defaultNoIndexHosts: ['localhost', '127.0.0.1', 'pages.dev', 'netlify.app']
  },
  vipAccount: {
    profileEndpoint: '/api/account/profile',
    bookingsEndpoint: '/api/account/bookings',
    leadsEndpoint: '/api/leads/capture',
    offersEndpoint: '/api/offers/claim',
    sessionStorageKey: 'vip_customer_session_v1',
    accountPath: '/excellentia-vip-account.html'
  },
  vipNotifications: {
    dispatchEndpoint: '/api/notifications/dispatch'
  },
  vipPayments: {
    enabled: false,
    primaryGateway: 'cardnet',
    checkoutEndpoint: '/api/payments/cardnet/session',
    webhookPath: '/api/payments/cardnet/webhook'
  },
  vipStripe: {
    enabled: false,
    checkoutEndpoint: '/api/payments/cardnet/session',
    merchantName: 'Excellentia VIP',
    currency: 'usd',
    depositPercent: 30,
    successPath: '/excellentia-vip-booking.html',
    cancelPath: '/excellentia-vip-booking.html'
  },
  vipBookings: {
    enabled: true,
    createEndpoint: '/api/bookings/create',
    adminEndpoint: '/api/bookings/records',
    adminSessionStorageKey: 'vip_admin_api_key_v1',
    dedupeWindowMinutes: 360
  }
};
