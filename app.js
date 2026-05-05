(function () {
  function build(base, overrides) {
    var out = {};
    Object.keys(base || {}).forEach(function (key) { out[key] = base[key]; });
    Object.keys(overrides || {}).forEach(function (key) { out[key] = overrides[key]; });
    return out;
  }

  function encode(value) {
    return encodeURIComponent((value || '').trim());
  }

  function normalizeCountryName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getPageKey(pathname) {
    var path = String(pathname || '').toLowerCase();
    if (path.indexOf('case-studies') !== -1) return 'cases';
    if (path.indexOf('preventivo') !== -1) return 'quote';
    if (path.indexOf('studio.html') !== -1) return 'studio';
    return 'home';
  }

  var baseEN = {
    fx_title: 'Local currency estimate',
    fx_text: 'Internal baseline in EUR. We can quote in your market currency.',
    fx_currency: 'Currency',
    fx_starter: 'Website / redesign',
    fx_growth: 'E-commerce',
    fx_premium: 'App / platform',
    fx_ongoing: 'Monthly support',
    fx_updated: 'Rate update:',
    q_select_one: 'Select',
    q_need_guidance: 'Need guidance',
    month_suffix: '/ month',
    open_email_data: 'Opening prefilled email draft with your data...',
    open_email_quote: 'Opening prefilled quote email draft...',
    lead_saved: 'Request received. We will reply by email.',
    lead_saved_fallback: 'Draft email opened as fallback.',
    qe_project_site: 'Professional website / redesign',
    qe_project_ecommerce: 'E-commerce with payments',
    qe_project_webapp: 'Web app / internal platform',
    qe_project_mobileapp: 'Mobile app / cross-platform app',
    qe_complexity_lean: 'Lean launch',
    qe_complexity_business: 'Business system',
    qe_complexity_advanced: 'Advanced operations',
    qe_complexity_platform: 'Platform / multi-role product',
    qe_scale_small: 'Small scope',
    qe_scale_medium: 'Medium scope',
    qe_scale_large: 'Large catalog / many screens',
    qe_scale_enterprise: 'Enterprise scope',
    qe_urgency_standard: 'Standard delivery',
    qe_urgency_fast: 'Fast track',
    qe_urgency_sprint: 'Critical sprint',
    qe_feature_payments: 'Stripe / payment checkout',
    qe_feature_booking: 'Booking or quote workflow',
    qe_feature_auth: 'Client area / login',
    qe_feature_admin: 'Admin dashboard / CMS',
    qe_feature_automations: 'CRM, emails or automations',
    qe_feature_multilingual: 'Multilingual structure',
    qe_feature_analytics: 'SEO, analytics and tracking',
    qe_feature_content: 'Content migration / copy support',
    qe_feature_ai: 'AI or third-party integrations',
    qe_feature_appstores: 'App Store / Play Store support',
    qe_path_discovery: 'Phase 1 consultation + written technical scope before build.',
    qe_path_scope: 'Written scope first, then milestone-based project payment.',
    qe_path_direct: 'Direct package possible after written scope confirmation.',
    qe_deposit_suffix: 'suggested 30% kickoff range',
    qe_weeks_suffix: 'weeks',
    qe_note_no_features: 'Base estimate without extra modules. Add features to see the scope move.',
    qe_note_features: 'Included complexity drivers:',
    seo_home_title: 'Cantoni Digital Studio | Global website redesign',
    seo_home_desc: 'Commercial web infrastructure for serious service businesses: websites, e-commerce, applications, payments, data capture, automation and ongoing ecosystem support.',
    seo_cases_title: 'Case Studies | Cantoni Digital Studio',
    seo_cases_desc: 'Real redesign and conversion growth benchmarks across local and international markets.',
    seo_quote_title: 'Consultation and project path | Cantoni Digital Studio',
    seo_quote_desc: 'Estimate websites, e-commerce, web apps and mobile applications with Cantoni Digital Studio, then request a written scope and commercial path.',
    seo_studio_title: 'Cantoni Digital Studio | Studio Profile',
    seo_studio_desc: 'Public operating profile for Cantoni Digital Studio: premium digital execution, consultation-first workflow and ecosystem leverage.'
  };

  window.CDSApp = {
    baseEN: baseEN,
    appState: {
      translations: {},
      langs: ['it', 'en', 'es', 'fr', 'de', 'pt', 'ar', 'ru', 'zh', 'ja', 'hi']
    },
    build: build,
    encode: encode,
    normalizeCountryName: normalizeCountryName,
    getPageKey: getPageKey
  };
})();
