# Cantoni Digital Studio - Global Social Operating System

## Obiettivo

Pubblicare ogni giorno con metodo su Instagram, Facebook, TikTok e, appena il video e pronto, YouTube Shorts. Ogni contenuto deve aumentare fiducia, prova pubblica e domanda commerciale per siti, e-commerce, web app, app, automazioni AI e crescita digitale continuativa.

## Regola principale

Nessuna pubblicazione automatica senza review. La pipeline prepara testo, asset e script; la pubblicazione resta manuale o comunque approvata, perche ogni post e pubblico e rappresenta Cantoni Digital Studio.

## Ruolo delle piattaforme

### Instagram

Instagram serve per credibilita visiva e portfolio. Qui vanno:

- lavori reali e reference verificabili;
- caroselli semplici su metodo e servizi;
- screenshot/prove quando autorizzati;
- storie giornaliere con avanzamento, audit, prima/dopo e backstage ordinato.

Formato consigliato: immagine o carosello 4:5, caption chiara, tono premium ma comprensibile.

### Facebook

Facebook serve per spiegare meglio e creare fiducia verso clienti meno tecnici. Qui vanno:

- post piu discorsivi;
- spiegazioni senza gergo;
- casi d'uso per aziende locali, hotel, negozi, professionisti e servizi;
- link al sito e contatto WhatsApp quando utile.

Formato consigliato: testo piu completo, immagine brandizzata, link al sito quando il post ha obiettivo commerciale.

### TikTok

TikTok serve per attenzione rapida e scoperta. Qui non basta copiare Instagram. Ogni contenuto deve avere:

- una frase iniziale forte;
- 3 scene brevi;
- un esempio concreto;
- chiusura chiara senza promesse esagerate.

Formato consigliato: video breve verticale con voce o testo su schermo. Lo script giornaliero e preparato nel publish pack.

### YouTube Shorts

YouTube per ora viene trattato come canale script-ready. Non pubblichiamo video lunghi senza produzione, ma ogni TikTok puo diventare Short quando:

- lo script e stato approvato;
- il video e leggibile da telefono;
- logo, sito e contatto sono chiari;
- non ci sono dati cliente non autorizzati.

Formato consigliato: stesso nucleo del TikTok, ma con titolo piu cercabile e descrizione piu ordinata.

## Lingue e mercati

La lingua non deve essere una traduzione automatica identica. Ogni post deve essere adattato al mercato:

- Italia: fiducia, clienti reali, WhatsApp, portfolio e chiarezza.
- USA/global English: sistemi digitali, percorsi di prenotazione, pagamenti, app e crescita misurabile.
- Spagna/Caraibi: hotel, turismo, prenotazioni, mobile-first e WhatsApp.
- Francia/Portogallo: ospitalita, servizi premium e percorso cliente.
- Germania/UK: scope, affidabilita, documentazione e gestione operativa.

La rotazione operativa e in `global-language-rotation.json`.

## Routine giornaliera

1. Aprire il giorno nel `daily-publish-pack`.
2. Controllare immagine, caption Instagram, testo Facebook, script TikTok e script YouTube.
3. Adattare la lingua principale e la seconda lingua del giorno.
4. Verificare che il post non contenga prezzi, promesse assolute, gergo tecnico non spiegato o proof non verificabile.
5. Pubblicare solo dopo approvazione esplicita.
6. Registrare cosa e stato pubblicato, link pubblici e risposta del pubblico.
7. Il giorno dopo usare commenti, risposte e insight per migliorare il contenuto successivo.

## Standard minimo per ogni post

- Deve essere comprensibile a un cliente non tecnico.
- Deve dire cosa facciamo: siti, e-commerce, web app, app, automazioni AI o crescita digitale.
- Deve avere un motivo per esistere: proof, educazione, servizio, metodo, fiducia o vendita.
- Deve evitare parole vuote come "innovativo" senza prova concreta.
- Deve lasciare chiaro come contattarci: sito, WhatsApp o profilo ufficiale.

## Cosa non fare

- Non pubblicare lo stesso testo identico su tutte le piattaforme.
- Non usare video o immagini sfocate.
- Non citare risultati cliente non verificati o non autorizzati.
- Non promettere crescita garantita.
- Non trasformare ogni post in vendita aggressiva.
- Non parlare solo di tecnologia: parlare del problema commerciale che risolve.

## Gate

Prima di considerare pronto il pacchetto social:

```bash
npm run test:social:daily
npm run test:social
git diff --check
```
