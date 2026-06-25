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
- `scripts/verify_cloudflare_artifact_readiness.cjs`
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
npm run audit:git-deploy-state
npm run audit:cloudflare-api
npm run audit:cloudflare-pages-api
npm run audit:cloudflare-dns-api
npm run test:cloudflare-auth-contract
npm run test:cloudflare-direct-deploy-contract
npm run test:cloudflare-oauth-deploy-contract
node scripts/verify_cloudflare_api_credentials.mjs --pages-only
```

Gli script usano il binario installato `wrangler` o `WRANGLER_BIN` se impostato.
Non usano `npx` per evitare download impliciti in fase di deploy.

Stato verificato 2026-06-25:

- `npm run audit:cloudflare-auth` fallisce prima del deploy: `wrangler whoami` passa, ma `wrangler pages project list --json` fallisce con `Authentication error [code: 10000]`.
- Diagnosi attesa nel JSON: `diagnostic_code=pages_api_authentication_error_10000`.
- Causa probabile: token/sessione Cloudflare scaduta, account Cloudflare non corretto o permessi Pages insufficienti.
- Non tentare deploy OAuth finche `npm run audit:cloudflare-auth` non torna verde su `whoami`, su `pages project list` e su `project_listed=true` per `cantonidigitalstudio`.
- Gli script non creano piu il progetto Pages implicitamente: il progetto Cloudflare Pages corretto deve essere gia visibile all'audit, oppure va creato/linkato nel dashboard Cloudflare prima del deploy.
- Non tentare deploy diretto finche `npm run audit:git-deploy-state` non torna
  verde su worktree pulita, upstream `cantoni` e branch pushato.
- Se OAuth resta bloccato, usare il percorso token diretto solo quando `node scripts/verify_cloudflare_api_credentials.mjs --pages-only` passa con token e account Cantoni.
- `npm run audit:cloudflare-api` e read-only: verifica `/user/tokens/verify`, lettura deployments Pages, identita della zona attiva `cantonidigitalstudio.com` e lettura DNS quando sono impostati `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_ZONE_ID`.
- `npm run audit:cloudflare-pages-api` verifica solo il percorso deploy Pages diretto; non richiede `CLOUDFLARE_ZONE_ID`.
- `npm run audit:cloudflare-dns-api` verifica solo il percorso DNS; non richiede `CLOUDFLARE_ACCOUNT_ID`.
- Non usare sessioni Cloudflare di Excellentia, Mr Collins, Diogomez, EC8 o personali per questo sito.

Permessi minimi per token/API:

- account corretto di Cantoni Digital Studio;
- `CLOUDFLARE_ACCOUNT_ID` dell'account Cantoni quando si usa CI o token non interattivo;
- `CLOUDFLARE_ZONE_ID` della zona attiva `cantonidigitalstudio.com` per diagnosticare e applicare record DNS; i comandi DNS bloccano se lo zone id punta a un altro dominio;
- permesso Account > Cloudflare Pages > Edit per deploy diretto Pages;
- permesso Zone > DNS > Edit per applicare record email DNS;
- token salvato solo in ambiente sicuro, mai nel repo.

## Build artifact locale
```bash
cd "<repo-root>"
npm run build:cloudflare
npm run test:artifact
npm run test:cloudflare-artifact-readiness
SITE_ROOT=.cloudflare-pages npm run test:browser
SITE_ROOT=.cloudflare-pages npm run test:payments
```

L'artifact pubblicabile e solo `.cloudflare-pages`. Non pubblicare mai la root del repo.
`npm run test:cloudflare-artifact-readiness` ricostruisce `.cloudflare-pages`
e registra un gate JSON usato anche da `npm run audit:launch-readiness`.

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

Lo stesso export scrive alias locali
`cantoni-cloudflare-pages-manual-upload-latest.*` per ZIP, manifest, checksum e
README. Sono scorciatoie per handoff umano e devono restare identiche
all'ultimo artifact timestampato; il deploy candidate e i dossier di sblocco
continuano a usare path timestampati per mantenere prova immutabile del file.

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
Se il live-site contract fallisce ma l'artifact e pronto, la sezione `Live Drift
Deploy Patch` elenca i file live che il full artifact risolve, con hash e
snippet mancanti. Quell'elenco e evidenza del drift, non autorizzazione a
caricare solo quei file: per Cloudflare Pages usare sempre lo ZIP/artifact
completo referenziato nel pack.

Il pacchetto manuale Cloudflare include anche un `.README.txt` e un manifesto
con `Production live-site contract coverage in this ZIP`: la tabella deriva da
`scripts/lib/live_site_contract.cjs`, elenca pagine/snippet coperti
dall'artifact, ripete `CLOUDFLARE_PAGES_BRANCH=main`,
`ALLOW_PRODUCTION_DEPLOY=yes` e
`CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`, e avvisa
`Do not upload only these files`. Anche se il README viaggia senza operator
pack, l'operatore deve pubblicare il full artifact sul branch `main`, non una
selezione di file.

Per consegnare a chi ha accesso Cloudflare/Google Workspace un dossier focalizzato
solo sullo sblocco esterno, usare:

```bash
cd "<repo-root>"
npm run export:external-unblock-handoff
npm run test:external-unblock-handoff
npm run test:post-unblock-launch
```

Il dossier viene scritto in `sales-kit/generated/external-unblock-handoff/`.
Produce file timestampati e gli alias stabili
`cantoni-external-unblock-handoff-latest.md/json`. Deve indicare l'ultimo
operator pack, il deploy candidate verificato, permessi minimi Cloudflare,
record DNS Google Workspace, approval gate e controlli post-unblock. Il verifier
blocca se il dossier contiene assegnazioni di valori Cloudflare, perde gli
approval token, non punta allo ZIP corrente o gli alias latest non corrispondono
all'ultimo file timestampato. `npm run audit:launch-readiness` espone lo stesso
controllo come gate `external_unblock_handoff`, cosi il report principale mostra
anche se il dossier di sblocco esterno e pronto. Se il latest e stale durante
una generazione di pack, il gate resta informativo; i blocker reali rimangono
Cloudflare, DNS, live contract e outbound hold.
Il dossier deve esporre anche `Live Site Contract Drift`: pagine live stale,
snippet mancanti, file artifact corrispondenti e regola esplicita di non
caricare solo i file di drift. Per chiudere il contratto live serve sempre il
full artifact Cloudflare verificato.
Il blocco Google Workspace Email DNS del dossier deve indicare il payload
API-safe `cantoni-email-dns-handoff-latest.cloudflare-api-records.json`, il
dry-run `npm run dns:cloudflare:plan`, l'apply separato
`npm run dns:cloudflare:apply`, l'approvazione
`CANTONI_DNS_APPROVAL=apply-cantoni-email-dns` e lo stop se il piano segnala
`cloudflare_lookup_required`, `blocked` o mismatch della zona Cloudflare.

`npm run export:launch-handoff` scrive anche
`cantoni-launch-handoff-latest.md/json`; il verifier confronta questi alias con
l'ultimo file timestampato e continua a ispezionare la copia timestampata.

`npm run export:live-drift` scrive anche `cantoni-live-drift-latest.md/json`;
questi alias sono per lettura rapida del drift live-vs-artifact, non per
selezionare un deploy parziale.

`npm run export:launch-operator-pack` scrive anche
`cantoni-launch-operator-pack-latest.md/json` sotto
`sales-kit/generated/launch-operator-pack/`. Gli alias servono per revisione
umana rapida; i verifier e il dossier external-unblock selezionano il pack
timestampato piu recente come sorgente immutabile.

`npm run export:email-dns-handoff` scrive anche
`cantoni-email-dns-handoff-latest.*` sotto
`sales-kit/generated/email-dns-handoff/`. `npm run dns:cloudflare:plan` usa di
default l'alias latest del payload API-safe, mentre
`npm run test:launch-handoff-artifacts` fallisce se gli alias latest non
corrispondono all'ultimo artifact timestampato.

Dopo che accessi Cloudflare/DNS e Google Workspace sono stati applicati, usare
`npm run audit:post-unblock-launch`: fallisce finche live site, Pages access,
DNS API, email DNS, payment branding e readiness senza outbound non sono tutti chiudibili.
Nella stessa finestra post-sblocco eseguire anche
`npm run audit:cloudflare-deploy-candidate`,
che deve passare prima di considerare il candidato deploy realmente eseguibile.
`npm run audit:payment-branding` controlla `sales-kit/payment_branding_review.flag`;
il flag va rimosso solo dopo verifica reale Stripe/PayPal senza brand mismatch.
`npm run test:post-unblock-launch` usa la stessa matrice ma resta non-fatale per
leggere i blocker durante lo sblocco.

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
Il percorso diretto blocca automaticamente worktree sporca, branch non pushato,
upstream diverso da `cantoni` o remoto diverso da
`cantonidigitalstudio-a11y/cantoni-digital-studio-site`.

```bash
cd "<repo-root>"
npm run audit:git-deploy-state
export CLOUDFLARE_API_TOKEN="<token-live-only>"
export CLOUDFLARE_ACCOUNT_ID="<account-id-cantoni>"
export CLOUDFLARE_PAGES_PROJECT_NAME="cantonidigitalstudio"
export CLOUDFLARE_CUSTOM_DOMAIN="cantonidigitalstudio.com"
export CLOUDFLARE_PAGES_BRANCH="preview-cantoni-site"
export CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL="deploy-cantoni-pages-direct"
npm run deploy:cloudflare:direct
```

Questo deploy preview valida artifact, Pages auth e processo end-to-end, ma non
chiude il `live_site_contract` su `https://cantonidigitalstudio.com`. Il live
contract si chiude solo se il full artifact viene pubblicato sul branch
production `main` con `CLOUDFLARE_PAGES_BRANCH=main`,
`ALLOW_PRODUCTION_DEPLOY=yes` e
`CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`.

