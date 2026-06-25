# Cantoni Outreach Deliverability Playbook

## Obiettivo
Fare outreach cliente-per-cliente senza sembrare invio massivo. La metrica non e solo "mandare piu email": e arrivare in inbox, far capire subito che abbiamo guardato davvero il loro sito e aprire una conversazione umana.

## Regola principale
La prima email fredda non deve essere una brochure brandizzata. Deve essere un messaggio breve, testuale, verificabile e specifico per il cliente.

Il materiale brandizzato serve per:
- review interna;
- risposta a chi mostra interesse;
- preventivo o mini-audit richiesto;
- follow-up caldo.

## Preflight obbligatorio nel Browser destro
Prima di qualunque invio reale:
- aprire Gmail nel pannello Browser destro;
- verificare visivamente `cantonidigitalstudio@gmail.com`;
- controllare inbox e ricerca risposte recenti per quel lead;
- verificare che il lead non sia gia `CONTACTED`, `REPLIED`, `QUOTE_SENT`, `CLOSED_WON` o `CLOSED_LOST`;
- aprire il sito cliente live e confermare dominio/canonical attuale;
- rileggere la email finale come cliente normale, non come tecnico.

Se uno di questi punti manca, non si invia.

## Standard prima email
La prima email deve contenere:
- oggetto con nome attivita e un solo tema concreto;
- saluto naturale nella lingua del cliente;
- una frase che spiega chi scrive;
- una sola osservazione reale sul sito/ecosistema del cliente;
- una conseguenza business semplice;
- una domanda di permesso per mandare le tre priorita;
- firma Cantoni Digital Studio con sito ufficiale.

La prima email non deve contenere:
- prezzi, pacchetti o link pagamento;
- allegati;
- immagini, banner, loghi pesanti o tracking pixel;
- piu di due link;
- parole aggressive come "garantito", "gratis", "offerta speciale", "ultimo giorno";
- liste lunghe di problemi;
- gergo non spiegato: CTA, hero, funnel, UX, CRO, backend, frontend;
- copia riutilizzabile cambiando solo il nome.

## Cadenza invii
Per non bruciare reputazione:
- meglio 5-10 lead molto forti al giorno che 50 deboli;
- mai inviare blocchi identici;
- evitare invii ravvicinati a molte aziende dello stesso gruppo o dominio;
- non fare follow-up se ci sono risposte non classificate;
- non inviare fuori orario lavorativo del mercato cliente se sembra automazione.

## Autenticazione dominio
Finche si usa `cantonidigitalstudio@gmail.com`, la strategia deve restare manuale, a basso volume e molto personalizzata.

Prima di scalare volumi seri, passare a una casella Google Workspace su dominio `@cantonidigitalstudio.com` con:
- SPF configurato;
- DKIM attivo;
- DMARC almeno in monitoraggio;
- dominio mittente coerente con sito, firma e link.

Piano DNS autorevole: `sales-kit/email_dns_setup_runbook.md`.
Gate tecnico: `npm run audit:email-dns`.

Riferimento operativo: linee guida Google per mittenti email, incluse autenticazione SPF/DKIM/DMARC, spam rate e formato messaggi: https://support.google.com/a/answer/81126

## Gate di qualita cliente-per-cliente
Ogni lead pronto deve avere audit scritto su:
- sito live e dominio corretto;
- esperienza mobile;
- percorso contatto/prenotazione/acquisto;
- social pubblici;
- recensioni o piattaforme di fiducia;
- competitor reali;
- presenza Google e visibilita nelle risposte AI;
- soluzione consigliata: sito, e-commerce, web app, app, piattaforma, automazioni AI o crescita mensile.

La mail iniziale usa solo il punto piu forte. Il resto resta interno finche il cliente risponde.

## Post-invio
Dopo ogni invio:
- segnare data, account usato e stato `CONTACTED`;
- salvare subject/body effettivi;
- pianificare follow-up solo se non arriva risposta;
- non reinviare se Gmail mostra una risposta non ancora classificata;
- classificare risposte come positiva, dubbia, negativa, automatica o operativa.
