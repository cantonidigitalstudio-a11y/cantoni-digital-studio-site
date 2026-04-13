(function (root) {
  var serviceOrder = ['airport', 'chauffeur', 'tour', 'concierge'];
  var vehicleOrder = ['suv', 'van', 'black'];
  var packageOrder = ['essential', 'signature', 'black'];
  var extraOrder = [
    'champagne',
    'birthdaySetup',
    'birthdayCake',
    'balloons',
    'flowers',
    'fastTrack',
    'childSeat',
    'wifi',
    'ricaJuices',
    'kidsPack',
    'brugal1888',
    'host',
    'photographer',
    'signage'
  ];

  var services = {
    airport: {
      id: 'airport',
      labels: { en: 'Airport transfer' },
      requestMode: 'book_now',
      basePrice: 0,
      assetKey: 'service-airport',
      visual: 'service-media--airport',
      policyFlags: ['deposit_required'],
      routes: [
        { id: 'airport-cap-cana', labels: { en: 'Punta Cana Airport -> Cap Cana' }, price: 35, assetKey: 'route-cap-cana' },
        { id: 'airport-bavaro', labels: { en: 'Punta Cana Airport -> Bavaro' }, price: 39, assetKey: 'route-bavaro' },
        { id: 'airport-uvero-alto', labels: { en: 'Punta Cana Airport -> Uvero Alto' }, price: 69, assetKey: 'route-uvero-alto' },
        { id: 'airport-la-romana', labels: { en: 'Punta Cana Airport -> La Romana' }, price: 120, assetKey: 'route-la-romana' }
      ]
    },
    chauffeur: {
      id: 'chauffeur',
      labels: { en: 'Hourly chauffeur' },
      requestMode: 'book_now',
      basePrice: 240,
      assetKey: 'service-chauffeur',
      visual: 'service-media--chauffeur',
      policyFlags: ['deposit_required'],
      routes: [
        { id: 'chauffeur-4h', labels: { en: '4 hours private coverage' }, price: 0, assetKey: 'coverage-4h' },
        { id: 'chauffeur-6h', labels: { en: '6 hours private coverage' }, price: 120, assetKey: 'coverage-6h' },
        { id: 'chauffeur-8h', labels: { en: '8 hours private coverage' }, price: 245, assetKey: 'coverage-8h' },
        { id: 'chauffeur-12h', labels: { en: '12 hours full-day coverage' }, price: 420, assetKey: 'coverage-12h' }
      ]
    },
    tour: {
      id: 'tour',
      labels: { en: 'Private tour' },
      requestMode: 'quote_first',
      basePrice: 420,
      assetKey: 'service-tour',
      visual: 'service-media--tour',
      policyFlags: ['quote_required'],
      routes: [
        { id: 'tour-cap-cana-day', labels: { en: 'Cap Cana luxury coastline day' }, price: 0, assetKey: 'tour-cap-cana' },
        { id: 'tour-santo-domingo-day', labels: { en: 'Santo Domingo private city day' }, price: 185, assetKey: 'tour-santo-domingo' },
        { id: 'tour-la-romana-day', labels: { en: 'La Romana premium coast and marina' }, price: 220, assetKey: 'tour-la-romana' },
        { id: 'tour-custom-day', labels: { en: 'Custom full-day route' }, price: 285, assetKey: 'tour-custom' }
      ]
    },
    concierge: {
      id: 'concierge',
      labels: { en: 'Celebration concierge' },
      requestMode: 'quote_first',
      basePrice: 180,
      assetKey: 'service-concierge',
      visual: 'service-media--concierge',
      policyFlags: ['quote_required'],
      routes: [
        { id: 'concierge-birthday-arrival', labels: { en: 'Birthday arrival setup' }, price: 0, assetKey: 'concierge-birthday' },
        { id: 'concierge-dinner-surprise', labels: { en: 'Hotel, dinner and surprise coordination' }, price: 95, assetKey: 'concierge-dinner' },
        { id: 'concierge-weekend-planning', labels: { en: 'Weekend celebration planning' }, price: 145, assetKey: 'concierge-weekend' },
        { id: 'concierge-full-service', labels: { en: 'Full celebration concierge' }, price: 230, assetKey: 'concierge-full' }
      ]
    }
  };

  var vehicles = {
    suv: {
      id: 'suv',
      labels: { en: 'Premium-SUV' },
      price: 0,
      multiplier: 1,
      assetKey: 'vehicle-suv',
      visual: 'vehicle-suv'
    },
    van: {
      id: 'van',
      labels: { en: 'Premium-Van' },
      price: 0,
      multiplier: 1.18,
      assetKey: 'vehicle-van',
      visual: 'vehicle-van'
    },
    black: {
      id: 'black',
      labels: { en: 'Black-Signature' },
      price: 0,
      multiplier: 1.36,
      assetKey: 'vehicle-black',
      visual: 'vehicle-black'
    }
  };

  var packages = {
    essential: {
      id: 'essential',
      labels: { en: 'Essential package' },
      price: 0,
      multiplier: 1,
      assetKey: 'package-essential',
      visual: 'package-media--essential',
      policyFlags: []
    },
    signature: {
      id: 'signature',
      labels: { en: 'Signature package' },
      price: 0,
      multiplier: 1.08,
      assetKey: 'package-signature',
      visual: 'package-media--signature',
      policyFlags: []
    },
    black: {
      id: 'black',
      labels: { en: 'Black package' },
      price: 0,
      multiplier: 1.34,
      assetKey: 'package-black',
      visual: 'package-media--black',
      policyFlags: []
    }
  };

  var extras = {
    champagne: {
      id: 'champagne',
      labels: { en: 'Moet arrival set' },
      price: 110,
      requestMode: 'quote_first',
      assetKey: 'extra-champagne',
      visual: 'extra-media--champagne',
      eligibleServices: ['airport', 'chauffeur', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval', 'adult_only']
    },
    birthdaySetup: {
      id: 'birthdaySetup',
      labels: { en: 'Celebration arrival styling' },
      price: 135,
      requestMode: 'quote_first',
      assetKey: 'extra-arrival-styling',
      visual: 'extra-media--birthday',
      eligibleServices: ['airport', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval']
    },
    birthdayCake: {
      id: 'birthdayCake',
      labels: { en: 'Celebration cake and candles' },
      price: 95,
      requestMode: 'quote_first',
      assetKey: 'extra-cake',
      visual: 'extra-media--cake',
      eligibleServices: ['airport', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval', 'perishable']
    },
    balloons: {
      id: 'balloons',
      labels: { en: 'Balloon styling and welcome sign' },
      price: 48,
      requestMode: 'quote_first',
      assetKey: 'extra-balloons',
      visual: 'extra-media--balloons',
      eligibleServices: ['airport', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval']
    },
    flowers: {
      id: 'flowers',
      labels: { en: 'Celebration bouquet' },
      price: 70,
      requestMode: 'quote_first',
      assetKey: 'extra-flowers',
      visual: 'extra-media--flowers',
      eligibleServices: ['airport', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval', 'perishable']
    },
    fastTrack: {
      id: 'fastTrack',
      labels: { en: 'Airport fast-track coordination' },
      price: 150,
      requestMode: 'quote_first',
      assetKey: 'extra-fasttrack',
      visual: 'extra-media--fasttrack',
      eligibleServices: ['airport'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval']
    },
    childSeat: {
      id: 'childSeat',
      labels: { en: 'Child seat request' },
      price: 25,
      requestMode: 'quote_first',
      assetKey: 'extra-child-seat',
      visual: 'extra-media--childseat',
      eligibleServices: ['airport', 'chauffeur', 'tour'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval']
    },
    wifi: {
      id: 'wifi',
      labels: { en: 'Dominican welcome juice' },
      price: 18,
      requestMode: 'quote_first',
      assetKey: 'extra-welcome-juice',
      visual: 'extra-media--wifi',
      eligibleServices: ['airport', 'chauffeur', 'tour', 'concierge'],
      policyFlags: ['prepared_refreshment', 'non_refundable_after_approval']
    },
    ricaJuices: {
      id: 'ricaJuices',
      labels: { en: 'Dominican juice assortment' },
      price: 26,
      requestMode: 'quote_first',
      assetKey: 'extra-juice-set',
      visual: 'extra-media--rica',
      eligibleServices: ['airport', 'chauffeur', 'tour', 'concierge'],
      policyFlags: ['prepared_refreshment', 'non_refundable_after_approval']
    },
    kidsPack: {
      id: 'kidsPack',
      labels: { en: 'Kids refreshment kit' },
      price: 18,
      requestMode: 'quote_first',
      assetKey: 'extra-kids-refreshment',
      visual: 'extra-media--kids',
      eligibleServices: ['airport', 'chauffeur', 'tour'],
      policyFlags: ['prepared_refreshment', 'non_refundable_after_approval']
    },
    brugal1888: {
      id: 'brugal1888',
      labels: { en: 'Brugal 1888 celebration bottle' },
      price: 145,
      requestMode: 'quote_first',
      assetKey: 'extra-brugal-1888',
      visual: 'extra-media--brugal',
      eligibleServices: ['airport', 'chauffeur', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval', 'adult_only']
    },
    host: {
      id: 'host',
      labels: { en: 'Bilingual host assistance' },
      price: 120,
      requestMode: 'quote_first',
      assetKey: 'extra-host',
      visual: 'extra-media--host',
      eligibleServices: ['airport', 'tour', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval']
    },
    photographer: {
      id: 'photographer',
      labels: { en: 'Photo and reels coverage' },
      price: 65,
      requestMode: 'quote_first',
      assetKey: 'extra-photo-reels',
      visual: 'extra-media--photographer',
      eligibleServices: ['airport', 'tour', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval']
    },
    signage: {
      id: 'signage',
      labels: { en: 'Personalized arrival sign' },
      price: 35,
      requestMode: 'quote_first',
      assetKey: 'extra-signage',
      visual: 'extra-media--signage',
      eligibleServices: ['airport', 'concierge'],
      policyFlags: ['sourced_custom', 'non_refundable_after_approval']
    }
  };

  function serviceIdsForRequestMode(requestMode) {
    return serviceOrder.filter(function (serviceId) {
      return services[serviceId] && services[serviceId].requestMode === requestMode;
    });
  }

  function normalizeExtraIds(extraIds) {
    return Array.isArray(extraIds) ? extraIds.filter(function (extraId) {
      return Object.prototype.hasOwnProperty.call(extras, extraId);
    }) : [];
  }

  root.ExcellentiaVipCatalog = {
    version: 'vip-catalog-v1',
    currency: 'USD',
    serviceOrder: serviceOrder.slice(),
    vehicleOrder: vehicleOrder.slice(),
    packageOrder: packageOrder.slice(),
    extraOrder: extraOrder.slice(),
    services: services,
    vehicles: vehicles,
    packages: packages,
    extras: extras,
    requestModeForService: function (serviceId) {
      return services[serviceId] && services[serviceId].requestMode === 'book_now' ? 'book_now' : 'quote_first';
    },
    serviceIdsForRequestMode: serviceIdsForRequestMode,
    routeIdForService: function (serviceId, routeIndex) {
      var service = services[serviceId];
      if (!service || !Array.isArray(service.routes) || !service.routes.length) return '';
      var route = service.routes[routeIndex] || service.routes[0];
      return route && route.id ? route.id : '';
    },
    nonRefundableExtraIds: function (extraIds) {
      return normalizeExtraIds(extraIds).filter(function (extraId) {
        var flags = extras[extraId] && Array.isArray(extras[extraId].policyFlags) ? extras[extraId].policyFlags : [];
        return flags.indexOf('non_refundable_after_approval') !== -1;
      });
    },
    selectedPolicyFlags: function (extraIds) {
      var flags = [];
      normalizeExtraIds(extraIds).forEach(function (extraId) {
        var extraFlags = extras[extraId] && Array.isArray(extras[extraId].policyFlags) ? extras[extraId].policyFlags : [];
        extraFlags.forEach(function (flag) {
          if (flags.indexOf(flag) === -1) {
            flags.push(flag);
          }
        });
      });
      return flags;
    }
  };
})(window);
