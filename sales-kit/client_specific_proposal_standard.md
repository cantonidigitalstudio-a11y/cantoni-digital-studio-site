# Standard proposte cliente-per-cliente

## Obiettivo

Ogni proposta Cantoni Digital Studio deve far capire al cliente che abbiamo guardato davvero la sua presenza online, non che stiamo mandando una mail generica.

## Prima di contattare

Per ogni lead servono prove specifiche su:

- sito ufficiale e dominio corretto;
- esperienza mobile;
- percorso contatto/prenotazione/acquisto;
- social reali o assenza verificata;
- Google Maps, recensioni o piattaforme di fiducia;
- almeno due competitor o riferimenti di mercato;
- presenza su Google e potenziale visibilita in risposte AI;
- tipo soluzione consigliata: sito, redesign, e-commerce, web app, app mobile, piattaforma, automazioni AI o crescita mensile.

## Cosa deve contenere il primo messaggio

- Un segnale commerciale specifico del cliente.
- Tre problemi concreti, scritti in linguaggio comprensibile.
- Tre miglioramenti prioritari.
- Un impatto realistico.
- Nessun prezzo nel testo pubblico.
- Nessun gergo tecnico non spiegato, ad esempio `CTA`, `hero`, `funnel`, `CRO`, `UX`.
- Una richiesta semplice di risposta, senza pressione.

## Cosa non dobbiamo fare

- Non mandare listini al primo contatto.
- Non proporre app, e-commerce o piattaforme se il problema reale e prima nel sito o nel percorso contatti.
- Non proporre solo un sito quando il problema reale e prenotazione, vendita, gestione lead, automazione, contenuti, fiducia, ricerca o AI visibility.
- Non usare social non verificati come prova pubblica.
- Non inviare follow-up automatici se prima non e stata controllata Gmail.

## Gate automatici

Il batch globale deve passare:

- `npm run test:global-outreach`
- `npm run test:proposal-personalization`
- `npm run test:global-followup-d3`
- `npm run test:reply-to-quote`

Il gate `client_specific_proposal_v1` blocca lead senza audit reale, senza prove, con copy troppo generico o con linguaggio troppo tecnico.

## Passaggio risposta -> preventivo

Quando un cliente risponde chiedendo prezzo o dettagli:

1. classificare la risposta;
2. generare bozza umana di risposta, senza invio automatico;
3. generare input preventivo completo solo se il lead passa il gate quote;
4. generare preventivo, email HTML brandizzata e payload single-send;
5. inviare solo dopo revisione e conferma esplicita.

Il test `test:reply-to-quote` simula una risposta interessata e verifica che il sistema produca bozza, input preventivo, preventivo brandizzato e payload pronto per invio approvato.
