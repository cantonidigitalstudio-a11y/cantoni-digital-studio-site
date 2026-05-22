# Cantoni Digital Studio - Daily ops 2026-05-20 05:32 CEST

## Identità e superficie usata

- Account controllato: `cantonidigitalstudio@gmail.com`.
- Superficie operativa: Browser destro Codex, Gmail web live.
- Nessuna email inviata, nessun post pubblicato, nessun pagamento eseguito.

## Gmail - controllo commerciale

Query Browser:

```text
newer_than:1d (interessato OR interessata OR interested OR interesado OR intéressé OR interesse OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app OR OK OR roadmap OR reply OR risposta) -from:cantonidigitalstudio@gmail.com -MOO -DHL
```

Risultato:

- positiva commerciale: 0
- dubbia/da review: 0
- negativa: 0
- automatica/generica: 0
- operativa non urgente intercettata dalla query: 1, Google security copy per `mrcollinstravel@gmail.com`

## Gmail - controllo operativo

Query Browser:

```text
newer_than:1d (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR sicurezza OR security OR pagamento OR payment OR ordine OR consegna OR delivery OR account OR accesso) -from:cantonidigitalstudio@gmail.com
```

Risultato:

- operativa urgente: 0
- operativa non urgente: 2
  - Facebook, 2026-05-20 01:34: nuovo accesso vicino a San Benedetto del Tronto su Chrome/macOS. Coerente con attività operative recenti, da attenzionare solo se non riconosciuto.
  - Google, 2026-05-19 18:12: copia avviso sicurezza per `mrcollinstravel@gmail.com` perché Cantoni è email di recupero.
- MOO/DHL: nessuna nuova criticità nell'ultimo giorno. Stato precedente già gestito: ritiro DHL/MOO a carico utente.
- Stripe/PayPal/GitHub/Cloudflare/Netlify: nessun problema recente trovato nella query ultimo giorno.

## Follow-up

Verifica code 2026-05-21:

- `sales-kit/lead-batches/2026-05-17-next-global-6/followup_d3_queue_2026-05-21.json`: 6/6 validi.
- `sales-kit/lead-batches/2026-05-17-next-quality-6/followup_d3_queue_2026-05-21.json`: 6/6 validi.
- `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup_d3_queue_2026-05-21.json`: 6/6 validi.

Non reinviare prima del 2026-05-21 senza nuovo controllo risposte/duplicati.

## Social - post 2026-05-20

Post del giorno: `EC8 Platform: piattaforma e app`.

Correzioni fatte:

- generato short video mancante per `2026-05-20-2026-05-20-ec8-platform`;
- corretto mismatch lingua: il pack EC8 è italiano (`it-IT`) con adattamento secondario inglese (`en-US`), invece di dichiarare `es-ES`;
- aggiornato il registro portfolio EC8 con link App Store e Play Store verificati via HTTP il 2026-05-20.

Stato:

- asset immagine review aperto nel Browser destro via server locale `127.0.0.1:4215`;
- short video MP4 generato e verificato: 1080x1920, durata 15.933s;
- pubblicazione ancora da approvare/eseguire manualmente canale per canale.

## Verifiche eseguite

```text
npm run test:social:daily
FOLLOWUP_QUEUE_FILE=...next-global-6... node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=...next-quality-6... node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=...next-europe-quality-6... node sales-kit/scripts/verify_followup_queue.mjs
SOCIAL_SHORT_ENTRY=2026-05-20-2026-05-20-ec8-platform npm run build:social:short
SOCIAL_SHORT_ENTRY=2026-05-20-2026-05-20-ec8-platform npm run test:social:short
npm run test:social
npm run test:social-public
git diff --check
```

Esito:

- social daily: verde, 30 giorni, 4 canali, 0 failure;
- social completo: verde;
- canali pubblici: verde; Instagram e Facebook rispondono, TikTok resta login-gated ma accettato dal contratto attuale;
- short EC8: verde;
- follow-up 2026-05-21: verde;
- whitespace: verde.

## Prossime azioni consigliate

1. Pubblicare o approvare pubblicazione del post EC8 solo dopo review finale sul canale disponibile.
2. Preparare controllo Gmail del 2026-05-21 prima di inviare i 18 follow-up D3.
3. Sbloccare canali Facebook/TikTok/YouTube in modo stabile: sessione pagina Facebook, TikTok con Google Cantoni, canale YouTube Cantoni.
4. Pulire worktree e separare commit social/outreach/sito: il repository contiene molte modifiche e file nuovi non ancora ordinati.

## Aggiornamento canali 2026-05-20

