(function () {
  var picker = document.getElementById('vipAccountLangPicker');
  if (!picker) return;

  var SUPPORTED_LANGS = ['en', 'es', 'it', 'fr', 'de', 'pt', 'ru', 'zh'];
  var PROFILE_STORAGE_KEY = 'vip_customer_profile_v1';
  var OFFER_STORAGE_KEY = 'vip_customer_offer_v1';
  var translations = {
    en: {
      lang: 'en',
      title: 'Excellentia VIP | Customer account',
      accountUtilityText: 'Secure your profile, requests, offers and follow-up in one place.',
      accountUtilityHomeLink: 'Home',
      accountUtilityBookingLink: 'Booking flow',
      accountBrandLabel: 'Customer account',
      accountNavHomeLink: 'Home',
      accountNavBookingLink: 'Booking',
      accountNavPackagesLink: 'Packages',
      accountNavFleetLink: 'Fleet',
      accountNavOperationsLink: 'Operations',
      accountPrimaryBookingCTA: 'Start request',
      accountContactStripLabel: 'Punta Cana reservations line',
      accountHeroEyebrow: 'Customer area',
      accountHeroTitle: 'One secure place for profile, requests, offers and follow-up.',
      accountHeroLead: 'Use the same email from your request to activate a magic-link account, keep your profile clean, claim approved offers and review every Excellentia VIP booking record in one place.',
      accountHeroBookingCTA: 'Open booking flow',
      accountLogoutButton: 'Clear session',
      accountStageTag: 'Account status',
      accountStageTitle: 'No password flow. Magic link only.',
      accountStageProfileLabel: 'Profile',
      accountStageProfileText: 'Country, WhatsApp, language, consent and notes stay attached to the same customer record.',
      accountStageBookingsLabel: 'Bookings',
      accountStageBookingsText: 'Requests, payment stage, offer code and timeline stay readable from one account area.',
      accountStageOffersLabel: 'Recovery',
      accountStageOffersText: 'Claim approved offers, review expiry windows and keep recovery follow-up linked to the same email.',
      accountNoticeTitle: 'Use the request email to activate your account.',
      accountNoticeLead: 'If you already clicked a magic link, this page will load your profile and bookings automatically. If not, request a secure login email below.',
      accountAccessLabel: 'Magic link access',
      accountAccessTitle: 'Send a secure login link',
      accountAccessLead: 'No password is required. Use the email tied to your request, offer or booking.',
      accountEmailLabel: 'Email',
      accountMagicLinkButton: 'Send magic link',
      accountProfileLabel: 'Profile',
      accountProfileTitle: 'Keep guest details and preferences ready',
      accountProfileLead: 'These details are reused across requests, quotes, reminders and customer follow-up.',
      accountFullNameLabel: 'Full name',
      accountCountryLabel: 'Country',
      accountWhatsappLabel: 'WhatsApp',
      accountLocaleLabel: 'Preferred language',
      accountPreferredContactLabel: 'Preferred contact',
      accountNotesLabel: 'Notes',
      accountMarketingConsentText: 'Allow recovery and promotional email follow-up.',
      accountWhatsappConsentText: 'Allow WhatsApp reminders and service follow-up.',
      accountSaveProfileButton: 'Save profile',
      accountBookingsLabel: 'Bookings',
      accountBookingsTitle: 'Requests and booking timeline',
      accountBookingsLead: 'Every request tied to your email or customer profile appears here once the session is active.',
      accountBookingsEmptyTitle: 'No bookings loaded yet.',
      accountBookingsEmptyLead: 'Activate the account with your request email to view itinerary history, payment stage and service records.',
      accountOfferLabel: 'Offer and recovery',
      accountOfferTitle: 'Claim an approved offer code',
      accountOfferLead: 'Use this only for a code sent by Excellentia VIP through the same email or approved WhatsApp follow-up.',
      accountOfferCodeLabel: 'Offer code',
      accountClaimOfferButton: 'Claim code',
      accountSummaryLabel: 'Account summary',
      accountSummaryTitle: 'What this area controls',
      accountSummaryPointOne: 'Profile, language and contact preferences stay attached to the same customer record.',
      accountSummaryPointTwo: 'Bookings show status, payment stage, route and booking code without searching through chats.',
      accountSummaryPointThree: 'Recovery offers and follow-up stay linked to the same email and consent state.',
      accountRailBookingLink: 'Open booking',
      accountRailWhatsAppLink: 'WhatsApp concierge',
      sessionGuest: 'Guest',
      sessionActive: 'Active',
      sessionPending: 'Pending',
      statusMagicSent: 'Magic link sent. Check your inbox and open the link from the same device.',
      statusMagicError: 'The magic link could not be sent right now.',
      statusProfileSaved: 'Profile updated and cached for future booking flows.',
      statusProfileError: 'Profile could not be updated.',
      statusOfferClaimed: 'Offer code claimed and linked to this account.',
      statusOfferError: 'Offer code could not be claimed.',
      statusSessionCleared: 'Session cleared from this device.',
      statusLoginRequired: 'Activate the magic-link session first.',
      statusLoading: 'Loading account data…',
      offerExpires: 'Valid until',
      offerTerms: 'Offer terms',
      bookingCode: 'Booking code',
      bookingRoute: 'Route',
      bookingDate: 'Service date',
      bookingPayment: 'Payment status',
      bookingStatus: 'Booking status',
      bookingOffer: 'Offer',
      bookingNotification: 'Notification status',
      noOffer: 'No active offer claimed yet.'
    },
    es: {
      lang: 'es',
      title: 'Excellentia VIP | Área cliente',
      accountUtilityText: 'Protege tu perfil, solicitudes, ofertas y follow-up en un solo lugar.',
      accountUtilityHomeLink: 'Inicio',
      accountUtilityBookingLink: 'Reserva',
      accountBrandLabel: 'Área cliente',
      accountNavHomeLink: 'Inicio',
      accountNavBookingLink: 'Reserva',
      accountNavPackagesLink: 'Paquetes',
      accountNavFleetLink: 'Flota',
      accountNavOperationsLink: 'Operaciones',
      accountPrimaryBookingCTA: 'Empezar solicitud',
      accountContactStripLabel: 'Línea de reservas Punta Cana',
      accountHeroEyebrow: 'Área cliente',
      accountHeroTitle: 'Un lugar seguro para perfil, solicitudes, ofertas y seguimiento.',
      accountHeroLead: 'Usa el mismo email de tu solicitud para activar una cuenta por magic link, mantener limpio tu perfil, reclamar ofertas aprobadas y revisar cada booking record de Excellentia VIP.',
      accountHeroBookingCTA: 'Abrir booking',
      accountLogoutButton: 'Borrar sesión',
      accountStageTag: 'Estado de cuenta',
      accountStageTitle: 'Sin contraseña. Solo magic link.',
      accountStageProfileLabel: 'Perfil',
      accountStageProfileText: 'País, WhatsApp, idioma, consent y notas quedan unidos al mismo registro.',
      accountStageBookingsLabel: 'Reservas',
      accountStageBookingsText: 'Solicitudes, etapa de pago, código de oferta y timeline quedan legibles desde una sola área.',
      accountStageOffersLabel: 'Recovery',
      accountStageOffersText: 'Reclama ofertas aprobadas y mantén el follow-up vinculado al mismo email.',
      accountNoticeTitle: 'Usa el email de la solicitud para activar tu cuenta.',
      accountNoticeLead: 'Si ya abriste un magic link, esta página cargará tu perfil y tus reservas automáticamente.',
      accountAccessLabel: 'Acceso magic link',
      accountAccessTitle: 'Enviar enlace seguro',
      accountAccessLead: 'No hace falta contraseña. Usa el email vinculado a tu solicitud, oferta o reserva.',
      accountEmailLabel: 'Email',
      accountMagicLinkButton: 'Enviar magic link',
      accountProfileLabel: 'Perfil',
      accountProfileTitle: 'Mantén listos los datos y preferencias del huésped',
      accountProfileLead: 'Estos datos se reutilizan en solicitudes, cotizaciones, recordatorios y follow-up.',
      accountFullNameLabel: 'Nombre completo',
      accountCountryLabel: 'País',
      accountWhatsappLabel: 'WhatsApp',
      accountLocaleLabel: 'Idioma preferido',
      accountPreferredContactLabel: 'Contacto preferido',
      accountNotesLabel: 'Notas',
      accountMarketingConsentText: 'Permitir recovery y follow-up promocional por email.',
      accountWhatsappConsentText: 'Permitir recordatorios y seguimiento por WhatsApp.',
      accountSaveProfileButton: 'Guardar perfil',
      accountBookingsLabel: 'Reservas',
      accountBookingsTitle: 'Solicitudes y timeline',
      accountBookingsLead: 'Aquí aparecerá cada solicitud vinculada a tu email o perfil cliente cuando la sesión esté activa.',
      accountBookingsEmptyTitle: 'Todavía no se han cargado reservas.',
      accountBookingsEmptyLead: 'Activa la cuenta con tu email para ver historial, estado de pago y registros del servicio.',
      accountOfferLabel: 'Oferta y recovery',
      accountOfferTitle: 'Reclamar un código aprobado',
      accountOfferLead: 'Usa esto solo para un código enviado por Excellentia VIP al mismo email o a un WhatsApp aprobado.',
      accountOfferCodeLabel: 'Código de oferta',
      accountClaimOfferButton: 'Reclamar código',
      accountSummaryLabel: 'Resumen de cuenta',
      accountSummaryTitle: 'Qué controla esta área',
      accountSummaryPointOne: 'Perfil, idioma y preferencias de contacto quedan unidos al mismo registro.',
      accountSummaryPointTwo: 'Las reservas muestran estado, etapa de pago, ruta y booking code sin buscar en chats.',
      accountSummaryPointThree: 'Las ofertas recovery y el follow-up quedan ligados al mismo email y estado de consentimiento.',
      accountRailBookingLink: 'Abrir booking',
      accountRailWhatsAppLink: 'WhatsApp concierge',
      sessionGuest: 'Invitado',
      sessionActive: 'Activa',
      sessionPending: 'Pendiente',
      statusMagicSent: 'Magic link enviado. Revisa tu inbox y abre el enlace desde este mismo dispositivo.',
      statusMagicError: 'No se pudo enviar el magic link ahora mismo.',
      statusProfileSaved: 'Perfil actualizado y guardado para futuros flujos.',
      statusProfileError: 'No se pudo actualizar el perfil.',
      statusOfferClaimed: 'Código reclamado y vinculado a esta cuenta.',
      statusOfferError: 'No se pudo reclamar el código.',
      statusSessionCleared: 'Sesión borrada de este dispositivo.',
      statusLoginRequired: 'Activa primero la sesión por magic link.',
      statusLoading: 'Cargando datos de la cuenta…',
      offerExpires: 'Válida hasta',
      offerTerms: 'Condiciones',
      bookingCode: 'Código',
      bookingRoute: 'Ruta',
      bookingDate: 'Fecha de servicio',
      bookingPayment: 'Estado de pago',
      bookingStatus: 'Estado reserva',
      bookingOffer: 'Oferta',
      bookingNotification: 'Notificaciones',
      noOffer: 'Todavía no hay una oferta activa reclamada.'
    },
    it: {
      lang: 'it',
      title: 'Excellentia VIP | Area cliente',
      accountUtilityText: 'Proteggi profilo, richieste, offerte e follow-up in un unico posto.',
      accountUtilityHomeLink: 'Home',
      accountUtilityBookingLink: 'Booking',
      accountBrandLabel: 'Area cliente',
      accountNavHomeLink: 'Home',
      accountNavBookingLink: 'Booking',
      accountNavPackagesLink: 'Pacchetti',
      accountNavFleetLink: 'Flotta',
      accountNavOperationsLink: 'Operations',
      accountPrimaryBookingCTA: 'Inizia richiesta',
      accountContactStripLabel: 'Linea prenotazioni Punta Cana',
      accountHeroEyebrow: 'Area cliente',
      accountHeroTitle: 'Un posto sicuro per profilo, richieste, offerte e follow-up.',
      accountHeroLead: 'Usa la stessa email della tua richiesta per attivare un account via magic link, tenere pulito il profilo, riscattare offerte approvate e rivedere ogni booking record di Excellentia VIP.',
      accountHeroBookingCTA: 'Apri booking',
      accountLogoutButton: 'Pulisci sessione',
      accountStageTag: 'Stato account',
      accountStageTitle: 'Niente password. Solo magic link.',
      accountStageProfileLabel: 'Profilo',
      accountStageProfileText: 'Paese, WhatsApp, lingua, consensi e note restano legati allo stesso record.',
      accountStageBookingsLabel: 'Prenotazioni',
      accountStageBookingsText: 'Richieste, stato pagamento, codice offerta e timeline restano leggibili da un unico punto.',
      accountStageOffersLabel: 'Recovery',
      accountStageOffersText: 'Riscatta offerte approvate e mantieni il follow-up legato alla stessa email.',
      accountNoticeTitle: 'Usa l’email della richiesta per attivare l’account.',
      accountNoticeLead: 'Se hai già aperto un magic link, questa pagina caricherà profilo e prenotazioni automaticamente.',
      accountAccessLabel: 'Accesso magic link',
      accountAccessTitle: 'Invia link sicuro',
      accountAccessLead: 'Non serve password. Usa l’email legata a richiesta, offerta o prenotazione.',
      accountEmailLabel: 'Email',
      accountMagicLinkButton: 'Invia magic link',
      accountProfileLabel: 'Profilo',
      accountProfileTitle: 'Tieni pronti dati e preferenze ospite',
      accountProfileLead: 'Questi dati vengono riusati tra richieste, quote, reminder e follow-up cliente.',
      accountFullNameLabel: 'Nome completo',
      accountCountryLabel: 'Paese',
      accountWhatsappLabel: 'WhatsApp',
      accountLocaleLabel: 'Lingua preferita',
      accountPreferredContactLabel: 'Contatto preferito',
      accountNotesLabel: 'Note',
      accountMarketingConsentText: 'Permetti recovery e follow-up promozionale via email.',
      accountWhatsappConsentText: 'Permetti reminder e follow-up via WhatsApp.',
      accountSaveProfileButton: 'Salva profilo',
      accountBookingsLabel: 'Prenotazioni',
      accountBookingsTitle: 'Richieste e timeline',
      accountBookingsLead: 'Qui comparirà ogni richiesta legata alla tua email o al profilo cliente quando la sessione è attiva.',
      accountBookingsEmptyTitle: 'Nessuna prenotazione caricata.',
      accountBookingsEmptyLead: 'Attiva l’account con la tua email per vedere storico, stato pagamento e record di servizio.',
      accountOfferLabel: 'Offerta e recovery',
      accountOfferTitle: 'Riscatta un codice approvato',
      accountOfferLead: 'Usa questo solo per un codice inviato da Excellentia VIP sulla stessa email o su un WhatsApp approvato.',
      accountOfferCodeLabel: 'Codice offerta',
      accountClaimOfferButton: 'Riscatta codice',
      accountSummaryLabel: 'Riepilogo account',
      accountSummaryTitle: 'Cosa controlla quest’area',
      accountSummaryPointOne: 'Profilo, lingua e preferenze contatto restano sullo stesso record cliente.',
      accountSummaryPointTwo: 'Le prenotazioni mostrano stato, fase pagamento, tratta e booking code senza cercare nelle chat.',
      accountSummaryPointThree: 'Offerte recovery e follow-up restano collegati alla stessa email e allo stato consensi.',
      accountRailBookingLink: 'Apri booking',
      accountRailWhatsAppLink: 'WhatsApp concierge',
      sessionGuest: 'Ospite',
      sessionActive: 'Attiva',
      sessionPending: 'Pending',
      statusMagicSent: 'Magic link inviato. Controlla la inbox e apri il link da questo dispositivo.',
      statusMagicError: 'Non è stato possibile inviare il magic link adesso.',
      statusProfileSaved: 'Profilo aggiornato e salvato per i prossimi flussi.',
      statusProfileError: 'Non è stato possibile aggiornare il profilo.',
      statusOfferClaimed: 'Codice riscattato e collegato a questo account.',
      statusOfferError: 'Non è stato possibile riscattare il codice.',
      statusSessionCleared: 'Sessione rimossa da questo dispositivo.',
      statusLoginRequired: 'Attiva prima la sessione con magic link.',
      statusLoading: 'Caricamento dati account…',
      offerExpires: 'Valida fino a',
      offerTerms: 'Termini',
      bookingCode: 'Codice booking',
      bookingRoute: 'Tratta',
      bookingDate: 'Data servizio',
      bookingPayment: 'Stato pagamento',
      bookingStatus: 'Stato booking',
      bookingOffer: 'Offerta',
      bookingNotification: 'Notifiche',
      noOffer: 'Nessuna offerta attiva riscattata.'
    }
  };

  translations.fr = Object.assign({}, translations.en, {
    lang: 'fr',
    title: 'Excellentia VIP | Espace client',
    accountUtilityText: 'Centralisez profil, demandes, offres et suivi dans un espace securise.',
    accountUtilityHomeLink: 'Accueil',
    accountUtilityBookingLink: 'Reservation',
    accountBrandLabel: 'Espace client',
    accountNavHomeLink: 'Accueil',
    accountNavBookingLink: 'Reservation',
    accountNavPackagesLink: 'Formules',
    accountNavFleetLink: 'Flotte',
    accountNavOperationsLink: 'Operations',
    accountPrimaryBookingCTA: 'Commencer la demande',
    accountContactStripLabel: 'Ligne reservations Punta Cana',
    accountHeroEyebrow: 'Espace client',
    accountHeroTitle: 'Un espace securise pour le profil, les demandes, les offres et le suivi.',
    accountHeroLead: 'Utilisez la meme adresse email que votre demande pour activer un acces par lien magique, garder votre profil propre, demander une offre approuvee et revoir chaque dossier Excellentia VIP au meme endroit.',
    accountHeroBookingCTA: 'Ouvrir le booking',
    accountLogoutButton: 'Effacer la session',
    accountStageTag: 'Etat du compte',
    accountStageTitle: 'Aucun mot de passe. Lien magique uniquement.',
    accountStageProfileLabel: 'Profil',
    accountStageProfileText: 'Pays, WhatsApp, langue, consentements et notes restent attaches au meme dossier client.',
    accountStageBookingsLabel: 'Reservations',
    accountStageBookingsText: 'Demandes, etape de paiement, code offre et timeline restent lisibles dans un seul espace.',
    accountStageOffersLabel: 'Recovery',
    accountStageOffersText: 'Activez les offres approuvees, verifiez leur expiration et gardez le suivi rattache a la meme adresse email.',
    accountNoticeTitle: 'Utilisez l’email de la demande pour activer votre compte.',
    accountNoticeLead: 'Si vous avez deja ouvert un lien magique, cette page chargera automatiquement votre profil et vos reservations. Sinon, demandez un email de connexion securise ci-dessous.',
    accountAccessLabel: 'Acces par lien magique',
    accountAccessTitle: 'Envoyer un lien de connexion securise',
    accountAccessLead: 'Aucun mot de passe n’est requis. Utilisez l’email lie a votre demande, votre offre ou votre reservation.',
    accountEmailLabel: 'Email',
    accountMagicLinkButton: 'Envoyer le lien magique',
    accountProfileLabel: 'Profil',
    accountProfileTitle: 'Gardez les details et preferences du client prets',
    accountProfileLead: 'Ces informations sont reutilisees pour les demandes, devis, rappels et le suivi client.',
    accountFullNameLabel: 'Nom complet',
    accountCountryLabel: 'Pays',
    accountWhatsappLabel: 'WhatsApp',
    accountLocaleLabel: 'Langue preferee',
    accountPreferredContactLabel: 'Canal prefere',
    accountNotesLabel: 'Notes',
    accountMarketingConsentText: 'Autoriser les emails promotionnels et de recovery.',
    accountWhatsappConsentText: 'Autoriser les rappels et le suivi de service par WhatsApp.',
    accountSaveProfileButton: 'Enregistrer le profil',
    accountBookingsLabel: 'Reservations',
    accountBookingsTitle: 'Demandes et timeline',
    accountBookingsLead: 'Chaque demande liee a votre email ou a votre profil client apparait ici une fois la session active.',
    accountBookingsEmptyTitle: 'Aucune reservation chargee pour le moment.',
    accountBookingsEmptyLead: 'Activez le compte avec votre email de demande pour voir l’historique, l’etape de paiement et les dossiers de service.',
    accountOfferLabel: 'Offre et recovery',
    accountOfferTitle: 'Activer un code approuve',
    accountOfferLead: 'Utilisez ceci uniquement pour un code envoye par Excellentia VIP via la meme adresse email ou un suivi WhatsApp approuve.',
    accountOfferCodeLabel: 'Code offre',
    accountClaimOfferButton: 'Activer le code',
    accountSummaryLabel: 'Resume du compte',
    accountSummaryTitle: 'Ce que gere cet espace',
    accountSummaryPointOne: 'Le profil, la langue et les preferences de contact restent relies au meme dossier client.',
    accountSummaryPointTwo: 'Les reservations affichent le statut, l’etape de paiement, le trajet et le code sans devoir chercher dans les conversations.',
    accountSummaryPointThree: 'Les offres recovery et le suivi restent relies a la meme adresse email et au meme etat de consentement.',
    accountRailBookingLink: 'Ouvrir le booking',
    accountRailWhatsAppLink: 'WhatsApp concierge',
    sessionGuest: 'Invite',
    sessionActive: 'Active',
    sessionPending: 'En attente',
    statusMagicSent: 'Lien magique envoye. Verifiez votre boite de reception et ouvrez le lien depuis ce meme appareil.',
    statusMagicError: 'Le lien magique n’a pas pu etre envoye pour le moment.',
    statusProfileSaved: 'Profil mis a jour et memorise pour les prochains parcours.',
    statusProfileError: 'Le profil n’a pas pu etre mis a jour.',
    statusOfferClaimed: 'Code offre active et lie a ce compte.',
    statusOfferError: 'Le code offre n’a pas pu etre active.',
    statusSessionCleared: 'Session supprimee sur cet appareil.',
    statusLoginRequired: 'Activez d’abord la session par lien magique.',
    statusLoading: 'Chargement des donnees du compte…',
    offerExpires: 'Valable jusqu’au',
    offerTerms: 'Conditions',
    bookingCode: 'Code reservation',
    bookingRoute: 'Trajet',
    bookingDate: 'Date du service',
    bookingPayment: 'Etat du paiement',
    bookingStatus: 'Statut reservation',
    bookingOffer: 'Offre',
    bookingNotification: 'Notifications',
    noOffer: 'Aucune offre active n’a encore ete activee.'
  });

  translations.de = Object.assign({}, translations.en, {
    lang: 'de',
    title: 'Excellentia VIP | Kundenbereich',
    accountUtilityText: 'Profil, Anfragen, Angebote und Follow-up an einem sicheren Ort verwalten.',
    accountUtilityHomeLink: 'Start',
    accountUtilityBookingLink: 'Buchung',
    accountBrandLabel: 'Kundenbereich',
    accountNavHomeLink: 'Start',
    accountNavBookingLink: 'Buchung',
    accountNavPackagesLink: 'Pakete',
    accountNavFleetLink: 'Flotte',
    accountNavOperationsLink: 'Ablauf',
    accountPrimaryBookingCTA: 'Anfrage starten',
    accountContactStripLabel: 'Reservierungslinie Punta Cana',
    accountHeroEyebrow: 'Kundenbereich',
    accountHeroTitle: 'Ein sicherer Bereich fur Profil, Anfragen, Angebote und Follow-up.',
    accountHeroLead: 'Verwenden Sie dieselbe Email wie bei Ihrer Anfrage, um einen Magic-Link-Zugang zu aktivieren, Ihr Profil sauber zu halten, freigegebene Angebote zu nutzen und jeden Excellentia VIP Vorgang an einem Ort zu sehen.',
    accountHeroBookingCTA: 'Booking offnen',
    accountLogoutButton: 'Sitzung loschen',
    accountStageTag: 'Kontostatus',
    accountStageTitle: 'Kein Passwort. Nur Magic Link.',
    accountStageProfileLabel: 'Profil',
    accountStageProfileText: 'Land, WhatsApp, Sprache, Einwilligungen und Notizen bleiben mit demselben Kundendatensatz verknupft.',
    accountStageBookingsLabel: 'Buchungen',
    accountStageBookingsText: 'Anfragen, Zahlungsstatus, Angebotscode und Timeline bleiben in einem Bereich lesbar.',
    accountStageOffersLabel: 'Recovery',
    accountStageOffersText: 'Freigegebene Angebote einlosen, Ablaufzeiten prufen und Follow-up mit derselben Email verknupft halten.',
    accountNoticeTitle: 'Nutzen Sie die Anfrage-Email, um Ihr Konto zu aktivieren.',
    accountNoticeLead: 'Wenn Sie bereits einen Magic Link geoffnet haben, ladt diese Seite Ihr Profil und Ihre Buchungen automatisch. Andernfalls fordern Sie unten eine sichere Login-Email an.',
    accountAccessLabel: 'Magic-Link-Zugang',
    accountAccessTitle: 'Sicheren Login-Link senden',
    accountAccessLead: 'Es ist kein Passwort erforderlich. Verwenden Sie die Email zu Ihrer Anfrage, Ihrem Angebot oder Ihrer Buchung.',
    accountEmailLabel: 'Email',
    accountMagicLinkButton: 'Magic Link senden',
    accountProfileLabel: 'Profil',
    accountProfileTitle: 'Gastdaten und Praferenzen bereithalten',
    accountProfileLead: 'Diese Details werden fur Anfragen, Angebote, Erinnerungen und Kundennachverfolgung wiederverwendet.',
    accountFullNameLabel: 'Vollstandiger Name',
    accountCountryLabel: 'Land',
    accountWhatsappLabel: 'WhatsApp',
    accountLocaleLabel: 'Bevorzugte Sprache',
    accountPreferredContactLabel: 'Bevorzugter Kontaktweg',
    accountNotesLabel: 'Notizen',
    accountMarketingConsentText: 'Recovery- und Werbe-Emails erlauben.',
    accountWhatsappConsentText: 'WhatsApp-Erinnerungen und Service-Follow-up erlauben.',
    accountSaveProfileButton: 'Profil speichern',
    accountBookingsLabel: 'Buchungen',
    accountBookingsTitle: 'Anfragen und Timeline',
    accountBookingsLead: 'Jede Anfrage, die mit Ihrer Email oder Ihrem Kundenprofil verknupft ist, erscheint hier, sobald die Sitzung aktiv ist.',
    accountBookingsEmptyTitle: 'Noch keine Buchungen geladen.',
    accountBookingsEmptyLead: 'Aktivieren Sie das Konto mit Ihrer Anfrage-Email, um Verlauf, Zahlungsstatus und Service-Datensatze zu sehen.',
    accountOfferLabel: 'Angebot und Recovery',
    accountOfferTitle: 'Freigegebenen Code einlosen',
    accountOfferLead: 'Nur fur einen Code verwenden, den Excellentia VIP an dieselbe Email oder per freigegebenem WhatsApp-Follow-up gesendet hat.',
    accountOfferCodeLabel: 'Angebotscode',
    accountClaimOfferButton: 'Code einlosen',
    accountSummaryLabel: 'Kontoubersicht',
    accountSummaryTitle: 'Was dieser Bereich steuert',
    accountSummaryPointOne: 'Profil, Sprache und Kontaktpraferenzen bleiben mit demselben Kundendatensatz verbunden.',
    accountSummaryPointTwo: 'Buchungen zeigen Status, Zahlungsphase, Route und Buchungscode, ohne Chats durchsuchen zu mussen.',
    accountSummaryPointThree: 'Recovery-Angebote und Follow-up bleiben mit derselben Email und demselben Einwilligungsstatus verknupft.',
    accountRailBookingLink: 'Booking offnen',
    accountRailWhatsAppLink: 'WhatsApp concierge',
    sessionGuest: 'Gast',
    sessionActive: 'Aktiv',
    sessionPending: 'Ausstehend',
    statusMagicSent: 'Magic Link gesendet. Prufen Sie Ihr Postfach und offnen Sie den Link auf demselben Gerat.',
    statusMagicError: 'Der Magic Link konnte gerade nicht gesendet werden.',
    statusProfileSaved: 'Profil aktualisiert und fur zukunftige Ablaufe zwischengespeichert.',
    statusProfileError: 'Profil konnte nicht aktualisiert werden.',
    statusOfferClaimed: 'Angebotscode eingelost und diesem Konto zugeordnet.',
    statusOfferError: 'Angebotscode konnte nicht eingelost werden.',
    statusSessionCleared: 'Sitzung auf diesem Gerat entfernt.',
    statusLoginRequired: 'Aktivieren Sie zuerst die Magic-Link-Sitzung.',
    statusLoading: 'Kontodaten werden geladen…',
    offerExpires: 'Gultig bis',
    offerTerms: 'Bedingungen',
    bookingCode: 'Buchungscode',
    bookingRoute: 'Route',
    bookingDate: 'Servicedatum',
    bookingPayment: 'Zahlungsstatus',
    bookingStatus: 'Buchungsstatus',
    bookingOffer: 'Angebot',
    bookingNotification: 'Benachrichtigungen',
    noOffer: 'Noch kein aktives Angebot fur dieses Konto eingelost.'
  });

  translations.pt = Object.assign({}, translations.en, {
    lang: 'pt',
    title: 'Excellentia VIP | Area do cliente',
    accountUtilityText: 'Centralize perfil, pedidos, ofertas e follow-up em um unico lugar seguro.',
    accountUtilityHomeLink: 'Inicio',
    accountUtilityBookingLink: 'Reserva',
    accountBrandLabel: 'Area do cliente',
    accountNavHomeLink: 'Inicio',
    accountNavBookingLink: 'Reserva',
    accountNavPackagesLink: 'Pacotes',
    accountNavFleetLink: 'Frota',
    accountNavOperationsLink: 'Operacoes',
    accountPrimaryBookingCTA: 'Iniciar pedido',
    accountContactStripLabel: 'Linha de reservas Punta Cana',
    accountHeroEyebrow: 'Area do cliente',
    accountHeroTitle: 'Um lugar seguro para perfil, pedidos, ofertas e acompanhamento.',
    accountHeroLead: 'Use o mesmo email do seu pedido para ativar um acesso por link magico, manter o perfil organizado, resgatar ofertas aprovadas e revisar cada registro Excellentia VIP no mesmo painel.',
    accountHeroBookingCTA: 'Abrir booking',
    accountLogoutButton: 'Limpar sessao',
    accountStageTag: 'Status da conta',
    accountStageTitle: 'Sem senha. Apenas link magico.',
    accountStageProfileLabel: 'Perfil',
    accountStageProfileText: 'Pais, WhatsApp, idioma, consentimentos e notas ficam ligados ao mesmo registro do cliente.',
    accountStageBookingsLabel: 'Reservas',
    accountStageBookingsText: 'Pedidos, etapa de pagamento, codigo de oferta e timeline ficam visiveis em uma unica area.',
    accountStageOffersLabel: 'Recovery',
    accountStageOffersText: 'Resgate ofertas aprovadas, acompanhe validade e mantenha o follow-up ligado ao mesmo email.',
    accountNoticeTitle: 'Use o email do pedido para ativar sua conta.',
    accountNoticeLead: 'Se voce ja abriu um link magico, esta pagina carregara seu perfil e suas reservas automaticamente. Caso contrario, solicite abaixo um email de acesso seguro.',
    accountAccessLabel: 'Acesso por link magico',
    accountAccessTitle: 'Enviar link de acesso seguro',
    accountAccessLead: 'Nao e necessaria senha. Use o email ligado ao seu pedido, oferta ou reserva.',
    accountEmailLabel: 'Email',
    accountMagicLinkButton: 'Enviar link magico',
    accountProfileLabel: 'Perfil',
    accountProfileTitle: 'Mantenha dados e preferencias do hospede prontos',
    accountProfileLead: 'Esses dados sao reutilizados em pedidos, cotacoes, lembretes e follow-up do cliente.',
    accountFullNameLabel: 'Nome completo',
    accountCountryLabel: 'Pais',
    accountWhatsappLabel: 'WhatsApp',
    accountLocaleLabel: 'Idioma preferido',
    accountPreferredContactLabel: 'Contato preferido',
    accountNotesLabel: 'Notas',
    accountMarketingConsentText: 'Permitir recovery e follow-up promocional por email.',
    accountWhatsappConsentText: 'Permitir lembretes e follow-up de servico por WhatsApp.',
    accountSaveProfileButton: 'Salvar perfil',
    accountBookingsLabel: 'Reservas',
    accountBookingsTitle: 'Pedidos e timeline',
    accountBookingsLead: 'Todo pedido vinculado ao seu email ou perfil aparece aqui quando a sessao estiver ativa.',
    accountBookingsEmptyTitle: 'Nenhuma reserva carregada ainda.',
    accountBookingsEmptyLead: 'Ative a conta com o email do seu pedido para ver historico, etapa de pagamento e registros de servico.',
    accountOfferLabel: 'Oferta e recovery',
    accountOfferTitle: 'Resgatar um codigo aprovado',
    accountOfferLead: 'Use isto apenas para um codigo enviado pela Excellentia VIP para o mesmo email ou por um follow-up aprovado no WhatsApp.',
    accountOfferCodeLabel: 'Codigo da oferta',
    accountClaimOfferButton: 'Resgatar codigo',
    accountSummaryLabel: 'Resumo da conta',
    accountSummaryTitle: 'O que esta area controla',
    accountSummaryPointOne: 'Perfil, idioma e preferencias de contato permanecem ligados ao mesmo registro do cliente.',
    accountSummaryPointTwo: 'As reservas mostram status, etapa de pagamento, rota e codigo sem precisar procurar em conversas.',
    accountSummaryPointThree: 'Ofertas recovery e follow-up permanecem ligadas ao mesmo email e ao mesmo estado de consentimento.',
    accountRailBookingLink: 'Abrir booking',
    accountRailWhatsAppLink: 'WhatsApp concierge',
    sessionGuest: 'Convidado',
    sessionActive: 'Ativa',
    sessionPending: 'Pendente',
    statusMagicSent: 'Link magico enviado. Verifique sua caixa de entrada e abra o link neste mesmo dispositivo.',
    statusMagicError: 'Nao foi possivel enviar o link magico agora.',
    statusProfileSaved: 'Perfil atualizado e salvo para os proximos fluxos.',
    statusProfileError: 'Nao foi possivel atualizar o perfil.',
    statusOfferClaimed: 'Codigo resgatado e vinculado a esta conta.',
    statusOfferError: 'Nao foi possivel resgatar o codigo.',
    statusSessionCleared: 'Sessao removida deste dispositivo.',
    statusLoginRequired: 'Ative primeiro a sessao por link magico.',
    statusLoading: 'Carregando dados da conta…',
    offerExpires: 'Valido ate',
    offerTerms: 'Termos',
    bookingCode: 'Codigo da reserva',
    bookingRoute: 'Rota',
    bookingDate: 'Data do servico',
    bookingPayment: 'Status do pagamento',
    bookingStatus: 'Status da reserva',
    bookingOffer: 'Oferta',
    bookingNotification: 'Notificacoes',
    noOffer: 'Nenhuma oferta ativa foi resgatada ainda.'
  });

  translations.ru = Object.assign({}, translations.en, {
    lang: 'ru',
    title: 'Excellentia VIP | Личный кабинет',
    accountUtilityText: 'Профиль, запросы, предложения и follow-up в одном защищенном месте.',
    accountUtilityHomeLink: 'Главная',
    accountUtilityBookingLink: 'Бронирование',
    accountBrandLabel: 'Личный кабинет',
    accountNavHomeLink: 'Главная',
    accountNavBookingLink: 'Бронирование',
    accountNavPackagesLink: 'Пакеты',
    accountNavFleetLink: 'Автопарк',
    accountNavOperationsLink: 'Операции',
    accountPrimaryBookingCTA: 'Начать запрос',
    accountContactStripLabel: 'Линия бронирования Punta Cana',
    accountHeroEyebrow: 'Личный кабинет',
    accountHeroTitle: 'Защищенное место для профиля, запросов, предложений и сопровождения.',
    accountHeroLead: 'Используйте тот же email, что и в вашем запросе, чтобы активировать вход по magic link, держать профиль в порядке, получать одобренные предложения и видеть все записи Excellentia VIP в одном месте.',
    accountHeroBookingCTA: 'Открыть booking',
    accountLogoutButton: 'Очистить сессию',
    accountStageTag: 'Статус аккаунта',
    accountStageTitle: 'Без пароля. Только magic link.',
    accountStageProfileLabel: 'Профиль',
    accountStageProfileText: 'Страна, WhatsApp, язык, согласия и заметки остаются привязанными к одному клиентскому профилю.',
    accountStageBookingsLabel: 'Бронирования',
    accountStageBookingsText: 'Запросы, этап оплаты, код предложения и timeline видны в одном кабинете.',
    accountStageOffersLabel: 'Recovery',
    accountStageOffersText: 'Активируйте одобренные предложения, проверяйте срок действия и сохраняйте follow-up на том же email.',
    accountNoticeTitle: 'Используйте email из запроса, чтобы активировать аккаунт.',
    accountNoticeLead: 'Если вы уже открывали magic link, эта страница автоматически загрузит профиль и бронирования. Иначе запросите ниже безопасную ссылку для входа.',
    accountAccessLabel: 'Доступ по magic link',
    accountAccessTitle: 'Отправить безопасную ссылку для входа',
    accountAccessLead: 'Пароль не нужен. Используйте email, связанный с вашим запросом, предложением или бронированием.',
    accountEmailLabel: 'Email',
    accountMagicLinkButton: 'Отправить magic link',
    accountProfileLabel: 'Профиль',
    accountProfileTitle: 'Держите данные и предпочтения гостя готовыми',
    accountProfileLead: 'Эти данные повторно используются в запросах, предложениях, напоминаниях и клиентском follow-up.',
    accountFullNameLabel: 'Полное имя',
    accountCountryLabel: 'Страна',
    accountWhatsappLabel: 'WhatsApp',
    accountLocaleLabel: 'Предпочитаемый язык',
    accountPreferredContactLabel: 'Предпочитаемый канал',
    accountNotesLabel: 'Заметки',
    accountMarketingConsentText: 'Разрешить recovery и промо follow-up по email.',
    accountWhatsappConsentText: 'Разрешить напоминания и сервисный follow-up по WhatsApp.',
    accountSaveProfileButton: 'Сохранить профиль',
    accountBookingsLabel: 'Бронирования',
    accountBookingsTitle: 'Запросы и timeline',
    accountBookingsLead: 'Каждый запрос, связанный с вашим email или профилем клиента, появится здесь после активации сессии.',
    accountBookingsEmptyTitle: 'Бронирования пока не загружены.',
    accountBookingsEmptyLead: 'Активируйте аккаунт через email из запроса, чтобы видеть историю, этап оплаты и сервисные записи.',
    accountOfferLabel: 'Предложение и recovery',
    accountOfferTitle: 'Активировать одобренный код',
    accountOfferLead: 'Используйте это только для кода, отправленного Excellentia VIP на тот же email или в одобренный WhatsApp follow-up.',
    accountOfferCodeLabel: 'Код предложения',
    accountClaimOfferButton: 'Активировать код',
    accountSummaryLabel: 'Сводка аккаунта',
    accountSummaryTitle: 'Что контролирует этот раздел',
    accountSummaryPointOne: 'Профиль, язык и контактные предпочтения остаются привязанными к одному клиентскому профилю.',
    accountSummaryPointTwo: 'Бронирования показывают статус, этап оплаты, маршрут и код без поиска по чатам.',
    accountSummaryPointThree: 'Recovery-предложения и follow-up остаются связаны с тем же email и статусом согласия.',
    accountRailBookingLink: 'Открыть booking',
    accountRailWhatsAppLink: 'WhatsApp concierge',
    sessionGuest: 'Гость',
    sessionActive: 'Активна',
    sessionPending: 'В ожидании',
    statusMagicSent: 'Magic link отправлен. Проверьте почту и откройте ссылку на этом же устройстве.',
    statusMagicError: 'Сейчас не удалось отправить magic link.',
    statusProfileSaved: 'Профиль обновлен и сохранен для следующих сценариев.',
    statusProfileError: 'Не удалось обновить профиль.',
    statusOfferClaimed: 'Код активирован и привязан к этому аккаунту.',
    statusOfferError: 'Не удалось активировать код.',
    statusSessionCleared: 'Сессия удалена с этого устройства.',
    statusLoginRequired: 'Сначала активируйте сессию через magic link.',
    statusLoading: 'Загрузка данных аккаунта…',
    offerExpires: 'Действует до',
    offerTerms: 'Условия',
    bookingCode: 'Код бронирования',
    bookingRoute: 'Маршрут',
    bookingDate: 'Дата услуги',
    bookingPayment: 'Статус оплаты',
    bookingStatus: 'Статус бронирования',
    bookingOffer: 'Предложение',
    bookingNotification: 'Уведомления',
    noOffer: 'Для этого аккаунта пока нет активированного предложения.'
  });

  translations.zh = Object.assign({}, translations.en, {
    lang: 'zh',
    title: 'Excellentia VIP | 客户账户',
    accountUtilityText: '在一个安全区域内管理个人资料、请求、优惠和后续跟进。',
    accountUtilityHomeLink: '首页',
    accountUtilityBookingLink: '预订',
    accountBrandLabel: '客户账户',
    accountNavHomeLink: '首页',
    accountNavBookingLink: '预订',
    accountNavPackagesLink: '套餐',
    accountNavFleetLink: '车队',
    accountNavOperationsLink: '运营',
    accountPrimaryBookingCTA: '开始请求',
    accountContactStripLabel: 'Punta Cana 预订热线',
    accountHeroEyebrow: '客户区域',
    accountHeroTitle: '一个安全区域，用于管理资料、请求、优惠和跟进。',
    accountHeroLead: '使用与请求相同的邮箱激活 magic link 登录，保持资料整洁，领取已批准的优惠，并在同一页面查看每一条 Excellentia VIP 记录。',
    accountHeroBookingCTA: '打开 booking',
    accountLogoutButton: '清除会话',
    accountStageTag: '账户状态',
    accountStageTitle: '无需密码，仅使用 magic link。',
    accountStageProfileLabel: '资料',
    accountStageProfileText: '国家、WhatsApp、语言、同意状态和备注都会保留在同一客户记录中。',
    accountStageBookingsLabel: '预订',
    accountStageBookingsText: '请求、付款阶段、优惠代码和时间线都会在同一账户区域中清晰可见。',
    accountStageOffersLabel: 'Recovery',
    accountStageOffersText: '领取已批准的优惠，查看有效期，并让跟进始终绑定到同一邮箱。',
    accountNoticeTitle: '请使用请求时的邮箱激活账户。',
    accountNoticeLead: '如果您已经打开过 magic link，此页面会自动加载您的资料和预订。否则，请在下方申请安全登录邮件。',
    accountAccessLabel: 'Magic link 登录',
    accountAccessTitle: '发送安全登录链接',
    accountAccessLead: '无需密码。请使用与请求、优惠或预订关联的邮箱。',
    accountEmailLabel: '邮箱',
    accountMagicLinkButton: '发送 magic link',
    accountProfileLabel: '资料',
    accountProfileTitle: '提前准备好客人资料和偏好',
    accountProfileLead: '这些信息会在请求、报价、提醒和客户跟进中重复使用。',
    accountFullNameLabel: '姓名',
    accountCountryLabel: '国家',
    accountWhatsappLabel: 'WhatsApp',
    accountLocaleLabel: '首选语言',
    accountPreferredContactLabel: '首选联系渠道',
    accountNotesLabel: '备注',
    accountMarketingConsentText: '允许促销邮件和 recovery 跟进。',
    accountWhatsappConsentText: '允许通过 WhatsApp 发送提醒和服务跟进。',
    accountSaveProfileButton: '保存资料',
    accountBookingsLabel: '预订',
    accountBookingsTitle: '请求与时间线',
    accountBookingsLead: '一旦会话激活，所有与您的邮箱或客户资料关联的请求都会显示在这里。',
    accountBookingsEmptyTitle: '当前还没有已加载的预订。',
    accountBookingsEmptyLead: '请使用请求邮箱激活账户，以查看历史、付款阶段和服务记录。',
    accountOfferLabel: '优惠与 recovery',
    accountOfferTitle: '领取已批准的代码',
    accountOfferLead: '仅当 Excellentia VIP 通过同一邮箱或已批准的 WhatsApp 跟进发送代码时才使用此功能。',
    accountOfferCodeLabel: '优惠代码',
    accountClaimOfferButton: '领取代码',
    accountSummaryLabel: '账户摘要',
    accountSummaryTitle: '此区域管理的内容',
    accountSummaryPointOne: '资料、语言和联系偏好会保留在同一客户记录中。',
    accountSummaryPointTwo: '预订会显示状态、付款阶段、路线和预订代码，无需翻找聊天记录。',
    accountSummaryPointThree: 'Recovery 优惠和跟进会始终绑定到同一邮箱和同意状态。',
    accountRailBookingLink: '打开 booking',
    accountRailWhatsAppLink: 'WhatsApp concierge',
    sessionGuest: '访客',
    sessionActive: '已激活',
    sessionPending: '待处理',
    statusMagicSent: 'Magic link 已发送。请检查收件箱，并在同一设备上打开链接。',
    statusMagicError: '当前无法发送 magic link。',
    statusProfileSaved: '资料已更新，并已为后续流程保存。',
    statusProfileError: '无法更新资料。',
    statusOfferClaimed: '优惠代码已领取并绑定到此账户。',
    statusOfferError: '无法领取优惠代码。',
    statusSessionCleared: '此设备上的会话已清除。',
    statusLoginRequired: '请先通过 magic link 激活会话。',
    statusLoading: '正在加载账户数据…',
    offerExpires: '有效期至',
    offerTerms: '条款',
    bookingCode: '预订代码',
    bookingRoute: '路线',
    bookingDate: '服务日期',
    bookingPayment: '付款状态',
    bookingStatus: '预订状态',
    bookingOffer: '优惠',
    bookingNotification: '通知状态',
    noOffer: '当前还没有已领取的有效优惠。'
  });

  Object.keys(translations.en).forEach(function (key) {
    if (key === 'lang' || key === 'title') return;
    ['fr', 'de', 'pt', 'ru', 'zh'].forEach(function (lang) {
      if (!translations[lang]) translations[lang] = { lang: lang, title: translations.en.title };
      if (!translations[lang][key]) translations[lang][key] = translations.en[key];
    });
  });

  function byId(id) {
    return document.getElementById(id);
  }

  function currentLang() {
    try {
      var queryLang = new URLSearchParams(window.location.search).get('lang');
      if (queryLang && SUPPORTED_LANGS.indexOf(queryLang) !== -1) return queryLang;
    } catch (error) {}
    try {
      var saved = window.localStorage.getItem('vip_lang');
      if (saved && SUPPORTED_LANGS.indexOf(saved) !== -1) return saved;
    } catch (error) {}
    return 'en';
  }

  function copy() {
    return translations[currentLang()] || translations.en;
  }

  function syncCurrentUrl(lang) {
    if (!window.history || typeof window.history.replaceState !== 'function') return;
    try {
      var url = new URL(window.location.href);
      if (lang === 'en') url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    } catch (error) {}
  }

  function syncLocalizedAnchors(lang) {
    document.querySelectorAll('a[href]').forEach(function (anchor) {
      var rawHref = anchor.getAttribute('href');
      if (!rawHref) return;
      if (
        rawHref.charAt(0) === '#' ||
        rawHref.indexOf('mailto:') === 0 ||
        rawHref.indexOf('tel:') === 0 ||
        rawHref.indexOf('http://') === 0 ||
        rawHref.indexOf('https://') === 0 ||
        rawHref.indexOf('//') === 0
      ) {
        return;
      }

      try {
        var url = new URL(rawHref, window.location.href);
        if (!/excellentia-vip(?:-[a-z]+)?\.html$/i.test(url.pathname)) return;
        if (lang === 'en') url.searchParams.delete('lang');
        else url.searchParams.set('lang', lang);
        anchor.setAttribute('href', url.pathname.replace(/^\//, '') + url.search + url.hash);
      } catch (error) {}
    });
  }

  function storage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function accountConfig() {
    var raw = window.CDS_CONFIG && window.CDS_CONFIG.vipAccount ? window.CDS_CONFIG.vipAccount : {};
    return {
      profileEndpoint: String(raw.profileEndpoint || '/api/account/profile'),
      bookingsEndpoint: String(raw.bookingsEndpoint || '/api/account/bookings'),
      offersEndpoint: String(raw.offersEndpoint || '/api/offers/claim'),
      sessionStorageKey: String(raw.sessionStorageKey || 'vip_customer_session_v1')
    };
  }

  function sanitizeEmail(value) {
    var email = String(value || '').trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  }

  function compactText(value, max) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max || 240);
  }

  function loadSession() {
    var store = storage();
    if (!store) return null;
    try {
      var raw = JSON.parse(store.getItem(accountConfig().sessionStorageKey) || 'null');
      if (!raw || !raw.accessToken) return null;
      if (raw.expiresAt && Number(raw.expiresAt) && Number(raw.expiresAt) < Date.now() - 60000) {
        store.removeItem(accountConfig().sessionStorageKey);
        return null;
      }
      return raw;
    } catch (error) {
      store.removeItem(accountConfig().sessionStorageKey);
      return null;
    }
  }

  function persistSession(session) {
    var store = storage();
    if (!store) return;
    if (!session) {
      store.removeItem(accountConfig().sessionStorageKey);
      return;
    }
    store.setItem(accountConfig().sessionStorageKey, JSON.stringify(session));
  }

  function clearSession() {
    persistSession(null);
  }

  function loadProfileCache() {
    var store = storage();
    if (!store) return null;
    try {
      return JSON.parse(store.getItem(PROFILE_STORAGE_KEY) || 'null');
    } catch (error) {
      store.removeItem(PROFILE_STORAGE_KEY);
      return null;
    }
  }

  function persistProfileCache(profile) {
    var store = storage();
    if (!store) return;
    if (!profile) {
      store.removeItem(PROFILE_STORAGE_KEY);
      return;
    }
    store.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  function loadOfferCache() {
    var store = storage();
    if (!store) return null;
    try {
      return JSON.parse(store.getItem(OFFER_STORAGE_KEY) || 'null');
    } catch (error) {
      store.removeItem(OFFER_STORAGE_KEY);
      return null;
    }
  }

  function persistOfferCache(offer) {
    var store = storage();
    if (!store) return;
    if (!offer) {
      store.removeItem(OFFER_STORAGE_KEY);
      return;
    }
    store.setItem(OFFER_STORAGE_KEY, JSON.stringify(offer));
  }

  function authHeaders(headers) {
    var session = loadSession();
    if (session && session.accessToken) {
      headers.Authorization = 'Bearer ' + session.accessToken;
    }
    return headers;
  }

  function setStatus(id, message, state) {
    var node = byId(id);
    if (!node) return;
    node.textContent = message || '';
    node.className = 'account-status' + (state ? ' is-' + state : '');
  }

  function requestJSON(url, init) {
    return fetch(url, init).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (payload) {
        if (!response.ok) {
          throw new Error(payload && payload.error ? payload.error : 'Request failed.');
        }
        return payload;
      });
    });
  }

  function parseHashSession() {
    var hash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
    if (!hash) return;
    var params = new URLSearchParams(hash);
    var accessToken = params.get('access_token');
    if (!accessToken) return;
    var expiresAt = params.get('expires_at');
    var expiresIn = params.get('expires_in');
    var session = {
      accessToken: accessToken,
      refreshToken: params.get('refresh_token') || '',
      tokenType: params.get('token_type') || 'bearer',
      expiresAt: expiresAt ? Number(expiresAt) * 1000 : Date.now() + (Number(expiresIn || 3600) * 1000)
    };
    persistSession(session);
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
  }

  function applyLanguage(lang) {
    var dict = translations[lang] || translations.en;
    document.documentElement.lang = dict.lang || 'en';
    document.title = dict.title || document.title;
    Object.keys(dict).forEach(function (key) {
      if (key === 'lang' || key === 'title') return;
      var node = byId(key);
      if (node) node.textContent = dict[key];
    });
    picker.value = lang;
    try {
      window.localStorage.setItem('vip_lang', lang);
    } catch (error) {}
    syncLocalizedAnchors(lang);
    syncCurrentUrl(lang);
    if (window.ExcellentiaVipSeo && typeof window.ExcellentiaVipSeo.sync === 'function') {
      window.ExcellentiaVipSeo.sync();
    }
  }

  function sessionStateLabel(session) {
    var dict = copy();
    if (!session) return dict.sessionGuest;
    return dict.sessionActive;
  }

  function renderSessionPill() {
    var pill = byId('accountSessionState');
    if (!pill) return;
    var session = loadSession();
    pill.textContent = sessionStateLabel(session);
    pill.className = 'status-pill ' + (session ? 'status-pill-ready' : 'status-pill-muted');
  }

  function hydrateProfileForm(profile) {
    if (!profile) return;
    if (byId('accountEmail') && profile.email) byId('accountEmail').value = profile.email;
    if (byId('accountFullName')) byId('accountFullName').value = profile.fullName || '';
    if (byId('accountCountry')) byId('accountCountry').value = profile.country || '';
    if (byId('accountWhatsapp')) byId('accountWhatsapp').value = profile.whatsapp || '';
    if (byId('accountLocale')) byId('accountLocale').value = profile.locale || currentLang();
    if (byId('accountPreferredContact')) byId('accountPreferredContact').value = profile.preferredContactChannel || 'email';
    if (byId('accountMarketingConsent')) byId('accountMarketingConsent').checked = Boolean(profile.marketingConsent);
    if (byId('accountWhatsappConsent')) byId('accountWhatsappConsent').checked = Boolean(profile.whatsappConsent);
    if (byId('accountNotes')) byId('accountNotes').value = profile.notes || '';
  }

  function profilePayload() {
    return {
      email: sanitizeEmail(byId('accountEmail') && byId('accountEmail').value),
      fullName: compactText(byId('accountFullName') && byId('accountFullName').value, 120),
      country: compactText(byId('accountCountry') && byId('accountCountry').value, 80),
      whatsapp: compactText(byId('accountWhatsapp') && byId('accountWhatsapp').value, 32),
      locale: byId('accountLocale') && byId('accountLocale').value || currentLang(),
      preferredContactChannel: byId('accountPreferredContact') && byId('accountPreferredContact').value || 'email',
      marketingConsent: Boolean(byId('accountMarketingConsent') && byId('accountMarketingConsent').checked),
      whatsappConsent: Boolean(byId('accountWhatsappConsent') && byId('accountWhatsappConsent').checked),
      notes: compactText(byId('accountNotes') && byId('accountNotes').value, 1000),
      privacyAcceptedAt: new Date().toISOString()
    };
  }

  function renderOfferCard(offer, copyBlock) {
    var panel = byId('accountOfferPanel');
    if (!panel) return;
    if (!offer) {
      panel.innerHTML = '<article class="account-empty"><strong>' + copyBlock.noOffer + '</strong></article>';
      return;
    }
    panel.innerHTML = '<article class="account-offer-card">' +
      '<span class="summary-label">' + compactText(offer.type || offer.offerType || 'offer', 64) + '</span>' +
      '<h3><span class="account-offer-code">' + compactText(offer.code, 48) + '</span></h3>' +
      '<p><strong>' + copyBlock.offerExpires + ':</strong> ' + compactText(offer.expiresAt || offer.expires_at || '', 80) + '</p>' +
      '<p><strong>' + copyBlock.offerTerms + ':</strong> ' + compactText(copyBlock.statusOfferClaimed, 140) + '</p>' +
    '</article>';
  }

  function renderBookings(bookings) {
    var list = byId('accountBookingsList');
    var dict = copy();
    if (!list) return;
    if (!Array.isArray(bookings) || !bookings.length) {
      list.innerHTML = '<article class="account-empty"><strong>' + dict.accountBookingsEmptyTitle + '</strong><p>' + dict.accountBookingsEmptyLead + '</p></article>';
      return;
    }

    list.innerHTML = bookings.map(function (booking) {
      var route = booking.items && booking.items[0] ? booking.items[0].routeLabel : booking.pickupPoint || '';
      return '<article class="account-booking-card">' +
        '<span class="summary-label">' + compactText(booking.serviceLabel || '', 80) + '</span>' +
        '<h3>' + compactText(booking.serviceLabel || '', 120) + '</h3>' +
        '<ul>' +
          '<li><strong>' + dict.bookingCode + ':</strong> ' + compactText(booking.code || '', 48) + '</li>' +
          '<li><strong>' + dict.bookingRoute + ':</strong> ' + compactText(route, 140) + '</li>' +
          '<li><strong>' + dict.bookingDate + ':</strong> ' + [booking.pickupDate || '', booking.pickupTime || ''].filter(Boolean).join(' · ') + '</li>' +
          '<li><strong>' + dict.bookingPayment + ':</strong> ' + compactText(booking.paymentStatus || '', 48) + '</li>' +
          '<li><strong>' + dict.bookingStatus + ':</strong> ' + compactText(booking.status || '', 48) + '</li>' +
          '<li><strong>' + dict.bookingOffer + ':</strong> ' + compactText(booking.offerCode || '', 48) + '</li>' +
          '<li><strong>' + dict.bookingNotification + ':</strong> ' + compactText(booking.notificationStatus || '', 48) + '</li>' +
        '</ul>' +
      '</article>';
    }).join('');
  }

  function renderCachedState() {
    hydrateProfileForm(loadProfileCache());
    renderOfferCard(loadOfferCache(), copy());
    renderSessionPill();
  }

  function consumeOfferQuery() {
    try {
      var offer = new URLSearchParams(window.location.search).get('offer');
      if (offer && byId('accountOfferCode')) {
        byId('accountOfferCode').value = offer;
      }
    } catch (error) {}
  }

  async function refreshAccountData() {
    var session = loadSession();
    if (!session) {
      renderCachedState();
      return;
    }
    setStatus('accountMagicLinkStatus', copy().statusLoading, '');
    try {
      var profileResponse = await requestJSON(accountConfig().profileEndpoint, {
        method: 'GET',
        headers: authHeaders({})
      });
      var bookingsResponse = await requestJSON(accountConfig().bookingsEndpoint, {
        method: 'GET',
        headers: authHeaders({})
      });
      if (profileResponse && profileResponse.profile) {
        persistProfileCache(profileResponse.profile);
        hydrateProfileForm(profileResponse.profile);
      }
      renderBookings(bookingsResponse && bookingsResponse.bookings ? bookingsResponse.bookings : []);
      renderSessionPill();
      setStatus('accountMagicLinkStatus', '', '');
    } catch (error) {
      setStatus('accountMagicLinkStatus', error.message || copy().statusMagicError, 'error');
      renderSessionPill();
    }
  }

  async function handleMagicLink() {
    var email = sanitizeEmail(byId('accountEmail') && byId('accountEmail').value);
    if (!email) {
      setStatus('accountMagicLinkStatus', copy().statusMagicError, 'error');
      return;
    }
    try {
      await requestJSON(accountConfig().profileEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_magic_link',
          email: email,
          locale: currentLang(),
          redirectPath: '/excellentia-vip-account.html'
        })
      });
      setStatus('accountMagicLinkStatus', copy().statusMagicSent, 'success');
    } catch (error) {
      setStatus('accountMagicLinkStatus', error.message || copy().statusMagicError, 'error');
    }
  }

  async function handleSaveProfile() {
    if (!loadSession()) {
      setStatus('accountSaveStatus', copy().statusLoginRequired, 'error');
      return;
    }
    try {
      var response = await requestJSON(accountConfig().profileEndpoint, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(profilePayload())
      });
      if (response && response.profile) {
        persistProfileCache(response.profile);
        hydrateProfileForm(response.profile);
      }
      setStatus('accountSaveStatus', copy().statusProfileSaved, 'success');
    } catch (error) {
      setStatus('accountSaveStatus', error.message || copy().statusProfileError, 'error');
    }
  }

  async function handleClaimOffer() {
    var code = compactText(byId('accountOfferCode') && byId('accountOfferCode').value, 48).toUpperCase();
    if (!code) {
      setStatus('accountOfferStatus', copy().statusOfferError, 'error');
      return;
    }
    try {
      var response = await requestJSON(accountConfig().offersEndpoint, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          code: code,
          email: sanitizeEmail(byId('accountEmail') && byId('accountEmail').value)
        })
      });
      if (response && response.offer) {
        persistOfferCache(response.offer);
        renderOfferCard(response.offer, copy());
      }
      setStatus('accountOfferStatus', copy().statusOfferClaimed, 'success');
      refreshAccountData().catch(function () {});
    } catch (error) {
      setStatus('accountOfferStatus', error.message || copy().statusOfferError, 'error');
    }
  }

  function bindEvents() {
    picker.addEventListener('change', function (event) {
      applyLanguage(event.target.value);
      renderCachedState();
      refreshAccountData().catch(function () {});
    });

    if (byId('accountMagicLinkButton')) {
      byId('accountMagicLinkButton').addEventListener('click', handleMagicLink);
    }
    if (byId('accountSaveProfileButton')) {
      byId('accountSaveProfileButton').addEventListener('click', handleSaveProfile);
    }
    if (byId('accountClaimOfferButton')) {
      byId('accountClaimOfferButton').addEventListener('click', handleClaimOffer);
    }
    if (byId('accountLogoutButton')) {
      byId('accountLogoutButton').addEventListener('click', function () {
        clearSession();
        renderSessionPill();
        setStatus('accountMagicLinkStatus', copy().statusSessionCleared, 'success');
      });
    }
  }

  parseHashSession();
  applyLanguage(currentLang());
  renderCachedState();
  consumeOfferQuery();
  bindEvents();
  refreshAccountData().catch(function () {});
})();
