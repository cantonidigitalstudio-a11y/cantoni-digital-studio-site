(function () {
  var picker = document.getElementById('vipOpsLangPicker');
  if (!picker) return;

  var translations = {
    en: {
      lang: 'en',
      title: 'Excellentia VIP | Booking, confirmation and routing logic',
      description: 'Operational logic for Excellentia VIP covering request routing, WhatsApp and email confirmation, payment follow-up and team visibility.',
      text: {
        '#opsUtilityText': 'See how one request becomes a real service handoff.',
        '.brand-copy span': 'Booking flow',
        '.nav-links a[href="excellentia-vip.html"]': 'Home',
        '.nav-links a[href="#flow"]': 'Flow',
        '.nav-links a[href="#channels"]': 'Channels',
        '.nav-links a[href="#payments"]': 'Payments',
        '.nav-links a[href="#afterpay"]': 'After payment',
        '.nav-links a[href="#desk"]': 'Operations',
        '.nav-row > .btn.btn-primary': 'Open booking',
        '#opsHeroEyebrow': 'Booking and confirmation flow',
        '#opsHeroTitle': 'One request in. Every touchpoint updated.',
        '#opsHeroLead': 'The guest should feel certainty immediately, and the team should receive the same booking story across email, WhatsApp and the shared booking record.',
        '.hero-actions a[href="#flow"]': 'See flow',
        '.hero-actions a[href="#channels"]': 'See channels',
        '.hero-actions a:nth-child(3)': 'Open booking',
        '.stage-pill': 'Operational promise',
        '.stage-header strong': 'Request captured and visible',
        '.stage-grid article:nth-child(1) span': 'Input',
        '.stage-grid article:nth-child(1) strong': 'Service, route, add-ons',
        '.stage-grid article:nth-child(2) span': 'Delivery',
        '.stage-grid article:nth-child(2) strong': 'WhatsApp, email',
        '.stage-grid article:nth-child(3) span': 'Team view',
        '.stage-grid article:nth-child(3) strong': 'Readable booking record',
        '.stage-stack article:nth-child(1) span': 'Reliability',
        '.stage-stack article:nth-child(1) strong': 'No inquiry should disappear',
        '.stage-stack article:nth-child(2) span': 'Client clarity',
        '.stage-stack article:nth-child(2) strong': 'More trust, less manual work',
        '#opsFlowEyebrow': 'Confirmation flow',
        '#opsFlowTitle': 'The next step should feel obvious the second the request is sent.',
        '#opsChannelsEyebrow': 'Routing channels',
        '#opsChannelsTitle': 'WhatsApp, email and the shared booking record should always reflect the same booking story.',
        '#channels .channel-card:nth-child(1) a': 'Preview WhatsApp path',
        '#channels .channel-card:nth-child(2) a': 'Preview email recap',
        '#channels .channel-card:nth-child(3) a': 'View request builder',
        '#opsPaymentsEyebrow': 'Payment and notifications',
        '#opsPaymentsTitle': 'A successful payment should trigger every confirmation that matters.',
        '#opsAfterpayEyebrow': 'After payment',
        '#opsAfterpayTitle': 'The paid booking should stay synchronized across guest and team.',
        '#opsDeskEyebrow': 'Service clarity',
        '#opsDeskTitle': 'The team view should read like a live service board, not scattered notes.',
        '#opsCloseEyebrow': 'Request routing',
        '#opsCloseTitle': 'The guest should feel handled before anyone needs to ask twice.',
        '#opsCloseLead': 'Strong booking operations protect the guest experience: clear routing, fast confirmations and one shared record for guest and team.',
        '.final-cta-actions a:nth-child(1)': 'Open booking',
        '.final-cta-actions a:nth-child(2)': 'View fleet',
        '.final-cta-actions a:nth-child(3)': 'Packages',
        '.footer-links a[href="excellentia-vip.html"]': 'Home',
        '.footer-links a[href="excellentia-vip-packages.html"]': 'Packages',
        '.footer-links a[href="excellentia-vip-fleet.html"]': 'Fleet',
        '.footer-brand p': 'Booking routing, confirmation logic and guest-ready follow-up.',
        '.footer-note': 'Every request should keep the same booking details across WhatsApp, email and the booking record.'
      },
      sections: {
        flow: [
          ['Step 1', 'Guest builds the request', 'Service, route, vehicle tier, schedule and add-ons are bundled into one clean request before routing starts.'],
          ['Step 2', 'Request is routed immediately', 'The same request can reach WhatsApp and email at the same time so the team never depends on one fragile channel.'],
          ['Step 3', 'Business receives an ordered recap', 'The summary must stay readable: no lost extras, no missing route data and no vague internal notes.'],
          ['Step 4', 'After payment everyone is notified', 'Client email, client WhatsApp, operator email and operator WhatsApp should all fire from the same confirmed booking.']
        ],
        channels: [
          ['WhatsApp', 'Fast concierge routing', 'The message should arrive pre-filled with route, vehicle, package and extras so the conversation can continue without retyping.'],
          ['Email', 'Structured client and operator recap', 'The business inbox and the operator inbox should receive the same booking summary with route, schedule, notes, extras and payment status.'],
          ['Booking record', 'Visible booking history', 'A shared booking record should keep request history, guest details and status readable for the team.']
        ],
        payments: [
          ['Client email', 'Paid booking recap with all selected extras', 'The client should receive a clean email summary with service, route, schedule, vehicle, add-ons, payment status and next step.'],
          ['Operator email', 'Driver or service lead receives the same paid detail', 'The assigned operator must receive the full brief as soon as payment lands, without manual copy-paste.'],
          ['Client WhatsApp', 'Fast confirmation in the guest\'s native channel', 'WhatsApp should confirm payment, summarize the request and keep the conversation open for coordination.'],
          ['Operator WhatsApp', 'Instant update for the service team', 'The operator or service lead should get a structured WhatsApp summary with booking code, route, guest name, occasion extras and schedule.']
        ],
        afterpay: [
          ['Client email', 'Paid recap with route, vehicle, extras and next step', 'The guest receives a clean confirmation email with service summary, paid amount, booking reference and the reply path if they need changes.'],
          ['Client WhatsApp', 'Fast confirmation with an active reply channel', 'The guest also receives a concise WhatsApp confirmation with booking reference, schedule and a direct conversation path.'],
          ['Operator or coordinator email', 'Operational brief with all selected touches', 'The person handling the service receives date, route, guest count, notes, extras and payment status in one readable message.'],
          ['Operator or coordinator WhatsApp', 'Mobile service summary for execution', 'The same essential brief is sent on WhatsApp so the team can execute quickly without opening email first.']
        ],
        desk: [
          ['Client-facing flow', 'Elegant and premium on the front end, with no confusion about what the guest selected or what happens next.'],
          ['Booking clarity', 'A request should stay easy to read, confirm and forward even when the team is moving fast between inbox and WhatsApp.'],
          ['Ready to grow', 'The same structure can absorb payment logic, service tools and richer reservation handling later without breaking the guest-facing flow.']
        ]
      }
    },
    es: {
      lang: 'es',
      title: 'Excellentia VIP | Lógica de reserva, confirmación y enrutamiento',
      description: 'Lógica operativa de Excellentia VIP para el enrutamiento de solicitudes, confirmaciones por WhatsApp y email, seguimiento del pago y visibilidad para el equipo.',
      text: {
        '#opsUtilityText': 'Vea cómo una solicitud se convierte en un handoff real del servicio.',
        '.brand-copy span': 'Flujo de reserva',
        '.nav-links a[href="excellentia-vip.html"]': 'Inicio',
        '.nav-links a[href="#flow"]': 'Flujo',
        '.nav-links a[href="#channels"]': 'Canales',
        '.nav-links a[href="#payments"]': 'Pagos',
        '.nav-links a[href="#afterpay"]': 'Después del pago',
        '.nav-links a[href="#desk"]': 'Operaciones',
        '.nav-row > .btn.btn-primary': 'Abrir reserva',
        '#opsHeroEyebrow': 'Flujo de reserva y confirmación',
        '#opsHeroTitle': 'Una solicitud entra. Todos los puntos de contacto se actualizan.',
        '#opsHeroLead': 'El huésped debe sentir certeza de inmediato y el equipo debe recibir la misma historia de reserva en email, WhatsApp y el registro compartido de la reserva.',
        '.hero-actions a[href="#flow"]': 'Ver flujo',
        '.hero-actions a[href="#channels"]': 'Ver canales',
        '.hero-actions a:nth-child(3)': 'Abrir reserva',
        '.stage-pill': 'Promesa operativa',
        '.stage-header strong': 'Solicitud capturada y visible',
        '.stage-grid article:nth-child(1) span': 'Entrada',
        '.stage-grid article:nth-child(1) strong': 'Servicio, ruta y extras',
        '.stage-grid article:nth-child(2) span': 'Entrega',
        '.stage-grid article:nth-child(2) strong': 'WhatsApp y email',
        '.stage-grid article:nth-child(3) span': 'Vista del equipo',
        '.stage-grid article:nth-child(3) strong': 'Registro de reserva legible',
        '.stage-stack article:nth-child(1) span': 'Fiabilidad',
        '.stage-stack article:nth-child(1) strong': 'Ninguna consulta debe perderse',
        '.stage-stack article:nth-child(2) span': 'Claridad para el cliente',
        '.stage-stack article:nth-child(2) strong': 'Más confianza, menos trabajo manual',
        '#opsFlowEyebrow': 'Flujo de confirmación',
        '#opsFlowTitle': 'El siguiente paso debe sentirse obvio en el segundo en que se envía la solicitud.',
        '#opsChannelsEyebrow': 'Canales de enrutamiento',
        '#opsChannelsTitle': 'WhatsApp, email y el registro compartido de la reserva deben reflejar siempre la misma historia.',
        '#channels .channel-card:nth-child(1) a': 'Ver flujo por WhatsApp',
        '#channels .channel-card:nth-child(2) a': 'Ver resumen por email',
        '#channels .channel-card:nth-child(3) a': 'Ver configurador',
        '#opsPaymentsEyebrow': 'Pago y notificaciones',
        '#opsPaymentsTitle': 'Un pago correcto debe activar todas las confirmaciones que importan.',
        '#opsAfterpayEyebrow': 'Después del pago',
        '#opsAfterpayTitle': 'La reserva pagada debe quedar sincronizada entre huésped y equipo.',
        '#opsDeskEyebrow': 'Claridad del servicio',
        '#opsDeskTitle': 'La vista del equipo debe leerse como un tablero vivo del servicio, no como notas sueltas.',
        '#opsCloseEyebrow': 'Enrutamiento de la solicitud',
        '#opsCloseTitle': 'El huésped debe sentirse atendido antes de que nadie tenga que preguntar dos veces.',
        '#opsCloseLead': 'Una operación de reserva sólida protege la experiencia del huésped: enrutamiento claro, confirmaciones rápidas y un solo registro compartido para huésped y equipo.',
        '.final-cta-actions a:nth-child(1)': 'Abrir reserva',
        '.final-cta-actions a:nth-child(2)': 'Ver flota',
        '.final-cta-actions a:nth-child(3)': 'Ver paquetes',
        '.footer-links a[href="excellentia-vip.html"]': 'Inicio',
        '.footer-links a[href="excellentia-vip-packages.html"]': 'Paquetes',
        '.footer-links a[href="excellentia-vip-fleet.html"]': 'Flota',
        '.footer-brand p': 'Enrutamiento de reservas, lógica de confirmación y seguimiento listo para el huésped.',
        '.footer-note': 'Cada solicitud debe conservar el mismo detalle de la reserva en WhatsApp, email y el registro de reserva.'
      },
      sections: {
        flow: [
          ['Paso 1', 'El huésped construye la solicitud', 'Servicio, ruta, vehículo, horario y extras se agrupan en una sola solicitud limpia antes del traspaso operativo.'],
          ['Paso 2', 'La solicitud se enruta de inmediato', 'La misma solicitud puede llegar a WhatsApp y email al mismo tiempo para no depender de un canal frágil.'],
          ['Paso 3', 'El negocio recibe un resumen ordenado', 'El resumen debe seguir siendo legible: sin extras perdidos, sin rutas incompletas y sin notas vagas.'],
          ['Paso 4', 'Después del pago todos quedan avisados', 'Email del cliente, WhatsApp del cliente, email del operador y WhatsApp del operador deben salir de la misma reserva confirmada.']
        ],
        channels: [
          ['WhatsApp', 'Paso rápido al concierge', 'El mensaje debe llegar precompletado con ruta, vehículo, paquete y extras para que la conversación siga sin fricción.'],
          ['Email', 'Resumen estructurado para cliente y operador', 'La bandeja del negocio y la del operador deben recibir el mismo resumen con ruta, horario, notas, extras y estado del pago.'],
          ['Registro de reserva', 'Historial visible de la reserva', 'Un registro compartido debe mantener legibles para el equipo el historial, los datos del huésped y el estado.']
        ],
        payments: [
          ['Email cliente', 'Resumen de la reserva pagada con todos los extras seleccionados', 'El cliente debe recibir un email claro con servicio, ruta, horario, vehículo, extras, estado del pago y siguiente paso.'],
          ['Email operador', 'El operador o responsable del servicio recibe el mismo detalle pagado', 'El operador asignado debe recibir el resumen completo apenas entra el pago, sin copiar a mano.'],
          ['WhatsApp cliente', 'Confirmación rápida en el canal nativo del huésped', 'WhatsApp debe confirmar el pago, resumir la solicitud y dejar abierta la conversación.'],
          ['WhatsApp operador', 'Actualización inmediata para quien ejecuta el servicio', 'El operador o responsable debe recibir un resumen estructurado con código, ruta, nombre, extras de ocasión y horario.']
        ],
        afterpay: [
          ['Email cliente', 'Resumen pagado con ruta, vehículo, extras y siguiente paso', 'El huésped recibe un email claro con resumen del servicio, importe pagado, referencia de reserva y vía de respuesta por si necesita cambios.'],
          ['WhatsApp cliente', 'Confirmación rápida con canal activo de respuesta', 'El huésped también recibe una confirmación breve por WhatsApp con referencia de reserva, horario y un canal directo para continuar la conversación.'],
          ['Email del operador o coordinador', 'Resumen operativo con todos los detalles seleccionados', 'La persona que ejecuta el servicio recibe fecha, ruta, cantidad de huéspedes, notas, extras y estado del pago en un solo mensaje legible.'],
          ['WhatsApp del operador o coordinador', 'Resumen móvil del servicio', 'El mismo resumen esencial se envía por WhatsApp para que el equipo pueda actuar rápido sin abrir primero el email.']
        ],
        desk: [
          ['Flujo de cara al cliente', 'Elegante y premium en la parte visible, sin dudas sobre lo que eligió el huésped ni sobre el siguiente paso.'],
          ['Claridad de la reserva', 'La solicitud debe seguir siendo fácil de leer, confirmar y reenviar incluso cuando el equipo se mueve rápido entre inbox y WhatsApp.'],
          ['Lista para crecer', 'La misma estructura puede absorber pagos, herramientas de servicio y una gestión más rica sin romper el flujo de cara al huésped.']
        ]
      }
    },
    it: {
      lang: 'it',
      title: 'Excellentia VIP | Logica di prenotazione, conferma e instradamento',
      description: 'Logica operativa per Excellentia VIP con instradamento richieste, conferme via WhatsApp ed email, follow-up pagamento e visibilità per il team.',
      text: {
        '#opsUtilityText': 'Guarda come le richieste passano dalla selezione alla conferma.',
        '.brand-copy span': 'Flusso prenotazione',
        '.nav-links a[href="excellentia-vip.html"]': 'Home',
        '.nav-links a[href="#flow"]': 'Flusso',
        '.nav-links a[href="#channels"]': 'Canali',
        '.nav-links a[href="#payments"]': 'Pagamenti',
        '.nav-links a[href="#afterpay"]': 'Dopo il pagamento',
        '.nav-links a[href="#desk"]': 'Operatività',
        '.nav-row > .btn.btn-primary': 'Apri prenotazione',
        '#opsHeroEyebrow': 'Flusso di prenotazione e conferma',
        '#opsHeroTitle': 'Ogni richiesta VIP deve essere raccolta una volta sola, instradata bene e confermata rapidamente.',
        '#opsHeroLead': 'L\'ospite deve capire cosa succede dopo l\'invio della richiesta. Il flusso deve sembrare premium lato cliente e affidabile lato team, con email, WhatsApp e un registro prenotazione condiviso che raccontano la stessa prenotazione.',
        '.hero-actions a[href="#flow"]': 'Vedi flusso di conferma',
        '.hero-actions a[href="#channels"]': 'Vedi canali di instradamento',
        '.hero-actions a:nth-child(3)': 'Apri prenotazione',
        '.stage-pill': 'Promessa operativa',
        '.stage-header strong': 'Richiesta raccolta e visibile',
        '.stage-grid article:nth-child(1) span': 'Richiesta',
        '.stage-grid article:nth-child(1) strong': 'Servizio, percorso ed extra',
        '.stage-grid article:nth-child(2) span': 'Consegna',
        '.stage-grid article:nth-child(2) strong': 'WhatsApp ed email',
        '.stage-grid article:nth-child(3) span': 'Vista team',
        '.stage-grid article:nth-child(3) strong': 'Registro prenotazione leggibile',
        '.stage-stack article:nth-child(1) span': 'Affidabilità',
        '.stage-stack article:nth-child(1) strong': 'Nessuna richiesta deve sparire',
        '.stage-stack article:nth-child(2) span': 'Chiarezza cliente',
        '.stage-stack article:nth-child(2) strong': 'Più fiducia, meno lavoro manuale',
        '#opsFlowEyebrow': 'Flusso di conferma',
        '#opsFlowTitle': 'L\'ospite deve vedere subito il prossimo passo dopo l\'invio della richiesta.',
        '#opsChannelsEyebrow': 'Canali di instradamento',
        '#opsChannelsTitle': 'WhatsApp, email e registro prenotazione condiviso devono raccontare la stessa storia dell’ospite.',
        '#channels .channel-card:nth-child(1) a': 'Vedi flusso WhatsApp',
        '#channels .channel-card:nth-child(2) a': 'Vedi riepilogo email',
        '#channels .channel-card:nth-child(3) a': 'Vedi configuratore richiesta',
        '#opsPaymentsEyebrow': 'Pagamento e notifiche',
        '#opsPaymentsTitle': 'Un pagamento riuscito deve attivare quattro conferme, non una transazione silenziosa.',
        '#opsAfterpayEyebrow': 'Dopo il pagamento',
        '#opsAfterpayTitle': 'La prenotazione pagata deve restare sincronizzata tra ospite e team.',
        '#opsDeskEyebrow': 'Chiarezza del servizio',
        '#opsDeskTitle': 'La vista team deve leggersi come una board viva del servizio, non come note sparse.',
        '#opsCloseEyebrow': 'Instradamento richiesta',
        '#opsCloseTitle': 'Il percorso dell\'ospite deve restare chiaro anche dopo l\'invio del form.',
        '#opsCloseLead': 'Un flusso di prenotazione solido protegge l’esperienza dell’ospite: instradamento chiaro, conferme rapide e un solo registro condiviso tra cliente e team.',
        '.final-cta-actions a:nth-child(1)': 'Apri prenotazione',
        '.final-cta-actions a:nth-child(2)': 'Vedi flotta',
        '.final-cta-actions a:nth-child(3)': 'Vedi pacchetti',
        '.footer-links a[href="excellentia-vip.html"]': 'Home',
        '.footer-links a[href="excellentia-vip-packages.html"]': 'Pacchetti',
        '.footer-links a[href="excellentia-vip-fleet.html"]': 'Flotta',
        '.footer-brand p': 'Instradamento richieste, logica di conferma e follow-up pronto per l’ospite.',
        '.footer-note': 'Ogni richiesta deve mantenere gli stessi dettagli su WhatsApp, email e registro prenotazione.'
      },
      sections: {
        flow: [
          ['Fase 1', 'L\'ospite costruisce la richiesta', 'Servizio, percorso, veicolo, orario ed extra confluiscono in una richiesta pulita prima del passaggio operativo.'],
          ['Fase 2', 'La richiesta viene instradata subito', 'La stessa richiesta può arrivare su WhatsApp ed email insieme senza dipendere da un solo canale fragile.'],
          ['Fase 3', 'Il team riceve un riepilogo ordinato', 'Il riepilogo deve restare leggibile: niente extra persi, nessun percorso mancante, nessuna nota vaga.'],
          ['Fase 4', 'Dopo il pagamento tutti vengono avvisati', 'Email cliente, WhatsApp cliente, email operatore e WhatsApp operatore devono nascere dalla stessa prenotazione confermata.']
        ],
        channels: [
          ['WhatsApp', 'Passaggio veloce al concierge', 'Il messaggio deve arrivare precompilato con percorso, veicolo, pacchetto ed extra, così la conversazione continua subito.'],
          ['Email', 'Riepilogo strutturato per cliente e operatore', 'La casella business e quella operativa devono ricevere lo stesso riepilogo con percorso, orario, note, extra e stato del pagamento.'],
          ['Registro prenotazione', 'Storico prenotazione visibile', 'Un registro condiviso deve mantenere leggibili per il team storico, dati ospite e stato.']
        ],
        payments: [
          ['Email cliente', 'Riepilogo della prenotazione pagata con tutti gli extra scelti', 'Il cliente deve ricevere un\'email pulita con servizio, percorso, orario, veicolo, extra, stato del pagamento e prossimo passo.'],
          ['Email operatore', 'Operatore o responsabile del servizio riceve lo stesso dettaglio pagato', 'L\'operatore assegnato deve ricevere il riepilogo completo appena entra il pagamento, senza copia manuale.'],
          ['WhatsApp cliente', 'Conferma rapida nel canale naturale del cliente', 'WhatsApp deve confermare il pagamento, riassumere la richiesta e lasciare aperta la conversazione per il coordinamento.'],
          ['WhatsApp operatore', 'Aggiornamento immediato per chi esegue il servizio', 'L\'operatore o il responsabile del servizio deve ricevere un riepilogo strutturato con codice prenotazione, percorso, nome ospite, extra e orario.']
        ],
        afterpay: [
          ['Email cliente', 'Riepilogo pagato con percorso, veicolo, extra e prossimo passo', 'L\'ospite riceve un\'email chiara con riepilogo del servizio, importo pagato, riferimento prenotazione e canale di risposta se servono modifiche.'],
          ['WhatsApp cliente', 'Conferma rapida con canale di risposta attivo', 'L\'ospite riceve anche una conferma sintetica via WhatsApp con riferimento prenotazione, orario e una conversazione diretta già aperta.'],
          ['Email operatore o coordinatore', 'Riepilogo operativo con tutti i dettagli selezionati', 'Chi gestisce il servizio riceve data, percorso, numero ospiti, note, extra e stato del pagamento in un unico messaggio leggibile.'],
          ['WhatsApp operatore o coordinatore', 'Riepilogo mobile del servizio', 'Lo stesso riepilogo essenziale viene inviato su WhatsApp così il team può eseguire rapidamente senza aprire prima l\'email.']
        ],
        desk: [
          ['Flusso lato cliente', 'Elegante e premium lato cliente, senza dubbi su cosa ha scelto l\'ospite e sul prossimo passo.'],
          ['Chiarezza prenotazione', 'La richiesta deve restare facile da leggere, confermare e inoltrare anche quando il team si muove veloce tra inbox e WhatsApp.'],
          ['Pronta a crescere', 'La stessa struttura può assorbire pagamenti, strumenti di servizio e gestione più ricca senza rompere il flusso lato ospite.']
        ]
      }
    },
    fr: {
      lang: 'fr',
      title: 'Excellentia VIP | Logique de réservation, confirmation et acheminement',
      description: 'Logique opérationnelle Excellentia VIP pour le routage des demandes, les confirmations WhatsApp et email, le suivi du paiement et la visibilité équipe.',
      text: {
        '#opsUtilityText': 'Voyez comment les demandes passent de la sélection à la confirmation.',
        '.brand-copy span': 'Flux de réservation',
        '.nav-links a[href="excellentia-vip.html"]': 'Accueil',
        '.nav-links a[href="#flow"]': 'Flux',
        '.nav-links a[href="#channels"]': 'Canaux',
        '.nav-links a[href="#payments"]': 'Paiements',
        '.nav-links a[href="#afterpay"]': 'Après paiement',
        '.nav-links a[href="#desk"]': 'Opérations',
        '.nav-row > .btn.btn-primary': 'Ouvrir la réservation',
        '#opsHeroEyebrow': 'Flux de réservation et de confirmation',
        '#opsHeroTitle': 'Chaque demande VIP doit être captée une seule fois, orientée clairement et confirmée vite.',
        '#opsHeroLead': 'Le client doit comprendre ce qui se passe après l\'envoi de sa demande. Le flux doit sembler premium côté client et fiable côté équipe, avec email, WhatsApp et un historique partagé qui racontent la même réservation.',
        '.hero-actions a[href="#flow"]': 'Voir le flux de confirmation',
        '.hero-actions a[href="#channels"]': 'Voir les canaux d\'acheminement',
        '.hero-actions a:nth-child(3)': 'Ouvrir la réservation',
        '.stage-pill': 'Promesse opérationnelle',
        '.stage-header strong': 'Demande captée et visible',
        '.stage-grid article:nth-child(1) span': 'Entrée',
        '.stage-grid article:nth-child(1) strong': 'Service, trajet et extras',
        '.stage-grid article:nth-child(2) span': 'Livraison',
        '.stage-grid article:nth-child(2) strong': 'WhatsApp et email',
        '.stage-grid article:nth-child(3) span': 'Vue équipe',
        '.stage-grid article:nth-child(3) strong': 'Historique de réservation lisible',
        '.stage-stack article:nth-child(1) span': 'Fiabilité',
        '.stage-stack article:nth-child(1) strong': 'Aucune demande ne doit disparaître',
        '.stage-stack article:nth-child(2) span': 'Clarté client',
        '.stage-stack article:nth-child(2) strong': 'Plus de confiance, moins de travail manuel',
        '#opsFlowEyebrow': 'Flux de confirmation',
        '#opsFlowTitle': 'Le client doit voir une prochaine étape claire immédiatement après l\'envoi.',
        '#opsChannelsEyebrow': 'Canaux d\'acheminement',
        '#opsChannelsTitle': 'WhatsApp, email et historique partagé de réservation doivent raconter la même histoire côté client.',
        '#channels .channel-card:nth-child(1) a': 'Voir le relais WhatsApp',
        '#channels .channel-card:nth-child(2) a': 'Voir le récap email',
        '#channels .channel-card:nth-child(3) a': 'Voir le configurateur',
        '#opsPaymentsEyebrow': 'Paiement et notifications',
        '#opsPaymentsTitle': 'Un paiement réussi doit déclencher quatre confirmations, pas une transaction silencieuse.',
        '#opsAfterpayEyebrow': 'Après paiement',
        '#opsAfterpayTitle': 'La réservation payée doit rester synchronisée entre le client et l\'équipe.',
        '#opsDeskEyebrow': 'Clarté du service',
        '#opsDeskTitle': 'La vue équipe doit se lire comme un tableau vivant du service, pas comme des notes dispersées.',
        '#opsCloseEyebrow': 'Routage de la demande',
        '#opsCloseTitle': 'Le parcours client doit rester clair même après l\'envoi du formulaire.',
        '#opsCloseLead': 'Un bon flux de réservation protège l’expérience du client : acheminement clair, confirmations rapides et un seul historique partagé entre client et équipe.',
        '.final-cta-actions a:nth-child(1)': 'Ouvrir la réservation',
        '.final-cta-actions a:nth-child(2)': 'Voir la flotte',
        '.final-cta-actions a:nth-child(3)': 'Voir les offres',
        '.footer-links a[href="excellentia-vip.html"]': 'Accueil',
        '.footer-links a[href="excellentia-vip-packages.html"]': 'Offres',
        '.footer-links a[href="excellentia-vip-fleet.html"]': 'Flotte',
        '.footer-brand p': 'Acheminement des demandes, logique de confirmation et suivi prêt pour le client.',
        '.footer-note': 'Chaque demande doit garder les mêmes détails sur WhatsApp, email et l’historique de réservation.'
      },
      sections: {
        flow: [
          ['Étape 1', 'Le client construit la demande', 'Service, trajet, véhicule, horaire et extras sont regroupés dans une demande claire avant la transmission.'],
          ['Étape 2', 'La demande est routée immédiatement', 'La même demande peut arriver sur WhatsApp et email en même temps pour ne pas dépendre d\'un seul canal fragile.'],
          ['Étape 3', 'L\'équipe reçoit un récapitulatif ordonné', 'Le résumé doit rester lisible : pas d\'extras perdus, pas de trajet manquant, pas de notes vagues.'],
          ['Étape 4', 'Après paiement tout le monde est notifié', 'Email client, WhatsApp client, email opérateur et WhatsApp opérateur doivent partir de la même réservation confirmée.']
        ],
        channels: [
          ['WhatsApp', 'Transmission rapide au concierge', 'Le message doit arriver pré-rempli avec trajet, véhicule, formule et extras pour garder la conversation fluide.'],
          ['Email', 'Récap structuré client et opérateur', 'La boîte business et celle de l\'opérateur doivent recevoir le même résumé avec trajet, horaire, notes, extras et statut de paiement.'],
          ['Historique de réservation', 'Visibilité claire de la réservation', 'Un historique partagé doit garder lisibles pour l’équipe l’historique, les données client et le statut.']
        ],
        payments: [
          ['Email client', 'Récapitulatif de réservation payée avec tous les extras choisis', 'Le client doit recevoir un email propre avec service, trajet, horaire, véhicule, extras, statut du paiement et prochaine étape.'],
          ['Email opérateur', 'Opérateur ou responsable de service reçoit le même détail payé', 'L\'opérateur assigné doit recevoir le récapitulatif complet dès le paiement, sans copie manuelle.'],
          ['WhatsApp client', 'Confirmation rapide dans le canal natif du client', 'WhatsApp doit confirmer le paiement, résumer la demande et garder la conversation ouverte.'],
          ['WhatsApp opérateur', 'Mise à jour immédiate pour l\'exécution du service', 'L\'opérateur ou le responsable doit recevoir un résumé structuré avec code, trajet, nom du client, extras d\'occasion et horaire.']
        ],
        afterpay: [
          ['Email client', 'Récapitulatif payé avec trajet, véhicule, extras et prochaine étape', 'Le client reçoit un email clair avec résumé du service, montant payé, référence de réservation et canal de réponse en cas de modification.'],
          ['WhatsApp client', 'Confirmation rapide avec canal de réponse actif', 'Le client reçoit aussi une confirmation WhatsApp concise avec référence de réservation, horaire et conversation directe ouverte.'],
          ['Email opérateur ou coordinateur', 'Récapitulatif opérationnel avec tous les détails sélectionnés', 'La personne qui exécute le service reçoit date, trajet, nombre de passagers, notes, extras et statut du paiement dans un seul message lisible.'],
          ['WhatsApp opérateur ou coordinateur', 'Résumé mobile du service', 'Le même récapitulatif essentiel est envoyé sur WhatsApp pour que l\'équipe puisse exécuter rapidement sans ouvrir d\'abord l\'email.']
        ],
        desk: [
          ['Flux côté client', 'Élégant et premium côté front, sans doute sur ce que le client a choisi ni sur la prochaine étape.'],
          ['Clarté de réservation', 'La demande doit rester facile à lire, confirmer et transférer même quand l’équipe alterne vite entre inbox et WhatsApp.'],
          ['Prêt à grandir', 'La même structure peut absorber paiements, outils de service et gestion plus riche sans casser le flux côté client.']
        ]
      }
    },
    de: {
      lang: 'de',
      title: 'Excellentia VIP | Booking-, Bestätigungs- und Routinglogik',
      description: 'Operative Logik für Excellentia VIP mit Anfrage-Routing, WhatsApp- und E-Mail-Bestätigungen, Zahlungsfolge und Team-Sichtbarkeit.',
      text: {
        '#opsUtilityText': 'Seht, wie Anfragen von der Auswahl bis zur Bestätigung laufen.',
        '.brand-copy span': 'Buchungsfluss',
        '.nav-links a[href="excellentia-vip.html"]': 'Start',
        '.nav-links a[href="#flow"]': 'Ablauf',
        '.nav-links a[href="#channels"]': 'Kanäle',
        '.nav-links a[href="#payments"]': 'Zahlungen',
        '.nav-links a[href="#afterpay"]': 'Nach Zahlung',
        '.nav-links a[href="#desk"]': 'Betrieb',
        '.nav-row > .btn.btn-primary': 'Buchung öffnen',
        '#opsHeroEyebrow': 'Booking- und Bestätigungsfluss',
        '#opsHeroTitle': 'Jede VIP-Anfrage muss einmal erfasst, klar weitergeleitet und schnell bestätigt werden.',
        '#opsHeroLead': 'Gäste sollen verstehen, was nach dem Absenden passiert. Der Ablauf muss sich vorne premium und für das Team zuverlässig anfühlen, mit E-Mail, WhatsApp und einer gemeinsamen Buchungsakte, die dieselbe Reservierung zeigen.',
        '.hero-actions a[href="#flow"]': 'Bestätigungsablauf sehen',
        '.hero-actions a[href="#channels"]': 'Routing-Kanäle sehen',
        '.hero-actions a:nth-child(3)': 'Buchung öffnen',
        '.stage-pill': 'Operatives Versprechen',
        '.stage-header strong': 'Anfrage erfasst und sichtbar',
        '.stage-grid article:nth-child(1) span': 'Eingabe',
        '.stage-grid article:nth-child(1) strong': 'Service, Route und Extras',
        '.stage-grid article:nth-child(2) span': 'Ausspielung',
        '.stage-grid article:nth-child(2) strong': 'WhatsApp und E-Mail',
        '.stage-grid article:nth-child(3) span': 'Teamansicht',
        '.stage-grid article:nth-child(3) strong': 'Lesbare Buchungsakte',
        '.stage-stack article:nth-child(1) span': 'Verlässlichkeit',
        '.stage-stack article:nth-child(1) strong': 'Keine Anfrage darf verschwinden',
        '.stage-stack article:nth-child(2) span': 'Klarheit für den Gast',
        '.stage-stack article:nth-child(2) strong': 'Mehr Vertrauen, weniger manuelle Arbeit',
        '#opsFlowEyebrow': 'Bestätigungsfluss',
        '#opsFlowTitle': 'Der Gast soll sofort nach dem Absenden den nächsten klaren Schritt sehen.',
        '#opsChannelsEyebrow': 'Routing-Kanäle',
        '#opsChannelsTitle': 'WhatsApp, E-Mail und die gemeinsame Buchungsakte sollen dieselbe Gastgeschichte erzählen.',
        '#channels .channel-card:nth-child(1) a': 'WhatsApp-Ablauf ansehen',
        '#channels .channel-card:nth-child(2) a': 'E-Mail-Zusammenfassung ansehen',
        '#channels .channel-card:nth-child(3) a': 'Anfragekonfigurator ansehen',
        '#opsPaymentsEyebrow': 'Zahlung und Benachrichtigungen',
        '#opsPaymentsTitle': 'Eine erfolgreiche Zahlung muss vier Bestätigungen auslösen, nicht nur eine stille Transaktion.',
        '#opsAfterpayEyebrow': 'Nach Zahlung',
        '#opsAfterpayTitle': 'Die bezahlte Reservierung muss zwischen Gast und Team synchron bleiben.',
        '#opsDeskEyebrow': 'Serviceklarheit',
        '#opsDeskTitle': 'Die Teamansicht sollte sich wie ein lebendiges Service-Board lesen, nicht wie verstreute Notizen.',
        '#opsCloseEyebrow': 'Anfrage-Routing',
        '#opsCloseTitle': 'Die Gastreise muss auch nach dem Formularversand klar bleiben.',
        '#opsCloseLead': 'Ein starker Buchungsablauf schützt das Gasterlebnis: klares Routing, schnelle Bestätigungen und eine gemeinsame Buchungsakte für Gast und Team.',
        '.final-cta-actions a:nth-child(1)': 'Buchung öffnen',
        '.final-cta-actions a:nth-child(2)': 'Flotte',
        '.final-cta-actions a:nth-child(3)': 'Pakete',
        '.footer-links a[href="excellentia-vip.html"]': 'Start',
        '.footer-links a[href="excellentia-vip-packages.html"]': 'Pakete',
        '.footer-links a[href="excellentia-vip-fleet.html"]': 'Flotte',
        '.footer-brand p': 'Booking-Routing, Bestaetigungslogik und gaestebereiter Follow-up.',
        '.footer-note': 'Jede Anfrage soll dieselben Buchungsdetails in WhatsApp, E-Mail und Buchungsakte behalten.'
      },
      sections: {
        flow: [
          ['Schritt 1', 'Der Gast erstellt die Anfrage', 'Service, Route, Fahrzeug, Zeitfenster und Extras werden vor der Uebergabe in einer klaren Anfrage gebuendelt.'],
          ['Schritt 2', 'Die Anfrage wird sofort geroutet', 'Dieselbe Anfrage kann gleichzeitig auf WhatsApp und Email ankommen, damit das Business nicht von einem fragilen Kanal abhängt.'],
          ['Schritt 3', 'Das Business erhält eine geordnete Zusammenfassung', 'Die Zusammenfassung muss lesbar bleiben: keine verlorenen Extras, keine fehlenden Routen, keine vagen Notizen.'],
          ['Schritt 4', 'Nach Zahlung werden alle informiert', 'Kunden-E-Mail, Kunden-WhatsApp, Operator-E-Mail und Operator-WhatsApp müssen aus derselben bestätigten Reservierung entstehen.']
        ],
        channels: [
          ['WhatsApp', 'Schnelles Concierge-Routing', 'Die Nachricht sollte mit Route, Fahrzeug, Paket und Extras vorausgefuellt ankommen, damit die Konversation direkt weitergeht.'],
          ['E-Mail', 'Strukturierte Zusammenfassung fuer Kunde und Team', 'Business-Postfach und operatives Postfach sollen dieselbe Zusammenfassung mit Route, Zeitfenster, Notizen, Extras und Zahlungsstatus erhalten.'],
          ['Buchungsakte', 'Sichtbare Buchungshistorie', 'Eine geteilte Buchungsakte soll Historie, Gastdaten und Status fuer das Team lesbar halten.']
        ],
        payments: [
          ['Kunden-E-Mail', 'Bezahlte Reservierungszusammenfassung mit allen Extras', 'Der Kunde soll eine saubere E-Mail mit Service, Route, Zeitfenster, Fahrzeug, Extras, Zahlungsstatus und naechstem Schritt erhalten.'],
          ['Operator-E-Mail', 'Operator oder Einsatzleitung erhaelt denselben bezahlten Detailstand', 'Der zugewiesene Operator muss die vollstaendige Zusammenfassung direkt nach Zahlung erhalten, ohne manuelles Kopieren.'],
          ['Kunden-WhatsApp', 'Schnelle Bestätigung im nativen Kanal des Gastes', 'WhatsApp soll die Zahlung bestätigen, die Anfrage zusammenfassen und die Konversation offen halten.'],
          ['Operator-WhatsApp', 'Sofortiges Update fuer die Ausfuehrung', 'Der Operator oder die Einsatzleitung soll eine strukturierte Zusammenfassung mit Code, Route, Name, Anlass-Extras und Zeitfenster erhalten.']
        ],
        afterpay: [
          ['Kunden-E-Mail', 'Bezahlte Zusammenfassung mit Route, Fahrzeug, Extras und nächstem Schritt', 'Der Gast erhält eine klare E-Mail mit Serviceübersicht, bezahltem Betrag, Buchungsreferenz und Antwortweg für eventuelle Änderungen.'],
          ['Kunden-WhatsApp', 'Schnelle Bestätigung mit aktivem Antwortkanal', 'Der Gast erhält zusätzlich eine kurze WhatsApp-Bestätigung mit Buchungsreferenz, Zeitfenster und direktem Gespraechspfad.'],
          ['Operator- oder Koordinator-Email', 'Operative Zusammenfassung mit allen gewaehlten Details', 'Die ausfuehrende Person erhaelt Datum, Route, Gaestezahl, Notizen, Extras und Zahlungsstatus in einer einzigen gut lesbaren Nachricht.'],
          ['Operator- oder Koordinator-WhatsApp', 'Mobiler Serviceueberblick', 'Dieselbe Kernzusammenfassung wird ueber WhatsApp gesendet, damit das Team schnell handeln kann, ohne zuerst E-Mails zu oeffnen.']
        ],
        desk: [
          ['Gastseitiger Ablauf', 'Elegant und premium im Frontend, ohne Unklarheit darüber, was der Gast gewählt hat oder was als Nächstes passiert.'],
          ['Buchungsklarheit', 'Die Anfrage soll leicht zu lesen, zu bestaetigen und weiterzuleiten bleiben, auch wenn das Team schnell zwischen Postfach und WhatsApp wechselt.'],
          ['Bereit zu wachsen', 'Dieselbe Struktur kann spaeter Zahlungen, Admin-Tools und reichere Reservierungslogik aufnehmen, ohne den Gastfluss zu brechen.']
        ]
      }
    },
    pt: {
      lang: 'pt',
      title: 'Excellentia VIP | Lógica de reserva, confirmação e encaminhamento',
      description: 'Lógica operacional da Excellentia VIP para encaminhamento de pedidos, confirmações por WhatsApp e email, acompanhamento de pagamento e visibilidade da equipa.',
      text: {
        '#opsUtilityText': 'Veja como os pedidos passam da seleção para a confirmação.',
        '.brand-copy span': 'Fluxo de reserva',
        '.nav-links a[href="excellentia-vip.html"]': 'Início',
        '.nav-links a[href="#flow"]': 'Fluxo',
        '.nav-links a[href="#channels"]': 'Canais',
        '.nav-links a[href="#payments"]': 'Pagamentos',
        '.nav-links a[href="#afterpay"]': 'Após o pagamento',
        '.nav-links a[href="#desk"]': 'Operações',
        '.nav-row > .btn.btn-primary': 'Abrir reserva',
        '#opsHeroEyebrow': 'Fluxo de reserva e confirmação',
        '#opsHeroTitle': 'Cada pedido VIP deve ser capturado uma vez, encaminhado com clareza e confirmado rápido.',
        '#opsHeroLead': 'O hóspede precisa entender o que acontece depois de enviar o pedido. O fluxo deve parecer premium no front e confiável para a equipa, com email, WhatsApp e um registo partilhado que mostrem a mesma reserva.',
        '.hero-actions a[href="#flow"]': 'Ver fluxo de confirmação',
        '.hero-actions a[href="#channels"]': 'Ver canais de encaminhamento',
        '.hero-actions a:nth-child(3)': 'Abrir reserva',
        '.stage-pill': 'Promessa operacional',
        '.stage-header strong': 'Pedido capturado e visível',
        '.stage-grid article:nth-child(1) span': 'Entrada',
        '.stage-grid article:nth-child(1) strong': 'Serviço, rota e extras',
        '.stage-grid article:nth-child(2) span': 'Entrega',
        '.stage-grid article:nth-child(2) strong': 'WhatsApp e email',
        '.stage-grid article:nth-child(3) span': 'Vista da equipa',
        '.stage-grid article:nth-child(3) strong': 'Registo de reserva legível',
        '.stage-stack article:nth-child(1) span': 'Fiabilidade',
        '.stage-stack article:nth-child(1) strong': 'Nenhum pedido deve desaparecer',
        '.stage-stack article:nth-child(2) span': 'Clareza para o cliente',
        '.stage-stack article:nth-child(2) strong': 'Mais confiança, menos trabalho manual',
        '#opsFlowEyebrow': 'Fluxo de confirmação',
        '#opsFlowTitle': 'O hóspede deve ver imediatamente o próximo passo após enviar a solicitação.',
        '#opsChannelsEyebrow': 'Canais de encaminhamento',
        '#opsChannelsTitle': 'WhatsApp, email e registo partilhado da reserva devem contar a mesma história do hóspede.',
        '#channels .channel-card:nth-child(1) a': 'Ver fluxo no WhatsApp',
        '#channels .channel-card:nth-child(2) a': 'Ver resumo por email',
        '#channels .channel-card:nth-child(3) a': 'Ver configurador',
        '#opsPaymentsEyebrow': 'Pagamento e notificações',
        '#opsPaymentsTitle': 'Um pagamento bem-sucedido deve acionar quatro confirmações, não uma transação silenciosa.',
        '#opsAfterpayEyebrow': 'Após o pagamento',
        '#opsAfterpayTitle': 'A reserva paga deve ficar sincronizada entre hóspede e equipa.',
        '#opsDeskEyebrow': 'Clareza do serviço',
        '#opsDeskTitle': 'A vista da equipa deve ler-se como um quadro vivo do serviço, não como notas dispersas.',
        '#opsCloseEyebrow': 'Encaminhamento do pedido',
        '#opsCloseTitle': 'A jornada do hóspede deve continuar clara mesmo depois do envio do formulário.',
        '#opsCloseLead': 'Um fluxo de reserva forte protege a experiência do hóspede: encaminhamento claro, confirmações rápidas e um único registo partilhado entre cliente e equipa.',
        '.final-cta-actions a:nth-child(1)': 'Abrir reserva',
        '.final-cta-actions a:nth-child(2)': 'Ver frota',
        '.final-cta-actions a:nth-child(3)': 'Ver pacotes',
        '.footer-links a[href="excellentia-vip.html"]': 'Início',
        '.footer-links a[href="excellentia-vip-packages.html"]': 'Pacotes',
        '.footer-links a[href="excellentia-vip-fleet.html"]': 'Frota',
        '.footer-brand p': 'Encaminhamento de pedidos, lógica de confirmação e follow-up pronto para o hóspede.',
        '.footer-note': 'Cada pedido deve manter os mesmos detalhes no WhatsApp, no email e no registo da reserva.'
      },
      sections: {
        flow: [
          ['Passo 1', 'O hóspede constrói o pedido', 'Serviço, rota, veículo, horário e extras são agrupados num pedido claro antes da passagem operacional.'],
          ['Passo 2', 'O pedido é encaminhado imediatamente', 'O mesmo pedido pode chegar a WhatsApp e email ao mesmo tempo para não depender de um canal frágil.'],
          ['Passo 3', 'A equipa recebe um resumo organizado', 'O resumo deve continuar legível: sem extras perdidos, sem rotas em falta, sem notas vagas.'],
          ['Passo 4', 'Depois do pagamento todos são avisados', 'Email do cliente, WhatsApp do cliente, email do operador e WhatsApp do operador devem sair da mesma reserva confirmada.']
        ],
        channels: [
          ['WhatsApp', 'Passagem rápida para o concierge', 'A mensagem deve chegar pré-preenchida com rota, veículo, pacote e extras para que a conversa continue sem fricção.'],
          ['Email', 'Resumo estruturado para cliente e operador', 'A caixa do negócio e a do operador devem receber o mesmo resumo com rota, horário, notas, extras e estado do pagamento.'],
          ['Registo da reserva', 'Histórico visível da reserva', 'Um registo partilhado deve manter legíveis para a equipa o histórico, os dados do hóspede e o estado.']
        ],
        payments: [
          ['Email do cliente', 'Resumo da reserva paga com todos os extras selecionados', 'O cliente deve receber um email limpo com serviço, rota, horário, veículo, extras, estado do pagamento e próximo passo.'],
          ['Email do operador', 'Operador ou responsável pelo serviço recebe o mesmo detalhe pago', 'O operador designado deve receber o resumo completo assim que o pagamento entra, sem cópia manual.'],
          ['WhatsApp do cliente', 'Confirmação rápida no canal natural do hóspede', 'O WhatsApp deve confirmar o pagamento, resumir o pedido e manter a conversa aberta.'],
          ['WhatsApp do operador', 'Atualização imediata para quem executa o serviço', 'O operador ou responsável deve receber um resumo estruturado com código, rota, nome do hóspede, extras da ocasião e horário.']
        ],
        afterpay: [
          ['Email do cliente', 'Resumo pago com rota, veículo, extras e próximo passo', 'O hóspede recebe um email claro com resumo do serviço, valor pago, referência da reserva e canal de resposta caso precise alterar algo.'],
          ['WhatsApp do cliente', 'Confirmação rápida com canal ativo de resposta', 'O hóspede também recebe uma confirmação curta no WhatsApp com referência da reserva, horário e um caminho direto para continuar a conversa.'],
          ['Email do coordenador ou motorista', 'Resumo operacional com todos os detalhes escolhidos', 'Quem executa o serviço recebe data, rota, número de hóspedes, notas, extras e estado do pagamento numa única mensagem legível.'],
          ['WhatsApp do coordenador ou motorista', 'Resumo móvel para execução', 'O mesmo resumo essencial é enviado por WhatsApp para que a equipa possa agir rápido sem abrir primeiro o email.']
        ],
        desk: [
          ['Fluxo voltado para o cliente', 'Elegante e premium no front end, sem dúvidas sobre o que o hóspede escolheu nem sobre o próximo passo.'],
          ['Clareza da reserva', 'O pedido deve continuar fácil de ler, confirmar e encaminhar mesmo quando a equipa alterna rápido entre inbox e WhatsApp.'],
          ['Pronto para crescer', 'A mesma estrutura pode absorver pagamentos, ferramentas de serviço e gestão mais rica sem quebrar o fluxo voltado ao hóspede.']
        ]
      }
    }
  };

  function mergeTranslation(base, patch) {
    var result = Object.assign({}, base);
    Object.keys(patch || {}).forEach(function (key) {
      var value = patch[key];
      if (Array.isArray(value)) {
        result[key] = value.slice();
      } else if (value && typeof value === 'object') {
        result[key] = Object.assign({}, base[key] || {}, value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  var localePatches = {
    ru: {
      lang: 'ru',
      title: 'Excellentia VIP | Подтверждение бронирования и координация',
      description: 'Как VIP-запрос проходит через WhatsApp, email, оплату и остается видимым для команды.',
      text: {
        '#opsUtilityText': 'Посмотрите, как один запрос превращается в реальную координацию сервиса.',
        '.brand-copy span': 'Операционный поток',
        '.nav-links a[href="excellentia-vip.html"]': 'Главная',
        '.nav-links a[href="#flow"]': 'Поток',
        '.nav-links a[href="#channels"]': 'Каналы',
        '.nav-links a[href="#payments"]': 'Платежи',
        '.nav-links a[href="#afterpay"]': 'После оплаты',
        '.nav-links a[href="#desk"]': 'Операции',
        '.nav-row > .btn.btn-primary': 'Открыть бронирование',
        '#opsHeroEyebrow': 'Подтверждение и координация',
        '#opsHeroTitle': 'VIP-запрос не должен исчезать в чате.',
        '#opsHeroLead': 'Гость должен сразу чувствовать уверенность, а команда должна видеть одну и ту же историю бронирования в email, WhatsApp и общей карточке бронирования.',
        '.hero-actions a[href="#flow"]': 'Смотреть поток',
        '.hero-actions a[href="#channels"]': 'Смотреть каналы',
        '.hero-actions a:nth-child(3)': 'Открыть бронирование',
        '.stage-pill': 'После отправки',
        '.stage-header strong': 'Что должно происходить после отправки',
        '#opsFlowEyebrow': 'Поток подтверждения',
        '#opsFlowTitle': 'Гость должен сразу понимать следующий шаг после отправки запроса.',
        '#opsChannelsEyebrow': 'Каналы координации',
        '#opsChannelsTitle': 'WhatsApp, email и общая запись бронирования должны рассказывать одну и ту же историю гостя.',
        '#channels .channel-card:nth-child(1) a': 'Открыть путь WhatsApp',
        '#channels .channel-card:nth-child(2) a': 'Открыть email-сводку',
        '#channels .channel-card:nth-child(3) a': 'Открыть конструктор заявки',
        '#opsPaymentsEyebrow': 'Оплата и уведомления',
        '#opsPaymentsTitle': 'Успешный платеж должен запускать четыре подтверждения, а не одну тихую транзакцию.',
        '#opsAfterpayEyebrow': 'После оплаты',
        '#opsAfterpayTitle': 'Оплаченное бронирование должно оставаться синхронизированным между гостем и командой.',
        '#opsDeskEyebrow': 'Сервисная ясность',
        '#opsDeskTitle': 'Внутренняя панель должна читаться как живая доска сервиса, а не как набор разрозненных заметок.',
        '#opsCloseEyebrow': 'Маршрут запроса',
        '#opsCloseTitle': 'Путь гостя должен оставаться понятным даже после отправки формы.',
        '#opsCloseLead': 'Сильная операционная часть защищает опыт гостя: понятная маршрутизация, быстрые подтверждения и одна общая запись для гостя и команды.',
        '.final-cta-actions a:nth-child(1)': 'Открыть бронирование',
        '.final-cta-actions a:nth-child(2)': 'Смотреть автопарк',
        '.final-cta-actions a:nth-child(3)': 'Смотреть пакеты',
        '.footer-links a[href="excellentia-vip.html"]': 'Главная',
        '.footer-links a[href="excellentia-vip-packages.html"]': 'Пакеты',
        '.footer-links a[href="excellentia-vip-fleet.html"]': 'Автопарк',
        '.footer-brand p': 'Маршрутизация запросов, логика подтверждения и понятное сопровождение для гостя.',
        '.footer-note': 'Каждый запрос должен сохранять одни и те же детали в WhatsApp, email и общей записи бронирования.'
      }
    },
    zh: {
      lang: 'zh',
      title: 'Excellentia VIP | 预订确认与服务协同',
      description: '查看 VIP 请求如何进入服务交接、付款跟进与运营可见性。',
      text: {
        '#opsUtilityText': '查看一个请求如何真正变成服务交接。',
        '.brand-copy span': '运营流程',
        '.nav-links a[href="excellentia-vip.html"]': '首页',
        '.nav-links a[href="#flow"]': '流程',
        '.nav-links a[href="#channels"]': '渠道',
        '.nav-links a[href="#payments"]': '支付',
        '.nav-links a[href="#afterpay"]': '付款后',
        '.nav-links a[href="#desk"]': '运营',
        '.nav-row > .btn.btn-primary': '打开预订页',
        '#opsHeroEyebrow': '确认与协同',
        '#opsHeroTitle': 'VIP 请求不应消失在聊天里。',
        '#opsHeroLead': '客人应立即感到安心，而团队也应在邮件、WhatsApp 和共享预订记录中看到同一条预订信息。',
        '.hero-actions a[href="#flow"]': '查看流程',
        '.hero-actions a[href="#channels"]': '查看渠道',
        '.hero-actions a:nth-child(3)': '打开预订页',
        '.stage-pill': '请求之后',
        '.stage-header strong': '点击发送后应该发生什么',
        '#opsFlowEyebrow': '确认流程',
        '#opsFlowTitle': '客人在发送请求后应立刻看懂下一步。',
        '#opsChannelsEyebrow': '交接渠道',
        '#opsChannelsTitle': 'WhatsApp、email 和共享预订记录必须讲同一个客人故事。',
        '#channels .channel-card:nth-child(1) a': '查看 WhatsApp 流程',
        '#channels .channel-card:nth-child(2) a': '查看 email 摘要',
        '#channels .channel-card:nth-child(3) a': '查看请求配置器',
        '#opsPaymentsEyebrow': '支付与通知',
        '#opsPaymentsTitle': '一次成功付款应触发四个确认，而不是一笔安静的交易。',
        '#opsAfterpayEyebrow': '付款后',
        '#opsAfterpayTitle': '已付款的预订应在客人与团队之间保持同步。',
        '#opsDeskEyebrow': '服务清晰度',
        '#opsDeskTitle': '团队视图应像实时服务看板，而不是零散备注。',
        '#opsCloseEyebrow': '请求路径',
        '#opsCloseTitle': '即使表单已发送，客人的旅程也应继续保持清晰。',
        '#opsCloseLead': '强有力的预订运营是在保护客户体验：清晰路由、快速确认，以及一条客人与团队共享的预订记录。',
        '.final-cta-actions a:nth-child(1)': '打开预订页',
        '.final-cta-actions a:nth-child(2)': '查看车队',
        '.final-cta-actions a:nth-child(3)': '查看套餐',
        '.footer-links a[href="excellentia-vip.html"]': '首页',
        '.footer-links a[href="excellentia-vip-packages.html"]': '套餐',
        '.footer-links a[href="excellentia-vip-fleet.html"]': '车队',
        '.footer-brand p': '请求路由、确认逻辑以及面向客人的后续跟进。',
        '.footer-note': '每个请求都应在 WhatsApp、email 和共享预订记录中保留同一份细节。'
      }
    }
  };

  Object.keys(localePatches).forEach(function (lang) {
    translations[lang] = mergeTranslation(translations.en, localePatches[lang]);
  });

  function setText(selector, value) {
    if (value == null) return;
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setCardContent(selector, cards) {
    document.querySelectorAll(selector).forEach(function (card, index) {
      var copy = cards[index];
      if (!copy) return;
      var parts = card.querySelectorAll('span, strong, p');
      if (parts[0]) parts[0].textContent = copy[0];
      if (parts[1]) parts[1].textContent = copy[1];
      if (parts[2]) parts[2].textContent = copy[2];
    });
  }

  function setCloseCards(cards) {
    document.querySelectorAll('#desk .close-card').forEach(function (card, index) {
      var copy = cards[index];
      if (!copy) return;
      var heading = card.querySelector('strong');
      var body = card.querySelector('p');
      if (heading) heading.textContent = copy[0];
      if (body) body.textContent = copy[1];
    });
  }

  function applyLanguage(lang) {
    var dict = translations[lang] || translations.en;
    document.documentElement.lang = dict.lang || 'en';
    document.title = dict.title;
    var metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', dict.description);

    Object.keys(dict.text).forEach(function (selector) {
      setText(selector, dict.text[selector]);
    });

    setCardContent('#flow .confirmation-card', dict.sections.flow);
    setCardContent('#channels .channel-card', dict.sections.channels);
    setCardContent('#payments .trust-card', dict.sections.payments);
    setCardContent('#afterpay .trust-card', dict.sections.afterpay);
    setCloseCards(dict.sections.desk);

    picker.value = translations[lang] ? lang : 'en';
    localStorage.setItem('vip_lang', picker.value);
    if (window.ExcellentiaVipSeo && typeof window.ExcellentiaVipSeo.sync === 'function') {
      window.ExcellentiaVipSeo.sync();
    }
  }

  picker.addEventListener('change', function (event) {
    applyLanguage(event.target.value);
  });

  var queryLang = '';
  try {
    queryLang = new URLSearchParams(window.location.search).get('lang') || '';
  } catch {}
  var saved = queryLang || localStorage.getItem('vip_lang');
  applyLanguage(translations[saved] ? saved : 'en');
})();
