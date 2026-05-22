# Cantoni Daily Ops - 2026-05-18

## Outreach status

- 18 nuovi lead pronti a livello automatico, non inviati.
- Batch pronti: `NG6`, `NQ6`, `NEU6`.
- 50 follow-up D3 pronti per `2026-05-18`, non inviati.
- Corretto `LD-NEU6-0002`: ora e `UMA House by Yurbban Trafalgar`, con URL corrente `https://uma.yurbban.com/uma-house/barcelona` ed email ufficiale `trafalgar@umahouse.com`.
- Sostituito `LD-NG6-0002`: `Miami Vice Charters` rimosso per dominio non raggiungibile; nuovo lead `Luxury Yacht Charters Miami`, verificato live.

## Verifiche completate

- `verify_global_outreach_batch` ok sui 3 batch da 6.
- `verify_outreach_queue_quality` ok sui 3 batch da 6.
- `verify_outreach_branding` ok sui 3 batch da 6.
- `verify_proposal_personalization` ok sui 3 batch da 6.
- Dry-run invio ok: 18/18 nuovi lead, tutti `dry_run`.
- `npm run test:global-followup-d3` ok: 50 follow-up validi.
- Dry-run follow-up ok: 50/50, tutti `dry_run`.
- Worker dry-run corretto: non richiede piu il segreto Apps Script quando `OUTREACH_SEND_ENABLED=false`; il segreto resta obbligatorio solo per invio reale.
- `git diff --check` ok.
- Guard anti-invio reale ok: senza `OUTREACH_APPROVAL_TOKEN=APPROVED_REAL_SEND`, il worker blocca l'invio con exit code `2`.
- Controllo visuale cliente-per-cliente nella schermata destra completato: 18/18 lead nuovi verificati o corretti prima dell'invio.
- Browser plugin: operativo su sito pubblico, review outreach, daily social pack e Gmail Cantoni. Se Gmail standard resta sul loader, aprire Gmail in modalita base nel pannello destro e verificare il titolo `Posta in arrivo - cantonidigitalstudio@gmail.com`.
- Controllo Gmail nel pannello destro completato: ricerca lead/reply ultimi 30 giorni aperta con account `cantonidigitalstudio@gmail.com`; trovate 8 conversazioni, classificate come automatiche/generiche o non-positive. Nessuna risposta commerciale positiva chiara rilevata.
- Corretto `sales-kit/scripts/generate_pipeline_status_report.mjs`: ora accetta `LEAD_PIPELINE_CSV`, `OUTREACH_QUEUE_FILE`, `FOLLOWUP_QUEUE_FILE` e `WORKER_STATE_FILE`, cosi non mescola code vecchie di marzo con il batch corrente.
- Stato batch `2026-05-15-global-50` verificato con file espliciti: 50 lead `CONTACTED`, 50 follow-up D3 `pending`, prossima azione `2026-05-18`.
- Copy social rivisto per chiarezza non tecnica: ridotti termini ambigui come `booking`, `scope`, `proof` nelle pagine di review e nei testi pubblicabili.
- Gate ricontrollati dopo le modifiche: `npm test`, `npm run test:payments`, `npm run test:browser`, `npm run test:outreach-readiness`, `npm run test:social`, `npm run build:cloudflare`, `npm run test:artifact`, `npm run test:browser:artifact`, `npm run test:payments:artifact` tutti verdi.
- Pagamenti artifact verificati senza transazioni reali: 2 Payment Link Stripe pubblici, merchant `Cantoni Digital Studio`, carta/Klarna/Bancontact/MB Way rilevati; PayPal resta classificato come metodo dipendente dalla sessione del checkout, quindi non blocca il gate automatico.

## Blocco reale

Nessun blocco tecnico sui 18 nuovi lead: gate automatici, dry-run e controllo visuale sono verdi.

Blocco residuo: nessun blocco sulla visualizzazione Gmail Cantoni nel pannello destro. Il connettore Gmail disponibile nella sessione non e affidabile per Cantoni perche puo mostrare messaggi non Cantoni; va usato solo dopo conferma esplicita dell'identita corretta.

Nota operativa: lo stato storico della pipeline principale contiene ancora code vecchie con errori di invio di marzo. Per i batch correnti usare sempre file espliciti nel comando di stato, non la coda predefinita `sales-kit/queue/followup_d3_queue.json`.

## Prossima azione

