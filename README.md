# Cantoni Digital Studio Site

Repository operativo per il sito pubblico, il preventivatore, il portfolio,
la pipeline commerciale e i kit social di Cantoni Digital Studio.

## Mappa rapida

- `index.html`, `preventivo.html`, `servizi.html`, `case-studies.html`:
  pagine pubbliche statiche del sito.
- `assets/`: asset pubblici usati dal sito e dal portfolio.
- `scripts/`: verifiche, build, deploy e utility operative locali.
- `sales-kit/`: outreach, preventivi, follow-up, social calendar e materiali
  commerciali.
- `functions/`, `server/`, `supabase/`: supporto backend e integrazioni server.
- `.cloudflare-pages/`: artifact generato per deploy Cloudflare, ignorato da git.

## Gate principali

Usa questi comandi prima di considerare un pacchetto pronto:

```bash
npm test
npm run test:payments
npm run test:browser
npm run test:live-site
npm run test:deploy-policy
npm run test:cloudflare-artifact-readiness
npm run test:email-dns-audit
npm run test:cloudflare-api-audit
npm run test:cloudflare-api-contract
npm run test:cloudflare-direct-deploy-contract
npm run test:social
npm run test:launch-readiness-audit
git diff --check
```

Per un deploy serio usa `npm run test:full`, poi `npm run audit:launch-readiness`.
Il deploy parte solo se l'audit non segnala blocchi Cloudflare/DNS o hold
operativi, dopo review del pacchetto e consenso esplicito.
Prima di qualsiasi deploy diretto, `npm run audit:git-deploy-state` deve
passare: upstream sul remoto `cantoni`, commit pushato, worktree pulita e URL
remoto coerente con `cantonidigitalstudio-a11y/cantoni-digital-studio-site`.
`npm run audit:launch-readiness` ricostruisce anche `.cloudflare-pages` e
verifica stato Git deploy, contratto dell'artifact pubblicabile e gate live come
controlli separati. Espone anche il gate `external_unblock_handoff`, che
verifica il dossier latest per accessi Cloudflare/DNS/email quando il go-live e
bloccato da interventi esterni. Se il latest non e ancora stato rigenerato nella
stessa sequenza, il gate resta informativo e non sostituisce i blocker reali.
Per diagnosticare token/API Cloudflare senza mutazioni, usa
`npm run audit:cloudflare-api`: verifica token attivo, lettura Pages e lettura
DNS quando `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e
`CLOUDFLARE_ZONE_ID` sono presenti.
Per separare i gate, usa `npm run audit:cloudflare-pages-api` prima di un deploy
Pages diretto e `npm run audit:cloudflare-dns-api` prima di applicare DNS email.
Il gate DNS verifica prima che `CLOUDFLARE_ZONE_ID` risolva alla zona attiva
`cantonidigitalstudio.com`; se punta a un altro dominio, non legge ne pianifica
record DNS.

Per il percorso OAuth Wrangler, `npm run audit:cloudflare-auth` deve vedere anche
`project_listed=true` per `cantonidigitalstudio`: gli script non creano un Pages
project implicitamente. `npm run deploy:cloudflare` verifica Git pulito/allineato,
auth OAuth, suite completa, artifact `.cloudflare-pages`, Payment Link/browser
smoke sull'artifact e `cloudflare_deploy_candidate --require-execution-ready`
prima di chiamare `wrangler pages deploy`.

Se OAuth Wrangler e bloccato ma e disponibile un token API Cantoni con permesso
Account > Cloudflare Pages > Edit, il deploy Pages diretto passa da
`npm run deploy:cloudflare:direct`. Lo script usa `--pages-only` per verificare
solo token e Pages, richiede `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e
`CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct`, e
continua a bloccare la produzione senza approval separata. Prima di chiamare
Wrangler, il percorso diretto verifica anche il `cloudflare_deploy_candidate`
dell'ultimo operator pack: ZIP/manifest/checksum, Git pulito/allineato, artifact
pronto e live drift risolvibile dal full artifact devono essere coerenti.
Il branch diretto di default e `preview-cantoni-site`: serve a validare il
pacchetto, ma non chiude il `live_site_contract` di produzione. Per chiudere il
contratto live bisogna usare `CLOUDFLARE_PAGES_BRANCH=main` con
`ALLOW_PRODUCTION_DEPLOY=yes` e
`CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`.

