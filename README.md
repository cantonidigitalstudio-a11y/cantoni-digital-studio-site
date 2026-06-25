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
npm run test:deploy-policy
npm run test:email-dns-audit
npm run test:social
npm run test:launch-readiness-audit
git diff --check
```

Per un deploy serio usa `npm run test:full`, poi `npm run audit:launch-readiness`.
Il deploy parte solo se l'audit non segnala blocchi Cloudflare/DNS o hold
operativi, dopo review del pacchetto e consenso esplicito.

## Regole operative

- Non salvare password, token, OTP, cookie o dati di recupero nel repo.
- Non inviare email, pubblicare social, fare pagamenti o deploy produzione senza
  approvazione esplicita.
- I file binari rigenerabili dei social pack e gli screenshot device restano
  locali e sono ignorati da git; le sorgenti restano versionabili.
- Le proposte commerciali devono essere cliente-per-cliente: audit reale, lingua
  corretta, valuta coerente e niente invii duplicati.