1. Chiedere approvazione esplicita se si vuole inviare un batch.
2. Non inviare email senza frase di approvazione dedicata.
3. Preparare il prossimo batch solo dopo aver deciso se inviare, migliorare ulteriormente o fare un ultimo review umano.
4. Mantenere il controllo risposte Gmail e follow-up D3 in coda giornaliera.
5. Prima di pubblicare contenuti social, rivedere manualmente asset/caption/script nella pagina `Revisione contenuti social` e chiedere approvazione esplicita del singolo post o del giorno.

## Heartbeat 10:18 Europe/Rome

- Gmail Cantoni controllata nel pannello destro con ricerca ultimi 2 giorni su parole chiave commerciali: nessun messaggio corrispondente ai criteri di ricerca.
- Pipeline `2026-05-15-global-50` controllata con file espliciti: 50 lead `CONTACTED`, 50 follow-up D3 `pending`, prossima data follow-up `2026-05-18`.
- `npm run test:global-followup-d3` ok: 50 follow-up validi, `public_amounts=0`, `reply_to_mismatch=0`.
- `npm run test:social:daily` ok: 30 giorni, canali Instagram/Facebook/TikTok/YouTube Shorts, zero failure.
- `git diff --check` ok.
- Nessuna email inviata, nessun post pubblicato, nessun pagamento o deploy eseguito.

## Correzione inbox 10:30 Europe/Rome

- Errore operativo rilevato: il check precedente era troppo stretto e ha escluso email operative non commerciali.
- Email importante trovata nel pannello destro: MOO, oggetto `Non abbiamo potuto consegnare il tuo ordine MOO`, ricevuta il 18/05/2026 alle 10:04.
- Stato tracking MOO/DHL: ordine MOO `112144296`, DHL `1076120415`, tentativo fallito il 18/05/2026 alle 09:44 a San Benedetto del Tronto con motivazione `nessuna risposta all'indirizzo`.
- Prossimo passo DHL indicato: nuovo tentativo il giorno lavorativo successivo; per dettagli o preferenze consegna DHL richiede validazione con CAP/telefono/email.
- Dopo conferma esplicita dell'utente e stato inserito il CAP `63074` su DHL per la spedizione `1076120415`.
- La validazione CAP DHL ha sbloccato solo la citta di origine completa: `DAGENHAM, DOCKLANDS - UK`.
- Portale DHL On Demand Delivery aperto su Italia e waybill `1076120415`; blocco attuale: CAPTCHA DHL prima della gestione come ospite.
- Processo corretto: il daily check deve includere anche ricerca operativa urgente su MOO, DHL, ordini, consegne, Stripe, PayPal, GitHub, Cloudflare, Netlify, social/account security e problemi tecnici.

## Aggiornamento DHL 10:57 Europe/Rome

- L'utente ha trovato l'avviso cartaceo DHL nella buca lettere: il corriere e effettivamente passato.
- Decisione operativa: nessuna modifica di consegna dal portale DHL; l'utente ritirera il pacco di persona.
- Stato: ordine MOO `112144296` / tracking DHL `1076120415` risolto lato azione immediata, resta da confermare solo il ritiro fisico.
- Nota per i prossimi controlli: non trattare piu questa email come contestazione urgente, ma come promemoria operativo finche il ritiro non e confermato.

## Passata operativa 11:02 Europe/Rome

- Contesto commerciale: nessuna risposta positiva chiara va dedotta alle 11:02 di lunedi, soprattutto con Stati Uniti e Caraibi ancora a inizio giornata o prima dell'orario lavorativo.
- `npm run test:global-followup-d3` rilanciato: 50 follow-up D3 validi, `public_amounts=0`, `reply_to_mismatch=0`, 0 failure.
- Corretto testo della review follow-up: ora dice `Follow-up D3 pronti per oggi. Invio solo dopo Gmail e approvazione.`, evitando la vecchia formula fuorviante `non da inviare oggi`.
- Gmail Cantoni ricontrollata nel pannello destro con query larga commerciale + operativa ultime 24 ore: trovate le email MOO/DHL gia gestite; nessuna risposta commerciale positiva chiara rilevata.
- `npm run test:social:daily` rilanciato: 30 giorni di contenuti per Instagram/Facebook/TikTok/YouTube Shorts, 0 failure.
- Review social aperta nel pannello destro: post del giorno `Excellentia VIP: sito premium e prenotazioni`, senza prezzi pubblici e senza promesse assolute.
- Nessuna email inviata e nessun post pubblicato: invii e pubblicazioni restano subordinati ad approvazione esplicita.

## Correzione visual social 11:20 Europe/Rome

