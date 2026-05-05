(function () {
  var app = window.CDSApp || {};

  app.createI18nModule = function (state, seoModule) {
    async function loadFromFile() {
      try {
        var resp = await fetch('i18n.json', { cache: 'no-store' });
        if (!resp.ok) return;
        var data = await resp.json();
        var loadedLangs = (data && data.langs) || [];
        var loaded = (data && data.translations) || {};
        Object.keys(loaded).forEach(function (lang) {
          state.translations[lang] = app.build(loaded[lang], state.translations[lang] || {});
        });
        state.langs = loadedLangs.length ? loadedLangs.slice() : Object.keys(state.translations);
      } catch (e) {}
    }

    function ensureLanguageDict(lang) {
      return state.translations[lang] || state.translations.en || app.baseEN;
    }

    function hasHtml(value) {
      return /<[^>]+>/.test(String(value || ''));
    }

    function setContent(el, value) {
      if (!el) return;

      if (el.tagName === 'LABEL' && el.querySelector('input, textarea, select')) {
        var labelText = el.querySelector('[data-i18n-label]');
        if (!labelText) {
          labelText = document.createElement('span');
          labelText.setAttribute('data-i18n-label', 'true');
        }
        var controls = Array.prototype.filter.call(el.childNodes, function (node) {
          return node.nodeType === 1 && /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName);
        });
        controls.forEach(function (node) {
          if (node.parentNode === el) el.removeChild(node);
        });
        while (el.firstChild) el.removeChild(el.firstChild);
        el.appendChild(labelText);
        controls.forEach(function (node) { el.appendChild(node); });
        labelText.textContent = String(value || '');
        return;
      }

      if (el.tagName === 'OPTION' || !hasHtml(value)) {
        el.textContent = String(value || '');
        return;
      }

      el.innerHTML = value;
    }

    function getCurrentDict() {
      return window.__cds_dict || state.translations.en || app.baseEN;
    }

    function applyDict(lang, dict) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (dict[key]) setContent(el, dict[key]);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.setAttribute('placeholder', dict[key]);
      });
      document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-aria-label');
        if (dict[key]) el.setAttribute('aria-label', dict[key]);
      });
      try { localStorage.setItem('cds_lang', lang); } catch (e) {}
      window.__cds_dict = dict;
      seoModule.update(dict);
    }

    async function enrichMissingKeys(lang, dict) {
      return dict;
    }

    async function setLanguage(lang) {
      var dict = ensureLanguageDict(lang);
      applyDict(lang, dict);
      if (typeof window.__cds_update_fx_labels === 'function') window.__cds_update_fx_labels();

      var enriched = await enrichMissingKeys(lang, dict);
      state.translations[lang] = enriched;
      applyDict(lang, enriched);
      if (typeof window.__cds_update_fx_labels === 'function') window.__cds_update_fx_labels();
    }

    function init() {
      var picker = document.getElementById('langPicker');
      var stored = null;
      try { stored = localStorage.getItem('cds_lang'); } catch (e) {}
      var browser = (navigator.language || 'it').slice(0, 2).toLowerCase();
      var urlLang = null;
      try { urlLang = new URLSearchParams(window.location.search).get('lang'); } catch (e) {}
      var current = urlLang || stored || (state.langs.indexOf(browser) !== -1 ? browser : 'en');

      if (picker) {
        picker.value = current;
        picker.addEventListener('change', function () {
          current = picker.value;
          setLanguage(current);
        });
      }

      loadFromFile().finally(function () {
        if (picker && state.langs.indexOf(current) === -1) {
          current = 'en';
          picker.value = current;
        }
        setLanguage(current);
      });
    }

    return {
      init: init,
      getCurrentDict: getCurrentDict
    };
  };
})();
