# Cantoni Digital Studio - Cascade Status 2026-05-16

## Obiettivo

Stabilizzare il controllo operativo via dispositivi e tenere la cascata commerciale pronta, con invii solo quando il singolo lead supera audit, lingua, valuta, branding e gate qualità.

## Stato chiuso

- Samsung wireless stabilizzato in prima passata sulla rete unica di casa: `SM-N960F`, IP `192.168.1.221`, ADB TCP `5555`.
- Ricontrollo successivo: la vecchia sessione ADB e rimasta `offline` e l'IP `192.168.1.221` non risponde piu a ping/porta `5555`; scansione LAN porta `5555` senza risultati. Questo indica sessione ADB wireless persa o telefono non raggiungibile a quell'IP, non cambio di rete.
- Recovery ripetibile aggiunta in `scripts/samsung_wireless_reconnect.sh`.
- Recovery Samsung rilanciata il `2026-05-17`: `SM-N960F` tornato operativo via ADB wireless su `192.168.1.221:5555`.
- QA reale su Samsung Note 9 completato contro sito locale patchato: homepage, preventivo, case studies e termini senza overflow orizzontale, WhatsApp/privacy/termini presenti dove previsti, nessun link locale rotto, banner cookie mobile compatto.
- Polish mobile applicato a `styles.css`: topbar mobile piu compatta, H1/lead meno aggressivi, hero spacing ridotto e cookie banner mobile abbassato a ~58px reali su Samsung.
- Deploy Cloudflare preview completato su `https://preview-cantoni-site.cantonidigitalstudio.pages.dev` e verificato su Samsung reale.
- Deploy Cloudflare produzione completato su branch `main`; dominio `https://cantonidigitalstudio.com` verificato su Samsung reale con cache disabilitata.
- Git Cantoni allineato: il remoto `cantoni` ha `HEAD` su `codex/cantoni-production-grade-preview`, commit `acc6673`.
- Automazione in-thread aggiornata: `cantoni-reply-check` diventa `Cantoni daily ops check`, giornaliera alle 09:00, con controllo Gmail risposte, follow-up, social pack e pipeline; nessun invio/pubblicazione automatica senza conferma.
- Comandi progetto aggiunti:
  - `npm run device:samsung:reconnect`
  - `npm run test:device:samsung`
