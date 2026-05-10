# Global Starter Batch - 2026-05-11

## Scopo

Creare il primo batch internazionale con massimo 20 lead puliti, separato dal CRM storico. Questo batch serve per validare metodo, tono, deliverability e qualita prima di scalare.

## Regola

Nessun lead entra in `READY_TO_CONTACT` senza verifica live del sito e audit scritto. Se manca una prova, resta `RESEARCH_PENDING` o `RESEARCH_VERIFIED`.

## Mercati iniziali

1. Italia: PMI premium, hospitality, cliniche, retail/e-commerce, servizi locali ad alto margine.
2. Spagna: hospitality, luxury services, cliniche e turismo.
3. Francia/Germania: solo aziende con sito chiaramente migliorabile e contatti verificati.
4. Regno Unito/USA: solo se il sito mostra budget potenziale e email diretta.

## Criteri lead

- Sito live con dominio proprio.
- Email aziendale verificata sul sito, non presa solo da directory.
- Lingua commerciale chiara.
- Valuta coerente con mercato reale servito.
- Almeno 3 problemi osservabili: CTA, mobile, trust, checkout, booking, conversione, multilingua, contenuti.
- Almeno 3 miglioramenti specifici legati a pagine o flussi reali.
- Nessun lead gia presente in `sales-kit/lead_pipeline.csv` con stato commerciale attivo.

## Stato ammesso

- `RESEARCH_PENDING`: lead candidato, non ancora verificato.
- `RESEARCH_VERIFIED`: sito/email verificati, audit non ancora sufficiente per contatto.
- `READY_TO_CONTACT`: pronto per email day-1, con audit completo.

## Procedura

1. Ricerca manuale o Browser su settore/mercato.
2. Apertura sito live.
3. Verifica homepage, contatti, footer e pagina servizio/prodotto.
4. Controllo duplicati nel CRM storico.
5. Compilazione `leads.csv`.
6. Validazione con `npm run test:lead-batch`.
7. Solo dopo generazione queue e review manuale email.

## Divieti

- Niente email di massa.
- Niente preventivi nella prima email.
- Niente prezzi nella prima email.
- Niente link Facebook/TikTok finche non sono pubblici e verificati.
- Niente invio da account diverso da `cantonidigitalstudio@gmail.com`.
