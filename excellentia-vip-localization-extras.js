(function () {
  var supportedLangs = ['en', 'es', 'it', 'fr', 'de', 'pt', 'ru', 'zh'];

  function getQueryLang() {
    try {
      var value = new URLSearchParams(window.location.search).get('lang');
      if (value && supportedLangs.indexOf(value) !== -1) return value;
    } catch {}
    return '';
  }

  function syncLangUrl(lang) {
    try {
      var url = new URL(window.location.href);
      if (lang === 'en') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', lang);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }

  function syncInternalVipLinks(lang) {
    document.querySelectorAll('a[href]').forEach(function (anchor) {
      var rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.indexOf('mailto:') === 0 || rawHref.indexOf('tel:') === 0 || rawHref.indexOf('#') === 0) return;
      try {
        var url = new URL(rawHref, window.location.href);
        var path = url.pathname.split('/').pop() || '';
        if (!/^excellentia-vip(?:-[a-z]+)?\.html$/i.test(path)) return;
        if (lang === 'en') {
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('lang', lang);
        }
        anchor.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
      } catch {}
    });
  }

  var currentLang = function () {
    return getQueryLang() || localStorage.getItem('vip_lang') || 'en';
  };

  var pickerLabels = {
    en: '🇺🇸 English',
    es: '🇪🇸 Español',
    it: '🇮🇹 Italiano',
    fr: '🇫🇷 Français',
    de: '🇩🇪 Deutsch',
    pt: '🇧🇷 Português',
    ru: '🇷🇺 Русский',
    zh: '🇨🇳 中文'
  };

  var notesExamples = {
    es: 'Notas especiales: sorpresa de cumpleaños, bebidas frías de bienvenida para la familia, Moet a bordo, setup con Brugal 1888, torta de celebración, coordinación con el hotel, host bilingüe.',
    it: 'Note speciali: sorpresa di compleanno, bevande fresche di benvenuto per la famiglia, Moet a bordo, allestimento con Brugal 1888, torta celebrativa, passaggio con hotel, host bilingue.',
    fr: 'Notes spéciales : surprise d’anniversaire, rafraîchissements d’accueil pour la famille, Moet à bord, mise en place Brugal 1888, gâteau de célébration, relais avec l’hôtel, hôte bilingue.',
    de: 'Besondere Hinweise: Geburtstagsüberraschung, gekühlte Erfrischungen für die Familie, Moet an Bord, Brugal 1888 zur Begrüßung, Feier-Torte, Abstimmung mit dem Hotel, zweisprachige Begleitung.',
    pt: 'Notas especiais: surpresa de aniversário, bebidas geladas de boas-vindas para a família, Moet a bordo, preparação com Brugal 1888, bolo de celebração, alinhamento com o hotel, anfitrião bilíngue.',
    ru: 'Особые пожелания: сюрприз ко дню рождения, охлажденные приветственные напитки для семьи, Moet на борту, оформление с Brugal 1888, праздничный торт, координация с отелем, двуязычный хост.',
    zh: '特别说明：生日惊喜、为家庭准备的冰镇欢迎饮品、车上 Moet、Brugal 1888 布置、庆祝蛋糕、与酒店协调、双语接待协助。'
  };

  var exactTextMap = {
    es: {
      'WhatsApp concierge': 'Concierge por WhatsApp',
      'Direct reservations line': 'Línea directa de reservas',
      'Punta Cana reservations line': 'Línea de reservas Punta Cana',
      'Call now': 'Llamar ahora',
      'Email desk': 'Email reservas',
      'Email reservations': 'Email',
      'Guests': 'Huéspedes',
      'Special notes': 'Notas especiales',
      'Copy itinerary': 'Copiar itinerario',
      'After payment': 'Después del pago',
      'Client receives email + WhatsApp confirmation': 'El cliente recibe confirmación por email + WhatsApp',
      'Operations dispatch': 'Despacho operativo',
      'Coordinator receives email + WhatsApp recap': 'El coordinador recibe email + resumen por WhatsApp',
      'Private transport framed with calmer, more credible premium direction': 'Transporte privado con una dirección premium más sobria y creíble.',
      'Champagne, flowers, host support and arrival styling in one place': 'Champagne, flores, apoyo host y puesta en escena de llegada en un solo lugar.',
      'One route from first visit to a readable VIP request': 'Un solo recorrido desde la primera visita hasta una solicitud VIP clara.',
      'Curated arrivals': 'Llegadas curadas',
      'Celebration bundles, concierge layers and premium upsell logic in one place.': 'Bundles de celebración, capas concierge y lógica premium de upsell en un solo lugar.',
      'Vehicle confidence': 'Confianza en la flota',
      'SUV, van and Black Signature tiers framed for premium guests.': 'Niveles SUV, van y Black Signature pensados para huéspedes premium.',
      'Luxury transport & concierge': 'Transporte de lujo y concierge',
      'Why us': 'Por qué nosotros',
      'Services': 'Servicios',
      'Packages': 'Paquetes',
      'Fleet': 'Flota',
      'Fleet details': 'Detalles de flota',
      'Booking': 'Reserva',
      'Start request': 'Inicia tu solicitud',
      'Start your request': 'Inicia tu solicitud',
      'See packages': 'Ver paquetes',
      'Review fleet': 'Revisar flota',
      'Request this experience': 'Solicitar esta experiencia',
      'View fleet tiers': 'Ver niveles de flota',
      'Open packages': 'Abrir paquetes',
      'Open fleet': 'Abrir flota',
      'Open booking flow': 'Abrir flujo de reserva',
      'Open booking page': 'Abrir página de reserva',
      'Open fleet page': 'Abrir página de flota',
      'Open operations page': 'Abrir página operativa',
      'View packages': 'Ver paquetes',
      'View fleet': 'Ver flota',
      'Back to main concept': 'Volver al inicio',
      'Concept': 'Concepto',
      'Open builder': 'Abrir configurador',
      'See add-ons': 'Ver extras',
      'Package logic': 'Lógica de paquetes',
      'Higher value per booking': 'Mayor valor por reserva',
      'Arrival': 'Llegada',
      'Family': 'Familia',
      'Executive': 'Ejecutivo',
      'Guest type': 'Tipo de huésped',
      'Commercial role': 'Rol comercial',
      'Handoff': 'Paso al equipo',
      'Honeymoon, family, executive': 'Honeymoon, familia, ejecutivo',
      'Clearer upsells and higher ticket value': 'Upsells más claros y mayor ticket medio',
      'WhatsApp, email and structured confirmation flow': 'WhatsApp, email y flujo de confirmación estructurado',
      'Higher perceived value': 'Mayor valor percibido',
      'Packages turn transport into a premium product': 'Los paquetes convierten el transporte en un producto premium',
      'Clearer upsells': 'Upsells más claros',
      'Add-ons become visible choices, not hidden requests': 'Los extras se vuelven elecciones visibles, no solicitudes ocultas',
      'Better booking flow': 'Mejor flujo de reserva',
      'One path from package selection to confirmed inquiry': 'Un solo camino desde la selección del paquete hasta la solicitud confirmada',
      'Step 1': 'Paso 1',
      'Step 2': 'Paso 2',
      'Step 3': 'Paso 3',
      'Guest chooses package': 'El huésped elige el paquete',
      'The package should feel clear and premium before the contact handoff starts.': 'El paquete debe sentirse claro y premium antes de que empiece la coordinación comercial.',
      'Extras increase ticket value': 'Los extras aumentan el ticket',
      'Visible add-ons lift perceived quality and average booking value.': 'Los extras visibles elevan la calidad percibida y el valor medio de la reserva.',
      'Booking stays controlled': 'El booking sigue controlado',
      'Confirmation and payment logic must be visible in the final build, not hidden behind broken flows.': 'La lógica de confirmación y pago debe ser visible en la versión final, no quedar escondida detrás de flujos rotos.',
      'WhatsApp routing': 'Routing por WhatsApp',
      'Immediate handoff to the concierge number': 'Envío inmediato al número concierge',
      'The final site should package the request clearly and push it to the correct WhatsApp contact without losing the booking context.': 'El sitio final debe empaquetar la solicitud con claridad y enviarla al contacto correcto de WhatsApp sin perder el contexto de la reserva.',
      'Email confirmation': 'Confirmación por email',
      'Structured booking recap sent to the business inbox': 'Resumen estructurado de booking enviado al inbox del negocio',
      'Every inquiry should generate a readable email summary with service, route, vehicle, add-ons and guest notes.': 'Cada solicitud debe generar un email legible con servicio, ruta, vehículo, extras y notas del huésped.',
      'Google-friendly trail': 'Vista de seguimiento compartida',
      'Simple admin visibility for every lead': 'Visibilidad admin simple para cada lead',
      'Even without a heavy backend, the system can keep an ordered trail for Gmail, Google Sheets or future operational handling.': 'Incluso sin un backend pesado, el sistema puede mantener un rastro ordenado para Gmail, Google Sheets o gestión operativa futura.',
      'Open booking builder': 'Abrir configurador de reserva',
      'Main concept': 'Visión general',
      'Proposal system: concept, packages and premium booking logic.': 'Estructura del sitio: visión general, paquetes y lógica premium de reserva.',
      'Packages page': 'Página de paquetes',
      'Fleet and routes': 'Flota y rutas',
      'Operations flow': 'Flujo operativo',
      'Booking page': 'Página de reserva',
      'Home': 'Inicio',
      'Package': 'Paquete',
      'Extra': 'Extra',
      'Signature packages': 'Paquetes signature',
      'Menu add-on': 'Menú de extras',
      'Guest handoff': 'Paso al equipo',
      'Booking builder': 'Configurador de reserva',
      'Builder': 'Configurador',
      'Extras': 'Extras',
      'Operations': 'Operaciones',
      'Build request': 'Construir solicitud',
      'See operations': 'Ver operaciones',
      'Luxury': 'Lujo',
      'Private transport framed with cleaner premium direction': 'Transporte privado con una dirección premium más limpia.',
      'Selected extras': 'Extras seleccionados',
      'Champagne, flowers, fast-track, host assistance and more': 'Champagne, flores, fast-track, asistencia host y más.',
      'Clear requests': 'Solicitudes claras',
      'One route from first visit to inquiry': 'Un solo recorrido desde la primera visita hasta la solicitud',
      'One route from first visit to a structured VIP inquiry': 'Un solo recorrido desde la primera visita hasta una solicitud VIP estructurada.',
      'Signature arrival': 'Llegada signature',
      'Excellentia VIP experience': 'Experiencia Excellentia VIP',
      'Package': 'Paquete',
      'Add-ons': 'Extras',
      'Promise': 'Promesa',
      'Private, discreet, premium': 'Privado, discreto, premium',
      'Private transport': 'Transporte privado',
      'Airport transfers, chauffeur service and curated arrivals': 'Traslados de aeropuerto, servicio con chofer y llegadas curadas',
      'Premium extras': 'Extras premium',
      'Champagne, flowers, child seats, host assistance and tailored requests': 'Champagne, flores, sillas infantiles, asistencia de anfitrión y solicitudes a medida',
      'Clear handoff': 'Paso claro al equipo',
      'WhatsApp, email and a readable request summary before confirmation': 'WhatsApp, email y un resumen claro antes de la confirmación',
      'Trust blockers': 'Bloqueos de confianza',
      'What weakens trust on premium sites': 'Qué debilita la confianza en un sitio premium',
      'Guests cannot quickly tell which service fits their arrival.': 'Los huéspedes no identifican rápido qué servicio encaja con su llegada.',
      'Premium extras feel hidden instead of deliberate.': 'Los extras premium se sienten escondidos en lugar de intencionales.',
      'Vehicle tiers look decorative instead of real.': 'Las categorías de vehículo parecen decorativas en lugar de reales.',
      'The request flow asks for trust before it gives clarity.': 'El flujo de solicitud pide confianza antes de dar claridad.',
      'Our direction': 'Nuestra dirección',
      'What changes': 'Qué cambia',
      'Each service has a clear role and entry point.': 'Cada servicio tiene un papel y un punto de entrada claros.',
      'Fleet categories read like real service tiers.': 'Las categorías de flota se leen como niveles de servicio reales.',
      'The site feels premium without forcing extra scrolling.': 'El sitio se siente premium sin obligar a más scroll.',
      'Curated packages': 'Paquetes curados',
      'Packages, premium extras and upsell logic in one place.': 'Paquetes, extras premium y lógica de upsell en un solo lugar.',
      'Fleet tiers': 'Niveles de flota',
      'Fleet categories, route fit and service confidence.': 'Categorías de flota, encaje de ruta y confianza en el servicio.',
      'Request flow': 'Flujo de solicitud',
      'The guest can configure service, route, vehicle and add-ons in one dedicated space.': 'El huésped puede configurar servicio, ruta, vehículo y extras en un espacio dedicado.',
      'The business can see the post-request logic clearly without extra homepage text.': 'El negocio puede ver con claridad la lógica posterior a la solicitud sin más texto en la página principal.',
      'Vehicle tiers and route fit': 'Niveles de vehículo y encaje de ruta',
      'The fleet gets its own page instead of becoming another long block to scroll through.': 'La flota tiene su propia página en lugar de convertirse en otro bloque largo para recorrer.',
      'Open booking': 'Abrir reserva',
      'Open operations': 'Abrir operaciones',
      'Guest friction': 'Fricción del huésped',
      'What usually weakens trust on premium transport sites': 'Qué suele debilitar la confianza en los sitios de transporte premium',
      'Guests cannot quickly tell which service fits their arrival or schedule.': 'Los huéspedes no entienden rápido qué servicio encaja con su llegada o su agenda.',
      'Premium extras feel hidden instead of intentional.': 'Los extras premium se sienten escondidos en vez de intencionales.',
      'Vehicle tiers look decorative instead of concrete.': 'Los niveles de vehículo parecen decorativos en vez de concretos.',
      'The request flow asks for trust before it gives enough clarity.': 'El flujo de solicitud pide confianza antes de dar suficiente claridad.',
      'Excellentia direction': 'Dirección Excellentia',
      'What this version does better': 'Qué hace mejor esta versión',
      'Each service has a clear role and cleaner entry point.': 'Cada servicio tiene un papel claro y un punto de entrada más limpio.',
      'Add-ons are visible and selectable inside the same request flow.': 'Los extras son visibles y seleccionables dentro del mismo flujo.',
      'Fleet categories are framed as real service tiers.': 'Las categorías de flota se presentan como niveles reales de servicio.',
      'The site feels premium without forcing endless scrolling.': 'El sitio se siente premium sin obligar a un scroll infinito.',
      'Premium bundles and signature upgrades': 'Bundles premium y upgrades signature',
      'A dedicated destination for curated packages, premium extras and upsell logic.': 'Un destino dedicado para paquetes curados, extras premium y lógica de upsell.',
      'Fleet page': 'Página de flota',
      'Vehicle tiers that feel tangible and premium': 'Niveles de vehículo que se sienten tangibles y premium',
      'A dedicated destination for fleet categories, route fit and confidence in the service level.': 'Un destino dedicado para categorías de flota, encaje de ruta y confianza en el nivel de servicio.',
      'Booking flow': 'Flujo de reserva',
      'Build the request with less friction': 'Construye la solicitud con menos fricción',
      'A dedicated destination for the interactive builder, request summary and handoff to WhatsApp or email.': 'Un destino dedicado para el configurador interactivo, el resumen de solicitud y el paso a WhatsApp o email.',
      'Interactive builder and request summary': 'Configurador interactivo y resumen de la solicitud',
      'The guest can configure service, route, vehicle and add-ons in a dedicated space instead of fighting one bloated homepage.': 'El huésped puede configurar servicio, ruta, vehículo y extras en un espacio dedicado en lugar de pelear con una homepage inflada.',
      'Operations page': 'Página operativa',
      'Confirmation, email and WhatsApp routing': 'Confirmación, email y routing por WhatsApp',
      'The business can see the post-request logic clearly without stuffing technical explanation into the homepage.': 'El negocio puede ver con claridad la lógica posterior a la solicitud sin meter explicación técnica en la homepage.',
      'Vehicle tiers and route fit without clutter': 'Niveles de vehículo y encaje de ruta sin ruido',
      'The fleet gets the space it needs on its own page instead of becoming another long block the user has to scroll through.': 'La flota tiene el espacio que necesita en su propia página en vez de convertirse en otro bloque largo que el usuario debe recorrer.',
      'Private transfers, chauffeur service, curated tours and premium concierge requests.': 'Transfers privados, servicio de chauffeur, tours curados y solicitudes premium de concierge.',
      'A cleaner homepage, dedicated booking flow and clearer service tiers make the offer feel premium before a guest ever gets in touch.': 'Una homepage más limpia, un booking dedicado y niveles de servicio más claros hacen que la oferta se sienta premium antes del primer contacto.',
      'A structured request flow helps the guest choose faster and helps the team confirm with fewer back-and-forth messages.': 'Un flujo de solicitud estructurado ayuda al huésped a decidir más rápido y al equipo a confirmar con menos idas y vueltas.',
      'Vehicle choice, route type and guest intent should stay visible from first click to booking request.': 'La elección del vehículo, el tipo de ruta y la intención del huésped deben seguir visibles desde el primer clic hasta la solicitud.',
      'Direction only for now: visual system, upsell logic and booking architecture ready to absorb the client’s real fleet, contact data and payment flow later.': 'Dirección por ahora: sistema visual, lógica de upsell y arquitectura de booking listas para absorber luego la flota real, contactos y pagos del cliente.',
      'Every request should reach WhatsApp, email and the team trail with the same booking detail intact.': 'Cada solicitud debe llegar a WhatsApp, email y a la vista compartida del equipo con el mismo detalle intacto.',
      'Clear request before handoff': 'Solicitud clara antes del envío al equipo',
      'Service': 'Servicio',
      'Output': 'Salida',
      'Transfer, chauffeur, tour, concierge': 'Traslado, chofer, tour y concierge',
      'Moet, chilled refreshments, celebration styling, Brugal 1888': 'Moet, bebidas frías de bienvenida, styling de celebración, Brugal 1888',
      'Recap now, confirmations after payment': 'Recap ahora, confirmaciones después del pago',
      'Day service': 'Servicio de día',
      'Night arrival': 'Llegada nocturna',
      'Weekend / holiday': 'Fin de semana / festivo',
      'Estimated itinerary total': 'Total estimado del itinerario',
      'Back to concept': 'Volver a la propuesta',
      'Main concept': 'Propuesta principal',
      'Champagne · Flowers · Host': 'Champagne · Flores · Anfitrión',
      'Interactive builder, request summary and handoff to WhatsApp or email.': 'Configurador interactivo, resumen de solicitud y paso hacia WhatsApp o email.',
      'A cleaner homepage, dedicated booking flow and clear service tiers make the offer feel premium before a guest ever gets in touch.': 'Una homepage más limpia, un flujo de reserva dedicado y niveles de servicio claros hacen que la oferta se sienta premium antes del primer contacto.',
      'Interactive booking, premium extras and a cleaner handoff to WhatsApp or email.': 'Reserva interactiva, extras premium y una salida más clara hacia WhatsApp o email.'
    },
    it: {
      'WhatsApp concierge': 'Concierge su WhatsApp',
      'Direct reservations line': 'Linea diretta prenotazioni',
      'Punta Cana reservations line': 'Linea prenotazioni Punta Cana',
      'Call now': 'Chiama ora',
      'Email desk': 'Email prenotazioni',
      'Email reservations': 'Email',
      'Guests': 'Ospiti',
      'Special notes': 'Note speciali',
      'Copy itinerary': 'Copia itinerario',
      'After payment': 'Dopo il pagamento',
      'Client receives email + WhatsApp confirmation': 'Il cliente riceve conferma via email + WhatsApp',
      'Operations dispatch': 'Dispatch operativo',
      'Coordinator receives email + WhatsApp recap': 'Il coordinatore riceve email + riepilogo WhatsApp',
      'Private transport framed with calmer, more credible premium direction': 'Trasporto privato con una direzione premium più sobria e credibile.',
      'Champagne, flowers, host support and arrival styling in one place': 'Champagne, fiori, supporto host e allestimento arrivo in un unico punto.',
      'One route from first visit to a readable VIP request': 'Un solo percorso dalla prima visita a una richiesta VIP leggibile.',
      'Curated arrivals': 'Arrivi curati',
      'Celebration bundles, concierge layers and premium upsell logic in one place.': 'Bundle celebrativi, livelli concierge e logica premium di upsell in un unico punto.',
      'Vehicle confidence': 'Fiducia sulla flotta',
      'SUV, van and Black Signature tiers framed for premium guests.': 'Livelli SUV, van e Black Signature pensati per ospiti premium.',
      'Luxury transport & concierge': 'Trasporto di lusso e concierge',
      'Why us': 'Perché noi',
      'Services': 'Servizi',
      'Packages': 'Pacchetti',
      'Fleet': 'Flotta',
      'Overview': 'Panoramica',
      'Fleet & routes': 'Flotta e tratte',
      'Fleet tiers': 'Livelli di flotta',
      'Fleet details': 'Dettagli flotta',
      'Booking': 'Prenotazione',
      'Start your request': 'Inizia la richiesta',
      'See packages': 'Vedi pacchetti',
      'Review fleet': 'Rivedi flotta',
      'Request this experience': 'Richiedi questa esperienza',
      'View fleet tiers': 'Vedi livelli di flotta',
      'Open packages': 'Apri pacchetti',
      'Open fleet': 'Apri flotta',
      'Open booking flow': 'Apri flusso di prenotazione',
      'Open booking page': 'Apri pagina prenotazione',
      'Open fleet page': 'Apri pagina flotta',
      'Open operations page': 'Apri pagina operativa',
      'View packages': 'Vedi pacchetti',
      'View fleet': 'Vedi flotta',
      'Back to main concept': 'Torna alla home',
      'Concept': 'Concetto',
      'Open builder': 'Apri configuratore',
      'See add-ons': 'Vedi extra',
      'Package logic': 'Logica dei pacchetti',
      'Higher value per booking': 'Valore più alto per prenotazione',
      'Arrival': 'Arrivo',
      'Family': 'Famiglia',
      'Executive': 'Executive',
      'Guest type': 'Tipo ospite',
      'Commercial role': 'Ruolo commerciale',
      'Handoff': 'Passaggio al team',
      'Honeymoon, family, executive': 'Honeymoon, famiglia, executive',
      'Clearer upsells and higher ticket value': 'Upsell più chiari e ticket medio più alto',
      'WhatsApp, email and structured confirmation flow': 'WhatsApp, email e flusso conferma strutturato',
      'Higher perceived value': 'Valore percepito più alto',
      'Packages turn transport into a premium product': 'I pacchetti trasformano il trasporto in un prodotto premium',
      'Clearer upsells': 'Upsell più chiari',
      'Add-ons become visible choices, not hidden requests': 'Gli extra diventano scelte visibili, non richieste nascoste',
      'Better booking flow': 'Flusso di prenotazione migliore',
      'One path from package selection to confirmed inquiry': 'Un solo percorso dalla scelta del pacchetto alla richiesta confermata',
      'Step 1': 'Step 1',
      'Step 2': 'Step 2',
      'Step 3': 'Step 3',
      'Guest chooses package': 'L’ospite sceglie il pacchetto',
      'The package should feel clear and premium before the contact handoff starts.': 'Il pacchetto deve risultare chiaro e premium prima che inizi il passaggio commerciale.',
      'Extras increase ticket value': 'Gli extra aumentano il ticket',
      'Visible add-ons lift perceived quality and average booking value.': 'Gli extra visibili alzano la qualità percepita e il valore medio della prenotazione.',
      'Booking stays controlled': 'La prenotazione resta sotto controllo',
      'Confirmation and payment logic must be visible in the final build, not hidden behind broken flows.': 'Conferma e logica pagamento devono essere visibili nel build finale, non nascoste dietro flussi rotti.',
      'WhatsApp routing': 'Instradamento WhatsApp',
      'Immediate handoff to the concierge number': 'Invio immediato al numero concierge',
      'The final site should package the request clearly and push it to the correct WhatsApp contact without losing the booking context.': 'Il sito finale deve comporre la richiesta in modo chiaro e inviarla al contatto WhatsApp corretto senza perdere il contesto della prenotazione.',
      'Email confirmation': 'Conferma via email',
      'Structured booking recap sent to the business inbox': 'Riepilogo prenotazione strutturato inviato alla casella business',
      'Every inquiry should generate a readable email summary with service, route, vehicle, add-ons and guest notes.': 'Ogni richiesta deve generare un riepilogo email leggibile con servizio, tratta, veicolo, extra e note dell’ospite.',
      'Google-friendly trail': 'Vista di tracciamento condivisa',
      'Simple admin visibility for every lead': 'Visibilità admin semplice per ogni lead',
      'Even without a heavy backend, the system can keep an ordered trail for Gmail, Google Sheets or future operational handling.': 'Anche senza un backend pesante, il sistema può mantenere un trail ordinato per Gmail, Google Sheets o gestione operativa futura.',
      'Open booking builder': 'Apri configuratore prenotazione',
      'Main concept': 'Panoramica',
      'Proposal system: concept, packages and premium booking logic.': 'Struttura del sito: panoramica, pacchetti e logica premium di prenotazione.',
      'Packages page': 'Pagina pacchetti',
      'Fleet and routes': 'Flotta e tratte',
      'Operations flow': 'Flusso operativo',
      'Booking page': 'Pagina prenotazione',
      'Home': 'Home',
      'Package': 'Pacchetto',
      'Extra': 'Extra',
      'Signature packages': 'Pacchetti signature',
      'Menu add-on': 'Menu extra',
      'Guest handoff': 'Passaggio ospite',
      'Booking builder': 'Configuratore prenotazione',
      'Builder': 'Configuratore',
      'Extras': 'Extra',
      'Operations': 'Operatività',
      'Build request': 'Costruisci richiesta',
      'See operations': 'Vedi operatività',
      'Luxury': 'Lusso',
      'Private transport framed with cleaner premium direction': 'Trasporto privato con una direzione premium più pulita.',
      'Selected extras': 'Extra selezionati',
      'Champagne, flowers, fast-track, host assistance and more': 'Champagne, fiori, fast-track, assistenza hostess e altro.',
      'Clear requests': 'Richieste chiare',
      'One route from first visit to a structured VIP inquiry': 'Un solo percorso dalla prima visita a una richiesta VIP strutturata.',
      'Signature arrival': 'Arrivo signature',
      'Excellentia VIP experience': 'Esperienza Excellentia VIP',
      'Package': 'Pacchetto',
      'Add-ons': 'Extra',
      'Promise': 'Promessa',
      'Private, discreet, premium': 'Privato, discreto, premium',
      'Private transport': 'Trasporto privato',
      'Airport transfers, chauffeur service and curated arrivals': 'Transfer aeroportuali, servizio con autista e arrivi curati',
      'Premium extras': 'Extra premium',
      'Champagne, flowers, child seats, host assistance and tailored requests': 'Champagne, fiori, seggiolini, assistenza hostess e richieste su misura',
      'Clear handoff': 'Passaggio chiaro',
      'WhatsApp, email and a readable request summary before confirmation': 'WhatsApp, email e un riepilogo leggibile prima della conferma',
      'Guest friction': 'Attrito dell’ospite',
      'What usually weakens trust on premium transport sites': 'Cosa indebolisce di solito la fiducia nei siti di trasporto premium',
      'Guests cannot quickly tell which service fits their arrival or schedule.': 'Gli ospiti non capiscono subito quale servizio si adatta meglio al loro arrivo o ai loro orari.',
      'Premium extras feel hidden instead of intentional.': 'Gli extra premium sembrano nascosti invece che intenzionali.',
      'Vehicle tiers look decorative instead of concrete.': 'I livelli veicolo sembrano decorativi invece che concreti.',
      'The request flow asks for trust before it gives enough clarity.': 'Il flusso di richiesta chiede fiducia prima di dare abbastanza chiarezza.',
      'Excellentia direction': 'Direzione Excellentia',
      'What this version does better': 'Cosa fa meglio questa versione',
      'Each service has a clear role and cleaner entry point.': 'Ogni servizio ha un ruolo chiaro e un punto di ingresso più pulito.',
      'Add-ons are visible and selectable inside the same request flow.': 'Gli extra sono visibili e selezionabili dentro lo stesso flusso.',
      'Fleet categories are framed as real service tiers.': 'Le categorie di flotta sono presentate come veri livelli di servizio.',
      'The site feels premium without forcing endless scrolling.': 'Il sito si percepisce premium senza costringere a uno scroll infinito.',
      'Premium bundles and signature upgrades': 'Bundle premium e upgrade signature',
      'A dedicated destination for curated packages, premium extras and upsell logic.': 'Una destinazione dedicata per pacchetti curati, extra premium e logica di upsell.',
      'Fleet page': 'Pagina flotta',
      'Vehicle tiers that feel tangible and premium': 'Livelli veicolo che risultano tangibili e premium',
      'A dedicated destination for fleet categories, route fit and confidence in the service level.': 'Una destinazione dedicata alle categorie di flotta, all’aderenza della tratta e alla fiducia nel livello di servizio.',
      'Booking flow': 'Flusso di prenotazione',
      'Build the request with less friction': 'Costruisci la richiesta con meno attrito',
      'A dedicated destination for the interactive builder, request summary and handoff to WhatsApp or email.': 'Una destinazione dedicata al configuratore interattivo, al riepilogo richiesta e al passaggio verso WhatsApp o email.',
      'Interactive builder and request summary': 'Configuratore interattivo e riepilogo della richiesta',
      'The guest can configure service, route, vehicle and add-ons in a dedicated space instead of fighting one bloated homepage.': 'L’ospite può configurare servizio, tratta, veicolo ed extra in uno spazio dedicato invece di perdersi in una homepage troppo carica.',
      'Operations page': 'Pagina operativa',
      'Confirmation, email and WhatsApp routing': 'Conferma, email e instradamento WhatsApp',
      'The business can see the post-request logic clearly without stuffing technical explanation into the homepage.': 'Il team può leggere chiaramente la logica post-richiesta senza infilare spiegazioni tecniche nella pagina principale.',
      'Vehicle tiers and route fit without clutter': 'Livelli veicolo e aderenza della tratta senza confusione',
      'The fleet gets the space it needs on its own page instead of becoming another long block the user has to scroll through.': 'La flotta ha lo spazio che le serve nella sua pagina dedicata invece di diventare un altro blocco lungo da scorrere.',
      'Private transfers, chauffeur service, curated tours and premium concierge requests.': 'Transfer privati, servizio con autista, tour curati e richieste concierge premium.',
      'A cleaner homepage, dedicated booking flow and clearer service tiers make the offer feel premium before a guest ever gets in touch.': 'Una homepage più pulita, un flusso di prenotazione dedicato e livelli di servizio più chiari fanno percepire l’offerta come premium prima ancora del contatto.',
      'A structured request flow helps the guest choose faster and helps the team confirm with fewer back-and-forth messages.': 'Un flusso richiesta strutturato aiuta l’ospite a scegliere più in fretta e il team a confermare con meno scambi inutili.',
      'Vehicle choice, route type and guest intent should stay visible from first click to booking request.': 'Scelta del veicolo, tipo di tratta e intento dell’ospite devono restare visibili dal primo clic fino alla richiesta di prenotazione.',
      'Direction only for now: visual system, upsell logic and booking architecture ready to absorb the client’s real fleet, contact data and payment flow later.': 'Per ora è una direzione: sistema visivo, logica di upsell e architettura di prenotazione pronti ad accogliere poi la flotta reale, i contatti e il flusso pagamenti del cliente.',
      'Every request should reach WhatsApp, email and the team trail with the same booking detail intact.': 'Ogni richiesta deve arrivare su WhatsApp, email e alla vista condivisa del team con lo stesso dettaglio di prenotazione intatto.',
      'Clear request before handoff': 'Richiesta chiara prima dell\'invio al team',
      'Service': 'Servizio',
      'Output': 'Output',
      'Transfer, chauffeur, tour, concierge': 'Transfer, autista, tour e concierge',
      'Moet, chilled refreshments, celebration styling, Brugal 1888': 'Moet, bevande fresche di benvenuto, styling celebrativo, Brugal 1888',
      'Recap now, confirmations after payment': 'Recap subito, conferme dopo il pagamento',
      'Day service': 'Servizio di giorno',
      'Night arrival': 'Arrivo notturno',
      'Weekend / holiday': 'Weekend / festivo',
      'Estimated itinerary total': 'Totale itinerario stimato',
      'Back to concept': 'Torna alla proposta',
      'Main concept': 'Proposta principale',
      'Interactive booking, premium extras and a cleaner handoff to WhatsApp or email.': 'Prenotazione interattiva, extra premium e un invio più pulito verso WhatsApp o email.',
      'One route from first visit to inquiry': 'Un solo percorso dalla prima visita alla richiesta',
      'Trust blockers': 'Blocchi di fiducia',
      'What weakens trust on premium sites': 'Cosa indebolisce la fiducia nei siti premium',
      'Guests cannot quickly tell which service fits their arrival.': 'Gli ospiti non capiscono rapidamente quale servizio si adatta al loro arrivo.',
      'Premium extras feel hidden instead of deliberate.': 'Gli extra premium sembrano nascosti invece che intenzionali.',
      'Vehicle tiers look decorative instead of real.': 'I livelli veicolo sembrano decorativi invece che reali.',
      'The request flow asks for trust before it gives clarity.': 'Il flusso di richiesta chiede fiducia prima di offrire chiarezza.',
      'Our direction': 'La nostra direzione',
      'What changes': 'Cosa cambia',
      'Each service has a clear role and entry point.': 'Ogni servizio ha un ruolo chiaro e un punto di ingresso definito.',
      'Fleet categories read like real service tiers.': 'Le categorie di flotta si leggono come veri livelli di servizio.',
      'The site feels premium without forcing extra scrolling.': 'Il sito si percepisce premium senza costringere a scroll extra.',
      'Curated packages': 'Pacchetti curati',
      'Packages, premium extras and upsell logic in one place.': 'Pacchetti, extra premium e logica upsell in un unico punto.',
      'Fleet tiers': 'Livelli di flotta',
      'Fleet categories, route fit and service confidence.': 'Categorie di flotta, aderenza alla tratta e fiducia nel livello di servizio.',
      'Request flow': 'Flusso richiesta',
      'The guest can configure service, route, vehicle and add-ons in one dedicated space.': 'L’ospite può configurare servizio, tratta, veicolo ed extra in uno spazio dedicato.',
      'The business can see the post-request logic clearly without extra homepage text.': 'Il business vede chiaramente la logica post-richiesta senza altro testo dispersivo in homepage.',
      'Vehicle tiers and route fit': 'Livelli veicolo e aderenza alla tratta',
      'The fleet gets its own page instead of becoming another long block to scroll through.': 'La flotta ha una pagina dedicata invece di diventare un altro blocco lungo da scorrere.',
      'Open booking': 'Apri prenotazione',
      'Open operations': 'Apri operatività',
      'Use case': 'Caso d’uso',
      'Experience': 'Esperienza',
      'Celebrations': 'Celebrazioni',
      'Start request': 'Avvia richiesta',
      'Experience Excellentia VIP': 'Esperienza Excellentia VIP',
      'Punta Cana Airport': 'Aeroporto di Punta Cana',
      'Cap Cana Resort': 'Resort di Cap Cana',
      'Champagne · Flowers · Host': 'Champagne · Fiori · Hostess',
      'Interactive builder, request summary and handoff to WhatsApp or email.': 'Configuratore interattivo, riepilogo richiesta e passaggio verso WhatsApp o email.',
      'A cleaner homepage, dedicated booking flow and clear service tiers make the offer feel premium before a guest ever gets in touch.': 'Una homepage più pulita, un flusso di prenotazione dedicato e livelli di servizio chiari fanno percepire l’offerta come premium prima del primo contatto.'
    },
    fr: {
      'WhatsApp concierge': 'Concierge sur WhatsApp',
      'Direct reservations line': 'Ligne directe réservations',
      'Punta Cana reservations line': 'Ligne réservations Punta Cana',
      'Call now': 'Appeler',
      'Email desk': 'Email réservations',
      'Email reservations': 'Email',
      'Guests': 'Voyageurs',
      'Special notes': 'Notes spéciales',
      'Copy itinerary': 'Copier l’itinéraire',
      'After payment': 'Après paiement',
      'Client receives email + WhatsApp confirmation': 'Le client reçoit une confirmation par email + WhatsApp',
      'Operations dispatch': 'Dispatch opérationnel',
      'Coordinator receives email + WhatsApp recap': 'Le coordinateur reçoit email + récap WhatsApp',
      'Private transport framed with calmer, more credible premium direction': 'Transport privé présenté avec une direction premium plus calme et crédible.',
      'Champagne, flowers, host support and arrival styling in one place': 'Champagne, fleurs, assistance hôte et mise en scène d’arrivée au même endroit.',
      'One route from first visit to a readable VIP request': 'Un seul parcours depuis la première visite jusqu’à une demande VIP lisible.',
      'Curated arrivals': 'Arrivées soignées',
      'Celebration bundles, concierge layers and premium upsell logic in one place.': 'Bundles célébration, couches concierge et logique premium d’upsell au même endroit.',
      'Vehicle confidence': 'Confiance flotte',
      'SUV, van and Black Signature tiers framed for premium guests.': 'Niveaux SUV, van et Black Signature pensés pour une clientèle premium.',
      'Luxury transport & concierge': 'Transport de luxe et concierge',
      'Why us': 'Pourquoi nous',
      'Services': 'Services',
      'Packages': 'Offres',
      'Fleet details': 'Détails flotte',
      'Booking': 'Réservation',
      'Start your request': 'Démarrer la demande',
      'See packages': 'Voir les offres',
      'Review fleet': 'Voir la flotte',
      'Request this experience': 'Demander cette expérience',
      'View fleet tiers': 'Voir les niveaux de flotte',
      'Open packages': 'Ouvrir les offres',
      'Open fleet': 'Ouvrir la flotte',
      'Open booking flow': 'Ouvrir le flux de réservation',
      'Open booking page': 'Ouvrir la page de réservation',
      'Open fleet page': 'Ouvrir la page flotte',
      'Open operations page': 'Ouvrir la page opérationnelle',
      'View packages': 'Voir les offres',
      'View fleet': 'Voir la flotte',
      'Packages page': 'Page offres',
      'Fleet and routes': 'Flotte et routes',
      'Operations flow': 'Flux opérationnel',
      'Booking page': 'Page de réservation',
      'Home': 'Accueil',
      'Guest handoff': 'Relais client',
      'Booking builder': 'Configurateur de réservation',
      'Builder': 'Configurateur',
      'Extras': 'Extras',
      'Operations': 'Opérations',
      'Build request': 'Construire la demande',
      'See operations': 'Voir les opérations',
      'Luxury': 'Luxe',
      'Private transport framed with cleaner premium direction': 'Transport privé cadré avec une direction premium plus nette.',
      'Selected extras': 'Extras sélectionnés',
      'Champagne, flowers, fast-track, host assistance and more': 'Champagne, fleurs, fast-track, assistance hôte et plus encore.',
      'Clear requests': 'Demandes claires',
      'One route from first visit to inquiry': 'Un seul parcours depuis la première visite jusqu’à la demande.',
      'One route from first visit to a structured VIP inquiry': 'Un seul parcours de la première visite à une demande VIP structurée.',
      'Signature arrival': 'Arrivée signature',
      'Excellentia VIP experience': 'Expérience Excellentia VIP',
      'Package': 'Offre',
      'Add-ons': 'Extras',
      'Promise': 'Promesse',
      'Private, discreet, premium': 'Privé, discret, premium',
      'Private transport': 'Transport privé',
      'Airport transfers, chauffeur service and curated arrivals': 'Transferts aéroport, service chauffeur et arrivées soignées',
      'Premium extras': 'Extras premium',
      'Champagne, flowers, child seats, host assistance and tailored requests': 'Champagne, fleurs, sièges enfant, assistance hôte et demandes sur mesure',
      'Clear handoff': 'Relais clair',
      'WhatsApp, email and a readable request summary before confirmation': 'WhatsApp, email et un résumé lisible avant confirmation',
      'Trust blockers': 'Freins à la confiance',
      'What weakens trust on premium sites': 'Ce qui affaiblit la confiance sur un site premium',
      'Guests cannot quickly tell which service fits their arrival.': 'Les clients ne voient pas rapidement quel service correspond à leur arrivée.',
      'Premium extras feel hidden instead of deliberate.': 'Les extras premium semblent cachés au lieu d’être assumés.',
      'Vehicle tiers look decorative instead of real.': 'Les niveaux de véhicules paraissent décoratifs au lieu d’être concrets.',
      'The request flow asks for trust before it gives clarity.': 'Le parcours de demande réclame la confiance avant d’apporter assez de clarté.',
      'Our direction': 'Notre direction',
      'What changes': 'Ce qui change',
      'Each service has a clear role and entry point.': 'Chaque service a un rôle clair et un point d’entrée net.',
      'Add-ons are visible and selectable inside the same request flow.': 'Les extras sont visibles et sélectionnables dans le même parcours.',
      'Fleet categories read like real service tiers.': 'Les catégories de flotte se lisent comme de vrais niveaux de service.',
      'The site feels premium without forcing extra scrolling.': 'Le site paraît premium sans imposer de scroll supplémentaire.',
      'Curated packages': 'Packages soignés',
      'Packages, premium extras and upsell logic in one place.': 'Packages, extras premium et logique d’upsell réunis au même endroit.',
      'Fleet tiers': 'Niveaux de flotte',
      'Fleet categories, route fit and service confidence.': 'Catégories de flotte, adéquation des trajets et confiance dans le service.',
      'Request flow': 'Parcours de demande',
      'Interactive builder and request summary': 'Configurateur interactif et résumé de la demande',
      'The guest can configure service, route, vehicle and add-ons in one dedicated space.': 'Le client peut configurer service, trajet, véhicule et extras dans un espace dédié.',
      'Confirmation, email and WhatsApp routing': 'Confirmation, email et routage WhatsApp',
      'The business can see the post-request logic clearly without extra homepage text.': 'L’équipe peut lire clairement la logique post-demande sans charger la homepage.',
      'Vehicle tiers and route fit': 'Niveaux de véhicules et adéquation des trajets',
      'The fleet gets its own page instead of becoming another long block to scroll through.': 'La flotte a sa propre page au lieu de devenir un autre long bloc à faire défiler.',
      'Open booking': 'Ouvrir la réservation',
      'Open operations': 'Ouvrir les opérations',
      'Private transfers, chauffeur service, curated tours and premium concierge requests.': 'Transferts privés, service chauffeur, tours soignés et demandes concierge premium.',
      'A cleaner homepage, dedicated booking flow and clearer service tiers make the offer feel premium before a guest ever gets in touch.': 'Une page d’accueil plus claire, un flux de réservation dédié et des niveaux de service plus lisibles rendent l’offre premium avant même le premier contact.',
      'A cleaner homepage, dedicated booking flow and clear service tiers make the offer feel premium before a guest ever gets in touch.': 'Une page d’accueil plus claire, un flux de réservation dédié et des niveaux de service nets rendent l’offre premium avant même le premier contact.',
      'A structured request flow helps the guest choose faster and helps the team confirm with fewer back-and-forth messages.': 'Un flux de demande structuré aide le client à choisir plus vite et l’équipe à confirmer avec moins d’allers-retours.',
      'Vehicle choice, route type and guest intent should stay visible from first click to booking request.': 'Le choix du véhicule, le type de route et l’intention du client doivent rester visibles du premier clic jusqu’à la demande.',
      'Direction only for now: visual system, upsell logic and booking architecture ready to absorb the client’s real fleet, contact data and payment flow later.': 'Direction pour l’instant : système visuel, logique d’upsell et architecture de réservation prêts à absorber plus tard la vraie flotte, les contacts et le paiement du client.',
      'Every request should reach WhatsApp, email and the team trail with the same booking detail intact.': 'Chaque demande doit atteindre WhatsApp, email et la vue partagée de l’équipe avec le même niveau de détail intact.',
      'Clear request before handoff': 'Demande claire avant l\'envoi à l\'équipe',
      'Service': 'Service',
      'Output': 'Sortie',
      'Transfer, chauffeur, tour, concierge': 'Transfert, chauffeur, tour et concierge',
      'Moet, chilled refreshments, celebration styling, Brugal 1888': 'Moet, rafraîchissements d’accueil, mise en scène célébration, Brugal 1888',
      'Recap now, confirmations after payment': 'Récap maintenant, confirmations après paiement',
      'Day service': 'Service de jour',
      'Night arrival': 'Arrivée de nuit',
      'Weekend / holiday': 'Week-end / férié',
      'Estimated itinerary total': 'Total itinéraire estimé',
      'Back to concept': 'Retour au concept',
      'Main concept': 'Vue d\'ensemble',
      'Interactive booking, premium extras and a cleaner handoff to WhatsApp or email.': 'Réservation interactive, extras premium et envoi plus fluide vers WhatsApp ou email.',
      'Champagne · Flowers · Host': 'Champagne · Fleurs · Hôte'
    },
    de: {
      'WhatsApp concierge': 'WhatsApp-Concierge',
      'Direct reservations line': 'Direkte Reservierungsleitung',
      'Punta Cana reservations line': 'Reservierungsleitung Punta Cana',
      'Call now': 'Jetzt anrufen',
      'Email desk': 'Reservierungs-E-Mail',
      'Email reservations': 'E-Mail',
      'Guests': 'Gäste',
      'Special notes': 'Besondere Hinweise',
      'Copy itinerary': 'Reiseplan kopieren',
      'After payment': 'Nach der Zahlung',
      'Client receives email + WhatsApp confirmation': 'Der Kunde erhält Bestätigung per E-Mail + WhatsApp',
      'Operations dispatch': 'Operativer Dispatch',
      'Coordinator receives email + WhatsApp recap': 'Der Koordinator erhält E-Mail + WhatsApp-Zusammenfassung',
      'Private transport framed with calmer, more credible premium direction': 'Privater Transport mit ruhigerer, glaubwürdiger Premium-Ausrichtung.',
      'Champagne, flowers, host support and arrival styling in one place': 'Champagner, Blumen, Host-Support und Arrival-Styling an einem Ort.',
      'One route from first visit to a readable VIP request': 'Ein klarer Weg vom ersten Besuch bis zur gut lesbaren VIP-Anfrage.',
      'Curated arrivals': 'Kuratierte Ankünfte',
      'Celebration bundles, concierge layers and premium upsell logic in one place.': 'Celebration-Bundles, Concierge-Ebenen und Premium-Upsell-Logik an einem Ort.',
      'Vehicle confidence': 'Verlässliche Flottenwahl',
      'SUV, van and Black Signature tiers framed for premium guests.': 'SUV-, Van- und Black-Signature-Stufen klar für Premium-Gäste gerahmt.',
      'Luxury transport & concierge': 'Luxury-Transport und Concierge',
      'Why us': 'Warum wir',
      'Services': 'Services',
      'Packages': 'Pakete',
      'Fleet details': 'Flottendetails',
      'Booking': 'Buchung',
      'Start your request': 'Anfrage starten',
      'See packages': 'Pakete ansehen',
      'Review fleet': 'Flotte ansehen',
      'Request this experience': 'Dieses Erlebnis anfragen',
      'View fleet tiers': 'Flottenstufen ansehen',
      'Open packages': 'Pakete öffnen',
      'Open fleet': 'Flotte öffnen',
      'Open booking flow': 'Buchungsfluss öffnen',
      'Open booking page': 'Buchungsseite öffnen',
      'Open fleet page': 'Flottenseite öffnen',
      'Open operations page': 'Operations-Seite öffnen',
      'View packages': 'Pakete ansehen',
      'View fleet': 'Flotte ansehen',
      'Packages page': 'Paketseite',
      'Fleet and routes': 'Flotte und Routen',
      'Operations flow': 'Operativer Ablauf',
      'Booking page': 'Buchungsseite',
      'Home': 'Start',
      'Guest handoff': 'Übergabe ans Team',
      'Booking builder': 'Anfragekonfigurator',
      'Builder': 'Konfigurator',
      'Extras': 'Extras',
      'Operations': 'Abläufe',
      'Build request': 'Anfrage aufbauen',
      'See operations': 'Operations ansehen',
      'Luxury': 'Luxus',
      'Private transport framed with cleaner premium direction': 'Privater Transport mit klarerer Premium-Ausrichtung.',
      'Selected extras': 'Ausgewählte Extras',
      'Champagne, flowers, fast-track, host assistance and more': 'Champagner, Blumen, Fast-Track, Host-Begleitung und mehr.',
      'Clear requests': 'Klare Anfragen',
      'One route from first visit to inquiry': 'Ein klarer Weg vom ersten Besuch bis zur Anfrage.',
      'One route from first visit to a structured VIP inquiry': 'Ein klarer Weg vom ersten Besuch bis zur strukturierten VIP-Anfrage.',
      'Signature arrival': 'Signature-Ankunft',
      'Excellentia VIP experience': 'Excellentia-VIP-Erlebnis',
      'Package': 'Paket',
      'Add-ons': 'Extras',
      'Promise': 'Versprechen',
      'Private, discreet, premium': 'Privat, diskret, premium',
      'Private transport': 'Privater Transport',
      'Airport transfers, chauffeur service and curated arrivals': 'Flughafentransfers, Chauffeur-Service und kuratierte Ankünfte',
      'Premium extras': 'Premium-Extras',
      'Champagne, flowers, child seats, host assistance and tailored requests': 'Champagner, Blumen, Kindersitze, Host-Begleitung und maßgeschneiderte Anfragen',
      'Clear handoff': 'Klare Übergabe',
      'WhatsApp, email and a readable request summary before confirmation': 'WhatsApp, E-Mail und eine gut lesbare Zusammenfassung vor der Bestätigung',
      'Trust blockers': 'Vertrauensbarrieren',
      'What weakens trust on premium sites': 'Was Vertrauen auf Premium-Seiten schwächt',
      'Guests cannot quickly tell which service fits their arrival.': 'Gäste erkennen nicht schnell genug, welcher Service zu ihrer Ankunft passt.',
      'Premium extras feel hidden instead of deliberate.': 'Premium-Extras wirken versteckt statt bewusst inszeniert.',
      'Vehicle tiers look decorative instead of real.': 'Fahrzeugstufen wirken dekorativ statt real.',
      'The request flow asks for trust before it gives clarity.': 'Der Anfragefluss verlangt Vertrauen, bevor er Klarheit schafft.',
      'Our direction': 'Unsere Richtung',
      'What changes': 'Was sich ändert',
      'Each service has a clear role and entry point.': 'Jeder Service hat eine klare Rolle und einen eindeutigen Einstiegspunkt.',
      'Add-ons are visible and selectable inside the same request flow.': 'Extras sind sichtbar und direkt im selben Anfragefluss wählbar.',
      'Fleet categories read like real service tiers.': 'Die Flottenkategorien lesen sich wie echte Service-Stufen.',
      'The site feels premium without forcing extra scrolling.': 'Die Seite wirkt premium, ohne zusätzliches Scrollen zu erzwingen.',
      'Interactive builder and request summary': 'Interaktiver Konfigurator und Anfragezusammenfassung',
      'The guest can configure service, route, vehicle and add-ons in one dedicated space.': 'Der Gast kann Service, Strecke, Fahrzeug und Extras in einem eigenen Bereich konfigurieren.',
      'Confirmation, email and WhatsApp routing': 'Bestätigung, E-Mail und WhatsApp-Weiterleitung',
      'The business can see the post-request logic clearly without extra homepage text.': 'Das Team sieht die Logik nach der Anfrage klar, ohne zusätzlichen Homepage-Text.',
      'Vehicle tiers and route fit': 'Fahrzeugstufen und Routenpassung',
      'The fleet gets its own page instead of becoming another long block to scroll through.': 'Die Flotte bekommt ihre eigene Seite, statt ein weiterer langer Scroll-Block zu werden.',
      'Open booking': 'Buchung öffnen',
      'Open operations': 'Abläufe öffnen',
      'Private transfers, chauffeur service, curated tours and premium concierge requests.': 'Private Transfers, Chauffeur-Service, kuratierte Touren und Premium-Concierge-Anfragen.',
      'A cleaner homepage, dedicated booking flow and clearer service tiers make the offer feel premium before a guest ever gets in touch.': 'Eine klarere Homepage, ein dedizierter Buchungsfluss und deutlichere Service-Stufen lassen das Angebot schon vor dem ersten Kontakt premium wirken.',
      'A cleaner homepage, dedicated booking flow and clear service tiers make the offer feel premium before a guest ever gets in touch.': 'Eine klarere Homepage, ein eigener Buchungsfluss und klare Service-Stufen lassen das Angebot schon vor dem ersten Kontakt premium wirken.',
      'A structured request flow helps the guest choose faster and helps the team confirm with fewer back-and-forth messages.': 'Ein strukturierter Anfragefluss hilft dem Gast schneller zu wählen und dem Team mit weniger Hin und Her zu bestätigen.',
      'Vehicle choice, route type and guest intent should stay visible from first click to booking request.': 'Fahrzeugwahl, Routentyp und Gastabsicht sollen vom ersten Klick bis zur Buchungsanfrage sichtbar bleiben.',
      'Direction only for now: visual system, upsell logic and booking architecture ready to absorb the client’s real fleet, contact data and payment flow later.': 'Aktuell nur Richtung: Das visuelle System, die Upsell-Logik und die Buchungsarchitektur sind bereit, später echte Flotte, Kontaktdaten und Zahlungsfluss des Kunden aufzunehmen.',
      'Every request should reach WhatsApp, email and the team trail with the same booking detail intact.': 'Jede Anfrage muss WhatsApp, E-Mail und die geteilte Teamuebersicht mit denselben Buchungsdetails erreichen.',
      'Clear request before handoff': 'Klare Anfrage vor dem Versand ans Team',
      'Service': 'Service',
      'Output': 'Ausgabe',
      'Transfer, chauffeur, tour, concierge': 'Transfer, Chauffeur, Tour und Concierge',
      'Moet, chilled refreshments, celebration styling, Brugal 1888': 'Moet, gekühlte Erfrischungen, Ankunfts-Styling, Brugal 1888',
      'Recap now, confirmations after payment': 'Zusammenfassung jetzt, Bestätigungen nach Zahlung',
      'Day service': 'Tagesservice',
      'Night arrival': 'Nachtankunft',
      'Weekend / holiday': 'Wochenende / Feiertag',
      'Estimated itinerary total': 'Geschätzter Gesamtwert des Reiseplans',
      'Back to concept': 'Zurück zum Konzept',
      'Main concept': 'Hauptvorschlag',
      'Interactive booking, premium extras and a cleaner handoff to WhatsApp or email.': 'Interaktiver Anfragekonfigurator, Premium-Extras und ein sauberer Versand an WhatsApp oder E-Mail.',
      'Champagne · Flowers · Host': 'Champagner · Blumen · Host'
    },
    pt: {
      'WhatsApp concierge': 'Concierge no WhatsApp',
      'Direct reservations line': 'Linha direta de reservas',
      'Punta Cana reservations line': 'Linha de reservas Punta Cana',
      'Call now': 'Ligar agora',
      'Email desk': 'Email reservas',
      'Email reservations': 'Email',
      'Guests': 'Hóspedes',
      'Special notes': 'Notas especiais',
      'Copy itinerary': 'Copiar itinerário',
      'After payment': 'Depois do pagamento',
      'Client receives email + WhatsApp confirmation': 'O cliente recebe confirmação por email + WhatsApp',
      'Operations dispatch': 'Dispatch operacional',
      'Coordinator receives email + WhatsApp recap': 'O coordenador recebe email + resumo por WhatsApp',
      'Private transport framed with calmer, more credible premium direction': 'Transporte privado com direção premium mais sóbria e credível.',
      'Champagne, flowers, host support and arrival styling in one place': 'Champagne, flores, apoio de anfitrião e styling de chegada no mesmo lugar.',
      'One route from first visit to a readable VIP request': 'Um só percurso desde a primeira visita até um pedido VIP legível.',
      'Curated arrivals': 'Chegadas curadas',
      'Celebration bundles, concierge layers and premium upsell logic in one place.': 'Bundles de celebração, camadas concierge e lógica premium de upsell num só lugar.',
      'Vehicle confidence': 'Confiança na frota',
      'SUV, van and Black Signature tiers framed for premium guests.': 'Tiers SUV, van e Black Signature enquadrados para hóspedes premium.',
      'Luxury transport & concierge': 'Transporte de luxo e concierge',
      'Why us': 'Por que nós',
      'Services': 'Serviços',
      'Packages': 'Pacotes',
      'Fleet details': 'Detalhes da frota',
      'Booking': 'Reserva',
      'Start your request': 'Iniciar pedido',
      'See packages': 'Ver pacotes',
      'Review fleet': 'Ver frota',
      'Request this experience': 'Solicitar esta experiência',
      'View fleet tiers': 'Ver níveis da frota',
      'Open packages': 'Abrir pacotes',
      'Open fleet': 'Abrir frota',
      'Open booking flow': 'Abrir fluxo de reserva',
      'Open booking page': 'Abrir página de reserva',
      'Open fleet page': 'Abrir página da frota',
      'Open operations page': 'Abrir página operacional',
      'View packages': 'Ver pacotes',
      'View fleet': 'Ver frota',
      'Packages page': 'Página de pacotes',
      'Fleet and routes': 'Frota e rotas',
      'Operations flow': 'Fluxo operacional',
      'Booking page': 'Página de reserva',
      'Home': 'Início',
      'Guest handoff': 'Passagem para a equipa',
      'Booking builder': 'Configurador de reserva',
      'Builder': 'Configurador',
      'Extras': 'Extras',
      'Operations': 'Operações',
      'Build request': 'Montar pedido',
      'See operations': 'Ver operações',
      'Luxury': 'Luxo',
      'Private transport framed with cleaner premium direction': 'Transporte privado com direção premium mais limpa.',
      'Selected extras': 'Extras selecionados',
      'Champagne, flowers, fast-track, host assistance and more': 'Champagne, flores, fast-track, assistência de anfitrião e mais.',
      'Clear requests': 'Pedidos claros',
      'One route from first visit to inquiry': 'Um único percurso desde a primeira visita até ao pedido.',
      'One route from first visit to a structured VIP inquiry': 'Um só percurso desde a primeira visita até um pedido VIP estruturado.',
      'Signature arrival': 'Chegada signature',
      'Excellentia VIP experience': 'Experiência Excellentia VIP',
      'Package': 'Pacote',
      'Add-ons': 'Extras',
      'Promise': 'Promessa',
      'Private, discreet, premium': 'Privado, discreto, premium',
      'Private transport': 'Transporte privado',
      'Airport transfers, chauffeur service and curated arrivals': 'Transfers de aeroporto, serviço com motorista e chegadas curadas',
      'Premium extras': 'Extras premium',
      'Champagne, flowers, child seats, host assistance and tailored requests': 'Champagne, flores, cadeiras infantis, assistência de anfitrião e pedidos à medida',
      'Clear handoff': 'Encaminhamento claro',
      'WhatsApp, email and a readable request summary before confirmation': 'WhatsApp, email e um resumo legível antes da confirmação',
      'Trust blockers': 'Bloqueios de confiança',
      'What weakens trust on premium sites': 'O que enfraquece a confiança em sites premium',
      'Guests cannot quickly tell which service fits their arrival.': 'Os hóspedes não percebem rapidamente qual serviço combina com a sua chegada.',
      'Premium extras feel hidden instead of deliberate.': 'Os extras premium parecem escondidos em vez de intencionais.',
      'Vehicle tiers look decorative instead of real.': 'Os níveis de veículo parecem decorativos em vez de reais.',
      'The request flow asks for trust before it gives clarity.': 'O fluxo de pedido exige confiança antes de dar clareza.',
      'Our direction': 'A nossa direção',
      'What changes': 'O que muda',
      'Each service has a clear role and entry point.': 'Cada serviço tem um papel claro e um ponto de entrada objetivo.',
      'Add-ons are visible and selectable inside the same request flow.': 'Os extras são visíveis e selecionáveis dentro do mesmo fluxo.',
      'Fleet categories read like real service tiers.': 'As categorias da frota leem-se como níveis reais de serviço.',
      'The site feels premium without forcing extra scrolling.': 'O site parece premium sem obrigar a scroll extra.',
      'Curated packages': 'Pacotes curados',
      'Packages, premium extras and upsell logic in one place.': 'Pacotes, extras premium e lógica de upsell no mesmo lugar.',
      'Fleet tiers': 'Níveis da frota',
      'Fleet categories, route fit and service confidence.': 'Categorias da frota, adequação da rota e confiança no serviço.',
      'Request flow': 'Fluxo de pedido',
      'Interactive builder and request summary': 'Configurador interativo e resumo do pedido',
      'The guest can configure service, route, vehicle and add-ons in one dedicated space.': 'O hóspede pode configurar serviço, rota, veículo e extras num espaço dedicado.',
      'Confirmation, email and WhatsApp routing': 'Confirmação, email e encaminhamento por WhatsApp',
      'The business can see the post-request logic clearly without extra homepage text.': 'A equipa consegue ver claramente a lógica pós-pedido sem mais texto na homepage.',
      'Vehicle tiers and route fit': 'Níveis de veículo e adequação da rota',
      'The fleet gets its own page instead of becoming another long block to scroll through.': 'A frota ganha a sua própria página em vez de virar mais um bloco longo para percorrer.',
      'Open booking': 'Abrir reserva',
      'Open operations': 'Abrir operações',
      'Private transfers, chauffeur service, curated tours and premium concierge requests.': 'Transfers privados, serviço com motorista, tours curados e pedidos premium de concierge.',
      'A cleaner homepage, dedicated booking flow and clearer service tiers make the offer feel premium before a guest ever gets in touch.': 'Uma página inicial mais limpa, um fluxo de reserva dedicado e níveis de serviço mais claros fazem a oferta parecer premium antes mesmo do primeiro contacto.',
      'A cleaner homepage, dedicated booking flow and clear service tiers make the offer feel premium before a guest ever gets in touch.': 'Uma página inicial mais limpa, um fluxo de reserva dedicado e níveis de serviço claros fazem a oferta parecer premium antes mesmo do primeiro contacto.',
      'A structured request flow helps the guest choose faster and helps the team confirm with fewer back-and-forth messages.': 'Um fluxo de pedido estruturado ajuda o hóspede a escolher mais rápido e ajuda a equipa a confirmar com menos idas e vindas.',
      'Vehicle choice, route type and guest intent should stay visible from first click to booking request.': 'A escolha do veículo, o tipo de rota e a intenção do hóspede devem continuar visíveis desde o primeiro clique até ao pedido.',
      'Direction only for now: visual system, upsell logic and booking architecture ready to absorb the client’s real fleet, contact data and payment flow later.': 'Direção por agora: sistema visual, lógica de upsell e arquitetura de reserva prontas para absorver depois a frota real, contactos e fluxo de pagamento do cliente.',
      'Every request should reach WhatsApp, email and the team trail with the same booking detail intact.': 'Cada pedido deve chegar ao WhatsApp, email e à vista partilhada da equipa com o mesmo detalhe intacto.',
      'Clear request before handoff': 'Pedido claro antes do envio para a equipa',
      'Service': 'Serviço',
      'Output': 'Saída',
      'Transfer, chauffeur, tour, concierge': 'Transfer, motorista, tour e concierge',
      'Moet, chilled refreshments, celebration styling, Brugal 1888': 'Moet, bebidas geladas de boas-vindas, styling de celebração, Brugal 1888',
      'Recap now, confirmations after payment': 'Recap agora, confirmações depois do pagamento',
      'Day service': 'Serviço diurno',
      'Night arrival': 'Chegada noturna',
      'Weekend / holiday': 'Fim de semana / feriado',
      'Estimated itinerary total': 'Total estimado do itinerário',
      'Back to concept': 'Voltar ao conceito',
      'Main concept': 'Proposta principal',
      'Interactive booking, premium extras and a cleaner handoff to WhatsApp or email.': 'Reserva interativa, extras premium e envio mais limpo para WhatsApp ou email.',
      'Champagne · Flowers · Host': 'Champagne · Flores · Anfitrião'
    },
    ru: {
      'WhatsApp concierge': 'Консьерж в WhatsApp',
      'Direct reservations line': 'Прямая линия бронирования',
      'Punta Cana reservations line': 'Линия бронирования Punta Cana',
      'Call now': 'Позвонить',
      'Email desk': 'Написать в отдел бронирования',
      'Email reservations': 'Email',
      'Guests': 'Гости',
      'Special notes': 'Особые пожелания',
      'Copy itinerary': 'Скопировать маршрут',
      'After payment': 'После оплаты',
      'Client receives email + WhatsApp confirmation': 'Клиент получает подтверждение по email + WhatsApp',
      'Operations dispatch': 'Операционный dispatch',
      'Coordinator receives email + WhatsApp recap': 'Координатор получает email + сводку в WhatsApp',
      'Private transport framed with calmer, more credible premium direction': 'Частный транспорт подан в более спокойной и убедительной премиальной подаче.',
      'Champagne, flowers, host support and arrival styling in one place': 'Шампанское, цветы, поддержка хоста и сценарий встречи в одном месте.',
      'One route from first visit to a readable VIP request': 'Один понятный путь от первого визита до читаемого VIP-запроса.',
      'Curated arrivals': 'Продуманные прибытия',
      'Celebration bundles, concierge layers and premium upsell logic in one place.': 'Celebration-наборы, concierge-уровни и premium upsell-логика в одном месте.',
      'Vehicle confidence': 'Уверенность в автопарке',
      'SUV, van and Black Signature tiers framed for premium guests.': 'Категории SUV, van и Black Signature поданы для премиальных гостей.',
      'Luxury transport & concierge': 'Премиальный транспорт и консьерж',
      'Why us': 'Почему мы',
      'Services': 'Услуги',
      'Packages': 'Пакеты',
      'Fleet': 'Автопарк',
      'Fleet details': 'Детали автопарка',
      'Booking': 'Бронирование',
      'Start request': 'Начать запрос',
      'Start your request': 'Начать запрос',
      'See packages': 'Смотреть пакеты',
      'Review fleet': 'Смотреть автопарк',
      'Request this experience': 'Запросить этот формат',
      'View fleet tiers': 'Смотреть категории авто',
      'Open packages': 'Открыть пакеты',
      'Open fleet': 'Открыть автопарк',
      'Open booking flow': 'Открыть бронирование',
      'Open booking page': 'Открыть страницу бронирования',
      'Open fleet page': 'Открыть страницу автопарка',
      'Open operations page': 'Открыть страницу операций',
      'View packages': 'Смотреть пакеты',
      'View fleet': 'Смотреть автопарк',
      'Packages page': 'Страница пакетов',
      'Fleet and routes': 'Автопарк и маршруты',
      'Operations flow': 'Операционный поток',
      'Booking page': 'Страница бронирования',
      'Home': 'Главная',
      'Guest handoff': 'Передача команде',
      'Booking builder': 'Конфигуратор бронирования',
      'Builder': 'Конфигуратор',
      'Extras': 'Дополнения',
      'Operations': 'Операции',
      'Build request': 'Собрать запрос',
      'See operations': 'Смотреть операции',
      'Live concept summary': 'Сводка текущего concept',
      'Premium itinerary cart': 'Premium itinerary cart',
      'Save selection': 'Сохранить выбор',
      'Email request': 'Запрос по email',
      'WhatsApp request': 'Запрос в WhatsApp',
      'Email full itinerary': 'Отправить полный itinerary по email',
      'WhatsApp full itinerary': 'Отправить полный itinerary в WhatsApp',
      'Clear': 'Очистить',
      'Route:': 'Маршрут:',
      'Package:': 'Пакет:',
      'Timing:': 'Время:',
      'Add-ons:': 'Дополнения:',
      'Private transfers, chauffeur service, curated tours and premium concierge requests.': 'Частные трансферы, услуги шофера, продуманные туры и премиальные консьерж-запросы.',
      'A cleaner homepage, dedicated booking flow and clearer service tiers make the offer feel premium before a guest ever gets in touch.': 'Более чистая главная, отдельный поток бронирования и понятные уровни сервиса делают предложение премиальным еще до первого контакта.',
      'A structured request flow helps the guest choose faster and helps the team confirm with fewer back-and-forth messages.': 'Структурированный поток запроса помогает гостю выбрать быстрее, а команде подтверждать заказ с меньшим количеством переписки.',
      'Interactive booking, premium extras and a cleaner handoff to WhatsApp or email.': 'Интерактивное бронирование, премиальные дополнения и более чистая передача в WhatsApp или email.',
      'Champagne · Flowers · Host': 'Шампанское · Цветы · Хост'
    },
    zh: {
      'WhatsApp concierge': 'WhatsApp 礼宾',
      'Direct reservations line': '预订直线',
      'Punta Cana reservations line': 'Punta Cana 预订专线',
      'Call now': '立即致电',
      'Email desk': '发送邮件',
      'Email reservations': '邮件',
      'Guests': '宾客人数',
      'Special notes': '特别说明',
      'Copy itinerary': '复制行程',
      'After payment': '付款后',
      'Client receives email + WhatsApp confirmation': '客户会收到邮件 + WhatsApp 确认',
      'Operations dispatch': '运营派发',
      'Coordinator receives email + WhatsApp recap': '协调员会收到邮件 + WhatsApp 摘要',
      'Private transport framed with calmer, more credible premium direction': '以更克制、更可信的高端方式呈现私人接送。',
      'Champagne, flowers, host support and arrival styling in one place': '香槟、鲜花、接待协助与到达布置整合在同一处。',
      'One route from first visit to a readable VIP request': '从首次访问到清晰 VIP 请求的单一路径。',
      'Curated arrivals': '精心设计的到达体验',
      'Celebration bundles, concierge layers and premium upsell logic in one place.': '庆祝组合、礼宾层级与高端加购逻辑集中在同一处。',
      'Vehicle confidence': '车队信心',
      'SUV, van and Black Signature tiers framed for premium guests.': '面向高端客人的 SUV、van 与 Black Signature 级别清晰呈现。',
      'Luxury transport & concierge': '高端接送与礼宾',
      'Why us': '为什么选择我们',
      'Services': '服务',
      'Packages': '套餐',
      'Fleet': '车队',
      'Fleet details': '车队详情',
      'Booking': '预订',
      'Start request': '开始请求',
      'Start your request': '开始请求',
      'See packages': '查看套餐',
      'Review fleet': '查看车队',
      'Request this experience': '申请此体验',
      'View fleet tiers': '查看车型等级',
      'Open packages': '打开套餐页',
      'Open fleet': '打开车队页',
      'Open booking flow': '打开预订流程',
      'Open booking page': '打开预订页',
      'Open fleet page': '打开车队页',
      'Open operations page': '打开运营页',
      'View packages': '查看套餐',
      'View fleet': '查看车队',
      'Packages page': '套餐页面',
      'Fleet and routes': '车队与路线',
      'Operations flow': '运营流程',
      'Booking page': '预订页面',
      'Home': '首页',
      'Guest handoff': '交接给团队',
      'Booking builder': '预订配置器',
      'Builder': '配置器',
      'Extras': '附加项目',
      'Operations': '运营',
      'Build request': '创建请求',
      'See operations': '查看运营流程',
      'Live concept summary': '当前方案摘要',
      'Premium itinerary cart': '高端行程清单',
      'Save selection': '保存选择',
      'Email request': '通过邮件发送请求',
      'WhatsApp request': '通过 WhatsApp 发送请求',
      'Email full itinerary': '通过邮件发送完整 itinerary',
      'WhatsApp full itinerary': '通过 WhatsApp 发送完整 itinerary',
      'Clear': '清空',
      'Route:': '路线：',
      'Package:': '套餐：',
      'Timing:': '时间：',
      'Add-ons:': '附加项：',
      'Private transfers, chauffeur service, curated tours and premium concierge requests.': '私人接送、专属司机、精选行程与高端礼宾服务请求。',
      'A cleaner homepage, dedicated booking flow and clearer service tiers make the offer feel premium before a guest ever gets in touch.': '更干净的首页、独立的预订流程和更清晰的服务层级，让报价在客户联系之前就显得更高端。',
      'A structured request flow helps the guest choose faster and helps the team confirm with fewer back-and-forth messages.': '结构化请求流程让客人更快做决定，也让团队用更少来回沟通完成确认。',
      'Interactive booking, premium extras and a cleaner handoff to WhatsApp or email.': '互动式预订、精选高端附加项，以及更清晰的 WhatsApp 或邮件交接。',
      'Champagne · Flowers · Host': '香槟 · 鲜花 · 接待协助'
    }
  };

  var content = {
    home: {
      es: {
        benchmark: {
          eyebrow: 'Guía de rutas premium',
          title: 'El servicio de aeropuerto, villa y concierge debe sentirse premium antes de que el huésped compare precios.',
          lead: 'Las rutas base se apoyan en referencias reales de Punta Cana, mientras la diferencia premium aparece en la flota, la coordinación y la forma de presentar la llegada.',
          cards: [
            ['Cap Cana', 'Desde $35', 'Base limpia aeropuerto-resort para transfer privado directo.'],
            ['Bávaro', 'Desde $39', 'Corredor principal de resorts para mantener credibilidad en el configurador.'],
            ['Uvero Alto', 'Desde $69', 'Trayecto más largo antes del uplift por vehículo y paquete premium.'],
            ['SUV premium', '$65 a $110', 'La capa premium alta ahora se refleja en Black Signature y no en precios base falsos.']
          ]
        },
        services: [
          ['Llegada', 'Transfer premium al aeropuerto', 'Rutas de aeropuerto, resort y villa presentadas con referencias claras como Cap Cana y Bávaro, sin perder el tono premium.', ['Recogida y salida de aeropuerto', 'Soporte meet and greet', 'Transfer a hotel, resort o villa']],
          ['Chofer privado', 'Servicio de chofer por horas', 'Pensado para reuniones, compras, vida nocturna y movimientos privados donde importan más el tiempo y la discreción que un traslado genérico.', ['Cobertura de 4h, 6h, 8h y día completo', 'Ruta flexible y tiempo de espera', 'Uso ejecutivo y vacacional']],
          ['Experiencia', 'Tours privados curados', 'Saona, días en yate, pesca, buggy y planes a medida se piden dentro del mismo flujo premium, no como un añadido improvisado.', ['Posicionamiento Saona y día de costa', 'Itinerario privado a medida', 'Transporte de lujo incluido']],
          ['Upgrade', 'Concierge y extras premium', 'Celebraciones, ambientación de bienvenida, flores, apoyo de anfitrión y toques locales dominicanos dentro de la misma arquitectura de reserva.', ['Champagne, flores y cartelería', 'Fast-track y asistencia de anfitrión', 'Familias y ocasiones especiales']]
        ],
        experience: [
          ['Ambiente a bordo', 'Champagne, agua fría, flores, cartelería y otros extras deben sentirse intencionales, no improvisados.'],
          ['Concierge previo a la llegada', 'La coordinación de hotel, tiempos de ruta, soporte de aeropuerto y solicitudes especiales debe verse como parte del valor del servicio.'],
          ['Flujo familiar y celebraciones', 'Sillas infantiles, llegadas sorpresa, bodas y momentos importantes merecen su propio camino limpio de solicitud.'],
          ['Confianza ejecutiva', 'Para huéspedes de negocios, el sitio debe proyectar discreción, fiabilidad y velocidad, no solo una estética de lujo.']
        ]
      },
      it: {
        benchmark: {
          eyebrow: 'Guida tratte premium',
          title: 'Servizio aeroporto, villa e concierge devono sembrare premium prima ancora che l’ospite confronti i prezzi.',
          lead: 'Le ancore di tratta restano allineate al mercato di Punta Cana, mentre la differenza premium arriva da veicolo, coordinamento e modo in cui l’arrivo viene presentato.',
          cards: [
            ['Cap Cana', 'Da $35', 'Base pulita aeroporto-resort per transfer privato diretto.'],
            ['Bavaro', 'Da $39', 'Corridoio resort principale per rendere credibile il configuratore.'],
            ['Uvero Alto', 'Da $69', 'Tratta più lunga prima dell\'uplift da veicolo e package premium.'],
            ['SUV premium', '$65 a $110', 'La fascia premium alta ora vive nelle combinazioni Black Signature e non in un prezzo base finto.']
          ]
        },
        services: [
          ['Arrivo', 'Transfer premium aeroporto', 'Tratte aeroporto, resort e villa presentate con ancore chiare come Cap Cana e Bavaro, senza perdere il tono premium.', ['Pickup e drop-off aeroporto', 'Supporto meet and greet', 'Transfer per hotel, resort e villa']],
          ['Autista privato', 'Servizio con autista a ore', 'Pensato per meeting, shopping, vita notturna e spostamenti privati in cui orari e discrezione contano più di un transfer generico.', ['Copertura 4h, 6h, 8h e giornata intera', 'Tratta flessibile e attesa', 'Uso executive e leisure']],
          ['Esperienza', 'Tour privati curati', 'Saona, giornate in yacht, pesca, buggy e piani isola su misura entrano nello stesso flusso premium invece di sembrare un’aggiunta improvvisata.', ['Posizionamento Saona e giornata in costa', 'Itinerario privato su misura', 'Trasporto di lusso incluso']],
          ['Upgrade', 'Concierge ed extra premium', 'Celebrazioni, allestimento di benvenuto, fiori, assistenza host e tocchi locali dominicani dentro la stessa architettura di prenotazione.', ['Champagne, fiori e segnaletica', 'Fast-track e assistenza host', 'Famiglie e occasioni speciali']]
        ],
        experience: [
          ['Atmosfera a bordo', 'Champagne, acqua fresca, fiori, segnaletica e altri extra devono sembrare intenzionali, non improvvisati.'],
          ['Concierge pre-arrivo', 'Coordinamento hotel, tempi di tratta, supporto aeroporto e richieste speciali devono essere visibili come parte del valore.'],
          ['Flusso family e occasioni speciali', 'Seggiolini, arrivi sorpresa, trasporti per matrimoni e momenti importanti meritano un proprio percorso pulito.'],
          ['Fiducia executive', 'Per gli ospiti business il sito deve trasmettere discrezione, affidabilità e velocità, non solo un’estetica luxury.']
        ]
      },
      fr: {
        benchmark: {
          eyebrow: 'Guide de routes premium',
          title: 'Le service aéroport, villa et concierge doit sembler premium avant même que le client compare les prix.',
          lead: 'Les repères de trajet restent ancrés dans le marché de Punta Cana, tandis que la différence premium vient du véhicule, de la coordination et de la présentation de l’arrivée.',
          cards: [
            ['Cap Cana', 'À partir de 35 $', 'Base claire aéroport-resort pour un transfert privé direct.'],
            ['Bávaro', 'À partir de 39 $', 'Couloir resort principal pour garder le configurateur crédible.'],
            ['Uvero Alto', 'À partir de 69 $', 'Trajet plus long avant la montée en gamme véhicule + package.'],
            ['SUV premium', '65 à 110 $', 'La couche premium haute est portée par Black Signature, pas par un faux prix de base.']
          ]
        },
        services: [
          ['Arrivée', 'Transfert aéroport premium', 'Trajets aéroport, resort et villa présentés avec des repères clairs comme Cap Cana et Bávaro, sans perdre le ton premium.', ['Prise en charge et départ aéroport', 'Support meet and greet', 'Transfert hôtel, resort ou villa']],
          ['Chauffeur privé', 'Service chauffeur à l\'heure', 'Pensé pour réunions, shopping, vie nocturne et déplacements privés où les horaires et la discrétion comptent davantage qu\'un transfert générique.', ['Couverture 4h, 6h, 8h et journée complète', 'Itinéraire flexible et attente', 'Cas d\'usage exécutif et loisir']],
          ['Expérience', 'Tours privés soignés', 'Saona, journées yacht, pêche, buggy et plans sur mesure se demandent dans le même flux premium, pas comme un ajout improvisé.', ['Positionnement Saona et journée sur la côte', 'Itinéraire privé sur mesure', 'Transport de luxe inclus']],
          ['Upgrade', 'Concierge et extras premium', 'Célébrations, mise en scène d\'accueil, fleurs, assistance hôte et touches dominicaines locales dans la même architecture de réservation.', ['Champagne, fleurs et signalétique', 'Fast-track et assistance hôte', 'Familles et occasions spéciales']]
        ],
        experience: [
          ['Ambiance à bord', 'Champagne, eau fraîche, fleurs, signalétique et autres extras doivent paraître intentionnels, pas improvisés.'],
          ['Concierge avant arrivée', 'Coordination hôtel, horaires de trajet, support aéroport et demandes spéciales doivent être visibles comme partie du service.'],
          ['Flux famille et célébrations', 'Sièges enfants, arrivées surprise, transport mariage et moments marquants méritent leur propre parcours clair.'],
          ['Confiance exécutive', 'Pour les clients business, le site doit projeter discrétion, fiabilité et vitesse, pas seulement une esthétique de luxe.']
        ]
      },
      de: {
        benchmark: {
          eyebrow: 'Premium-Routenübersicht',
          title: 'Flughafen-, Villa- und Concierge-Service sollten premium wirken, bevor ein Gast überhaupt Preise vergleicht.',
          lead: 'Die Routenanker bleiben im Punta-Cana-Markt verankert, während der Premium-Unterschied aus Fahrzeugwahl, Koordination und der Inszenierung der Ankunft entsteht.',
          cards: [
            ['Cap Cana', 'Ab 35 $', 'Saubere Airport-zu-Resort-Basis für direkten privaten Transfer.'],
            ['Bávaro', 'Ab 39 $', 'Wichtiger Resort-Korridor, damit der Konfigurator glaubwürdig bleibt.'],
            ['Uvero Alto', 'Ab 69 $', 'Längerer Korridor vor Premium-Aufschlag durch Fahrzeug und Paket.'],
            ['Premium-SUV', '65 bis 110 $', 'Die obere Premium-Schicht lebt jetzt in Black Signature statt in falschen Grundpreisen.']
          ]
        },
        services: [
          ['Ankunft', 'Premium-Airport-Transfer', 'Airport-, Resort- und Villa-Routen werden mit klaren Ankern wie Cap Cana und Bávaro gezeigt, ohne den Premium-Ton zu verlieren.', ['Abholung und Rückfahrt am Flughafen', 'Meet-and-greet-Support', 'Transfer zu Hotel, Resort oder Villa']],
          ['Privatfahrer', 'Chauffeur-Service nach Stunden', 'Gedacht für Meetings, Shopping, Nachtleben und private Wege, bei denen Zeitfenster und Diskretion wichtiger sind als ein generischer Transfer.', ['4h-, 6h-, 8h- und Ganztagsabdeckung', 'Flexible Route und Wartezeit', 'Für Executive- und Freizeitnutzung']],
          ['Erlebnis', 'Kurierte Privattouren', 'Saona, Yacht-Tage, Fischen, Buggy-Pläne und private Inselrouten laufen im selben Premium-Ablauf statt wie ein improvisierter Zusatz.', ['Saona- und Küstenpositionierung', 'Private Maßroute', 'Luxus-Transport inklusive']],
          ['Upgrade', 'Concierge und Premium-Extras', 'Feiern, Willkommens-Setup, Blumen, Host-Begleitung und lokale dominikanische Details innerhalb derselben Buchungsarchitektur.', ['Champagner, Blumen und Beschilderung', 'Fast-track und Host-Begleitung', 'Familien und besondere Anlässe']]
        ],
        experience: [
          ['Atmosphäre an Bord', 'Champagner, kaltes Wasser, Blumen, Beschilderung und andere Extras sollen bewusst wirken, nicht improvisiert.'],
          ['Concierge vor der Ankunft', 'Hotelkoordination, Routen-Timing, Airport-Support und Sonderwünsche sollen als Teil des Servicewerts sichtbar werden.'],
          ['Familien- und Feiermomente', 'Kindersitze, Überraschungsankünfte, Hochzeiten und wichtige Momente verdienen ihren eigenen sauberen Anfragepfad.'],
          ['Executive-Vertrauen', 'Für Business-Gäste muss die Website Diskretion, Zuverlässigkeit und Tempo ausstrahlen, nicht nur Luxus-Ästhetik.']
        ]
      },
      pt: {
        benchmark: {
          eyebrow: 'Guia de rotas premium',
          title: 'Serviço de aeroporto, villa e concierge devem parecer premium antes mesmo de o hóspede comparar preços.',
          lead: 'As âncoras de rota mantêm-se ligadas ao mercado de Punta Cana, enquanto a diferença premium vem do veículo, da coordenação e da forma como a chegada é apresentada.',
          cards: [
            ['Cap Cana', 'A partir de $35', 'Base limpa aeroporto-resort para transfer privado direto.'],
            ['Bávaro', 'A partir de $39', 'Corredor principal de resort para manter o configurador credível.'],
            ['Uvero Alto', 'A partir de $69', 'Percurso mais longo antes do uplift por veículo e pacote premium.'],
            ['SUV premium', '$65 a $110', 'A camada premium alta agora vive no Black Signature e não em preços base inventados.']
          ]
        },
        services: [
          ['Chegada', 'Transfer premium de aeroporto', 'Rotas de aeroporto, resort e villa apresentadas com âncoras claras como Cap Cana e Bávaro, sem perder o tom premium.', ['Recolha e saída de aeroporto', 'Suporte meet and greet', 'Transfer para hotel, resort ou villa']],
          ['Motorista privado', 'Serviço com chauffeur por horas', 'Pensado para reuniões, compras, vida noturna e deslocações privadas em que horário e discrição importam mais do que um transfer genérico.', ['Cobertura de 4h, 6h, 8h e dia inteiro', 'Rota flexível e tempo de espera', 'Uso executivo e de lazer']],
          ['Experiência', 'Tours privados curados', 'Saona, dias de iate, pesca, buggy e planos personalizados entram no mesmo fluxo premium em vez de parecer um extra improvisado.', ['Posicionamento Saona e dia de costa', 'Itinerário privado à medida', 'Transporte de luxo incluído']],
          ['Upgrade', 'Concierge e extras premium', 'Celebrações, ambientação de boas-vindas, flores, assistência de anfitrião e toques dominicanos locais dentro da mesma arquitetura de reserva.', ['Champagne, flores e sinalização', 'Fast-track e assistência de anfitrião', 'Famílias e ocasiões especiais']]
        ],
        experience: [
          ['Atmosfera a bordo', 'Champagne, água fria, flores, sinalização e outros extras devem parecer intencionais, não improvisados.'],
          ['Concierge pré-chegada', 'Coordenação do hotel, horário da rota, suporte de aeroporto e pedidos especiais devem aparecer como parte do valor do serviço.'],
          ['Fluxo família e celebrações', 'Cadeiras infantis, chegadas surpresa, transporte para casamentos e momentos importantes merecem o seu próprio caminho claro.'],
          ['Confiança executiva', 'Para hóspedes de negócios, o site deve passar discrição, fiabilidade e rapidez, não apenas uma estética de luxo.']
        ]
      }
    },
    packages: {
      es: {
        benchmark: {
          eyebrow: 'Referencia de precios',
          title: 'Los paquetes ahora se apoyan en referencias reales de traslados en Punta Cana.',
          lead: 'La lógica del bundle sigue siendo premium, pero la base de transporte ya parte de operadores y corredores que el cliente reconoce.',
          cards: [
            ['Llegadas a resort', '$35 a $39', 'Cap Cana y Bávaro marcan la base limpia antes de extras y de la elección del vehículo premium.'],
            ['SUV premium', '$65 a $110', 'Las combinaciones Black se mueven ahora dentro de la misma banda premium que ya existe en el mercado.'],
            ['Rutas largas', '$69 a $120', 'Uvero Alto y La Romana definen el salto correcto para trayectos más largos.']
          ]
        },
        packages: [
          ['Llegada', 'Llegada Black Signature', 'Recogida en aeropuerto, vehículo Black, Moet a bordo, flores, cartel personalizado y recepción premium desde el primer minuto.', ['Ideal para luna de miel y llegadas de alto valor', 'Primera impresión claramente premium', 'Upsell con margen alto y lógica evidente', 'Cap Cana encaja bien como referencia premium desde unos $65+'], 'Construir este paquete'],
          ['Familia', 'Llegada Family Comfort', 'Van premium, solicitud de silla infantil, apoyo con equipaje y traslado fluido del aeropuerto al resort.', ['Posicionamiento seguro para familias', 'Paquete centrado en comodidad real', 'Mejor que un simple traslado genérico', 'Bávaro y Uvero Alto encajan bien en este nivel'], 'Construir este paquete'],
          ['Ejecutivo', 'Chauffeur con agenda privada', 'Servicio por horas con ruta flexible para huéspedes de negocios, reuniones y desplazamientos privados.', ['Medio día o día completo', 'Válido para uso ejecutivo y leisure', 'Buena lógica para reservas repetidas', 'Capa premium clara por encima del traslado simple'], 'Construir este paquete']
        ],
        addons: [
          ['Moet a bordo', 'Convierte la llegada en una experiencia y no solo en un traslado.', 'Añadir en el configurador'],
          ['Flores y ambientación', 'Muy fuerte para sorpresas, luna de miel y llegadas de celebración.', 'Añadir en el configurador'],
          ['Fast-track y apoyo de host', 'Acerca el servicio al nivel concierge y no solo al transporte.', 'Añadir en el configurador'],
          ['Logística familiar', 'Sillas infantiles y solicitudes prácticas deben poder elegirse sin resolverlo todo manualmente.', 'Añadir en el configurador']
        ]
      },
      it: {
        benchmark: {
          eyebrow: 'Riferimento prezzi',
          title: 'I pacchetti ora si basano su riferimenti reali per i transfer a Punta Cana.',
          lead: 'La logica del bundle resta premium, ma il livello base del trasporto parte da operatori e corridoi che il cliente già riconosce.',
          cards: [
            ['Arrivi resort', '$35 a $39', 'Cap Cana e Bavaro rappresentano la base pulita prima di extra e scelta del veicolo premium.'],
            ['SUV premium', '$65 a $110', 'Le combinazioni Black si muovono ora nella stessa fascia premium già presente sul mercato.'],
            ['Tratte lunghe', '$69 a $120', 'Uvero Alto e La Romana segnano il corretto salto di prezzo per percorrenze più lunghe.']
          ]
        },
        packages: [
          ['Arrivo', 'Arrivo Black Signature', 'Accoglienza in aeroporto, veicolo Black, Moet a bordo, fiori, cartello personalizzato e ricezione premium fin dal primo momento.', ['Ideale per luna di miele e arrivi ad alto valore', 'Prima impressione chiaramente premium', 'Upsell ad alto margine con logica commerciale chiara', 'Cap Cana è una buona corsia premium da circa $65+'], 'Costruisci questo pacchetto'],
          ['Famiglia', 'Arrivo Family Comfort', 'Van premium, richiesta seggiolino, supporto bagagli e trasferimento fluido dall’aeroporto al resort.', ['Posizionamento sicuro per famiglie', 'Pacchetto orientato al comfort reale', 'Meglio di un semplice transfer generico', 'Bavaro e Uvero Alto si adattano bene a questo livello'], 'Costruisci questo pacchetto'],
          ['Executive', 'Chauffeur a agenda privata', 'Servizio a ore con percorso flessibile per ospiti business, meeting e spostamenti privati.', ['Mezza giornata o giornata intera', 'Adatto sia a executive sia leisure', 'Buona logica per prenotazioni ripetute', 'Layer premium chiaro sopra il transfer semplice'], 'Costruisci questo pacchetto']
        ],
        addons: [
          ['Moet a bordo', 'Trasforma l’arrivo in un’esperienza e non in un semplice transfer.', 'Aggiungi nel configuratore'],
          ['Fiori e allestimento', 'Perfetto per arrivi sorpresa, lune di miele e occasioni speciali.', 'Aggiungi nel configuratore'],
          ['Fast-track e assistenza host', 'Avvicina il servizio al livello concierge e non solo al trasporto.', 'Aggiungi nel configuratore'],
          ['Logistica famiglia', 'Seggiolini e richieste pratiche devono essere selezionabili senza gestirle ogni volta a mano.', 'Aggiungi nel configuratore']
        ]
      },
      fr: {
        benchmark: {
          eyebrow: 'Repère tarifaire',
          title: 'Les packages s’appuient désormais sur de vrais repères de transferts à Punta Cana.',
          lead: 'La logique bundle reste premium, mais la base transport part maintenant d’opérateurs et de trajets déjà reconnus par le client.',
          cards: [
            ['Arrivées resort', '35 à 39 $', 'Cap Cana et Bávaro forment la base claire avant extras et choix du véhicule premium.'],
            ['SUV premium', '65 à 110 $', 'Les combinaisons Black se placent désormais dans la même bande premium déjà visible sur le marché.'],
            ['Trajets plus longs', '69 à 120 $', 'Uvero Alto et La Romana définissent la bonne montée en gamme pour les trajets plus longs.']
          ]
        },
        packages: [
          ['Arrivée', 'Arrivée Black Signature', 'Accueil à l’aéroport, véhicule Black, Moet à bord, fleurs, panneau personnalisé et prise en charge premium dès l’arrivée.', ['Idéal pour lune de miel et arrivées à forte valeur', 'Première impression clairement premium', 'Upsell à forte marge avec rôle commercial net', 'Cap Cana fonctionne bien comme repère premium dès environ 65 $+'], 'Construire ce package'],
          ['Famille', 'Arrivée Family Comfort', 'Van premium, demande de siège enfant, gestion des bagages et trajet fluide de l’aéroport au resort.', ['Positionnement rassurant pour les familles', 'Package centré sur le confort réel', 'Mieux qu’un simple transfert générique', 'Bávaro et Uvero Alto s’adaptent bien à ce niveau'], 'Construire ce package'],
          ['Exécutif', 'Chauffeur à agenda privé', 'Service horaire avec itinéraire flexible pour clients business, réunions et déplacements privés.', ['Demi-journée ou journée complète', 'Adapté à l’exécutif comme au loisir', 'Bonne logique pour réservations répétées', 'Couche premium claire au-dessus du transfert simple'], 'Construire ce package']
        ],
        addons: [
          ['Moet à bord', 'Transforme l’arrivée en expérience et pas seulement en transfert.', 'Ajouter dans le configurateur'],
          ['Fleurs et mise en scène', 'Très pertinent pour les surprises, lunes de miel et arrivées de célébration.', 'Ajouter dans le configurateur'],
          ['Fast-track et assistance hôte', 'Rapproche le service du niveau concierge et pas seulement du transport.', 'Ajouter dans le configurateur'],
          ['Logistique famille', 'Les sièges enfant et demandes pratiques doivent être sélectionnables sans traitement manuel à chaque fois.', 'Ajouter dans le configurateur']
        ]
      },
      de: {
        benchmark: {
          eyebrow: 'Preisreferenz',
          title: 'Die Pakete basieren jetzt auf echten Transfer-Referenzen für Punta Cana.',
          lead: 'Die Bundle-Logik bleibt premium, doch die Transportbasis startet jetzt bei Anbietern und Korridoren, die der Kunde bereits kennt.',
          cards: [
            ['Resort-Ankünfte', '35 bis 39 $', 'Cap Cana und Bávaro bilden die saubere Basis vor Extras und der Wahl des Premium-Fahrzeugs.'],
            ['Premium-SUV', '65 bis 110 $', 'Black-Kombinationen bewegen sich nun in derselben Premium-Spanne, die der Markt bereits kennt.'],
            ['Längere Strecken', '69 bis 120 $', 'Uvero Alto und La Romana markieren den richtigen Sprung für längere Fahrten.']
          ]
        },
        packages: [
          ['Ankunft', 'Black Signature Arrival', 'Abholung am Flughafen, Black-Fahrzeug, Moet an Bord, Blumen, personalisiertes Schild und Premium-Empfang vom ersten Moment an.', ['Ideal für Honeymoon und hochwertige Ankünfte', 'Klar premium als erster Eindruck', 'Upsell mit hoher Marge und klarer Rolle', 'Cap Cana passt gut als Premium-Referenz ab etwa 65 $+'], 'Dieses Paket konfigurieren'],
          ['Familie', 'Family Comfort Arrival', 'Premium-Van, Kindersitz-Anfrage, Gepäckhilfe und ruhiger Transfer vom Flughafen zum Resort.', ['Sichere Positionierung für Familien', 'Paket mit echtem Komfortfokus', 'Besser als ein generischer Standardtransfer', 'Bávaro und Uvero Alto passen gut zu dieser Stufe'], 'Dieses Paket konfigurieren'],
          ['Executive', 'Private Schedule Chauffeur', 'Stundenbasierter Service mit flexibler Route für Business-Gäste, Meetings und private Fahrten.', ['Halbtags oder ganztags', 'Geeignet für Executive und Leisure', 'Sinnvolle Logik für Wiederholungsbuchungen', 'Klare Premium-Schicht über dem einfachen Transfer'], 'Dieses Paket konfigurieren']
        ],
        addons: [
          ['Moet an Bord', 'Macht die Ankunft zu einem Erlebnis und nicht nur zu einem Transfer.', 'Im Konfigurator hinzufügen'],
          ['Blumen und Inszenierung', 'Stark für Überraschungen, Honeymoon und besondere Ankünfte.', 'Im Konfigurator hinzufügen'],
          ['Fast-track und Host-Service', 'Rückt den Service näher an Concierge als nur an reinen Transport.', 'Im Konfigurator hinzufügen'],
          ['Familienlogistik', 'Kindersitze und praktische Wünsche sollen wählbar sein, statt jedes Mal manuell geklärt zu werden.', 'Im Konfigurator hinzufügen']
        ]
      },
      pt: {
        benchmark: {
          eyebrow: 'Referência de preços',
          title: 'Os pacotes agora assentam em referências reais de transfer em Punta Cana.',
          lead: 'A lógica do bundle continua premium, mas a base de transporte parte agora de operadores e corredores que o cliente já reconhece.',
          cards: [
            ['Chegadas em resort', '$35 a $39', 'Cap Cana e Bávaro são a base limpa antes de extras e da escolha do veículo premium.'],
            ['SUV premium', '$65 a $110', 'As combinações Black entram agora na mesma faixa premium já presente no mercado.'],
            ['Rotas longas', '$69 a $120', 'Uvero Alto e La Romana definem o salto certo para percursos mais longos.']
          ]
        },
        packages: [
          ['Chegada', 'Chegada Black Signature', 'Receção no aeroporto, veículo Black, Moet a bordo, flores, placa personalizada e acolhimento premium desde o primeiro minuto.', ['Ideal para lua de mel e chegadas de alto valor', 'Primeira impressão claramente premium', 'Upsell com margem alta e função comercial clara', 'Cap Cana encaixa bem como referência premium a partir de cerca de $65+'], 'Construir este pacote'],
          ['Família', 'Chegada Family Comfort', 'Van premium, pedido de cadeira infantil, apoio com bagagem e trajeto suave do aeroporto ao resort.', ['Posicionamento seguro para famílias', 'Pacote centrado em conforto real', 'Melhor do que um transfer genérico', 'Bávaro e Uvero Alto encaixam bem neste nível'], 'Construir este pacote'],
          ['Executivo', 'Chauffeur com agenda privada', 'Serviço por horas com rota flexível para hóspedes de negócios, reuniões e deslocações privadas.', ['Meio dia ou dia inteiro', 'Válido para uso executivo e lazer', 'Boa lógica para reservas repetidas', 'Camada premium clara acima do transfer simples'], 'Construir este pacote']
        ],
        addons: [
          ['Moet a bordo', 'Transforma a chegada numa experiência e não apenas num transfer.', 'Adicionar no configurador'],
          ['Flores e ambientação', 'Muito forte para surpresas, luas de mel e chegadas de celebração.', 'Adicionar no configurador'],
          ['Fast-track e apoio de host', 'Leva o serviço para mais perto do nível concierge e não apenas do transporte.', 'Adicionar no configurador'],
          ['Logística familiar', 'Cadeiras infantis e pedidos práticos devem ser selecionáveis sem depender sempre de gestão manual.', 'Adicionar no configurador']
        ]
      }
    },
    fleet: {
      es: {
        benchmark: {
          eyebrow: 'Benchmark de corredores',
          title: 'Los niveles de flota ahora se alinean con los mismos corredores de aeropuerto que el cliente ya vende.',
          lead: 'La página de flota debe mostrar dónde empieza la ruta base, dónde empieza el salto premium y qué vehículo encaja en cada solicitud.',
          cards: [
            ['Cap Cana', 'Desde $35', 'Ancla principal para llegadas directas a resort.'],
            ['Bávaro', 'Desde $39', 'Ruta central de resort donde importan confort y equipaje.'],
            ['Uvero Alto', 'Desde $69', 'Corredor más largo donde tiene sentido subir a una van o a un SUV premium.'],
            ['La Romana', 'Desde $120', 'Ruta de larga distancia donde el premium debe justificarse con claridad.'],
            ['SUV premium', '$65 a $110', 'Rango de referencia usado para combinaciones Black Signature.']
          ]
        },
        tiers: [
          ['SUV ejecutivo', 'Llegada premium ágil', 'Para parejas, ejecutivos y huéspedes que quieren un traslado premium sin necesitar una configuración mayor.', ['2-4 huéspedes', 'Enfoque en traslados de aeropuerto y ciudad', 'Opción base fuerte para rutas premium directas'], 'Elegir SUV en el configurador'],
          ['Van de lujo', 'Comodidad familiar y de grupo', 'Para reservas familiares, grupos de boda y desplazamientos amplios donde el confort y el equipaje pesan más.', ['5-8 huéspedes', 'Buen encaje para silla infantil y equipaje', 'Base ideal para upsells de concierge'], 'Elegir van en el configurador'],
          ['Black Signature', 'Llegada VIP de alta presencia', 'Para el huésped que quiere que el vehículo también forme parte del producto VIP.', ['Presentación de lujo desde el primer vistazo', 'Ideal para celebraciones o reservas de alto perfil', 'Ancla del paquete con mayor margen'], 'Elegir Black Signature']
        ],
        routes: [
          ['Aeropuerto', 'Llegadas directas a Cap Cana', 'El corredor premium más limpio para construir confianza en el precio y activar upsells Black Signature.', 'Abrir ruta Cap Cana'],
          ['Resort', 'Traslados a resort en Bávaro', 'Tráfico central de resort donde la imagen de llegada, la comodidad del equipaje y la logística infantil influyen en la venta.', 'Abrir ruta Bávaro'],
          ['Ruta larga', 'Corredor premium Uvero Alto', 'Trayecto más largo desde el aeropuerto donde la clase del vehículo y el nivel de servicio deben justificar el precio.', 'Abrir ruta Uvero Alto'],
          ['Distancia', 'La Romana y traslados de larga distancia', 'Posicionamiento high-touch para recorridos largos donde la presentación premium debe sentirse intencional.', 'Abrir ruta La Romana']
        ]
      },
      it: {
        benchmark: {
          eyebrow: 'Benchmark corridoi',
          title: 'I livelli di flotta ora si allineano agli stessi corridoi aeroportuali che il cliente vende già.',
          lead: 'La pagina flotta deve mostrare dove parte la tratta base, dove inizia il salto premium e quale veicolo si adatta a ciascuna richiesta.',
          cards: [
            ['Cap Cana', 'Da $35', 'Ancoraggio principale per arrivi resort diretti.'],
            ['Bavaro', 'Da $39', 'Tratta resort centrale dove comfort e bagagli contano.'],
            ['Uvero Alto', 'Da $69', 'Corridoio più lungo dove ha senso passare a van o SUV premium.'],
            ['La Romana', 'Da $120', 'Tratta lunga dove il premium deve essere giustificato chiaramente.'],
            ['SUV premium', '$65 a $110', 'Fascia benchmark usata per le combinazioni Black Signature.']
          ]
        },
        tiers: [
          ['SUV executive', 'Arrivo premium rapido', 'Per coppie, ospiti executive e clienti che vogliono un transfer premium senza una configurazione più grande.', ['2-4 ospiti', 'Focus su trasferimenti da aeroporto e città', 'Scelta forte per tratte premium dirette'], 'Scegli SUV nel configuratore'],
          ['Van di lusso', 'Comfort per famiglie e gruppi', 'Per prenotazioni family, gruppi wedding e spostamenti più ampi dove comfort e bagagli pesano di più.', ['5-8 ospiti', 'Ottimo fit per seggiolino e bagagli', 'Base ideale per upsell concierge'], 'Scegli van nel configuratore'],
          ['Black Signature', 'Arrivo VIP ad alta visibilità', 'Per l’ospite che vuole che il veicolo faccia parte del prodotto VIP.', ['Presentazione di lusso fin dal primo sguardo', 'Ideale per celebrazioni o prenotazioni di alto profilo', 'Ancoraggio del pacchetto a margine più alto'], 'Scegli Black Signature']
        ],
        routes: [
          ['Aeroporto', 'Arrivi diretti a Cap Cana', 'Il corridoio premium più pulito per costruire fiducia sul prezzo e attivare gli upsell Black Signature.', 'Apri tratta Cap Cana'],
          ['Resort', 'Transfer resort Bavaro', 'Traffico resort centrale dove immagine di arrivo, comfort bagagli e logistica bambini contano commercialmente.', 'Apri tratta Bavaro'],
          ['Tratta lunga', 'Corridoio premium Uvero Alto', 'Percorso aeroportuale più lungo in cui classe del veicolo e livello di servizio devono giustificare bene il prezzo.', 'Apri tratta Uvero Alto'],
          ['Distanza', 'La Romana e transfer a lunga percorrenza', 'Posizionamento high-touch per distanze lunghe dove la presentazione premium deve sembrare intenzionale.', 'Apri tratta La Romana']
        ]
      },
      fr: {
        benchmark: {
          eyebrow: 'Benchmark des corridors',
          title: 'Les niveaux de flotte s’alignent désormais sur les mêmes corridors aéroportuaires que le client vend déjà.',
          lead: 'La page flotte doit montrer où commence le trajet de base, où débute la montée premium et quel véhicule correspond à chaque demande.',
          cards: [
            ['Cap Cana', 'À partir de 35 $', 'Ancrage principal pour les arrivées directes vers les resorts.'],
            ['Bávaro', 'À partir de 39 $', 'Trajet resort central où confort et bagages comptent.'],
            ['Uvero Alto', 'À partir de 69 $', 'Corridor plus long où passer à une van ou à un SUV premium devient pertinent.'],
            ['La Romana', 'À partir de 120 $', 'Trajet longue distance où le premium doit être justifié clairement.'],
            ['SUV premium', '65 à 110 $', 'Fourchette de référence utilisée pour Black Signature.']
          ]
        },
        tiers: [
          ['SUV exécutif', 'Arrivée premium rapide', 'Pour couples, cadres et clients qui veulent un transfert premium sans dispositif plus grand.', ['2-4 invités', 'Accent sur les trajets aéroport et ville', 'Base solide pour les routes premium directes'], 'Choisir le SUV dans le configurateur'],
          ['Van de luxe', 'Confort famille et groupe', 'Pour réservations famille, groupes de mariage et déplacements plus larges où le confort et les bagages priment.', ['5-8 invités', 'Bon choix pour siège enfant et bagages', 'Excellente base pour les upsells concierge'], 'Choisir la van dans le configurateur'],
          ['Black Signature', 'Arrivée VIP très visible', 'Pour le client qui veut que le véhicule fasse lui aussi partie du produit VIP.', ['Présentation luxe dès le premier regard', 'Idéal pour célébrations ou réservations à fort statut', 'Ancre du package à plus forte marge'], 'Choisir Black Signature']
        ],
        routes: [
          ['Aéroport', 'Arrivées directes à Cap Cana', 'Le corridor premium le plus net pour installer la confiance sur le prix et lancer les upsells Black Signature.', 'Ouvrir le trajet Cap Cana'],
          ['Resort', 'Transferts resort à Bávaro', 'Trafic resort central où image d’arrivée, confort bagages et logistique enfant comptent commercialement.', 'Ouvrir le trajet Bávaro'],
          ['Long trajet', 'Corridor premium Uvero Alto', 'Trajet aéroport plus long où la classe du véhicule et le niveau de service doivent justifier clairement le prix.', 'Ouvrir le trajet Uvero Alto'],
          ['Distance', 'La Romana et transferts longue distance', 'Positionnement high-touch pour les longues distances où la présentation premium doit sembler volontaire.', 'Ouvrir le trajet La Romana']
        ]
      },
      de: {
        benchmark: {
          eyebrow: 'Korridor-Benchmark',
          title: 'Die Flottenstufen orientieren sich jetzt an denselben Airport-Korridoren, die der Kunde bereits verkauft.',
          lead: 'Die Flottenseite sollte zeigen, wo die Basisroute beginnt, wo der Premium-Aufschlag startet und welches Fahrzeug zu welcher Anfrage passt.',
          cards: [
            ['Cap Cana', 'Ab 35 $', 'Wichtiger Anker für direkte Resort-Ankünfte.'],
            ['Bávaro', 'Ab 39 $', 'Zentrale Resort-Route, auf der Komfort und Gepäck zählen.'],
            ['Uvero Alto', 'Ab 69 $', 'Längerer Korridor, bei dem Van oder Premium-SUV sinnvoll werden.'],
            ['La Romana', 'Ab 120 $', 'Fernroute, bei der das Premium klar begründet werden muss.'],
            ['Premium-SUV', '65 bis 110 $', 'Referenzspanne für Black-Signature-Kombinationen.']
          ]
        },
        tiers: [
          ['Executive SUV', 'Schnelle Premium-Ankunft', 'Für Paare, Business-Gäste und Reisende, die Premium wollen, ohne eine größere Konfiguration zu brauchen.', ['2-4 Gäste', 'Schwerpunkt auf Airport- und Stadttransfers', 'Starke Standardwahl für direkte Premium-Routen'], 'SUV im Konfigurator wählen'],
          ['Luxus-Van', 'Komfort für Familien und Gruppen', 'Für Familienbuchungen, Hochzeitsgruppen und größere Bewegungen, bei denen Komfort und Gepäck wichtiger sind.', ['5-8 Gäste', 'Gute Wahl für Kindersitz und Gepäck', 'Beste Basis für Concierge-Upsells'], 'Van im Konfigurator wählen'],
          ['Black Signature', 'VIP-Ankunft mit starker Wirkung', 'Für Gäste, die möchten, dass das Fahrzeug selbst Teil des VIP-Produkts wird.', ['Luxuswirkung auf den ersten Blick', 'Ideal für Feiern oder statusbetonte Buchungen', 'Anker des margenstärksten Pakets'], 'Black Signature wählen']
        ],
        routes: [
          ['Airport', 'Direkte Ankünfte in Cap Cana', 'Der sauberste Premium-Korridor, um Preisvertrauen aufzubauen und Black-Signature-Upsells einzuleiten.', 'Cap-Cana-Route öffnen'],
          ['Resort', 'Resort-Transfers nach Bávaro', 'Wichtiger Resort-Verkehr, bei dem Ankunftsbild, Gepäckkomfort und Kindersitz-Logistik kommerziell relevant sind.', 'Bávaro-Route öffnen'],
          ['Lange Route', 'Premium-Korridor Uvero Alto', 'Längere Airport-Route, bei der Fahrzeugklasse und Service-Level den Preis klar begründen müssen.', 'Uvero-Alto-Route öffnen'],
          ['Distanz', 'La Romana und Ferntransfers', 'High-touch-Positionierung für lange Strecken, bei der die Premium-Präsentation bewusst gewählt wirken muss.', 'La-Romana-Route öffnen']
        ]
      },
      pt: {
        benchmark: {
          eyebrow: 'Benchmark de corredores',
          title: 'Os níveis da frota agora alinham-se com os mesmos corredores de aeroporto que o cliente já vende.',
          lead: 'A página da frota deve mostrar onde começa a rota base, onde começa o salto premium e qual veículo encaixa em cada pedido.',
          cards: [
            ['Cap Cana', 'A partir de $35', 'Âncora principal para chegadas diretas a resort.'],
            ['Bávaro', 'A partir de $39', 'Rota central de resort onde conforto e bagagem contam.'],
            ['Uvero Alto', 'A partir de $69', 'Corredor mais longo onde faz sentido subir para van ou SUV premium.'],
            ['La Romana', 'A partir de $120', 'Rota de longa distância onde o premium deve ser justificado com clareza.'],
            ['SUV premium', '$65 a $110', 'Faixa de referência usada para combinações Black Signature.']
          ]
        },
        tiers: [
          ['SUV executivo', 'Chegada premium rápida', 'Para casais, executivos e hóspedes que querem um transfer premium sem precisar de uma configuração maior.', ['2-4 hóspedes', 'Foco em trajetos de aeroporto e cidade', 'Escolha-base forte para rotas premium diretas'], 'Escolher SUV no configurador'],
          ['Van de luxo', 'Conforto familiar e de grupo', 'Para reservas de família, grupos de casamento e deslocações maiores onde conforto e bagagem pesam mais.', ['5-8 hóspedes', 'Bom encaixe para cadeira infantil e bagagem', 'Melhor base para upsells de concierge'], 'Escolher van no configurador'],
          ['Black Signature', 'Chegada VIP de forte presença', 'Para o hóspede que quer que o veículo também faça parte do produto VIP.', ['Apresentação de luxo desde o primeiro olhar', 'Ideal para celebrações ou reservas de alto estatuto', 'Âncora do pacote com maior margem'], 'Escolher Black Signature']
        ],
        routes: [
          ['Aeroporto', 'Chegadas diretas a Cap Cana', 'O corredor premium mais limpo para construir confiança no preço e ativar upsells Black Signature.', 'Abrir rota Cap Cana'],
          ['Resort', 'Transfers de resort em Bávaro', 'Tráfego central de resort onde imagem de chegada, conforto da bagagem e logística infantil contam comercialmente.', 'Abrir rota Bávaro'],
          ['Rota longa', 'Corredor premium Uvero Alto', 'Trajeto mais longo a partir do aeroporto em que a classe do veículo e o nível do serviço precisam justificar o preço.', 'Abrir rota Uvero Alto'],
          ['Distância', 'La Romana e transfers de longa distância', 'Posicionamento high-touch para percursos longos onde a apresentação premium deve parecer intencional.', 'Abrir rota La Romana']
        ]
      }
    },
    booking: {
      es: {
        benchmark: {
          eyebrow: 'Ancla de precios del configurador',
          title: 'El configurador ahora arranca con los mismos números de ruta que el cliente ya usa en el mercado.',
          lead: 'La categoría del vehículo, el paquete, el horario y los extras empujan el precio hacia arriba. No sustituyen la lógica base de la ruta.',
          cards: [
            ['Cap Cana', 'Desde $35', 'Transfer base antes del uplift premium.'],
            ['Bávaro', 'Desde $39', 'Ruta principal de resort dentro del configurador.'],
            ['Uvero Alto', 'Desde $69', 'Corredor más largo con más sensibilidad al vehículo.'],
            ['La Romana', 'Desde $120', 'Ruta de mayor distancia donde el paquete premium pesa más.']
          ]
        },
        labels: {
          builder: ['1. Selecciona servicio', '2. Ruta o destino', '3. Categoría del vehículo', '4. Nivel del paquete', '5. Selecciona extras premium y toques locales', 'Huéspedes', 'Horario', 'Notas especiales'],
          builderNotes: [['Capa de upsell', 'Extras premium seleccionables, ambientaciones de cumpleaños y toques dominicanos locales'], ['Capa de confianza', 'Resumen legible antes del paso al equipo'], ['Capa comercial', 'Preparado para email, WhatsApp y confirmaciones tras el pago']],
          topline: [['Lógica por pasos', 'Construir, guardar y luego solicitar'], ['Control del huésped', 'Las selecciones siguen visibles antes del paso al equipo'], ['Caso de uso', 'Un solo viaje o un itinerario premium con varias paradas']],
          notification: [['Después del pago', 'El cliente recibe confirmación por email y WhatsApp'], ['Despacho operativo', 'Conductor o coordinador recibe el resumen por email y WhatsApp']],
          summaryLabel: 'Resumen en tiempo real de la propuesta',
          estimated: 'Total estimado',
          addToCart: 'Añadir al itinerario',
          requestEmail: 'Solicitar por email',
          sendWhatsapp: 'Enviar por WhatsApp',
          viewFlow: 'Ver flujo de confirmación',
          cartLabel: 'Carrito de itinerario premium',
          items: 'Items',
          itineraryLead: 'Usa este carrito para preparar más de una solicitud premium antes de enviar el resumen final.',
          clear: 'Vaciar itinerario',
          sendFullEmail: 'Enviar itinerario completo por email',
          sendFullWhatsapp: 'Enviar itinerario completo por WhatsApp',
          emptyTitle: 'Crea la primera experiencia premium',
          emptyLead: 'Añade un transfer, un servicio de celebración o un extra premium para empezar a definir el itinerario.'
        }
      },
      it: {
        benchmark: {
          eyebrow: 'Ancoraggio prezzi configuratore',
          title: 'Il configuratore parte dagli stessi prezzi di tratta che il cliente usa gia sul mercato.',
          lead: 'Categoria veicolo, livello del pacchetto, fascia oraria ed extra fanno salire il prezzo. Non sostituiscono la logica base della tratta.',
          cards: [
            ['Cap Cana', 'Da $35', 'Transfer base prima dell\'upgrade premium.'],
            ['Bavaro', 'Da $39', 'Tratta resort principale dentro il configuratore.'],
            ['Uvero Alto', 'Da $69', 'Corridoio più lungo con maggiore sensibilità al veicolo.'],
            ['La Romana', 'Da $120', 'Tratta a lunga distanza dove il pacchetto premium incide di più.']
          ]
        },
        labels: {
          builder: ['1. Seleziona servizio', '2. Tratta o destinazione', '3. Categoria veicolo', '4. Livello del pacchetto', '5. Seleziona extra premium e tocchi locali', 'Ospiti', 'Fascia oraria', 'Note speciali'],
          builderNotes: [['Livello upsell', 'Extra premium selezionabili, allestimenti compleanno e tocchi dominicani locali'], ['Livello fiducia', 'Riepilogo leggibile prima del passaggio al team'], ['Livello commerciale', 'Pronto per email, WhatsApp e conferme dopo il pagamento']],
          topline: [['Logica del percorso', 'Costruisci, salva e poi invia la richiesta'], ['Controllo ospite', 'Le selezioni restano visibili prima del passaggio al team'], ['Caso d\'uso', 'Singola corsa o itinerario premium con più tappe']],
          notification: [['Dopo il pagamento', 'Il cliente riceve conferma via email e WhatsApp'], ['Brief operativo', 'Autista o coordinatore riceve il riepilogo via email e WhatsApp']],
          summaryLabel: 'Riepilogo in tempo reale della proposta',
          estimated: 'Totale stimato',
          addToCart: 'Aggiungi all\'itinerario',
          requestEmail: 'Invia richiesta via email',
          sendWhatsapp: 'Invia su WhatsApp',
          viewFlow: 'Vedi flusso di conferma',
          cartLabel: 'Carrello itinerario premium',
          items: 'Elementi',
          itineraryLead: 'Usa questo carrello per preparare più di una richiesta premium prima di inviare il riepilogo finale.',
          clear: 'Svuota itinerario',
          sendFullEmail: 'Invia itinerario completo via email',
          sendFullWhatsapp: 'Invia itinerario completo su WhatsApp',
          emptyTitle: 'Costruisci la prima esperienza premium',
          emptyLead: 'Aggiungi un transfer, un servizio per celebrazioni o un extra premium per iniziare a definire l\'itinerario.'
        }
      },
      fr: {
        benchmark: {
          eyebrow: 'Ancrage tarifaire du configurateur',
          title: 'Le configurateur démarre maintenant sur les mêmes prix de trajet que le client utilise déjà sur le marché.',
          lead: 'La catégorie de véhicule, le niveau de forfait, le créneau horaire et les extras font monter le prix. Ils ne remplacent pas la logique de base du trajet.',
          cards: [
            ['Cap Cana', 'À partir de 35 $', 'Transfert de base avant montée en gamme premium.'],
            ['Bávaro', 'À partir de 39 $', 'Trajet resort principal dans le configurateur.'],
            ['Uvero Alto', 'À partir de 69 $', 'Couloir plus long avec plus de sensibilité au véhicule.'],
            ['La Romana', 'À partir de 120 $', 'Trajet longue distance où le forfait premium compte davantage.']
          ]
        },
        labels: {
          builder: ['1. Sélectionnez le service', '2. Trajet ou destination', '3. Catégorie de véhicule', '4. Niveau du forfait', '5. Sélectionnez les extras premium et touches locales', 'Clients', 'Créneau horaire', 'Notes spéciales'],
          builderNotes: [['Couche montée en gamme', 'Extras premium sélectionnables, mises en scène d\'anniversaire et touches dominicaines locales'], ['Couche confiance', 'Résumé lisible avant le relais vers l\'équipe'], ['Couche commerciale', 'Prêt pour email, WhatsApp et confirmations après paiement']],
          topline: [['Logique des étapes', 'Construire, enregistrer puis envoyer la demande'], ['Contrôle du client', 'Les sélections restent visibles avant le relais vers l\'équipe'], ['Cas d\'usage', 'Un seul trajet ou un itinéraire premium avec plusieurs étapes']],
          notification: [['Après paiement', 'Le client reçoit une confirmation par email et WhatsApp'], ['Brief opérationnel', 'Le chauffeur ou le coordinateur reçoit le résumé par email et WhatsApp']],
          summaryLabel: 'Résumé en direct de la demande',
          estimated: 'Total estimé',
          addToCart: 'Ajouter à l\'itinéraire',
          requestEmail: 'Envoyer la demande par email',
          sendWhatsapp: 'Envoyer sur WhatsApp',
          viewFlow: 'Voir le parcours de confirmation',
          cartLabel: 'Panier itinéraire premium',
          items: 'Éléments',
          itineraryLead: 'Utilisez ce panier pour préparer plus d\'une demande premium avant d\'envoyer le récapitulatif final.',
          clear: 'Vider l\'itinéraire',
          sendFullEmail: 'Envoyer l\'itinéraire complet par email',
          sendFullWhatsapp: 'Envoyer l\'itinéraire complet sur WhatsApp',
          emptyTitle: 'Construisez la première expérience premium',
          emptyLead: 'Ajoutez un transfert, un service de célébration ou un extra premium pour commencer à façonner l\'itinéraire.'
        }
      },
      de: {
        benchmark: {
          eyebrow: 'Preisanker des Konfigurators',
          title: 'Der Konfigurator startet mit denselben Streckenwerten, die der Gast bereits am Markt kennt.',
          lead: 'Fahrzeugkategorie, Paket, Zeitfenster und Extras erhöhen den Preis. Sie ersetzen nicht die Grundlogik der Strecke.',
          cards: [
            ['Cap Cana', 'Ab 35 $', 'Basis-Transfer vor dem Premium-Aufschlag.'],
            ['Bávaro', 'Ab 39 $', 'Wichtige Resort-Strecke im Konfigurator.'],
            ['Uvero Alto', 'Ab 69 $', 'Längerer Korridor mit stärkerer Fahrzeugsensitivität.'],
            ['La Romana', 'Ab 120 $', 'Fernroute, bei der das Premium-Paket stärker zählt.']
          ]
        },
        labels: {
          builder: ['1. Service wählen', '2. Strecke oder Ziel', '3. Fahrzeugkategorie', '4. Paketstufe', '5. Premium-Extras und lokale Akzente wählen', 'Gäste', 'Zeitfenster', 'Besondere Hinweise'],
          builderNotes: [['Upsell-Ebene', 'Wählbare Premium-Extras, Geburtstags-Arrangements und lokale dominikanische Akzente'], ['Vertrauensebene', 'Gut lesbare Zusammenfassung vor der Übergabe'], ['Vertriebsebene', 'Bereit für E-Mail, WhatsApp und Bestätigungen nach der Zahlung']],
          topline: [['Schrittlogik', 'Zusammenstellen, speichern, dann anfragen'], ['Gastkontrolle', 'Auswahlen bleiben vor der Übergabe sichtbar'], ['Einsatzfall', 'Einzelfahrt oder Premium-Reiseplan mit mehreren Stopps']],
          notification: [['Nach Zahlung', 'Der Gast erhält die Bestätigung per E-Mail und WhatsApp'], ['Operative Disposition', 'Fahrer oder Koordinator erhält das Briefing per E-Mail und WhatsApp']],
          summaryLabel: 'Anfragezusammenfassung in Echtzeit',
          estimated: 'Geschätzte Summe',
          addToCart: 'Zum Reiseplan hinzufügen',
          requestEmail: 'Per E-Mail anfragen',
          sendWhatsapp: 'Per WhatsApp senden',
          viewFlow: 'Bestätigungsfluss ansehen',
          cartLabel: 'Premium-Reiseplan',
          items: 'Positionen',
          itineraryLead: 'Nutze diesen Reiseplan, um mehr als eine Premium-Anfrage vorzubereiten, bevor die finale Zusammenfassung gesendet wird.',
          clear: 'Reiseplan leeren',
          sendFullEmail: 'Gesamten Reiseplan per E-Mail senden',
          sendFullWhatsapp: 'Gesamten Reiseplan per WhatsApp senden',
          emptyTitle: 'Erstes Premium-Erlebnis zusammenstellen',
          emptyLead: 'Füge einen Transfer, einen Feier-Service oder ein Premium-Extra hinzu, um den Reiseplan aufzubauen.'
        }
      },
      pt: {
        benchmark: {
          eyebrow: 'Âncora de preços do configurador',
          title: 'O configurador agora começa com os mesmos valores de rota que o cliente já pratica no mercado.',
          lead: 'Categoria do veículo, pacote, horário e extras fazem subir o preço. Não substituem a lógica base da rota.',
          cards: [
            ['Cap Cana', 'A partir de $35', 'Transfer base antes do reforço premium.'],
            ['Bávaro', 'A partir de $39', 'Rota principal de resort dentro do configurador.'],
            ['Uvero Alto', 'A partir de $69', 'Corredor mais longo com maior sensibilidade ao veículo.'],
            ['La Romana', 'A partir de $120', 'Rota de maior distância onde o pacote premium pesa mais.']
          ]
        },
        labels: {
          builder: ['1. Selecionar serviço', '2. Rota ou destino', '3. Categoria do veículo', '4. Nível do pacote', '5. Selecionar extras premium e toques locais', 'Hóspedes', 'Horário', 'Notas especiais'],
          builderNotes: [['Camada de upsell', 'Extras premium selecionáveis, ambientações de aniversário e toques dominicanos locais'], ['Camada de confiança', 'Resumo legível antes da passagem para a equipa'], ['Camada comercial', 'Pronto para email, WhatsApp e confirmações após o pagamento']],
          topline: [['Lógica por etapas', 'Construir, guardar e depois enviar o pedido'], ['Controlo do hóspede', 'As seleções continuam visíveis antes da passagem para a equipa'], ['Caso de uso', 'Uma única viagem ou um itinerário premium com várias paragens']],
          notification: [['Depois do pagamento', 'O cliente recebe confirmação por email e WhatsApp'], ['Despacho operacional', 'Motorista ou coordenador recebe o resumo por email e WhatsApp']],
          summaryLabel: 'Resumo em tempo real da proposta',
          estimated: 'Total estimado',
          addToCart: 'Adicionar ao itinerário',
          requestEmail: 'Pedir por email',
          sendWhatsapp: 'Enviar por WhatsApp',
          viewFlow: 'Ver fluxo de confirmação',
          cartLabel: 'Carrinho de itinerário premium',
          items: 'Itens',
          itineraryLead: 'Use este carrinho para preparar mais de um pedido premium antes de enviar o resumo final.',
          clear: 'Limpar itinerário',
          sendFullEmail: 'Enviar itinerário completo por email',
          sendFullWhatsapp: 'Enviar itinerário completo por WhatsApp',
          emptyTitle: 'Construa a primeira experiência premium',
          emptyLead: 'Adicione um transfer, um serviço de celebração ou um extra premium para começar a montar o itinerário.'
        }
      }
    },
    ops: {
      es: {
        flow: [
          ['Paso 1', 'El huésped construye la solicitud', 'Servicio, ruta, vehículo, horario y extras se agrupan en una sola solicitud clara antes del paso al concierge.'],
          ['Paso 2', 'La solicitud se enruta de inmediato', 'La misma solicitud puede llegar a WhatsApp y email al mismo tiempo para no depender de un canal frágil.'],
          ['Paso 3', 'El negocio recibe un resumen ordenado', 'El resumen debe seguir siendo legible: sin extras perdidos, sin rutas incompletas y sin notas vagas.'],
          ['Paso 4', 'Después del pago todos quedan avisados', 'Email del cliente, WhatsApp del cliente, email del operador y WhatsApp del operador deben salir de la misma reserva confirmada.']
        ],
        channels: [
          ['WhatsApp', 'Paso rápido al concierge', 'El mensaje debe llegar precompletado con ruta, vehículo, paquete y extras para que la conversación siga sin fricción.'],
          ['Email', 'Resumen estructurado para cliente y operador', 'La bandeja del negocio y la del operador deben recibir el mismo resumen con ruta, horario, notas, extras y estado del pago.'],
          ['Vista compartida', 'Visibilidad simple para el equipo', 'Incluso con una configuración ligera, una vista compartida puede mantener visible el historial, los datos y el estado sin infraestructura pesada.']
        ],
        payments: [
          ['Email cliente', 'Resumen de la reserva pagada con todos los extras seleccionados', 'El cliente debe recibir un email claro con servicio, ruta, horario, vehículo, extras, estado del pago y siguiente paso.'],
          ['Email operador', 'El conductor o responsable del servicio recibe el mismo detalle pagado', 'El operador asignado debe recibir el resumen completo apenas entra el pago, sin copiar a mano.'],
          ['WhatsApp cliente', 'Confirmación rápida en el canal nativo del huésped', 'WhatsApp debe confirmar el pago, resumir la solicitud y dejar abierta la conversación.'],
          ['WhatsApp conductor', 'Despacho inmediato para quien ejecuta el servicio', 'El conductor o responsable debe recibir un resumen estructurado con código, ruta, nombre, extras de ocasión y horario.']
        ]
      },
      it: {
        flow: [
          ['Passaggio 1', 'L\'ospite costruisce la richiesta', 'Servizio, tratta, veicolo, fascia oraria ed extra confluiscono in una richiesta pulita prima del passaggio al concierge.'],
          ['Passaggio 2', 'La richiesta viene instradata subito', 'La stessa richiesta può arrivare insieme su WhatsApp ed email senza dipendere da un solo canale fragile.'],
          ['Passaggio 3', 'Il team riceve un riepilogo ordinato', 'Il riepilogo deve restare leggibile: niente extra persi, nessuna tratta mancante e nessuna nota vaga.'],
          ['Passaggio 4', 'Dopo il pagamento tutti vengono avvisati', 'Email cliente, WhatsApp cliente, email operatore e WhatsApp operatore devono nascere dalla stessa prenotazione confermata.']
        ],
        channels: [
          ['WhatsApp', 'Passaggio rapido al concierge', 'Il messaggio deve arrivare precompilato con tratta, veicolo, pacchetto ed extra, così la conversazione continua subito.'],
          ['Email', 'Riepilogo strutturato per cliente e operatore', 'La casella commerciale e quella operativa devono ricevere lo stesso riepilogo con tratta, fascia oraria, note, extra e stato del pagamento.'],
          ['Vista condivisa', 'Visibilità semplice per il team', 'Anche con una configurazione leggera, una vista condivisa può tenere visibili storico richieste, dati e stato senza un backend pesante.']
        ],
        payments: [
          ['Email cliente', 'Riepilogo della prenotazione pagata con tutti gli extra scelti', 'Il cliente deve ricevere un\'email pulita con servizio, tratta, fascia oraria, veicolo, extra, stato del pagamento e prossimo passo.'],
          ['Email operatore', 'Autista o responsabile del servizio riceve lo stesso dettaglio pagato', 'L\'operatore assegnato deve ricevere il riepilogo completo appena entra il pagamento, senza copia manuale.'],
          ['WhatsApp cliente', 'Conferma rapida nel canale naturale del cliente', 'WhatsApp deve confermare il pagamento, riassumere la richiesta e lasciare aperta la conversazione per il coordinamento.'],
          ['WhatsApp autista', 'Invio immediato a chi esegue il servizio', 'L\'autista o il responsabile del servizio deve ricevere un riepilogo strutturato con codice prenotazione, tratta, nome ospite, extra e fascia oraria.']
        ]
      },
      fr: {
        flow: [
          ['Étape 1', 'Le client construit la demande', 'Service, trajet, véhicule, horaire et extras sont regroupés dans une demande claire avant le relais concierge.'],
          ['Étape 2', 'La demande est acheminée immédiatement', 'La même demande peut arriver sur WhatsApp et par email en même temps pour ne pas dépendre d\'un seul canal fragile.'],
          ['Étape 3', 'L\'équipe reçoit un récapitulatif ordonné', 'Le résumé doit rester lisible : aucun extra perdu, aucun trajet manquant et aucune note vague.'],
          ['Étape 4', 'Après paiement tout le monde est notifié', 'Email client, WhatsApp client, email opérateur et WhatsApp opérateur doivent partir de la même réservation confirmée.']
        ],
        channels: [
          ['WhatsApp', 'Relais concierge rapide', 'Le message doit arriver prérempli avec trajet, véhicule, forfait et extras pour garder une conversation fluide.'],
          ['Email', 'Récapitulatif structuré pour le client et l\'opérateur', 'La boîte commerciale et celle de l\'opérateur doivent recevoir le même résumé avec trajet, horaire, notes, extras et statut du paiement.'],
          ['Vue partagée', 'Visibilité simple pour l\'équipe', 'Même avec une configuration légère, une vue partagée peut garder l\'historique, les données et le statut visibles sans back-office lourd.']
        ],
        payments: [
          ['Email client', 'Récapitulatif de réservation payée avec tous les extras choisis', 'Le client doit recevoir un email clair avec service, trajet, horaire, véhicule, extras, statut du paiement et prochaine étape.'],
          ['Email opérateur', 'Chauffeur ou responsable de service reçoit le même détail payé', 'L\'opérateur assigné doit recevoir le récapitulatif complet dès le paiement, sans copie manuelle.'],
          ['WhatsApp client', 'Confirmation rapide dans le canal natif du client', 'WhatsApp doit confirmer le paiement, résumer la demande et garder la conversation ouverte.'],
          ['WhatsApp chauffeur', 'Transmission immédiate pour l\'exécution du service', 'Le chauffeur ou le responsable doit recevoir un résumé structuré avec code, trajet, nom du client, extras d\'occasion et horaire.']
        ]
      },
      de: {
        flow: [
          ['Schritt 1', 'Der Gast erstellt die Anfrage', 'Service, Route, Fahrzeug, Zeitfenster und Extras werden vor der Uebergabe in einer klaren Anfrage gebuendelt.'],
          ['Schritt 2', 'Die Anfrage wird sofort geroutet', 'Dieselbe Anfrage kann gleichzeitig auf WhatsApp und Email ankommen, damit das Business nicht von einem fragilen Kanal abhängt.'],
          ['Schritt 3', 'Das Business erhält eine geordnete Zusammenfassung', 'Die Zusammenfassung muss lesbar bleiben: keine verlorenen Extras, keine fehlenden Routen, keine vagen Notizen.'],
          ['Schritt 4', 'Nach Zahlung werden alle informiert', 'Kunden-Email, Kunden-WhatsApp, Operator-Email und Operator-WhatsApp müssen aus derselben bestätigten Buchung entstehen.']
        ],
        channels: [
          ['WhatsApp', 'Schnelle Concierge-Uebergabe', 'Die Nachricht sollte mit Route, Fahrzeug, Paket und Extras vorausgefuellt ankommen, damit die Konversation direkt weitergeht.'],
          ['Email', 'Strukturierte Zusammenfassung fuer Kunde und Team', 'Business-Postfach und operatives Postfach sollen dieselbe Zusammenfassung mit Route, Zeitfenster, Notizen, Extras und Zahlungsstatus erhalten.'],
          ['Geteilte Uebersicht', 'Einfache Sichtbarkeit fuer das Team', 'Auch mit leichtem Setup kann eine geteilte Uebersicht Historie, Daten und Status sichtbar halten, ohne schweren Backend-Aufwand.']
        ],
        payments: [
          ['Kunden-Email', 'Bezahlte Buchungszusammenfassung mit allen Extras', 'Der Kunde soll eine saubere Email mit Service, Route, Zeitfenster, Fahrzeug, Extras, Zahlungsstatus und naechstem Schritt erhalten.'],
          ['Operator-Email', 'Chauffeur oder Einsatzleitung erhaelt denselben bezahlten Detailstand', 'Der zugewiesene Operator muss die vollstaendige Zusammenfassung direkt nach Zahlung erhalten, ohne manuelles Kopieren.'],
          ['Kunden-WhatsApp', 'Schnelle Bestätigung im nativen Kanal des Gastes', 'WhatsApp soll die Zahlung bestätigen, die Anfrage zusammenfassen und die Konversation offen halten.'],
          ['Chauffeur-WhatsApp', 'Sofortige Weitergabe fuer die Ausfuehrung', 'Der Chauffeur oder die Einsatzleitung soll eine strukturierte Zusammenfassung mit Code, Route, Name, Anlass-Extras und Zeitfenster erhalten.']
        ]
      },
      pt: {
        flow: [
          ['Passo 1', 'O hóspede monta o pedido', 'Serviço, rota, veículo, horário e extras são reunidos num pedido claro antes do encaminhamento para o concierge.'],
          ['Passo 2', 'O pedido é encaminhado de imediato', 'O mesmo pedido pode chegar ao WhatsApp e ao email ao mesmo tempo para não depender de um único canal frágil.'],
          ['Passo 3', 'A equipa recebe um resumo ordenado', 'O resumo deve continuar legível: sem extras perdidos, sem rotas em falta e sem notas vagas.'],
          ['Passo 4', 'Depois do pagamento todos são avisados', 'Email do cliente, WhatsApp do cliente, email do operador e WhatsApp do operador devem sair da mesma reserva confirmada.']
        ],
        channels: [
          ['WhatsApp', 'Encaminhamento rápido para o concierge', 'A mensagem deve chegar pré-preenchida com rota, veículo, pacote e extras para que a conversa continue sem fricção.'],
          ['Email', 'Resumo estruturado para cliente e operador', 'A caixa comercial e a do operador devem receber o mesmo resumo com rota, horário, notas, extras e estado do pagamento.'],
          ['Vista partilhada', 'Visibilidade simples para a equipa', 'Mesmo com uma configuração leve, uma vista partilhada pode manter o histórico, os dados e o estado visíveis sem back-office pesado.']
        ],
        payments: [
          ['Email do cliente', 'Resumo da reserva paga com todos os extras selecionados', 'O cliente deve receber um email claro com serviço, rota, horário, veículo, extras, estado do pagamento e próximo passo.'],
          ['Email do operador', 'Motorista ou responsável de serviço recebe o mesmo detalhe pago', 'O operador designado deve receber o resumo completo assim que o pagamento entra, sem cópia manual.'],
          ['WhatsApp do cliente', 'Confirmação rápida no canal natural do hóspede', 'O WhatsApp deve confirmar o pagamento, resumir o pedido e manter a conversa aberta.'],
          ['WhatsApp do motorista', 'Envio imediato para quem executa o serviço', 'O motorista ou responsável deve receber um resumo estruturado com código, rota, nome do hóspede, extras da ocasião e horário.']
        ]
      }
    }
  };

  function setText(node, value) {
    if (!node || value == null) return;
    if (node.dataset.i18nOriginalText === undefined) {
      node.dataset.i18nOriginalText = node.textContent;
    }
    node.textContent = value;
  }

  function setPlaceholder(node, value) {
    if (!node || value == null) return;
    if (node.dataset.i18nOriginalPlaceholder === undefined) {
      node.dataset.i18nOriginalPlaceholder = node.getAttribute('placeholder') || '';
    }
    node.setAttribute('placeholder', value);
  }

  function decoratePickers() {
    var pickerLabelMap = {
      en: 'Language picker',
      es: 'Selector de idioma',
      it: 'Selettore lingua',
      fr: 'Sélecteur de langue',
      de: 'Sprachauswahl',
      pt: 'Seletor de idioma'
    };
    document.querySelectorAll('.vip-lang-picker').forEach(function (picker) {
      Array.from(picker.options).forEach(function (option) {
        if (pickerLabels[option.value]) {
          option.textContent = pickerLabels[option.value];
        }
      });
      const pickerLang = picker.value || document.documentElement.lang || 'en';
      picker.setAttribute('aria-label', pickerLabelMap[pickerLang] || pickerLabelMap.en);
    });
  }

  function applyExactTextMap(lang) {
    var map = exactTextMap[lang];
    if (!map) return;
    document.querySelectorAll('a, button, span, strong, p, label, li, small, option, h1, h2, h3, h4, h5, h6').forEach(function (node) {
      if (!node || node.children.length > 0) return;
      var text = (node.textContent || '').trim().replace(/\s+/g, ' ');
      if (!text || !map[text]) return;
      setText(node, map[text]);
    });
  }

  function translateBenchmark(section, data) {
    if (!section || !data) return;
    setText(section.querySelector('.section-head .eyebrow'), data.eyebrow);
    setText(section.querySelector('.section-head h2'), data.title);
    setText(section.querySelector('.section-head p:last-of-type'), data.lead);
    var cards = section.querySelectorAll('.benchmark-card');
    data.cards.forEach(function (card, index) {
      var node = cards[index];
      if (!node) return;
      setText(node.querySelector('span'), card[0]);
      setText(node.querySelector('strong'), card[1]);
      setText(node.querySelector('p'), card[2]);
    });
  }

  function applyHome(lang) {
    var data = content.home[lang];
    if (!data) return;
    translateBenchmark(document.querySelector('.vip-home .benchmark-band'), data.benchmark);
    var services = document.querySelectorAll('#services .service-card');
    data.services.forEach(function (card, index) {
      var node = services[index];
      if (!node) return;
      setText(node.querySelector('.service-tag'), card[0]);
      setText(node.querySelector('h3'), card[1]);
      setText(node.querySelector('p'), card[2]);
      var lis = node.querySelectorAll('li');
      card[3].forEach(function (item, itemIndex) { setText(lis[itemIndex], item); });
    });
    var experiences = document.querySelectorAll('.vip-home .experience-grid .experience-card');
    data.experience.forEach(function (card, index) {
      var node = experiences[index];
      if (!node) return;
      setText(node.querySelector('h3'), card[0]);
      setText(node.querySelector('p'), card[1]);
    });
  }

  function applyPackages(lang) {
    var data = content.packages[lang];
    if (!data) return;
    translateBenchmark(document.querySelector('.vip-packages .benchmark-band'), data.benchmark);
    var packageCards = document.querySelectorAll('#packages .signature-card');
    data.packages.forEach(function (card, index) {
      var node = packageCards[index];
      if (!node) return;
      setText(node.querySelector('.service-tag'), card[0]);
      setText(node.querySelector('h3'), card[1]);
      setText(node.querySelector('p'), card[2]);
      var lis = node.querySelectorAll('li');
      card[3].forEach(function (item, itemIndex) { setText(lis[itemIndex], item); });
      setText(node.querySelector('a'), card[4]);
    });
    var addonCards = document.querySelectorAll('#addons .experience-card');
    data.addons.forEach(function (card, index) {
      var node = addonCards[index];
      if (!node) return;
      setText(node.querySelector('h3'), card[0]);
      setText(node.querySelector('p'), card[1]);
      setText(node.querySelector('a'), card[2]);
    });
  }

  function applyFleet(lang) {
    var data = content.fleet[lang];
    if (!data) return;
    translateBenchmark(document.querySelector('.vip-fleet .benchmark-band'), data.benchmark);
    var tierCards = document.querySelectorAll('#tiers .fleet-card');
    data.tiers.forEach(function (card, index) {
      var node = tierCards[index];
      if (!node) return;
      setText(node.querySelector('.fleet-type'), card[0]);
      setText(node.querySelector('h3'), card[1]);
      setText(node.querySelector('p'), card[2]);
      var lis = node.querySelectorAll('li');
      card[3].forEach(function (item, itemIndex) { setText(lis[itemIndex], item); });
      setText(node.querySelector('a'), card[4]);
    });
    var routeCards = document.querySelectorAll('#routes .destination-card');
    data.routes.forEach(function (card, index) {
      var node = routeCards[index];
      if (!node) return;
      setText(node.querySelector('.destination-tag'), card[0]);
      setText(node.querySelector('h3'), card[1]);
      setText(node.querySelector('p'), card[2]);
      setText(node.querySelector('a'), card[3]);
    });
  }

  var bookingApplyLock = false;
  var bookingReapplyTimer = null;

  function applyBooking(lang) {
    if (bookingApplyLock) return;
    bookingApplyLock = true;
    var data = content.booking[lang];
    if (!data) {
      bookingApplyLock = false;
      return;
    }
    try {
      translateBenchmark(document.querySelector('.vip-booking .benchmark-band'), data.benchmark);

      var builderLabels = document.querySelectorAll('.vip-booking .builder-label');
      data.labels.builder.forEach(function (label, index) { setText(builderLabels[index], label); });

      var builderNotes = document.querySelectorAll('.vip-booking .builder-notes article');
      data.labels.builderNotes.forEach(function (item, index) {
        var node = builderNotes[index];
        if (!node) return;
        setText(node.querySelector('span'), item[0]);
        setText(node.querySelector('strong'), item[1]);
      });

      var topline = document.querySelectorAll('.vip-booking .builder-topline-card');
      data.labels.topline.forEach(function (item, index) {
        var node = topline[index];
        if (!node) return;
        setText(node.querySelector('span'), item[0]);
        setText(node.querySelector('strong'), item[1]);
      });

      var strip = document.querySelectorAll('.vip-booking .booking-notification-strip article');
      data.labels.notification.forEach(function (item, index) {
        var node = strip[index];
        if (!node) return;
        setText(node.querySelector('span'), item[0]);
        setText(node.querySelector('strong'), item[1]);
      });

      setText(document.querySelector('.vip-booking .summary-card .summary-label'), data.labels.summaryLabel);
      setText(document.querySelector('.vip-booking .summary-price span'), data.labels.estimated);
      setText(document.getElementById('addToCartCTA'), data.labels.addToCart);
      setText(document.getElementById('emailCTA'), data.labels.requestEmail);
      setText(document.getElementById('whatsappCTA'), data.labels.sendWhatsapp);
      var flowLink = document.querySelector('.vip-booking .summary-actions a[href*="operations"]');
      setText(flowLink, data.labels.viewFlow);
      setText(document.querySelector('.vip-booking .itinerary-card .summary-label'), data.labels.cartLabel);
      setText(document.querySelector('.vip-booking .cart-pill span'), data.labels.items);
      setText(document.querySelector('.vip-booking .itinerary-lead'), data.labels.itineraryLead);
      setText(document.getElementById('clearCartCTA'), data.labels.clear);
      setText(document.getElementById('emailCartCTA'), data.labels.sendFullEmail);
      setText(document.getElementById('whatsappCartCTA'), data.labels.sendFullWhatsapp);
      setText(document.querySelector('.vip-booking .cart-item-empty strong'), data.labels.emptyTitle);
      setText(document.querySelector('.vip-booking .cart-item-empty p'), data.labels.emptyLead);

      var notesField = document.getElementById('notesField');
      setPlaceholder(notesField, notesExamples[lang] || 'Special notes: celebration cake, chilled refreshments, Moet on board, Brugal 1888, villa coordination, bilingual host.');
    } finally {
      setTimeout(function () {
        bookingApplyLock = false;
      }, 0);
    }
  }

  function applyOps(lang) {
    var data = content.ops[lang];
    if (!data) return;
    var flowCards = document.querySelectorAll('#flow .confirmation-card');
    data.flow.forEach(function (card, index) {
      var node = flowCards[index];
      if (!node) return;
      setText(node.querySelector('span'), card[0]);
      setText(node.querySelector('strong'), card[1]);
      setText(node.querySelector('p'), card[2]);
    });
    var channelCards = document.querySelectorAll('#channels .channel-card');
    data.channels.forEach(function (card, index) {
      var node = channelCards[index];
      if (!node) return;
      setText(node.querySelector('span'), card[0]);
      setText(node.querySelector('strong'), card[1]);
      setText(node.querySelector('p'), card[2]);
    });
    var paymentCards = document.querySelectorAll('#payments .trust-card');
    data.payments.forEach(function (card, index) {
      var node = paymentCards[index];
      if (!node) return;
      setText(node.querySelector('span'), card[0]);
      setText(node.querySelector('strong'), card[1]);
      setText(node.querySelector('p'), card[2]);
    });
  }

  function applyPageTranslations() {
    decoratePickers();
    var lang = currentLang();
    localStorage.setItem('vip_lang', lang);
    syncLangUrl(lang);
    syncInternalVipLinks(lang);
    document.querySelectorAll('.vip-lang-picker').forEach(function (picker) {
      picker.value = lang;
    });
    if (lang === 'en') return;
    if (document.body.classList.contains('vip-home')) applyHome(lang);
    if (document.body.classList.contains('vip-packages')) applyPackages(lang);
    if (document.body.classList.contains('vip-fleet')) applyFleet(lang);
    if (document.body.classList.contains('vip-booking')) applyBooking(lang);
    applyExactTextMap(lang);
  }

  document.querySelectorAll('.vip-lang-picker').forEach(function (picker) {
    picker.addEventListener('change', function () {
      localStorage.setItem('vip_lang', picker.value);
      syncLangUrl(picker.value);
      setTimeout(function () {
        window.location.reload();
      }, 0);
    });
  });

  if (document.body.classList.contains('vip-booking')) {
    var observerTargets = ['serviceChips', 'packageCards', 'extrasGrid', 'summaryList', 'cartList'];
    observerTargets.forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      var observer = new MutationObserver(function () {
        if (currentLang() === 'en' || bookingApplyLock) return;
        clearTimeout(bookingReapplyTimer);
        bookingReapplyTimer = setTimeout(function () {
          applyBooking(currentLang());
          applyExactTextMap(currentLang());
        }, 16);
      });
      observer.observe(node, { childList: true, subtree: true });
    });
  }

  applyPageTranslations();
  setTimeout(applyPageTranslations, 60);
  window.addEventListener('load', function () {
    setTimeout(applyPageTranslations, 0);
  });
})();