- Gate preventivo corretto: `test:quote-audit-standard` usa una fixture runtime, quindi non dipende piu dallo stato mutevole del CSV reale gia contattato.
- Batch globale: 50 lead contattati, 0 cold outreach residue, follow-up D3 preparato per `2026-05-18`.
- Batch qualità `2026-05-16-quality-cascade`: Blume Cruz Suites auditato in spagnolo/EUR con sito, contatti, mobile path, social, recensioni, competitor e ricerca/AI visibility.
- Proposta `LD-QC-0001` inviata a `info@apartamentosblume.com` con oggetto `Blume Cruz Suites: 3 mejoras concretas para reservas directas`; stato `CONTACTED`, follow-up impostato al `2026-05-19`.
- Proposta `LD-QC-0002` inviata a `info@bairroaltohotel.com` in portoghese/EUR; soluzione scelta `monthly_growth` perché il sito è già forte e serve crescita su prenotazione diretta, Google/Maps, ecosistema hotel/BAHR/eventi e AI visibility.
- Proposta `LD-QC-0003` inviata a `info@puntacanavip.do` in spagnolo/DOP; soluzione scelta `platform` perché il sito gestisce tour, anticipo, PayPal, account/favoriti, social proof e follow-up cliente.
- Proposta `LD-QC-0004` inviata a `general@maimounstore.com` in inglese/USD; soluzione scelta `ecommerce` perché il sito ha Shopify, account, wishlist, carrello, pickup, policy, social proof e fiducia pre-checkout da chiarire.
- Proposta `LD-QC-0005` inviata a `sales@ateliervm.com` in italiano/EUR; soluzione scelta `ecommerce` perché il sito unisce gioielli, esperienze, gift card, WhatsApp, paesi/valute e richieste commerciali.
- Corretto bug operativo del background worker: il dry-run non consuma piu la coda e mantiene gli item `pending` fino all'invio reale.
- Migliorato il generatore outreach spagnolo e portoghese: apertura piu umana, riferimenti Cantoni chiari, accenti corretti e chiusura commerciale senza prezzo nella prima email.
- Migliorato il generatore outreach inglese/italiano: saluto non generico per team aziendali e accenti/apostrofi italiani ricorrenti corretti nel testo finale.
- Aggiunto guardrail anti-duplicati per nuovi invii: un lead `READY_TO_CONTACT` viene bloccato se email o dominio sono gia stati contattati in qualunque batch archiviato.
- Review follow-up aperta e verificata su Samsung via rete locale.
- Social daily system portato a 4 canali: Instagram, Facebook, TikTok e YouTube Shorts script-ready.
- Rotazione lingue/mercati aggiunta per Italia, USA/global English, UK, Spagna, Repubblica Dominicana/Caraibi, Francia, Portogallo e Germania.
- Publish pack giornaliero rigenerato con caption, script video, script YouTube Shorts, piano lingua/mercato e checklist di approvazione per ogni giorno.
- Publish pack social corretto: `Reference` localizzato in `Riferimento`, hashtag TikTok corretto in `#cantonidigitalstudio`, prima uscita pronta per Excellentia VIP il `2026-05-18`.
- Publish pack social ricontrollato dopo review copy: eliminate etichette doppie tipo `Prova/metodo: Riferimento pubblico` e aggiunto gate automatico sui file generati per impedire regressioni nei 30 giorni.
- Publish pack social migliorato nel turno operativo corrente: il placeholder grafico vuoto e stato sostituito da un riquadro proof utile (`PROVA LIVE` / dominio verificabile) e la prima card Excellentia VIP resta leggibile a 1080x1080.
- Publish pack social rifinito nel turno operativo corrente: la caption Excellentia VIP del 18 maggio ora parla di richiesta chiara da telefono, la checklist usa accenti corretti e `test:social:daily` blocca regressioni tipo `credibilita`, `velocita`, `Il testo e` e `video e stato`.
- Gate canali social reso coerente con la realta delle piattaforme: Facebook resta prova pubblica forte; Instagram e TikTok sono canali ufficiali ma possono mostrare login-gate su browser non autenticati, quindi il test li accetta solo se non espongono link vecchi e, quando pubblici, mostrano brand corretto.
- Batch `2026-05-17-next-global-6` preparato senza invii: 6 lead `READY_TO_CONTACT` in USA, Spagna e Portogallo, con lingua/valuta coerenti (`en/USD`, `es/EUR`, `pt/EUR`) e nessun duplicato recente.
- Nuovo batch convertito in queue e bozze brandizzate revisionabili: `sales-kit/lead-batches/2026-05-17-next-global-6/outreach_queue.json` e `sales-kit/lead-batches/2026-05-17-next-global-6/branded/internal-review-branded.html`.
- Template cold outreach migliorati: apertura inglese/italiana piu umana con presentazione Cantoni, oggetti inglesi differenziati per charter, platform e hospitality, e TikTok mostrato come link pubblico pulito senza note tecniche interne al cliente.
- Gate branding aggiornato al nuovo standard pubblico: Instagram, Facebook, TikTok, WhatsApp, sito, portfolio e prova app EC8 restano riferimenti obbligatori; rimosso il vecchio requisito `TikTok configurato` con avviso browser.
- Worker Gmail irrigidito in dry-run: anche con `SEND_ENABLED=false` costruisce l'HTML, carica il logo inline e applica i guardrail branding/anti-prezzi/reply-to, cosi un dry-run verde corrisponde davvero a invio processabile.
- Script invio day-1 protetto: `SEND_ENABLED=true` ora richiede anche `OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND`; senza token lo script esce prima di contattare il worker.
- Registro portfolio/video aggiunto: Excellentia VIP, Mr Collins Travel, EC8 Platform, Coconut Armor, Etsy operations e Cantoni Digital Studio.
- Video storyboard pack creato per produrre Reel/TikTok/Shorts con proof reali, screen recording/screenshot e guardrail anti-AI generico.
- Voiceover protocol aggiunto: cartelle private ignorate da git, review candidati WhatsApp solo inviati da Emanuele, selezione manuale 10-15 clip solo voce Emanuele e nessun dato privato.
- Discovery voice reference eseguita con filtro `sent_by_me`: 122 media inviati visti nel database WhatsApp, 88 audio inviati risolti localmente, 85 candidati per durata, 40 staged in review privata.

