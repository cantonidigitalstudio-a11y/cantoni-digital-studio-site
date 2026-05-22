# Cantoni Digital Studio - Daily ops 2026-05-19

## Passata operativa

- Gmail Cantoni controllata nel pannello destro con account `cantonidigitalstudio@gmail.com` e query commerciale ultime 48 ore.
- Thread trovati: 5.
- Positive: 0.
- Dubbie: 0.
- Negative: 0.
- Automatiche/generiche: 5.
  - Le Bristol Paris: conferma automatica presa in carico.
  - The Fullerton Hotel Singapore: risposta automatica / ufficio chiuso.
  - Claridge's: conferma automatica di ricezione.
  - The Connaught: conferma automatica di ricezione.
  - The Berkeley: conferma automatica / contenuto generico di ricezione.
- Nessuna risposta manuale inviata e nessuna bozza inviata.

## Outreach

- D3 globale: `50/50` follow-up risultano `sent`.
- NG6: `6/6` risultano `sent`.
- NQ6: `6/6` risultano `sent`.
- NEU6: `6/6` risultano `sent`.
- Decisione: non reinviare duplicati; prossimo blocco follow-up sui nuovi batch da preparare per `2026-05-21`.

## Follow-up preparati senza invio

- Preparati e verificati i follow-up D3 per i `18` lead con prossima azione `2026-05-21`; nessuna email inviata.
- Preparati anche i `5` follow-up del blocco quality-cascade maturi `2026-05-19`; restano separati per evitare confusione con il batch del 21 maggio.
- Gate `verify_followup_queue`: verde su tutti e 4 i file, con `0` prezzi pubblici e `0` reply-to errati.
- Review generate:
  - `sales-kit/lead-batches/2026-05-17-next-global-6/followup-review-2026-05-21.html`
  - `sales-kit/lead-batches/2026-05-17-next-quality-6/followup-review-2026-05-21.html`
  - `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/followup-review-2026-05-21.html`
  - `sales-kit/lead-batches/2026-05-16-quality-cascade/followup-review-2026-05-19.html`
- Correzioni qualità applicate al generatore: accenti spagnoli (`petición`), apostrofo italiano (`L'Essenziale`) e tedesco naturale (`Priorität wäre`).
- Review NEU6 aperta nel Browser laterale tramite server locale `http://127.0.0.1:4211/...` per controllo visivo.

## Social

- Instagram Excellentia VIP: pubblicato e verificato, `https://www.instagram.com/cantonidigitalstudio/p/DYfKx3lDaUc/`.
- Facebook/TikTok/YouTube Shorts Excellentia VIP: non ancora chiusi per sessioni/canali da verificare.
- Pack Destination Cocoa 2026-05-19 ricontrollato nel pannello destro.
- Migliorato asset Destination Cocoa: sostituito placeholder `DC` con preview reale del sito pubblico.
- Aggiunta review HTML generata per ogni day-pack social.
- Generato short video Destination Cocoa: `sales-kit/social-launch/daily-publish-pack/2026-05-19-2026-05-19-destination-cocoa/short-video/2026-05-19-2026-05-19-destination-cocoa-short.mp4`.
- Auto-review video: corretto frame iniziale sovrapposto e footer errato `Excellentia VIP`; il video ora cita Destination Cocoa e resta `review_required_before_upload`.
- Prossimo pack EC8 Platform 2026-05-20 controllato come proof prudente: cita solo `https://ec8platform.com`, verificato live `HTTP/2 200`; non cita ancora link App Store/Play Store finche non vengono riverificati.

## Verifiche

- `npm test`: verde.
- `npm run test:payments`: verde, senza transazioni reali.
- `npm run test:browser`: verde.
- `npm run test:social:daily`: verde.
- `npm run test:social:video`: verde.
- `SOCIAL_SHORT_ENTRY=2026-05-19-2026-05-19-destination-cocoa npm run test:social:short`: verde.
- `npm run test:social-public`: verde.
- `git diff --check`: verde.
- `npm run test:full`: verde.
- Dopo `test:full`, short video Destination Cocoa rigenerato e verificato di nuovo perche il daily export ricrea il pack.
- Passata successiva 2026-05-19: `npm run test:social:daily`, `npm run test:social:video`, `npm run test:social-public` e `git diff --check` verdi; `test:social:short` ha richiesto rigenerazione del video perche `test:social:daily` ricrea il pack e rimuove il manifest, poi e tornato verde con `SOCIAL_SHORT_ENTRY=2026-05-19-2026-05-19-destination-cocoa`.
- Gate sito rilanciati dopo le modifiche follow-up: `npm test`, `npm run test:browser` e `npm run test:payments` verdi; Stripe verificato senza transazioni reali, con PayPal ancora classificato come `sessionDependentMisses` ma non errore.

## Blocchi

- Facebook: pubblicazione reale richiede sessione Page manager verificata.
- TikTok: pubblicazione reale richiede login Google/OAuth funzionante nel canale operativo.
- YouTube Shorts: upload reale richiede canale verificato e review finale del video su telefono.
- Non pubblicare Destination Cocoa o altri contenuti senza approvazione finale esplicita del post/canale.

