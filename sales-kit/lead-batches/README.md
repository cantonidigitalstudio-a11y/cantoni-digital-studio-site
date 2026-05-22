# Lead Batches

Batch commerciali per lead internazionali e follow-up Cantoni.

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