## Verifiche eseguite

- `npm run test:outreach-readiness`
- `LEAD_BATCH_CSV=sales-kit/lead-batches/2026-05-17-next-global-6/leads.csv node sales-kit/scripts/verify_global_outreach_batch.mjs --csv sales-kit/lead-batches/2026-05-17-next-global-6/leads.csv --max-ready-per-run 10 --max-rows 10`
- `LEAD_BATCH_CSV=sales-kit/lead-batches/2026-05-17-next-global-6/leads.csv npm run test:outreach-dedupe`
- `node sales-kit/scripts/verify_outreach_queue_quality.mjs --queue sales-kit/lead-batches/2026-05-17-next-global-6/outreach_queue.json`
- `node sales-kit/scripts/verify_outreach_branding.mjs --queue=sales-kit/lead-batches/2026-05-17-next-global-6/branded/outreach_queue_branded.json --html=sales-kit/lead-batches/2026-05-17-next-global-6/branded/internal-review-branded.html`
- `node sales-kit/scripts/verify_proposal_personalization.mjs --csv sales-kit/lead-batches/2026-05-17-next-global-6/leads.csv`
- `LEAD_PIPELINE_CSV=sales-kit/lead-batches/2026-05-17-next-global-6/leads.csv SEND_ENABLED=false MAX_PER_RUN=6 bash scripts/day1_send_background.sh sales-kit/lead-batches/2026-05-17-next-global-6/branded/outreach_queue_branded.json`
- `LEAD_PIPELINE_CSV=sales-kit/lead-batches/2026-05-17-next-global-6/leads.csv SEND_ENABLED=true MAX_PER_RUN=1 bash scripts/day1_send_background.sh sales-kit/lead-batches/2026-05-17-next-global-6/branded/outreach_queue_branded.json` deve fallire senza token approvazione.
- `npm run test:branded-outreach`
- `npm run test:global-outreach`
- `git diff --check`
- `npm run test:global-followup-d3` rilanciato dopo ricontrollo Gmail live del `2026-05-17`: 50 follow-up D3 pronti per target `2026-05-18`, 0 importi pubblici, 0 mismatch reply-to, 0 failure.
- `npm run test:outreach-readiness` rilanciato dopo ricontrollo Gmail live del `2026-05-17`: verde; social public, lead endpoint, quote audit, reply-to-quote e readiness cascade ok.
- `npm run test:social:daily` rilanciato dopo ricontrollo Gmail live del `2026-05-17`: 30 giorni pronti, canali Instagram/Facebook/TikTok/YouTube Shorts, 0 failure.
- `npm run test:global-followup-d3` rilanciato nel turno operativo corrente: 50 follow-up D3 pronti per target `2026-05-18`, 0 importi pubblici, 0 mismatch reply-to, 0 failure.
- `npm run test:social:daily` rilanciato nel turno operativo corrente: 30 giorni pronti, canali Instagram/Facebook/TikTok/YouTube Shorts, 0 failure.
- `npm run test:outreach-readiness` rilanciato nel turno operativo corrente: dedupe, branded outreach, canali pubblici, endpoint lead, quote audit, reply-to-quote e readiness cascade verdi.
- Follow-up D3 migliorato nel turno operativo corrente: la coda ora conserva `business_name`, `website`, `first_improvement`, `expected_impact` ed `evidence_refs`; i template IT/ES/FR/PT usano accenti naturali, le frasi di impatto sono rese come frammenti grammaticali (`più`, `más`, `mais`) e il gate blocca localizzazioni deboli tipo `intencion`, `movil`, `acao`, `te escribi`, `Ola`.
- `npm run test:global-followup-d3` il `2026-05-17`: 50 follow-up D3 pronti per target `2026-05-18`, 0 importi pubblici, 0 mismatch reply-to, 0 failure.
- `npm run test:social:daily` il `2026-05-17`: 30 giorni, canali Instagram/Facebook/TikTok/YouTube Shorts, 0 failure dopo pulizia proof label.
- `npm run test:social-public` ricontrollato il `2026-05-17`: il controllo live puo essere instabile su Instagram; lo standard e stato allineato a `login-gated-ok` come per TikTok, mantenendo Facebook e identita-operativa come prove pubbliche robuste.
- `npm run test:outreach-readiness` rilanciato il `2026-05-17` dopo fix social-public: verde.
- `npm run test:global-outreach` rilanciato il `2026-05-17`: 50 righe, 50 contattati, `ready_to_contact=0`, 0 duplicati, 0 problemi di personalizzazione.
- `npm test`
- `npm run test:browser`
- `npm run test:global-outreach`
- `npm run test:global-followup-d3`
- `npm run test:social:daily`
- `npm run test:social:video`
- `npm run test:social:voice`
- `VOICE_CANDIDATE_LIMIT=40 npm run build:social:voice-review` con filtro default `VOICE_DIRECTION=sent_by_me`
- `npm run test:social`
- `npm run build:social:daily`
- `npm run test:social:daily`
- `npm run test:social:video`
- `npm run test:social`
- `npm run test:outreach-dedupe`
- `LEAD_BATCH_CSV=sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv npm run test:outreach-dedupe`
- `LEAD_BATCH_CSV=sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv npm run test:outreach-dedupe` dopo invio `LD-QC-0004/0005`: 0 candidati residui e nessun duplicato.
- `node sales-kit/scripts/verify_global_outreach_batch.mjs --csv sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv --max-ready-per-run 10 --max-rows 15`
- `node sales-kit/scripts/verify_outreach_queue_quality.mjs --queue sales-kit/lead-batches/2026-05-16-quality-cascade/outreach_queue.json`
- `node sales-kit/scripts/verify_proposal_personalization.mjs --csv sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv`
- `node sales-kit/scripts/verify_outreach_branding.mjs --queue=sales-kit/lead-batches/2026-05-16-quality-cascade/branded/outreach_queue_branded.json --html=sales-kit/lead-batches/2026-05-16-quality-cascade/branded/internal-review-branded.html`
- `LEAD_PIPELINE_CSV=sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv SEND_ENABLED=false MAX_PER_RUN=1 bash scripts/day1_send_background.sh sales-kit/lead-batches/2026-05-16-quality-cascade/branded/outreach_queue_branded.json`
- `LEAD_PIPELINE_CSV=sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv SEND_ENABLED=true MAX_PER_RUN=1 bash scripts/day1_send_background.sh sales-kit/lead-batches/2026-05-16-quality-cascade/branded/outreach_queue_branded.json`
- `LEAD_PIPELINE_CSV=sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv SEND_ENABLED=false MAX_PER_RUN=2 bash scripts/day1_send_background.sh sales-kit/lead-batches/2026-05-16-quality-cascade/branded/outreach_queue_branded.json`
- `LEAD_PIPELINE_CSV=sales-kit/lead-batches/2026-05-16-quality-cascade/leads.csv SEND_ENABLED=true MAX_PER_RUN=2 bash scripts/day1_send_background.sh sales-kit/lead-batches/2026-05-16-quality-cascade/branded/outreach_queue_branded.json`
- `npm run test:device:samsung` passato nella prima verifica; ricontrollo successivo bloccato da sessione ADB wireless non raggiungibile.
- `bash scripts/samsung_wireless_reconnect.sh` rilanciato il `2026-05-17`: `adb_state=device`, `model=SM-N960F`, `wlan0=192.168.1.221/24`, `tcp_port=5555`.
- QA Samsung via Chrome reale/ADB wireless su server locale patchato il `2026-05-17`: report `sales-kit/device-qa/2026-05-17-samsung/samsung-local-patched-qa.json`, screenshot `home-local.png`, `preventivo-local.png`, `case-studies-local.png`, `termini-local.png`, esito `ok=true`.
- `npm run build:cloudflare`
- `npm run test:artifact`
- `wrangler pages deploy .cloudflare-pages --project-name cantonidigitalstudio --branch preview-cantoni-site`: completato, alias `https://preview-cantoni-site.cantonidigitalstudio.pages.dev`.
- QA Samsung Cloudflare preview: report `sales-kit/device-qa/2026-05-17-samsung/samsung-cloudflare-preview-qa.json`, esito `ok=true`.
- `wrangler pages deploy .cloudflare-pages --project-name cantonidigitalstudio --branch main`: completato.
- QA Samsung produzione `https://cantonidigitalstudio.com`: report `sales-kit/device-qa/2026-05-17-samsung/samsung-production-qa.json`, esito `ok=true`; CSS preview/prod con hash identico.
- `npm test`
- `npm run test:payments`
- `npm run test:browser`
- `npm run test:browser:artifact`
- `npm run test:payments:artifact`
- `npm run test:vip`
- `npm run test:social`
- `npm run test:outreach-readiness`
- `npm run test:global-outreach`
- `npm run test:global-followup-d3`
- `npm run test:lead-endpoint`
- `npm run test:device:samsung`
- `git diff --check`
- `npm run test:global-outreach` dopo integrazione del gate anti-duplicati.
- `npm run test:outreach-readiness`