## Accessi social e pack pronti - passata Browser laterale

- Browser laterale allineato alla review: `Review social - Destination Cocoa: prenotazioni turistiche`.
- Bundle locale pronto per caricamento manuale/assistito dopo approvazione: `/tmp/cantoni-destination-cocoa-publish/`.
  - `destination-cocoa-instagram.png`
  - `destination-cocoa-short.mp4`
  - `instagram.caption.txt`
- Instagram: profilo `cantonidigitalstudio` autenticato e operativo; pulsante `Nuovo post` visibile. Pronto per pubblicazione Destination Cocoa solo con approvazione esplicita del singolo post.
- Facebook: pagina pubblica Cantoni visibile, ma nel Browser laterale risulta ancora richiesta sessione/QR; composer di pagina non disponibile.
- TikTok: profilo `@cantonidigitalstudio` reindirizza a login obbligatorio; usare `Continua con Google` e account Cantoni appena la sessione e il popup sono gestibili.
- YouTube Shorts: Studio non è pronto come canale Cantoni; il flusso proponeva creazione canale personale `Emanuele Cantoni` / `EmanueleCantoni`, annullato. Non creare canale personale per contenuti Cantoni.
- Nessuna pubblicazione social eseguita in questa passata.

## Tentativo pubblicazione Instagram Destination Cocoa

- Approvazione ricevuta: `approvo pubblicazione Instagram Destination Cocoa`.
- Instagram aperto come `@cantonidigitalstudio`; dialog `Crea nuovo post` raggiunto correttamente.
- Asset tentato: `/tmp/cantoni-destination-cocoa-publish/destination-cocoa-instagram.png`.
- Metodi tentati nel Browser laterale:
  - click su `Seleziona dal computer`;
  - paste immagine dagli appunti del Browser;
  - paste file URL/percorso locale.
- Esito: il dialog Instagram resta su `Trascina le foto e i video qui`; il canale Browser laterale non espone un upload file completabile automaticamente.
- Stato: post non pubblicato, nessun invio eseguito. Pacchetto resta pronto per upload manuale o per un canale operativo alternativo con file chooser controllabile.

## Heartbeat 2026-05-19 09:01 Europe/Rome

- Richiesta heartbeat: controllo Gmail operativo completo, pipeline follow-up, social pack e gate senza inviare/pubblicare/pagare.
- Browser laterale: tentativo di controllo Gmail non completato per indisponibilita del canale Browser in questa esecuzione; stato corretto: `BLOCCO_GMAIL_BROWSER`.
- Gmail connector: ricerca ristretta a `to:cantonidigitalstudio@gmail.com` / `cc:cantonidigitalstudio@gmail.com` / `deliveredto:cantonidigitalstudio@gmail.com` ultime 48 ore non ha restituito messaggi; il connettore ha pero mostrato anche posta `excellentiavip@gmail.com`, quindi non viene usato come unica fonte ufficiale Cantoni.
- Classificazione ufficiale Cantoni da questa passata: positiva commerciale `0`, dubbia/da review `0`, negativa `0`, automatica/generica `0`, operativa urgente `0`, operativa non urgente `0`, irrilevante `0`, con attendibilita limitata dal blocco Browser.
- Follow-up: le 4 code gia preparate restano verdi: NG6 `6`, NQ6 `6`, NEU6 `6` per `2026-05-21`, quality-cascade `5` per `2026-05-19`; nessun invio.
- Social: `test:social:short` Destination Cocoa verde; `test:social-public` verde. Instagram e Facebook sono proof pubblici, TikTok resta login-gated accettato dal gate.
- Pipeline snapshot: `529` righe, `270` CONTACTED, `247` FOLLOWUP_D3, `4` REPLIED, `2` QUOTE_SENT, `6` CLOSED_LOST. La queue storica generica resta rumorosa (`107` error, `13` sent), quindi gli invii devono continuare a usare le code batch-specifiche verificate.
- Prossima azione sicura: ripetere Gmail nel pannello Browser destro appena il canale Browser torna operativo, poi eventualmente escludere dai follow-up qualsiasi lead che abbia risposto.

## Correzione protocollo Browser/Gmail

- Regola consolidata nel checklist operativo e nell'automazione `cantoni-reply-check`: per Cantoni il controllo Gmail e valido solo nel pannello Browser destro, dentro Gmail, con account visibile `cantonidigitalstudio@gmail.com`.
- Se il Browser destro non e controllabile, non usare il connettore Gmail per dichiarare la posta controllata; segnare `BLOCCO_GMAIL_BROWSER` e riprovare appena il canale Browser e disponibile.

## Controllo operativo 2026-05-19 17:35 CEST