- Feedback utente recepito: il badge `prova live`/proof non doveva sovrapporsi al titolo e il post Excellentia VIP doveva usare un riferimento visivo Excellentia leggibile, non un contenuto generico.
- Corretto `sales-kit/scripts/render_social_launch_assets.mjs`: rimosso il badge flottante sopra il titolo, aggiunta fascia proof ordinata, usato logo Excellentia VIP su fondo scuro e differenziato layout tra logo cliente reale e iniziali fallback.
- Puliti i testi social: sostituito il linguaggio `reference` con `riferimento pubblico` / `riferimento verificabile`, piu comprensibile per clienti non tecnici.
- Rigenerato il daily social pack: post Excellentia VIP e Destination Cocoa ricontrollati nella schermata destra; nessuna sovrapposizione visibile nel titolo o nella prova pubblica.
- `npm run test:social:daily` ok dopo la correzione: 30 giorni, canali Instagram/Facebook/TikTok/YouTube Shorts, 0 failure.
- Nessun contenuto pubblicato: pubblicazione su Instagram/Facebook/TikTok/YouTube Shorts richiede ancora approvazione esplicita.

## Passata operativa 14:29 Europe/Rome

- Rilanciato `npm run test:social:daily`: daily social pack valido per 30 giorni, canali Instagram/Facebook/TikTok/YouTube Shorts, 0 failure.
- Rilanciato `npm run test:global-followup-d3`: 50 follow-up D3 validi per `2026-05-18`, `public_amounts=0`, `reply_to_mismatch=0`, 0 failure.
- Rilanciato `git diff --check`: nessun errore whitespace rilevato.
- Gmail Cantoni controllata nel pannello destro con query operativa ultime 24 ore: trovate 3 email MOO/DHL, inclusa `Il tuo ordine MOO e pronto per il ritiro` delle 13:20.
- Gmail Cantoni controllata nel pannello destro con query commerciale ultimi 2 giorni escludendo MOO/DHL: nessun messaggio corrispondente ai criteri commerciali, quindi nessuna risposta positiva chiara rilevata.
- `npm run test:outreach-readiness` inizialmente rosso per un controllo obsoleto che cercava ancora la formula `Reference verificabile` in `posts.json`.
- Corretto `scripts/verify_cascade_readiness.cjs` per accettare il nuovo linguaggio pubblico `Riferimento verificabile`; rilanciato `npm run test:outreach-readiness`, ora verde.
- Stato operativo: prossimo blocco utile e scegliere tra pubblicazione social del post Excellentia VIP corretto, invio dei 50 follow-up D3, oppure invio dei 18 nuovi lead. Tutte e tre le azioni richiedono approvazione esplicita prima dell'effetto pubblico/reale.

## Azioni approvate ed eseguite 14:50 Europe/Rome

- Approvazione esplicita ricevuta: pubblicazione social Excellentia VIP, invio 50 follow-up D3, invio 18 nuovi lead.
- Follow-up D3 `2026-05-15-global-50`: invio reale completato via worker approvato, `50/50` elementi in `sales-kit/lead-batches/2026-05-15-global-50/followup_d3_queue.json` con `status: sent`.
- Nuovi lead `NG6`: invio reale completato, `6/6` elementi in `sales-kit/lead-batches/2026-05-17-next-global-6/branded/outreach_queue_branded.json` con `status: sent`.
- Nuovi lead `NQ6`: invio reale completato, `6/6` elementi in `sales-kit/lead-batches/2026-05-17-next-quality-6/branded/outreach_queue_branded.json` con `status: sent`.
- Nuovi lead `NEU6`: invio reale completato, `6/6` elementi in `sales-kit/lead-batches/2026-05-17-next-europe-quality-6/branded/outreach_queue_branded.json` con `status: sent`.
- Totale invii reali della passata: `68/68` completati.
- Instagram Cantoni aperto nel Browser laterale con account autenticato `@cantonidigitalstudio`; modale `Crea nuovo post` raggiunto dal pulsante `Nuovo post` -> `Post`.
- Pubblicazione social Excellentia VIP non completata: il Browser laterale mostra il pulsante `Seleziona dal computer`, ma non espone una capability di upload file e i tentativi con clipboard immagine e selettore file nativo non hanno caricato l'asset. Non dichiarare il post come pubblicato finche non appare una conferma pubblica su Instagram/Facebook/TikTok.
- Asset approvato ancora pronto: `sales-kit/social-launch/daily-publish-pack/2026-05-18-2026-05-18-excellentia-vip/2026-05-18-2026-05-18-excellentia-vip.png`.
- Caption approvata ancora pronta: `sales-kit/social-launch/daily-publish-pack/2026-05-18-2026-05-18-excellentia-vip/instagram.caption.txt`.

