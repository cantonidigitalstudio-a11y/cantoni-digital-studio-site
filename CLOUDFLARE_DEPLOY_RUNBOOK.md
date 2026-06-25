# Cantoni Site Cloudflare Pages Runbook

## Stato attuale
- dominio registrato su Cloudflare Registrar: `cantonidigitalstudio.com`
- nameserver attivi:
  - `hope.ns.cloudflare.com`
  - `luke.ns.cloudflare.com`
- sito statico pronto al deploy
- outbound ancora fermo tramite `sales-kit/outbound_pause.flag`

## File di deploy
- `wrangler.toml`
- `_headers`
- `scripts/build_cloudflare_public_dir.sh`
- `scripts/verify_deploy_artifact.cjs`
- `scripts/verify_cloudflare_deploy_auth.mjs`
- `scripts/deploy_cloudflare_pages.sh`
- `scripts/deploy_cloudflare_pages_direct.sh`

## Prerequisiti Cloudflare
Serve una sessione Cloudflare valida per `wrangler` oppure un token API Cantoni
per deploy diretto non interattivo.

Verifica:
```bash
cd "<repo-root>"
npm run audit:cloudflare-auth
npm run audit:cloudflare-api
npm run test:cloudflare-direct-deploy-contract
node scripts/verify_cloudflare_api_credentials.mjs --pages-only
```

Gli script usano il binario installato `wrangler` o `WRANGLER_BIN` se impostato.
Non usano `npx` per evitare download impliciti in fase di deploy.

Stato verificato 2026-06-25:

- `npm run audit:cloudflare-auth` fallisce prima del deploy: `wrangler whoami` passa, ma `wrangler pages project list --json` fallisce con `Authentication error [code: 10000]`.
- Diagnosi attesa nel JSON: `diagnostic_code=pages_api_authentication_error_10000`.
- Causa probabile: token/sessione Cloudflare scaduta, account Cloudflare non corretto o permessi Pages insufficienti.
- Non tentare deploy OAuth finche `npm run audit:cloudflare-auth` non torna verde su `whoami` e su `pages project list`.
- Se OAuth resta bloccato, usare il percorso token diretto solo quando `node scripts/verify_cloudflare_api_credentials.mjs --pages-only` passa con token e account Cantoni.
- `npm run audit:cloudflare-api` e read-only: verifica `/user/tokens/verify`, lettura deployments Pages e lettura DNS quando sono impostati `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_ZONE_ID`.
- Non usare sessioni Cloudflare di Excellentia, Mr Collins, Diogomez, EC8 o personali per questo sito.

Permessi minimi per token/API:

- account corretto di Cantoni Digital Studio;
- `CLOUDFLARE_ACCOUNT_ID` dell'account Cantoni quando si usa CI o token non interattivo;
- `CLOUDFLARE_ZONE_ID` della zona `cantonidigitalstudio.com` per diagnosticare e applicare record DNS;
- permesso Account > Cloudflare Pages > Edit per deploy diretto Pages;
- permesso Zone > DNS > Edit per applicare record email DNS;
- token salvato solo in ambiente sicuro, mai nel repo.

## Build artifact locale
```bash
cd "<repo-root>"
npm run build:cloudflare
npm run test:artifact
SITE_ROOT=.cloudflare-pages npm run test:browser
SITE_ROOT=.cloudflare-pages npm run test:payments
```

L'artifact pubblicabile e solo `.cloudflare-pages`. Non pubblicare mai la root del repo.

## Pacchetto manuale verificato
Se l'API Pages resta bloccata ma serve preparare un handoff manuale per
Cloudflare dashboard, genera uno ZIP verificato:

```bash
cd "<repo-root>"
npm run build:cloudflare-upload-package
```

Il comando:

1. ricostruisce `.cloudflare-pages`;
2. esegue `test:artifact`, `test:browser` e `test:payments` sull'artifact;
3. crea uno ZIP in `sales-kit/generated/cloudflare-manual-upload/`;
4. scrive manifest JSON, checksum SHA-256 e README operativo accanto allo ZIP.

Lo ZIP contiene i file pubblici direttamente alla root. Non contiene la root del
repo, sorgenti, script, dati privati o `sales-kit` oltre a `sales-kit/fx_rates.json`.

Fonte Cloudflare, verificata il 2026-06-25: Direct Upload supporta asset
precompilati; Wrangler carica una cartella, mentre drag-and-drop dashboard
accetta ZIP o cartella solo per progetti Direct Upload. Se il progetto esistente
non espone drag-and-drop, usare lo ZIP solo come handoff/review e pubblicare la
cartella `.cloudflare-pages` via Wrangler dopo auth corretta.

Per preparare in una sola run lo ZIP, i record DNS email, il report drift live e
il launch handoff indicizzato, usare:

```bash
cd "<repo-root>"
npm run export:launch-operator-pack
```

L'indice viene scritto in `sales-kit/generated/launch-operator-pack/` e deve
essere letto prima di qualsiasi operazione manuale su Cloudflare o DNS.

## Deploy preview
```bash
cd "<repo-root>"
export CLOUDFLARE_PAGES_PROJECT_NAME="cantonidigitalstudio"
export CLOUDFLARE_CUSTOM_DOMAIN="cantonidigitalstudio.com"
export CLOUDFLARE_PAGES_BRANCH="preview-cantoni-site"
bash scripts/deploy_cloudflare_pages.sh
```

