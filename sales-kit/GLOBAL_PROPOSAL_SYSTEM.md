# Cantoni Digital Studio - Global Proposal System

## Obiettivo
Costruire preventivi internazionali seri, verificabili e commercialmente difendibili per siti, e-commerce, applicazioni, pagamenti, automazioni e gestione continuativa.

Il sistema non deve produrre PDF generici. Deve produrre una proposta che risponde a questa domanda:

`Perche proprio questa azienda dovrebbe affidare a Cantoni Digital Studio questo lavoro, a questo prezzo, in questa lingua e con queste condizioni?`

## Architettura operativa

### 1. Sito Cantoni come prova pubblica
Il sito deve dimostrare prima di vendere:
- servizi chiari: siti, e-commerce, app, pagamenti, automazioni, gestione mensile
- estimator immediato per inquadrare budget e complessita
- pagamenti Stripe per consulenza
- case study e riferimenti pubblici
- termini commerciali leggibili prima del pagamento
- privacy/cookie visibili prima dell'invio dei form
- multilingua reale, non solo traduzione superficiale

### 2. Audit live prima del preventivo
Ogni lead deve avere una scheda audit con:
- dominio canonico verificato
- mercato servito reale
- offerta principale
- CTA e percorso mobile
- elementi trust
- rotture concrete nel percorso di contatto, acquisto o prenotazione
- almeno 3 evidenze osservate sul sito reale

Se il dominio o il business non sono verificati, il preventivo non parte.

Controllo minimo prima di scrivere o rigenerare un preventivo:

```bash
npm run lead:verify-site -- --lead-id LD-XXXX --report sales-kit/audits/lead_site_LD-XXXX.json
```

Se `quoteReady` non e `true`, prima si apre il sito a mano, si risolve dominio vecchio/nuovo, canonical, redirect e contatti reali, poi si aggiorna la scheda lead.

### 3. Pricing difendibile
Il prezzo non nasce dal desiderio di chiudere il cliente. Nasce da:
- tipo progetto: sito, e-commerce, web app, mobile app
- ampiezza pagine, catalogo, schermate o flussi
- pagamenti, prenotazioni, area cliente, dashboard, CRM, automazioni
- lingua, valuta, localizzazione e contenuti
- urgenza, materiali disponibili e rischio operativo
- valore commerciale plausibile per il cliente

Range pubblici minimi:
- sito professionale / redesign: da 1.200 EUR
- e-commerce: da 4.000 EUR
- web app / piattaforma: da 9.000 EUR
- gestione mensile: 250 / 400 / 700 EUR

Eccezioni strategiche, come prezzo portfolio o ingresso mercato, devono essere marcate come `tariffa agevolata` e protette da scope scritto.

### 4. Lingua e valuta
Il preventivo parla la lingua del mercato cliente e usa la sua valuta.

Lingue operative:
- italiano
- inglese
- spagnolo
- francese
- tedesco
- portoghese
- arabo
- russo
- cinese
- giapponese
- hindi

La lingua deve essere professionale e naturale. Se una lingua non e verificabile con qualita sufficiente, il documento va marcato come preview interna e non va inviato.

### 5. Struttura obbligatoria del preventivo
1. Header Cantoni con cliente, sito analizzato, mercato, lingua e valuta
2. Sintesi business
3. Criticita osservate sul sito reale
4. Intervento proposto
5. Impatto economico realistico
6. Pacchetti o proposta unica consigliata
7. Condizioni commerciali
8. Riferimenti pubblici Cantoni
9. Chiusura orientata alla decisione

## Gate tecnico
Prima di inviare o considerare pronto un preventivo:

```bash
npm run quote:audit
```

Il gate blocca:
- path locali o file system leak
- placeholder o domini esempio
- sito cliente non verificato
- meno di 3 criticita osservate
- criticita troppo corte o generiche
- mancanza termini pagamento

Gli archivi vecchi possono fallire il gate. Questo e voluto: il fallimento segnala che non vanno riusati come standard commerciale.

## Regola commerciale
Il preventivo deve aiutare a prendere clienti, ma non deve abbassare il valore percepito dello studio.

Quando serve entrare in un mercato:
- usare una tariffa agevolata con scope chiuso
- chiedere case study, testimonianza e autorizzazione a mostrare il lavoro
- legare il margine alla manutenzione mensile
- non regalare cataloghi, automazioni o revisioni infinite

## Output corretto
Un preventivo e pronto solo se:
- sembra scritto per una sola azienda
- contiene problemi visti davvero
- il prezzo si puo difendere davanti al cliente
- lo scope protegge lo studio
- lingua, valuta e condizioni sono coerenti col mercato
- non contiene tracce tecniche interne
