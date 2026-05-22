# Diagnosi conversione outreach - 16 marzo 2026

## Stato reale

- Lead totali in CRM: `252`
- `CONTACTED`: `203`
- `FOLLOWUP_D3`: `46`
- `QUOTE_SENT`: `2`
- `CLOSED_LOST`: `1`
- Reply positive/interessate confermate: `0`

## Dato chiave

Il problema principale non e il volume.

Il problema principale e che il primo contatto freddo e stato costruito come se il lead fosse gia in fase di valutazione attiva del preventivo.

In pratica:

- la prima email e troppo lunga
- entra subito in logica di proposta completa
- include pricing e pacchetti troppo presto
- chiede una decisione prima di ottenere attenzione

Questo genera attrito alto, soprattutto su caselle generiche o istituzionali.

## Evidenze concrete

### 1. Timing

Gran parte del volume e recentissimo.

- `2026-03-14`: `102` nuovi `CONTACTED`
- `2026-03-16`: `99` nuovi `CONTACTED`

Quindi una parte del batch non ha ancora avuto tempo reale di maturare.

### 2. Tipo di casella contattata

Distribuzione semplificata delle mailbox:

- `generic`: `145`
- `named`: `1`
- `semi_named`: `22`
- `other`: `84`

Questo significa che la maggioranza delle mail non arriva a una persona specifica ma a caselle generiche tipo:

- `info@`
- `segreteria@`
- `contattaci@`
- `assistenza@`

Su queste caselle il primo contatto deve essere ancora piu corto, chiaro e rapido da smistare.

### 3. Qualita del copy inviato

L’outreach iniziale usato finora:

- apre bene
- contiene problemi plausibili
- ma poi diventa subito una proposta completa

Questo e il punto debole:

- per cold outreach il lead non ha ancora chiesto un preventivo
- quindi ricevere subito pacchetti, prezzi, tempistiche e condizioni commerciali aumenta la probabilita di ignorare o chiudere la mail

### 4. Segmenti colpiti

I settori con maggiore volume sono:

- `Real estate`
- `Dental clinic`
- `Legal services / law firm`

Sono segmenti con ROI potenziale, ma anche con:

- inbox molto presidiate
- forte filtro segreteria
- elevata inerzia decisionale

Quindi il primo contatto deve aprire conversazione, non chiudere la vendita.

## Conclusione tecnica

La catena attuale perde conversione in questo punto:

`cold outreach -> proposta troppo completa troppo presto`

Non e un problema di effort insufficiente.
E un problema di sequencing commerciale.

## Correzione applicata oggi

Ho modificato il motore dell’outreach iniziale in:

`/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/scripts/discover_and_send_local_leads.mjs`

Nuova logica:

- subject piu leggero e credibile
- email piu corta
- tre problemi concreti
- un razionale economico
- call to action semplice
- nessun preventivo completo nel primo contatto freddo

Nuovo subject:

- `BusinessName: osservazione rapida sul sito`

Nuova CTA:

- se interessati, rispondono
- solo dopo si manda il materiale completo

## Regola operativa da ora

### Primo contatto freddo

Deve contenere:

- saluto professionale
- 2-3 criticita reali
- 1 impatto commerciale
- CTA semplice

Non deve contenere:

- preventivo completo
- pacchetti
- pricing dettagliato
- condizioni economiche complete

### Preventivo completo

Va mandato solo dopo uno di questi segnali:

- reply positiva
- richiesta prezzo
- richiesta dettagli
- cambio contatto verso referente corretto

## Prossimo passo corretto

1. Monitorare le reply del batch attuale
2. Usare il nuovo formato corto sui prossimi lead
3. Misurare se il tasso di risposta migliora prima di aumentare ancora il volume
