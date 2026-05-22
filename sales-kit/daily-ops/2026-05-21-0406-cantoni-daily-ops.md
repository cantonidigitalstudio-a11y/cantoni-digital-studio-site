# Cantoni Digital Studio - Daily ops 2026-05-21 04:06 CEST

## Identita e superficie usata

- Account controllato: `cantonidigitalstudio@gmail.com`.
- Superficie operativa: Browser destro Codex, Gmail web live.
- Nessuna email inviata, nessun post pubblicato, nessun pagamento eseguito.

## Gmail - controllo commerciale

Query Browser:

```text
newer_than:3d (interessato OR interessata OR interested OR interesado OR interesse OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app OR OK OR roadmap OR reply OR risposta) -from:cantonidigitalstudio@gmail.com -MOO -DHL
```

Risultato:

- positiva commerciale: 0 chiare.
- dubbia/da review: thread hotel con risposte generiche o automatiche, nessuna apertura commerciale evidente.
- negativa: 0.
- automatica/generica: risposte da strutture hotel e conferme automatiche.
- operativa non urgente intercettata: Google security, TikTok login/codice, Cloudflare report.

## Gmail - controllo operativo

Query Browser:

```text
newer_than:3d (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR sicurezza OR security OR pagamento OR payment OR ordine OR consegna OR delivery OR account OR accesso) -from:cantonidigitalstudio@gmail.com
```

Classificazione:

- operativa urgente: 0.
- operativa non urgente:
  - Google, 2026-05-21 02:11: nuovo accesso Mac; coerente con attivita operative recenti, da attenzionare solo se non riconosciuto.
  - TikTok, 2026-05-20: codice e nuovo login/dispositivo; coerente con pubblicazione EC8.
  - MOO/DHL, 2026-05-20: consegna/ordine indicati come completati o risolti.
  - Facebook, 2026-05-20: accesso vicino San Benedetto del Tronto; coerente con setup social recente.
  - Cloudflare: report minacce mitigato; da rivedere piu avanti, non emergenza immediata.
- irrilevante: aggiornamenti generici non collegati a lead o operazioni Cantoni.

## Follow-up 2026-05-21

Code verificate:

- `sales-kit/lead-batches/2026-05-17-next-global-6/followup_d3_queue_2026-05-21.json`: 6/6 validi.
- `sales-kit/lead-batches/2026-05-17-next-quality-6/followup_d3_queue_2026-05-21.json`: 6/6 validi.
- `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup_d3_queue_2026-05-21.json`: 6/6 validi.

Controllo duplicati recente: verde, 0 candidati duplicati.

Stato: pronti 18 follow-up, ma non inviati. Serve approvazione esplicita prima dell'invio.

## Social - EC8 Platform 2026-05-20

Stato locale allineato in:

- `sales-kit/social-launch/published-status/2026-05-20-ec8-platform.md`

Canali chiusi:

- TikTok pubblicato: `https://www.tiktok.com/@cantonidigitalstudio/video/7642137247147511062`
- YouTube Shorts pubblicato: `https://youtube.com/shorts/34omHL7noSg?feature=share`

Canali ancora non chiusi:

- Instagram EC8: non pubblicato; serve approvazione cross-post e upload composer.
- Facebook EC8: non pubblicato; serve approvazione cross-post e sessione pagina verificata.

## Social - post 2026-05-21

Post del giorno: `Prima audit, poi prezzo`.

Correzioni fatte:

- tolto badge generico con iniziali;
- inserito visual metodo/checklist piu coerente;
- copy aggiornato per spiegare in modo umano che prima si controllano sito, mobile, contatti, Google Maps, recensioni, social, competitor e ricerche;
- chiarito che la proposta puo essere sito, e-commerce, web app, app o gestione continuativa;
- generato short video verticale 1080x1920, durata 15.933s.
- corretto il generatore review per aggiungere cache-buster basato sull'hash dell'immagine, cosi il Browser destro non mostra anteprime vecchie dopo la rigenerazione.

