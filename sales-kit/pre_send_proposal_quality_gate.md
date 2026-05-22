# Cantoni Digital Studio - Gate Pre-Invio Proposte

## Obiettivo

Ogni proposta deve sembrare scritta per quel cliente specifico, non per una lista. Prima di inviare, il sistema deve bloccare la mail se mancano audit reale, lingua corretta, bisogno corretto, oggetto professionale o prove pubbliche Cantoni.

## Regola principale

Non si invia se non sappiamo spiegare in modo semplice:

- cosa fa davvero il cliente;
- quale dominio/sito e stato visto live;
- cosa succede da telefono;
- dove un visitatore si blocca prima di contattare, prenotare o comprare;
- quali social e recensioni pubbliche sono state controllate;
- quali competitor o alternative sono stati visti;
- perche serve sito, e-commerce, web app, app, piattaforma, automazione o crescita mensile.

## Oggetto email

L'oggetto deve:

- contenere il nome del business;
- essere nella lingua del mercato;
- essere concreto, non commerciale aggressivo;
- non contenere prezzo;
- non promettere risultati garantiti.

Esempi accettabili:

- `Palumbo Calzature: 3 osservazioni concrete sull'e-commerce`
- `The Connaught: 3 concrete website observations`
- `Le Bristol Paris : 3 observations concrètes sur le site`
- `Puntacana Resort: 3 observaciones concretas sobre reservas y contacto`

## Corpo email

La prima email deve contenere:

- saluto nella lingua corretta;
- riga che dimostra cosa e stato analizzato;
- 3 osservazioni concrete;
- 3 prime priorita comprensibili;
- impatto commerciale realistico;
- presentazione Cantoni con sito, portfolio, Instagram, Facebook, WhatsApp e prova app EC8 Platform;
- CTA leggera: offrire un riepilogo o percorso scritto, non spingere subito al pagamento.

## Decisione soluzione

La proposta deve scegliere il tipo di soluzione in base al problema osservato:

- `website` / `website_redesign`: fiducia, chiarezza, mobile, contatto, prenotazione o presenza pubblica.
- `ecommerce`: catalogo, carrello, checkout, pagamenti, ordini, prodotti o disponibilita.
- `web_app`: login, dashboard, dati, ruoli, area cliente, gestione interna o portale.
- `mobile_app`: uso ricorrente, notifiche, funzioni native, app store, play store o esperienza installabile.
- `platform`: piu ruoli, pagamenti, workflow, dashboard, dati e crescita modulare.
- `automation_ai`: follow-up, routing lead, documenti, supporto operativo, contenuti o automazioni.
- `monthly_growth`: lavoro continuativo su contenuti, fiducia, Google, Maps, conversione e visibilita nelle risposte AI.

Non proporre app, e-commerce o piattaforme per alzare il prezzo. Si propongono solo se il bisogno e visibile e difendibile.

## Stop rule

Bloccare l'invio se:

- il testo potrebbe andare bene per un altro cliente cambiando solo il nome;
- l'oggetto non cita il business;
- non ci sono 3 osservazioni e 3 priorita;
- mancano social, recensioni o competitor;
- non si capisce quale soluzione serve davvero;
- il testo usa gergo come CTA, hero, funnel, UX o scope senza spiegarlo;
- la prima email contiene prezzo;
- il cliente non capirebbe cosa proponiamo senza competenze tecniche.

## Gate automatico

Prima di inviare:

```bash
npm run build:global-outreach
npm run test:outreach-queue-quality
npm run test:proposal-personalization
```

Il gate `test:outreach-queue-quality` controlla coda, oggetto, lingua, valuta, business anchor, 3 problemi, 3 priorita, assenza di gergo, assenza di prezzo in prima email, audit social/recensioni/competitor/AI visibility e coerenza tra problema osservato e soluzione proposta.
