# Cantoni Digital Studio - Client Acquisition Readiness

## Obiettivo

Partire con proposte internazionali solo quando il brand pubblico è coerente, i canali social sono verificati e ogni contatto nasce da audit reale del cliente.

## Stato al 2026-05-14

- Sito preview Cloudflare: pronto per verifica commerciale e preventivo.
- Instagram: handle ufficiale `@cantonidigitalstudio`; QA del 2026-05-14 mostra profilo, bio, contenuti, link cliccabile `cantonidigitalstudio.com` e avatar ufficiale centrato. Il vecchio `zumu.be/ecantoni` non compare più nel profilo. Evidenze: `/tmp/instagram-cantoni-avatar-persistent-final.png` e `/tmp/instagram-cantoni-public-final-clean.png`.
- Facebook: Pagina Cantoni Digital Studio creata/recuperata e brandizzata con cover, avatar, sito, email, telefono, Instagram e TikTok. QA logged-out del 2026-05-13 passata: la pagina è utilizzabile come prova pubblica.
- TikTok: account `@cantonidigitalstudio` creato e brandizzato con logo, nome e bio. QA logged-out rifatta il 2026-05-14: TikTok rimanda ancora a login obbligatorio, quindi non usarlo come prova autonoma.
- iPad fallback: collegamento wireless verificato il 2026-05-13 (`transportType: localNetwork`, `idevice_id -n` vede l'iPad, display inspection attiva). Instagram ora risulta installato sull'iPad. Il runner WebDriverAgent è stato firmato e installato, ma iOS richiede ancora il trust manuale del certificato sviluppatore in `Impostazioni > Generali > VPN e gestione dispositivo` prima di permettere il controllo automatico completo.
- Asset social: prima batch da 5 post generata in `sales-kit/social-launch/output/`, più cover Facebook e avatar Instagram centrato.
- Email operativa: usare solo `cantonidigitalstudio@gmail.com`.

## Gate prima di mandare proposte mondiali

1. Verificare il sito live/preview con `npm run test:full`.
2. Verificare asset e copy social con `npm run test:social`.
3. Pubblicare almeno 3 contenuti credibili su Instagram, dopo review finale di asset e caption.
4. Usare Facebook come prova pubblica; non usare TikTok come prova autonoma finché non passa QA pubblica senza login.
5. Aggiungere TikTok al sito solo dopo QA pubblica senza login.
6. Creare lista lead pulita: nessun lead già contattato, dominio reale verificato.
7. Fare audit live del sito cliente prima di qualunque email.
8. Mandare prima email senza prezzi e senza preventivo completo.
9. Preparare preventivo solo se il lead risponde o è top tier.
10. Tracciare ogni lead in `sales-kit/lead_pipeline.csv`.

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
