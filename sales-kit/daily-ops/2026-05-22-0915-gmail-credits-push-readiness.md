# 2026-05-22 09:15 - Gmail, crediti e push readiness

## Gmail Cantoni

Controllo eseguito nel Browser laterale visibile su Gmail con account attivo
`cantonidigitalstudio@gmail.com`.

Query commerciale ultimi 3 giorni:

```text
newer_than:3d (interessato OR interessata OR interested OR interesado OR intéressé OR interesse OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app OR OK OR roadmap OR reply OR risposta) -from:cantonidigitalstudio@gmail.com -MOO -DHL
```

Esito:

- positiva commerciale: 0
- dubbia / da review: 0 chiare
- negativa: 0
- automatica / generica: Google security, TikTok code, TikTok login

Query operativa ultimi 7 giorni:

```text
newer_than:7d (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR Google OR sicurezza OR security OR pagamento OR payment OR ordine OR consegna OR delivery OR account OR accesso) -from:cantonidigitalstudio@gmail.com
```

Esito operativo:

- operativa urgente: nessun blocco nuovo emerso dalla lista visibile
- operativa non urgente:
  - Google security / nuovi accessi: coerenti con lavoro operativo recente, da tenere monitorati
  - TikTok code / new device login: coerente con login operativo recente
  - Facebook login / notifica: coerente con setup operativo recente
  - Cloudflare threats report: da rivedere in dashboard sicurezza, non blocca push
  - MOO / DHL: ordine biglietti consegnato, problema DHL precedente risolto
- automatica / generica:
  - risposte hotel luxury / reservations: ricevute automatiche, nessun interesse umano chiaro

## Crediti / deploy

Correzione severa: la lettura Netlify sotto non e una verifica valida per
Cantoni Digital Studio, perche il team/account visto nel Browser non e stato
provato come canale Cantoni. Va quindi trattata solo come segnale di rischio su
un account Netlify visibile, non come stato crediti Cantoni.

Cloudflare:

- `wrangler whoami` funziona.
- Account associato: `cantonidigitalstudio@gmail.com`.
- Permesso `pages:write` presente.
- Progetto Pages `cantonidigitalstudio` visibile da CLI.
- Dashboard web richiede login, ma la CLI e sufficiente per deploy Pages se i gate sono verdi.

Netlify:

- CLI: token non valido / sessione scaduta.
- Dashboard Browser: team `netlify-xhu2bwa` visibile, ma non verificato come team Cantoni.
- Il banner crediti `over 75% of your credit allowance this month` non va attribuito a Cantoni finche il team/progetto corretto non e provato.
- Stato corretto: Netlify non controllato per Cantoni. Non usare Netlify per deploy Cantoni ora. Prima serve verificare account, team, progetto e crediti giusti.

## Git / push

- Branch corrente: `codex/cantoni-production-grade-preview`.
- Upstream: `cantoni/codex/cantoni-production-grade-preview`.
- `git ls-remote --heads cantoni` funziona.
- Remote corretto per Cantoni: `cantoni`.
- Remote `origin` punta a Excellentia e non va usato per push Cantoni.

## Stato blocco

Il push GitHub e tecnicamente possibile, ma non va fatto ancora con `git add .`.
Il worktree ha molte modifiche e file nuovi, quindi serve staging con allowlist.

Sequenza corretta:

1. selezionare file Cantoni da committare;
2. lasciare fuori artefatti non necessari o troppo pesanti;
3. verificare `git diff --cached`;
4. rilanciare gate essenziali;
5. commit ordinato;
6. push solo su remote `cantoni`;
7. deploy Cloudflare solo dopo conferma esplicita.

## Aggiornamento cascata 14:34 CEST

Controllo Gmail eseguito nel Browser laterale visibile su Gmail con account
attivo `cantonidigitalstudio@gmail.com`.

Query commerciale ultimi 7 giorni:

```text
newer_than:7d (interessato OR interessata OR interested OR interesado OR intéressé OR interesse OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app OR OK OR roadmap OR reply OR risposta) -from:cantonidigitalstudio@gmail.com -MOO -DHL
```

Classificazione visibile:

- positiva commerciale: 0.
- dubbia / da review: 0 chiare.
- negativa: 0.
- automatica / generica: hotel reservations e ricevute automatiche.
- operativa non urgente: Google security, Facebook login/notifiche, TikTok
  login/verifica, Cloudflare threats report, MOO/DHL consegna chiusa.
- operativa urgente: 0 emerse dalla lista visibile.

