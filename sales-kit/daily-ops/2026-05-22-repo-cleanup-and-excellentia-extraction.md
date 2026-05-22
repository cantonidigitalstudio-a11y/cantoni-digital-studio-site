# Cantoni repo cleanup and Excellentia extraction - 2026-05-22

## Obiettivo

Separare il repo Cantoni Digital Studio dal runtime Excellentia VIP senza perdere
materiale utile e senza lasciare riferimenti rotti nel sito pubblico Cantoni.

## Stato verificato

- Worktree Cantoni prima della selezione: 232 righe di `git status`.
- Rimozioni Excellentia/VIP dentro Cantoni: 66 file.
- File Excellentia gia presenti nello stesso percorso in `../excellentia-vip-site`: 54.
- File Excellentia recuperati in archivio migrazione Excellentia: 12.
- Archivio migrazione Excellentia:
  `../excellentia-vip-site/docs/migration/cantoni-extraction-2026-05-22/`.
- Matrice decisionale Excellentia:
  `../excellentia-vip-site/docs/migration/cantoni-extraction-2026-05-22/DECISION_MATRIX.md`.

## Decisione

Le rimozioni Excellentia da `cantoni_site` sono corrette come separazione di
ownership: il runtime Excellentia vive in `../excellentia-vip-site`, mentre
Cantoni deve mantenere solo riferimenti portfolio verificabili e asset portfolio
minimi sotto `assets/portfolio/excellentia-vip/`.

Non vanno ripristinate nel repo Cantoni:

- pagine runtime `excellentia-vip*.html`;
- JavaScript runtime `excellentia-vip*.js`;
- CSS runtime Excellentia;
- vecchi script QA `verify_vip_*`;
- server library Excellentia;
- asset Excellentia originali sotto `assets/excellentia-vip/`.

Cantoni puo invece mantenere:

- prove portfolio Excellentia sotto `assets/portfolio/excellentia-vip/`;
- contenuti social/outreach che citano Excellentia come cliente/progetto;
- link esterni al sito Excellentia quando verificati.

## Correzioni fatte in Cantoni

- Aggiornati riferimenti storyboard social da `assets/excellentia-vip/...` a
  `assets/portfolio/excellentia-vip/...`.
- Verificato che non restino riferimenti runtime locali `excellentia-vip.html`,
  `excellentia-vip.js` o `excellentia-vip.css` nelle pagine pubbliche Cantoni.

## Gate eseguiti

- `git diff --check`: passato.
- `npm test`: passato.
- `npm run test:social:carousel`: passato.

## Prossimo gate

Prima di commit/deploy:

1. `npm run build:cloudflare`
2. `npm run test:artifact`
3. `npm run test:browser`
4. `npm run test:payments`
5. `npm run test:vip`
6. `git diff --check`

Non fare deploy produzione finche il pacchetto non e coerente e confermato.
