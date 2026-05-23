# Cantoni Digital Studio - Daily ops 2026-05-23 09:15 CEST

## Identita e superficie usata

- Account Gmail controllato nel Browser destro: `cantonidigitalstudio@gmail.com`.
- Verifica visiva: titolo Gmail `Posta in arrivo (100) - cantonidigitalstudio@gmail.com - Gmail` e account Google attivo `Emanuele Cantoni (cantonidigitalstudio@gmail.com)`.
- Nessuna email inviata.
- Nessun post pubblicato al momento del primo controllo.
- Nessun pagamento eseguito.
- Nessun deploy eseguito.

## Gmail - operativo

Query Browser:

```text
newer_than:2d (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR Google OR sicurezza OR security OR pagamento OR payment OR ordine OR consegna OR delivery OR account OR accesso) -from:cantonidigitalstudio@gmail.com
```

Classificazione:

- operativa urgente: 0 chiare.
- operativa non urgente:
  - Google security su account terzi dove Cantoni risulta email di recupero.
  - Facebook: aggiornamento/notifica generica.
- irrilevante/generica: notifiche non operative senza azione immediata.

Nota: gli avvisi sicurezza vanno trattati come non urgenti solo se gli accessi sono riconosciuti; se non riconosciuti, diventano da review immediata account per account.

## Gmail - commerciale

Query Browser:

```text
newer_than:7d (interessato OR interessata OR interested OR interesado OR intéressé OR interesse OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app OR OK OR roadmap OR reply OR risposta) -from:cantonidigitalstudio@gmail.com -MOO -DHL
```

Classificazione:

- positiva commerciale: 0 chiare.
- dubbia/da review: 0 chiare dopo apertura del thread principale.
- negativa: 0.
- automatica/generica:
  - Le Bristol Paris: risposta di presa in carico, non interesse commerciale.
  - The Fullerton Hotel Singapore: automatic reply.
  - altri thread hotel simili restano da trattare come automatici finche non arriva una risposta umana specifica.

## Follow-up e pipeline

- Controllo duplicati recente: verde, 0 candidati.
- Code D3 note ancora pronte dal 21 maggio:
  - `sales-kit/lead-batches/2026-05-17-next-global-6/followup_d3_queue_2026-05-21.json`: 6.
  - `sales-kit/lead-batches/2026-05-17-next-quality-6/followup_d3_queue_2026-05-21.json`: 6.
  - `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup_d3_queue_2026-05-21.json`: 6.
- Stato: non reinviare a caso. Prima di qualsiasi invio serve ricontrollo Gmail live e approvazione esplicita del batch.

## Social - 2026-05-24 mobile-first

Pack verificato:

- immagine Instagram/Facebook: `sales-kit/social-launch/daily-publish-pack/2026-05-24-2026-05-24-mobile-first/2026-05-24-2026-05-24-mobile-first.png`
- TikTok carousel review: `sales-kit/social-launch/daily-publish-pack/2026-05-24-2026-05-24-mobile-first/tiktok-carousel/review.html`
- video short: `sales-kit/social-launch/daily-publish-pack/2026-05-24-2026-05-24-mobile-first/short-video/2026-05-24-2026-05-24-mobile-first-short.mp4`

Tentativo Instagram:

- account Instagram verificato: `cantonidigitalstudio`.
- composer `Crea nuovo post` aperto nel Browser destro.
- caricamento file non completato: il Browser non espone un metodo upload file per il campo nascosto Instagram; paste da clipboard non accettato dal composer; selettore file non ha agganciato il PNG.
- diagnostica selettore file: il controllo macOS del file picker e bloccato da permessi Accessibilita (`osascript non ammette l'accesso di assistenza`).
- stato: non pubblicato.

Decisione operativa:

- Il contenuto e valido.
- Per pubblicarlo serve usare un canale di upload effettivamente funzionante: selettore file manuale nel Browser destro, app mobile, Meta Business Suite con upload disponibile, o automazione dedicata con supporto file upload.

Aggiornamento 2026-05-23 03:04 CEST:

