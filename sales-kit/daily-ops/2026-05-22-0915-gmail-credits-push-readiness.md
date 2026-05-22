# 2026-05-22 09:15 - Gmail, crediti e push readiness

## Gmail Cantoni

Controllo eseguito nel Browser laterale visibile su Gmail con account attivo
`cantonidigitalstudio@gmail.com`.

Query commerciale ultimi 3 giorni:

```text
newer_than:3d (interessato OR interessata OR interested OR interesado OR intéressé OR interesse OR proposal OR preventivo OR quote OR progetto OR website OR sito OR e-commerce OR app OR OK OR roadmap OR reply OR risposta) -from:cantonidigitalstudio@gmail.com -MOO -DHL
```

Esito:

- positiva commerciale: 0
- dubbia / da review: 0 chiare
- negativa: 0
- automatica / generica: Google security, TikTok code, TikTok login

Query operativa ultimi 7 giorni:

```text
newer_than:7d (MOO OR DHL OR Stripe OR PayPal OR GitHub OR Cloudflare OR Netlify OR Instagram OR Facebook OR TikTok OR Google OR sicurezza OR security OR pagamento OR payment OR ordine OR consegna OR delivery OR account OR accesso) -from:cantonidigitalstudio@gmail.com
```

Esito operativo:

- operativa urgente: nessun blocco nuovo emerso dalla lista visibile
- operativa non urgente:
  - Google security / nuovi accessi: coerenti con lavoro operativo recente, da tenere monitorati
  - TikTok code / new device login: coerente con login operativo recente
  - Facebook login / notifica: coerente con setup operativo recente
  - Cloudflare threats report: da rivedere in dashboard sicurezza, non blocca push
  - MOO / DHL: ordine biglietti consegnato, problema DHL precedente risolto
- automatica / generica:
  - risposte hotel luxury / reservations: ricevute automatiche, nessun interesse umano chiaro

## Crediti / deploy

Correzione severa: la lettura Netlify sotto non e una verifica valida per
Cantoni Digital Studio, perche il team/account visto nel Browser non e stato
provato come canale Cantoni. Va quindi trattata solo come segnale di rischio su
un account Netlify visibile, non come stato crediti Cantoni.

Cloudflare:

- `wrangler whoami` funziona.
- Account associato: `cantonidigitalstudio@gmail.com`.
- Permesso `pages:write` presente.
- Progetto Pages `cantonidigitalstudio` visibile da CLI.
- Dashboard web richiede login, ma la CLI e sufficiente per deploy Pages se i gate sono verdi.

Netlify:

- CLI: token non valido / sessione scaduta.
- Dashboard Browser: team `netlify-xhu2bwa` visibile, ma non verificato come team Cantoni.
- Il banner crediti `over 75% of your credit allowance this month` non va attribuito a Cantoni finche il team/progetto corretto non e provato.
- Stato corretto: Netlify non controllato per Cantoni. Non usare Netlify per deploy Cantoni ora. Prima serve verificare account, team, progetto e crediti giusti.

## Git / push

- Branch corrente: `codex/cantoni-production-grade-preview`.
- Upstream: `cantoni/codex/cantoni-production-grade-preview`.
- `git ls-remote --heads cantoni` funziona.
- Remote corretto per Cantoni: `cantoni`.
- Remote `origin` punta a Excellentia e non va usato per push Cantoni.

## Stato blocco

Il push GitHub e tecnicamente possibile, ma non va fatto ancora con `git add .`.
Il worktree ha molte modifiche e file nuovi, quindi serve staging con allowlist.

Sequenza corretta:

1. selezionare file Cantoni da committare;
2. lasciare fuori artefatti non necessari o troppo pesanti;
3. verificare `git diff --cached`;
4. rilanciare gate essenziali;
5. commit ordinato;
6. push solo su remote `cantoni`;
7. deploy Cloudflare solo dopo conferma esplicita.
