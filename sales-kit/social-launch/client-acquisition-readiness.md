# Cantoni Digital Studio - Client Acquisition Readiness

## Obiettivo

Partire con proposte internazionali solo quando il brand pubblico è coerente, i canali social sono verificati e ogni contatto nasce da audit reale del cliente.

## Stato al 2026-05-13

- Sito preview Cloudflare: pronto per verifica commerciale e preventivo.
- Instagram: handle ufficiale `@cantonidigitalstudio`; Browser QA del 2026-05-13 mostra profilo, bio e contenuti. Il link cliccabile è ancora `zumu.be/ecantoni` e va corretto da app mobile in `https://cantonidigitalstudio.com`.
- Facebook: Pagina Cantoni Digital Studio creata/recuperata e brandizzata con cover, avatar, sito, email, telefono, Instagram e TikTok. QA logged-out del 2026-05-13 passata: la pagina è utilizzabile come prova pubblica.
- TikTok: account `@cantonidigitalstudio` creato e brandizzato con logo, nome e bio. Resta da rifare QA logged-out, perché il profilo rimanda ancora a login obbligatorio.
- iPad fallback: collegamento wireless verificato il 2026-05-13 (`transportType: localNetwork`, `idevice_id -n` vede l'iPad, display inspection attiva). Instagram non risulta installato su quell'iPad, quindi il fix del link Instagram richiede installazione app o uso dell'iPhone già autenticato.
- Asset social: prima batch da 5 post generata in `sales-kit/social-launch/output/`.
- Email operativa: usare solo `cantonidigitalstudio@gmail.com`.

## Gate prima di mandare proposte mondiali

1. Verificare il sito live/preview con `npm run test:full`.
2. Verificare asset e copy social con `npm run test:social`.
3. Pubblicare almeno 3 contenuti credibili su Instagram, dopo review finale di asset e caption.
4. Usare Facebook come prova pubblica; non usare TikTok come prova autonoma finché non passa QA pubblica senza login.
5. Correggere il link Instagram da app mobile prima di usare Instagram come prova principale; l'iPad wireless è pronto, ma va installata Instagram o va usato l'iPhone già autenticato.
6. Aggiungere TikTok al sito solo dopo QA pubblica senza login.
7. Creare lista lead pulita: nessun lead già contattato, dominio reale verificato.
8. Fare audit live del sito cliente prima di qualunque email.
9. Mandare prima email senza prezzi e senza preventivo completo.
10. Preparare preventivo solo se il lead risponde o è top tier.
11. Tracciare ogni lead in `sales-kit/lead_pipeline.csv`.

## Primo batch contenuti

1. Excellentia VIP: portfolio pubblico e booking luxury.
2. Destination Cocoa / Mr Collins: booking turistico e flow operativo.
3. EC8 Platform: reference su posizionamento e architettura digitale.
4. Metodo preventivi: audit reale prima del prezzo.
5. Servizi completi: siti, e-commerce, web app, app, pagamenti, login, dashboard, AI e crescita continuativa.

## Primo batch outreach

- Dimensione iniziale: 20 lead, non 100.
- Mercato: Italia + un secondo mercato a scelta, separati per lingua.
- Qualità minima: sito live, email verificata, paese, lingua, valuta, 3 problemi osservabili.
- Output: email breve e personale, non proposta completa.
- KPI da leggere dopo 72 ore: aperture, risposte, richieste call, errori di delivery.

## Regole non negoziabili

- Non pubblicare canali social non verificati.
- Non inviare da account Gmail diverso da `cantonidigitalstudio@gmail.com`.
- Non promettere "migliori al mondo" nel copy pubblico.
- Non mandare prezzi se non esiste scope scritto.
- Non usare automazioni massive senza review manuale.
