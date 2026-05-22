# Gmail Headless Worker (Playwright, sessione persistente)

Nota:
- questo worker resta solo come fallback
- per batch reali senza interferire con altre finestre o altri Codex, il percorso preferito adesso e:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/background_outreach_worker.md`

Script: `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/scripts/gmail_headless_worker.mjs`

## Prerequisiti (una sola volta)

```bash
cd "/Volumes/Lexar/Siti internet mondiale /cantoni_site"
npm init -y
npm i -D playwright
npx playwright install chromium
```

## Coda invii

File coda:
`/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/outreach_queue.json`

Generazione coda da pipeline:

```bash
cd "/Volumes/Lexar/Siti internet mondiale /cantoni_site"
node sales-kit/scripts/build_outreach_queue_from_csv.mjs
```

Regola:
- entrano in coda solo lead con `status=READY_TO_CONTACT` e `email` valorizzata.
- entrano in coda solo lead con audit completo e lingua/valuta risolte.
- la lingua viene scelta automaticamente da `first_contact_language`/`preferred_language` o fallback paese.
- la valuta preventivo viene assegnata per mercato (es. Italia/EU=EUR, USA=USD, UK=GBP, Giappone=JPY, Rep. Dominicana=DOP).
- la firma brandizzata (logo Cantoni) viene gestita in Gmail, non hardcoded nel body della queue.

Formato item:

```json
[
  {
    "id": "lead-001",
    "to": "info@example.com",
    "language": "it",
    "currency": "EUR",
    "subject": "Proposta miglioramento sito",
    "body": "Ciao, abbiamo analizzato il tuo sito..."
  }
]
```

## Esecuzione sicura (solo bozze, nessun invio)

```bash
cd "/Volumes/Lexar/Siti internet mondiale /cantoni_site"
GMAIL_HEADLESS=true \
GMAIL_SEND_ENABLED=false \
GMAIL_PROFILE_DIR="/Volumes/Lexar/playwright-profiles/cantoni-gmail" \
node sales-kit/scripts/gmail_headless_worker.mjs
```

## Esecuzione invio reale

```bash
cd "/Volumes/Lexar/Siti internet mondiale /cantoni_site"
GMAIL_HEADLESS=true \
GMAIL_SEND_ENABLED=true \
GMAIL_MAX_PER_RUN=20 \
GMAIL_MIN_DELAY_MS=120000 \
GMAIL_MAX_DELAY_MS=240000 \
GMAIL_PROFILE_DIR="/Volumes/Lexar/playwright-profiles/cantoni-gmail" \
node sales-kit/scripts/gmail_headless_worker.mjs
```

## Output worker

- stato coda aggiornato:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/outreach_queue.json`
- CRM CSV aggiornato dopo l'invio:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/lead_pipeline.csv`
- stato cumulativo:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/worker_state.json`
- snapshot inbox ultime conversazioni:
  `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/queue/replies_snapshot.json`

## Note operative

- Se il profilo non è autenticato Gmail, lo script si ferma con errore esplicito.
- Lock file anti-concorrenza: `sales-kit/queue/.worker.lock`.
- Per primo avvio, fai login una volta con lo stesso profilo Playwright.
- Dopo un invio `sent`, il lead passa a `CONTACTED`, `last_action` viene aggiornato e `next_action_date` viene impostata a day+3.