Regole del percorso diretto:
- il token resta solo in ambiente live, mai nel repo;
- lo stato Git deve essere pulito e allineato al remoto Cantoni prima di ogni
  deploy;
- l'approval richiesta e esattamente
  `CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct`;
- `--pages-only` verifica token attivo e lettura deployments Pages senza
  richiedere `CLOUDFLARE_ZONE_ID`;
- prima di `wrangler pages deploy`, `npm run audit:cloudflare-deploy-candidate`
  deve confermare che l'ultimo operator pack contiene un candidato deploy fresco
  sul commit corrente, con ZIP/manifest/checksum coerenti e full artifact in
  grado di risolvere il live drift;
- lo script pubblica solo `.cloudflare-pages`;
- produzione su branch `main` richiede anche `ALLOW_PRODUCTION_DEPLOY=yes` e
  `CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`.

## Cosa fa lo script OAuth
1. verifica `node scripts/verify_git_deploy_state.cjs`
2. verifica `npm run audit:cloudflare-auth`, incluso `project_listed=true`
3. esegue `npm run test:full`
4. genera `.cloudflare-pages`
5. verifica artifact, browser smoke e Payment Link sull'artifact
6. riverifica `npm run audit:cloudflare-auth`
7. verifica il candidato deploy dall'operator pack con `npm run audit:cloudflare-deploy-candidate`
8. pubblica su branch preview, di default `preview-cantoni-site`

