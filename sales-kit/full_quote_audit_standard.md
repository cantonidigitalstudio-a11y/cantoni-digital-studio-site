# Cantoni Digital Studio - Standard Audit Prima Del Preventivo

## Scopo
Un preventivo Cantoni non parte da una tabella prezzi. Parte da una verifica reale del cliente, del suo sito, dei social, delle recensioni, dei concorrenti e del modo in cui una persona arriva a chiedere informazioni o comprare.

Se questo audit non e completo, non si invia un preventivo. Il lead resta in analisi.

## Regola base
- Guardare il sito live oggi, non un dominio vecchio, un dato CRM o una memoria di outreach precedente.
- Se il dominio vecchio rimanda a un sito nuovo, usare il sito nuovo e annotare il redirect.
- Salvare evidenza interna: link, screenshot, note di pagina, data e canale verificato.
- Non scrivere al cliente cose che non sono state viste direttamente.
- Tradurre sempre il gergo in parole normali: "prima parte della pagina", "pulsante per chiedere informazioni", "percorso da telefono", "presenza su Google", "richieste reali".

## 1. Sito e dominio
- Dominio attuale, canonical, redirect, http/https e versione www/non-www.
- Homepage, menu, pagine servizi, pagina contatti, privacy/cookie, termini, policy di rimborso o cancellazione quando vende online.
- Mobile: capire se da telefono si riesce davvero a trovare servizio, fiducia e contatto senza confusione.
- Velocita percepita, asset mancanti, errori visibili, layout rotto, testi tagliati o elementi che si sovrappongono.
- SEO base: title, description, sitemap, robots, schema, heading, pagine locali o servizi principali.

## 2. Percorso commerciale
- Cosa vende davvero il cliente e a chi.
- Primo passo richiesto al visitatore: telefonare, WhatsApp, email, form, prenotare, comprare, iscriversi.
- Frizioni: troppi passaggi, contatto nascosto, offerte poco chiare, prezzo non spiegato, prove deboli, fiducia assente.
- Pagamenti, prenotazioni, e-commerce o checkout: controllare senza fare transazioni reali.
- Se serve app, web app, area cliente, dashboard o automazione, spiegare il motivo operativo e non venderla come extra generico.

## 3. Social e canali pubblici
Controllare solo canali reali o linkati dal cliente, senza inventare presenza.

- Instagram: bio, link, qualita post, frequenza, prove cliente, coerenza visiva, call to action.
- Facebook: pagina o profilo, informazioni, recensioni, link, messaggi, aggiornamenti.
- TikTok: se presente, tipo di contenuto, frequenza, pubblico, link e coerenza con offerta.
- YouTube: video, shorts, presentazioni, testimonianze, qualita e aggiornamento.
- LinkedIn: rilevante per B2B, studi professionali, real estate, SaaS, consulenza e corporate.
- Altri canali di settore: Pinterest, Behance, marketplace, directory locali o verticali.

## 4. Recensioni e reputazione
La reputazione va controllata dove il cliente viene davvero giudicato.

- Google Business Profile: rating, numero recensioni, risposte, foto, orari, link sito, categoria.
- Tripadvisor: hotel, ristoranti, tour, esperienze e hospitality.
- Trustpilot: e-commerce, servizi online, piattaforme.
- Booking, Expedia, Airbnb: hospitality e soggiorni.
- TheFork: ristoranti.
- Marketplace o directory verticali: dentisti, beauty, fitness, immobiliare, legale, servizi locali.
- Segnalare se le recensioni sono buone ma non usate bene sul sito.
- Segnalare se il sito promette premium ma la prova pubblica non sostiene il prezzo.

## 5. Competitor e mercato
- Cercare almeno 2-3 competitor reali nello stesso mercato o segmento.
- Guardare come presentano offerta, prezzi, fiducia, recensioni, social e percorso contatto.
- Capire se il cliente deve competere localmente, nazionalmente o a livello internazionale.
- Valutare lingua e valuta del preventivo in base al mercato servito, non solo alla sede.

## 6. Google, ricerca e AI visibility
- Verificare se il cliente e facile da trovare con ricerche normali: brand, servizio + citta, categoria + zona.
- Controllare se sito e contenuti spiegano chiaramente chi sono, cosa fanno, dove lavorano e perche fidarsi.
- Quando utile, proporre lavoro continuativo per migliorare presenza su Google e nelle risposte delle intelligenze artificiali.
- Non promettere ranking garantiti. Parlare di contenuti, struttura, autorita, prova pubblica e miglioramento continuo.