Canali verificati:

- GitHub CLI: account attivo `cantonidigitalstudio-a11y`.
- Remote Cantoni valido: `cantoni`.
- Remote `origin` ancora Excellentia: non usare per push Cantoni.
- Cloudflare Wrangler: account `cantonidigitalstudio@gmail.com`, scope
  `pages:write` presente.
- Netlify: non usato; non verificato come canale Cantoni in questa cascata.

Social 2026-05-22:

- post del giorno: `2026-05-22-2026-05-22-services-complete`.
- copy migliorato per chiarezza cliente: meno testo interno, CTA `Richiedi audit`,
  riferimento a siti, e-commerce, web app, app mobile, pagamenti e automazioni.
- corretto generatore short/carousel: i post servizi non usano piu etichette
  `PORTFOLIO REALE` o footer portfolio.
- creato pacchetto TikTok carousel 1080x1920:
  `sales-kit/social-launch/daily-publish-pack/2026-05-22-2026-05-22-services-complete/tiktok-carousel/`.
- creato short video 1080x1920:
  `sales-kit/social-launch/daily-publish-pack/2026-05-22-2026-05-22-services-complete/short-video/`.

Verifiche:

```text
SOCIAL_SHORT_ENTRY=2026-05-22-2026-05-22-services-complete npm run build:social:short
SOCIAL_CAROUSEL_ENTRY=2026-05-22-2026-05-22-services-complete npm run build:social:carousel
SOCIAL_CAROUSEL_ENTRY=2026-05-22-2026-05-22-services-complete npm run test:social:carousel
npm run test:social:daily
SOCIAL_SHORT_ENTRY=2026-05-22-2026-05-22-services-complete npm run test:social:short
git diff --check
```

Esito:

- tutti i gate social sopra: verdi.
- follow-up D3 2026-05-21: 18/18 validi.
- duplicati recenti ready: 0.
- nessuna email inviata.
- nessun post pubblicato.
- nessun pagamento.
- nessun deploy produzione.

## Aggiornamento cascata 15:05 CEST - igiene worktree

Stato rilevato dopo il push social:

- branch allineato a `cantoni/codex/cantoni-production-grade-preview`;
- modifiche residue principali: pipeline lead, batch outreach storici e prove
  biglietto da visita;
- nessun nuovo invio email, nessuna pubblicazione social, nessun deploy.

Decisione tecnica applicata:

- i sorgenti dei biglietti restano in Git (`HTML`, `SVG`, `MD`, template);
- PDF e PNG dei biglietti sono trattati come export/prove locali, quindi
  ignorati da Git per non sporcare i commit;
- i batch lead e `sales-kit/lead_pipeline.csv` non vengono cancellati o
  normalizzati automaticamente: contengono stato commerciale reale e vanno
  committati solo con allowlist dopo review specifica.

Stato da non confondere:

- `sales-kit/lead-batches/2026-05-15-global-50/`: storico dei 50 lead
  contattati e follow-up D3, non file temporanei da eliminare.
- `sales-kit/lead-batches/2026-05-17-*`: batch preparati/review per lead
  successivi, da usare solo dopo controllo Gmail e approvazione invio.
- `sales-kit/business-cards/*.pdf` e `*.png`: prove o export per stampa, utili
  localmente ma non sorgente applicativo.

Prossima decisione:

1. review pipeline lead e batch storici;
2. scegliere cosa committare come archivio commerciale privato;
3. lasciare fuori dal deploy pubblico ogni file non necessario o sensibile.

## Aggiornamento cascata 15:18 CEST - repo pubblico e lead

Verifica GitHub:

- repo: `cantonidigitalstudio-a11y/cantoni-digital-studio-site`;
- visibilita: `PUBLIC`;
- default branch: `codex/cantoni-production-grade-preview`.

Conseguenza:

- i nuovi batch lead reali non vanno committati nel repo pubblico;
- `sales-kit/lead_pipeline.csv` contiene dati operativi e non deve entrare in
  commit automatici;
- i file gia tracciati nel repo vanno trattati come debito da audit/sanificare,
  non come modello per aggiungere altri dati sensibili.

Protezione applicata:

- `.gitignore` blocca nuovi batch datati sotto `sales-kit/lead-batches/20*/`;
- `.gitignore` blocca `sales-kit/lead_pipeline.csv` per prevenire re-add dopo
  eventuale de-tracking futuro;
- il README lead chiarisce che in Git devono stare solo esempi sanificati,
  script, regole e documentazione.
