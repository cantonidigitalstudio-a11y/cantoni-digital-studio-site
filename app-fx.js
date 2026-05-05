(function () {
  var app = window.CDSApp || {};
  var config = window.CDS_CONFIG || {};

  app.createFxModule = function (i18nModule) {
    var ranges = { consultation: [250, 250], starter: [1200, 4500], growth: [4000, 14000], premium: [9000, 55000], ongoing: [250, 1200] };
    var languageCurrencyMap = {
      it: 'EUR',
      es: 'EUR',
      fr: 'EUR',
      de: 'EUR',
      pt: 'EUR',
      en: 'USD',
      zh: 'CNY',
      ja: 'JPY',
      hi: 'INR',
      ru: 'EUR',
      ar: 'EUR'
    };
    var countryCurrencyMap = {
      italy: 'EUR',
      spain: 'EUR',
      france: 'EUR',
      germany: 'EUR',
      portugal: 'EUR',
      austria: 'EUR',
      belgium: 'EUR',
      netherlands: 'EUR',
      ireland: 'EUR',
      usa: 'USD',
      'united states': 'USD',
      'united states of america': 'USD',
      canada: 'CAD',
      'united kingdom': 'GBP',
      uk: 'GBP',
      england: 'GBP',
      japan: 'JPY',
      china: 'CNY',
      brazil: 'BRL',
      mexico: 'MXN',
      india: 'INR',
      uae: 'AED',
      'saudi arabia': 'SAR',
      'dominican republic': 'DOP'
    };

    async function init() {
      var currencyEl = document.getElementById('fxCurrency');
      var starterEl = document.getElementById('fxStarter');
      var growthEl = document.getElementById('fxGrowth');
      var premiumEl = document.getElementById('fxPremium');
      var ongoingEl = document.getElementById('fxOngoing');
      var updatedEl = document.getElementById('fxUpdated');
      var quoteForm = document.getElementById('quoteForm');
      var countryEl = quoteForm ? quoteForm.elements.namedItem('country') : null;
      var budgetEl = quoteForm ? quoteForm.elements.namedItem('budget') : null;
      var ratesCache = null;
      var dateCache = null;
      var fxConfig = config.fx || {};
      var fxMode = fxConfig.mode || 'local';
      var localRatesPath = fxConfig.ratesPath || 'sales-kit/fx_rates.json';
      var remoteEndpoint = fxConfig.remoteEndpoint || 'https://api.frankfurter.app/latest?from=EUR';
      var urlCurrency = getCurrencyFromUrl();
      var manualCurrencyLock = Boolean(urlCurrency);

      if (!currencyEl || !starterEl || !growthEl || !premiumEl || !ongoingEl || !updatedEl) return;

      function getCurrentDict() {
        return i18nModule.getCurrentDict();
      }

      function hasRateForCurrency(ccy) {
        return ccy === 'EUR' || Boolean(ratesCache && ratesCache[ccy]);
      }

      function getUrlParams() {
        try {
          return new URLSearchParams(window.location.search);
        } catch (e) {
          return null;
        }
      }

      function getCurrencyFromUrl() {
        var params = getUrlParams();
        var value = params ? params.get('currency') : '';
        var currency = String(value || '').trim().toUpperCase();
        return /^[A-Z]{3}$/.test(currency) ? currency : '';
      }

      function getLanguageFromUrl() {
        var params = getUrlParams();
        var lang = params ? params.get('lang') : '';
        return String(lang || document.documentElement.lang || 'it').slice(0, 2).toLowerCase();
      }

      function getDefaultCurrency() {
        return urlCurrency || languageCurrencyMap[getLanguageFromUrl()] || 'EUR';
      }

      function syncCurrencySelection(preferredCurrency) {
        var normalized = String(preferredCurrency || '').toUpperCase();
        var nextCurrency = hasRateForCurrency(normalized) ? normalized : 'EUR';
        if (currencyEl.value !== nextCurrency) currencyEl.value = nextCurrency;
        return nextCurrency;
      }

      function refreshCurrencyOptions() {
        Array.prototype.forEach.call(currencyEl.options, function (option) {
          option.disabled = !hasRateForCurrency(option.value);
        });
      }

      function fmt(value, currency) {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: 0
        }).format(value);
      }

      function formatRange(range, currency) {
        if (!range || !Array.isArray(range)) return 'N/A';
        if (range[1] == null) return fmt(range[0], currency) + '+';
        if (range[0] === range[1]) return fmt(range[0], currency);
        return fmt(range[0], currency) + ' - ' + fmt(range[1], currency);
      }

      function updateBudgetOptions(currency) {
        if (!budgetEl || !ratesCache) return;
        var activeCurrency = syncCurrencySelection(currency);
        var rate = activeCurrency === 'EUR' ? 1 : ratesCache[activeCurrency];
        var dict = getCurrentDict();
        if (!rate) return;
        var commercialBudget = Boolean(budgetEl.dataset && budgetEl.dataset.staticOptions === 'true');
        var consultationLabel = dict.q_budget_1 || 'Consultation only for now';

        var labels = commercialBudget ? [
          dict.q_select_one || 'Select',
          consultationLabel + ' · ' + fmt(ranges.consultation[0] * rate, activeCurrency) + ' + ' + fmt(ranges.consultation[1] * rate, activeCurrency),
          (dict.fx_starter || 'Base package') + ' · ' + formatRange([ranges.starter[0] * rate, ranges.starter[1] * rate], activeCurrency),
          (dict.fx_growth || 'Standard package') + ' · ' + formatRange([ranges.growth[0] * rate, ranges.growth[1] * rate], activeCurrency),
          (dict.fx_premium || 'Premium package') + ' · ' + formatRange([ranges.premium[0] * rate, ranges.premium[1] * rate], activeCurrency),
          dict.q_need_guidance || 'Need guidance'
        ] : [
          dict.q_select_one || 'Select',
          formatRange([ranges.starter[0] * rate, ranges.starter[1] * rate], activeCurrency),
          formatRange([ranges.growth[0] * rate, ranges.growth[1] * rate], activeCurrency),
          formatRange([ranges.premium[0] * rate, ranges.premium[1] * rate], activeCurrency),
          dict.q_need_guidance || 'Need guidance'
        ];

        Array.prototype.forEach.call(budgetEl.options, function (option, index) {
          if (labels[index]) {
            option.textContent = labels[index];
            option.value = labels[index];
          }
        });
        if (!budgetEl.value || budgetEl.selectedIndex === 0) budgetEl.selectedIndex = 0;
      }

      function updateLabels() {
        var dict = getCurrentDict();
        var parent = currencyEl.closest('.fx-widget');
        if (!parent) return;
        [['fx_title', 'fx_title'], ['fx_text', 'fx_text'], ['fx_currency', 'fx_currency'], ['fx_starter', 'fx_starter'], ['fx_growth', 'fx_growth'], ['fx_premium', 'fx_premium'], ['fx_ongoing', 'fx_ongoing']].forEach(function (pair) {
          var el = parent.querySelector('[data-i18n="' + pair[0] + '"]');
          if (el && dict[pair[1]]) el.textContent = dict[pair[1]];
        });
      }

      function render(rates, currency, dateText) {
        var activeCurrency = syncCurrencySelection(currency);
        var rate = activeCurrency === 'EUR' ? 1 : rates[activeCurrency];
        var dict = getCurrentDict();
        if (!rate) {
          starterEl.textContent = 'N/A';
          growthEl.textContent = 'N/A';
          premiumEl.textContent = 'N/A';
          ongoingEl.textContent = 'N/A';
          return;
        }

        starterEl.textContent = formatRange([ranges.starter[0] * rate, ranges.starter[1] * rate], activeCurrency);
        growthEl.textContent = formatRange([ranges.growth[0] * rate, ranges.growth[1] * rate], activeCurrency);
        premiumEl.textContent = formatRange([ranges.premium[0] * rate, ranges.premium[1] * rate], activeCurrency);
        ongoingEl.textContent = formatRange([ranges.ongoing[0] * rate, ranges.ongoing[1] * rate], activeCurrency) + ' ' + (dict.month_suffix || '/ month');
        updatedEl.textContent = (dict.fx_updated || 'Rate update:') + ' ' + dateText + ' (base EUR)';
        updateBudgetOptions(activeCurrency);
      }

      function syncCurrencyFromCountry() {
        if (!countryEl || manualCurrencyLock) return;
        var nextCurrency = countryCurrencyMap[app.normalizeCountryName(countryEl.value)];
        if (!nextCurrency) return;
        var activeCurrency = syncCurrencySelection(nextCurrency);
        if (ratesCache) render(ratesCache, activeCurrency, dateCache);
      }

      async function loadRemoteRates() {
        var resp = await fetch(remoteEndpoint, { cache: 'no-store' });
        if (!resp.ok) throw new Error('Remote FX unavailable');
        return resp.json();
      }

      async function loadLocalRates() {
        var resp = await fetch(localRatesPath, { cache: 'no-store' });
        if (!resp.ok) throw new Error('Local FX unavailable');
        return resp.json();
      }

      async function loadRates() {
        if (fxMode === 'remote-first') {
          try {
            return await loadRemoteRates();
          } catch (remoteErr) {
            return loadLocalRates();
          }
        }
        return loadLocalRates();
      }

      window.__cds_update_fx_labels = function () {
        updateLabels();
        if (ratesCache) render(ratesCache, currencyEl.value || getDefaultCurrency(), dateCache || new Date().toISOString());
      };

      try {
        var data = await loadRates();
        ratesCache = data.rates || {};
        ratesCache.EUR = 1;
        dateCache = data.date || data.fetched_at_utc || new Date().toISOString();
        refreshCurrencyOptions();
        updateLabels();
        render(ratesCache, getDefaultCurrency(), dateCache);
        currencyEl.addEventListener('change', function () {
          manualCurrencyLock = true;
          render(ratesCache, currencyEl.value, dateCache);
        });
        if (countryEl) {
          countryEl.addEventListener('input', syncCurrencyFromCountry);
          countryEl.addEventListener('change', syncCurrencyFromCountry);
        }
        syncCurrencyFromCountry();
      } catch (err) {
        updatedEl.textContent = 'Rate update unavailable. Use EUR baseline.';
      }
    }

    return {
      init: init
    };
  };
})();
