(function () {
  var app = window.CDSApp || {};

  app.createSeoModule = function () {
    function getPageUrl(pageKey) {
      if (pageKey === 'cases') return 'https://cantonidigitalstudio.com/case-studies.html';
      if (pageKey === 'quote') return 'https://cantonidigitalstudio.com/preventivo.html';
      if (pageKey === 'studio') return 'https://cantonidigitalstudio.com/studio.html';
      return 'https://cantonidigitalstudio.com/';
    }

    function update(dict) {
      var pageKey = app.getPageKey(window.location.pathname);
      var titleKey = pageKey === 'home' ? 'seo_home_title' : pageKey === 'cases' ? 'seo_cases_title' : pageKey === 'quote' ? 'seo_quote_title' : 'seo_studio_title';
      var descKey = pageKey === 'home' ? 'seo_home_desc' : pageKey === 'cases' ? 'seo_cases_desc' : pageKey === 'quote' ? 'seo_quote_desc' : 'seo_studio_desc';
      var title = dict[titleKey] || app.baseEN[titleKey];
      var desc = dict[descKey] || app.baseEN[descKey];
      var url = getPageUrl(pageKey);

      if (title) document.title = title;
      var md = document.getElementById('metaDescription');
      if (md && desc) md.setAttribute('content', desc);
      var ogt = document.getElementById('ogTitle');
      if (ogt && title) ogt.setAttribute('content', title);
      var ogd = document.getElementById('ogDescription');
      if (ogd && desc) ogd.setAttribute('content', desc);
      var ogu = document.getElementById('ogUrl');
      if (ogu) ogu.setAttribute('content', url);
      var twt = document.getElementById('twitterTitle');
      if (twt && title) twt.setAttribute('content', title);
      var twd = document.getElementById('twitterDescription');
      if (twd && desc) twd.setAttribute('content', desc);
    }

    return {
      update: update
    };
  };
})();