- Pubblicazione Instagram approvata esplicitamente dall'utente dopo review nel Browser destro.
- File caricato tramite selettore macOS aperto dal composer Instagram.
- Account verificato: `@cantonidigitalstudio`.
- Stato Instagram: pubblicato e verificato sul profilo.
- URL pubblico: `https://www.instagram.com/cantonidigitalstudio/p/DYqXZC0Agwv/`.
- Verifica visiva: profilo Instagram aggiornato a `5 post`; primo post aperto con URL `/cantonidigitalstudio/p/DYqXZC0Agwv/`.
- Facebook, TikTok e YouTube Shorts non pubblicati in questo passaggio.

## Verifiche eseguite

```text
npm run test:outreach-dedupe
npm run test:social:daily
SOCIAL_CAROUSEL_ENTRY=2026-05-24-2026-05-24-mobile-first node sales-kit/scripts/verify_tiktok_carousel_pack.mjs
git diff --check
git status --short
```

Esito:

- duplicati outreach: verde, 0 candidati.
- social daily: verde, 30 entries, canali Instagram/Facebook/TikTok/YouTube Shorts.
- carousel 2026-05-24: verde, 4 slide, 0 failure.
- whitespace: verde.
- worktree prima di questo log: pulito.

## Prossime azioni

1. Chiudere pubblicazione Instagram/Facebook/TikTok/YouTube solo quando il canale upload e realmente operativo.
2. Se il post va pubblicato oggi invece del 24 maggio, segnare nel calendario social la variazione.
3. Continuare controllo Gmail dal Browser destro prima di ogni invio follow-up.
4. Non fare deploy produzione finche non viene richiesto esplicitamente.

## Aggiornamento heartbeat 09:17 CEST

### Gmail Browser Cantoni

- Verifica valida: Browser destro su Gmail con titolo `Risultati di ricerca - cantonidigitalstudio@gmail.com - Gmail`.
- Account visibile: `Emanuele Cantoni (cantonidigitalstudio@gmail.com)`.
- Nessuna email inviata, nessuna risposta aperta in modalita composizione, nessun codice OTP riportato.

Ricerca commerciale 7 giorni:

- positiva commerciale: 0.
- dubbia/da review: 0 chiare.
- negativa: 0.
- automatica/generica:
  - Le Bristol Paris: presa in carico automatica, aperta e verificata.
  - The Fullerton Hotel Singapore: automatic reply.
  - Claridge's, The Connaught, The Berkeley: risposte generiche di ricezione/ospitalita, non interesse esplicito.

Ricerca operativa 7 giorni:

- operativa urgente: 0 confermate.
- account/security da monitorare:
  - Google security su account terzi dove Cantoni risulta email di recupero.
  - Google security su nuovo accesso Cantoni.
  - TikTok/Facebook new-device login: coerenti con le sessioni recenti solo se riconosciuti dall'utente.
  - Cloudflare: traffico/threats aumentati ma mitigati da WAF/bot protection base.
- supplier/order:
  - MOO/DHL: consegna risulta chiusa/consegnata il 20 maggio; nessuna azione urgente residua emersa.

### Follow-up

- `npm run test:global-followup-d3`: non verde per coda storica vuota; lo script non trova follow-up residui nel batch globale del 15 maggio.
- Code D3 21 maggio ancora presenti come `pending`: 18 totali su NG6/NQ6/NEU6.
- Regola: non inviare finche non viene rieseguita review batch e approvazione esplicita.

### Social pack

- `npm run test:social:daily`: verde, 30 entry, canali Instagram/Facebook/TikTok/YouTube Shorts.
- `npm run test:social-public`: verde, 5/5 canali/contratti pubblici verificati.
- Pack 2026-05-23 `E-commerce con perimetro scritto` aperto nel Browser destro via server locale temporaneo.
- Asset principale e TikTok carousel controllati visivamente: leggibili, senza prezzi pubblici, senza promessa assoluta evidente.
- Stato: pronto per review umana/pubblicazione solo dopo approvazione esplicita.

## Aggiornamento cascata 09:30 CEST

### Documentazione batch privati

- Allineati i README locali dei batch privati NG6/NQ6/NEU6: i batch erano già `6/6 sent`, ma alcuni README datati riportavano ancora `Prepared but not sent`.
- I batch datati sono ignorati da Git per proteggere lead, email, audit e stato operativo: la correzione resta locale/privata, non nel repo pubblico.

### Follow-up D3

