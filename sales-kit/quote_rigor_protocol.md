# Cantoni Digital Studio - Quote Rigor Protocol

## Scopo
Bloccare preventivi generici, semi-template o basati su audit incompleti.

## Regola principale
Ogni preventivo deve poter rispondere in modo preciso a questa domanda:

`Perche a questa azienda stiamo proponendo proprio questo lavoro, a questo prezzo, su questi punti specifici?`

Se la risposta non e chiara e verificabile, il preventivo non e pronto.

## Audit minimo richiesto
Per ogni lead bisogna raccogliere e verificare:
- sito live corrente
- mercato servito reale
- offerta principale
- CTA reali presenti
- percorso mobile
- elementi trust reali
- pagina o blocco dove il percorso si rompe
- almeno 3 evidenze audit scritte che dicano dove e stato visto il problema

## Problemi validi
Un problema puo entrare nel preventivo solo se:
- e visibile sul sito corrente
- e descritto in modo concreto
- ha impatto commerciale plausibile
- ha una soluzione precisa

### Esempi validi
- Il first screen resta istituzionale e non orienta il paziente verso una prima visita o un trattamento preciso.
- La navigazione mette sullo stesso piano troppi percorsi diversi e rallenta la scelta principale.
- Il trust e presente ma non e organizzato in una sequenza che accompagna alla prenotazione.

### Esempi non validi
- Il sito potrebbe convertire meglio.
- La UX non e ottimale.
- Il design e migliorabile.

Questi testi sono troppo generici e non devono comparire da soli.

## Regola sui prezzi
Il prezzo non puo essere deciso solo dal pacchetto.
Deve essere giustificato da:
- numero di pagine o sezioni da ristrutturare
- complessita del funnel
- livello di riposizionamento commerciale richiesto
- contenuti trust / proof da ricostruire
- localizzazione, SEO commerciale o segmentazione dell offerta
- pricing rationale scritta, leggibile e difendibile in review interna

## Struttura corretta del preventivo
1. Sintesi del business
2. Criticita osservate sul sito reale
3. Intervento proposto con perimetro chiaro
4. Impatto economico atteso in termini commerciali
5. Pacchetti
6. Condizioni commerciali
7. Chiusura diretta alla decisione

## Regola sulla lingua
- cliente sempre nella sua lingua
- italiano sempre formale
- usare `voi`, non `tu`
- accenti e punteggiatura corretti

## Regola sulla chiusura
Mai chiusure deboli o rinunciatarie.

### Da evitare
- se non e il momento non e un problema
- se vuole poi le mando altro
- magari piu avanti

### Da usare
- restiamo in attesa di un vostro riscontro
- se desiderate procedere, rispondete indicando il pacchetto scelto
- vi inviamo subito conferma operativa e dati per l avvio

## Regola sugli invii
- i preview vanno solo su email interne di controllo
- il cliente non deve ricevere versioni sperimentali
- se il preventivo e gia partito, non si manda una correzione senza motivo strategico chiaro
- la prima email non deve contenere prezzi, pacchetti o condizioni commerciali complete

## Checklist finale pre-invio
- audit live fatto
- problemi specifici verificati
- nessun testo copia e incolla non giustificato
- prezzo motivato
- lingua corretta
- valuta corretta
- nessun path locale o placeholder tecnico
- tono professionale
- chiusura orientata alla decisione

Se uno di questi punti fallisce, il preventivo non parte.


## Gate obbligatorio: verifica dominio e sito reale
Prima di qualsiasi outreach o preventivo, il lead NON è valido finché non vengono verificati tutti questi punti sul sito live:
- dominio reale/canonico effettivamente usato dal business
- corrispondenza tra nome attività e brand visibile nel sito
- pagina contatti / about / footer / legal controllate davvero
- email e recapiti coerenti con il dominio o spiegati chiaramente
- nessun uso del solo CRM come fonte di verità per il dominio

Se uno di questi punti non è verificato, il lead va bloccato come `re-audit required` e non va contattato.

Comando minimo:

```bash
npm run lead:verify-site -- --lead-id LD-XXXX --report sales-kit/audits/lead_site_LD-XXXX.json
```

Se il report non restituisce `quoteReady: true`, il preventivo non parte.

## Regola di escalation
Se un lead risponde e si scopre che il sito o il dominio auditato erano sbagliati, il caso è da considerare compromesso sul piano del metodo.
Azioni obbligatorie:
1. correggere CRM
2. segnare `last_error=lead_audited_on_wrong_domain_previous_pass`
3. rifare audit da zero sul sito corretto
4. non riusare il preventivo o l'analisi precedente
