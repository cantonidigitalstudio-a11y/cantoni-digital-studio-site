# Cantoni Digital Studio - Cascade Status 2026-05-15

## Stato chiuso in questa passata
- Outreach brandizzato: bozze con logo, sito ufficiale, email, telefono, Instagram, Facebook, TikTok e case studies.
- Copy commerciale: il playbook ora vieta bozze generiche e gergo non spiegato per clienti non tecnici.
- Preventivi: template aggiornato per siti, e-commerce, web app, app mobile, automazioni AI, pagamenti/login e gestione continuativa.
- Gestione mensile: descritta come collaborazione strategica continuativa, non solo assistenza tecnica.
- Gate operativo: aggiunto `npm run test:outreach-readiness`.
- Artifact pubblico: ricostruito e verificato con `npm run build:cloudflare && npm run test:artifact`.
- WhatsApp pubblico: aggiunto come canale visibile su pagine primarie, identita operativa, termini, privacy, pagina pagamento confermato e riferimenti post-form.
- Preventivi seri: aggiunto `sales-kit/full_quote_audit_standard.md` con gate obbligatorio su sito live, mobile, contatti, social, recensioni, competitor, ricerca e AI visibility prima di qualunque prezzo.
- Gate preventivi: aggiunto `npm run test:quote-audit-standard` dentro `npm run test:outreach-readiness`.
- Numero WhatsApp confermato: `+39 347 196 1113` / `https://wa.me/393471961113`.
- Gate CRM rafforzato: `READY_TO_CONTACT` richiede ora campi audit strutturati su dominio, mobile, contatti, social, recensioni, competitor, ricerca/AI visibility ed evidenze.
- Gate preventivo da CRM: `sales-kit/scripts/create_quote_input_from_lead.mjs` genera input preventivo solo se il lead ha audit completo, motivazione prezzo, tempistiche e deliverable; i lead ancora in ricerca vengono bloccati.
- Gate scelta soluzione: ogni preventivo da CRM richiede `recommended_solution_type`, `solution_type_rationale` e `payment_readiness` per distinguere sito, e-commerce, web app, app, piattaforma, automazioni AI o gestione continuativa.
- Outreach visual: loghi social nel template email sostituiti con icone riconoscibili e coerenti con i colori ufficiali; il blocco "Studio profilo operativo" e stato rimosso dai riquadri contatto.
- Portfolio pubblico rafforzato: `case-studies.html` ora spiega cosa puo verificare subito un cliente, che tipo di soluzione dimostra ogni reference e quali canali pubblici usare come prova.
- Social pack aggiornato: le caption chiariscono reference verificabili, distinzione sito/e-commerce/web app/app e audit prima del prezzo.
- Outreach social-proof rafforzato: TikTok resta visibile come canale configurato con handle e logo, ma non e piu un link/prova primaria nelle email brandizzate perche puo richiedere login ad alcuni visitatori.
- Batch starter: Hotel Parco e Centro Vacanze Domus restano pronti per bozza iniziale; Blume resta `RESEARCH_VERIFIED` e non va contattato finche non passa la seconda verifica.

## Verifiche eseguite
- `npm test`
- `npm run test:outreach-readiness`
- `npm run build:cloudflare`
- `npm run test:artifact`
- `npm run test:full`
- `git diff --check`
- `npm run test:lead-batch`
- `npm run test:starter-queue`
- `npm run test:quote-audit-standard`
- `npm run test:outreach-readiness`
- Generazione preventivo di prova da `LD-GS-0001` in `/tmp/cantoni-quote-gate`: passata.
- Blocco preventivo da `LD-GS-0003`: passato, perche resta `RESEARCH_VERIFIED`.
- QA Playwright su `sales-kit/lead-batches/2026-05-11-global-starter/branded/internal-review-branded.html`
- QA browser interno su preview locale `http://127.0.0.1:4192/`: 8 pagine pubbliche, link WhatsApp visibili, zero errori console, nessun overflow orizzontale nel pannello.
- QA browser interno su `internal-review-branded.html`: logo, sito, WhatsApp, Instagram, Facebook, TikTok presenti; zero errori console; nessun overflow.
- `node sales-kit/scripts/gmail_preflight.mjs`: bloccato correttamente con `AUTH_REQUIRED`, quindi non esiste una sessione Gmail locale pronta per invii da `cantonidigitalstudio@gmail.com`.

## Regole da non violare
- Non inviare email automatiche senza approvazione esplicita.
- Non pubblicare post social senza approvazione esplicita.
- Non fare pagamenti o azioni irreversibili senza conferma live.
- Usare solo l identita Cantoni Digital Studio per outreach e supporto.
- TikTok e canale ufficiale, ma non va usato come unica prova pubblica finche alcuni visitatori sloggati vedono login obbligatorio.
- Nelle bozze email TikTok non deve essere un link di prova primaria; devono restare cliccabili sito, portfolio, Instagram, Facebook, WhatsApp ed email.
- Il numero WhatsApp pubblicato resta `+39 347 196 1113` / `https://wa.me/393471961113`, confermato come corretto.

## Prossima cascata
1. Sistemare profili social esterni: WhatsApp Business nome/foto se confermato, Instagram/Facebook/TikTok contenuti clienti e coerenza bio/link.
2. Pulizia repo: separare commit-ready, materiali interni, generati e file da ignorare.
3. QA visuale live del sito pubblico su desktop, iPhone, iPad e Samsung.
4. Preparazione primo batch outreach piccolo, massimo 10 lead, con revisione manuale.
5. Pubblicazione manuale dei primi contenuti social solo dopo approvazione esplicita delle caption e immagini.
6. Rifare login/preflight Gmail solo su `cantonidigitalstudio@gmail.com`; finche il preflight resta `AUTH_REQUIRED`, nessun invio.
7. Invio solo dopo approvazione esplicita.
