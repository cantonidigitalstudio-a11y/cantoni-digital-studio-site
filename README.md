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
npm run test:email-dns-audit
npm run test:cloudflare-api-audit
npm run test:cloudflare-api-contract
npm run test:social
npm run test:launch-readiness-audit
git diff --check
```

Per un deploy serio usa `npm run test:full`, poi `npm run audit:launch-readiness`.
Il deploy parte solo se l'audit non segnala blocchi Cloudflare/DNS o hold
operativi, dopo review del pacchetto e consenso esplicito.
Per diagnosticare token/API Cloudflare senza mutazioni, usa
`npm run audit:cloudflare-api`: verifica token attivo, lettura Pages e lettura
DNS quando `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e
`CLOUDFLARE_ZONE_ID` sono presenti.

Se OAuth Wrangler e bloccato ma e disponibile un token API Cantoni con permesso
Account > Cloudflare Pages > Edit, il deploy Pages diretto passa da
`npm run deploy:cloudflare:direct`. Lo script usa `--pages-only` per verificare
solo token e Pages, richiede `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e
`CANTONI_CLOUDFLARE_DIRECT_DEPLOY_APPROVAL=deploy-cantoni-pages-direct`, e
continua a bloccare la produzione senza approval separata.

Se Cloudflare Pages API resta bloccata ma serve un handoff verificato, genera il
pacchetto manuale con `npm run build:cloudflare-upload-package`. Lo ZIP prodotto
resta sotto `sales-kit/generated/cloudflare-manual-upload/` ed e ignorato da git.

Per produrre un riepilogo operativo dei blocker correnti, usa
`npm run export:launch-handoff`. Il report resta sotto
`sales-kit/generated/launch-handoff/` ed e ignorato da git.

Per preparare i record DNS email in formato handoff/CSV per Cloudflare, usa
`npm run export:email-dns-handoff`. Il report resta sotto
`sales-kit/generated/email-dns-handoff/` ed e ignorato da git. Genera anche un
payload JSON API-safe che esclude i record con valore manuale, come DKIM.
Il piano API-safe si verifica senza effetti esterni con `npm run
dns:cloudflare:plan`. L'apply reale resta separato e richiede
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` e
`CANTONI_DNS_APPROVAL=apply-cantoni-email-dns`.

Per dimostrare se il live e solo indietro rispetto all'artifact pronto al
deploy, usa `npm run export:live-drift`. Il report resta sotto
`sales-kit/generated/live-drift/` ed e ignorato da git.

Per preparare un indice unico di deploy/DNS/drift/launch handoff generati nella
stessa run, usa `npm run export:launch-operator-pack`. Il pack include anche il
dry-run `dns:cloudflare:plan`, cosi l'operatore vede se i record DNS sono
applicabili, bloccati o in attesa di lookup Cloudflare. Il report resta sotto
`sales-kit/generated/launch-operator-pack/` ed e ignorato da git.

## Regole operative

- Non salvare password, token, OTP, cookie o dati di recupero nel repo.
- Non inviare email, pubblicare social, fare pagamenti o deploy produzione senza
  approvazione esplicita.
- I file binari rigenerabili dei social pack e gli screenshot device restano
  locali e sono ignorati da git; le sorgenti restano versionabili.
- Le proposte commerciali devono essere cliente-per-cliente: audit reale, lingua
  corretta, valuta coerente e niente invii duplicati.