Lo script OAuth non crea progetti Pages. Se `cantonidigitalstudio` non compare
in `pages project list`, fermarsi e correggere account/progetto nel dashboard
Cloudflare prima di riprovare.

## Cosa fa lo script token diretto
1. verifica `node scripts/verify_git_deploy_state.cjs`
2. verifica `node scripts/verify_cloudflare_api_credentials.mjs --pages-only`
3. esegue `npm run test:full`
4. genera `.cloudflare-pages`
5. verifica artifact, browser smoke e Payment Link sull'artifact
6. riverifica `--pages-only`
7. verifica il candidato deploy dall'operator pack con `npm run audit:cloudflare-deploy-candidate`
8. pubblica con `wrangler pages deploy .cloudflare-pages --project-name ... --branch ...`

## Produzione
La produzione non parte da questo runbook senza approvazione separata. Se un
deploy punta a `main`, gli script richiedono `ALLOW_PRODUCTION_DEPLOY=yes`; il
percorso token diretto richiede anche
`CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`.
Solo questo percorso production puo chiudere il `live_site_contract`; una
preview valida il pacchetto ma lascia invariato il sito pubblico di produzione.

## Gate pagamenti
`npm run test:payments` apre i Payment Link Stripe senza inserire carte e senza transazioni. Il gate richiede merchant `Cantoni Digital Studio`, importo `EUR`, UI checkout funzionante, carta e Klarna. PayPal resta richiesto, ma puo essere nascosto da Stripe/PayPal in browser headless senza sessione buyer: in quel caso il test lo registra in `sessionDependentMisses` e la verifica va completata nel Browser Use/in-app browser.

