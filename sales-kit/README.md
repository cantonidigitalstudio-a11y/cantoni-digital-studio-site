# Sales Kit

Area operativa per outreach, preventivi, follow-up, social calendar, materiali
commerciali e controlli giornalieri.

## Cartelle

- `lead-batches/`: batch di lead, bozze brandizzate, code follow-up e review.
- `scripts/`: generatori e verificatori della pipeline commerciale/social.
- `social-launch/`: calendario contenuti, asset social, copy e stato pubblicazioni.
- `daily-ops/`: report giornalieri operativi.
- `business-cards/`: materiali biglietti da visita e ordine MOO.
- `qa/`: review e gate manuali.
- `fixtures/`: dati di test non sensibili.

## Flusso corretto

1. Verifica Gmail dal Browser laterale con account Cantoni quando il task lo
   richiede.
2. Prepara o rigenera batch e review.
3. Controlla duplicati, lingua, valuta, personalizzazione e branding.
4. Fai approvare invii o pubblicazioni prima di azioni reali.
5. Aggiorna `daily-ops/` e gli stati di pubblicazione quando qualcosa viene
   chiuso.

## Cosa non deve stare qui

- Password, OTP, token, cookie, chiavi API o dati di recupero.
- File privati dei clienti non necessari al lavoro.
- Output pesanti rigenerabili quando esiste gia uno script di build.
