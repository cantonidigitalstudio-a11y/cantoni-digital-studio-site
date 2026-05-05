(function () {
  var app = window.CDSApp || {};
  if (!app.createSeoModule || !app.createI18nModule || !app.createLeadFormsModule || !app.createFxModule) return;

  var seoModule = app.createSeoModule();
  var i18nModule = app.createI18nModule(app.appState, seoModule);
  var leadFormsModule = app.createLeadFormsModule(i18nModule);
  var fxModule = app.createFxModule(i18nModule);
  var quoteEstimatorModule = app.createQuoteEstimatorModule ? app.createQuoteEstimatorModule(i18nModule) : null;
  var analyticsModule = app.createAnalyticsModule ? app.createAnalyticsModule(i18nModule) : null;

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  i18nModule.init();
  leadFormsModule.init();
  fxModule.init();
  if (quoteEstimatorModule && typeof quoteEstimatorModule.init === 'function') quoteEstimatorModule.init();
  if (analyticsModule && typeof analyticsModule.init === 'function') analyticsModule.init();
})();
