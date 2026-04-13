(function () {
  var money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
  var CART_STORAGE_KEY = 'vip_booking_cart_v1';
  var INTAKE_STORAGE_KEY = 'vip_booking_intake_v1';
  var LEDGER_STORAGE_KEY = 'vip_booking_admin_ledger_v1';
  var STRUCTURED_CAPTURE_STORAGE_KEY = 'vip_booking_capture_cache_v1';
  var CUSTOMER_SESSION_STORAGE_KEY = 'vip_customer_session_v1';
  var CUSTOMER_PROFILE_STORAGE_KEY = 'vip_customer_profile_v1';
  var CUSTOMER_OFFER_STORAGE_KEY = 'vip_customer_offer_v1';
  var BOOKING_EMAIL = 'excellentiavip@gmail.com';
  var WHATSAPP_BASE = 'https://wa.me/';
  var DEFAULT_ROUTING_CONFIG = {
    bookingEmail: BOOKING_EMAIL,
    ownerName: 'Excellentia VIP Reservations',
    ownerEmail: '',
    ownerWhatsapp: '',
    ownerWhatsappDisplay: ''
  };
  var DEFAULT_STRIPE_CONFIG = {
    enabled: false,
    checkoutEndpoint: '/api/payments/cardnet/session',
    merchantName: 'Excellentia VIP',
    currency: 'usd',
    depositPercent: 30,
    successPath: '/excellentia-vip-booking.html',
    cancelPath: '/excellentia-vip-booking.html'
  };
  var DEFAULT_ACCOUNT_CONFIG = {
    profileEndpoint: '/api/account/profile',
    bookingsEndpoint: '/api/account/bookings',
    leadsEndpoint: '/api/leads/capture',
    offersEndpoint: '/api/offers/claim',
    sessionStorageKey: CUSTOMER_SESSION_STORAGE_KEY,
    accountPath: '/excellentia-vip-account.html'
  };
  var DEFAULT_BOOKINGS_CONFIG = {
    enabled: false,
    createEndpoint: '/api/bookings/create',
    adminEndpoint: '/api/bookings/records',
    adminSessionStorageKey: 'vip_admin_api_key_v1',
    dedupeWindowMinutes: 360
  };

  function currentLang() {
    try {
      var queryLang = new URLSearchParams(window.location.search).get('lang');
      if (queryLang) return queryLang;
    } catch (error) {}
    return localStorage.getItem('vip_lang') || 'en';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var bookingCopy = {
    en: {
      services: {
        airport: { label: 'Airport transfer', description: 'Private airport arrival or departure with concierge-grade handling.', kicker: 'Arrival', routes: ['Punta Cana Airport -> Cap Cana', 'Punta Cana Airport -> Bavaro', 'Punta Cana Airport -> Uvero Alto', 'Punta Cana Airport -> La Romana'] },
        chauffeur: { label: 'Hourly chauffeur', description: 'Private driver for executive, leisure or flexible schedule coverage.', kicker: 'Private driver', routes: ['4 hours private coverage', '6 hours private coverage', '8 hours private coverage', '12 hours full-day coverage'] },
        tour: { label: 'Private tour', description: 'Curated private route with premium transport and custom timing.', kicker: 'Experience', routes: ['Cap Cana luxury coastline day', 'Santo Domingo private city day', 'La Romana premium coast and marina', 'Custom full-day route'] },
        concierge: { label: 'Celebration concierge', description: 'Birthday, anniversary and arrival setup with high-touch pre-arrival coordination.', kicker: 'Celebrations', routes: ['Birthday arrival setup', 'Hotel, dinner and surprise coordination', 'Weekend celebration planning', 'Full celebration concierge'] }
      },
      vehicles: {
        suv: { label: 'Premium-SUV', note: 'For 2-4 guests' },
        van: { label: 'Premium-Van', note: 'For families and group comfort' },
        black: { label: 'Black-Signature', note: 'For the highest-tier arrival feel' }
      },
      packages: {
        essential: { label: 'Essential package', note: 'Clean premium transport setup', detail: 'Private vehicle, polished arrival and a clear request recap.' },
        signature: { label: 'Signature package', note: 'Best balance of comfort and upgrades', detail: 'Best-selling balance of comfort, upgrades and visual premium feel.' },
        black: { label: 'Black package', note: 'Highest-tier booking proposition', detail: 'Top-tier arrival framing with stronger add-ons and premium image.' }
      },
      extras: {
        champagne: { label: 'Moet arrival set', shortLabel: 'Moet arrival', note: '$110', detail: 'Moet prepared on board for anniversaries, honeymoon and black-tier arrivals.' },
        birthdaySetup: { label: 'Celebration arrival styling', shortLabel: 'Arrival styling', note: '$135', detail: 'Candles, ribbons and curated styling prepared before the guest arrives.' },
        birthdayCake: { label: 'Celebration cake and candles', shortLabel: 'Cake + candles', note: '$95', detail: 'Birthday or anniversary cake presented as part of the arrival reveal.' },
        balloons: { label: 'Balloon styling and welcome sign', shortLabel: 'Balloon styling', note: '$48', detail: 'Balloon styling with a named welcome sign for villa and airport surprises.' },
        flowers: { label: 'Celebration bouquet', shortLabel: 'Celebration bouquet', note: '$70', detail: 'Curated bouquet for birthdays, anniversaries and surprise arrivals.' },
        fastTrack: { label: 'Airport fast-track coordination', shortLabel: 'Fast-track', note: '$150', detail: 'Priority assistance through arrival flow.' },
        childSeat: { label: 'Child seat request', shortLabel: 'Child seat', note: '$25', detail: 'Pre-installed child seat before arrival.' },
        wifi: { label: 'Dominican welcome juice', shortLabel: 'Welcome juice', note: '$18', detail: 'Chilled Dominican juice prepared on board for the arrival moment.' },
        ricaJuices: { label: 'Dominican juice assortment', shortLabel: 'Juice set', note: '$26', detail: 'Curated Dominican juice assortment for families and celebratory arrivals.' },
        kidsPack: { label: 'Kids refreshment kit', shortLabel: 'Kids refreshment', note: '$18', detail: 'Child-friendly refreshment set prepared for family transfers.' },
        brugal1888: { label: 'Brugal 1888 celebration bottle', shortLabel: 'Brugal 1888', note: '$145', detail: 'Premium spirits add-on for adult celebration arrivals.' },
        host: { label: 'Bilingual host assistance', shortLabel: 'Bilingual host', note: '$120', detail: 'Host support for arrival or event coordination.' },
        photographer: { label: 'Photo and reels coverage', shortLabel: 'Photo + reels', note: '$65', detail: 'Light photo and reels coverage for arrivals, surprises and celebration moments.' },
        signage: { label: 'Personalized arrival sign', shortLabel: 'Arrival sign', note: '$35', detail: 'Premium personalized signage for airport meet-and-greet, villa arrival or dinner reveal.' }
      },
      ui: {
        packageTier: 'Package tier',
        premiumAddOn: 'Premium add-on',
        cartTitle: 'Saved selections',
        service: 'Service',
        noSaved: 'No saved selections yet',
        buildFirst: 'Build the first request',
        buildLead: 'Add a transfer, celebration service or extra to start shaping the itinerary.',
        addOns: 'Add-ons',
        vehicle: 'Vehicle',
        package: 'Package',
        guests: 'Guests',
        timing: 'Schedule',
        route: 'Route',
        item: 'Item',
        notes: 'Notes',
        leadName: 'Lead name',
        country: 'Country',
        email: 'Email',
        whatsapp: 'WhatsApp',
        travelDate: 'Arrival or service date',
        travelTime: 'Pickup time',
        pickupPoint: 'Airport, hotel or villa',
        reference: 'Flight, villa or request reference',
        requestMode: 'Request mode',
        contactLine: 'Contact',
        travelMoment: 'Travel moment',
        handoffLabel: 'Contact path',
        handoffLine: 'Send to excellentiavip@gmail.com or continue on WhatsApp.',
        paymentLabel: 'Secure payment',
        paymentTitle: 'Deposit or full payment',
        paymentLeadBook: 'Airport transfers and chauffeur plans can move into secure checkout after the request is complete.',
        paymentLeadQuote: 'Celebrations, tours and custom concierge remain quote-first. Send the request first and confirm payment with the team.',
        paymentSetupReady: 'Checkout ready',
        paymentSetupPending: 'Payment opening soon',
        paymentModeBook: 'Book now',
        paymentModeQuote: 'Ask first',
        paymentNoticeReady: 'Complete the key guest details, then choose deposit or full payment.',
        paymentNoticeMissing: 'Add lead name, country, email, date, time and pickup point before secure checkout opens.',
        paymentNoticePending: 'Secure checkout will activate after the payment setup is configured.',
        paymentNoticeQuote: 'This service stays quote-first. Use email or WhatsApp and let the team confirm the amount before payment.',
        paymentSuccess: 'Payment confirmed. The request can now move into confirmation and dispatch.',
        paymentCancelled: 'Payment was cancelled. The request is still ready to send manually.',
        paymentSelection: 'Current selection',
        paymentDeposit: 'Deposit',
        paymentFull: 'Full amount',
        paymentDepositCta: 'Pay deposit',
        paymentFullCta: 'Pay full amount',
        paymentLoadingDeposit: 'Opening deposit checkout…',
        paymentLoadingFull: 'Opening full checkout…',
        paymentError: 'Secure checkout could not start. Use email or WhatsApp while the payment layer is checked.',
        missingLeadName: 'Lead name still missing',
        missingCountry: 'Country still missing',
        missingContact: 'Email or WhatsApp still missing',
        missingTravel: 'Date or time still missing',
        missingPickup: 'Pickup point still missing',
        noReference: 'No reference added yet',
        bookNow: 'Book now',
        askFirst: 'Ask first',
        selectService: 'Select service',
        selectPackage: 'Select package',
        toggleExtra: 'Toggle extra',
        estimatedConcept: 'Estimated request total',
        itineraryTotal: 'Estimated itinerary total',
        confirm: 'Please confirm availability and next steps.',
        clear: 'Clear itinerary',
        emailCart: 'Send itinerary by email',
        whatsappCart: 'Send itinerary by WhatsApp',
        emailRequest: 'Request by email',
        whatsappRequest: 'Send by WhatsApp',
        copyRequest: 'Copy request',
        copyCart: 'Copy itinerary',
        copied: 'Copied',
        copyFailed: 'Copy failed',
        requestCaptureReady: 'When the request is sent, the same recap is also saved into the shared booking record.',
        requestCaptureCartReady: 'Full itineraries can also be saved into the shared booking record before payment is live.',
        requestCaptureSaving: 'Saving the request into the shared booking record…',
        requestCaptureSuccess: 'Request saved to the shared booking record. Continue in email or WhatsApp.',
        requestCaptureWarning: 'Booking capture is unavailable right now. Continue manually and keep the copied recap.',
        bookingCodeLabel: 'Booking code',
        readinessLabel: 'Request readiness',
        readinessTitleMissing: 'Core guest details still missing',
        readinessTitleReady: 'Request is structurally ready',
        readinessLeadMissing: 'Complete the guest, travel and pickup details so the request can be reviewed and confirmed cleanly.',
        readinessLeadReady: 'Core guest, travel and pickup details are set. You can now send the request with a clean recap and move faster into confirmation.',
        readinessStateReady: 'Locked',
        readinessStateMissing: 'Missing',
        readinessNextAction: 'Next action',
        readinessNextComplete: 'Complete the missing details, then send the request.',
        readinessNextQuote: 'This service stays quote-first. Send the request and let the team confirm the amount before payment.',
        readinessNextSetup: 'Payment activation is still pending. Send the request now and the team will confirm payment next.',
        readinessNextPay: 'The request is ready. Send it now or continue into secure checkout.',
        addToCart: 'Add to itinerary',
        editCart: 'Load into builder',
        duplicateCart: 'Duplicate',
        viewFlow: 'View confirmation flow',
        remove: 'Remove',
        emptyCartTitle: 'No saved selections yet',
        emptyCartLead: 'Build the first request'
      },
      timing: { day: 'Day service', night: 'Night arrival', weekend: 'Weekend / holiday' },
      subject: { request: 'Excellentia VIP booking request', itinerary: 'Excellentia VIP itinerary request' },
      body: { requestPrefix: 'I would like to request the following service:', itineraryPrefix: 'I would like to request the following itinerary:' }
    },
    es: {
      services: {
        airport: { label: 'Traslado aeropuerto', description: 'Llegada o salida privada con trato de concierge.', kicker: 'Llegada', routes: ['Aeropuerto Punta Cana -> Cap Cana', 'Aeropuerto Punta Cana -> Bávaro', 'Aeropuerto Punta Cana -> Uvero Alto', 'Aeropuerto Punta Cana -> La Romana'] },
        chauffeur: { label: 'Chauffeur por horas', description: 'Conductor privado para agenda ejecutiva, ocio o cobertura flexible.', kicker: 'Conductor privado', routes: ['Cobertura privada 4 horas', 'Cobertura privada 6 horas', 'Cobertura privada 8 horas', 'Cobertura completa 12 horas'] },
        tour: { label: 'Tour privado', description: 'Ruta privada curada con transporte premium y horario a medida.', kicker: 'Experiencia', routes: ['Día de costa premium en Cap Cana', 'Día privado por Santo Domingo', 'Costa y marina premium en La Romana', 'Ruta personalizada de día completo'] },
        concierge: { label: 'Concierge de celebración', description: 'Cumpleaños, aniversario y montaje de llegada con coordinación previa de alto contacto.', kicker: 'Celebraciones', routes: ['Montaje de llegada de cumpleaños', 'Coordinación de hotel, cena y sorpresa', 'Planificación de celebración de fin de semana', 'Concierge completo de celebración'] }
      },
      vehicles: {
        suv: { label: 'SUV ejecutivo', note: 'Para 2-4 huéspedes' },
        van: { label: 'Van premium', note: 'Para familias y confort de grupo' },
        black: { label: 'Black Signature', note: 'Para la llegada de nivel más alto' }
      },
      packages: {
        essential: { label: 'Paquete Essential', note: 'Base premium limpia', detail: 'Vehículo privado, llegada cuidada y paso al equipo claro.' },
        signature: { label: 'Paquete Signature', note: 'Mejor equilibrio entre confort y mejoras premium', detail: 'Mejor equilibrio entre confort, mejoras premium y presencia de alto nivel.' },
        black: { label: 'Paquete Black', note: 'Propuesta de nivel más alto', detail: 'Llegada de nivel más alto con extras fuertes e imagen premium.' }
      },
      extras: {
        champagne: { label: 'Set de llegada Moet', shortLabel: 'Llegada Moet', note: '$110', detail: 'Moet preparada a bordo para aniversarios, luna de miel y llegadas de alto nivel.' },
        birthdaySetup: { label: 'Styling de llegada para celebración', shortLabel: 'Styling llegada', note: '$135', detail: 'Velas, cintas y detalles curados para una llegada que se sienta especial.' },
        birthdayCake: { label: 'Torta de celebración y velas', shortLabel: 'Torta + velas', note: '$95', detail: 'Torta de cumpleaños o aniversario presentada como parte del reveal de llegada.' },
        balloons: { label: 'Globos y cartel de bienvenida', shortLabel: 'Globos + cartel', note: '$48', detail: 'Globos coordinados y cartel con nombre para cumpleaños, villas y sorpresas de llegada.' },
        flowers: { label: 'Bouquet de celebración', shortLabel: 'Bouquet', note: '$70', detail: 'Bouquet curado para cumpleaños, aniversarios y llegadas sorpresa.' },
        fastTrack: { label: 'Coordinación fast-track de aeropuerto', shortLabel: 'Fast-track', note: '$150', detail: 'Asistencia prioritaria durante la llegada y el paso del huésped.' },
        childSeat: { label: 'Solicitud de child seat', shortLabel: 'Child seat', note: '$25', detail: 'Child seat instalado antes de la llegada del huésped.' },
        wifi: { label: 'Jugo dominicano de bienvenida', shortLabel: 'Jugo bienvenida', note: '$18', detail: 'Jugo dominicano frío preparado a bordo para el momento de llegada.' },
        ricaJuices: { label: 'Selección de jugos dominicanos', shortLabel: 'Set de jugos', note: '$26', detail: 'Selección curada de jugos dominicanos para familias y llegadas de celebración.' },
        kidsPack: { label: 'Kit infantil de refresco', shortLabel: 'Kit infantil', note: '$18', detail: 'Set infantil preparado para traslados familiares y llegadas con niños.' },
        brugal1888: { label: 'Botella de celebración Brugal 1888', shortLabel: 'Brugal 1888', note: '$145', detail: 'Add-on de destilado premium dominicano para llegadas adultas, villas y celebraciones.' },
        host: { label: 'Asistencia de anfitrión bilingüe', shortLabel: 'Anfitrión bilingüe', note: '$120', detail: 'Soporte de anfitrión para llegada, coordinación con el hotel, sorpresa de cumpleaños o gestión en sitio.' },
        photographer: { label: 'Cobertura de foto y reels', shortLabel: 'Foto + reels', note: '$65', detail: 'Cobertura ligera para llegada, sorpresa o momento de celebración.' },
        signage: { label: 'Cartel personalizado de llegada', shortLabel: 'Cartel llegada', note: '$35', detail: 'Cartel premium con nombre o mensaje para aeropuerto, villa o dinner reveal.' }
      },
      ui: {
        packageTier: 'Nivel del paquete',
        premiumAddOn: 'Extra premium',
        cartTitle: 'Selecciones guardadas',
        service: 'Servicio',
        noSaved: 'Todavía no hay experiencias guardadas',
        buildFirst: 'Construye la primera solicitud premium',
        buildLead: 'Añade un transfer, un servicio de celebración o un add-on premium para empezar a dar forma al itinerario.',
        addOns: 'Extras',
        vehicle: 'Vehículo',
        package: 'Paquete',
        guests: 'Huéspedes',
        timing: 'Horario',
        route: 'Ruta',
        item: 'Ítem',
        notes: 'Notas',
        leadName: 'Nombre del cliente',
        country: 'País',
        email: 'Email',
        whatsapp: 'WhatsApp',
        travelDate: 'Fecha de llegada o servicio',
        travelTime: 'Hora de recogida',
        pickupPoint: 'Aeropuerto, hotel o villa',
        reference: 'Vuelo, villa o referencia',
        requestMode: 'Modo de solicitud',
        contactLine: 'Contacto',
        travelMoment: 'Momento del servicio',
        handoffLabel: 'Ruta de contacto',
        handoffLine: 'Enviar a excellentiavip@gmail.com o seguir por WhatsApp.',
        paymentLabel: 'Pago seguro',
        paymentTitle: 'Depósito o pago total',
        paymentLeadBook: 'Los traslados de aeropuerto y los planes de chauffeur pueden pasar a checkout seguro una vez que la solicitud esté completa.',
        paymentLeadQuote: 'Celebraciones, tours y concierge custom siguen siendo quote-first. Envía la solicitud primero y confirma el pago con el equipo.',
        paymentSetupReady: 'Checkout listo',
        paymentSetupPending: 'Pago disponible pronto',
        paymentModeBook: 'Reserva ahora',
        paymentModeQuote: 'Consulta primero',
        paymentNoticeReady: 'Completa los datos clave del huésped y luego elige depósito o pago total.',
        paymentNoticeMissing: 'Añade nombre, país, email, fecha, hora y punto de recogida antes de abrir el checkout seguro.',
        paymentNoticePending: 'El checkout seguro se activará cuando la configuración de pago esté lista.',
        paymentNoticeQuote: 'Este servicio sigue siendo quote-first. Usa email o WhatsApp y deja que el equipo confirme el monto antes del pago.',
        paymentSuccess: 'Pago confirmado. La solicitud ya puede pasar a confirmación y dispatch.',
        paymentCancelled: 'El pago fue cancelado. La solicitud sigue lista para enviarse manualmente.',
        paymentSelection: 'Selección actual',
        paymentDeposit: 'Depósito',
        paymentFull: 'Pago total',
        paymentDepositCta: 'Pagar depósito',
        paymentFullCta: 'Pagar total',
        paymentLoadingDeposit: 'Abriendo checkout del depósito…',
        paymentLoadingFull: 'Abriendo checkout total…',
        paymentError: 'No se pudo abrir el checkout seguro. Usa email o WhatsApp mientras revisamos la capa de pago.',
        missingLeadName: 'Falta el nombre del cliente',
        missingCountry: 'Falta el país',
        missingContact: 'Falta email o WhatsApp',
        missingTravel: 'Falta fecha u hora',
        missingPickup: 'Falta punto de recogida',
        noReference: 'Todavía sin referencia',
        bookNow: 'Reserva ahora',
        askFirst: 'Consulta primero',
        selectService: 'Seleccionar servicio',
        selectPackage: 'Seleccionar paquete',
        toggleExtra: 'Activar extra',
        estimatedConcept: 'Total estimado del concepto',
        itineraryTotal: 'Total estimado del itinerario',
        confirm: 'Confirma disponibilidad y próximos pasos.',
        clear: 'Vaciar itinerario',
        emailCart: 'Enviar itinerario por email',
        whatsappCart: 'Enviar itinerario por WhatsApp',
        emailRequest: 'Solicitar por email',
        whatsappRequest: 'Enviar por WhatsApp',
        copyRequest: 'Copiar solicitud',
        copyCart: 'Copiar itinerario',
        copied: 'Copiado',
        copyFailed: 'Error al copiar',
        requestCaptureReady: 'Cuando se envía la solicitud, el mismo resumen también queda registrado para el equipo de reservas.',
        requestCaptureCartReady: 'Los itinerarios completos también pueden quedar registrados para el equipo de reservas antes de que el pago esté activo.',
        requestCaptureSaving: 'Guardando la solicitud en el registro compartido…',
        requestCaptureSuccess: 'Solicitud registrada para el equipo de reservas. Continúa por email o WhatsApp.',
        requestCaptureWarning: 'La captura de reservas no está disponible ahora mismo. Continúa manualmente y conserva el resumen copiado.',
        bookingCodeLabel: 'Código de reserva',
        readinessLabel: 'Estado de la solicitud',
        readinessTitleMissing: 'Todavía faltan datos clave del huésped',
        readinessTitleReady: 'La solicitud ya está estructurada',
        readinessLeadMissing: 'Completa los datos del huésped, viaje y recogida para que la solicitud pueda revisarse y confirmarse con claridad.',
        readinessLeadReady: 'Los datos principales del huésped, viaje y recogida ya están completos. Puedes enviar la solicitud con un resumen limpio y avanzar más rápido a confirmación.',
        readinessStateReady: 'Completo',
        readinessStateMissing: 'Falta',
        readinessNextAction: 'Siguiente acción',
        readinessNextComplete: 'Completa los datos faltantes y luego envía la solicitud.',
        readinessNextQuote: 'Este servicio sigue siendo quote-first. Envía la solicitud y deja que el equipo confirme el monto antes del pago.',
        readinessNextSetup: 'La activación del pago todavía está pendiente. Envía la solicitud ahora y el equipo confirmará el pago después.',
        readinessNextPay: 'La solicitud está lista. Envíala ahora o continúa al checkout seguro.',
        addToCart: 'Añadir al itinerario',
        editCart: 'Cargar en el configurador',
        duplicateCart: 'Duplicar',
        viewFlow: 'Ver flujo de confirmación',
        remove: 'Quitar',
        emptyCartTitle: 'Todavía no hay selecciones guardadas',
        emptyCartLead: 'Construye la primera solicitud'
      },
      timing: { day: 'Servicio de día', night: 'Llegada nocturna', weekend: 'Fin de semana / festivo' },
      subject: { request: 'Solicitud de reserva Excellentia VIP', itinerary: 'Solicitud de itinerario Excellentia VIP' },
      body: { requestPrefix: 'Quisiera solicitar el siguiente servicio:', itineraryPrefix: 'Quisiera solicitar el siguiente itinerario:' }
    },
    it: {
      services: {
        airport: { label: 'Transfer aeroportuale', description: 'Arrivo o partenza privata con gestione da concierge.', kicker: 'Arrivo', routes: ['Aeroporto Punta Cana -> Cap Cana', 'Aeroporto Punta Cana -> Bávaro', 'Aeroporto Punta Cana -> Uvero Alto', 'Aeroporto Punta Cana -> La Romana'] },
        chauffeur: { label: 'Chauffeur a ore', description: 'Autista privato per agenda executive, leisure o copertura flessibile.', kicker: 'Autista privato', routes: ['Copertura privata 4 ore', 'Copertura privata 6 ore', 'Copertura privata 8 ore', 'Copertura completa 12 ore'] },
        tour: { label: 'Tour privato', description: 'Itinerario privato curato con trasporto premium e tempi su misura.', kicker: 'Esperienza', routes: ['Giornata luxury sulla costa di Cap Cana', 'Giornata privata a Santo Domingo', 'Costa e marina premium a La Romana', 'Itinerario personalizzato di giornata intera'] },
        concierge: { label: 'Concierge celebrazione', description: 'Compleanno, anniversario e allestimento di arrivo con coordinamento pre-arrivo ad alto contatto.', kicker: 'Celebrazioni', routes: ['Allestimento di arrivo per compleanno', 'Coordinamento hotel, cena e sorpresa', 'Pianificazione celebrazione nel weekend', 'Concierge completo per celebrazioni'] }
      },
      vehicles: {
        suv: { label: 'SUV premium', note: 'Per 2-4 ospiti' },
        van: { label: 'Van premium', note: 'Per famiglie e comfort di gruppo' },
        black: { label: 'Black Signature', note: 'Per l’arrivo di livello più alto' }
      },
      packages: {
        essential: { label: 'Pacchetto Essential', note: 'Configurazione premium essenziale', detail: 'Veicolo privato, arrivo curato e passaggio ospite ordinato.' },
        signature: { label: 'Pacchetto Signature', note: 'Miglior equilibrio tra comfort e upgrade premium', detail: 'Miglior equilibrio tra comfort, upgrade premium e presenza di alto livello.' },
        black: { label: 'Pacchetto Black', note: 'Proposta di livello massimo', detail: 'Arrivo di fascia alta con extra forti e immagine premium.' }
      },
      extras: {
        champagne: { label: 'Set di arrivo Moet', shortLabel: 'Arrivo Moet', note: '$110', detail: 'Moet preparato a bordo per anniversari, luna di miele e arrivi di fascia alta.' },
        birthdaySetup: { label: 'Styling di arrivo celebrativo', shortLabel: 'Styling arrivo', note: '$135', detail: 'Candele, nastri e dettagli curati preparati prima dell’arrivo dell’ospite.' },
        birthdayCake: { label: 'Torta celebrativa e candele', shortLabel: 'Torta + candele', note: '$95', detail: 'Torta di compleanno o anniversario presentata come parte del reveal all’arrivo.' },
        balloons: { label: 'Palloncini e cartello di benvenuto', shortLabel: 'Palloncini + cartello', note: '$48', detail: 'Palloncini coordinati e cartello con nome per villa, pickup e sorprese speciali.' },
        flowers: { label: 'Bouquet celebrativo', shortLabel: 'Bouquet', note: '$70', detail: 'Bouquet curato per compleanni, anniversari e arrivi sorpresa.' },
        fastTrack: { label: 'Coordinamento rapido in aeroporto', shortLabel: 'Corsia rapida', note: '$150', detail: 'Assistenza prioritaria durante l’arrivo e il passaggio ospite.' },
        childSeat: { label: 'Richiesta seggiolino bimbo', shortLabel: 'Seggiolino bimbo', note: '$25', detail: 'Seggiolino installato prima dell’arrivo del cliente.' },
        wifi: { label: 'Succo dominicano di benvenuto', shortLabel: 'Succo benvenuto', note: '$18', detail: 'Succo dominicano fresco preparato a bordo per il momento dell’arrivo.' },
        ricaJuices: { label: 'Selezione di succhi dominicani', shortLabel: 'Set succhi', note: '$26', detail: 'Selezione curata di succhi dominicani per famiglie e arrivi celebrativi.' },
        kidsPack: { label: 'Kit refresh per bambini', shortLabel: 'Kit bambini', note: '$18', detail: 'Set di refresh pensato per transfer familiari e arrivi con bambini.' },
        brugal1888: { label: 'Bottiglia celebrativa Brugal 1888', shortLabel: 'Brugal 1888', note: '$145', detail: 'Extra premium dominicano per celebrazioni e arrivi in villa.' },
        host: { label: 'Assistenza bilingue in accoglienza', shortLabel: 'Accoglienza bilingue', note: '$120', detail: 'Supporto in presenza per arrivo, passaggio in hotel o coordinamento evento.' },
        photographer: { label: 'Copertura foto e reels', shortLabel: 'Foto + reels', note: '$65', detail: 'Copertura leggera per arrivo, sorpresa o momento di celebrazione.' },
        signage: { label: 'Cartello personalizzato all’arrivo', shortLabel: 'Cartello arrivo', note: '$35', detail: 'Cartello premium con nome o messaggio per aeroporto, villa o dinner reveal.' }
      },
      ui: {
        packageTier: 'Livello pacchetto',
        premiumAddOn: 'Extra premium',
        cartTitle: 'Selezioni salvate',
        service: 'Servizio',
        noSaved: 'Nessuna esperienza salvata',
        buildFirst: 'Costruisci la prima richiesta',
        buildLead: 'Aggiungi un transfer, un servizio celebrazione o un extra per iniziare a costruire l’itinerario.',
        addOns: 'Extra',
        vehicle: 'Veicolo',
        package: 'Pacchetto',
        guests: 'Ospiti',
        timing: 'Orario',
        route: 'Tratta',
        item: 'Voce',
        notes: 'Note',
        leadName: 'Nome cliente',
        country: 'Paese',
        email: 'Email',
        whatsapp: 'WhatsApp',
        travelDate: 'Data arrivo o servizio',
        travelTime: 'Orario pickup',
        pickupPoint: 'Aeroporto, hotel o villa',
        reference: 'Volo, villa o riferimento',
        requestMode: 'Modalità richiesta',
        contactLine: 'Contatto',
        travelMoment: 'Momento del servizio',
        handoffLabel: 'Percorso contatto',
        handoffLine: 'Invia a excellentiavip@gmail.com oppure continua su WhatsApp.',
        paymentLabel: 'Pagamento sicuro',
        paymentTitle: 'Deposito o saldo completo',
        paymentLeadBook: 'Transfer aeroportuali e piani chauffeur possono passare a checkout sicuro quando la richiesta è completa.',
        paymentLeadQuote: 'Celebrazioni, tour e concierge custom restano quote-first. Invia prima la richiesta e conferma il pagamento con il team.',
        paymentSetupReady: 'Checkout pronto',
        paymentSetupPending: 'Pagamento in arrivo',
        paymentModeBook: 'Prenota ora',
        paymentModeQuote: 'Chiedi prima',
        paymentNoticeReady: 'Completa i dati chiave dell’ospite, poi scegli deposito o pagamento totale.',
        paymentNoticeMissing: 'Aggiungi nome, paese, email, data, ora e punto di pickup prima di aprire il checkout sicuro.',
        paymentNoticePending: 'Il checkout sicuro si attiverà quando la configurazione pagamenti sarà pronta.',
        paymentNoticeQuote: 'Questo servizio resta quote-first. Usa email o WhatsApp e lascia che il team confermi l’importo prima del pagamento.',
        paymentSuccess: 'Pagamento confermato. La richiesta può ora passare a conferma e dispatch.',
        paymentCancelled: 'Il pagamento è stato annullato. La richiesta resta pronta per essere inviata manualmente.',
        paymentSelection: 'Selezione attuale',
        paymentDeposit: 'Deposito',
        paymentFull: 'Totale',
        paymentDepositCta: 'Paga deposito',
        paymentFullCta: 'Paga totale',
        paymentLoadingDeposit: 'Apertura checkout deposito…',
        paymentLoadingFull: 'Apertura checkout totale…',
        paymentError: 'Il checkout sicuro non è partito. Usa email o WhatsApp mentre controlliamo il layer pagamenti.',
        missingLeadName: 'Manca il nome cliente',
        missingCountry: 'Manca il paese',
        missingContact: 'Manca email o WhatsApp',
        missingTravel: 'Manca data o orario',
        missingPickup: 'Manca il punto di pickup',
        noReference: 'Nessun riferimento ancora inserito',
        bookNow: 'Prenota ora',
        askFirst: 'Chiedi prima',
        selectService: 'Seleziona servizio',
        selectPackage: 'Seleziona pacchetto',
        toggleExtra: 'Attiva extra',
        estimatedConcept: 'Totale stimato della proposta',
        itineraryTotal: 'Totale stimato dell’itinerario',
        confirm: 'Conferma disponibilità e prossimi step.',
        clear: 'Svuota itinerario',
        emailCart: 'Invia itinerario via email',
        whatsappCart: 'Invia itinerario su WhatsApp',
        emailRequest: 'Richiedi via email',
        whatsappRequest: 'Invia su WhatsApp',
        copyRequest: 'Copia richiesta',
        copyCart: 'Copia itinerario',
        copied: 'Copiato',
        copyFailed: 'Copia fallita',
        requestCaptureReady: 'Quando la richiesta viene inviata, lo stesso riepilogo viene salvato anche nel booking record condiviso.',
        requestCaptureCartReady: 'Anche gli itinerari completi possono essere salvati nel booking record condiviso prima che il pagamento sia attivo.',
        requestCaptureSaving: 'Salvataggio della richiesta nel booking record condiviso…',
        requestCaptureSuccess: 'Richiesta salvata nel booking record condiviso. Continua via email o WhatsApp.',
        requestCaptureWarning: 'La registrazione automatica della richiesta non è disponibile in questo momento. Continua manualmente e conserva il riepilogo copiato.',
        bookingCodeLabel: 'Codice prenotazione',
        readinessLabel: 'Stato richiesta',
        readinessTitleMissing: 'Mancano ancora dati chiave dell’ospite',
        readinessTitleReady: 'La richiesta è strutturalmente pronta',
        readinessLeadMissing: 'Completa dati ospite, viaggio e pickup così la richiesta può essere rivista e confermata in modo pulito.',
        readinessLeadReady: 'I dati principali di ospite, viaggio e pickup sono completi. Puoi inviare la richiesta con un recap pulito e passare più velocemente alla conferma.',
        readinessStateReady: 'Completo',
        readinessStateMissing: 'Manca',
        readinessNextAction: 'Prossima azione',
        readinessNextComplete: 'Completa i dati mancanti, poi invia la richiesta.',
        readinessNextQuote: 'Questo servizio resta quote-first. Invia la richiesta e lascia che il team confermi l’importo prima del pagamento.',
        readinessNextSetup: 'L’attivazione del pagamento è ancora in attesa. Invia ora la richiesta e il team confermerà il pagamento dopo.',
        readinessNextPay: 'La richiesta è pronta. Inviala ora oppure continua nel checkout sicuro.',
        addToCart: 'Aggiungi all’itinerario',
        editCart: 'Carica nel configuratore',
        duplicateCart: 'Duplica',
        viewFlow: 'Vedi flusso di conferma',
        remove: 'Rimuovi',
        emptyCartTitle: 'Nessuna selezione salvata',
        emptyCartLead: 'Costruisci la prima richiesta'
      },
      timing: { day: 'Servizio di giorno', night: 'Arrivo notturno', weekend: 'Weekend / festivo' },
      subject: { request: 'Richiesta di prenotazione Excellentia VIP', itinerary: 'Richiesta itinerario Excellentia VIP' },
      body: { requestPrefix: 'Vorrei richiedere il seguente servizio:', itineraryPrefix: 'Vorrei richiedere il seguente itinerario:' }
    },
    fr: {
      services: {
        airport: { label: 'Transfert aéroport', description: 'Arrivée ou départ privé avec handling concierge.', kicker: 'Arrivée', routes: ['Aéroport Punta Cana -> Cap Cana', 'Aéroport Punta Cana -> Bávaro', 'Aéroport Punta Cana -> Uvero Alto', 'Aéroport Punta Cana -> La Romana'] },
        chauffeur: { label: 'Chauffeur à l’heure', description: 'Driver privé pour agenda executive, loisirs ou couverture flexible.', kicker: 'Driver privé', routes: ['Couverture privée 4h', 'Couverture privée 6h', 'Couverture privée 8h', 'Couverture complète 12h'] },
        tour: { label: 'Tour privé', description: 'Trajet privé conçu sur mesure avec transport premium et timing adapté.', kicker: 'Expérience', routes: ['Journée premium sur la côte de Cap Cana', 'Journée privée à Santo Domingo', 'Côte et marina premium à La Romana', 'Itinéraire personnalisé sur une journée'] },
        concierge: { label: 'Concierge célébration', description: 'Anniversaire, anniversaire de mariage et mise en scène d’arrivée avec coordination en amont.', kicker: 'Célébrations', routes: ['Mise en scène d’arrivée anniversaire', 'Coordination hôtel, dîner et surprise', 'Planification d’une célébration sur le week-end', 'Concierge complet pour célébration'] }
      },
      vehicles: {
        suv: { label: 'SUV exécutif', note: 'Pour 2-4 invités' },
        van: { label: 'Van premium', note: 'Pour familles et confort de groupe' },
        black: { label: 'Black Signature', note: 'Pour l’arrivée la plus haut de gamme' }
      },
      packages: {
        essential: { label: 'Pack Essential', note: 'Base premium soignée', detail: 'Véhicule privé, arrivée soignée et relais invité clair.' },
        signature: { label: 'Pack Signature', note: 'Meilleur équilibre entre confort et upgrades premium', detail: 'Meilleur équilibre entre confort, upgrades premium et présence haut de gamme.' },
        black: { label: 'Pack Black', note: 'Proposition de niveau maximal', detail: 'Arrivée haut de gamme avec extras forts et image premium.' }
      },
      extras: {
        champagne: { label: 'Accueil Moet', shortLabel: 'Arrivée Moet', note: '$110', detail: 'Moet préparé à bord pour anniversaires, lune de miel et arrivées haut de gamme.' },
        birthdaySetup: { label: 'Mise en scène d’arrivée célébration', shortLabel: 'Mise en scène', note: '$135', detail: 'Bougies, rubans et détails préparés avant l’arrivée pour un accueil soigné.' },
        birthdayCake: { label: 'Gâteau de célébration et bougies', shortLabel: 'Gâteau + bougies', note: '$95', detail: 'Gâteau d’anniversaire ou de célébration présenté dans le reveal d’arrivée.' },
        balloons: { label: 'Ballons et panneau d’accueil', shortLabel: 'Ballons + panneau', note: '$48', detail: 'Ballons coordonnés et panneau nominatif pour villa, aéroport ou surprise spéciale.' },
        flowers: { label: 'Bouquet de célébration', shortLabel: 'Bouquet', note: '$70', detail: 'Bouquet soigné pour anniversaires, lune de miel et arrivées surprise.' },
        fastTrack: { label: 'Coordination passage prioritaire aéroport', shortLabel: 'Passage prioritaire', note: '$150', detail: 'Assistance prioritaire pendant l’arrivée et le relais invité.' },
        childSeat: { label: 'Demande de siège enfant', shortLabel: 'Siège enfant', note: '$25', detail: 'Siège enfant installé avant l’arrivée.' },
        wifi: { label: 'Jus dominicain de bienvenue', shortLabel: 'Jus d’accueil', note: '$18', detail: 'Jus dominicain frais préparé à bord pour le moment de l’arrivée.' },
        ricaJuices: { label: 'Assortiment de jus dominicains', shortLabel: 'Set de jus', note: '$26', detail: 'Sélection de jus dominicains pour familles et arrivées festives.' },
        kidsPack: { label: 'Kit rafraîchissement enfants', shortLabel: 'Kit enfants', note: '$18', detail: 'Petit set pensé pour les transferts familiaux et les arrivées avec enfants.' },
        brugal1888: { label: 'Bouteille célébration Brugal 1888', shortLabel: 'Brugal 1888', note: '$145', detail: 'Add-on de spiritueux premium dominicain pour célébrations et villas.' },
        host: { label: 'Assistance d’accueil bilingue', shortLabel: 'Accueil bilingue', note: '$120', detail: 'Présence bilingue pour arrivée, relais hôtel ou coordination sur place.' },
        photographer: { label: 'Couverture photo et reels', shortLabel: 'Photo + reels', note: '$65', detail: 'Couverture légère pour arrivée, surprise ou moment de célébration.' },
        signage: { label: 'Panneau d’arrivée personnalisé', shortLabel: 'Panneau arrivée', note: '$35', detail: 'Panneau premium avec nom ou message pour aéroport, villa ou dinner reveal.' }
      },
      ui: {
        packageTier: 'Niveau du forfait',
        premiumAddOn: 'Extra premium',
        cartTitle: 'Sélections sauvegardées',
        service: 'Service',
        noSaved: 'Aucune expérience sauvegardée',
        buildFirst: 'Construisez la première demande',
        buildLead: 'Ajoutez un transfert, un service de célébration ou un extra pour commencer à structurer l’itinéraire.',
        addOns: 'Extras',
        vehicle: 'Véhicule',
        package: 'Forfait',
        guests: 'Invités',
        timing: 'Horaire',
        route: 'Trajet',
        item: 'Demande',
        notes: 'Notes',
        leadName: 'Nom du client',
        country: 'Pays',
        email: 'Email',
        whatsapp: 'WhatsApp',
        travelDate: 'Date d’arrivée ou de service',
        travelTime: 'Heure de prise en charge',
        pickupPoint: 'Aéroport, hôtel ou villa',
        reference: 'Vol, villa ou référence',
        requestMode: 'Mode de demande',
        contactLine: 'Contact',
        travelMoment: 'Moment du service',
        handoffLabel: 'Parcours de contact',
        handoffLine: 'Envoyer à excellentiavip@gmail.com ou continuer sur WhatsApp.',
        paymentLabel: 'Paiement sécurisé',
        paymentTitle: 'Acompte ou paiement total',
        paymentLeadBook: 'Les transferts aéroport et les plans chauffeur peuvent passer en checkout sécurisé une fois la demande complète.',
        paymentLeadQuote: 'Les célébrations, tours et concierge sur mesure restent quote-first. Envoyez d’abord la demande puis confirmez le paiement avec l’équipe.',
        paymentSetupReady: 'Checkout prêt',
        paymentSetupPending: 'Paiement bientôt disponible',
        paymentModeBook: 'Réserver maintenant',
        paymentModeQuote: 'Demander d’abord',
        paymentNoticeReady: 'Complétez les données clés du client puis choisissez acompte ou paiement total.',
        paymentNoticeMissing: 'Ajoutez le nom, le pays, l’email, la date, l’heure et le point de prise en charge avant d’ouvrir le checkout sécurisé.',
        paymentNoticePending: 'Le checkout sécurisé s’activera lorsque la configuration de paiement sera prête.',
        paymentNoticeQuote: 'Ce service reste quote-first. Utilisez l’email ou WhatsApp et laissez l’équipe confirmer le montant avant paiement.',
        paymentSuccess: 'Paiement confirmé. La demande peut maintenant passer en confirmation et dispatch.',
        paymentCancelled: 'Le paiement a été annulé. La demande reste prête à être envoyée manuellement.',
        paymentSelection: 'Sélection actuelle',
        paymentDeposit: 'Acompte',
        paymentFull: 'Paiement total',
        paymentDepositCta: 'Payer l’acompte',
        paymentFullCta: 'Payer le total',
        paymentLoadingDeposit: 'Ouverture du checkout acompte…',
        paymentLoadingFull: 'Ouverture du checkout total…',
        paymentError: 'Le checkout sécurisé n’a pas pu démarrer. Utilisez l’email ou WhatsApp pendant la vérification du paiement.',
        missingLeadName: 'Nom du client manquant',
        missingCountry: 'Pays manquant',
        missingContact: 'Email ou WhatsApp manquant',
        missingTravel: 'Date ou heure manquante',
        missingPickup: 'Point de prise en charge manquant',
        noReference: 'Aucune référence ajoutée',
        bookNow: 'Réserver maintenant',
        askFirst: 'Demander d’abord',
        selectService: 'Sélectionner le service',
        selectPackage: 'Sélectionner le forfait',
        toggleExtra: 'Activer l’extra',
        estimatedConcept: 'Total estimé de la proposition',
        itineraryTotal: 'Total estimé de l’itinéraire',
        confirm: 'Confirmez la disponibilité et les prochaines étapes.',
        clear: 'Vider l’itinéraire',
        emailCart: 'Envoyer l’itinéraire par email',
        whatsappCart: 'Envoyer l’itinéraire sur WhatsApp',
        emailRequest: 'Demander par email',
        whatsappRequest: 'Envoyer sur WhatsApp',
        copyRequest: 'Copier la demande',
        copyCart: 'Copier l’itinéraire',
        copied: 'Copié',
        copyFailed: 'Échec de copie',
        requestCaptureReady: 'Lorsque la demande est envoyée, le même récapitulatif est aussi enregistré dans le dossier partagé de réservation.',
        requestCaptureCartReady: 'Les itinéraires complets peuvent aussi être enregistrés dans le dossier partagé de réservation avant que le paiement soit en ligne.',
        requestCaptureSaving: 'Enregistrement de la demande dans le dossier partagé…',
        requestCaptureSuccess: 'Demande enregistrée dans le dossier partagé de réservation. Continuez par email ou WhatsApp.',
        requestCaptureWarning: 'La capture automatique de réservation est indisponible pour le moment. Continuez manuellement et gardez le récapitulatif copié.',
        bookingCodeLabel: 'Code de réservation',
        readinessLabel: 'État de la demande',
        readinessTitleMissing: 'Des données client clés manquent encore',
        readinessTitleReady: 'La demande est structurée',
        readinessLeadMissing: 'Complétez les données client, voyage et prise en charge pour que la demande puisse être relue et confirmée clairement.',
        readinessLeadReady: 'Les données principales client, voyage et prise en charge sont complètes. Vous pouvez envoyer la demande avec un récapitulatif propre et avancer plus vite vers la confirmation.',
        readinessStateReady: 'Complet',
        readinessStateMissing: 'Manquant',
        readinessNextAction: 'Prochaine action',
        readinessNextComplete: 'Complétez les données manquantes, puis envoyez la demande.',
        readinessNextQuote: 'Ce service reste quote-first. Envoyez la demande et laissez l’équipe confirmer le montant avant paiement.',
        readinessNextSetup: 'L’activation du paiement est encore en attente. Envoyez la demande maintenant et l’équipe confirmera ensuite le paiement.',
        readinessNextPay: 'La demande est prête. Envoyez-la maintenant ou continuez vers le checkout sécurisé.',
        addToCart: 'Ajouter à l’itinéraire',
        editCart: 'Charger dans le configurateur',
        duplicateCart: 'Dupliquer',
        viewFlow: 'Voir le flux de confirmation',
        remove: 'Retirer',
        emptyCartTitle: 'Aucune sélection sauvegardée',
        emptyCartLead: 'Construisez la première demande'
      },
      timing: { day: 'Service de jour', night: 'Arrivée de nuit', weekend: 'Week-end / férié' },
      subject: { request: 'Demande de réservation Excellentia VIP', itinerary: 'Demande d’itinéraire Excellentia VIP' },
      body: { requestPrefix: 'Je voudrais demander le service suivant :', itineraryPrefix: 'Je voudrais demander l’itinéraire suivant :' }
    },
    de: {
      services: {
        airport: { label: 'Flughafentransfer', description: 'Private Ankunft oder Abfahrt mit Concierge-Betreuung.', kicker: 'Ankunft', routes: ['Flughafen Punta Cana -> Cap Cana', 'Flughafen Punta Cana -> Bávaro', 'Flughafen Punta Cana -> Uvero Alto', 'Flughafen Punta Cana -> La Romana'] },
        chauffeur: { label: 'Chauffeur pro Stunde', description: 'Privatfahrer für Business, Freizeit oder flexible Einsätze.', kicker: 'Privatfahrer', routes: ['4 Stunden private Abdeckung', '6 Stunden private Abdeckung', '8 Stunden private Abdeckung', '12 Stunden Ganztags-Abdeckung'] },
        tour: { label: 'Privattour', description: 'Kurierte private Route mit Premium-Transport und flexiblem Timing.', kicker: 'Erlebnis', routes: ['Cap Cana Luxus-Küstentag', 'Santo Domingo privater City-Tag', 'La Romana Premium-Küste und Marina', 'Individuelle Ganztagsroute'] },
        concierge: { label: 'Feier-Concierge', description: 'Geburtstag, Jubiläum und Empfangssetup mit enger Vorabkoordination.', kicker: 'Feiern', routes: ['Geburtstags-Empfangssetup', 'Hotel-, Dinner- und Überraschungskoordination', 'Wochenend-Feierplanung', 'Kompletter Feier-Concierge'] }
      },
      vehicles: {
        suv: { label: 'Premium-SUV', note: 'Für 2-4 Gäste' },
        van: { label: 'Premium-Van', note: 'Für Familien und Gruppenkomfort' },
        black: { label: 'Black Signature', note: 'Für das höchste Ankunftsgefühl' }
      },
      packages: {
        essential: { label: 'Essential Paket', note: 'Sauberes Premium-Setup', detail: 'Privates Fahrzeug, saubere Ankunft und klare Übergabe.' },
        signature: { label: 'Signature Paket', note: 'Bestes Verhältnis aus Komfort und Premium-Upgrades', detail: 'Starkes Verhältnis aus Komfort, Premium-Upgrades und hochwertiger Präsenz.' },
        black: { label: 'Black Paket', note: 'Höchste Buchungsstufe', detail: 'Ankunft auf Top-Niveau mit stärkeren Extras und hochwertigem Auftritt.' }
      },
      extras: {
        champagne: { label: 'Moet-Ankunftsset', shortLabel: 'Moet-Ankunft', note: '$110', detail: 'Moet an Bord für Jubiläen, Honeymoon und hochwertige Ankünfte.' },
        birthdaySetup: { label: 'Ankunfts-Styling zur Feier', shortLabel: 'Ankunfts-Styling', note: '$135', detail: 'Kerzen, Schleifen und kuratierte Details werden vor der Ankunft vorbereitet.' },
        birthdayCake: { label: 'Feiertorte und Kerzen', shortLabel: 'Torte + Kerzen', note: '$95', detail: 'Geburtstags- oder Jubiläumstorte als Teil des Arrival-Reveals.' },
        balloons: { label: 'Ballons und Willkommensschild', shortLabel: 'Ballons + Schild', note: '$48', detail: 'Koordinierte Ballons und Namensschild für Villa, Airport oder Überraschungsmoment.' },
        flowers: { label: 'Feier-Bouquet', shortLabel: 'Bouquet', note: '$70', detail: 'Kuratiertes Bouquet für Geburtstage, Jubiläen und besondere Ankünfte.' },
        fastTrack: { label: 'Fast-Track-Service am Flughafen', shortLabel: 'Fast-Track-Service', note: '$150', detail: 'Bevorzugte Begleitung durch den Ankunftsprozess.' },
        childSeat: { label: 'Kindersitz-Anfrage', shortLabel: 'Kindersitz', note: '$25', detail: 'Vorinstallierter Kindersitz vor der Ankunft.' },
        wifi: { label: 'Dominikanischer Willkommenssaft', shortLabel: 'Willkommenssaft', note: '$18', detail: 'Gekühlter dominikanischer Saft für den ersten Ankunftsmoment.' },
        ricaJuices: { label: 'Auswahl dominikanischer Säfte', shortLabel: 'Saftset', note: '$26', detail: 'Kuratierte Auswahl dominikanischer Säfte für Familien und festliche Ankünfte.' },
        kidsPack: { label: 'Kinder-Erfrischungsset', shortLabel: 'Kinder-Set', note: '$18', detail: 'Refreshment-Set für Familienfahrten und Ankünfte mit Kindern.' },
        brugal1888: { label: 'Brugal 1888 für besondere Anlässe', shortLabel: 'Brugal 1888', note: '$145', detail: 'Premium-Spirituosen-Extra für stilvolle Ankünfte und Feiern.' },
        host: { label: 'Zweisprachige Begleitung', shortLabel: 'Begleitung', note: '$120', detail: 'Persönliche Unterstützung bei Ankunft, Hotelübergabe oder Eventkoordination.' },
        photographer: { label: 'Foto- und Reel-Begleitung', shortLabel: 'Foto + Reels', note: '$65', detail: 'Leichte Bildbegleitung für Ankunft, Überraschung oder Feiermoment.' },
        signage: { label: 'Personalisiertes Ankunftsschild', shortLabel: 'Ankunftsschild', note: '$35', detail: 'Premium-Schild mit Namen oder Botschaft für Airport, Villa oder Dinner-Reveal.' }
      },
      ui: {
        packageTier: 'Paketstufe',
        premiumAddOn: 'Premium-Extra',
        cartTitle: 'Gespeicherte Auswahl',
        service: 'Service',
        noSaved: 'Noch keine gespeicherten Erlebnisse',
        buildFirst: 'Erste Anfrage zusammenstellen',
        buildLead: 'Transfer, Feier-Service oder Extra hinzufügen, um den Reiseplan aufzubauen.',
        addOns: 'Extras',
        vehicle: 'Fahrzeug',
        package: 'Paket',
        guests: 'Gäste',
        timing: 'Zeitfenster',
        route: 'Strecke',
        item: 'Position',
        notes: 'Notizen',
        leadName: 'Kundenname',
        country: 'Land',
        email: 'E-Mail',
        whatsapp: 'WhatsApp',
        travelDate: 'Ankunfts- oder Servicedatum',
        travelTime: 'Abholzeit',
        pickupPoint: 'Flughafen, Hotel oder Villa',
        reference: 'Flug, Villa oder Referenz',
        requestMode: 'Anfragemodus',
        contactLine: 'Kontakt',
        travelMoment: 'Reisemoment',
        handoffLabel: 'Kontaktweg',
        handoffLine: 'An excellentiavip@gmail.com senden oder per WhatsApp fortfahren.',
        paymentLabel: 'Sichere Zahlung',
        paymentTitle: 'Anzahlung oder Gesamtbetrag',
        paymentLeadBook: 'Flughafentransfers und Chauffeur-Pläne können nach vollständiger Anfrage in einen sicheren Checkout gehen.',
        paymentLeadQuote: 'Feiern, Touren und individueller Concierge bleiben quote-first. Erst anfragen und dann den Betrag mit dem Team bestätigen.',
        paymentSetupReady: 'Checkout bereit',
        paymentSetupPending: 'Zahlung bald verfügbar',
        paymentModeBook: 'Jetzt buchen',
        paymentModeQuote: 'Erst anfragen',
        paymentNoticeReady: 'Vervollständigen Sie die wichtigsten Gastdaten und wählen Sie dann Anzahlung oder Gesamtbetrag.',
        paymentNoticeMissing: 'Name, Land, E-Mail, Datum, Uhrzeit und Abholort ergänzen, bevor der sichere Checkout geöffnet wird.',
        paymentNoticePending: 'Der sichere Checkout wird aktiviert, sobald die Zahlungsumgebung eingerichtet ist.',
        paymentNoticeQuote: 'Dieser Service bleibt quote-first. Nutzen Sie E-Mail oder WhatsApp und lassen Sie den Betrag erst vom Team bestätigen.',
        paymentSuccess: 'Zahlung bestätigt. Die Anfrage kann jetzt in Bestätigung und Dispatch gehen.',
        paymentCancelled: 'Die Zahlung wurde abgebrochen. Die Anfrage kann weiterhin manuell gesendet werden.',
        paymentSelection: 'Aktuelle Auswahl',
        paymentDeposit: 'Anzahlung',
        paymentFull: 'Gesamtbetrag',
        paymentDepositCta: 'Anzahlung zahlen',
        paymentFullCta: 'Gesamtbetrag zahlen',
        paymentLoadingDeposit: 'Anzahlungs-Checkout wird geöffnet…',
        paymentLoadingFull: 'Gesamt-Checkout wird geöffnet…',
        paymentError: 'Der sichere Checkout konnte nicht gestartet werden. Nutzen Sie E-Mail oder WhatsApp, während die Zahlungsebene geprüft wird.',
        missingLeadName: 'Kundenname fehlt noch',
        missingCountry: 'Land fehlt noch',
        missingContact: 'E-Mail oder WhatsApp fehlt noch',
        missingTravel: 'Datum oder Uhrzeit fehlt noch',
        missingPickup: 'Abholort fehlt noch',
        noReference: 'Noch keine Referenz hinzugefügt',
        bookNow: 'Jetzt buchen',
        askFirst: 'Erst anfragen',
        selectService: 'Service wählen',
        selectPackage: 'Paket wählen',
        toggleExtra: 'Extra auswählen',
        estimatedConcept: 'Geschätzter Gesamtbetrag',
        itineraryTotal: 'Geschätzter Gesamtwert des Reiseplans',
        confirm: 'Verfügbarkeit und nächste Schritte bestätigen.',
        clear: 'Reiseplan leeren',
        emailCart: 'Reiseplan per E-Mail senden',
        whatsappCart: 'Reiseplan per WhatsApp senden',
        emailRequest: 'Per E-Mail anfragen',
        whatsappRequest: 'Per WhatsApp senden',
        copyRequest: 'Anfrage kopieren',
        copyCart: 'Reiseplan kopieren',
        copied: 'Kopiert',
        copyFailed: 'Kopieren fehlgeschlagen',
        requestCaptureReady: 'Wenn die Anfrage gesendet wird, wird dieselbe Zusammenfassung auch im gemeinsamen Buchungsdatensatz gespeichert.',
        requestCaptureCartReady: 'Komplette Reisepläne können ebenfalls im gemeinsamen Buchungsdatensatz gespeichert werden, bevor die Zahlung live ist.',
        requestCaptureSaving: 'Anfrage wird im gemeinsamen Buchungsdatensatz gespeichert…',
        requestCaptureSuccess: 'Anfrage im gemeinsamen Buchungsdatensatz gespeichert. Weiter per E-Mail oder WhatsApp.',
        requestCaptureWarning: 'Die automatische Buchungserfassung ist gerade nicht verfügbar. Bitte manuell fortfahren und die kopierte Zusammenfassung behalten.',
        bookingCodeLabel: 'Buchungscode',
        readinessLabel: 'Anfragestatus',
        readinessTitleMissing: 'Wichtige Gästedaten fehlen noch',
        readinessTitleReady: 'Die Anfrage ist strukturell bereit',
        readinessLeadMissing: 'Ergänzen Sie Gast-, Reise- und Abholdaten, damit die Anfrage sauber geprüft und bestätigt werden kann.',
        readinessLeadReady: 'Die wichtigsten Gast-, Reise- und Abholdaten sind vollständig. Sie können die Anfrage jetzt mit einer sauberen Zusammenfassung senden und schneller zur Bestätigung übergehen.',
        readinessStateReady: 'Vollständig',
        readinessStateMissing: 'Fehlt',
        readinessNextAction: 'Nächster Schritt',
        readinessNextComplete: 'Ergänzen Sie die fehlenden Daten und senden Sie dann die Anfrage.',
        readinessNextQuote: 'Dieser Service bleibt quote-first. Senden Sie die Anfrage und lassen Sie das Team den Betrag vor der Zahlung bestätigen.',
        readinessNextSetup: 'Die Zahlungsaktivierung ist noch ausstehend. Senden Sie die Anfrage jetzt und das Team bestätigt die Zahlung anschließend.',
        readinessNextPay: 'Die Anfrage ist bereit. Senden Sie sie jetzt oder fahren Sie mit dem sicheren Checkout fort.',
        addToCart: 'Zum Reiseplan hinzufügen',
        editCart: 'In den Konfigurator laden',
        duplicateCart: 'Duplizieren',
        viewFlow: 'Bestätigungsfluss ansehen',
        remove: 'Entfernen',
        emptyCartTitle: 'Noch keine Auswahl gespeichert',
        emptyCartLead: 'Erste Anfrage zusammenstellen'
      },
      timing: { day: 'Tagesservice', night: 'Nachtankunft', weekend: 'Wochenende / Feiertag' },
      subject: { request: 'Excellentia VIP Buchungsanfrage', itinerary: 'Excellentia VIP Reiseplan-Anfrage' },
      body: { requestPrefix: 'Ich möchte den folgenden Service anfragen:', itineraryPrefix: 'Ich möchte den folgenden Reiseplan anfragen:' }
    },
    pt: {
      services: {
        airport: { label: 'Transfer de aeroporto', description: 'Chegada ou partida privada com handling de concierge.', kicker: 'Chegada', routes: ['Aeroporto Punta Cana -> Cap Cana', 'Aeroporto Punta Cana -> Bávaro', 'Aeroporto Punta Cana -> Uvero Alto', 'Aeroporto Punta Cana -> La Romana'] },
        chauffeur: { label: 'Chauffeur por hora', description: 'Motorista privado para agenda executive, lazer ou cobertura flexível.', kicker: 'Motorista privado', routes: ['Cobertura privada 4 horas', 'Cobertura privada 6 horas', 'Cobertura privada 8 horas', 'Cobertura completa 12 horas'] },
        tour: { label: 'Tour privado', description: 'Rota privada curada com transporte premium e horários à medida.', kicker: 'Experiência', routes: ['Dia premium na costa de Cap Cana', 'Dia privado em Santo Domingo', 'Costa e marina premium em La Romana', 'Rota personalizada de dia inteiro'] },
        concierge: { label: 'Concierge de celebração', description: 'Aniversário, comemoração e preparação de chegada com coordenação prévia.', kicker: 'Celebrações', routes: ['Preparação de chegada de aniversário', 'Coordenação de hotel, jantar e surpresa', 'Planeamento de celebração de fim de semana', 'Concierge completo de celebração'] }
      },
      vehicles: {
        suv: { label: 'SUV executivo', note: 'Para 2-4 hóspedes' },
        van: { label: 'Van premium', note: 'Para famílias e conforto de grupo' },
        black: { label: 'Black Signature', note: 'Para a chegada de nível mais alto' }
      },
      packages: {
        essential: { label: 'Pacote Essential', note: 'Base premium limpa', detail: 'Veículo privado, chegada cuidada e passagem do hóspede sem ruído.' },
        signature: { label: 'Pacote Signature', note: 'Melhor equilíbrio entre conforto e upgrades premium', detail: 'Melhor equilíbrio entre conforto, upgrades premium e presença de alto nível.' },
        black: { label: 'Pacote Black', note: 'Proposta de nível máximo', detail: 'Chegada de nível máximo com extras fortes e imagem premium.' }
      },
      extras: {
        champagne: { label: 'Set de chegada Moet', shortLabel: 'Chegada Moet', note: '$110', detail: 'Moet preparada a bordo para aniversários, lua de mel e chegadas de alto padrão.' },
        birthdaySetup: { label: 'Styling de chegada para celebração', shortLabel: 'Styling chegada', note: '$135', detail: 'Velas, fitas e detalhes curados preparados antes da chegada do hóspede.' },
        birthdayCake: { label: 'Bolo de celebração e velas', shortLabel: 'Bolo + velas', note: '$95', detail: 'Bolo de aniversário ou comemoração apresentado como parte do reveal de chegada.' },
        balloons: { label: 'Balões e placa de boas-vindas', shortLabel: 'Balões + placa', note: '$48', detail: 'Balões coordenados e placa com nome para villa, aeroporto ou surpresa especial.' },
        flowers: { label: 'Bouquet de celebração', shortLabel: 'Bouquet', note: '$70', detail: 'Bouquet curado para aniversários, lua de mel e chegadas surpresa.' },
        fastTrack: { label: 'Coordenação de passagem rápida no aeroporto', shortLabel: 'Passagem rápida', note: '$150', detail: 'Assistência prioritária durante a chegada e a passagem do hóspede.' },
        childSeat: { label: 'Pedido de cadeira infantil', shortLabel: 'Cadeira infantil', note: '$25', detail: 'Cadeira infantil instalada antes da chegada.' },
        wifi: { label: 'Suco dominicano de boas-vindas', shortLabel: 'Suco boas-vindas', note: '$18', detail: 'Suco dominicano gelado preparado a bordo para o momento da chegada.' },
        ricaJuices: { label: 'Seleção de sucos dominicanos', shortLabel: 'Set de sucos', note: '$26', detail: 'Seleção curada de sucos dominicanos para famílias e chegadas de celebração.' },
        kidsPack: { label: 'Kit infantil de refresco', shortLabel: 'Kit infantil', note: '$18', detail: 'Kit pensado para transfers familiares e chegadas com crianças.' },
        brugal1888: { label: 'Garrafa celebrativa Brugal 1888', shortLabel: 'Brugal 1888', note: '$145', detail: 'Extra premium dominicano para celebrações e chegadas em villa.' },
        host: { label: 'Assistência bilíngue de receção', shortLabel: 'Receção bilíngue', note: '$120', detail: 'Apoio presencial para chegada, passagem no hotel ou coordenação de evento.' },
        photographer: { label: 'Cobertura de foto e reels', shortLabel: 'Foto + reels', note: '$65', detail: 'Cobertura leve para chegada, surpresa ou momento de celebração.' },
        signage: { label: 'Placa personalizada de chegada', shortLabel: 'Placa chegada', note: '$35', detail: 'Placa premium com nome ou mensagem para aeroporto, villa ou dinner reveal.' }
      },
      ui: {
        packageTier: 'Nível do pacote',
        premiumAddOn: 'Extra premium',
        cartTitle: 'Seleções guardadas',
        service: 'Serviço',
        noSaved: 'Ainda não há experiências guardadas',
        buildFirst: 'Construir o primeiro pedido',
        buildLead: 'Adicione um transfer, um serviço de celebração ou um extra para começar a estruturar o itinerário.',
        addOns: 'Extras',
        vehicle: 'Veículo',
        package: 'Pacote',
        guests: 'Hóspedes',
        timing: 'Horário',
        route: 'Rota',
        item: 'Pedido',
        notes: 'Notas',
        leadName: 'Nome do cliente',
        country: 'País',
        email: 'Email',
        whatsapp: 'WhatsApp',
        travelDate: 'Data da chegada ou do serviço',
        travelTime: 'Hora de recolha',
        pickupPoint: 'Aeroporto, hotel ou villa',
        reference: 'Voo, villa ou referência',
        requestMode: 'Modo do pedido',
        contactLine: 'Contacto',
        travelMoment: 'Momento do serviço',
        handoffLabel: 'Caminho de contacto',
        handoffLine: 'Enviar para excellentiavip@gmail.com ou continuar no WhatsApp.',
        paymentLabel: 'Pagamento seguro',
        paymentTitle: 'Depósito ou pagamento total',
        paymentLeadBook: 'Transfers de aeroporto e planos de chauffeur podem seguir para checkout seguro quando o pedido estiver completo.',
        paymentLeadQuote: 'Celebrações, tours e concierge custom continuam quote-first. Envie primeiro o pedido e confirme o pagamento com a equipa.',
        paymentSetupReady: 'Checkout pronto',
        paymentSetupPending: 'Pagamento disponível em breve',
        paymentModeBook: 'Reserva já',
        paymentModeQuote: 'Pede primeiro',
        paymentNoticeReady: 'Complete os dados principais do hóspede e depois escolha depósito ou pagamento total.',
        paymentNoticeMissing: 'Adicione nome, país, email, data, hora e ponto de recolha antes de abrir o checkout seguro.',
        paymentNoticePending: 'O checkout seguro será ativado quando a configuração de pagamento estiver pronta.',
        paymentNoticeQuote: 'Este serviço continua quote-first. Use email ou WhatsApp e deixe a equipa confirmar o valor antes do pagamento.',
        paymentSuccess: 'Pagamento confirmado. O pedido pode agora seguir para confirmação e dispatch.',
        paymentCancelled: 'O pagamento foi cancelado. O pedido continua pronto para envio manual.',
        paymentSelection: 'Seleção atual',
        paymentDeposit: 'Depósito',
        paymentFull: 'Total',
        paymentDepositCta: 'Pagar depósito',
        paymentFullCta: 'Pagar total',
        paymentLoadingDeposit: 'A abrir checkout do depósito…',
        paymentLoadingFull: 'A abrir checkout total…',
        paymentError: 'O checkout seguro não arrancou. Use email ou WhatsApp enquanto a camada de pagamento é verificada.',
        missingLeadName: 'Falta o nome do cliente',
        missingCountry: 'Falta o país',
        missingContact: 'Falta email ou WhatsApp',
        missingTravel: 'Falta data ou hora',
        missingPickup: 'Falta o ponto de recolha',
        noReference: 'Ainda sem referência',
        bookNow: 'Reserva já',
        askFirst: 'Pede primeiro',
        selectService: 'Selecionar serviço',
        selectPackage: 'Selecionar pacote',
        toggleExtra: 'Ativar extra',
        estimatedConcept: 'Total estimado da proposta',
        itineraryTotal: 'Total estimado do itinerário',
        confirm: 'Confirme disponibilidade e próximos passos.',
        clear: 'Limpar itinerário',
        emailCart: 'Enviar itinerário por email',
        whatsappCart: 'Enviar itinerário por WhatsApp',
        emailRequest: 'Solicitar por email',
        whatsappRequest: 'Enviar por WhatsApp',
        copyRequest: 'Copiar pedido',
        copyCart: 'Copiar itinerário',
        copied: 'Copiado',
        copyFailed: 'Falha ao copiar',
        requestCaptureReady: 'Quando o pedido é enviado, o mesmo resumo também fica registado para a equipa de reservas.',
        requestCaptureCartReady: 'Os itinerários completos também podem ficar registados para a equipa de reservas antes de o pagamento estar ativo.',
        requestCaptureSaving: 'A guardar o pedido no registo partilhado…',
        requestCaptureSuccess: 'Pedido registado para a equipa de reservas. Continua por email ou WhatsApp.',
        requestCaptureWarning: 'A captura de reservas não está disponível agora. Continua manualmente e guarda o resumo copiado.',
        bookingCodeLabel: 'Código da reserva',
        readinessLabel: 'Estado do pedido',
        readinessTitleMissing: 'Ainda faltam dados principais do hóspede',
        readinessTitleReady: 'O pedido está estruturado',
        readinessLeadMissing: 'Complete os dados do hóspede, viagem e recolha para que o pedido possa ser revisto e confirmado com clareza.',
        readinessLeadReady: 'Os dados principais do hóspede, viagem e recolha estão completos. Pode enviar o pedido com um resumo limpo e avançar mais rápido para confirmação.',
        readinessStateReady: 'Completo',
        readinessStateMissing: 'Falta',
        readinessNextAction: 'Próxima ação',
        readinessNextComplete: 'Complete os dados em falta e depois envie o pedido.',
        readinessNextQuote: 'Este serviço continua quote-first. Envie o pedido e deixe a equipa confirmar o valor antes do pagamento.',
        readinessNextSetup: 'A ativação do pagamento ainda está pendente. Envie o pedido agora e a equipa confirmará o pagamento depois.',
        readinessNextPay: 'O pedido está pronto. Envie agora ou continue para o checkout seguro.',
        addToCart: 'Adicionar ao itinerário',
        editCart: 'Carregar no configurador',
        duplicateCart: 'Duplicar',
        viewFlow: 'Ver fluxo de confirmação',
        remove: 'Remover',
        emptyCartTitle: 'Ainda não há seleções guardadas',
        emptyCartLead: 'Construir o primeiro pedido'
      },
      timing: { day: 'Serviço diurno', night: 'Chegada noturna', weekend: 'Fim de semana / feriado' },
      subject: { request: 'Pedido de reserva Excellentia VIP', itinerary: 'Pedido de itinerário Excellentia VIP' },
      body: { requestPrefix: 'Quero solicitar o seguinte serviço:', itineraryPrefix: 'Quero solicitar o seguinte itinerário:' }
    }
  };

  function mergeBookingLocale(base, patch) {
    var result = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(patch || {}).forEach(function (key) {
      var value = patch[key];
      if (Array.isArray(value)) {
        result[key] = value.slice();
      } else if (value && typeof value === 'object') {
        result[key] = mergeBookingLocale(base && base[key] ? base[key] : {}, value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  var bookingCopyPatches = {
    ru: {
      services: {
        airport: { label: 'Аэропортовый трансфер', description: 'Частное прибытие или выезд из аэропорта с concierge-grade handling.', kicker: 'Прибытие', routes: ['Аэропорт Punta Cana -> Cap Cana', 'Аэропорт Punta Cana -> Bavaro', 'Аэропорт Punta Cana -> Uvero Alto', 'Аэропорт Punta Cana -> La Romana'] },
        chauffeur: { label: 'Шофер по часам', description: 'Частный водитель для деловой, leisure или гибкой программы.', kicker: 'Частный водитель', routes: ['Частное сопровождение 4 часа', 'Частное сопровождение 6 часов', 'Частное сопровождение 8 часов', 'Полный день 12 часов'] },
        tour: { label: 'Частный тур', description: 'Продуманный частный маршрут с premium transport и гибким таймингом.', kicker: 'Опыт', routes: ['Премиальный день на побережье Cap Cana', 'Частный день в Santo Domingo', 'Премиальное побережье и marina в La Romana', 'Индивидуальный маршрут на целый день'] },
        concierge: { label: 'Праздничный concierge', description: 'День рождения, годовщина и arrival setup с плотной предварительной координацией.', kicker: 'Праздники', routes: ['Праздничная подготовка к прибытию', 'Координация отеля, ужина и сюрприза', 'Планирование weekend celebration', 'Полный праздничный concierge'] }
      },
      vehicles: {
        suv: { label: 'Premium SUV', note: 'Для 2-4 гостей' },
        van: { label: 'Premium Van', note: 'Для семей и группового комфорта' },
        black: { label: 'Black Signature', note: 'Для самого высокого arrival feel' }
      },
      packages: {
        essential: { label: 'Пакет Essential', note: 'Чистый premium transport setup', detail: 'Частный автомобиль, polished arrival и понятная сводка запроса.' },
        signature: { label: 'Пакет Signature', note: 'Лучший баланс комфорта и апгрейдов', detail: 'Самый сильный баланс комфорта, premium upgrades и визуального premium feel.' },
        black: { label: 'Пакет Black', note: 'Максимальный booking proposition', detail: 'Топовый arrival framing с более сильными extras и premium image.' }
      },
      extras: {
        champagne: { label: 'Набор Moet к прибытию', shortLabel: 'Moet arrival', detail: 'Moet подготавливается на борту для годовщин, honeymoon и high-tier arrivals.' },
        birthdaySetup: { label: 'Праздничное оформление прибытия', shortLabel: 'Arrival styling', detail: 'Свечи, ленты и curated styling подготавливаются до прибытия гостя.' },
        birthdayCake: { label: 'Праздничный торт и свечи', shortLabel: 'Торт + свечи', detail: 'Торт для дня рождения или годовщины как часть reveal upon arrival.' },
        balloons: { label: 'Шары и welcome sign', shortLabel: 'Шары + табличка', detail: 'Оформление шарами и именная welcome sign для villa и airport surprises.' },
        flowers: { label: 'Праздничный букет', shortLabel: 'Букет', detail: 'Подобранный букет для дней рождения, годовщин и surprise arrivals.' },
        fastTrack: { label: 'Fast-track координация в аэропорту', shortLabel: 'Fast-track', detail: 'Приоритетная помощь по arrival flow.' },
        childSeat: { label: 'Запрос детского кресла', shortLabel: 'Детское кресло', detail: 'Кресло устанавливается до прибытия.' },
        wifi: { label: 'Доминиканский welcome juice', shortLabel: 'Welcome juice', detail: 'Охлажденный доминиканский сок для момента прибытия.' },
        ricaJuices: { label: 'Ассортимент доминиканских соков', shortLabel: 'Juice set', detail: 'Подобранный набор доминиканских соков для семей и праздничных arrivals.' },
        kidsPack: { label: 'Набор refreshment для детей', shortLabel: 'Kids refreshment', detail: 'Детский набор напитков для семейных трансферов.' },
        brugal1888: { label: 'Праздничная бутылка Brugal 1888', shortLabel: 'Brugal 1888', detail: 'Премиальный adult add-on для celebratory arrivals.' },
        host: { label: 'Помощь двуязычного host', shortLabel: 'Bilingual host', detail: 'Сопровождение host для прибытия или event coordination.' },
        photographer: { label: 'Фото и reels сопровождение', shortLabel: 'Фото + reels', detail: 'Легкое фото и reels coverage для arrivals, surprises и celebration moments.' },
        signage: { label: 'Персональная табличка встречи', shortLabel: 'Arrival sign', detail: 'Премиальная персонализированная табличка для airport meet-and-greet, villa arrival или dinner reveal.' }
      },
      ui: {
        packageTier: 'Уровень пакета',
        premiumAddOn: 'Премиальный add-on',
        cartTitle: 'Сохраненные позиции',
        service: 'Услуга',
        noSaved: 'Пока ничего не сохранено',
        buildFirst: 'Соберите первый запрос',
        buildLead: 'Добавьте трансфер, праздничную услугу или extra, чтобы начать формировать itinerary.',
        addOns: 'Дополнения',
        vehicle: 'Автомобиль',
        package: 'Пакет',
        guests: 'Гости',
        timing: 'Время',
        route: 'Маршрут',
        item: 'Позиция',
        notes: 'Примечания',
        leadName: 'Имя клиента',
        country: 'Страна',
        email: 'Email',
        whatsapp: 'WhatsApp',
        travelDate: 'Дата прибытия или сервиса',
        travelTime: 'Время pickup',
        pickupPoint: 'Аэропорт, отель или вилла',
        reference: 'Рейс, вилла или reference',
        requestMode: 'Режим запроса',
        contactLine: 'Контакт',
        travelMoment: 'Момент сервиса',
        handoffLabel: 'Канал связи',
        handoffLine: 'Отправьте на excellentiavip@gmail.com или продолжите в WhatsApp.',
        paymentLabel: 'Безопасная оплата',
        paymentTitle: 'Депозит или полная оплата',
        paymentLeadBook: 'Аэропортовые трансферы и chauffeur plans могут перейти в secure checkout после завершения запроса.',
        paymentLeadQuote: 'Праздничные, tour и custom concierge requests остаются quote-first. Сначала отправьте запрос, затем подтвердите оплату с командой.',
        paymentSetupReady: 'Checkout готов',
        paymentSetupPending: 'Оплата скоро будет доступна',
        paymentModeBook: 'Забронировать',
        paymentModeQuote: 'Сначала запросить',
        paymentNoticeReady: 'Заполните ключевые данные гостя, затем выберите депозит или полную оплату.',
        paymentNoticeMissing: 'Добавьте имя, страну, email, дату, время и pickup point перед открытием secure checkout.',
        paymentNoticePending: 'Secure checkout включится после настройки payment setup.',
        paymentNoticeQuote: 'Эта услуга остается quote-first. Используйте email или WhatsApp и дождитесь подтверждения суммы от команды.',
        paymentSuccess: 'Оплата подтверждена. Запрос можно переводить в confirmation и dispatch.',
        paymentCancelled: 'Оплата отменена. Запрос по-прежнему можно отправить вручную.',
        paymentSelection: 'Текущий выбор',
        paymentDeposit: 'Депозит',
        paymentFull: 'Полная сумма',
        paymentDepositCta: 'Оплатить депозит',
        paymentFullCta: 'Оплатить полностью',
        paymentLoadingDeposit: 'Открываем checkout депозита…',
        paymentLoadingFull: 'Открываем полный checkout…',
        paymentError: 'Не удалось открыть secure checkout. Используйте email или WhatsApp, пока payment layer проверяется.',
        missingLeadName: 'Не хватает имени клиента',
        missingCountry: 'Не хватает страны',
        missingContact: 'Не хватает email или WhatsApp',
        missingTravel: 'Не хватает даты или времени',
        missingPickup: 'Не хватает pickup point',
        noReference: 'Reference пока не добавлен',
        bookNow: 'Бронировать',
        askFirst: 'Сначала спросить',
        selectService: 'Выбрать услугу',
        selectPackage: 'Выбрать пакет',
        toggleExtra: 'Включить extra',
        estimatedConcept: 'Оценочная сумма',
        itineraryTotal: 'Оценочный итог itinerary',
        confirm: 'Пожалуйста, подтвердите availability и следующие шаги.',
        clear: 'Очистить itinerary',
        emailCart: 'Отправить itinerary по email',
        whatsappCart: 'Отправить itinerary в WhatsApp',
        emailRequest: 'Запросить по email',
        whatsappRequest: 'Отправить в WhatsApp',
        copyRequest: 'Скопировать запрос',
        copyCart: 'Скопировать itinerary',
        copied: 'Скопировано',
        copyFailed: 'Не удалось скопировать',
        requestCaptureReady: 'При отправке запроса та же сводка также сохраняется в общей записи бронирования.',
        requestCaptureCartReady: 'Полные itineraries также можно сохранить в общей записи бронирования до запуска оплаты.',
        requestCaptureSaving: 'Сохраняем запрос в общей записи бронирования…',
        requestCaptureSuccess: 'Запрос сохранен в общей записи бронирования. Продолжайте через email или WhatsApp.',
        requestCaptureWarning: 'Автоматическая фиксация бронирования сейчас недоступна. Продолжайте вручную и сохраните скопированный recap.',
        bookingCodeLabel: 'Код бронирования',
        readinessLabel: 'Готовность запроса',
        readinessTitleMissing: 'Ключевые данные гостя еще отсутствуют',
        readinessTitleReady: 'Запрос структурно готов',
        readinessLeadMissing: 'Заполните данные гостя, поездки и pickup, чтобы запрос можно было чисто проверить и подтвердить.',
        readinessLeadReady: 'Ключевые данные гостя, поездки и pickup заполнены. Запрос можно отправить с чистой сводкой и быстрее перейти к подтверждению.',
        readinessStateReady: 'Готово',
        readinessStateMissing: 'Не хватает',
        readinessNextAction: 'Следующее действие',
        readinessNextComplete: 'Заполните недостающие данные, затем отправьте запрос.',
        readinessNextQuote: 'Эта услуга остается quote-first. Отправьте запрос, и команда подтвердит сумму до оплаты.',
        readinessNextSetup: 'Активация оплаты еще не завершена. Отправьте запрос сейчас, а команда подтвердит оплату следующим шагом.',
        readinessNextPay: 'Запрос готов. Отправьте его сейчас или перейдите к secure checkout.',
        addToCart: 'Добавить в itinerary',
        editCart: 'Загрузить в конфигуратор',
        duplicateCart: 'Дублировать',
        viewFlow: 'Смотреть flow confirmation',
        remove: 'Удалить',
        emptyCartTitle: 'Пока ничего не сохранено',
        emptyCartLead: 'Соберите первый запрос'
      },
      timing: { day: 'Дневной сервис', night: 'Ночное прибытие', weekend: 'Выходной / праздник' },
      subject: { request: 'Запрос бронирования Excellentia VIP', itinerary: 'Запрос itinerary Excellentia VIP' },
      body: { requestPrefix: 'Я хотел бы запросить следующую услугу:', itineraryPrefix: 'Я хотел бы запросить следующий itinerary:' }
    },
    zh: {
      services: {
        airport: { label: '机场接送', description: '带有 concierge 级别接待的私人机场到达或离开服务。', kicker: '到达', routes: ['Punta Cana 机场 -> Cap Cana', 'Punta Cana 机场 -> Bavaro', 'Punta Cana 机场 -> Uvero Alto', 'Punta Cana 机场 -> La Romana'] },
        chauffeur: { label: '按小时专属司机', description: '适合商务、休闲或灵活行程覆盖的私人司机。', kicker: '专属司机', routes: ['4 小时私人用车', '6 小时私人用车', '8 小时私人用车', '12 小时全天覆盖'] },
        tour: { label: '私人行程', description: '配有高端接送和灵活时间的精选私人路线。', kicker: '体验', routes: ['Cap Cana 高端海岸日', 'Santo Domingo 私人城市日', 'La Romana 高端海岸与 marina', '定制全天路线'] },
        concierge: { label: '庆祝礼宾', description: '生日、纪念日和到达布置，配合高接触度的到达前协调。', kicker: '庆祝', routes: ['生日到达布置', '酒店、晚餐与惊喜协调', '周末庆祝规划', '完整庆祝礼宾'] }
      },
      vehicles: {
        suv: { label: '高级 SUV', note: '适合 2-4 位客人' },
        van: { label: '高级 Van', note: '适合家庭和团体舒适出行' },
        black: { label: 'Black Signature', note: '适合最高等级到达体验' }
      },
      packages: {
        essential: { label: 'Essential 套餐', note: '干净的高端接送基础包', detail: '私人车辆、精致到达体验和清晰请求摘要。' },
        signature: { label: 'Signature 套餐', note: '舒适与升级之间的最佳平衡', detail: '兼顾舒适、高端升级和更强 premium feel 的最佳组合。' },
        black: { label: 'Black 套餐', note: '最高等级 booking proposition', detail: '更强高端呈现、更多 extras 和更高端的 arrival image。' }
      },
      extras: {
        champagne: { label: 'Moet 到达套装', shortLabel: 'Moet 到达', detail: '适用于周年、honeymoon 与高等级 arrival 的车上 Moet。' },
        birthdaySetup: { label: '庆祝到达布置', shortLabel: '到达布置', detail: '在客人到达前完成蜡烛、丝带和 curated styling。' },
        birthdayCake: { label: '庆祝蛋糕与蜡烛', shortLabel: '蛋糕 + 蜡烛', detail: '将生日或纪念日蛋糕作为 arrival reveal 的一部分呈现。' },
        balloons: { label: '气球布置与欢迎牌', shortLabel: '气球布置', detail: '适用于别墅和机场惊喜的气球布置与专属 welcome sign。' },
        flowers: { label: '庆祝花束', shortLabel: '花束', detail: '为生日、纪念日和惊喜到达准备的精选花束。' },
        fastTrack: { label: '机场 fast-track 协调', shortLabel: 'Fast-track', detail: '到达流程中的优先协助。' },
        childSeat: { label: '儿童座椅请求', shortLabel: '儿童座椅', detail: '在客人到达前预先安装儿童座椅。' },
        wifi: { label: '多米尼加欢迎果汁', shortLabel: '欢迎果汁', detail: '为 arrival moment 准备的冰镇多米尼加果汁。' },
        ricaJuices: { label: '多米尼加果汁组合', shortLabel: '果汁套装', detail: '适合家庭和庆祝型到达的精选果汁组合。' },
        kidsPack: { label: '儿童 refreshments 套装', shortLabel: '儿童套装', detail: '为家庭接送准备的儿童友好 refreshments。' },
        brugal1888: { label: 'Brugal 1888 庆祝酒瓶', shortLabel: 'Brugal 1888', detail: '适用于成人庆祝到达的高端烈酒 add-on。' },
        host: { label: '双语接待协助', shortLabel: '双语 host', detail: '用于到达或活动协调的 host support。' },
        photographer: { label: '照片与 reels 记录', shortLabel: '照片 + reels', detail: '用于到达、惊喜和庆祝时刻的轻量 photo/reels coverage。' },
        signage: { label: '个性化到达牌', shortLabel: '到达牌', detail: '适用于机场接机、别墅到达或 dinner reveal 的高端定制标识。' }
      },
      ui: {
        packageTier: '套餐等级',
        premiumAddOn: '高端附加项',
        cartTitle: '已保存选择',
        service: '服务',
        noSaved: '还没有已保存项目',
        buildFirst: '创建第一份请求',
        buildLead: '添加接送、庆祝服务或附加项，开始构建 itinerary。',
        addOns: '附加项',
        vehicle: '车辆',
        package: '套餐',
        guests: '客人',
        timing: '时间安排',
        route: '路线',
        item: '项目',
        notes: '备注',
        leadName: '客户姓名',
        country: '国家',
        email: '邮箱',
        whatsapp: 'WhatsApp',
        travelDate: '到达或服务日期',
        travelTime: '接送时间',
        pickupPoint: '机场、酒店或别墅',
        reference: '航班、别墅或参考号',
        requestMode: '请求模式',
        contactLine: '联系方式',
        travelMoment: '出行时段',
        handoffLabel: '联系路径',
        handoffLine: '发送到 excellentiavip@gmail.com，或继续通过 WhatsApp。',
        paymentLabel: '安全支付',
        paymentTitle: '定金或全额支付',
        paymentLeadBook: '机场接送和 chauffeur 方案在请求完成后可以进入安全 checkout。',
        paymentLeadQuote: '庆祝、tour 和定制 concierge 仍保持 quote-first。请先发送请求，再与团队确认付款。',
        paymentSetupReady: 'Checkout 已就绪',
        paymentSetupPending: '支付即将开放',
        paymentModeBook: '立即预订',
        paymentModeQuote: '先咨询',
        paymentNoticeReady: '先填写关键客人信息，再选择定金或全额支付。',
        paymentNoticeMissing: '在打开安全 checkout 前，请补全姓名、国家、邮箱、日期、时间和 pickup point。',
        paymentNoticePending: '完成 payment setup 后会启用安全 checkout。',
        paymentNoticeQuote: '该服务仍是 quote-first。请使用 email 或 WhatsApp，先让团队确认金额再付款。',
        paymentSuccess: '付款已确认。请求现在可以进入确认和 dispatch。',
        paymentCancelled: '付款已取消。该请求仍可手动发送。',
        paymentSelection: '当前选择',
        paymentDeposit: '定金',
        paymentFull: '全额',
        paymentDepositCta: '支付定金',
        paymentFullCta: '全额支付',
        paymentLoadingDeposit: '正在打开定金 checkout…',
        paymentLoadingFull: '正在打开全额 checkout…',
        paymentError: '无法启动安全 checkout。请先使用 email 或 WhatsApp，等待 payment layer 检查完成。',
        missingLeadName: '仍缺少客户姓名',
        missingCountry: '仍缺少国家',
        missingContact: '仍缺少邮箱或 WhatsApp',
        missingTravel: '仍缺少日期或时间',
        missingPickup: '仍缺少 pickup point',
        noReference: '尚未添加 reference',
        bookNow: '立即预订',
        askFirst: '先咨询',
        selectService: '选择服务',
        selectPackage: '选择套餐',
        toggleExtra: '切换附加项',
        estimatedConcept: '预估请求总额',
        itineraryTotal: '预估 itinerary 总额',
        confirm: '请确认 availability 与下一步。',
        clear: '清空 itinerary',
        emailCart: '通过邮件发送 itinerary',
        whatsappCart: '通过 WhatsApp 发送 itinerary',
        emailRequest: '通过邮件请求',
        whatsappRequest: '通过 WhatsApp 发送',
        copyRequest: '复制请求',
        copyCart: '复制 itinerary',
        copied: '已复制',
        copyFailed: '复制失败',
        requestCaptureReady: '发送请求时，同一份摘要也会保存到共享预订记录中。',
        requestCaptureCartReady: '在支付上线前，完整 itinerary 也可以先保存到共享预订记录中。',
        requestCaptureSaving: '正在将请求保存到共享预订记录中…',
        requestCaptureSuccess: '请求已保存到共享预订记录中。请继续通过 email 或 WhatsApp。',
        requestCaptureWarning: '当前自动预订记录不可用。请手动继续，并保留复制好的摘要。',
        bookingCodeLabel: '预订代码',
        readinessLabel: '请求准备状态',
        readinessTitleMissing: '仍缺少关键客人信息',
        readinessTitleReady: '请求结构已准备好',
        readinessLeadMissing: '请补全客人、行程和接送信息，让请求清晰送达，预订团队无需反复确认即可处理。',
        readinessLeadReady: '客人、行程和接送的核心信息已完整。现在可以清晰发送请求，并更快进入确认流程。',
        readinessStateReady: '已完成',
        readinessStateMissing: '缺少',
        readinessNextAction: '下一步',
        readinessNextComplete: '请先补全缺少的信息，然后发送请求。',
        readinessNextQuote: '该服务仍是 quote-first。请先发送请求，让团队在付款前确认金额。',
        readinessNextSetup: '支付配置仍待完成。请先发送请求，并与预订团队确认付款。',
        readinessNextPay: '请求已准备好。现在发送，或继续进入安全 checkout。',
        addToCart: '加入 itinerary',
        editCart: '载入配置器',
        duplicateCart: '复制',
        viewFlow: '查看确认流程',
        remove: '移除',
        emptyCartTitle: '还没有已保存选择',
        emptyCartLead: '创建第一份请求'
      },
      timing: { day: '白天服务', night: '夜间到达', weekend: '周末 / 节假日' },
      subject: { request: 'Excellentia VIP 预订请求', itinerary: 'Excellentia VIP 行程请求' },
      body: { requestPrefix: '我想请求以下服务：', itineraryPrefix: '我想请求以下 itinerary：' }
    }
  };

  Object.keys(bookingCopyPatches).forEach(function (lang) {
    bookingCopy[lang] = mergeBookingLocale(bookingCopy.en, bookingCopyPatches[lang]);
  });

  function localeTextMap(section, id, field, fallback) {
    return Object.keys(bookingCopy).reduce(function (acc, lang) {
      var localeSection = bookingCopy[lang] && bookingCopy[lang][section] ? bookingCopy[lang][section] : {};
      var localeEntry = localeSection[id] || {};
      var text = String(localeEntry[field] || '').trim();
      acc[lang] = text || fallback || '';
      return acc;
    }, {});
  }

  function localeRouteTextMap(serviceId, routeIndex, fallback) {
    return Object.keys(bookingCopy).reduce(function (acc, lang) {
      var localeService = bookingCopy[lang] && bookingCopy[lang].services ? bookingCopy[lang].services[serviceId] || {} : {};
      var text = localeService.routes && localeService.routes[routeIndex] ? String(localeService.routes[routeIndex]).trim() : '';
      acc[lang] = text || fallback || '';
      return acc;
    }, {});
  }

  function buildRuntimeCatalog(source) {
    var raw = source && typeof source === 'object' ? source : {};
    var serviceOrder = Array.isArray(raw.serviceOrder) && raw.serviceOrder.length ? raw.serviceOrder.slice() : ['airport', 'chauffeur', 'tour', 'concierge'];
    var vehicleOrder = Array.isArray(raw.vehicleOrder) && raw.vehicleOrder.length ? raw.vehicleOrder.slice() : ['suv', 'van', 'black'];
    var packageOrder = Array.isArray(raw.packageOrder) && raw.packageOrder.length ? raw.packageOrder.slice() : ['essential', 'signature', 'black'];
    var extraOrder = Array.isArray(raw.extraOrder) && raw.extraOrder.length ? raw.extraOrder.slice() : Object.keys(raw.extras || {});
    var serviceDefs = {};
    var vehicleDefs = {};
    var packageDefs = {};
    var extraDefs = {};

    serviceOrder.forEach(function (serviceId) {
      var service = raw.services && raw.services[serviceId] ? raw.services[serviceId] : {};
      var routes = Array.isArray(service.routes) ? service.routes : [];
      var fallbackLabel = String(service.labels && service.labels.en || serviceId).trim();
      serviceDefs[serviceId] = Object.assign({}, service, {
        id: serviceId,
        labels: Object.assign({}, service.labels || {}, localeTextMap('services', serviceId, 'label', fallbackLabel)),
        descriptions: localeTextMap('services', serviceId, 'description', ''),
        kickers: localeTextMap('services', serviceId, 'kicker', ''),
        routes: routes.map(function (route, index) {
          var fallbackRouteLabel = String(route && route.labels && route.labels.en || route && route.id || '').trim();
          return Object.assign({}, route, {
            id: route && route.id ? route.id : serviceId + '-' + index,
            labels: Object.assign({}, route && route.labels ? route.labels : {}, localeRouteTextMap(serviceId, index, fallbackRouteLabel))
          });
        }),
        policyFlags: Array.isArray(service.policyFlags) ? service.policyFlags.slice() : []
      });
    });

    vehicleOrder.forEach(function (vehicleId) {
      var vehicle = raw.vehicles && raw.vehicles[vehicleId] ? raw.vehicles[vehicleId] : {};
      var fallbackLabel = String(vehicle.labels && vehicle.labels.en || vehicleId).trim();
      vehicleDefs[vehicleId] = Object.assign({}, vehicle, {
        id: vehicleId,
        labels: Object.assign({}, vehicle.labels || {}, localeTextMap('vehicles', vehicleId, 'label', fallbackLabel)),
        notes: localeTextMap('vehicles', vehicleId, 'note', '')
      });
    });

    packageOrder.forEach(function (packageId) {
      var pkg = raw.packages && raw.packages[packageId] ? raw.packages[packageId] : {};
      var fallbackLabel = String(pkg.labels && pkg.labels.en || packageId).trim();
      packageDefs[packageId] = Object.assign({}, pkg, {
        id: packageId,
        labels: Object.assign({}, pkg.labels || {}, localeTextMap('packages', packageId, 'label', fallbackLabel)),
        notes: localeTextMap('packages', packageId, 'note', ''),
        details: localeTextMap('packages', packageId, 'detail', ''),
        policyFlags: Array.isArray(pkg.policyFlags) ? pkg.policyFlags.slice() : []
      });
    });

    extraOrder.forEach(function (extraId) {
      var extra = raw.extras && raw.extras[extraId] ? raw.extras[extraId] : {};
      var fallbackLabel = String(extra.labels && extra.labels.en || extraId).trim();
      extraDefs[extraId] = Object.assign({}, extra, {
        id: extraId,
        labels: Object.assign({}, extra.labels || {}, localeTextMap('extras', extraId, 'label', fallbackLabel)),
        shortLabels: localeTextMap('extras', extraId, 'shortLabel', fallbackLabel),
        notes: localeTextMap('extras', extraId, 'note', ''),
        details: localeTextMap('extras', extraId, 'detail', ''),
        eligibleServices: Array.isArray(extra.eligibleServices) ? extra.eligibleServices.slice() : serviceOrder.slice(),
        policyFlags: Array.isArray(extra.policyFlags) ? extra.policyFlags.slice() : []
      });
    });

    return {
      version: String(raw.version || 'vip-catalog-v1').trim() || 'vip-catalog-v1',
      currency: String(raw.currency || 'USD').trim().toUpperCase() || 'USD',
      serviceOrder: serviceOrder,
      vehicleOrder: vehicleOrder,
      packageOrder: packageOrder,
      extraOrder: extraOrder,
      services: serviceDefs,
      vehicles: vehicleDefs,
      packages: packageDefs,
      extras: extraDefs,
      requestModeForService: function (serviceId) {
        return serviceDefs[serviceId] && serviceDefs[serviceId].requestMode === 'book_now' ? 'book_now' : 'quote_first';
      },
      serviceIdsForRequestMode: function (requestMode) {
        return serviceOrder.filter(function (serviceId) {
          return serviceDefs[serviceId] && serviceDefs[serviceId].requestMode === requestMode;
        });
      },
      routeIdForService: function (serviceId, routeIndex) {
        var service = serviceDefs[serviceId];
        if (!service || !Array.isArray(service.routes) || !service.routes.length) return '';
        var route = service.routes[routeIndex] || service.routes[0];
        return route && route.id ? route.id : '';
      },
      nonRefundableExtraIds: function (extraIds) {
        return (Array.isArray(extraIds) ? extraIds : []).filter(function (extraId) {
          var flags = extraDefs[extraId] && Array.isArray(extraDefs[extraId].policyFlags) ? extraDefs[extraId].policyFlags : [];
          return flags.indexOf('non_refundable_after_approval') !== -1;
        });
      },
      selectedPolicyFlags: function (extraIds) {
        var flags = [];
        (Array.isArray(extraIds) ? extraIds : []).forEach(function (extraId) {
          var extraFlags = extraDefs[extraId] && Array.isArray(extraDefs[extraId].policyFlags) ? extraDefs[extraId].policyFlags : [];
          extraFlags.forEach(function (flag) {
            if (flags.indexOf(flag) === -1) flags.push(flag);
          });
        });
        return flags;
      }
    };
  }

  var vipCatalog = buildRuntimeCatalog(window.ExcellentiaVipCatalog || {});
  window.ExcellentiaVipCatalog = vipCatalog;

  var services = vipCatalog.serviceOrder.map(function (serviceId) {
    var service = vipCatalog.services[serviceId] || {};
    return {
      id: serviceId,
      label: service.labels && service.labels.en ? service.labels.en : serviceId,
      description: service.descriptions && service.descriptions.en ? service.descriptions.en : '',
      visual: service.visual || '',
      kicker: service.kickers && service.kickers.en ? service.kickers.en : '',
      base: Number(service.basePrice || 0),
      routes: Array.isArray(service.routes) ? service.routes.map(function (route) {
        return {
          id: route.id || '',
          label: route.labels && route.labels.en ? route.labels.en : '',
          price: Number(route.price || 0)
        };
      }) : []
    };
  });

  var vehicles = vipCatalog.vehicleOrder.map(function (vehicleId) {
    var vehicle = vipCatalog.vehicles[vehicleId] || {};
    return {
      id: vehicleId,
      label: vehicle.labels && vehicle.labels.en ? vehicle.labels.en : vehicleId,
      note: vehicle.notes && vehicle.notes.en ? vehicle.notes.en : '',
      multiplier: Number(vehicle.multiplier || 1)
    };
  });

  var packages = vipCatalog.packageOrder.map(function (packageId) {
    var pkg = vipCatalog.packages[packageId] || {};
    return {
      id: packageId,
      label: pkg.labels && pkg.labels.en ? pkg.labels.en : packageId,
      note: pkg.notes && pkg.notes.en ? pkg.notes.en : '',
      detail: pkg.details && pkg.details.en ? pkg.details.en : '',
      visual: pkg.visual || '',
      multiplier: Number(pkg.multiplier || 1)
    };
  });

  var extras = vipCatalog.extraOrder.map(function (extraId) {
    var extra = vipCatalog.extras[extraId] || {};
    return {
      id: extraId,
      label: extra.labels && extra.labels.en ? extra.labels.en : extraId,
      shortLabel: extra.shortLabels && extra.shortLabels.en ? extra.shortLabels.en : (extra.labels && extra.labels.en ? extra.labels.en : extraId),
      note: extra.notes && extra.notes.en ? extra.notes.en : '',
      detail: extra.details && extra.details.en ? extra.details.en : '',
      visual: extra.visual || '',
      price: Number(extra.price || 0)
    };
  });

  var state = {
    serviceId: 'airport',
    routeIndex: 0,
    vehicleId: 'suv',
    packageId: 'signature',
    extras: {},
    guests: 2,
    timing: 'day',
    notes: ''
  };
  var intake = {
    leadName: '',
    country: '',
    email: '',
    whatsapp: '',
    date: '',
    time: '',
    pickupPoint: '',
    reference: '',
    occasion: '',
    marketingConsent: false,
    whatsappConsent: false,
    privacyConsent: false
  };
  var cart = [];
  var paymentRuntime = {
    loading: '',
    message: ''
  };
  var leadCaptureTimer = 0;
  var leadCaptureFingerprint = '';
  var requestCaptureRuntime = {
    status: '',
    message: ''
  };

  function storage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function publicStripeConfig() {
    var paymentsRaw = window.CDS_CONFIG && window.CDS_CONFIG.vipPayments ? window.CDS_CONFIG.vipPayments : {};
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipStripe ? window.CDS_CONFIG.vipStripe : {};
    var depositPercent = Number(raw.depositPercent || DEFAULT_STRIPE_CONFIG.depositPercent);
    return {
      enabled: Boolean(typeof paymentsRaw.enabled === 'boolean' ? paymentsRaw.enabled : raw.enabled),
      gateway: sanitizeFreeText(paymentsRaw.primaryGateway || 'cardnet', 24) || 'cardnet',
      checkoutEndpoint: sanitizeFreeText(paymentsRaw.checkoutEndpoint || raw.checkoutEndpoint || DEFAULT_STRIPE_CONFIG.checkoutEndpoint, 160) || DEFAULT_STRIPE_CONFIG.checkoutEndpoint,
      merchantName: sanitizeFreeText(raw.merchantName || DEFAULT_STRIPE_CONFIG.merchantName, 80) || DEFAULT_STRIPE_CONFIG.merchantName,
      currency: sanitizeFreeText(raw.currency || DEFAULT_STRIPE_CONFIG.currency, 8).toLowerCase() || DEFAULT_STRIPE_CONFIG.currency,
      depositPercent: Number.isFinite(depositPercent) ? Math.max(10, Math.min(80, Math.round(depositPercent))) : DEFAULT_STRIPE_CONFIG.depositPercent,
      successPath: sanitizeFreeText(raw.successPath || DEFAULT_STRIPE_CONFIG.successPath, 120) || DEFAULT_STRIPE_CONFIG.successPath,
      cancelPath: sanitizeFreeText(raw.cancelPath || DEFAULT_STRIPE_CONFIG.cancelPath, 120) || DEFAULT_STRIPE_CONFIG.cancelPath
    };
  }

  function leadCaptureConfig() {
    var root = window.CDS_CONFIG || {};
    return {
      endpoint: sanitizeFreeText(root.leadCaptureEndpoint || '', 240),
      mode: sanitizeFreeText(root.leadCaptureMode || '', 48).toLowerCase()
    };
  }

  function publicAccountConfig() {
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipAccount ? window.CDS_CONFIG.vipAccount : {};
    return {
      profileEndpoint: sanitizeFreeText(raw.profileEndpoint || DEFAULT_ACCOUNT_CONFIG.profileEndpoint, 160) || DEFAULT_ACCOUNT_CONFIG.profileEndpoint,
      bookingsEndpoint: sanitizeFreeText(raw.bookingsEndpoint || DEFAULT_ACCOUNT_CONFIG.bookingsEndpoint, 160) || DEFAULT_ACCOUNT_CONFIG.bookingsEndpoint,
      leadsEndpoint: sanitizeFreeText(raw.leadsEndpoint || DEFAULT_ACCOUNT_CONFIG.leadsEndpoint, 160) || DEFAULT_ACCOUNT_CONFIG.leadsEndpoint,
      offersEndpoint: sanitizeFreeText(raw.offersEndpoint || DEFAULT_ACCOUNT_CONFIG.offersEndpoint, 160) || DEFAULT_ACCOUNT_CONFIG.offersEndpoint,
      sessionStorageKey: sanitizeFreeText(raw.sessionStorageKey || DEFAULT_ACCOUNT_CONFIG.sessionStorageKey, 64) || DEFAULT_ACCOUNT_CONFIG.sessionStorageKey,
      accountPath: sanitizeFreeText(raw.accountPath || DEFAULT_ACCOUNT_CONFIG.accountPath, 160) || DEFAULT_ACCOUNT_CONFIG.accountPath
    };
  }

  function publicBookingsConfig() {
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipBookings ? window.CDS_CONFIG.vipBookings : {};
    var dedupeWindowMinutes = Number(raw.dedupeWindowMinutes || DEFAULT_BOOKINGS_CONFIG.dedupeWindowMinutes);
    return {
      enabled: Boolean(raw.enabled),
      createEndpoint: sanitizeFreeText(raw.createEndpoint || DEFAULT_BOOKINGS_CONFIG.createEndpoint, 160) || DEFAULT_BOOKINGS_CONFIG.createEndpoint,
      adminEndpoint: sanitizeFreeText(raw.adminEndpoint || DEFAULT_BOOKINGS_CONFIG.adminEndpoint, 160) || DEFAULT_BOOKINGS_CONFIG.adminEndpoint,
      adminSessionStorageKey: sanitizeFreeText(raw.adminSessionStorageKey || DEFAULT_BOOKINGS_CONFIG.adminSessionStorageKey, 64) || DEFAULT_BOOKINGS_CONFIG.adminSessionStorageKey,
      dedupeWindowMinutes: Number.isFinite(dedupeWindowMinutes) ? Math.max(10, Math.min(43200, Math.round(dedupeWindowMinutes))) : DEFAULT_BOOKINGS_CONFIG.dedupeWindowMinutes
    };
  }

  function sanitizePhoneDigits(value) {
    return String(value || '').replace(/[^\d]/g, '').slice(0, 18);
  }

  function publicRoutingConfig() {
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipRouting ? window.CDS_CONFIG.vipRouting : {};
    var ownerWhatsappDigits = sanitizePhoneDigits(raw.ownerWhatsapp || DEFAULT_ROUTING_CONFIG.ownerWhatsapp);
    return {
      bookingEmail: sanitizeEmail(raw.bookingEmail || DEFAULT_ROUTING_CONFIG.bookingEmail) || DEFAULT_ROUTING_CONFIG.bookingEmail,
      ownerName: sanitizeFreeText(raw.ownerName || DEFAULT_ROUTING_CONFIG.ownerName, 80) || DEFAULT_ROUTING_CONFIG.ownerName,
      ownerEmail: sanitizeEmail(raw.ownerEmail || DEFAULT_ROUTING_CONFIG.ownerEmail),
      ownerWhatsapp: ownerWhatsappDigits ? '+' + ownerWhatsappDigits : '',
      ownerWhatsappDigits: ownerWhatsappDigits,
      ownerWhatsappDisplay: sanitizeFreeText(raw.ownerWhatsappDisplay || raw.ownerWhatsapp || DEFAULT_ROUTING_CONFIG.ownerWhatsappDisplay, 32)
    };
  }

  function hasId(collection, id) {
    return collection.some(function (item) { return item.id === id; });
  }

  function applyPrefillFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var serviceId = params.get('service');
    var routeIndex = params.get('route');
    var packageId = params.get('package');
    var vehicleId = params.get('vehicle');
    var extrasParam = params.get('extras') || params.get('extra');

    if (serviceId && hasId(services, serviceId)) {
      state.serviceId = serviceId;
      state.routeIndex = 0;
    }

    if (packageId && hasId(packages, packageId)) {
      state.packageId = packageId;
    }

    if (vehicleId && hasId(vehicles, vehicleId)) {
      state.vehicleId = vehicleId;
    }

    if (routeIndex !== null) {
      var parsedRouteIndex = Number(routeIndex);
      var service = getService();
      if (Number.isInteger(parsedRouteIndex) && parsedRouteIndex >= 0 && parsedRouteIndex < service.routes.length) {
        state.routeIndex = parsedRouteIndex;
      }
    }

    state.extras = {};
    if (extrasParam) {
      extrasParam.split(',').map(function (item) { return item.trim(); }).forEach(function (id) {
        if (hasId(extras, id)) {
          state.extras[id] = true;
        }
      });
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getService() {
    return services.find(function (item) { return item.id === state.serviceId; }) || services[0];
  }

  function getVehicle() {
    return vehicles.find(function (item) { return item.id === state.vehicleId; }) || vehicles[0];
  }

  function getPackage() {
    return packages.find(function (item) { return item.id === state.packageId; }) || packages[0];
  }

  function activeExtras() {
    return extras.filter(function (item) { return Boolean(state.extras[item.id]); });
  }

  function sanitizeRouteIndex(service, value) {
    var parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < service.routes.length) {
      return parsed;
    }
    return 0;
  }

  function sanitizeGuests(value) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 2;
    }
    return Math.max(1, Math.min(16, Math.round(parsed)));
  }

  function sanitizeTiming(value) {
    return value === 'night' || value === 'weekend' ? value : 'day';
  }

  function sanitizeExtraIds(value) {
    var list = Array.isArray(value) ? value : [];
    return list.filter(function (id, index) {
      return hasId(extras, id) && list.indexOf(id) === index;
    });
  }

  function selectionFromState() {
    return {
      id: Date.now() + '-' + Math.random().toString(16).slice(2, 8),
      serviceId: state.serviceId,
      routeIndex: state.routeIndex,
      vehicleId: state.vehicleId,
      packageId: state.packageId,
      guests: state.guests,
      timing: state.timing,
      notes: compactText(state.notes.trim(), 120),
      extras: activeExtras().map(function (extra) { return extra.id; })
    };
  }

  function normalizeCartItem(raw) {
    if (!raw || typeof raw !== 'object' || !hasId(services, raw.serviceId)) {
      return null;
    }
    var service = services.find(function (item) { return item.id === raw.serviceId; }) || services[0];
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : Date.now() + '-' + Math.random().toString(16).slice(2, 8),
      serviceId: service.id,
      routeIndex: sanitizeRouteIndex(service, raw.routeIndex),
      vehicleId: hasId(vehicles, raw.vehicleId) ? raw.vehicleId : vehicles[0].id,
      packageId: hasId(packages, raw.packageId) ? raw.packageId : packages[0].id,
      guests: sanitizeGuests(raw.guests),
      timing: sanitizeTiming(raw.timing),
      notes: compactText(raw.notes || '', 120),
      extras: sanitizeExtraIds(raw.extras)
    };
  }

  function loadCart() {
    cart = loadStoredCart();
  }

  function loadIntake() {
    intake = loadStoredIntake();
    applyProfileDefaults();
  }

  function persistCart() {
    var store = storage();
    if (!store) return;
    if (!cart.length) {
      store.removeItem(CART_STORAGE_KEY);
      return;
    }
    store.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }

  function persistIntake() {
    var store = storage();
    if (!store) return;
    intake = sanitizeIntake(intake);
    if (!Object.keys(intake).some(function (key) { return intake[key]; })) {
      store.removeItem(INTAKE_STORAGE_KEY);
      return;
    }
    store.setItem(INTAKE_STORAGE_KEY, JSON.stringify(intake));
  }

  function copyForLang(lang) {
    return bookingCopy[lang] || bookingCopy.en;
  }

  function copy() {
    return copyForLang(currentLang());
  }

  function compactText(value, max) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!max || text.length <= max) {
      return text;
    }
    return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  }

  function sanitizeFreeText(value, max) {
    return compactText(String(value || ''), max || 96);
  }

  function sanitizeEmail(value) {
    return sanitizeFreeText(String(value || '').trim().toLowerCase(), 120);
  }

  function sanitizePhone(value) {
    return sanitizeFreeText(String(value || '').trim(), 40);
  }

  function sanitizeDate(value) {
    var text = String(value || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
  }

  function sanitizeTime(value) {
    var text = String(value || '').trim();
    return /^\d{2}:\d{2}$/.test(text) ? text : '';
  }

  function sanitizeIntake(raw) {
    return {
      leadName: sanitizeFreeText(raw && raw.leadName, 80),
      country: sanitizeFreeText(raw && raw.country, 64),
      email: sanitizeEmail(raw && raw.email),
      whatsapp: sanitizePhone(raw && raw.whatsapp),
      date: sanitizeDate(raw && raw.date),
      time: sanitizeTime(raw && raw.time),
      pickupPoint: sanitizeFreeText(raw && raw.pickupPoint, 120),
      reference: sanitizeFreeText(raw && raw.reference, 120),
      occasion: sanitizeFreeText(raw && raw.occasion, 80),
      marketingConsent: Boolean(raw && raw.marketingConsent),
      whatsappConsent: Boolean(raw && raw.whatsappConsent),
      privacyConsent: Boolean(raw && raw.privacyConsent)
    };
  }

  function customerSessionStoreKey() {
    return publicAccountConfig().sessionStorageKey || CUSTOMER_SESSION_STORAGE_KEY;
  }

  function loadCustomerSession() {
    var store = storage();
    if (!store) return null;
    try {
      var raw = JSON.parse(store.getItem(customerSessionStoreKey()) || 'null');
      if (!raw || typeof raw !== 'object' || !raw.accessToken) return null;
      if (raw.expiresAt && Number(raw.expiresAt) && Number(raw.expiresAt) < Date.now() - 60000) {
        store.removeItem(customerSessionStoreKey());
        return null;
      }
      return raw;
    } catch (error) {
      store.removeItem(customerSessionStoreKey());
      return null;
    }
  }

  function loadCustomerProfileCache() {
    var store = storage();
    if (!store) return null;
    try {
      var raw = JSON.parse(store.getItem(CUSTOMER_PROFILE_STORAGE_KEY) || 'null');
      return raw && typeof raw === 'object' ? raw : null;
    } catch (error) {
      store.removeItem(CUSTOMER_PROFILE_STORAGE_KEY);
      return null;
    }
  }

  function persistCustomerProfileCache(profile) {
    var store = storage();
    if (!store) return;
    if (!profile || typeof profile !== 'object') {
      store.removeItem(CUSTOMER_PROFILE_STORAGE_KEY);
      return;
    }
    store.setItem(CUSTOMER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  function persistCustomerOffer(offer) {
    var store = storage();
    if (!store) return;
    if (!offer) {
      store.removeItem(CUSTOMER_OFFER_STORAGE_KEY);
      return;
    }
    store.setItem(CUSTOMER_OFFER_STORAGE_KEY, JSON.stringify(offer));
  }

  function authHeaders(headers) {
    var session = loadCustomerSession();
    if (session && session.accessToken) {
      headers.Authorization = 'Bearer ' + session.accessToken;
    }
    return headers;
  }

  function currentUtmState() {
    try {
      var params = new URLSearchParams(window.location.search);
      return {
        utmSource: sanitizeFreeText(params.get('utm_source'), 120),
        utmMedium: sanitizeFreeText(params.get('utm_medium'), 120),
        utmCampaign: sanitizeFreeText(params.get('utm_campaign'), 120),
        utmContent: sanitizeFreeText(params.get('utm_content'), 120),
        utmTerm: sanitizeFreeText(params.get('utm_term'), 120)
      };
    } catch (error) {
      return {
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: '',
        utmTerm: ''
      };
    }
  }

  function leadRequestModeValue(serviceId) {
    return requestModeKey(serviceId) === 'bookNow' ? 'book_now' : 'quote_first';
  }

  function journeyStageForMode(mode, explicitStage) {
    if (explicitStage) return explicitStage;
    if (mode === 'itinerary') return 'itinerary_saved';
    if (mode === 'payment') return 'payment_started';
    return 'profile_captured';
  }

  function buildPolicySnapshot(mode) {
    var selectedExtraIds = mode === 'itinerary'
      ? cart.reduce(function (list, item) {
          sanitizeExtraIds(item.extras).forEach(function (extraId) {
            if (list.indexOf(extraId) === -1) list.push(extraId);
          });
          return list;
        }, [])
      : activeExtras().map(function (extra) { return extra.id; });
    var selectedPolicyFlags = vipCatalog.selectedPolicyFlags(selectedExtraIds);
    var requestMode = mode === 'itinerary' ? 'quote_first' : leadRequestModeValue(state.serviceId);
    return {
      catalog_version: vipCatalog.version,
      currency: vipCatalog.currency,
      payment_mode: mode === 'payment' ? 'book_now' : 'request_first',
      request_mode: requestMode,
      service_id: state.serviceId,
      route_id: vipCatalog.routeIdForService(state.serviceId, state.routeIndex),
      vehicle_id: state.vehicleId,
      package_id: state.packageId,
      selected_extra_ids: selectedExtraIds,
      selected_extra_policy_flags: selectedPolicyFlags,
      non_refundable_extra_ids: vipCatalog.nonRefundableExtraIds(selectedExtraIds),
      book_now_services: vipCatalog.serviceIdsForRequestMode('book_now'),
      quote_first_services: vipCatalog.serviceIdsForRequestMode('quote_first'),
      mixed_itinerary_policy: 'Mixed or multi-item itineraries remain request-first until the team confirms scope and amount.',
      deposit_policy: 'Deposits secure the service window before dispatch and staging are committed.',
      cancellation_policy: 'Approved celebration sourcing, custom styling and special purchases remain non-refundable once confirmed.',
      sourced_custom_policy: selectedPolicyFlags.indexOf('non_refundable_after_approval') !== -1
        ? 'Selected sourced/custom extras become non-refundable once approved and staged.'
        : 'No sourced/custom extras are selected yet.',
      marketing_consent: intake.marketingConsent ? 'granted' : 'not_granted',
      whatsapp_consent: intake.whatsappConsent ? 'granted' : 'not_granted',
      privacy_consent: intake.privacyConsent ? 'accepted' : 'pending'
    };
  }

  function applyProfileDefaults() {
    var profile = loadCustomerProfileCache();
    if (!profile) return;
    if (!intake.leadName && profile.fullName) intake.leadName = sanitizeFreeText(profile.fullName, 80);
    if (!intake.country && profile.country) intake.country = sanitizeFreeText(profile.country, 64);
    if (!intake.email && profile.email) intake.email = sanitizeEmail(profile.email);
    if (!intake.whatsapp && profile.whatsapp) intake.whatsapp = sanitizePhone(profile.whatsapp);
    if (profile.marketingConsent) intake.marketingConsent = true;
    if (profile.whatsappConsent) intake.whatsappConsent = true;
    if (profile.privacyAcceptedAt) intake.privacyConsent = true;
  }

  function loadStructuredCaptureCache() {
    var store = storage();
    if (!store) return null;
    try {
      var raw = JSON.parse(store.getItem(STRUCTURED_CAPTURE_STORAGE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return null;
      if (!raw.fingerprint || !raw.bookingId || !raw.bookingCode || !raw.capturedAt) return null;
      return raw;
    } catch (error) {
      store.removeItem(STRUCTURED_CAPTURE_STORAGE_KEY);
      return null;
    }
  }

  function persistStructuredCaptureCache(entry) {
    var store = storage();
    if (!store) return;
    if (!entry) {
      store.removeItem(STRUCTURED_CAPTURE_STORAGE_KEY);
      return;
    }
    store.setItem(STRUCTURED_CAPTURE_STORAGE_KEY, JSON.stringify(entry));
  }

  function routeSummary(route) {
    var label = String(route && route.label ? route.label : '').replace(/\s+/g, ' ').trim();
    return label.replace(/^.*?(?:->|→)\s*/, '');
  }

  function requestModeKey(serviceId) {
    return vipCatalog.requestModeForService(serviceId) === 'book_now' ? 'bookNow' : 'askFirst';
  }

  function isStripeEligibleService(serviceId) {
    return requestModeKey(serviceId) === 'bookNow';
  }

  function paymentQueryState() {
    try {
      var value = new URLSearchParams(window.location.search).get('payment');
      return value === 'success' || value === 'cancelled' ? value : '';
    } catch (error) {
      return '';
    }
  }

  function currentSelectionView(langCopy) {
    return itemView(selectionFromState(), langCopy || copy());
  }

  function depositAmountForTotal(total, percent) {
    var majorTotal = Math.max(0, Number(total || 0));
    if (!majorTotal) return 0;
    var computed = Math.round(majorTotal * (percent / 100));
    return Math.min(majorTotal, Math.max(5, computed));
  }

  function checkoutMissingFields(langCopy) {
    var missing = [];
    if (!intake.leadName) missing.push(langCopy.ui.leadName);
    if (!intake.country) missing.push(langCopy.ui.country);
    if (!intake.email) missing.push(langCopy.ui.email);
    if (!intake.date) missing.push(langCopy.ui.travelDate);
    if (!intake.time) missing.push(langCopy.ui.travelTime);
    if (!intake.pickupPoint) missing.push(langCopy.ui.pickupPoint);
    return missing;
  }

  function requestReadinessSteps(langCopy) {
    var fallbackUi = bookingCopy.en && bookingCopy.en.ui ? bookingCopy.en.ui : {};
    return [
      {
        label: langCopy.ui.leadName,
        ready: Boolean(intake.leadName),
        value: intake.leadName || langCopy.ui.missingLeadName
      },
      {
        label: langCopy.ui.country,
        ready: Boolean(intake.country),
        value: intake.country || langCopy.ui.missingCountry
      },
      {
        label: langCopy.ui.email || fallbackUi.email,
        ready: Boolean(intake.email),
        value: intake.email || langCopy.ui.missingContact
      },
      {
        label: langCopy.ui.travelMoment,
        ready: Boolean(intake.date && intake.time),
        value: [intake.date, intake.time].filter(Boolean).join(' · ') || langCopy.ui.missingTravel
      },
      {
        label: langCopy.ui.pickupPoint,
        ready: Boolean(intake.pickupPoint),
        value: intake.pickupPoint || langCopy.ui.missingPickup
      }
    ];
  }

  function requestReadinessNextStep(langCopy, missingCount) {
    var fallbackUi = bookingCopy.en && bookingCopy.en.ui ? bookingCopy.en.ui : {};
    var config = publicStripeConfig();
    if (missingCount) {
      return langCopy.ui.readinessNextComplete || fallbackUi.readinessNextComplete || 'Complete the missing details, then send the request.';
    }
    if (!isStripeEligibleService(state.serviceId)) {
      return langCopy.ui.readinessNextQuote || fallbackUi.readinessNextQuote || 'This service stays quote-first. Send the request and let the team confirm the amount before payment.';
    }
    if (!config.enabled) {
      return langCopy.ui.readinessNextSetup || fallbackUi.readinessNextSetup || 'Payment activation is still pending. Send the request now and the team will confirm payment next.';
    }
    return langCopy.ui.readinessNextPay || fallbackUi.readinessNextPay || 'The request is ready. Send it now or continue into secure checkout.';
  }

  function selectionExtrasLine(view) {
    return view.extras && view.extras.length ? view.extras.join(', ') : '';
  }

  function buildCheckoutPayload(paymentKind, langCopy, bookingRecord) {
    var config = publicStripeConfig();
    var routing = publicRoutingConfig();
    var view = currentSelectionView(langCopy);
    var selectedExtraIds = activeExtras().map(function (extra) { return extra.id; });
    var successPath = config.successPath;
    var cancelPath = config.cancelPath;
    var lang = currentLang();

    if (lang !== 'en') {
      successPath += '?lang=' + encodeURIComponent(lang);
      cancelPath += '?lang=' + encodeURIComponent(lang);
    }

    return {
      paymentKind: paymentKind,
      merchantName: config.merchantName,
      currency: config.currency,
      amount: paymentKind === 'deposit' ? depositAmountForTotal(view.total, config.depositPercent) : view.total,
      fullAmount: view.total,
      depositAmount: depositAmountForTotal(view.total, config.depositPercent),
      catalogVersion: vipCatalog.version,
      gateway: config.gateway,
      requestMode: leadRequestModeValue(state.serviceId),
      serviceId: state.serviceId,
      routeId: vipCatalog.routeIdForService(state.serviceId, state.routeIndex),
      vehicleId: state.vehicleId,
      packageId: state.packageId,
      extraIds: selectedExtraIds,
      serviceLabel: view.title,
      routeLabel: view.route,
      vehicleLabel: view.vehicle,
      packageLabel: view.packageLabel,
      extrasLabel: selectionExtrasLine(view),
      notes: view.notes,
      leadName: intake.leadName,
      country: intake.country,
      email: intake.email,
      whatsapp: intake.whatsapp,
      pickupPoint: intake.pickupPoint,
      reference: intake.reference,
      occasion: intake.occasion,
      date: intake.date,
      time: intake.time,
      ownerName: routing.ownerName,
      ownerEmail: routing.ownerEmail,
      ownerPhone: routing.ownerWhatsapp,
      bookingId: bookingRecord && bookingRecord.bookingId ? bookingRecord.bookingId : '',
      bookingCode: bookingRecord && bookingRecord.bookingCode ? bookingRecord.bookingCode : '',
      policySnapshot: buildPolicySnapshot('payment'),
      successPath: successPath,
      cancelPath: cancelPath
    };
  }

  function formatContactLine() {
    var parts = [];
    if (intake.email) parts.push(intake.email);
    if (intake.whatsapp) parts.push(intake.whatsapp);
    return parts.join(' · ');
  }

  function formatTravelMoment(langCopy) {
    var parts = [];
    if (intake.date) parts.push(intake.date);
    if (intake.time) parts.push(intake.time);
    if (!parts.length && state.timing) {
      parts.push(langCopy.timing[state.timing] || state.timing);
    }
    return parts.join(' · ');
  }

  function intakeBrief(langCopy) {
    return {
      leadName: intake.leadName || langCopy.ui.missingLeadName,
      country: intake.country || langCopy.ui.missingCountry,
      contact: formatContactLine() || langCopy.ui.missingContact,
      travel: formatTravelMoment(langCopy) || langCopy.ui.missingTravel,
      pickup: intake.pickupPoint || langCopy.ui.missingPickup,
      reference: intake.reference || langCopy.ui.noReference,
      mode: langCopy.ui[requestModeKey(state.serviceId)]
    };
  }

  function buildRequestText(langCopy, lines, brief, total, contactLines, bookingCode) {
    var sections = ['Excellentia VIP,', '', langCopy.body.requestPrefix];
    if (contactLines.length) {
      sections.push('');
      contactLines.forEach(function (line) {
        sections.push('- ' + line);
      });
    }
    sections.push('');
    if (bookingCode) {
      sections.push('- ' + langCopy.ui.bookingCodeLabel + ': ' + bookingCode);
    }
    sections.push('- ' + langCopy.ui.requestMode + ': ' + brief.mode);
    lines.forEach(function (line) {
      sections.push('- ' + line);
    });
    sections.push('- ' + langCopy.ui.estimatedConcept + ': ' + money.format(total));
    sections.push('');
    sections.push(langCopy.ui.confirm);
    return sections.join('\n');
  }

  function buildItineraryText(langCopy, total, bookingCode) {
    var contactLines = buildContactLines(langCopy);
    var bodyLines = ['Excellentia VIP,', '', langCopy.body.itineraryPrefix, ''];
    contactLines.forEach(function (line) {
      bodyLines.push(line);
    });
    if (contactLines.length) bodyLines.push('');
    if (bookingCode) {
      bodyLines.push(langCopy.ui.bookingCodeLabel + ': ' + bookingCode);
      bodyLines.push('');
    }
    cart.forEach(function (item, index) {
      var view = itemView(item);
      var mode = langCopy.ui[requestModeKey(item.serviceId)];
      bodyLines.push(langCopy.ui.item + ' ' + (index + 1) + ': ' + view.title);
      bodyLines.push(langCopy.ui.requestMode + ': ' + mode);
      bodyLines.push(langCopy.ui.route + ': ' + view.route);
      bodyLines.push(langCopy.ui.vehicle + ': ' + view.vehicle);
      bodyLines.push(langCopy.ui.package + ': ' + view.packageLabel);
      bodyLines.push(langCopy.ui.guests + ': ' + view.guests);
      bodyLines.push(langCopy.ui.timing + ': ' + (langCopy.timing[view.timing] || view.timing));
      if (view.extras.length) bodyLines.push(langCopy.ui.addOns + ': ' + view.extras.join(', '));
      if (view.notes) bodyLines.push(langCopy.ui.notes + ': ' + compactText(view.notes, 96));
      bodyLines.push(langCopy.ui.estimatedConcept + ': ' + money.format(view.total));
      bodyLines.push('');
    });
    bodyLines.push(langCopy.ui.itineraryTotal + ': ' + money.format(total));
    bodyLines.push('');
    bodyLines.push(langCopy.ui.confirm);
    return bodyLines.join('\n');
  }

  function bookingSubject(base, bookingCode) {
    return bookingCode ? base + ' · ' + bookingCode : base;
  }

  function buildRequestChannelHref(channel, langCopy, bookingCode) {
    var routing = publicRoutingConfig();
    var service = getService();
    var requestText = buildRequestText(langCopy, buildLines(), intakeBrief(langCopy), computeTotal(), buildContactLines(langCopy), bookingCode);
    if (channel === 'email') {
      var subject = bookingSubject(langCopy.subject.request + ' — ' + (intake.leadName ? intake.leadName + ' — ' : '') + serviceSummary(service), bookingCode);
      return 'mailto:' + routing.bookingEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(requestText);
    }
    return buildWhatsAppHref(requestText);
  }

  function buildItineraryChannelHref(channel, langCopy, bookingCode) {
    var routing = publicRoutingConfig();
    var total = cart.reduce(function (sum, item) { return sum + itemView(item).total; }, 0);
    var itineraryText = buildItineraryText(langCopy, total, bookingCode);
    if (channel === 'email') {
      var subject = bookingSubject(langCopy.subject.itinerary + (intake.leadName ? ' — ' + intake.leadName : ''), bookingCode);
      return 'mailto:' + routing.bookingEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(itineraryText);
    }
    return buildWhatsAppHref(itineraryText);
  }

  function buildWhatsAppHref(text) {
    var routing = publicRoutingConfig();
    if (routing.ownerWhatsappDigits) {
      return WHATSAPP_BASE + routing.ownerWhatsappDigits + '?text=' + encodeURIComponent(text);
    }
    return WHATSAPP_BASE + '?text=' + encodeURIComponent(text);
  }

  function requestCaptureTargets() {
    return [byId('requestCaptureNote'), byId('cartCaptureNote')].filter(Boolean);
  }

  function renderRequestCaptureNote() {
    var targets = requestCaptureTargets();
    if (!targets.length) return;
    var langCopy = copy();
    targets.forEach(function (node) {
      var defaultMessage = node.id === 'cartCaptureNote'
        ? langCopy.ui.requestCaptureCartReady
        : langCopy.ui.requestCaptureReady;
      node.textContent = requestCaptureRuntime.message || defaultMessage;
      node.className = 'request-capture-note' + (requestCaptureRuntime.status ? ' is-' + requestCaptureRuntime.status : '');
    });
  }

  function setRequestCaptureState(status, message) {
    requestCaptureRuntime.status = status || '';
    requestCaptureRuntime.message = message || '';
    renderRequestCaptureNote();
  }

  function submitJsonp(endpoint, payload, action) {
    return new Promise(function (resolve) {
      var callbackName = '__vipLeadCallback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      var script = document.createElement('script');
      var resolved = false;

      function cleanup(result) {
        if (resolved) return;
        resolved = true;
        try { delete window[callbackName]; } catch (error) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
        resolve(Boolean(result && result.ok));
      }

      var timeout = window.setTimeout(function () {
        cleanup({ ok: false });
      }, 3500);
      var params = new URLSearchParams();

      Object.keys(payload).forEach(function (key) {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') return;
        params.set(key, String(payload[key]));
      });

      params.set('action', action || 'lead');
      params.set('callback', callbackName);

      window[callbackName] = function (result) {
        window.clearTimeout(timeout);
        cleanup(result);
      };

      script.async = true;
      script.src = endpoint + (endpoint.indexOf('?') === -1 ? '?' : '&') + params.toString();
      script.onerror = function () {
        window.clearTimeout(timeout);
        cleanup({ ok: false });
      };
      document.body.appendChild(script);
    });
  }

  async function submitLeadCapture(payload) {
    var config = leadCaptureConfig();
    var accountConfig = publicAccountConfig();

    if (accountConfig.leadsEndpoint) {
      try {
        var accountResponse = await fetch(accountConfig.leadsEndpoint, {
          method: 'POST',
          headers: authHeaders({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(payload)
        });
        var accountResult = await accountResponse.json().catch(function () { return {}; });
        if (accountResponse.ok) {
          if (accountResult && accountResult.offer) {
            persistCustomerOffer(accountResult.offer);
          }
          return {
            ok: true,
            offer: accountResult && accountResult.offer ? accountResult.offer : null,
            profileId: accountResult && accountResult.profileId ? accountResult.profileId : '',
            leadId: accountResult && accountResult.leadId ? accountResult.leadId : ''
          };
        }
      } catch (error) {}
    }

    if (!config.endpoint) return { ok: false };

    try {
      if (config.mode === 'google-apps-script') {
        return { ok: await submitJsonp(config.endpoint, payload, 'lead') };
      }

      var response = await fetch(config.endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({ action: 'lead' }, payload))
      });
      return { ok: Boolean(response && response.ok) };
    } catch (error) {
      return { ok: false };
    }
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var settled = false;
      var timer = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve(false);
      }, ms);

      promise.then(function (value) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      }).catch(function () {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(false);
      });
    });
  }

  function dispatchLeadCaptureEvent(ok, payload) {
    try {
      document.dispatchEvent(new CustomEvent('cds:lead-submit', {
        detail: {
          mode: ok ? 'success' : 'fallback',
          formType: payload.form_type || '',
          projectType: payload.projectType || '',
          market: payload.market || ''
        }
      }));
    } catch (error) {}
  }

  function buildLeadCaptureGoal(channel, mode, formattedTotal, requestText, primaryView, routeLabel) {
    var parts = [
      'Channel: ' + channel,
      'Mode: ' + mode,
      formattedTotal ? 'Estimated total: ' + formattedTotal : '',
      intake.pickupPoint ? 'Pickup: ' + intake.pickupPoint : '',
      intake.reference ? 'Reference: ' + intake.reference : '',
      primaryView.vehicle ? 'Vehicle: ' + primaryView.vehicle : '',
      primaryView.packageLabel ? 'Package: ' + primaryView.packageLabel : '',
      routeLabel ? 'Route: ' + routeLabel : '',
      primaryView.extras && primaryView.extras.length ? 'Extras: ' + primaryView.extras.join(', ') : '',
      'Summary: ' + compactText(requestText, 260)
    ].filter(Boolean);
    return compactText(parts.join(' | '), 500);
  }

  function buildLeadCapturePayload(mode, channel, langCopy, bookingRecord, explicitStage) {
    var isItinerary = mode === 'itinerary';
    var primaryView = currentSelectionView(langCopy);
    var selectedExtraIds = activeExtras().map(function (extra) { return extra.id; });
    var total = isItinerary
      ? cart.reduce(function (sum, item) { return sum + itemView(item, langCopy).total; }, 0)
      : primaryView.total;
    var requestText = isItinerary
      ? buildItineraryText(langCopy, total)
      : buildRequestText(langCopy, buildLines(), intakeBrief(langCopy), total, buildContactLines(langCopy));
    var routeLabel = isItinerary
      ? compactText(cart.map(function (item) { return itemView(item, langCopy).route; }).join(' • '), 160)
      : primaryView.route;
    var utm = currentUtmState();
    var requestMode = isItinerary ? 'quote_first' : leadRequestModeValue(state.serviceId);
    var journeyStage = journeyStageForMode(mode, explicitStage);

    return {
      form_type: isItinerary ? 'vip_itinerary_request' : 'vip_booking_request',
      page: (window.location.pathname || '').toLowerCase() || '/excellentia-vip-booking.html',
      language: currentLang(),
      currency: String(publicStripeConfig().currency || 'usd').toUpperCase(),
      business: 'Excellentia VIP',
      company: 'Excellentia VIP',
      contact: intake.leadName || 'Website guest',
      email: intake.email || '',
      website: window.location.href || '',
      market: intake.country || '',
      country: intake.country || '',
      sector: 'luxury_transport_concierge',
      projectType: isItinerary ? 'vip_itinerary' : state.serviceId,
      budget: total ? String(total) : '',
      goal: buildLeadCaptureGoal(channel, isItinerary ? 'mixed_itinerary' : requestModeKey(state.serviceId), total ? money.format(total) : '', requestText, primaryView, routeLabel),
      timeline: [intake.date, intake.time, intake.pickupPoint].filter(Boolean).join(' · '),
      source: 'excellentia_vip_booking',
      user_agent: navigator.userAgent || '',
      submitted_at: new Date().toISOString(),
      lead_name: intake.leadName || '',
      guest_whatsapp: intake.whatsapp || '',
      pickup_point: intake.pickupPoint || '',
      reference: intake.reference || '',
      occasion: intake.occasion || '',
      request_channel: channel,
      request_mode: requestMode,
      service_label: isItinerary ? (cart.length + '-item itinerary') : primaryView.title,
      route_label: routeLabel,
      package_label: isItinerary ? '' : primaryView.packageLabel,
      extras_label: isItinerary ? '' : selectionExtrasLine(primaryView),
      estimated_total: total ? String(total) : '',
      locale: currentLang(),
      serviceInterest: isItinerary ? 'Mixed itinerary' : primaryView.title,
      requestMode: requestMode,
      journeyStage: journeyStage,
      pagePath: window.location.pathname || '/excellentia-vip-booking.html',
      exitPath: channel === 'payment' ? '/payment' : '',
      marketingConsent: intake.marketingConsent,
      whatsappConsent: intake.whatsappConsent,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      utmContent: utm.utmContent,
      utmTerm: utm.utmTerm,
      bookingRequestId: bookingRecord && bookingRecord.bookingId ? bookingRecord.bookingId : '',
      payload: {
        catalogVersion: vipCatalog.version,
        bookingCode: bookingRecord && bookingRecord.bookingCode ? bookingRecord.bookingCode : '',
        serviceId: isItinerary ? 'mixed_itinerary' : state.serviceId,
        routeId: isItinerary ? '' : vipCatalog.routeIdForService(state.serviceId, state.routeIndex),
        vehicleId: isItinerary ? '' : state.vehicleId,
        packageId: isItinerary ? '' : state.packageId,
        extraIds: isItinerary ? [] : selectedExtraIds,
        serviceLabel: isItinerary ? (cart.length + '-item itinerary') : primaryView.title,
        routeLabel: routeLabel,
        vehicleLabel: primaryView.vehicle || '',
        packageLabel: isItinerary ? '' : primaryView.packageLabel,
        extrasLabel: isItinerary ? '' : selectionExtrasLine(primaryView),
        notes: state.notes || '',
        pickupDate: intake.date || '',
        pickupTime: intake.time || '',
        pickupPoint: intake.pickupPoint || '',
        reference: intake.reference || '',
        occasion: intake.occasion || '',
        estimatedTotal: total || 0
      }
    };
  }

  function leadCaptureKey(payload) {
    try {
      return JSON.stringify({
        email: payload.email || '',
        whatsapp: payload.guest_whatsapp || payload.whatsapp || '',
        journeyStage: payload.journeyStage || payload.journey_stage || '',
        serviceInterest: payload.serviceInterest || payload.service_interest || '',
        pickupDate: payload.payload && payload.payload.pickupDate ? payload.payload.pickupDate : '',
        pickupPoint: payload.payload && payload.payload.pickupPoint ? payload.payload.pickupPoint : ''
      });
    } catch (error) {
      return '';
    }
  }

  function scheduleLeadCapture(mode, channel, explicitStage) {
    if (!intake.email && !intake.whatsapp) return;
    window.clearTimeout(leadCaptureTimer);
    leadCaptureTimer = window.setTimeout(function () {
      var payload = buildLeadCapturePayload(mode || 'single', channel || 'website', copy(), null, explicitStage || 'profile_captured');
      var fingerprint = leadCaptureKey(payload);
      if (!fingerprint || fingerprint === leadCaptureFingerprint) return;
      leadCaptureFingerprint = fingerprint;
      submitLeadCapture(payload).catch(function () {});
    }, 900);
  }

  function structuredCaptureFingerprint(payload) {
    try {
      return JSON.stringify({
        requestMode: payload.requestMode,
        leadName: payload.leadName,
        country: payload.country,
        guestEmail: payload.guestEmail,
        guestWhatsapp: payload.guestWhatsapp,
        pickupDate: payload.pickupDate,
        pickupTime: payload.pickupTime,
        pickupPoint: payload.pickupPoint,
        reference: payload.reference,
        items: payload.items
      });
    } catch (error) {
      return '';
    }
  }

  function buildStructuredItems(mode, langCopy) {
    if (mode === 'itinerary') {
      return cart.map(function (item) {
        var view = itemView(item, langCopy);
        return {
          serviceId: item.serviceId,
          routeId: vipCatalog.routeIdForService(item.serviceId, item.routeIndex),
          vehicleId: item.vehicleId,
          packageId: item.packageId,
          serviceLabel: view.title,
          routeLabel: view.route,
          vehicleLabel: view.vehicle,
          packageLabel: view.packageLabel,
          guests: view.guests,
          timingLabel: langCopy.timing[view.timing] || view.timing,
          requestMode: langCopy.ui[requestModeKey(item.serviceId)],
          extraIds: sanitizeExtraIds(item.extras),
          extras: view.extras,
          notes: view.notes,
          total: view.total
        };
      });
    }

    var single = currentSelectionView(langCopy);
    return [{
      serviceId: state.serviceId,
      routeId: vipCatalog.routeIdForService(state.serviceId, state.routeIndex),
      vehicleId: state.vehicleId,
      packageId: state.packageId,
      serviceLabel: single.title,
      routeLabel: single.route,
      vehicleLabel: single.vehicle,
      packageLabel: single.packageLabel,
      guests: single.guests,
      timingLabel: langCopy.timing[single.timing] || single.timing,
      requestMode: langCopy.ui[requestModeKey(state.serviceId)],
      extraIds: activeExtras().map(function (extra) { return extra.id; }),
      extras: single.extras,
      notes: single.notes,
      total: single.total
    }];
  }

  function buildStructuredBookingPayload(mode, channel, langCopy) {
    var items = buildStructuredItems(mode, langCopy);
    var total = items.reduce(function (sum, item) { return sum + Number(item.total || 0); }, 0);
    var deposit = mode === 'payment' ? depositAmountForTotal(total, publicStripeConfig().depositPercent) : 0;
    return {
      source: 'Website booking configurator',
      requestChannel: channel || 'website',
      requestMode: mode === 'itinerary'
        ? 'Mixed itinerary'
        : langCopy.ui[requestModeKey(state.serviceId)],
      serviceLabel: mode === 'itinerary'
        ? items.length + '-item itinerary'
        : (items[0] ? items[0].serviceLabel : ''),
      leadName: intake.leadName,
      country: intake.country,
      guestEmail: intake.email,
      guestWhatsapp: intake.whatsapp,
      pickupDate: intake.date,
      pickupTime: intake.time,
      pickupPoint: intake.pickupPoint,
      reference: intake.reference,
      occasion: intake.occasion,
      estimatedTotal: total,
      invoiceAmount: total,
      depositAmount: deposit,
      currency: String(publicStripeConfig().currency || 'usd').toUpperCase(),
      locale: currentLang(),
      marketingConsent: intake.marketingConsent,
      journeyStage: journeyStageForMode(mode, mode === 'single' ? 'request_sent' : ''),
      gateway: publicStripeConfig().gateway,
      policySnapshot: buildPolicySnapshot(mode),
      notificationStatus: mode === 'payment' ? 'awaiting_payment' : 'captured',
      items: items,
      metadata: {
        catalogVersion: vipCatalog.version,
        locale: currentLang(),
        stage: mode,
        page: window.location.pathname || '/excellentia-vip-booking.html',
        occasion: intake.occasion || '',
        marketingConsent: intake.marketingConsent ? 'true' : 'false',
        whatsappConsent: intake.whatsappConsent ? 'true' : 'false',
        privacyConsent: intake.privacyConsent ? 'true' : 'false'
      }
    };
  }

  async function submitStructuredBooking(payload) {
    var config = publicBookingsConfig();
    if (!config.enabled || !config.createEndpoint) {
      return { ok: false, skipped: true };
    }

    try {
      var response = await fetch(config.createEndpoint, {
        method: 'POST',
        headers: authHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.bookingId || !result.bookingCode) {
        return { ok: false, error: result.error || 'capture_failed' };
      }
      return {
        ok: true,
        bookingId: result.bookingId,
        bookingCode: result.bookingCode
      };
    } catch (error) {
      return { ok: false, error: 'network_failed' };
    }
  }

  async function ensureStructuredBooking(mode, channel, langCopy) {
    var config = publicBookingsConfig();
    if (!config.enabled || !config.createEndpoint) {
      return { ok: false, skipped: true };
    }

    var payload = buildStructuredBookingPayload(mode, channel, langCopy);
    var fingerprint = structuredCaptureFingerprint(payload);
    var cached = loadStructuredCaptureCache();
    var now = Date.now();
    var maxAge = config.dedupeWindowMinutes * 60 * 1000;

    if (cached && cached.fingerprint === fingerprint && now - Number(cached.capturedAt || 0) < maxAge) {
      return {
        ok: true,
        bookingId: cached.bookingId,
        bookingCode: cached.bookingCode,
        cached: true
      };
    }

    var result = await submitStructuredBooking(payload);
    if (!result.ok) {
      return result;
    }

    persistStructuredCaptureCache({
      fingerprint: fingerprint,
      bookingId: result.bookingId,
      bookingCode: result.bookingCode,
      capturedAt: now
    });

    return result;
  }

  function buildCaptureStatusMessage(langCopy, didPersist, bookingCode) {
    var base = didPersist ? langCopy.ui.requestCaptureSuccess : langCopy.ui.requestCaptureWarning;
    if (!bookingCode) return base;
    return base + ' ' + langCopy.ui.bookingCodeLabel + ': ' + bookingCode + '.';
  }

  function continueToRequestChannel(link, href, reservedWindow) {
    if (reservedWindow && !reservedWindow.closed) {
      try {
        reservedWindow.location.href = href;
        return;
      } catch (error) {
        try { reservedWindow.close(); } catch (closeError) {}
      }
    }

    if (link && link.target === '_blank') {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.href = href;
  }

  async function captureBeforeChannelOpen(event, mode, channel) {
    var link = event.currentTarget;
    var href = link && link.getAttribute ? link.getAttribute('href') : '';
    if (!href || href === '#') return;

    event.preventDefault();
    var langCopy = copy();
    var reservedWindow = null;
    if (link.target === '_blank') {
      try {
        reservedWindow = window.open('about:blank', '_blank');
      } catch (error) {}
    }

    setRequestCaptureState('pending', langCopy.ui.requestCaptureSaving);
    var persisted = await withTimeout(ensureStructuredBooking(mode, channel, langCopy), 3200);
    var payload = buildLeadCapturePayload(mode, channel, langCopy, persisted && persisted.ok ? persisted : null, mode === 'itinerary' ? 'itinerary_saved' : 'request_sent');
    var leadResult = await withTimeout(submitLeadCapture(payload), 3200);
    var captureOk = Boolean((leadResult && leadResult.ok) || (persisted && persisted.ok));
    if (persisted && persisted.ok && persisted.bookingCode) {
      href = mode === 'itinerary'
        ? buildItineraryChannelHref(channel, langCopy, persisted.bookingCode)
        : buildRequestChannelHref(channel, langCopy, persisted.bookingCode);
      if (link && link.setAttribute) {
        link.setAttribute('href', href);
      }
      if (mode === 'itinerary' && byId('copyCartCTA')) {
        byId('copyCartCTA').dataset.copyText = buildItineraryText(langCopy, cart.reduce(function (sum, item) { return sum + itemView(item).total; }, 0), persisted.bookingCode);
      }
      if (mode !== 'itinerary' && byId('copyRequestCTA')) {
        byId('copyRequestCTA').dataset.copyText = buildRequestText(langCopy, buildLines(), intakeBrief(langCopy), computeTotal(), buildContactLines(langCopy), persisted.bookingCode);
      }
    }
    dispatchLeadCaptureEvent(captureOk, payload);
    setRequestCaptureState(captureOk ? 'success' : 'warning', buildCaptureStatusMessage(langCopy, captureOk, persisted && persisted.bookingCode));
    continueToRequestChannel(link, href, reservedWindow);
  }

  function flashCopyState(button, baseText, tempText) {
    if (!button) return;
    button.textContent = tempText;
    window.clearTimeout(button._copyTimer);
    button._copyTimer = window.setTimeout(function () {
      button.textContent = baseText;
    }, 1800);
  }

  function copyToClipboard(text, button, langCopy, baseLabel) {
    if (!text) {
      flashCopyState(button, baseLabel, langCopy.ui.copyFailed);
      return;
    }

    function fallbackCopy() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      area.style.pointerEvents = 'none';
      document.body.appendChild(area);
      area.focus();
      area.select();
      var copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (error) {}
      document.body.removeChild(area);
      flashCopyState(button, baseLabel, copied ? langCopy.ui.copied : langCopy.ui.copyFailed);
    }

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallbackCopy();
      return;
    }

    navigator.clipboard.writeText(text).then(function () {
      flashCopyState(button, baseLabel, langCopy.ui.copied);
    }).catch(function () {
      fallbackCopy();
    });
  }

  function extraSummary(extra, langCopy) {
    var dict = (langCopy || copy()).extras[extra.id] || {};
    return dict.shortLabel || extra.shortLabel || compactText(dict.label || extra.label, 22);
  }

  function packageSummary(pkg, langCopy) {
    var dict = (langCopy || copy()).packages[pkg.id] || {};
    return dict.label || pkg.label;
  }

  function serviceSummary(service, langCopy) {
    var dict = (langCopy || copy()).services[service.id] || {};
    return dict.label || service.label;
  }

  function routeSummaryLocalized(service, index, langCopy) {
    var dict = (langCopy || copy()).services[service.id] || {};
    var routeLabel = dict.routes && dict.routes[index] ? dict.routes[index] : (service.routes[index] || service.routes[0] || {}).label;
    return routeSummary({ label: routeLabel });
  }

  function itemView(item, langCopy) {
    var localizedCopy = langCopy || copy();
    var service = services.find(function (entry) { return entry.id === item.serviceId; }) || services[0];
    var vehicle = vehicles.find(function (entry) { return entry.id === item.vehicleId; }) || vehicles[0];
    var pkg = packages.find(function (entry) { return entry.id === item.packageId; }) || packages[0];
    var itemExtras = sanitizeExtraIds(item.extras).map(function (id) {
      return extras.find(function (entry) { return entry.id === id; });
    }).filter(Boolean);
    var extrasValue = itemExtras.reduce(function (sum, extra) { return sum + extra.price; }, 0);
    var guestFactor = item.guests > 4 ? (item.guests - 4) * 22 : 0;
    var timingFactor = item.timing === 'night' ? 55 : item.timing === 'weekend' ? 80 : 0;
    var route = service.routes[item.routeIndex] || service.routes[0];
    return {
      title: serviceSummary(service, localizedCopy),
      route: routeSummaryLocalized(service, item.routeIndex, localizedCopy),
      vehicle: (localizedCopy.vehicles[vehicle.id] ? localizedCopy.vehicles[vehicle.id].label : vehicle.label),
      packageLabel: packageSummary(pkg, localizedCopy),
      guests: item.guests,
      timing: item.timing,
      notes: item.notes,
      extras: itemExtras.map(function (extra) { return extraSummary(extra, localizedCopy); }),
      total: Math.round((service.base + route.price) * vehicle.multiplier * pkg.multiplier + extrasValue + guestFactor + timingFactor)
    };
  }

  function loadStoredCart() {
    var store = storage();
    if (!store) {
      return [];
    }
    try {
      var raw = JSON.parse(store.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(raw) ? raw.map(normalizeCartItem).filter(Boolean) : [];
    } catch (error) {
      store.removeItem(CART_STORAGE_KEY);
      return [];
    }
  }

  function loadStoredIntake() {
    var store = storage();
    if (!store) {
      return sanitizeIntake(intake);
    }
    try {
      return sanitizeIntake(JSON.parse(store.getItem(INTAKE_STORAGE_KEY) || '{}'));
    } catch (error) {
      store.removeItem(INTAKE_STORAGE_KEY);
      return sanitizeIntake({});
    }
  }

  function renderServices() {
    var dict = copy().services;
    var langCopy = copy();
    byId('serviceChips').innerHTML = services.map(function (service) {
      var localized = dict[service.id] || {};
      return '<button type="button" class="choice-chip' + (service.id === state.serviceId ? ' is-active' : '') + '" data-service="' + service.id + '" title="' + escapeHtml((localized.label || service.label) + ' — ' + compactText(localized.description || service.description, 90)) + '" aria-label="' + escapeHtml(langCopy.ui.selectService + ' ' + (localized.label || service.label)) + '">' +
        '<span class="card-visual service-media ' + service.visual + '" aria-hidden="true"></span>' +
        '<span class="choice-copy">' +
          '<span class="choice-kicker">' + escapeHtml(localized.kicker || service.kicker) + '</span>' +
          '<strong>' + escapeHtml(localized.label || service.label) + '</strong>' +
          '<span>' + escapeHtml(compactText(localized.description || service.description, 42)) + '</span>' +
        '</span>' +
      '</button>';
    }).join('');
  }

  function renderRoutes() {
    var service = getService();
    var localizedService = (copy().services[service.id] || {});
    var select = byId('routeSelect');
    select.innerHTML = service.routes.map(function (route, index) {
      var routeLabel = localizedService.routes && localizedService.routes[index] ? localizedService.routes[index] : route.label;
      return '<option value="' + index + '">' + escapeHtml(routeLabel) + '</option>';
    }).join('');
    select.value = String(state.routeIndex);
  }

  function renderVehicles() {
    var vehicleCopy = copy().vehicles;
    var select = byId('vehicleSelect');
    select.innerHTML = vehicles.map(function (vehicle) {
      var localized = vehicleCopy[vehicle.id] || {};
      return '<option value="' + vehicle.id + '">' + escapeHtml(localized.label || vehicle.label) + ' — ' + escapeHtml(localized.note || vehicle.note) + '</option>';
    }).join('');
    select.value = state.vehicleId;
  }

  function renderTimingOptions() {
    var langCopy = copy();
    var select = byId('timingSelect');
    if (!select || !select.options || select.options.length < 3) return;
    select.options[0].textContent = langCopy.timing.day;
    select.options[1].textContent = langCopy.timing.night;
    select.options[2].textContent = langCopy.timing.weekend;
  }

  function renderPackages() {
    var packageCopy = copy().packages;
    var langCopy = copy();
    byId('packageCards').innerHTML = packages.map(function (pkg) {
      var localized = packageCopy[pkg.id] || {};
      var label = localized.label || pkg.label;
      return '<button type="button" class="package-card' + (pkg.id === state.packageId ? ' is-active' : '') + '" data-package="' + pkg.id + '" title="' + escapeHtml(label + ' — ' + compactText(localized.detail || pkg.detail, 90)) + '" aria-label="' + escapeHtml(langCopy.ui.selectPackage + ' ' + label) + '">' +
        '<span class="card-visual package-media ' + pkg.visual + '" aria-hidden="true"></span>' +
        '<span class="package-copy">' +
          '<span class="choice-kicker">' + escapeHtml(copy().ui.packageTier) + '</span>' +
          '<strong>' + escapeHtml(label) + '</strong>' +
          '<span>' + escapeHtml(compactText(localized.note || pkg.note, 22)) + '</span>' +
          '<small>' + escapeHtml(compactText(localized.detail || pkg.detail, 42)) + '</small>' +
        '</span>' +
      '</button>';
    }).join('');
  }

  function renderExtras() {
    var extraCopy = copy().extras;
    var langCopy = copy();
    byId('extrasGrid').innerHTML = extras.map(function (extra) {
      var localized = extraCopy[extra.id] || {};
      var label = extraSummary(extra);
      return '<button type="button" class="extra-card' + (state.extras[extra.id] ? ' is-active' : '') + '" data-extra="' + extra.id + '" title="' + escapeHtml(label + ' — ' + compactText(localized.detail || extra.detail, 90)) + '" aria-label="' + escapeHtml(langCopy.ui.toggleExtra + ' ' + label) + '">' +
        '<span class="card-visual extra-media ' + extra.visual + '" aria-hidden="true"></span>' +
        '<span class="extra-copy">' +
          '<span class="choice-kicker">' + escapeHtml(copy().ui.premiumAddOn) + '</span>' +
          '<strong>' + escapeHtml(label) + '</strong>' +
          '<span>' + escapeHtml(compactText(localized.detail || extra.detail, 32)) + '</span>' +
        '</span>' +
        '<span class="extra-price">' + escapeHtml(localized.note || extra.note) + '</span>' +
      '</button>';
    }).join('');
  }

  function computeTotal() {
    var service = getService();
    var route = service.routes[state.routeIndex] || service.routes[0];
    var vehicle = getVehicle();
    var pkg = getPackage();
    var extrasValue = activeExtras().reduce(function (sum, item) { return sum + item.price; }, 0);
    var guestFactor = state.guests > 4 ? (state.guests - 4) * 22 : 0;
    var timingFactor = state.timing === 'night' ? 55 : state.timing === 'weekend' ? 80 : 0;
    var total = (service.base + route.price) * vehicle.multiplier * pkg.multiplier + extrasValue + guestFactor + timingFactor;
    return Math.round(total);
  }

  function buildLines() {
    var service = getService();
    var route = service.routes[state.routeIndex] || service.routes[0];
    var vehicle = getVehicle();
    var pkg = getPackage();
    var langCopy = copy();
    var lines = [
      serviceSummary(service) + ' / ' + routeSummaryLocalized(service, state.routeIndex),
      langCopy.ui.vehicle + ': ' + (langCopy.vehicles[vehicle.id] ? langCopy.vehicles[vehicle.id].label : vehicle.label),
      langCopy.ui.package + ': ' + packageSummary(pkg),
      langCopy.ui.guests + ': ' + state.guests,
      langCopy.ui.timing + ': ' + (langCopy.timing[state.timing] || state.timing)
    ];

    var selectedExtras = activeExtras();
    if (selectedExtras.length) {
      lines.push(langCopy.ui.addOns + ': ' + selectedExtras.map(function (extra) { return extraSummary(extra, langCopy); }).join(', '));
    }

    if (state.notes.trim()) {
      lines.push(langCopy.ui.notes + ': ' + compactText(state.notes.trim(), 96));
    }

    return lines;
  }

  function buildContactLines(langCopy) {
    var lines = [];
    if (intake.leadName) lines.push(langCopy.ui.leadName + ': ' + intake.leadName);
    if (intake.country) lines.push(langCopy.ui.country + ': ' + intake.country);
    if (intake.email) lines.push(langCopy.ui.email + ': ' + intake.email);
    if (intake.whatsapp) lines.push(langCopy.ui.whatsapp + ': ' + intake.whatsapp);
    if (intake.date) lines.push(langCopy.ui.travelDate + ': ' + intake.date);
    if (intake.time) lines.push(langCopy.ui.travelTime + ': ' + intake.time);
    if (intake.pickupPoint) lines.push(langCopy.ui.pickupPoint + ': ' + intake.pickupPoint);
    if (intake.reference) lines.push(langCopy.ui.reference + ': ' + intake.reference);
    return lines;
  }

  function updateSummary() {
    var service = getService();
    var total = computeTotal();
    var lines = buildLines();
    var langCopy = copy();
    var brief = intakeBrief(langCopy);
    var contactLines = buildContactLines(langCopy);
    byId('summaryTitle').textContent = serviceSummary(service);
    byId('summaryTotal').textContent = money.format(total);
    byId('summaryList').innerHTML = [
      '<li><strong>' + escapeHtml(langCopy.ui.service) + ':</strong> ' + serviceSummary(service) + '</li>',
      '<li><strong>' + escapeHtml(langCopy.ui.route) + ':</strong> ' + routeSummaryLocalized(service, state.routeIndex) + '</li>',
      '<li><strong>' + escapeHtml(langCopy.ui.vehicle) + ':</strong> ' + (langCopy.vehicles[getVehicle().id] ? langCopy.vehicles[getVehicle().id].label : getVehicle().label) + '</li>',
      '<li><strong>' + escapeHtml(langCopy.ui.package) + ':</strong> ' + packageSummary(getPackage()) + '</li>',
      '<li><strong>' + escapeHtml(langCopy.ui.guests) + ':</strong> ' + state.guests + '</li>',
      '<li><strong>' + escapeHtml(langCopy.ui.timing) + ':</strong> ' + (langCopy.timing[state.timing] || state.timing) + '</li>',
      '<li><strong>' + escapeHtml(langCopy.ui.requestMode) + ':</strong> ' + escapeHtml(brief.mode) + '</li>'
    ].concat(activeExtras().length ? ['<li><strong>' + escapeHtml(langCopy.ui.addOns) + ':</strong> ' + activeExtras().map(function (extra) { return extraSummary(extra, langCopy); }).join(', ') + '</li>'] : []).concat(state.notes.trim() ? ['<li><strong>' + escapeHtml(langCopy.ui.notes) + ':</strong> ' + compactText(state.notes.trim(), 88) + '</li>'] : []).join('');

    if (byId('briefList')) {
      byId('briefList').innerHTML = [
        '<li><strong>' + escapeHtml(langCopy.ui.requestMode) + ':</strong> ' + escapeHtml(brief.mode) + '</li>',
        '<li><strong>' + escapeHtml(langCopy.ui.leadName) + ':</strong> ' + escapeHtml(brief.leadName) + '</li>',
        '<li><strong>' + escapeHtml(langCopy.ui.country) + ':</strong> ' + escapeHtml(brief.country) + '</li>',
        '<li><strong>' + escapeHtml(langCopy.ui.contactLine) + ':</strong> ' + escapeHtml(brief.contact) + '</li>',
        '<li><strong>' + escapeHtml(langCopy.ui.travelMoment) + ':</strong> ' + escapeHtml(brief.travel) + '</li>',
        '<li><strong>' + escapeHtml(langCopy.ui.pickupPoint) + ':</strong> ' + escapeHtml(brief.pickup) + '</li>',
        '<li><strong>' + escapeHtml(langCopy.ui.reference) + ':</strong> ' + escapeHtml(brief.reference) + '</li>',
        '<li><strong>' + escapeHtml(langCopy.ui.handoffLabel) + ':</strong> ' + escapeHtml(langCopy.ui.handoffLine) + '</li>'
      ].join('');
    }

    var requestText = buildRequestText(langCopy, lines, brief, total, contactLines);
    byId('emailCTA').href = buildRequestChannelHref('email', langCopy, '');
    byId('emailCTA').textContent = langCopy.ui.emailRequest;
    byId('whatsappCTA').href = buildRequestChannelHref('whatsapp', langCopy, '');
    byId('whatsappCTA').textContent = langCopy.ui.whatsappRequest;
    if (byId('copyRequestCTA')) {
      byId('copyRequestCTA').textContent = langCopy.ui.copyRequest;
      byId('copyRequestCTA').dataset.copyText = requestText;
    }
  }

  function renderRequestReadiness() {
    var title = byId('bookingReadinessTitle');
    var label = byId('bookingReadinessLabel');
    var lead = byId('bookingReadinessLead');
    var pill = byId('bookingReadinessPill');
    var list = byId('bookingReadinessList');
    if (!title || !lead || !pill || !list) return;

    var langCopy = copy();
    var fallbackUi = bookingCopy.en && bookingCopy.en.ui ? bookingCopy.en.ui : {};
    var steps = requestReadinessSteps(langCopy);
    var missingCount = steps.filter(function (step) { return !step.ready; }).length;
    var readinessLabelText = langCopy.ui.readinessLabel || fallbackUi.readinessLabel || 'Request readiness';
    var readinessTitleMissing = langCopy.ui.readinessTitleMissing || fallbackUi.readinessTitleMissing || 'Core guest details still missing';
    var readinessTitleReady = langCopy.ui.readinessTitleReady || fallbackUi.readinessTitleReady || 'Request is structurally ready';
    var readinessLeadMissing = langCopy.ui.readinessLeadMissing || fallbackUi.readinessLeadMissing || 'Complete the guest, travel and pickup details so the request can be reviewed and confirmed cleanly.';
    var readinessLeadReady = langCopy.ui.readinessLeadReady || fallbackUi.readinessLeadReady || 'Core guest, travel and pickup details are set. You can now send the request with a clean recap and move faster into confirmation.';
    var readinessStateReady = langCopy.ui.readinessStateReady || fallbackUi.readinessStateReady || 'Locked';
    var readinessStateMissing = langCopy.ui.readinessStateMissing || fallbackUi.readinessStateMissing || 'Missing';
    var readinessNextAction = langCopy.ui.readinessNextAction || fallbackUi.readinessNextAction || 'Next action';

    if (label) {
      label.textContent = readinessLabelText;
    }

    title.textContent = missingCount ? readinessTitleMissing : readinessTitleReady;
    lead.textContent = missingCount ? readinessLeadMissing : readinessLeadReady;
    pill.className = missingCount ? 'status-pill status-pill-missing' : 'status-pill status-pill-ready';
    pill.textContent = missingCount ? missingCount + ' ' + readinessStateMissing.toLowerCase() : readinessStateReady;

    list.innerHTML = steps.map(function (step) {
      return '<li>' +
        '<strong>' + escapeHtml(step.label) + ':</strong> ' +
        escapeHtml(step.value) + ' ' +
        '<span class="status-pill ' + (step.ready ? 'status-pill-ready' : 'status-pill-missing') + '">' + escapeHtml(step.ready ? readinessStateReady : readinessStateMissing) + '</span>' +
      '</li>';
    }).concat([
      '<li><strong>' + escapeHtml(readinessNextAction) + ':</strong> ' + escapeHtml(requestReadinessNextStep(langCopy, missingCount)) + '</li>'
    ]).join('');
  }

  function updatePaymentPanel() {
    var panel = byId('paymentPanel');
    if (!panel) return;

    var langCopy = copy();
    var config = publicStripeConfig();
    var currentView = currentSelectionView(langCopy);
    var isBookable = isStripeEligibleService(state.serviceId);
    var missing = checkoutMissingFields(langCopy);
    var queryState = paymentQueryState();
    var depositAmount = depositAmountForTotal(currentView.total, config.depositPercent);
    var paymentModePill = byId('paymentModePill');
    var paymentConfigPill = byId('paymentConfigPill');
    var paymentNotice = byId('paymentNotice');
    var paymentLead = byId('paymentLead');
    var depositButton = byId('stripeDepositCTA');
    var fullButton = byId('stripeFullCTA');

    byId('bookPaymentLabel').textContent = langCopy.ui.paymentLabel;
    byId('paymentTitle').textContent = langCopy.ui.paymentTitle;
    byId('paymentSelectionLabel').textContent = langCopy.ui.paymentSelection;
    byId('paymentDepositLabel').textContent = langCopy.ui.paymentDeposit;
    byId('paymentFullLabel').textContent = langCopy.ui.paymentFull;
    byId('paymentSelectionValue').textContent = currentView.title + ' · ' + currentView.route;
    byId('paymentDepositValue').textContent = money.format(depositAmount);
    byId('paymentFullValue').textContent = money.format(currentView.total);

    paymentLead.textContent = isBookable ? langCopy.ui.paymentLeadBook : langCopy.ui.paymentLeadQuote;
    paymentModePill.className = 'status-pill ' + (isBookable ? 'status-pill-confirmed' : 'status-pill-requested');
    paymentModePill.textContent = isBookable ? langCopy.ui.paymentModeBook : langCopy.ui.paymentModeQuote;
    paymentConfigPill.className = 'status-pill ' + (config.enabled ? 'status-pill-paid' : 'status-pill-muted');
    paymentConfigPill.textContent = config.enabled ? langCopy.ui.paymentSetupReady : langCopy.ui.paymentSetupPending;

    depositButton.textContent = paymentRuntime.loading === 'deposit' ? langCopy.ui.paymentLoadingDeposit : langCopy.ui.paymentDepositCta;
    fullButton.textContent = paymentRuntime.loading === 'full' ? langCopy.ui.paymentLoadingFull : langCopy.ui.paymentFullCta;

    var defaultNotice = langCopy.ui.paymentNoticeReady;
    if (!isBookable) {
      defaultNotice = langCopy.ui.paymentNoticeQuote;
    } else if (!config.enabled) {
      defaultNotice = langCopy.ui.paymentNoticePending;
    } else if (missing.length) {
      defaultNotice = langCopy.ui.paymentNoticeMissing;
    }

    if (queryState === 'success') {
      paymentNotice.textContent = langCopy.ui.paymentSuccess;
      paymentNotice.className = 'payment-notice is-success';
    } else if (queryState === 'cancelled') {
      paymentNotice.textContent = langCopy.ui.paymentCancelled;
      paymentNotice.className = 'payment-notice is-warning';
    } else if (paymentRuntime.message) {
      paymentNotice.textContent = paymentRuntime.message;
      paymentNotice.className = 'payment-notice is-warning';
    } else {
      paymentNotice.textContent = defaultNotice;
      paymentNotice.className = 'payment-notice' + ((config.enabled && isBookable && !missing.length) ? ' is-ready' : '');
    }

    var disabled = !isBookable || !config.enabled || Boolean(missing.length) || Boolean(paymentRuntime.loading);
    depositButton.disabled = disabled;
    fullButton.disabled = disabled;
    panel.classList.toggle('is-quote-only', !isBookable);
    panel.classList.toggle('is-ready', isBookable && config.enabled && !missing.length);
  }

  async function startStripeCheckout(paymentKind) {
    var langCopy = copy();
    var config = publicStripeConfig();

    paymentRuntime.message = '';
    if (!isStripeEligibleService(state.serviceId)) {
      paymentRuntime.message = langCopy.ui.paymentNoticeQuote;
      updatePaymentPanel();
      return;
    }

    if (!config.enabled) {
      paymentRuntime.message = langCopy.ui.paymentNoticePending;
      updatePaymentPanel();
      return;
    }

    if (checkoutMissingFields(langCopy).length) {
      paymentRuntime.message = langCopy.ui.paymentNoticeMissing;
      updatePaymentPanel();
      return;
    }

    paymentRuntime.loading = paymentKind;
    updatePaymentPanel();

    try {
      var bookingRecord = await withTimeout(ensureStructuredBooking('payment', 'payment', langCopy), 3200);
      await withTimeout(submitLeadCapture(buildLeadCapturePayload('payment', 'payment', langCopy, bookingRecord && bookingRecord.ok ? bookingRecord : null, 'payment_started')), 2200);
      var response = await fetch(config.checkoutEndpoint, {
        method: 'POST',
        headers: authHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(buildCheckoutPayload(paymentKind, langCopy, bookingRecord && bookingRecord.ok ? bookingRecord : null))
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.url) {
        throw new Error(result.error || langCopy.ui.paymentError);
      }
      window.location.href = result.url;
    } catch (error) {
      paymentRuntime.loading = '';
      paymentRuntime.message = langCopy.ui.paymentError;
      updatePaymentPanel();
    }
  }

  function renderCart() {
    var langCopy = copy();
    var fallbackUi = bookingCopy.en && bookingCopy.en.ui ? bookingCopy.en.ui : {};
    var cartTitle = byId('cartTitle');
    var cartCount = byId('cartCount');
    var cartList = byId('cartList');
    var cartTotal = byId('cartTotal');
    var emailCartCTA = byId('emailCartCTA');
    var whatsappCartCTA = byId('whatsappCartCTA');
    var clearCartCTA = byId('clearCartCTA');

    if (!cartTitle || !cartCount || !cartList || !cartTotal || !emailCartCTA || !whatsappCartCTA || !clearCartCTA) {
      return;
    }

    cartCount.textContent = String(cart.length);

    if (!cart.length) {
      cartTitle.textContent = langCopy.ui.noSaved;
      cartList.innerHTML = '<article class="cart-item cart-item-empty"><strong>' + escapeHtml(langCopy.ui.buildFirst) + '</strong><p>' + escapeHtml(langCopy.ui.buildLead) + '</p></article>';
      cartTotal.textContent = money.format(0);
      emailCartCTA.href = '#';
      whatsappCartCTA.href = '#';
      emailCartCTA.textContent = langCopy.ui.emailCart;
      whatsappCartCTA.textContent = langCopy.ui.whatsappCart;
      clearCartCTA.disabled = true;
      return;
    }

    clearCartCTA.disabled = false;
    cartTitle.textContent = langCopy.ui.cartTitle || (cart.length === 1 ? '1 ' + langCopy.ui.item : cart.length + ' ' + langCopy.ui.item + 's');

    cartList.innerHTML = cart.map(function (item, index) {
      var view = itemView(item);
      var extrasLine = view.extras.length ? '<p><strong>' + escapeHtml(langCopy.ui.addOns) + ':</strong> ' + view.extras.join(', ') + '</p>' : '';
      var notesLine = view.notes ? '<p><strong>' + escapeHtml(langCopy.ui.notes) + ':</strong> ' + compactText(view.notes, 88) + '</p>' : '';
      var timingLabel = langCopy.timing[view.timing] || view.timing;
      return '<article class="cart-item">' +
        '<div class="cart-item-head">' +
          '<div><span class="cart-item-index">' + escapeHtml(langCopy.ui.item) + ' ' + (index + 1) + '</span><h4>' + view.title + '</h4></div>' +
          '<div class="cart-item-actions"><strong>' + money.format(view.total) + '</strong><button type="button" class="cart-remove" data-remove-cart="' + item.id + '">' + escapeHtml(langCopy.ui.remove || 'Remove') + '</button></div>' +
        '</div>' +
        '<p><strong>' + escapeHtml(langCopy.ui.route) + ':</strong> ' + view.route + '</p>' +
        '<p><strong>' + escapeHtml(langCopy.ui.vehicle) + ':</strong> ' + view.vehicle + ' · <strong>' + escapeHtml(langCopy.ui.package) + ':</strong> ' + view.packageLabel + '</p>' +
        '<p><strong>' + escapeHtml(langCopy.ui.guests) + ':</strong> ' + view.guests + ' · <strong>' + escapeHtml(langCopy.ui.timing) + ':</strong> ' + timingLabel + '</p>' +
        extrasLine +
        notesLine +
        '<div class="cart-item-footer">' +
          '<button type="button" class="btn btn-quiet" data-load-cart="' + item.id + '">' + escapeHtml(langCopy.ui.editCart || fallbackUi.editCart || 'Load into builder') + '</button>' +
          '<button type="button" class="btn btn-quiet" data-duplicate-cart="' + item.id + '">' + escapeHtml(langCopy.ui.duplicateCart || fallbackUi.duplicateCart || 'Duplicate') + '</button>' +
        '</div>' +
      '</article>';
    }).join('');

    var total = cart.reduce(function (sum, item) { return sum + itemView(item).total; }, 0);
    cartTotal.textContent = money.format(total);

    var itineraryText = buildItineraryText(langCopy, total);
    emailCartCTA.href = buildItineraryChannelHref('email', langCopy, '');
    emailCartCTA.textContent = langCopy.ui.emailCart;
    whatsappCartCTA.href = buildItineraryChannelHref('whatsapp', langCopy, '');
    whatsappCartCTA.textContent = langCopy.ui.whatsappCart;
    if (byId('copyCartCTA')) {
      byId('copyCartCTA').textContent = langCopy.ui.copyCart;
      byId('copyCartCTA').dataset.copyText = itineraryText;
    }
    renderRequestCaptureNote();
  }

  function syncInputs() {
    byId('guestName').value = intake.leadName;
    byId('guestCountry').value = intake.country;
    byId('guestEmail').value = intake.email;
    byId('guestWhatsapp').value = intake.whatsapp;
    byId('pickupDate').value = intake.date;
    byId('pickupTime').value = intake.time;
    byId('pickupPoint').value = intake.pickupPoint;
    byId('requestReference').value = intake.reference;
    if (byId('guestOccasion')) byId('guestOccasion').value = intake.occasion;
    if (byId('marketingConsent')) byId('marketingConsent').checked = Boolean(intake.marketingConsent);
    if (byId('whatsappConsent')) byId('whatsappConsent').checked = Boolean(intake.whatsappConsent);
    if (byId('privacyConsent')) byId('privacyConsent').checked = Boolean(intake.privacyConsent);
    byId('guestCount').value = String(state.guests);
    byId('timingSelect').value = state.timing;
    byId('notesField').value = state.notes;
    renderTimingOptions();
  }

  function rerender() {
    if (!paymentRuntime.loading && !paymentQueryState()) {
      paymentRuntime.message = '';
    }
    renderServices();
    renderRoutes();
    renderVehicles();
    renderPackages();
    renderExtras();
    syncInputs();
    updateSummary();
    renderRequestReadiness();
    updatePaymentPanel();
    renderCart();
    renderRequestCaptureNote();
  }

  window.ExcellentiaVipShared = {
    storageKeys: {
      cart: CART_STORAGE_KEY,
      intake: INTAKE_STORAGE_KEY,
      ledger: LEDGER_STORAGE_KEY,
      customerSession: customerSessionStoreKey(),
      customerProfile: CUSTOMER_PROFILE_STORAGE_KEY,
      customerOffer: CUSTOMER_OFFER_STORAGE_KEY
    },
    catalog: vipCatalog,
    services: services.slice(),
    vehicles: vehicles.slice(),
    packages: packages.slice(),
    extras: extras.slice(),
    currentLang: currentLang,
    copyForLang: copyForLang,
    loadStoredCart: loadStoredCart,
    loadStoredIntake: loadStoredIntake,
    normalizeCartItem: normalizeCartItem,
    sanitizeIntake: sanitizeIntake,
    requestModeKey: requestModeKey,
    routeIdForService: vipCatalog.routeIdForService,
    serviceIdsForRequestMode: vipCatalog.serviceIdsForRequestMode,
    routeSummary: routeSummary,
    summarizeItem: function (rawItem, lang) {
      var item = normalizeCartItem(rawItem);
      return item ? itemView(item, copyForLang(lang || currentLang())) : null;
    },
    formatMoney: function (value) {
      return money.format(Number(value || 0));
    }
  };

  if (!byId('routeSelect') || !byId('vehicleSelect') || !byId('guestCount') || !byId('timingSelect') || !byId('notesField') || !byId('serviceChips') || !byId('guestName') || !byId('guestCountry') || !byId('guestEmail') || !byId('guestWhatsapp') || !byId('pickupDate') || !byId('pickupTime') || !byId('pickupPoint') || !byId('requestReference')) {
    return;
  }

  document.addEventListener('click', function (event) {
    var serviceButton = event.target.closest('[data-service]');
    if (serviceButton) {
      state.serviceId = serviceButton.getAttribute('data-service');
      state.routeIndex = 0;
      rerender();
      return;
    }

    var packageButton = event.target.closest('[data-package]');
    if (packageButton) {
      state.packageId = packageButton.getAttribute('data-package');
      rerender();
      return;
    }

    var extraButton = event.target.closest('[data-extra]');
    if (extraButton) {
      var id = extraButton.getAttribute('data-extra');
      state.extras[id] = !state.extras[id];
      rerender();
      return;
    }

    var addToCartButton = event.target.closest('#addToCartCTA');
    if (addToCartButton) {
      cart.push(selectionFromState());
      persistCart();
      renderCart();
      scheduleLeadCapture('itinerary', 'website', 'itinerary_saved');
      return;
    }

    var removeCartButton = event.target.closest('[data-remove-cart]');
    if (removeCartButton) {
      var cartId = removeCartButton.getAttribute('data-remove-cart');
      cart = cart.filter(function (item) { return item.id !== cartId; });
      persistCart();
      renderCart();
      return;
    }

    var loadCartButton = event.target.closest('[data-load-cart]');
    if (loadCartButton) {
      var loadCartId = loadCartButton.getAttribute('data-load-cart');
      var loadItem = cart.find(function (entry) { return entry.id === loadCartId; });
      var normalizedLoadItem = normalizeCartItem(loadItem);
      if (normalizedLoadItem) {
        state.serviceId = normalizedLoadItem.serviceId;
        state.routeIndex = normalizedLoadItem.routeIndex;
        state.vehicleId = normalizedLoadItem.vehicleId;
        state.packageId = normalizedLoadItem.packageId;
        state.guests = normalizedLoadItem.guests;
        state.timing = normalizedLoadItem.timing;
        state.notes = normalizedLoadItem.notes;
        state.extras = {};
        normalizedLoadItem.extras.forEach(function (id) {
          state.extras[id] = true;
        });
        rerender();
        if (byId('builder') && typeof byId('builder').scrollIntoView === 'function') {
          byId('builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }

    var duplicateCartButton = event.target.closest('[data-duplicate-cart]');
    if (duplicateCartButton) {
      var duplicateCartId = duplicateCartButton.getAttribute('data-duplicate-cart');
      var duplicateItem = cart.find(function (entry) { return entry.id === duplicateCartId; });
      var normalizedDuplicateItem = normalizeCartItem(duplicateItem);
      if (normalizedDuplicateItem) {
        normalizedDuplicateItem.id = Date.now() + '-' + Math.random().toString(16).slice(2, 8);
        cart.push(normalizedDuplicateItem);
        persistCart();
        renderCart();
      }
    }
  });

  byId('routeSelect').addEventListener('change', function (event) {
    state.routeIndex = Number(event.target.value || 0);
    rerender();
  });

  byId('vehicleSelect').addEventListener('change', function (event) {
    state.vehicleId = event.target.value;
    rerender();
  });

  byId('guestCount').addEventListener('input', function (event) {
    var value = Number(event.target.value || 1);
    state.guests = Math.max(1, Math.min(16, value));
    rerender();
  });

  byId('timingSelect').addEventListener('change', function (event) {
    state.timing = event.target.value;
    rerender();
  });

  byId('notesField').addEventListener('input', function (event) {
    state.notes = event.target.value || '';
    rerender();
  });

  byId('guestName').addEventListener('input', function (event) {
    intake.leadName = sanitizeFreeText(event.target.value, 80);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  byId('guestCountry').addEventListener('input', function (event) {
    intake.country = sanitizeFreeText(event.target.value, 64);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  byId('guestEmail').addEventListener('input', function (event) {
    intake.email = sanitizeEmail(event.target.value);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  byId('guestWhatsapp').addEventListener('input', function (event) {
    intake.whatsapp = sanitizePhone(event.target.value);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  byId('pickupDate').addEventListener('input', function (event) {
    intake.date = sanitizeDate(event.target.value);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  byId('pickupTime').addEventListener('input', function (event) {
    intake.time = sanitizeTime(event.target.value);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  byId('pickupPoint').addEventListener('input', function (event) {
    intake.pickupPoint = sanitizeFreeText(event.target.value, 120);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  byId('requestReference').addEventListener('input', function (event) {
    intake.reference = sanitizeFreeText(event.target.value, 120);
    persistIntake();
    rerender();
    scheduleLeadCapture('single', 'website', 'profile_captured');
  });

  if (byId('guestOccasion')) {
    byId('guestOccasion').addEventListener('input', function (event) {
      intake.occasion = sanitizeFreeText(event.target.value, 80);
      persistIntake();
      rerender();
      scheduleLeadCapture('single', 'website', 'profile_captured');
    });
  }

  if (byId('marketingConsent')) {
    byId('marketingConsent').addEventListener('change', function (event) {
      intake.marketingConsent = Boolean(event.target.checked);
      persistIntake();
      rerender();
      scheduleLeadCapture('single', 'website', 'profile_captured');
    });
  }

  if (byId('whatsappConsent')) {
    byId('whatsappConsent').addEventListener('change', function (event) {
      intake.whatsappConsent = Boolean(event.target.checked);
      persistIntake();
      rerender();
      scheduleLeadCapture('single', 'website', 'profile_captured');
    });
  }

  if (byId('privacyConsent')) {
    byId('privacyConsent').addEventListener('change', function (event) {
      intake.privacyConsent = Boolean(event.target.checked);
      persistIntake();
      rerender();
      scheduleLeadCapture('single', 'website', 'profile_captured');
    });
  }

  document.querySelectorAll('.vip-lang-picker').forEach(function (picker) {
    picker.addEventListener('change', function () {
      setTimeout(rerender, 0);
    });
  });

  if (byId('clearCartCTA')) {
    byId('clearCartCTA').addEventListener('click', function () {
      cart = [];
      persistCart();
      renderCart();
    });
  }

  if (byId('copyRequestCTA')) {
    byId('copyRequestCTA').addEventListener('click', function () {
      var langCopy = copy();
      copyToClipboard(byId('copyRequestCTA').dataset.copyText || '', byId('copyRequestCTA'), langCopy, langCopy.ui.copyRequest);
    });
  }

  if (byId('copyCartCTA')) {
    byId('copyCartCTA').addEventListener('click', function () {
      var langCopy = copy();
      copyToClipboard(byId('copyCartCTA').dataset.copyText || '', byId('copyCartCTA'), langCopy, langCopy.ui.copyCart);
    });
  }

  if (byId('emailCTA')) {
    byId('emailCTA').addEventListener('click', function (event) {
      captureBeforeChannelOpen(event, 'single', 'email');
    });
  }

  if (byId('whatsappCTA')) {
    byId('whatsappCTA').addEventListener('click', function (event) {
      captureBeforeChannelOpen(event, 'single', 'whatsapp');
    });
  }

  if (byId('emailCartCTA')) {
    byId('emailCartCTA').addEventListener('click', function (event) {
      captureBeforeChannelOpen(event, 'itinerary', 'email');
    });
  }

  if (byId('whatsappCartCTA')) {
    byId('whatsappCartCTA').addEventListener('click', function (event) {
      captureBeforeChannelOpen(event, 'itinerary', 'whatsapp');
    });
  }

  if (byId('stripeDepositCTA')) {
    byId('stripeDepositCTA').addEventListener('click', function () {
      startStripeCheckout('deposit');
    });
  }

  if (byId('stripeFullCTA')) {
    byId('stripeFullCTA').addEventListener('click', function () {
      startStripeCheckout('full');
    });
  }

  loadCart();
  loadIntake();
  applyPrefillFromQuery();
  persistIntake();
  rerender();

  if (paymentQueryState() === 'success') {
    window.setTimeout(function () {
      var cached = loadStructuredCaptureCache();
      submitLeadCapture(buildLeadCapturePayload('payment', 'payment', copy(), cached, 'payment_completed')).catch(function () {});
    }, 350);
  } else if (paymentQueryState() === 'cancelled') {
    window.setTimeout(function () {
      var cached = loadStructuredCaptureCache();
      submitLeadCapture(buildLeadCapturePayload('payment', 'payment', copy(), cached, 'abandoned')).catch(function () {});
    }, 350);
  }
})();
