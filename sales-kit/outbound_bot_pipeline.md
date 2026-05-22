# Cantoni Digital Studio - Outbound Bot Pipeline

## Obiettivo

Usare automazione e agenti per aumentare la qualità del cold outreach, non il rumore.

La pipeline deve produrre email credibili, personalizzate e tracciate, con gate duri prima dell'invio.

## Pipeline operativa

### 1. Ricerca

Responsabilità:

- trovare lead nuovi
- deduplicare contro il CRM
- escludere host deboli o social-only
- fermare lead senza sito o senza email verificabile

Output minimo:

- business name
- website
- city
- country
- sector
- email

### 2. Audit live

Responsabilità:

- aprire il sito live
- leggere homepage e contatti
- identificare segnali reali
- trovare almeno 3 problemi concreti
- trovare almeno 3 miglioramenti concreti

Segnali da privilegiare:

- CTA confuse o deboli
- pagine vuote o incomplete
- contatti incoerenti
- trust gap
- inventory assente o rotta
- link legali placeholder
- percorso conversione lungo o dispersivo

### 3. Copy primo contatto

Responsabilità:

- prima email breve
- nessun prezzo
- nessun preventivo
- lingua del cliente
- tono professionale

La prima email deve:

- citare il business reale
- citare problemi reali
- spiegare l'impatto commerciale
- chiedere solo un primo riscontro

### 4. Verifica pre-invio

Gate obbligatori:

- email valida
- narrative non debole
- email angle non debole
- almeno 3 problemi
- almeno 3 miglioramenti
- nessun duplicato CRM
- nessun lead già contattato

Gate extra di qualità:

- se l'email è una generic inbox, deve esserci almeno una pagina contatti reale o evidenza concreta del sito
- se non esiste almeno un segnale specifico forte del sito, il lead non parte

### 5. Invio

Responsabilità:

- inviare solo lead che hanno passato tutti i gate
- aggiornare CRM
- impostare follow-up
- non reinviare a lead già toccati

## Regola strategica

L'automazione serve per scalare il metodo.
Il livello "maniacale" non si ottiene con più volume, ma con più controlli.

Quindi:

- cold outreach scalabile -> pipeline con gate forti
- lead top-tier / reply -> lavorazione premium manuale

## Errori da non ripetere

- preventivo nel primo contatto
- claim non verificati
- mercato servito sbagliato
- città trattata come mercato unico quando il business opera altrove
- testo generico
- seconda email correttiva al cliente per errori evitabili

## File chiave

- `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/scripts/discover_and_send_local_leads.mjs`
- `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/global_outreach_playbook.md`
- `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/outreach_safeguards.md`
- `/Volumes/Lexar/Siti internet mondiale /cantoni_site/sales-kit/quote_rigor_protocol.md`