Verifica PayPal obbligatoria prima del deploy: aprire entrambi i Payment Link nel browser reale, controllare che Stripe Checkout mostri `Cantoni Digital Studio`, che PayPal sia selezionabile, e fermarsi senza premere pagamento finale.

Stato corrente 2026-06-25: `sales-kit/payment_branding_review_evidence.json` registra `blocked_paypal_not_visible` e `release_ready=false`. La verifica del 2026-05-05 e superata: non dimostra lo stato attuale dei Payment Link e non puo sbloccare il gate PayPal/branding.

L'evidenza valida deve includere `review_method.expanded_additional_payment_methods=true`, nessun campo pagamento compilato, nessun click sul submit finale e la lista dei metodi osservati dopo espansione. L'ultima verifica Browser reale ha visto `card`, `mb_way`, `klarna`, `bancontact`, `amazon_pay` ed `eps`, ma non `paypal`.

Se PayPal non compare nemmeno nel browser reale, il codice del sito non può correggerlo da solo: PayPal va attivato/configurato nelle impostazioni metodi di pagamento del Dashboard Stripe e deve risultare compatibile con importo, valuta e paese del checkout.

## Gate PayPal / branding
- Decisione corrente 2026-06-25: nessuna eccezione EC8 e valida per la release. PayPal deve risultare selezionabile e non deve esporre EC8, EC8 Platform o altri brand/account non correlati.
- Se PayPal risulta collegato a un account storico o non coerente, il gate resta bloccato finche Stripe/PayPal non mostrano solo branding coerente con `Cantoni Digital Studio`.
- Gate strutturato: `sales-kit/payment_branding_review.flag` resta presente finche `npm run audit:payment-branding` non e verde dopo verifica reale dei Payment Link, merchant Stripe `Cantoni Digital Studio`, PayPal selezionabile e nessun riferimento EC8 o altro brand non correlato nel flusso PayPal.
- Evidenza: `sales-kit/payment_branding_review_evidence.json` registra l'ultima verifica Browser reale; il flag non va rimosso finche l'evidenza non ha `release_ready=true`.
- Remediation Stripe/PayPal: `sales-kit/payment_branding_remediation.md`, verificato da `npm run test:payment-branding-remediation`.
- Il test pagamenti automatico puo non entrare nel wallet PayPal; il gate vincolante resta `npm run audit:payment-branding`, che richiede evidenza Browser reale e nessuna eccezione EC8.

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
- canali social pubblici verificati con `npm run test:social-public`
- endpoint lead Apps Script verificato con `npm run test:lead-endpoint`
- readiness outreach verificata con `npm run test:outreach-readiness` prima di qualunque invio reale

## Nota operativa
Se `wrangler login` non completa la callback OAuth, il progetto resta comunque pronto: manca solo l'autorizzazione Cloudflare, non lavoro di configurazione locale.

## Binding dominio
Il binding di `cantonidigitalstudio.com` va fatto solo dopo approvazione esplicita del go-live. In questa versione di `wrangler`, il binding del custom domain non è esposto come subcomando `pages domain add`, quindi il passo va fatto nel dashboard Cloudflare una volta autenticati.
