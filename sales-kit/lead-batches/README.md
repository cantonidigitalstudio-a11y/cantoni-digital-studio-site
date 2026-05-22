# Lead Batches

Batch commerciali per lead internazionali e follow-up Cantoni.

## Privacy / repo pubblico

Il repository GitHub Cantoni Digital Studio e pubblico. I batch generati possono
contenere email, contatti, audit cliente-per-cliente, testi commerciali e stato
di invio; quindi non devono essere committati automaticamente.

Regola operativa: tenere in Git solo esempi sanificati, README, script e regole
di qualita. I batch reali datati (`2026-*`), `sales-kit/lead_pipeline.csv`,
code di invio e review complete vanno trattati come archivio operativo privato
o committati solo dopo una review esplicita che rimuova dati sensibili.

## Struttura batch

Ogni batch deve avere, quando applicabile:

- `leads.csv`: sorgente dei lead.
- `outreach_queue.json`: coda originale generata.
- `branded/`: email HTML/TXT brandizzate e review interna.
- `followup_d3_queue_*.json`: follow-up pianificati.
- `followup-review-*.html`: controllo umano prima dell'invio.
- `README.md` o `send-review.md`: stato operativo del batch.

## Regole qualita

- Ogni proposta deve partire da controllo reale del cliente, non da template
  generico.
- Lingua, valuta, oggetto e proposta devono essere coerenti col mercato.
- Prima di inviare follow-up, verificare risposte recenti per evitare doppioni.
- Nessun invio reale senza approvazione esplicita del batch.
