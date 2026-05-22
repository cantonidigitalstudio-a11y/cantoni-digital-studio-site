# 2026-05-18 Ready Batches Gate Review

## Stato

- Nessuna email inviata.
- 18 nuovi lead pronti a livello automatico: `NG6`, `NQ6`, `NEU6`.
- 50 follow-up D3 pronti a livello automatico per `2026-05-18`.
- Invio reale ancora bloccato: serve approvazione esplicita per batch.
- Certificazione visuale cliente-per-cliente completata nella schermata destra per i 18 lead nuovi.
- Browser plugin operativo: il pannello destro apre correttamente le review locali via `http://127.0.0.1:4197/...` e il sito pubblico Cantoni. Evitare `file://`, bloccato dalla policy Browser.
- Gmail Cantoni e apribile nel pannello destro. Se Gmail standard resta su loader, usare la modalita base e verificare visibilmente l'account `cantonidigitalstudio@gmail.com`.
- Gmail reply check del 2026-05-18: pannello destro aperto su Gmail con account `cantonidigitalstudio@gmail.com`; ricerca ultimi 30 giorni su parole chiave commerciali ha trovato 8 conversazioni, senza risposta positiva chiara. Principali risultati: risposte automatiche/generiche da Mandarin Oriental Bangkok, Connaught, Fullerton Singapore, Claridge's, Berkeley; thread Le Bristol Paris senza segnale positivo evidente dalla lista; Supabase/GitHub non lead.
- Status report aggiornato: lo script ora supporta file di pipeline/coda espliciti per evitare confusione con code storiche.
- Post-modifica gate: `npm test`, `npm run test:payments`, `npm run test:browser`, `npm run test:outreach-readiness`, `npm run test:social`, `npm run build:cloudflare`, `npm run test:artifact`, `npm run test:browser:artifact`, `npm run test:payments:artifact` passano.

## Correzione fatta durante il controllo

`LD-NEU6-0002` e stato corretto prima dell'invio:

- Da: `Yurbban Trafalgar Hotel`
- A: `UMA House by Yurbban Trafalgar`
- URL aggiornato: `https://uma.yurbban.com/uma-house/barcelona`
- Email aggiornata: `trafalgar@umahouse.com`
- Motivo: la traccia `trafalgar.yurbban.com` risulta vecchia/superseded; la proposta doveva riflettere il brand e il dominio attuali.
- Queue e email brandizzate sono state rigenerate dopo la correzione.

`LD-NG6-0002` e stato sostituito prima dell'invio:

- Rimosso: `Miami Vice Charters`
- Motivo: il dominio `miamivicecharters.com` ha restituito `ERR_CONNECTION_REFUSED` sia con sia senza `www` durante il controllo live.
- Nuovo lead: `Luxury Yacht Charters Miami`
- Email: `info@luxuryyachtchartersmiami.com`
- URL: `https://luxuryyachtchartersmiami.com/contact/`
- Prove verificate: contatto, telefono, indirizzo, calendario di prenotazione, flotta con prezzi/limiti ospiti, Instagram e Facebook.

## Gate eseguiti

### NG6

- `verify_global_outreach_batch`: ok, 6 ready, 0 problemi.
- `verify_outreach_queue_quality`: ok, 6 item, 0 failure.
- `verify_outreach_branding`: ok, HTML e queue brandizzati.
- `verify_proposal_personalization`: ok, 6 controllati, 0 problemi.
- Dry-run invio: ok, 6 processed, tutti `dry_run`.

### NQ6

- `verify_global_outreach_batch`: ok, 6 ready, 0 problemi.
- `verify_outreach_queue_quality`: ok, 6 item, 0 failure.
- `verify_outreach_branding`: ok, HTML e queue brandizzati.
- `verify_proposal_personalization`: ok, 6 controllati, 0 problemi.
- Dry-run invio: ok, 6 processed, tutti `dry_run`.

### NEU6

