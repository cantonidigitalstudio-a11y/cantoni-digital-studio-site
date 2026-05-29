# Cantoni Digital Studio - Daily ops 2026-05-29 12:00 CEST

## Identita e Browser destro

- Superficie usata: Browser in-app destro `iab`.
- Pagina Facebook Cantoni aperta e visibile: `https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/`.
- Nessuna email inviata.
- Nessun post pubblicato.
- Nessun pagamento eseguito.
- Nessun deploy eseguito.

## Gmail Cantoni

Stato: **VALIDO DOPO ACCESSO BROWSER DESTRO**.

Controllo iniziale effettuato nel Browser destro su Gmail:

- `mail/u/0`: account attivo `excellentiavip@gmail.com`.
- `mail/u/1`: account attivo `ec8platform@gmail.com`.
- `mail/u/2`: account attivo `emanuelecantoni24@gmail.com`.
- slot successivi: reindirizzano a `mail/u/0`.

Esito iniziale:

- `cantonidigitalstudio@gmail.com` non risulta account Gmail attivo nel Browser destro in questa passata.
- Il controllo Gmail Cantoni non e valido.

Ripresa dopo login manuale nel Browser destro:

- URL verificato: `https://mail.google.com/mail/u/3/#inbox`.
- Titolo verificato: `Posta in arrivo (102) - cantonidigitalstudio@gmail.com - Gmail`.
- Query commerciale recente eseguita nel Browser destro:
  `newer_than:7d (...) -from:cantonidigitalstudio@gmail.com -MOO -DHL`.
- Query operativa recente eseguita nel Browser destro:
  `after:2026/5/22 (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR Google OR sicurezza OR security OR pagamento OR payment OR ordine OR consegna OR delivery OR account OR accesso) -from:cantonidigitalstudio@gmail.com`.
- Query non-automatica recente eseguita nel Browser destro:
  `after:2026/5/22 -from:cantonidigitalstudio@gmail.com -Google -Facebook -TikTok -Cloudflare -Netlify -GitHub -Stripe -PayPal -MOO -DHL -Instagram`.

Classificazione ufficiale aggiornata:

- positiva commerciale: `0`.
- dubbia/da review: `1` avviso Google su `kairorisk@gmail.com`, da confermare se account noto/previsto.
- negativa: `0`.
- automatica/generica: `1` notifica Facebook del 28 maggio.
- operativa urgente: `0`.
- operativa non urgente: avvisi Google sicurezza/recupero su `mrcollinstravel@gmail.com` del 22, 23, 24 e 25 maggio; notifica Facebook da monitorare.
- irrilevante: `0` nel perimetro controllato.

Nota follow-up:

- nessuna risposta umana positiva o negativa trovata nella finestra recente;
- nessuna esclusione lead necessaria sulla base della Gmail Cantoni verificata oggi;
- non e stata inviata alcuna email.

## Follow-up D3

Problema trovato:

- `npm run test:global-followup-d3` falliva perche ricostruiva una coda storica vuota e poi la trattava come errore assoluto;
- la coda vuota e corretta nello stato attuale, perche i 50 lead del batch risultano gia in `FOLLOWUP_D3`.

Correzione:

- aggiornato il target storico del batch globale a `2026-05-22`;
- aggiunto `sales-kit/scripts/verify_global_followup_state.mjs`;
- il gate ora accetta coda vuota solo se dimostra che non ci sono `CONTACTED` scaduti e che i 50 lead sono gia `FOLLOWUP_D3`.

Verifica:

- `npm run test:global-followup-d3`: passa.
- Stato verificato: `50` righe `FOLLOWUP_D3`, `0` righe `CONTACTED` scadute.
- Nessun follow-up inviato in questa passata.

## Facebook

Pagina pubblica Cantoni aperta nel Browser destro:

- titolo: `Cantoni Digital Studio | Facebook`;
- URL: `https://www.facebook.com/people/Cantoni-Digital-Studio/61589398630376/`.

Stato:

- pagina pubblica visibile;
- presente popup/login Facebook;
- non verificata sessione come gestore pagina;
- nessuna modifica o pubblicazione eseguita.

## Stato operativo locale

Da completare prima di push/deploy:

- separare il worktree in commit logici;
- non usare `git add .`;
- verificare che le modifiche pubbliche non includano dati lead privati;
- rilanciare gate principali dopo la selezione file.

## Gate eseguiti

Eseguiti dopo il controllo Browser/Gmail:

- `npm test`: passa.
- `npm run test:social:daily`: passa.
- `npm run test:social-public`: passa.
- `git diff --check`: passa.
- `npm run test:full`: passa, incluso `test:vip`, `build:cloudflare`, `test:artifact`, `test:browser:artifact`, `test:payments:artifact`.

Correzione gate:

- ripristinato `npm run test:vip` dentro `npm run test:full`, per non abbassare il gate production-grade senza decisione esplicita.

Note pagamento:

- Payment Link Stripe verificati senza transazioni reali.
- Merchant atteso: `Cantoni Digital Studio`.
- Metodi osservati dal gate automatico: carta, Klarna, Bancontact, MB WAY.
- PayPal resta `sessionDependentMisses` nei test automatici: non e fallimento del gate, ma per dichiararlo operativo va verificato nel checkout reale con sessione compatibile.

Stato invariato:

- nessuna email inviata;
- nessun post pubblicato;
- nessun deploy eseguito;
- nessun pagamento eseguito.

## Social pack 2026-05-29

Review aperta nel Browser destro:

- `http://127.0.0.1:4213/sales-kit/social-launch/daily-publish-pack/2026-05-29-2026-05-29-dashboard-admin/review.html?v=dashboard-fixed-20260529`.

Problema trovato e corretto:

- il pack `Quando serve una dashboard` usava ancora l'asset generico `Siti, e-commerce, web app e app`;
- aggiunto asset dedicato `08-dashboard-admin`;
- collegato il giorno `2026-05-29-dashboard-admin` all'asset dedicato;
- rigenerato il pack.

Verifica dopo correzione:

- `npm run test:social:daily`: passa.
- `npm run test:social`: passa.
- `npm run test:full`: ripassato dopo la correzione e passa.

Stato pubblicazione:

- non pubblicato;
- richiede approvazione esplicita canale per canale.

Verifiche social aggiuntive:

- `npm run test:social:daily`: passa.
- `npm run test:social-public`: passa.
- canali pubblici verificati dal gate: Instagram, Facebook, TikTok login-gated accettato, YouTube, pagina identita.
- corretto il gate YouTube per attendere/retry quando la pagina resta sullo skeleton di caricamento prima di leggere il proof text.

Verifica whitespace:

- `git diff --check`: passa.

Gate completo:

- `npm run test:full`: passa dopo accesso Gmail, correzione follow-up state e hardening del verifier YouTube.
