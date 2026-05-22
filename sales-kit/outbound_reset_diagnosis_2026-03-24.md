# Outbound reset diagnosis - 2026-03-24

## Stato reale
- CRM totale: `515`
- `CONTACTED`: `252`
- `FOLLOWUP_D3`: `250`
- `QUOTE_SENT`: `2`
- `REPLIED`: `2`
- `CLOSED_LOST`: `6`
- `READY_TO_CONTACT`: `3`

## Diagnosi
Il problema non è il volume. Il problema è la fiducia iniziale e il rigore dell'audit.

### 1. Credibilità pubblica insufficiente
- `cantonidigitalstudio.com` oggi non risolve pubblicamente
- il primo lead che ha risposto in modo esplicito (`LD-1216`, Studio Schuster) ha sollevato proprio un'obiezione di credibilità:
  - "Ma chi siete? Non c'è nemmeno un sito, una ragione sociale ecc."

### 2. Audit non abbastanza rigoroso
- almeno un caso è stato lavorato sul dominio sbagliato:
  - `LD-1216` era stato auditato su `schuster.pro`
  - il sito reale indicato dal cliente è `http://www.studioschuster.com/`
- questo rende il caso compromesso sul piano del metodo

### 3. Troppi contatti freddi deboli
- molte caselle sono generiche (`info@`, segreteria, contatti amministrativi)
- questo abbassa drasticamente la qualità della conversazione e la probabilità di risposta positiva

### 4. Outreach partito prima del trust layer
- prima di chiedere fiducia, servono asset verificabili:
  - sito pubblico raggiungibile
  - identità chiara
  - contatti e percorso di proposta credibili

## Conseguenza operativa
L'outbound va fermato. Continuare a inviare nelle stesse condizioni aumenterebbe solo il danno reputazionale.

## Reset minimo necessario
1. Ripristinare la credibilità pubblica
   - dominio pubblico raggiungibile
   - landing e preventivo accessibili
   - identità del brand chiara

2. Blindare il gate di verifica lead
   - homepage live
   - contatti
   - footer / legal
   - conferma dominio canonico reale
   - nessuna dipendenza dal solo CRM per il dominio

3. Fare failure analysis sui lead recenti
   - campione manuale severo
   - identificare altri eventuali mismatch dominio/sito

4. Ripartire con volume basso
   - meno `info@`
   - più lead nominativi o contatti diretti
   - audit manuale sui servizi professionali e high-trust

## Regola di ripartenza
Nessun nuovo invio finché:
- il dominio pubblico non è raggiungibile
- il gate dominio/sito reale non è attivo
- non esiste una conferma manuale che gli audit recenti siano difendibili
