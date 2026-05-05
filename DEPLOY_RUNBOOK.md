# Cantoni Site Deploy Runbook

## Stato attuale
- sito statico pronto al deploy
- test locali verdi
- `netlify.toml` presente
- outbound fermo via `sales-kit/outbound_pause.flag`
- blocco attuale: credenziale Netlify invalida (`401 Access Denied`)

## Prerequisiti
- `NETLIFY_AUTH_TOKEN` valido
- opzionale ma consigliato: `NETLIFY_SITE_ID` oppure `NETLIFY_SITE_NAME`

## Preview deploy
```bash
cd "<repo-root>"
export NETLIFY_AUTH_TOKEN="..."
export NETLIFY_SITE_NAME="cantoni-digital-studio-preview"
bash scripts/deploy_netlify_preview.sh
```

Lo script esegue `npm run test:full` e pubblica solo `.cloudflare-pages`. La root del repo non deve essere usata come directory deploy.

## Production deploy
```bash
cd "<repo-root>"
export NETLIFY_AUTH_TOKEN="..."
export NETLIFY_SITE_ID="..."
export ALLOW_PRODUCTION_DEPLOY="yes"
bash scripts/deploy_netlify_prod.sh
```

La produzione richiede approvazione separata e il flag `ALLOW_PRODUCTION_DEPLOY=yes`.

## Gate pagamenti
Prima di ogni preview o produzione:
```bash
npm run test:payments
SITE_ROOT=.cloudflare-pages npm run test:payments
```

Il gate apre i Payment Link Stripe senza inserire carte e senza transazioni. Deve verificare merchant `Cantoni Digital Studio`, importo `EUR`, checkout funzionante, carta e Klarna. PayPal resta richiesto, ma puo essere nascosto da Stripe/PayPal in browser headless senza sessione buyer: in quel caso `test:payments` lo registra in `sessionDependentMisses` e va completata una verifica visuale nel Browser Use/in-app browser.

Verifica PayPal obbligatoria prima del deploy: aprire entrambi i Payment Link nel browser reale, controllare che Stripe Checkout mostri `Cantoni Digital Studio`, che PayPal sia selezionabile, e fermarsi senza premere pagamento finale.

Stato 2026-05-05: PayPal verificato visualmente su entrambi i Payment Link dopo aggiunta dei domini affidabili Stripe `cantonidigitalstudio.com` e `buy.stripe.com`.

## Debito PayPal / branding
- Decisione temporanea 2026-05-05: PayPal puo essere collegato usando il conto business gia esistente legato a EC8/EC8 Platform, pur sapendo che il conto e condiviso con altre attivita.
- Rischio accettato: nel passaggio PayPal o nelle comunicazioni PayPal potrebbe comparire il nome business/account storico invece di `Cantoni Digital Studio`.
- TODO: migrare a un PayPal Business dedicato o rinominare/verificare il conto in modo coerente con `Cantoni Digital Studio`.
- Prima del go-live definitivo, aprire i Payment Link e verificare che Stripe Checkout mostri `Cantoni Digital Studio`; se PayPal mostra un brand non Cantoni, segnalarlo come rischio commerciale residuo.

## Dominio custom
Dopo il primo deploy production:
1. collegare `cantonidigitalstudio.com` al sito Netlify
2. impostare DNS dal provider dominio verso Netlify
3. verificare TLS e redirect `www`/apex

## Controlli dopo il go-live
- homepage, preventivo, case studies caricati correttamente
- servizi, termini, privacy e pagamento confermato caricati correttamente
- form verso Apps Script attivo
- canonical e alternate hreflang corretti
- consenso analytics visibile e analytics bloccato fino ad accettazione
- Stripe checkout apribile senza fare transazioni
- footer trust visibile
- `robots.txt` e `sitemap.xml` serviti correttamente