## Tentativo social aggiuntivo 15:03 Europe/Rome

- Instagram: riprovato upload nel Browser laterale con tre metodi non distruttivi: click sul pulsante `Seleziona dal computer`, incolla immagine dal clipboard del Browser e incolla file PNG dal clipboard macOS. Nessun metodo ha caricato l'anteprima nel modale `Crea nuovo post`.
- Facebook: aperta pagina pubblica `Cantoni Digital Studio | Facebook` nel Browser laterale; pagina e dati pubblici visibili, ma sessione Facebook non autenticata e UI ferma su login/QR. Non pubblicare finche non e confermato l'accesso operativo alla Pagina, per evitare post da identita sbagliata.
- Stato social reale: contenuto Excellentia VIP approvato e pronto, ma non pubblicato su canali pubblici.

## Gmail post-invio 15:16 Europe/Rome

- Gmail Cantoni aperta nel Browser laterale con account `cantonidigitalstudio@gmail.com`.
- Query usata: `newer_than:1d` con parole chiave commerciali e operative, escludendo MOO/DHL e messaggi inviati da Cantoni.
- Conversazioni trovate: `5`.
- Classificazione:
  - Le Bristol Paris: risposta automatica di ricezione, richiesta presa in carico; nessuna risposta commerciale positiva o negativa.
  - The Fullerton Hotel Singapore: risposta automatica, ufficio prenotazioni chiuso; nessuna risposta commerciale positiva o negativa.
  - Claridge's: risposta automatica di ricezione; nessuna risposta commerciale positiva o negativa.
  - The Connaught: risposta automatica di ricezione; nessuna risposta commerciale positiva o negativa.
  - The Berkeley: risposta automatica di ricezione; nessuna risposta commerciale positiva o negativa.
- Azione: nessuna risposta manuale da inviare ora; mantenere questi thread come automatiche/generiche e ricontrollare nelle prossime finestre orarie.

## Stato pipeline post-invio 15:24 Europe/Rome

- Verifica diretta code: `D3 50/50 sent`, `NG6 6/6 sent`, `NQ6 6/6 sent`, `NEU6 6/6 sent`; tutti gli elementi hanno `processed_at`.
- Batch nuovi `NG6`, `NQ6`, `NEU6`: CSV aggiornati a `CONTACTED`; prossima azione prevista `2026-05-21`.
- Batch `2026-05-15-global-50`: la coda follow-up D3 e tutta `sent`; per i prossimi step usare la queue come fonte di verita, non rilanciare `test:global-followup-d3` perche rigenererebbe lo stato del 18/05.
- Nota: `generate_pipeline_status_report` sui batch nuovi continua a leggere la vecchia default followup queue se non si passa un `FOLLOWUP_QUEUE_FILE` dedicato; non usare quel dato storico per decisioni operative.
- `npm run test:social:daily` verde dopo rigenerazione asset: 30 giorni, Instagram/Facebook/TikTok/YouTube Shorts, 0 failure.
- `git diff --check` verde.

## Stato dispositivi per fallback social 15:28 Europe/Rome

- Samsung Galaxy Note 9: `adb devices` non mostra device collegati; `scripts/samsung_wireless_reconnect.sh 192.168.1.221` fallisce con `network=unreachable`. Non utilizzabile ora per pubblicazione social.
- iPad, iPhone 14 Pro e iPhone 11 Pro: visibili come `available (paired)` tramite CoreDevice; questo conferma pairing/rete, ma non fornisce in questa sessione un canale UI affidabile per selezionare file e pubblicare post dentro Instagram/Facebook/TikTok.
- Stato fallback: Browser laterale e dispositivi non hanno completato l'upload social. Tenere aperto il blocco social come operativo, non come completato.

## Pubblicazione diretta social 15:42 Europe/Rome