- NG6: `6/6` follow-up verificati con `verify_followup_queue.mjs`, 0 failure.
- NQ6: `6/6` follow-up verificati con `verify_followup_queue.mjs`, 0 failure.
- NEU6: `6/6` follow-up verificati con `verify_followup_queue.mjs`, 0 failure.
- Review HTML dei tre batch controllate: nessun prezzo pubblico, reply-to Cantoni, lingua e valuta coerenti col mercato.
- Stato: tecnicamente pronti, ma non inviati. Prima dell'invio serve ricontrollo Gmail Cantoni nel Browser destro e approvazione esplicita.

### Social e canali

- `npm run test:social:daily`: verde.
- `SOCIAL_CAROUSEL_ENTRY=2026-05-23-2026-05-23-ecommerce-perimetro node sales-kit/scripts/verify_tiktok_carousel_pack.mjs`: verde, 4 slide, 0 failure.
- `npm run test:social-public`: verde, 5/5.
- Stato: post 2026-05-23 pronto per pubblicazione solo dopo approvazione esplicita canale-per-canale.

### Browser laterale

- Server locale aperto su `127.0.0.1:4213` per la review social.
- Tentativo tool Browser: timeout. Snapshot successivo segnala avvio Chrome esterno/persistent context, quindi non dichiaro il pannello destro come controllato in modo affidabile per questa apertura.
- Regola operativa: qualunque Gmail/social action reale va fatta solo quando il pannello destro mostra visibilmente pagina e account corretti.

## Aggiornamento implementazione piano 16:24 CEST

### Browser destro come superficie unica

- Browser in-app `iab` agganciato e reso visibile.
- Gmail `u/2` scartata: titolo/account non Cantoni.
- Gmail `u/0` confermata: titolo `Posta in arrivo (100) - cantonidigitalstudio@gmail.com - Gmail` e account visibile `Emanuele Cantoni (cantonidigitalstudio@gmail.com)`.
- Per le azioni reali resta valida la regola: pagina, URL, titolo e account devono essere visibili nel pannello destro prima di Gmail/social.

### Gmail Cantoni

Ricerca commerciale 7 giorni:

- positiva commerciale: 0.
- dubbia/da review: 0 chiare.
- negativa: 0.
- automatica/generica: Le Bristol Paris, Fullerton Singapore, Claridge's, The Connaught, The Berkeley e risposte di ricezione simili.

Ricerca operativa 7 giorni:

- operativa urgente: 0 confermate.
- operativa non urgente:
  - avvisi Google/security su Cantoni e su account terzi dove Cantoni risulta email di recupero;
  - notifiche Facebook/TikTok/Google coerenti con accessi recenti da monitorare;
  - MOO/DHL: ordine/consegna gia chiusi, consegna risultante il 20 maggio 2026 alle 15:15.
- Nessuna email inviata e nessuna azione irreversibile eseguita.

### Follow-up D3

- NG6: `6/6` validi con `verify_followup_queue.mjs`, 0 failure.
- NQ6: `6/6` validi con `verify_followup_queue.mjs`, 0 failure.
- NEU6: `6/6` validi con `verify_followup_queue.mjs`, 0 failure.
- Totale: `18/18` follow-up tecnicamente validi.
- Stato: non inviati. Prima dell'invio servono ricontrollo Gmail live nel Browser destro ed approvazione esplicita batch-per-batch.

### Social 2026-05-23

- Review pack `2026-05-23-2026-05-23-ecommerce-perimetro` aperta nel Browser in-app.
- Titolo confermato: `Review social - E-commerce con perimetro scritto`.
- DOM confermato: `E-commerce con perimetro scritto - review visuale social`.
- Carousel TikTok: `4` slide, 0 failure.
- Stato: pronto per review/pubblicazione, ma non pubblicato. Serve approvazione esplicita canale-per-canale.

### Gate e delivery

- `npm run test:social:daily`: verde dopo riesecuzione sequenziale.
- `npm run test:social-public`: verde dopo riesecuzione sequenziale.
- `SOCIAL_CAROUSEL_ENTRY=2026-05-23-2026-05-23-ecommerce-perimetro node sales-kit/scripts/verify_tiktok_carousel_pack.mjs`: verde.
- `git diff --check`: verde.
- Remote verificati: `cantoni` punta al repo Cantoni Digital Studio; `origin` punta a Excellentia e non va usato per Cantoni.
