# Cantoni Digital Studio - Daily ops 2026-05-23 09:15 CEST

## Identita e superficie usata

- Account Gmail controllato nel Browser destro: `cantonidigitalstudio@gmail.com`.
- Verifica visiva: titolo Gmail `Posta in arrivo (100) - cantonidigitalstudio@gmail.com - Gmail` e account Google attivo `Emanuele Cantoni (cantonidigitalstudio@gmail.com)`.
- Nessuna email inviata.
- Nessun post pubblicato.
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
  - Google security su `mrcollinstravel@gmail.com`, copia inviata a Cantoni come email di recupero.
  - Google security su `kairorisk@gmail.com`, copia inviata a Cantoni come email di recupero.
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
