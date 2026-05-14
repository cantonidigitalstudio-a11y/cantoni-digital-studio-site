# Cantoni Digital Studio - Cascade Status 2026-05-15

## Stato chiuso in questa passata
- Outreach brandizzato: bozze con logo, sito ufficiale, email, telefono, Instagram, Facebook, TikTok e case studies.
- Copy commerciale: il playbook ora vieta bozze generiche e gergo non spiegato per clienti non tecnici.
- Preventivi: template aggiornato per siti, e-commerce, web app, app mobile, automazioni AI, pagamenti/login e gestione continuativa.
- Gestione mensile: descritta come collaborazione strategica continuativa, non solo assistenza tecnica.
- Gate operativo: aggiunto `npm run test:outreach-readiness`.
- Artifact pubblico: ricostruito e verificato con `npm run build:cloudflare && npm run test:artifact`.

## Verifiche eseguite
- `npm test`
- `npm run test:outreach-readiness`
- `npm run build:cloudflare`
- `npm run test:artifact`
- `git diff --check`
- QA Playwright su `sales-kit/lead-batches/2026-05-11-global-starter/branded/internal-review-branded.html`

## Regole da non violare
- Non inviare email automatiche senza approvazione esplicita.
- Non pubblicare post social senza approvazione esplicita.
- Non fare pagamenti o azioni irreversibili senza conferma live.
- Usare solo l identita Cantoni Digital Studio per outreach e supporto.
- TikTok e canale ufficiale, ma non va usato come unica prova pubblica finche alcuni visitatori sloggati vedono login obbligatorio.

## Prossima cascata
1. Pulizia repo: separare commit-ready, materiali interni, generati e file da ignorare.
2. QA visuale live del sito pubblico su desktop, iPhone, iPad e Samsung.
3. Rifinitura pagina portfolio/case studies con prove concrete per Mr Collins, Excellentia VIP, EC8 Platform e altri lavori approvati.
4. Preparazione primo batch outreach piccolo, massimo 10 lead, con revisione manuale.
5. Verifica Gmail preflight solo su `cantonidigitalstudio@gmail.com`.
6. Invio solo dopo approvazione esplicita.