- Facebook: pagina Cantoni Digital Studio verificata nel Browser su `https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/`.
- YouTube: canale Cantoni creato con account Google `cantonidigitalstudio@gmail.com` e verificato su `https://www.youtube.com/@cantonidigitalstudio`; ID canale `UCKt8YnTZJVRQ6s9f_PE2fXg`.
- TikTok: login/signup via `Continue with Google` testato nel Browser destro; il click resta bloccato senza popup o navigazione. Non usare email/password o Facebook come workaround senza conferma specifica.
- Coordinamento: creato handoff operativo per il Codex Digital Marketing in `sales-kit/social-launch/digital-marketing-codex-handoff.md`.

## Aggiornamento sito/kit 2026-05-20 - YouTube ufficiale

- Aggiornati i riferimenti pubblici del sito e del sales kit per includere `https://www.youtube.com/@cantonidigitalstudio`.
- File principali allineati: homepage, studio, servizi, case studies, preventivo, identita operativa, generatori outreach, template preventivo, playbook globale e controlli automatici.
- Il Browser destro e stato lasciato sul canale YouTube Cantoni; la tab mostra `Cantoni Digital Studio - YouTube`.
- Gate eseguiti dopo l'allineamento:
  - `npm test`: verde;
  - `npm run test:integrity`: verde;
  - `npm run test:branded-outreach`: verde;
  - `npm run test:social-public`: verde, con Instagram/Facebook/YouTube verificati e TikTok trattato come login-gated;
  - `npm run test:outreach-readiness`: verde;
- `git diff --check`: verde.

Nota delivery: le modifiche sono locali nel worktree. Non ho fatto commit/push/deploy in questa passata perche il repository contiene molte modifiche e file nuovi non legati solo a YouTube; va fatto con allowlist e gate completo prima di pubblicare.

## Ritentativo TikTok 2026-05-20

- Browser destro aperto su TikTok.
- `https://www.tiktok.com/signup`: pulsante `Continua con Google` presente ma non apre OAuth e non cambia URL.
- `https://www.tiktok.com/login`: pulsante `Continua con Google` presente ma non apre OAuth e non cambia URL.
- Stato operativo: TikTok resta bloccato da flusso OAuth nel Browser. Non ho usato email/password, Facebook o Apple come scorciatoia per non creare associazioni account sbagliate.

## Heartbeat 2026-05-20 09:18 CEST

- Esito Gmail Browser corrente: **BLOCCO GMAIL BROWSER**.
- Motivo: il pannello Browser destro apre Gmail, ma l'account visibile e attivo e `ec8platform@gmail.com`, non `cantonidigitalstudio@gmail.com`.
- Tentativi non distruttivi eseguiti:
  - apertura `https://mail.google.com/mail/u/0/#inbox`;
  - apertura diretta account Cantoni via URL Gmail, terminata su errore temporaneo Google;
  - prova `mail/u/1`, ricaduta ancora su `mail/u/0` EC8;
  - menu account Google aperto: disponibile solo `Aggiungi account`, quindi non ho inserito password o dati personali.
- Decisione: non classificare nessuna email come posta Cantoni controllata in questo heartbeat. Le email visibili su EC8 non sono fonte autorevole per Cantoni.

Controlli locali eseguiti senza azioni irreversibili:

```text
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-global-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
FOLLOWUP_QUEUE_FILE=sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup_d3_queue_2026-05-21.json node sales-kit/scripts/verify_followup_queue.mjs
npm run test:social:daily
npm run test:social-public
npm run test:integrity
SOCIAL_SHORT_ENTRY=2026-05-20-2026-05-20-ec8-platform npm run build:social:short
SOCIAL_SHORT_ENTRY=2026-05-20-2026-05-20-ec8-platform npm run test:social:short
npm run test:outreach-readiness
git diff --check
```

Esito:

- follow-up 2026-05-21: 18/18 validi, distribuiti su tre code da 6;
- social daily: verde, 30 giorni, 4 canali, 0 failure;
- canali pubblici: verde; Instagram, Facebook e YouTube pubblici, TikTok login-gated accettato dal contratto;
- sito: `test:integrity` verde, 20 HTML controllati;
- outreach readiness: verde;
- social short EC8: rigenerato e verificato, 1080x1920, 15.933s, stato `review_required_before_upload`;
- `git diff --check`: verde.

Social pack di oggi:

- Pack: `sales-kit/social-launch/daily-publish-pack/2026-05-20-2026-05-20-ec8-platform/`.
- Review aperta nel pannello Browser destro via `http://127.0.0.1:4216/.../review.html`.
- Immagine principale caricata correttamente, 1080x1080.
- Pubblicazione non eseguita: serve approvazione specifica e controllo finale del contenuto sul canale scelto.

Prossimo passo operativo:

1. Passare il pannello Browser destro a Gmail con account `cantonidigitalstudio@gmail.com`.
2. Solo dopo verificare inbox/search operative e classificare la posta Cantoni.
3. Se Gmail e verde, procedere con follow-up 2026-05-21 e pubblicazioni social solo dietro approvazione esplicita.