- Richiesta: eseguire il controllo operativo usando la schermata Browser destra e l'identita ufficiale Cantoni.
- Browser/Gmail: in questo turno il tool `Browser`/`browser-use` non e stato esposto; sono disponibili solo Playwright separato e Gmail connector. Per rispetto del protocollo, Gmail ufficiale non viene marcata come controllata in modo definitivo. Stato: `BLOCCO_GMAIL_BROWSER`.
- Azioni irreversibili: nessuna email inviata, nessuna pubblicazione social eseguita, nessun pagamento, nessuna modifica account.
- Follow-up verificati con `FOLLOWUP_QUEUE_FILE` corretto:
  - NG6 2026-05-21: `6/6` validi.
  - NQ6 2026-05-21: `6/6` validi.
  - NEU6 2026-05-21: `6/6` validi.
  - Quality-cascade 2026-05-19: `5/5` validi.
- Nota tecnica: un primo comando ha verificato per errore la queue storica `sales-kit/queue/followup_d3_queue.json`, che resta rumorosa e non va usata per invii. La verifica corretta e stata poi ripetuta sui file batch-specifici.
- Pipeline CSV ricontrollata con parsing CSV robusto: `529` righe, `270` CONTACTED, `247` FOLLOWUP_D3, `4` REPLIED, `2` QUOTE_SENT, `6` CLOSED_LOST. Le date vecchie in `next_action_date` confermano che la pipeline storica resta da normalizzare e non va usata per invii automatici non filtrati.
- Social:
  - `npm run test:social:daily`: verde, 30 giorni e canali `instagram`, `facebook`, `tiktok`, `youtube_shorts`.
  - `npm run test:social-public`: verde, Instagram e Facebook con proof pubblico, TikTok login-gated accettato dal gate.
  - `SOCIAL_SHORT_ENTRY=2026-05-19-2026-05-19-destination-cocoa npm run test:social:short`: verde, video 1080x1920 valido.
- Sito e pagamenti:
  - `npm test`: verde.
  - `npm run test:browser`: verde.
  - `npm run test:payments`: verde, senza transazioni reali; PayPal resta `sessionDependentMisses`, non errore.
  - `git diff --check`: verde.
- Prossima azione sicura: appena il canale Browser laterale e nuovamente esposto, aprire Gmail nel pannello destro con `cantonidigitalstudio@gmail.com`, classificare tutte le email nuove/operative, poi aggiornare eventuali esclusioni prima dei follow-up.

## Controllo Gmail Browser destro 2026-05-19 19:03 CEST

- Metodo: controllo visivo e operativo dentro Gmail nel pannello Browser destro, account Cantoni visibile, senza Gmail connector come fonte principale e senza Playwright separato.
- Query commerciale ultime 48 ore: `newer_than:2d (...) -from:cantonidigitalstudio@gmail.com -MOO -DHL`.
  - Positive commerciali: `0`.
  - Dubbie/da review: `0`.
  - Negative: `0`.
  - Automatiche/generiche: `5`.
  - Thread verificati: Le Bristol Paris, The Fullerton Hotel Singapore, Claridge's, The Connaught, The Berkeley. Tutte conferme automatiche/generiche di ricezione, nessuna risposta umana positiva chiara.
- Query operativa ultime 48 ore: `newer_than:2d (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR sicurezza OR security OR pagamento OR payment OR ordine OR consegna OR delivery) -from:cantonidigitalstudio@gmail.com`.
  - Operative urgenti: `0`.
  - Operative non urgenti / gia gestite: `4`.
  - Google: avviso sicurezza relativo a `mrcollinstravel@gmail.com`, inviato a Cantoni come email di recupero. Da riconoscere come accesso noto; se non riconosciuto, controllare sicurezza account Mr Collins.
  - MOO: `Non abbiamo potuto consegnare il tuo ordine MOO`, collegata al passaggio DHL senza consegna.
  - MOO: `Il tuo ordine MOO e pronto per il ritiro`, pacco disponibile al punto di ritiro per `7` giorni di calendario.
  - DHL: `DHL On Demand Delivery`, tracking `1076120415`, consegna prevista nella giornata del 18 maggio; coerente con il successivo avviso MOO di ritiro.
  - Stato operativo: l'utente ha trovato l'avviso fisico DHL e ha scelto di ritirare il pacco; nessuna email da inviare ora.
- Query piattaforme ultime 7 giornate: `newer_than:7d (Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR sicurezza OR security OR pagamento OR payment) -from:cantonidigitalstudio@gmail.com`.
  - Risultati: `12`.
  - Instagram: `New login to Instagram from Chrome on Mac OS X`, account `cantonidigitalstudio`, posizione San Benedetto del Tronto. Da classificare come accesso operativo se riconosciuto.
  - Facebook: `Aggiornamento per te: 1 nuova notifica`, notifica generica per `Cantoni DigitalStudio`; non urgente.
  - Google: avviso di sicurezza `Nuovo accesso sul dispositivo Mac` per `cantonidigitalstudio@gmail.com`; non urgente se riconosciuto come login operativo di questi giorni.
  - Non emersi in questa ricerca: problemi recenti Stripe, PayPal, GitHub, Cloudflare o Netlify.
- Azioni effettuate: sola lettura e classificazione. Nessuna email inviata, nessuna pubblicazione social, nessun pagamento, nessuna modifica account, nessuna archiviazione/eliminazione intenzionale.