Se Cloudflare Pages API resta bloccata ma serve un handoff verificato, genera il
pacchetto manuale con `npm run build:cloudflare-upload-package`. Lo ZIP prodotto
resta sotto `sales-kit/generated/cloudflare-manual-upload/` ed e ignorato da git.
L'export scrive anche alias locali
`cantoni-cloudflare-pages-manual-upload-latest.*` per trovare rapidamente
l'ultimo pacchetto; il deploy candidate continua comunque a puntare ai file
timestampati e verificati.

Per produrre un riepilogo operativo dei blocker correnti, usa
`npm run export:launch-handoff`. Il report resta sotto
`sales-kit/generated/launch-handoff/` ed e ignorato da git. Scrive anche
`cantoni-launch-handoff-latest.*` per revisione rapida; i verifier continuano a
ispezionare il file timestampato piu recente.

Per preparare i record DNS email in formato handoff/CSV per Cloudflare, usa
`npm run export:email-dns-handoff`. Il report resta sotto
`sales-kit/generated/email-dns-handoff/` ed e ignorato da git. Genera anche un
payload JSON API-safe che esclude i record con valore manuale, come DKIM.
Scrive sia file timestampati sia alias stabili
`cantoni-email-dns-handoff-latest.*`; il piano DNS usa di default l'alias latest
del payload API-safe, cosi l'apply non dipende da un vecchio file timestampato.
Il piano API-safe si verifica senza effetti esterni con `npm run
dns:cloudflare:plan`. L'apply reale resta separato e richiede
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` e
`CANTONI_DNS_APPROVAL=apply-cantoni-email-dns`. Con credenziali live, il piano
e l'apply bloccano prima di qualsiasi lookup record se lo zone id non appartiene
alla zona attiva `cantonidigitalstudio.com`.

Per dimostrare se il live e solo indietro rispetto all'artifact pronto al
deploy, usa `npm run export:live-drift`. Il report resta sotto
`sales-kit/generated/live-drift/` ed e ignorato da git. Scrive anche
`cantoni-live-drift-latest.*` per revisione rapida. Quando il drift e
risolvibile dal deploy, il report include anche `contract_drift_patch`: elenco
dei file live che falliscono il contratto, hash live/artifact e regola
vincolante di usare il full artifact Cloudflare, non un upload parziale.

Per preparare un indice unico di deploy/DNS/drift/launch handoff generati nella
stessa run, usa `npm run export:launch-operator-pack`. Il pack include anche il
dry-run `dns:cloudflare:plan`, cosi l'operatore vede se i record DNS sono
applicabili, bloccati o in attesa di lookup Cloudflare. Include anche la sezione
`Live Drift Deploy Patch`, che trasforma i failure del live-site contract in una
checklist verificabile per chi ha accesso Cloudflare. Il report resta sotto
`sales-kit/generated/launch-operator-pack/` ed e ignorato da git. Scrive anche
gli alias `cantoni-launch-operator-pack-latest.*` per revisione rapida; i
dossier di sblocco e i deploy candidate continuano a referenziare il pack
timestampato.

Lo ZIP manuale Cloudflare genera anche un `.README.txt` e un manifesto con
`Production live-site contract coverage in this ZIP`: la tabella deriva da
`scripts/lib/live_site_contract.cjs`, elenca pagine/snippet coperti
dall'artifact, ripete `CLOUDFLARE_PAGES_BRANCH=main`,
`ALLOW_PRODUCTION_DEPLOY=yes` e
`CANTONI_PRODUCTION_DEPLOY_APPROVAL=deploy-cantoni-production`, e avvisa
`Do not upload only these files`. Se il README viene consegnato separato
dall'operator pack, resta comunque chiaro che serve il full artifact sul branch
`main`, non un caricamento parziale.

Quando il codice e pronto ma mancano accessi esterni, usa `npm run
export:external-unblock-handoff`. Il dossier resta sotto
`sales-kit/generated/external-unblock-handoff/` ed e ignorato da git. Scrive sia
file timestampati sia gli alias stabili `cantoni-external-unblock-handoff-latest.*`.
Parte dall'ultimo launch operator pack e raccoglie, in un solo artifact
verificabile, token/permessi Cloudflare richiesti, approval gate, ZIP deploy
candidate, record DNS Google Workspace, comandi post-unblock e regole
no-secrets/no-outbound. `npm run test:external-unblock-handoff` verifica che il
dossier punti al pack e allo ZIP correnti, preservi gli approval gate, tenga
allineati gli alias latest e non assegni valori segreti.
Il dossier deve esporre anche la sezione `Live Site Contract Drift`, con le
pagine live stale e la regola di non caricare solo i file di drift: lo sblocco
del contratto live richiede il full artifact Cloudflare verificato.
Il blocco email-DNS del dossier deve includere anche l'alias
`cantoni-email-dns-handoff-latest.cloudflare-api-records.json`, il dry-run
`npm run dns:cloudflare:plan`, l'apply separato `npm run dns:cloudflare:apply`
e l'approvazione `CANTONI_DNS_APPROVAL=apply-cantoni-email-dns`.
Quando Cloudflare Pages/DNS e Google Workspace sono stati sbloccati, usa
`npm run audit:post-unblock-launch` come controllo unico di chiusura tecnica:
verifica Git, live site, accesso Pages, DNS API, email DNS, canali social
pubblici, endpoint lead, payment branding, readiness senza rilascio outbound e
handoff. Nella stessa chiusura va eseguito anche
`node scripts/verify_cloudflare_deploy_candidate.cjs --require-execution-ready`,
cosi il candidato deploy non resta solo artifact-ready ma diventa realmente
eseguibile dopo lo sblocco Cloudflare Pages. Prima dello sblocco,
`npm run test:post-unblock-launch` mostra gli stessi blocker senza fallire il
comando.
La pausa commerciale `sales-kit/outbound_pause.flag` resta comunque separata:
prima di qualunque invio reale deve passare anche
`npm run test:outreach-readiness`, oltre a social pubblici, endpoint lead,
batch esatto e account mittente approvati.
`npm run audit:payment-branding` controlla il flag
`sales-kit/payment_branding_review.flag`: va rimosso solo dopo verifica reale
dei Payment Link, merchant Stripe `Cantoni Digital Studio`, PayPal selezionabile
e nessun riferimento EC8 o altro brand non correlato nel flusso PayPal.
L'evidenza strutturata resta in
`sales-kit/payment_branding_review_evidence.json`; l'audit non diventa verde se
il flag viene rimosso senza `release_ready=true`. L'evidenza deve registrare
`review_method.expanded_additional_payment_methods=true`, nessun campo
pagamento compilato, nessun click sul submit finale e i metodi osservati dopo
espansione; l'ultima verifica reale ha visto `card`, `mb_way`, `klarna`,
`bancontact`, `amazon_pay` ed `eps`, ma non `paypal`.
Il remediation path Stripe/PayPal e in
`sales-kit/payment_branding_remediation.md` ed e verificato da
`npm run test:payment-branding-remediation`.

## Regole operative

- Non salvare password, token, OTP, cookie o dati di recupero nel repo.
- Non inviare email, pubblicare social, fare pagamenti o deploy produzione senza
  approvazione esplicita.
- I file binari rigenerabili dei social pack e gli screenshot device restano
  locali e sono ignorati da git; le sorgenti restano versionabili.
- Le proposte commerciali devono essere cliente-per-cliente: audit reale, lingua
  corretta, valuta coerente e niente invii duplicati.