## Gmail

- Ricerca stretta Cantoni: nessuna risposta trovata per `to:cantonidigitalstudio@gmail.com` negli ultimi 7 giorni.
- Alcune email recenti lette dal connettore riguardano Excellentia VIP, quindi non vanno classificate come risposte outreach Cantoni.
- Ricontrollo live nel Browser laterale Codex `iab` su Gmail `cantonidigitalstudio@gmail.com`: inbox aperta, 97 non lette, 107 conversazioni totali visibili.
- Query live `in:inbox newer_than:7d -from:cantonidigitalstudio@gmail.com`: 24 risultati. Classificazione rapida: auto-risposte hospitality, avvisi sicurezza/social, MOO/DHL e una mail Excellentia/PayPal inoltrata; nessuna risposta commerciale positiva evidente.
- Query live commerciale `in:inbox newer_than:30d (interessato OR interessata OR interested OR interés OR interesado OR intéressé OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app) -from:cantonidigitalstudio@gmail.com`: nessun lead interessato evidente; risultati pertinenti solo auto-reply/acknowledgement o newsletter.
- Ricontrollo live da screenshot Browser laterale del `2026-05-17` sulla stessa query commerciale: 8 risultati visibili. Classificazione rapida: Mandarin Oriental Bangkok auto-reply, The Connaught thank-you, Le Bristol Paris thread nostro, Fullerton Singapore auto-reply, Claridge's thank-you, The Berkeley thank-you, Supabase newsletter e GitHub OAuth non pertinenti. Nessuna risposta positiva o richiesta commerciale evidente nella lista visibile.
- Nota connettore Gmail: il connettore disponibile in questa sessione risulta collegato a `excellentiavip@gmail.com`, quindi non va usato per inviare o classificare posta Cantoni. Per Cantoni usare sessione Gmail ufficiale nel browser o worker Apps Script gia vincolato a `reply_to=cantonidigitalstudio@gmail.com`.
- Ricontrollo runtime Playwright/Cantoni del `2026-05-17`: profilo `google-cantoni` ancora in `AUTH_REQUIRED` (`compose` non trovato). Non inviare o classificare da automazione finche la sessione ufficiale `cantonidigitalstudio@gmail.com` non e autenticata.

