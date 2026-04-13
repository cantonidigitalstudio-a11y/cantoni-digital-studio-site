(function () {
  var SUPPORTED_LANGS = ['en', 'es', 'it', 'fr', 'de', 'pt', 'ru', 'zh'];

  function currentLang() {
    try {
      var queryLang = new URLSearchParams(window.location.search).get('lang');
      if (queryLang && SUPPORTED_LANGS.indexOf(queryLang) !== -1) return queryLang;
    } catch (error) {}
    var htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang && SUPPORTED_LANGS.indexOf(htmlLang) !== -1) return htmlLang;
    try {
      var stored = window.localStorage.getItem('vip_lang');
      if (stored && SUPPORTED_LANGS.indexOf(stored) !== -1) return stored;
    } catch (error) {}
    return 'en';
  }

  function seoConfig() {
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipSeo ? window.CDS_CONFIG.vipSeo : {};
    return {
      productionHosts: Array.isArray(raw.productionHosts) ? raw.productionHosts : [],
      defaultNoIndexHosts: Array.isArray(raw.defaultNoIndexHosts) ? raw.defaultNoIndexHosts : ['localhost', '127.0.0.1']
    };
  }

  function hostMatches(host, needle) {
    return host === needle || host.slice(-(needle.length + 1)) === '.' + needle;
  }

  function isPreviewHost() {
    var config = seoConfig();
    var host = String(window.location.hostname || '').toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1') return true;
    return config.defaultNoIndexHosts.some(function (needle) {
      return hostMatches(host, String(needle || '').toLowerCase());
    });
  }

  function canonicalBaseOrigin() {
    var config = seoConfig();
    if (isPreviewHost()) return window.location.origin;
    if (config.productionHosts.length) {
      return 'https://' + String(config.productionHosts[0]).replace(/^https?:\/\//, '');
    }
    return window.location.origin;
  }

  function pagePath() {
    return window.location.pathname || '/';
  }

  function buildLocalizedUrl(lang) {
    var url = new URL(pagePath(), canonicalBaseOrigin());
    if (lang && lang !== 'en') {
      url.searchParams.set('lang', lang);
    }
    return url.toString();
  }

  function forceNoIndex() {
    var meta = document.head.querySelector('meta[name="robots"][data-vip-force-noindex]');
    return Boolean(meta && meta.getAttribute('data-vip-force-noindex') === 'true');
  }

  function ensureMeta(selector, factory) {
    var node = document.head.querySelector(selector);
    if (node) return node;
    node = factory();
    document.head.appendChild(node);
    return node;
  }

  function sync() {
    var lang = currentLang();
    var preview = isPreviewHost();
    var lockedNoIndex = forceNoIndex();
    var shouldNoIndex = preview || lockedNoIndex;
    var canonical = buildLocalizedUrl(lang);

    var canonicalLink = ensureMeta('link[rel="canonical"]', function () {
      var link = document.createElement('link');
      link.rel = 'canonical';
      return link;
    });
    canonicalLink.setAttribute('href', canonical);

    var robots = ensureMeta('meta[name="robots"]', function () {
      var meta = document.createElement('meta');
      meta.name = 'robots';
      return meta;
    });
    robots.setAttribute('content', shouldNoIndex
      ? 'noindex,nofollow,noarchive,max-image-preview:standard'
      : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');

    var ogUrl = ensureMeta('meta[property="og:url"]', function () {
      var meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      return meta;
    });
    ogUrl.setAttribute('content', canonical);

    document.querySelectorAll('link[data-vip-hreflang]').forEach(function (node) {
      node.parentNode.removeChild(node);
    });

    if (!shouldNoIndex) {
      SUPPORTED_LANGS.forEach(function (locale) {
        var link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = locale;
        link.href = buildLocalizedUrl(locale);
        link.setAttribute('data-vip-hreflang', 'true');
        document.head.appendChild(link);
      });
      var fallback = document.createElement('link');
      fallback.rel = 'alternate';
      fallback.hreflang = 'x-default';
      fallback.href = buildLocalizedUrl('en');
      fallback.setAttribute('data-vip-hreflang', 'true');
      document.head.appendChild(fallback);
    }
  }

  window.ExcellentiaVipSeo = {
    sync: sync
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sync);
  } else {
    sync();
  }
})();