## Deploy preview con token diretto
Usare questo percorso quando OAuth Wrangler non e affidabile ma sono disponibili
`CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` dell'account Cantoni.

```bash
cd "<repo-root>"
export CLOUDFLARE_API_TOKEN="<token-live-only>"
export CLOUDFLARE_ACCOUNT_ID="<account-id-cantoni>"
export CLOUDFLARE_PAGES_PROJECT_NAME="cantonidigitalstudio"
export CLOUDFLARE_CUSTOM_DOMAIN="cantonidigitalstudio.com"
export CLOUDFLARE_PAGES_BRANCH="preview-cantoni-site"
export CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL="deploy-cantoni-pages-direct"
npm run deploy:cloudflare:direct
```

Regole del percorso diretto:
- il token resta solo in ambiente live, mai nel repo;
- l'approval richiesta e esattamente
  `CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct`;
- `--pages-only` verifica token attivo e lettura deployments Pages senza
  richiedere `CLOUDFLARE_ZONE_ID`;
- lo script pubblica solo `.cloudflare-pages`;
- produzione su branch `main` richiede anche `ALLOW_PRODUCTION_DEPLOY=yes` e
  `CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`.

## Cosa fa lo script OAuth
1. verifica `npm run audit:cloudflare-auth`
2. esegue `npm run test:full`
3. genera `.cloudflare-pages`
4. verifica l'artifact pubblico
5. riverifica `npm run audit:cloudflare-auth`
6. crea il progetto Pages se non esiste
7. pubblica su branch preview, di default `preview-cantoni-site`

## Cosa fa lo script token diretto
1. verifica `node scripts/verify_cloudflare_api_credentials.mjs --pages-only`
2. esegue `npm run test:full`
3. genera `.cloudflare-pages`
4. verifica artifact, browser smoke e Payment Link sull'artifact
5. riverifica `--pages-only`
6. pubblica con `wrangler pages deploy .cloudflare-pages --project-name ... --branch ...`

## Produzione
La produzione non parte da questo runbook senza approvazione separata. Se un
deploy punta a `main`, gli script richiedono `ALLOW_PRODUCTION_DEPLOY=yes`; il
percorso token diretto richiede anche
`CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`.

## Gate pagamenti
`npm run test:payments` apre i Payment Link Stripe senza inserire carte e senza transazioni. Il gate richiede merchant `Cantoni Digital Studio`, importo `EUR`, UI checkout funzionante, carta e Klarna. PayPal resta richiesto, ma puo essere nascosto da Stripe/PayPal in browser headless senza sessione buyer: in quel caso il test lo registra in `sessionDependentMisses` e la verifica va completata nel Browser Use/in-app browser.

Verifica PayPal obbligatoria prima del deploy: aprire entrambi i Payment Link nel browser reale, controllare che Stripe Checkout mostri `Cantoni Digital Studio`, che PayPal sia selezionabile, e fermarsi senza premere pagamento finale.

Stato 2026-05-05: PayPal verificato visualmente su entrambi i Payment Link dopo aggiunta dei domini affidabili Stripe `cantonidigitalstudio.com` e `buy.stripe.com`.

Se PayPal non compare nemmeno nel browser reale, il codice del sito non può correggerlo da solo: PayPal va attivato/configurato nelle impostazioni metodi di pagamento del Dashboard Stripe e deve risultare compatibile con importo, valuta e paese del checkout.

## Debito PayPal / branding
- Decisione temporanea 2026-05-05: PayPal puo essere collegato al conto business gia esistente legato a EC8/EC8 Platform per sbloccare la disponibilita del metodo PayPal.
- Rischio accettato: PayPal puo mostrare o usare riferimenti del conto storico nelle schermate PayPal, nelle ricevute o nelle comunicazioni, anche se Stripe Checkout deve continuare a identificare il merchant come `Cantoni Digital Studio`.
- TODO: creare un PayPal Business dedicato a `Cantoni Digital Studio` oppure completare rinomina/verifica del conto esistente prima del go-live definitivo senza rischio di brand mismatch.
- Il test pagamenti blocca altri brand non correlati nel checkout Stripe, ma non blocca EC8/EC8 Platform finche questa eccezione temporanea resta approvata.

## Controlli dopo il go-live
- preview Pages raggiungibile e coerente con artifact locale
- pagine chiave:
  - `/`
  - `/servizi.html`
  - `/preventivo.html`
  - `/case-studies.html`
  - `/termini-commerciali.html`
  - `/privacy.html`
- `_headers` serviti correttamente
- `i18n.json` servito
- `sales-kit/fx_rates.json` servito
- form verso Apps Script attivo
- consenso analytics visibile e analytics bloccato fino ad accettazione
- Stripe checkout apribile senza fare transazioni

## Nota operativa
Se `wrangler login` non completa la callback OAuth, il progetto resta comunque pronto: manca solo l'autorizzazione Cloudflare, non lavoro di configurazione locale.

## Binding dominio
Il binding di `cantonidigitalstudio.com` va fatto solo dopo approvazione esplicita del go-live. In questa versione di `wrangler`, il binding del custom domain non è esposto come subcomando `pages domain add`, quindi il passo va fatto nel dashboard Cloudflare una volta autenticati.