File principali:

- immagine: `sales-kit/social-launch/daily-publish-pack/2026-05-21-2026-05-21-audit-before-price/2026-05-21-2026-05-21-audit-before-price.png`
- video: `sales-kit/social-launch/daily-publish-pack/2026-05-21-2026-05-21-audit-before-price/short-video/2026-05-21-2026-05-21-audit-before-price-short.mp4`
- caption Instagram: `sales-kit/social-launch/daily-publish-pack/2026-05-21-2026-05-21-audit-before-price/instagram.caption.txt`
- caption Facebook: `sales-kit/social-launch/daily-publish-pack/2026-05-21-2026-05-21-audit-before-price/facebook.caption.txt`

Stato: pronto per review finale e approvazione pubblicazione. Non pubblicato.

Verifica visuale Browser destro: aperta review locale con badge metodo/checklist corretto, senza `PD` e senza sovrapposizioni evidenti nel primo viewport.

## Destination Cocoa

Stato: approvato in passato ma non pubblicato.

Decisione consigliata: non mischiarlo col post del 21 maggio. Tenerlo come recupero portfolio/backlog e pubblicarlo in una giornata dedicata, dopo nuova review visuale.

## Verifiche eseguite

```text
npm run test:social:daily
SOCIAL_SHORT_ENTRY=2026-05-21-2026-05-21-audit-before-price npm run test:social:short
npm run test:social-public
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-global-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
node sales-kit/scripts/verify_outreach_no_recent_duplicates.mjs
```

Esito:

- social daily: verde, 30 giorni, 4 canali, 0 failure;
- short 2026-05-21: verde, 1080x1920, 15.933s;
- canali pubblici: verde, con TikTok login-gated accettato dal contratto attuale;
- follow-up: 18/18 validi;
- duplicati outreach: verde.

## Prossime azioni

1. Approvare o bloccare invio dei 18 follow-up D3.
2. Approvare o bloccare pubblicazione post 2026-05-21 `Prima audit, poi prezzo`, specificando canali.
3. Decidere se recuperare Destination Cocoa in una giornata separata.
4. Pulire worktree con allowlist prima di commit/deploy: ci sono molte modifiche e file nuovi non omogenei.
5. Dopo pulizia, rilanciare gate sito principali prima di deploy serio.

## Aggiornamento heartbeat 09:00 CEST

Superficie valida: Browser destro Codex, Gmail web live, account verificato visivamente come `cantonidigitalstudio@gmail.com`.

Classificazione Gmail aggiornata:

- positiva commerciale: 0 chiare.
- dubbia/da review: `Le Bristol Paris`, thread misto con nostra proposta e risposta generica/di presa in carico; non e un interesse commerciale chiaro.
- negativa: 0.
- automatica/generica: The Fullerton Hotel Singapore, The Connaught, Claridge's, The Berkeley e risposte simili di strutture hotel.
- operativa urgente: 0.
- operativa non urgente:
  - Google security: nuovo accesso Mac su account Cantoni, coerente con attivita operative se riconosciuto.
  - Facebook security/notifica: accesso vicino San Benedetto del Tronto e notifica profilo, coerente con setup social se riconosciuto.
  - TikTok: email di login/codice e nuovo dispositivo, coerenti con pubblicazione EC8/TikTok se riconosciute.
  - Cloudflare: report di minacce sopra media su `cantonidigitalstudio.com`, da rivedere in dashboard ma non emerge blocco immediato dalla lista Gmail.
  - MOO/DHL: consegna ordine business card confermata, operazione chiusa.
- irrilevante: notifiche social generiche non legate a lead o problemi operativi.

Verifiche locali aggiornate:

```text
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-global-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
node sales-kit/scripts/verify_outreach_no_recent_duplicates.mjs
npm run test:social:daily
SOCIAL_SHORT_ENTRY=2026-05-21-2026-05-21-audit-before-price npm run test:social:short
npm run test:social-public
npm test
npm run test:payments
git diff --check
```

Esito:

- follow-up D3: 18/18 validi.
- duplicati outreach recenti: 0 candidati.
- social daily: verde, 30 giorni, canali Instagram/Facebook/TikTok/YouTube Shorts.
- short 2026-05-21: verde, 1080x1920, 15.933s.
- canali pubblici: verde secondo contratto attuale, TikTok login-gated accettato.
- sito source gate: `npm test` verde.
- pagamenti Stripe: verde; PayPal ancora segnalato come `sessionDependentMisses`, ma test non bloccante secondo contratto attuale.
- whitespace: `git diff --check` verde.

Stato operativo:

- non ho inviato email;
- non ho pubblicato social;
- non ho eseguito pagamenti;
- non ho inserito dati personali su siti terzi;
- serve approvazione esplicita per inviare i 18 follow-up o pubblicare il post del giorno.

## Aggiornamento cascata 16:10 CEST

TikTok Studio e stato gestito nel Browser destro Codex sull'account operativo Cantoni.

Post preparato:

- entry: `2026-05-21-2026-05-21-audit-before-price`;
- tema: `Prima audit, poi prezzo`;
- file caricato: `short-video/2026-05-21-2026-05-21-audit-before-price-short.mp4`;
- descrizione inserita: caption TikTok locale con hashtag;
- controllo contenuto TikTok: `Nessun problema riscontrato`;
- visibilita: `Tutti`;
- caricamento alta qualita: attivo;
- audio: tentativo di aggiunta del suono consigliato `Let's Go!`, ma la preview finale continua a mostrare audio originale, quindi non va considerato verificato come audio esterno.

Stato: pronto nel composer TikTok, non pubblicato. Non ho premuto `Pubblica`.

## Aggiornamento cascata 16:25 CEST

Controllo eseguito nel Browser destro dentro Gmail web, account visibile e verificato come `cantonidigitalstudio@gmail.com`.

Ricerca commerciale usata:

```text
newer_than:2d (interessato OR interessata OR interested OR interesado OR interesse OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app OR OK OR roadmap OR reply OR risposta) -from:cantonidigitalstudio@gmail.com -MOO -DHL
```

Classificazione commerciale:

- positiva commerciale: 0.
- dubbia/da review: 0 nuove chiare nella ricerca 48h.
- negativa: 0.
- automatica/generica: 0 nuove nella query commerciale ristretta.
- operativa intercettata dalla query commerciale: avvisi sicurezza/login Google e TikTok, non risposte lead.

Ricerca operativa usata:

```text
newer_than:2d (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR sicurezza OR pagamento OR ordine OR consegna OR delivery OR security OR login)
```

Classificazione operativa:

- operativa urgente: 0 bloccanti evidenti dalla lista Gmail.
- operativa non urgente:
  - Facebook: notifica profilo e avviso accesso nuovo dispositivo; coerenti con setup social recente se riconosciuti.
  - TikTok: avvisi di login/verifica e nuovo dispositivo; coerenti con attivita TikTok recente se riconosciuti.
  - Google: avvisi sicurezza/accesso su account Cantoni e copia avviso per account collegato; da attenzionare solo se non riconosciuti.
  - Cloudflare: report minacce sopra media su `cantonidigitalstudio.com`; da rivedere in dashboard sicurezza, ma non blocca la cascata di oggi.
  - MOO/DHL: consegna business card confermata; pratica ordine chiusa.
- irrilevante: notifiche social generiche senza azione commerciale immediata.

Follow-up e duplicati:

```text
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-global-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
node sales-kit/scripts/verify_outreach_no_recent_duplicates.mjs
```

Esito:

- follow-up D3 2026-05-21: 18/18 validi.
- duplicati ready recenti: 0.
- nessuna email inviata.
- nessun post pubblicato.
- nessun pagamento o azione irreversibile.

