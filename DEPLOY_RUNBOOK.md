# Cantoni Site Netlify Fallback Runbook

## Stato attuale

Cloudflare Pages e il canale principale per Cantoni Digital Studio. Questo
runbook esiste solo come fallback operativo se Cloudflare resta bloccato e se
il team/sito Netlify viene verificato visivamente come proprieta Cantoni nella
stessa sessione.

Prima di qualsiasi deploy:

```bash
cd "<repo-root>"
npm run test:full
npm run audit:launch-readiness
```

Se `npm run audit:launch-readiness` segnala blocchi Cloudflare, DNS email o hold
outbound, il fallback Netlify non deve essere usato per mascherare lo stato di
go-live. Puo servire solo per una preview tecnica approvata esplicitamente.

## Guardrail obbligatori

Ogni deploy Netlify richiede:

- `ALLOW_NETLIFY_FALLBACK=yes`
- `NETLIFY_TEAM_VERIFIED_AS_CANTONI=yes`
- `NETLIFY_AUTH_TOKEN` valido
- `NETLIFY_SITE_ID` oppure `NETLIFY_SITE_NAME`

La produzione richiede anche:

- `ALLOW_PRODUCTION_DEPLOY=yes`

Non usare team Netlify personali, Excellentia, Mr Collins, Diogomez, EC8 o non
verificati come Cantoni Digital Studio. Non pubblicare mai la root del repo:
gli script usano solo `.cloudflare-pages`.

## Preview fallback

```bash
cd "<repo-root>"
export ALLOW_NETLIFY_FALLBACK=yes
export NETLIFY_TEAM_VERIFIED_AS_CANTONI=yes
export NETLIFY_AUTH_TOKEN="..."
export NETLIFY_SITE_NAME="cantoni-digital-studio-preview"
bash scripts/deploy_netlify_preview.sh
```

## Produzione fallback

La produzione Netlify e ammessa solo con approvazione separata, team/sito
Cantoni verificato e dominio/DNS rivisti nello stesso passaggio.

```bash
cd "<repo-root>"
export ALLOW_NETLIFY_FALLBACK=yes
export NETLIFY_TEAM_VERIFIED_AS_CANTONI=yes
export ALLOW_PRODUCTION_DEPLOY=yes
export NETLIFY_AUTH_TOKEN="..."
export NETLIFY_SITE_ID="..."
bash scripts/deploy_netlify_prod.sh
```

## Gate pagamenti

Prima di ogni preview o produzione:

```bash
npm run test:payments
SITE_ROOT=.cloudflare-pages npm run test:payments
```

Il gate apre i Payment Link Stripe senza inserire carte e senza transazioni.
Deve verificare merchant `Cantoni Digital Studio`, importo `EUR`, checkout
funzionante, carta e Klarna. PayPal resta richiesto, ma puo essere nascosto da
Stripe/PayPal in browser headless senza sessione buyer: in quel caso
`test:payments` lo registra in `sessionDependentMisses` e va completata una
verifica visuale nel Browser Use/in-app browser.

Verifica PayPal obbligatoria prima del deploy: aprire entrambi i Payment Link
nel browser reale, controllare che Stripe Checkout mostri
`Cantoni Digital Studio`, che PayPal sia selezionabile, e fermarsi senza premere
pagamento finale.

Stato 2026-05-05: PayPal verificato visualmente su entrambi i Payment Link dopo
aggiunta dei domini affidabili Stripe `cantonidigitalstudio.com` e
`buy.stripe.com`.

## Debito PayPal / branding

- Decisione temporanea 2026-05-05: PayPal puo essere collegato usando il conto
  business gia esistente legato a EC8/EC8 Platform, pur sapendo che il conto e
  condiviso con altre attivita.
- Rischio accettato: nel passaggio PayPal o nelle comunicazioni PayPal potrebbe
  comparire il nome business/account storico invece di `Cantoni Digital Studio`.
- TODO: migrare a un PayPal Business dedicato o rinominare/verificare il conto
  in modo coerente con `Cantoni Digital Studio`.
- Prima del go-live definitivo, aprire i Payment Link e verificare che Stripe
  Checkout mostri `Cantoni Digital Studio`; se PayPal mostra un brand non
  Cantoni, segnalarlo come rischio commerciale residuo.

## Controlli dopo il go-live

- homepage, preventivo, case studies caricati correttamente
- servizi, termini, privacy e pagamento confermato caricati correttamente
- form verso Apps Script attivo
- canonical e alternate hreflang corretti
- consenso analytics visibile e analytics bloccato fino ad accettazione
- Stripe checkout apribile senza fare transazioni
- footer trust visibile
- `robots.txt` e `sitemap.xml` serviti correttamente
