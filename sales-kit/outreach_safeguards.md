# Cantoni Digital Studio - Outreach Safeguards

## Scopo
Evitare errori commerciali ripetuti:
- ricontattare lead gia contattati
- mandare nuovi preventivi a lead gia in preventivo senza motivo chiaro
- usare il cliente come banco di prova
- mischiare batch nuovi con lead gia lavorati

## Regola principale
Prima di qualunque nuova email commerciale, verificare sempre lo stato CRM del lead.

## Stati che bloccano il reinserimento in batch nuovi
Se un lead ha uno di questi stati, non puo entrare in un nuovo batch outreach:
- CONTACTED
- REPLIED
- QUOTE_IN_PROGRESS
- QUOTE_SENT
- CLOSED_WON
- CLOSED_LOST

## Quando un lead puo essere ricontattato
Solo in questi casi:
- follow-up pianificato e tracciato nel CRM
- risposta del cliente che richiede chiarimenti o nuova proposta
- nuova strategia commerciale esplicita e documentata

In tutti gli altri casi: non si scrive di nuovo.

## Controlli obbligatori prima di ogni invio
1. Verificare `lead_pipeline.csv`
2. Verificare se esiste gia una mail di outreach inviata
3. Verificare se esiste gia un preventivo inviato
4. Verificare se il lead appartiene gia a un batch precedente
5. Verificare che il contenuto non sia una revisione tardiva di un materiale gia mandato

Se uno di questi controlli fallisce, l invio si ferma.

## Regola sui preview
- i preview si mandano solo a caselle interne di controllo
- mai a clienti reali
- mai usare il cliente per test di layout, branding o copy

## Lead gia toccati da escludere dai batch nuovi
- BDD Dental Clinic / BDD Studio Dentistico
  - stato: QUOTE_SENT
  - motivo: outreach e preventivo gia inviati

- 209 NYC Dental
  - stato: QUOTE_SENT
  - motivo: outreach e preventivo gia inviati

## Procedura batch nuova
Per ogni nuovo batch:
1. creare lista candidati
2. escludere lead gia toccati
3. marcare i restanti come AUDIT_PENDING
4. fare audit live
5. solo dopo portare a READY_TO_CONTACT

## Regola finale
Se esiste un dubbio sul fatto che un lead sia gia stato contattato, il lead non si manda finche il CRM non chiarisce lo stato.


## Safeguard dominio reale
Nessun lead può uscire in outbound se il dominio è stato preso solo dal CRM, da OSM o da una fonte indiretta senza verifica sul sito reale.
Controlli minimi obbligatori prima dell'invio:
- homepage live
- contatti
- footer
- eventuale about/chi siamo
- conferma che il dominio auditato sia quello realmente usato dal business