## Browser laterale

- Il Browser interno Codex e tornato agganciato nella finestra laterale.
- Controllo UI visibile verificato il `2026-05-17`: quando il runtime Browser diretto non e esposto e Playwright controlla una scheda separata, la finestra laterale Codex puo essere comandata via UI visibile. Prova riuscita: la schermata destra e passata da Gmail a `https://cantonidigitalstudio.com/preventivo?lang=it&smoke=1&v=visible-right-panel-test-20260517`.
- Vincolo operativo emerso nel turno corrente: il comando UI visibile puo finire su un thread Codex diverso se l'app sposta il focus. Prima di qualunque click/URL nel pannello destro serve screenshot preflight con titolo thread `Locate cantoni_site`; se il titolo non combacia, non bisogna navigare ne digitare finche non si recupera il thread giusto.
- Tentativo di apertura review follow-up via pannello visibile fermato per rischio cross-thread: la UI si e spostata su `Cantoni Stylist` e poi `Digital marketing e social media`. Non sono state fatte azioni esterne, invii, pubblicazioni o modifiche account in quei contesti.
- Pagina live verificata nella finestra laterale: `https://cantonidigitalstudio.com/preventivo?lang=it&smoke=1&v=prod-20260516a`.
- Controlli live eseguiti: H1 corretto, canonical presente, privacy/termini visibili, WhatsApp corretto, Instagram/Facebook presenti, nessun link locale rotto e nessun overflow orizzontale rilevato.
- Dopo reset consenso, il banner privacy ricompare correttamente.
- Viewport mobile `390x844`: nessun overflow rilevato.