- Chiarimento operativo: il canale non e un sistema astratto; per questo blocco si usa pubblicazione diretta su Instagram/Facebook, con identita Cantoni Digital Studio.
- Instagram diretto: sessione `@cantonidigitalstudio` autenticata e modale `Crea nuovo post` raggiunto. Verificati `3` input file nascosti; quello corretto accetta `image/png`.
- Blocco Instagram: il Browser laterale espone DOM e click, ma non una capability `setInputFiles`; l'ambiente di pagina e read-only e non consente di creare `File/DataTransfer` o assegnare il PNG al file input. Click reale, click DOM, clipboard immagine e clipboard file non hanno caricato l'anteprima.
- Facebook diretto: pagina `Cantoni Digital Studio | Facebook` aperta e verificata, ma la sessione e pubblica/logged-out con UI di login. Non pubblicare da Facebook finche non e confermato accesso come gestore Pagina.
- Stato reale: contenuto Excellentia VIP ancora pronto e approvato, ma non pubblicato. Per completare senza rischi serve uno tra: selezione manuale del PNG nel modale Instagram gia aperto, login Facebook Page nel pannello destro, oppure una capability Browser che permetta upload file sul file input.
- Stato pannello destro: riportato su Instagram diretto `@cantonidigitalstudio`, menu `Nuovo post` -> `Post`, modale `Crea nuovo post` aperto davanti al pulsante `Seleziona dal computer`.
- Tentativo extra upload: verificato che il locator `input[type=file]` ha `3` elementi ma non espone `setInputFiles`; il click forzato sul pulsante e l'invio da tastiera non aprono un file picker controllabile. Preparata copia corta dell'asset in `/tmp/cantoni-instagram-upload/excellentia-vip.png` per selezione manuale rapida.

## Pubblicazione Instagram completata 18:41 Europe/Rome

- Risolto il blocco upload usando il pannello destro Instagram con selettore file nativo macOS: asset caricato da `/tmp/cantoni-instagram-upload/excellentia-vip.png`.
- Caption Instagram inserita dal file approvato `sales-kit/social-launch/daily-publish-pack/2026-05-18-2026-05-18-excellentia-vip/instagram.caption.txt`.
- Post pubblicato su `@cantonidigitalstudio` e verificato sul profilo: il conteggio e passato a `4 post`.
- URL verificato del post: `https://www.instagram.com/cantonidigitalstudio/p/DYfKx3lDaUc/`.
- Evidenza visuale verificata: immagine Excellentia VIP corretta, caption presente, link pubblico `excellentiavip.com` e hashtag Cantoni visibili.
- Facebook verificato nel pannello destro dopo la pubblicazione Instagram: pagina `Cantoni Digital Studio | Facebook` raggiungibile, ma sessione `logged-out` con richiesta login/QR. Non pubblicato per evitare identita sbagliata o assenza ruolo gestore Pagina.
- TikTok verificato nel pannello destro: profilo richiede login; il pulsante `Continue with Google` resta fermo nella login view e non apre un flusso autenticabile in questa sessione. Non pubblicato.
- Stato social finale del blocco: Instagram completato; Facebook/TikTok/YouTube Shorts restano da chiudere solo dopo login verificato e, per video, asset video finale rivisto.

## Recheck social post-pubblicazione 18:59 Europe/Rome

- Browser laterale ri-verificato su TikTok: pagina ferma su login; `Continue with Google` non apre un OAuth utilizzabile in questa sessione.
- Browser laterale ri-verificato su Facebook: pagina `Cantoni Digital Studio | Facebook` corretta e visibile, ma sessione logged-out; nessun composer disponibile.
- Decisione operativa: non pubblicare su Facebook/TikTok da sessioni non verificate e non segnare quei canali come completati. Instagram resta completato e verificato.

## Asset video short Excellentia VIP 20:27 Europe/Rome

- Generato asset verticale 1080x1920 per TikTok/YouTube Shorts: `sales-kit/social-launch/daily-publish-pack/2026-05-18-2026-05-18-excellentia-vip/short-video/2026-05-18-2026-05-18-excellentia-vip-short.mp4`.
- Durata tecnica: circa 15.93 secondi, senza audio parlato; pensato per review/aggiunta audio o pubblicazione con caption.
- Corretto dopo auto-review: logo leggibile sui frame blu, nessuna sovrapposizione testo/immagine, reference `excellentiavip.com` visibile.
- Gate aggiunto: `npm run test:social:short`.
- Stato: asset pronto per review finale su telefono; non ancora pubblicato su TikTok/YouTube finche login canale e review video non sono verificati.

## Gmail replies recheck 20:31 Europe/Rome

- Query nel pannello destro: `newer_than:1d` con parole chiave commerciali, esclusi messaggi Cantoni/MOO/DHL.
- Risultati visibili: Fullerton Hotel automatic reply, Le Bristol Paris thread con nostro follow-up, Claridge's automatic reply, The Connaught automatic reply, The Berkeley automatic reply.
- Classificazione: nessuna risposta umana positiva chiara; nessuna azione manuale da inviare ora.
- Decisione: mantenere ricontrollo nelle prossime finestre orarie; non forzare follow-up immediati oltre quelli gia inviati oggi.
