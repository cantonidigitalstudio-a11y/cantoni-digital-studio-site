# Outreach Response Recovery - 2026-06-01

## Diagnosi
Il problema non e solo volume. Se nessuno risponde, il primo contatto sta chiedendo troppo presto attenzione, fiducia e tempo.

Le email precedenti erano piu serie delle bozze iniziali, ma restavano troppo complete per un cold outreach:

- 3 problemi gia nel primo messaggio
- 3 azioni gia nel primo messaggio
- tono vicino a una consulenza completa
- poca richiesta di permesso prima di mandare il quadro intero

Questo puo far percepire la mail come "preventivo non richiesto", anche quando l'audit e reale.

## Nuova regola
Il primo contatto deve essere un micro-audit:

- massimo 1 osservazione concreta
- una conseguenza business semplice
- una domanda di permesso
- niente prezzi
- niente lista completa
- niente gergo tecnico

L'audit completo resta obbligatorio, ma rimane interno fino a risposta, call o richiesta esplicita.

## Sequenza corretta
1. Audit completo interno su sito, mobile, social, recensioni, Google/AI visibility e competitor.
2. Email iniziale breve con una sola osservazione.
3. Se il cliente risponde, invio mini-audit a 3 priorita.
4. Se il cliente mostra interesse, preventivo scritto con scope, tempi, prezzo e pagamento.
5. Follow-up D3 solo se non ha risposto e senza ripetere tutto l'audit.

## Criterio di qualita
Se il cliente non capisce entro 8 secondi:

- chi siamo
- cosa abbiamo visto
- perche gli conviene rispondere
- cosa deve fare ora

la mail e troppo pesante.

## Implementazione tecnica
Il builder supporta ora:

```bash
OUTREACH_STYLE=micro_audit node sales-kit/scripts/build_outreach_queue_from_csv.mjs
```

Il gate dedicato e:

```bash
npm run test:outreach-micro
```

Il formato completo resta disponibile per review interna o lead gia caldi.
