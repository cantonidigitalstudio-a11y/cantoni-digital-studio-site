# Cantoni Daily Ops Check - 2026-05-17 09:00 CEST

## Identita usata

- Account operativo previsto: `cantonidigitalstudio@gmail.com`.
- Nessuna email inviata.
- Nessun post pubblicato.
- Nessun pagamento o azione irreversibile eseguita.

## Gmail replies

Fonte controllata: sessione Gmail Cantoni visibile nel browser laterale, query commerciale:

`in:inbox newer_than:30d (interessato OR interessata OR interested OR interés OR interesado OR intéressé OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app) -from:cantonidigitalstudio@gmail.com`

Classificazione rapida della lista visibile:

- Positive: 0
- Dubbie / da approfondire: 0
- Negative: 0
- Automatiche / acknowledgement / non operative: 6 hospitality replies circa, piu newsletter Supabase e avviso GitHub non pertinenti.

Nota: il connettore Gmail non e stato usato per classificare Cantoni perche in questa configurazione puo puntare a un account diverso. Per Cantoni resta valido il controllo tramite sessione ufficiale browser o worker vincolato a `reply_to=cantonidigitalstudio@gmail.com`.

## Follow-up pipeline

- Follow-up D3 pronti: 50.
- Data target: 2026-05-18.
- Stato CSV: `CONTACTED|2026-05-18 = 50`.
- Azione oggi: nessun follow-up da inviare prima del 18 maggio e prima di revisione/approvazione.

## Nuovo batch pronto ma non inviato

Batch: `sales-kit/lead-batches/2026-05-17-next-global-6/`

- Lead pronti: 6.
- Lead inviati: 0.
- Lingue/valute: `en/USD`, `es/EUR`, `pt/EUR`.
- Stato: pronto per review e invio solo dopo approvazione esplicita.
- Frase richiesta per procedere: `approvo invio dei 6 lead NG6`.

Protezione tecnica: anche con `SEND_ENABLED=true`, lo script reale richiede `OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND`.

## Social pack

- `npm run test:social:daily`: verde.
- Giorni pronti: 30.
- Canali: Instagram, Facebook, TikTok, YouTube Shorts.
- Prima uscita pronta: 2026-05-18, Excellentia VIP.
- File operativo: `sales-kit/social-launch/daily-publish-pack/2026-05-18-2026-05-18-excellentia-vip/`.
- Pubblicazione: non eseguita. Richiede review esplicita.

## Gate verificati oggi

- `npm run test:global-followup-d3`: verde, 50 follow-up D3, 0 failure.
- `npm run test:social:daily`: verde, 30 giorni, 0 failure.
- `npm run test:outreach-readiness`: verde.
- `git diff --check`: verde.

## Prossime azioni consigliate

1. Oggi: revisionare visivamente le 6 email NG6 da `branded/internal-review-branded.html`.
2. Se approvate: inviare i 6 lead NG6 con token esplicito.
3. Domani 2026-05-18: ricontrollare Gmail Cantoni prima dei 50 follow-up D3.
4. Domani: pubblicare o programmare la prima uscita Excellentia VIP solo dopo review immagine/caption/script.
5. Continuare batch piccoli: massimo 10-15 lead, audit reale per sito, social, recensioni, Google Maps, competitor, AI visibility e soluzione corretta.

## Cascata operativa aggiuntiva - stesso giorno

- Review NG6 aperta nel Browser laterale tramite server locale temporaneo e poi ricontrollata da file.
- Gate NG6 rilanciati: queue quality, branding, personalizzazione e dedupe verdi.
- Link pubblici citati nelle email verificati: Cantoni site, studio, case studies, EC8 Platform, App Store, Play Store, Facebook, Instagram. TikTok risponde ma puo mostrare login-gate, coerente con il gate corrente.
- Gmail Cantoni ricontrollata nel Browser laterale: 8 risultati nella ricerca commerciale, classificati come auto-reply/acknowledgement/non pertinenti; 0 positivi.
- Social pack Excellentia VIP rivisto: sostituito `servizio costoso` con `servizio premium` nel sorgente `sales-kit/social-launch/posts.json`, rigenerati asset e pack.
- Snippet risposta rapida migliorati in `sales-kit/reply_snippets.md`: lo scope scritto e il link pagamento dopo validazione sono esplicitati in IT/EN/ES/FR/DE/PT.
- Sito live ricontrollato nella finestra laterale su `https://cantonidigitalstudio.com/preventivo`: H1 corretto, WhatsApp presente, privacy presente, nessun overflow orizzontale rilevato.
- Server locale temporaneo chiuso dopo la review; la finestra laterale finale resta su sito live.
- Dopo conferma generica `sisi procedi`, rilanciato dry-run NG6: 6 email processabili, 0 invii reali, tutti gli item in `dry_run`.
- Rilanciati anche `test:social:daily`, `test:global-followup-d3` e `git diff --check`: verdi.