## Prossima cascata

1. Il `2026-05-18`, prima di qualunque follow-up, controllare Gmail con ricerca stretta su Cantoni.
2. Inviare follow-up D3 solo ai lead senza risposta e solo dopo revisione/approvazione operativa.
3. Se arriva risposta interessata, generare roadmap, scope chiuso, prezzo in valuta locale e link pagamento solo dopo conferma.
4. Preparare prossimo batch piccolo, massimo 10-15 lead, con lo stesso standard: sito live, mobile, contatti, social, recensioni/Google Maps, competitor, ricerca e AI visibility.
5. Ogni giorno preparare post IG/Facebook/TikTok e script YouTube Shorts dal daily pack; pubblicare solo dopo review esplicita o approvazione operativa del pack e registrare link pubblici.
6. Selezionare 10-15 vocali `VR-*` dalla review privata prima di qualunque analisi stile o clonazione voce.
7. Tenere Browser laterale come superficie primaria quando resta agganciato; usare Samsung/iPad/iPhone solo come verifica dispositivi o fallback operativo. Se il Samsung torna offline, riattivare ADB TCP da USB/trusted debugging prima di considerarlo superficie affidabile.

## Gate qualita proposte

- Aggiunto gate pre-invio `pre_send_outreach_quality_v2`: blocca oggetti generici, testi senza business/domain anchor, mancanza di 3 osservazioni e 3 priorita, gergo tecnico, prezzi nella prima email, audit social/recensioni/competitor/AI incompleto e soluzione non supportata dall'audit.
- Ogni coda email ora porta anche metadati interni: business, sito, settore, solution type, rationale, payment readiness e audit refs.
- Comandi collegati:
  - `npm run build:global-outreach`
  - `npm run test:outreach-queue-quality`
  - `npm run test:proposal-personalization`
  - `npm run test:outreach-dedupe`