Gate rilanciati dopo il controllo:

```text
npm test
npm run test:payments
npm run test:browser
npm run test:social:daily
SOCIAL_SHORT_ENTRY=2026-05-21-2026-05-21-audit-before-price npm run test:social:short
git diff --check
```

Esito gate:

- `npm test`: verde, i18n, integrita e smoke statici passano.
- `npm run test:payments`: verde, 2 Payment Link Stripe verificati senza transazioni; PayPal resta `sessionDependentMisses` per contesto checkout, non errore bloccante del test.
- `npm run test:browser`: verde, 2 viewport, 6 pagine, default/override valuta e consenso controllati.
- `npm run test:social:daily`: verde, 30 giorni e 4 canali.
- `test:social:short`: verde, video 1080x1920 da 15.933s.
- `git diff --check`: verde.

Review visiva nel Browser destro:

- aperta `review.html` del post `Prima audit, poi prezzo`;
- immagine caricata correttamente, 1080x1080;
- console della review: 0 errori dopo reload;
- server locale attivo su porta `4213` per mostrare la review.

## Aggiornamento carousel TikTok 16:55 CEST

Decisione operativa: per TikTok questo contenuto non deve partire dal video MP4. Il messaggio e troppo testuale; funziona meglio come carosello di immagini, cosi la persona puo leggere slide per slide e TikTok puo aggiungere musica nativa.

Pacchetto creato:

- entry: `2026-05-21-2026-05-21-audit-before-price`;
- cartella: `sales-kit/social-launch/daily-publish-pack/2026-05-21-2026-05-21-audit-before-price/tiktok-carousel/`;
- slide: 5 PNG verticali 1080x1920;
- review: `tiktok-carousel/review.html`;
- caption: `tiktok.caption.txt`;
- pubblicazione: non eseguita.

Verifiche:

```text
SOCIAL_CAROUSEL_ENTRY=2026-05-21-2026-05-21-audit-before-price npm run build:social:carousel
SOCIAL_CAROUSEL_ENTRY=2026-05-21-2026-05-21-audit-before-price npm run test:social:carousel
```

Esito:

- build carousel: verde;
- test carousel: verde, 5/5 slide valide, 1080x1920;
- review aperta nel Browser destro su porta `4213`;
- nessun post pubblicato;
- prossimo step: aprire upload TikTok in modalita foto/carousel, caricare le 5 slide in ordine, scegliere audio dentro TikTok, inserire caption, fermarsi prima di `Pubblica` salvo approvazione esplicita.

## Aggiornamento TikTok web/mobile 17:26 CEST

Tentativo eseguito nel Browser destro:

- `https://www.tiktok.com/tiktokstudio/upload?from=webapp&lang=it-IT&tab=photo`;
- `https://www.tiktok.com/upload?lang=it-IT`.

Risultato:

- entrambe le superfici web mostrano solo `Seleziona video`;
- l'input file e singolo e accetta `video/*`;
- il caricamento multiplo delle 5 immagini non e supportato dal web uploader;
- nessuna pubblicazione eseguita.

Controllo dispositivi:

- `adb devices -l`: nessun dispositivo Android collegato;
- `xcrun xctrace list devices`: iPhone/iPad risultano offline;
- quindi non posso completare ora il carousel tramite app mobile da questa macchina.

Pacchetto pronto:

- `sales-kit/social-launch/daily-publish-pack/2026-05-21-2026-05-21-audit-before-price/tiktok-carousel/mobile-upload-ready.zip`;
- contiene le 5 slide PNG ordinate, `caption.txt` e `manifest.json`;
- prossimo step reale: aprire TikTok app su telefono/iPad, creare post foto/carousel, selezionare le 5 immagini in ordine, scegliere audio trend dentro TikTok, incollare caption, pubblicare solo dopo approvazione finale.