- `verify_global_outreach_batch`: ok dopo correzione Yurbban, 6 ready, 0 problemi.
- `verify_outreach_queue_quality`: ok, 6 item, 0 failure.
- `verify_outreach_branding`: ok, HTML e queue brandizzati.
- `verify_proposal_personalization`: ok dopo correzione Yurbban, 6 controllati, 0 problemi.
- Dry-run invio: ok, 6 processed, tutti `dry_run`.

### Follow-up D3

- `npm run test:global-followup-d3`: ok.
- Queue: 50 item.
- Review HTML: ok, `public_amounts=0`, `reply_to_mismatch=0`.
- Dry-run invio: ok, 50 processed, tutti `dry_run`.

### Pagamenti artifact

- `npm run test:payments:artifact`: ok.
- 2 Payment Link Stripe controllati dall'artifact `.cloudflare-pages`.
- Merchant osservato: `Cantoni Digital Studio`.
- Metodi rilevati senza transazioni reali: carta, Klarna, Bancontact, MB Way.
- PayPal e classificato come metodo dipendente dalla sessione del checkout e non blocca il gate automatico.

### Fix worker dry-run

- Corretto `sales-kit/scripts/gmail_background_worker.mjs`: il dry-run ora valida HTML, branding e immagini senza richiedere `OUTREACH_APPS_SCRIPT_SECRET`.
- Il segreto resta obbligatorio solo quando `OUTREACH_SEND_ENABLED=true`.
- Rilanciato dry-run su copie temporanee: `NG6`, `NQ6`, `NEU6` processano `18/18` come `dry_run`, senza invii reali.

## Sicurezze invio

- Guard anti-invio reale testato su lead: `SEND_ENABLED=true` senza `OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND` si blocca con exit code `2`.
- Guard anti-invio reale testato sui follow-up: stesso blocco con exit code `2`.
- Non sono stati usati token di invio reale.

## Stato cliente-per-cliente

Questi lead passano i gate automatici e hanno proposte personalizzate, lingua e valuta coerenti:

- `LD-NG6-0001` Yacht Me Charters - en/USD.
- `LD-NG6-0002` Luxury Yacht Charters Miami - en/USD, replaced after live QA.
- `LD-NG6-0003` KOS Yachts - en/USD.
- `LD-NG6-0004` Wilson Boutique Hotel Barcelona - es/EUR.
- `LD-NG6-0005` Santiago de Alfama Boutique Hotel - pt/EUR.
- `LD-NG6-0006` Cheese & Wine Handmade Hospitality - pt/EUR.
- `LD-NQ6-0001` SoVous Med Spa - en/USD.
- `LD-NQ6-0002` Manhattan Medspa - en/USD.
- `LD-NQ6-0003` Flawless Skin Med Spa - en/USD.
- `LD-NQ6-0004` PBK Medspa - en/USD.
- `LD-NQ6-0005` Miami Yacht Charters - en/USD.
- `LD-NQ6-0006` Anella Aesthetics - en/USD.
- `LD-NEU6-0001` Margot House Barcelona - es/EUR.
- `LD-NEU6-0002` UMA House by Yurbban Trafalgar - es/EUR, corrected.
- `LD-NEU6-0003` Brach Paris - fr/EUR.
- `LD-NEU6-0004` Hotel Panache Paris - fr/EUR.
- `LD-NEU6-0005` Hotel Zoo Berlin - de/EUR.
- `LD-NEU6-0006` Hotel Oderberger Berlin - de/EUR.

## Visual QA completata

Controllo live completato nella schermata destra:

- `NG6`: 6/6 verificati dopo sostituzione Miami Vice.
- `NQ6`: 6/6 verificati.
- `NEU6`: 6/6 verificati dopo correzione UMA House.

Le bozze sono pronte a livello di file, copy, dedupe, branding, lingua, valuta, dry-run, guard anti-invio e controllo visuale. Non sono comunque da inviare senza approvazione esplicita del batch.
