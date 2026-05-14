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

## Verifiche eseguite
- `npm test`
- `npm run test:outreach-readiness`
- `npm run build:cloudflare`
- `npm run test:artifact`
- `npm run test:full`
- `git diff --check`
- QA Playwright su `sales-kit/lead-batches/2026-05-11-global-starter/branded/internal-review-branded.html`
- QA browser interno su preview locale `http://127.0.0.1:4192/`: 8 pagine pubbliche, link WhatsApp visibili, zero errori console, nessun overflow orizzontale nel pannello.

## Regole da non violare
- Non inviare email automatiche senza approvazione esplicita.
- Non pubblicare post social senza approvazione esplicita.
- Non fare pagamenti o azioni irreversibili senza conferma live.
- Usare solo l identita Cantoni Digital Studio per outreach e supporto.
- TikTok e canale ufficiale, ma non va usato come unica prova pubblica finche alcuni visitatori sloggati vedono login obbligatorio.
- Il numero WhatsApp pubblicato resta `+39 347 196 1113` / `https://wa.me/393471961113`, gia coerente con i materiali. Il numero dettato in seguito con una cifra in piu va confermato prima di sostituire il link pubblico.

## Prossima cascata
1. Sistemare profili social esterni: WhatsApp Business nome/foto se confermato, Instagram/Facebook/TikTok contenuti clienti e coerenza bio/link.
2. Pulizia repo: separare commit-ready, materiali interni, generati e file da ignorare.
3. QA visuale live del sito pubblico su desktop, iPhone, iPad e Samsung.
4. Rifinitura pagina portfolio/case studies con prove concrete per Mr Collins, Excellentia VIP, EC8 Platform e altri lavori approvati.
5. Preparazione primo batch outreach piccolo, massimo 10 lead, con revisione manuale.
6. Verifica Gmail preflight solo su `cantonidigitalstudio@gmail.com`.
7. Invio solo dopo approvazione esplicita.
