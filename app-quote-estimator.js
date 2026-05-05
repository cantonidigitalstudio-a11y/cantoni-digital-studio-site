(function () {
  var app = window.CDSApp || {};

  app.createQuoteEstimatorModule = function (i18nModule) {
    var projectTypes = {
      site: {
        key: 'qe_project_site',
        base: [1200, 4500],
        timelines: {
          lean: '2-4 weeks',
          business: '4-7 weeks',
          advanced: '7-11 weeks',
          platform: '10-16 weeks'
        }
      },
      ecommerce: {
        key: 'qe_project_ecommerce',
        base: [4000, 14000],
        timelines: {
          lean: '6-10 weeks',
          business: '8-14 weeks',
          advanced: '12-22 weeks',
          platform: '20-34 weeks'
        }
      },
      webapp: {
        key: 'qe_project_webapp',
        base: [6500, 26000],
        timelines: {
          lean: '8-14 weeks',
          business: '12-22 weeks',
          advanced: '18-34 weeks',
          platform: '32+ weeks'
        }
      },
      mobileapp: {
        key: 'qe_project_mobileapp',
        base: [9000, 55000],
        timelines: {
          lean: '10-18 weeks',
          business: '16-30 weeks',
          advanced: '24-44 weeks',
          platform: '40+ weeks'
        }
      }
    };

    var complexityMultipliers = {
      lean: 0.82,
      business: 1,
      advanced: 1.55,
      platform: 2.35
    };

    var scaleMultipliers = {
      small: 0.92,
      medium: 1,
      large: 1.35,
      enterprise: 1.72
    };

    var urgencyMultipliers = {
      standard: 1,
      fast: 1.15,
      sprint: 1.3
    };

    var readinessMultipliers = {
      ready: 1,
      partial: 1.1,
      unclear: 1.2
    };

    var featureCosts = {
      payments: [500, 1800],
      booking: [900, 2800],
      auth: [900, 3800],
      admin: [1500, 6500],
      automations: [800, 3500],
      multilingual: [500, 2200],
      analytics: [450, 1500],
      content: [700, 2600],
      ai: [1800, 9000],
      appstores: [1200, 3800]
    };

    var featureLabels = {
      payments: 'qe_feature_payments',
      booking: 'qe_feature_booking',
      auth: 'qe_feature_auth',
      admin: 'qe_feature_admin',
      automations: 'qe_feature_automations',
      multilingual: 'qe_feature_multilingual',
      analytics: 'qe_feature_analytics',
      content: 'qe_feature_content',
      ai: 'qe_feature_ai',
      appstores: 'qe_feature_appstores'
    };

    function getDict() {
      return i18nModule && i18nModule.getCurrentDict ? i18nModule.getCurrentDict() : app.baseEN;
    }

    function text(key, fallback) {
      var dict = getDict();
      return dict[key] || app.baseEN[key] || fallback || key;
    }

    function money(value) {
      var rounded = Math.max(0, Math.round(Number(value || 0) / 250) * 250);
      return new Intl.NumberFormat(document.documentElement.lang || 'it', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }).format(rounded);
    }

    function formatTimeline(value) {
      return String(value || '').replace('weeks', text('qe_weeks_suffix', 'weeks'));
    }

    function selectedValue(id, fallback) {
      var el = document.getElementById(id);
      return el && el.value ? el.value : fallback;
    }

    function selectedFeatures() {
      return Array.prototype.filter.call(document.querySelectorAll('[data-estimate-feature]'), function (input) {
        return input.checked;
      }).map(function (input) {
        return input.value;
      });
    }

    function getReadiness() {
      var form = document.getElementById('quoteForm');
      var field = form && form.elements ? form.elements.namedItem('materialsReady') : null;
      var value = String(field && field.value ? field.value : '').toLowerCase();
      if (/ready|pront|bereit|listas|prêt|準備|तैयार/.test(value)) return 'ready';
      if (/some|alcun|parcial|partiel|teil|need|guidance|orient|guida|hilfe/.test(value)) return 'partial';
      return 'unclear';
    }

    function calculateEstimate() {
      var projectKey = selectedValue('estimateProjectType', 'site');
      var complexityKey = selectedValue('estimateComplexity', 'business');
      var scaleKey = selectedValue('estimateScale', 'medium');
      var urgencyKey = selectedValue('estimateUrgency', 'standard');
      var readinessKey = getReadiness();
      var project = projectTypes[projectKey] || projectTypes.site;
      var features = selectedFeatures();
      var multiplier =
        (complexityMultipliers[complexityKey] || 1) *
        (scaleMultipliers[scaleKey] || 1) *
        (urgencyMultipliers[urgencyKey] || 1) *
        (readinessMultipliers[readinessKey] || 1);
      var low = project.base[0] * multiplier;
      var high = project.base[1] * multiplier;

      features.forEach(function (feature) {
        var cost = featureCosts[feature] || [0, 0];
        low += cost[0];
        high += cost[1];
      });

      if (projectKey === 'mobileapp' && features.indexOf('appstores') === -1) {
        low += featureCosts.appstores[0];
        high += featureCosts.appstores[1];
        features.push('appstores');
      }

      low = Math.max(1000, Math.round(low / 250) * 250);
      high = Math.max(low + 1000, Math.round(high / 250) * 250);

      return {
        projectKey: projectKey,
        complexityKey: complexityKey,
        scaleKey: scaleKey,
        urgencyKey: urgencyKey,
        readinessKey: readinessKey,
        low: low,
        high: high,
        timeline: project.timelines[complexityKey] || project.timelines.business,
        features: features
      };
    }

    function recommendation(estimate) {
      if (estimate.projectKey === 'mobileapp' || estimate.projectKey === 'webapp' || estimate.high >= 15000) {
        return text('qe_path_discovery', 'Phase 1 consultation + written technical scope before build.');
      }
      if (estimate.high >= 7000) {
        return text('qe_path_scope', 'Written scope first, then milestone-based project payment.');
      }
      return text('qe_path_direct', 'Direct package possible after written scope confirmation.');
    }

    function complexityNote(estimate) {
      var selected = estimate.features.map(function (feature) {
        return text(featureLabels[feature], feature);
      });
      if (!selected.length) return text('qe_note_no_features', 'Base estimate without extra modules. Add features to see the scope move.');
      return text('qe_note_features', 'Included complexity drivers:') + ' ' + selected.join(', ') + '.';
    }

    function syncHiddenFields(estimate) {
      var instantEstimate = document.getElementById('instantEstimateField');
      var details = document.getElementById('estimateDetailsField');
      var rangeText = money(estimate.low) + ' - ' + money(estimate.high);
      var summary = {
        projectType: text(projectTypes[estimate.projectKey].key, estimate.projectKey),
        complexity: text('qe_complexity_' + estimate.complexityKey, estimate.complexityKey),
        scale: text('qe_scale_' + estimate.scaleKey, estimate.scaleKey),
        urgency: text('qe_urgency_' + estimate.urgencyKey, estimate.urgencyKey),
        readiness: estimate.readinessKey,
        range: rangeText,
        timeline: formatTimeline(estimate.timeline),
        path: recommendation(estimate),
        features: estimate.features.map(function (feature) {
          return text(featureLabels[feature], feature);
        })
      };

      if (instantEstimate) instantEstimate.value = rangeText;
      if (details) details.value = JSON.stringify(summary);
      window.__cds_estimate_current = summary;
    }

    function render() {
      var rangeEl = document.getElementById('estimateRange');
      var timelineEl = document.getElementById('estimateTimeline');
      var pathEl = document.getElementById('estimatePath');
      var depositEl = document.getElementById('estimateDeposit');
      var noteEl = document.getElementById('estimateComplexityNote');
      if (!rangeEl || !timelineEl || !pathEl || !depositEl || !noteEl) return;

      var estimate = calculateEstimate();
      var rangeText = money(estimate.low) + ' - ' + money(estimate.high);
      var depositLow = Math.round(estimate.low * 0.3 / 250) * 250;
      var depositHigh = Math.round(estimate.high * 0.3 / 250) * 250;

      rangeEl.textContent = rangeText;
      timelineEl.textContent = formatTimeline(estimate.timeline);
      pathEl.textContent = recommendation(estimate);
      depositEl.textContent = money(depositLow) + ' - ' + money(depositHigh) + ' ' + text('qe_deposit_suffix', 'suggested 30% kickoff range');
      noteEl.textContent = complexityNote(estimate);
      syncHiddenFields(estimate);
    }

    function bind() {
      document.querySelectorAll('[data-estimate-input], [data-estimate-feature]').forEach(function (el) {
        el.addEventListener('change', render);
        el.addEventListener('input', render);
      });

      var form = document.getElementById('quoteForm');
      if (form && form.elements) {
        var materials = form.elements.namedItem('materialsReady');
        if (materials) materials.addEventListener('change', render);
      }

      var picker = document.getElementById('langPicker');
      if (picker) picker.addEventListener('change', function () {
        window.setTimeout(render, 40);
        window.setTimeout(render, 240);
      });
    }

    function init() {
      if (!document.getElementById('quoteEstimator')) return;
      bind();
      render();
    }

    return {
      init: init,
      render: render
    };
  };
})();