## Gate aggiuntivi verdi

- `npm test`
- `npm run test:payments`
- `npm run test:browser`
- `npm run test:outreach-readiness`
- `npm run test:social:daily`
- `npm run test:social:video`
- `npm run test:reply-to-quote`
- `npm run test:global-followup-d3`
- `npm run test:global-outreach`
- `git diff --check`

## Next Quality 6 - preparazione reversibile

- Creato il batch `sales-kit/lead-batches/2026-05-17-next-quality-6/`.
- Target: 6 lead USA ad alta intenzione tra med spa/aesthetic clinic e yacht charter.
- Lingua/valuta: `en/USD`.
- Stato: `READY_TO_CONTACT`, nessun invio reale.
- Fix di qualita applicato: i campi `social_channels_checked`, `review_platforms_checked` e `competitors_checked` sono stati trasformati in evidenze strutturate a piu elementi, non note generiche.
- Queue e review brandizzata generate in `sales-kit/lead-batches/2026-05-17-next-quality-6/branded/`.
- Dry-run invio: 6 item processabili, tutti `dry_run`.
- Guard anti-invio reale: confermato blocco con exit code `2` senza `OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND`.
- File di approvazione: `sales-kit/lead-batches/2026-05-17-next-quality-6/send-review.md`.
- Frase richiesta per invio reale: `approvo invio dei 6 lead NQ6`.

## Gate Next Quality 6 verdi

- `verify_global_outreach_batch`: verde, 6 ready, 0 problemi.
- `test:outreach-dedupe`: verde, 0 duplicati recenti.
- `verify_outreach_queue_quality`: verde, 6 item, 0 failure.
- `verify_outreach_branding`: verde, HTML e queue brandizzati.
- `verify_proposal_personalization`: verde, 6 righe controllate.
- `day1_send_background` dry-run: verde, 0 invii reali.

## Controllo Gmail e follow-up dopo comando generico `procedi`

- Gmail Cantoni controllata nel Browser laterale su account `cantonidigitalstudio@gmail.com`.
- Query commerciale visibile: `in:inbox newer_than:30d (...) -from:cantonidigitalstudio@gmail.com`.
- Risultati visibili: 8.
- Classificazione: 0 positive, 0 dubbie, 0 negative; solo automatiche/acknowledgement/non pertinenti.
- Esempi visibili: Mandarin Oriental Bangkok automatic reply, The Connaught thank-you, Le Bristol thread, Fullerton automatic reply, Claridge's thank-you, Berkeley thank-you, Supabase newsletter, GitHub OAuth notice.
- `npm run test:global-followup-d3`: verde, 50 follow-up D3 generati/verificati.
- Dry-run follow-up D3: 50 item processabili, tutti `dry_run`, 0 invii reali.
- Guard anti-invio reale follow-up: confermato blocco con exit code `2` senza `OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND`.
- File approvazione follow-up: `sales-kit/lead-batches/2026-05-15-global-50/followup-send-review.md`.
- Frase richiesta per invio reale follow-up: `approvo invio dei 50 follow-up D3`.

## Next Europe Quality 6 - preparazione reversibile

- Creato il batch `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/`.
- Target: 6 lead europei hotel boutique/lifestyle in Spagna, Francia e Germania.
- Lingue/valute: `es/EUR`, `fr/EUR`, `de/EUR`.
- Stato: `READY_TO_CONTACT`, nessun invio reale.
- Primo dedupe ha bloccato Casa Bonay e Hotel Pulitzer perche gia contattati nel batch globale da 50.
- Azione correttiva: sostituiti con Margot House Barcelona e Yurbban Trafalgar Hotel; dedupe poi verde.
- Migliorato il generatore `sales-kit/scripts/build_outreach_queue_from_csv.mjs` per evitare il termine tecnico `Conversion` nelle bozze tedesche.
- Queue e review brandizzata generate in `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/branded/`.
- Dry-run invio: 6 item processabili, tutti `dry_run`.
- Guard anti-invio reale: confermato blocco con exit code `2` senza `OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND`.
- File di approvazione: `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/send-review.md`.
- Frase richiesta per invio reale: `approvo invio dei 6 lead NEU6`.

## Gate Next Europe Quality 6 verdi

- `verify_global_outreach_batch`: verde, 6 ready, 0 problemi.
- `test:outreach-dedupe`: verde, 0 duplicati recenti.
- `verify_outreach_queue_quality`: verde, 6 item, 0 failure.
- `verify_outreach_branding`: verde, HTML e queue brandizzati.
- `verify_proposal_personalization`: verde, 6 righe controllate.
- `day1_send_background` dry-run: verde, 0 invii reali.