## 7. Output minimo prima del preventivo
Ogni audit che genera una proposta deve contenere:

- URL analizzato e data.
- Mercato, lingua e valuta.
- Canali social trovati o assenti.
- Piattaforme recensioni controllate.
- Almeno 3 problemi concreti.
- Almeno 3 interventi proposti, spiegati in modo comprensibile.
- Motivazione del prezzo e della tempistica.
- Rischi o dati mancanti da confermare.
- Prossimo passo chiaro per il cliente.

## 8. Campi CRM obbligatori
Un lead puo diventare `READY_TO_CONTACT` solo se nel CRM o nel CSV batch sono compilati questi campi audit:

- `audit_date`: data ISO dell audit, esempio `2026-05-15`.
- `current_domain_verified`: dominio live/canonical/redirect controllato.
- `mobile_experience_checked`: cosa e stato visto da telefono o viewport mobile.
- `contact_flow_checked`: telefono, email, WhatsApp, form, booking o checkout verificati senza transazioni reali.
- `social_channels_checked`: canali trovati o assenti, separati da `|`.
- `review_platforms_checked`: Google Business Profile, Tripadvisor, Booking, Trustpilot o piattaforme rilevanti, separate da `|`.
- `competitors_checked`: almeno due competitor o alternative reali, separati da `|`.
- `search_ai_visibility_checked`: nota su ricerca Google, brand query, categoria e possibile lavoro di visibilita AI.
- `evidence_refs`: URL, screenshot o note Browser/QA, separati da `|`.

Un preventivo generato da CRM richiede anche `pricing_rationale`, prezzo consigliato, tempistiche e deliverable. Se questi campi mancano, lo script di generazione deve bloccarsi.

## 9. Scelta corretta del tipo di soluzione
Prima di mandare un prezzo bisogna classificare cosa serve davvero. Non proporre app, e-commerce o web app per alzare il preventivo: la soluzione deve essere collegata al problema osservato.

Campi obbligatori prima del preventivo:

- `recommended_solution_type`: uno tra `website`, `website_redesign`, `ecommerce`, `web_app`, `mobile_app`, `platform`, `automation_ai`, `monthly_growth`.
- `solution_type_rationale`: perche quella soluzione e corretta e perche le alternative non sono prioritarie.
- `payment_readiness`: quale pagamento puo essere mandato subito se il cliente risponde interessato.

Regole pratiche:

- `website` o `website_redesign`: quando il problema e fiducia, chiarezza, contatto, prenotazione o presenza pubblica.
- `ecommerce`: solo quando il cliente deve vendere prodotti/servizi online con catalogo, carrello, pagamenti e gestione ordini.
- `web_app`: quando serve un sistema operativo con login, dashboard, dati, ruoli, gestione interna o area cliente.
- `mobile_app`: quando serve davvero una presenza installabile, uso ricorrente, notifiche, funzioni native o distribuzione App Store/Play Store.
- `platform`: quando ci sono piu ruoli, pagamenti, workflow, dati e crescita modulare.
- `automation_ai`: quando il valore viene da automazioni, follow-up, contenuti, routing lead, documenti o supporto decisionale.
- `monthly_growth`: quando il lavoro principale e miglioramento continuo di contenuti, fiducia, ricerca Google, visibilita AI e conversione.

Se il cliente risponde interessato ma non esiste ancora scope scritto, il link pagamento immediato corretto e la consulenza/analisi iniziale da 250 EUR. Per pacchetti completi si manda pagamento solo dopo scope scritto e conferma del percorso.

## Stop rule
Non inviare il preventivo se:

- il sito non e stato visto live;
- non si capisce quale sia il dominio corretto;
- social o recensioni vengono citati senza verifica;
- mancano lingua, valuta o mercato;
- il documento potrebbe essere mandato identico a un altro cliente;
- il cliente non capirebbe cosa sta comprando senza conoscere parole tecniche.

## Gate pre-invio email

La prima proposta commerciale deve passare anche il gate pre-invio:

```bash
npm run build:global-outreach
npm run test:outreach-queue-quality
npm run test:proposal-personalization
```

Questo gate blocca oggetti generici, testi senza business anchor, prime email con prezzi, gergo non spiegato, mancanza di social/recensioni/competitor e incoerenza tra problema osservato e soluzione consigliata. Lo standard completo e in `sales-kit/pre_send_proposal_quality_gate.md`.
