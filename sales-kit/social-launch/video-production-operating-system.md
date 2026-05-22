# Cantoni Digital Studio - Video Production Operating System

## Obiettivo

Produrre Reel, TikTok e YouTube Shorts credibili, basati su lavori reali, senza sembrare contenuti generati a caso dall'intelligenza artificiale.

## Principio

Il video deve sembrare un lavoro professionale di uno studio digitale, non un template AI. L'intelligenza artificiale puo aiutare a scrivere, ordinare, sottotitolare e montare, ma il materiale principale deve essere reale.

## Formula video

Ogni video breve deve avere questa struttura:

1. Hook: una frase semplice che intercetta un problema reale.
2. Proof: schermata reale, sito live, app, booking flow o progetto.
3. Problema: cosa non capisce o non riesce a fare il cliente finale.
4. Soluzione: cosa abbiamo costruito o come ragioniamo.
5. Chiusura: invito leggero a farci guardare il progetto, senza promessa aggressiva.

Durata consigliata:

- TikTok: 18-32 secondi.
- Instagram Reel: 20-40 secondi.
- YouTube Shorts: 25-45 secondi, con titolo piu cercabile.

## Materiale da usare

Priorita alta:

- screen recording reali del sito/app;
- screenshot mobile e desktop gia verificati;
- loghi e immagini cliente autorizzate;
- pagine pubbliche e reference verificabili;
- riprese reali da telefono se disponibili.

Priorita media:

- mockup device generati da screenshot reali;
- animazioni testuali minimali;
- zoom, pan e highlight su interfacce reali.

Da evitare:

- avatar AI;
- stock video generici;
- scene generate non collegate al progetto;
- voce artificiale riconoscibile e piatta;
- claims tipo "garantito", "migliori al mondo", "risultati sicuri";
- admin, email, dashboard private, dati cliente o segreti.

## Come li produco operativamente

1. Registro progetto: prendo il progetto dal `portfolio-content-registry.json`.
2. Raccolta proof: uso solo asset sicuri o screen recording nuovi da browser/dispositivo.
3. Storyboard: preparo scene, testo schermo, voiceover e caption.
4. Montaggio: uso un template verticale 9:16 con logo, sottotitoli, screenshot reali e movimenti sobri.
5. QA: controllo leggibilita mobile, durata, ritmo, niente dati privati, niente effetto AI.
6. Review: preparo preview e checklist.
7. Pubblicazione: solo dopo approvazione finale.

## Formato per progetto

### Excellentia VIP

Video migliori:

- sito premium non e solo estetica;
- booking e pacchetti chiari da mobile;
- fiducia prima della richiesta;
- AI visibility e contenuti post-lancio.

### Mr Collins / Destination Cocoa

Video migliori:

- un sito turistico deve aiutare anche il team;
- booking, transfer e servizi extra ordinati;
- pagamenti e richieste piu pulite;
- mobile per turisti internazionali.

### EC8 Platform

Video migliori:

- non facciamo solo siti: anche app reali;
- sito, piattaforma e app nello stesso ecosistema;
- quando serve una web app o un'app;
- proof pubblica con sito e store da verificare prima del post.

### Coconut Armor

Video migliori:

- costruzione brand e drop e-commerce;
- mobile-first per un prodotto fisico;
- landing, shop e supply readiness;
- dietro le quinte del lancio, solo dopo review interna.

### Etsy operations

Video migliori:

- differenza tra vendere su marketplace e costruire un sistema;
- listing, immagini, catalogo e fiducia;
- pubblicabile solo dopo asset discovery e review.

## Standard anti-AI

- Usare immagini reali e interfacce vere.
- Evitare transizioni eccessive.
- Testo grande, sobrio, leggibile.
- Voiceover: preferibilmente voce umana. Se sintetica, va approvata e deve sembrare naturale.
- Sottotitoli puliti e sincronizzati.
- Nessun linguaggio gonfiato.
- Ogni video deve poter essere spiegato in una frase: "Mostriamo X per dimostrare Y".

## Gate

```bash
npm run test:social:video
npm run test:social:daily
git diff --check
```
