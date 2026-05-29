# Cantoni Digital Studio - Daily ops 2026-05-28 08:41 CEST

## Identita e superficie usata

- Account ufficiale richiesto: `cantonidigitalstudio@gmail.com`.
- Regola operativa confermata: Gmail/social reali sono validi solo nel Browser destro con account visibile e verificato.
- Nessuna email inviata.
- Nessun post pubblicato.
- Nessun pagamento eseguito.
- Nessun deploy eseguito.

## Gmail Cantoni

Stato: **non verificato in modo valido in questa passata**.

Motivo:

- il controllo Gmail deve essere fatto nel Browser destro vedendo chiaramente account e pagina;
- il tentativo di controllo via Browser tool si e bloccato/timeout;
- una verifica precedente recente aveva mostrato il rischio concreto di account non Cantoni nel pannello;
- quindi non classifico la posta come controllata e non preparo invii operativi basati su questa passata.

Classificazione ufficiale per oggi:

- positiva commerciale: non classificata.
- dubbia/da review: non classificata.
- negativa: non classificata.
- automatica/generica: non classificata.
- operativa urgente: non classificata.
- operativa non urgente: non classificata.

Prossimo passo obbligatorio:

1. aprire Gmail nel Browser destro;
2. verificare account attivo `cantonidigitalstudio@gmail.com`;
3. controllare inbox, commerciale e operativo;
4. solo dopo aggiornare questa sezione con classificazione reale.

## Social 2026-05-28 - Pagamenti e login vanno progettati

Pack rivisto:

- directory: `sales-kit/social-launch/daily-publish-pack/2026-05-28-2026-05-28-payments-login/`
- immagine principale: `2026-05-28-2026-05-28-payments-login.png`
- review locale: `review.html`
- canali preparati: Instagram, Facebook, TikTok, YouTube Shorts.

Correzione copy:

- resa meno tecnica e piu comprensibile per un cliente non tecnico;
- focus su acquisto, accesso, area riservata, post-pagamento e assistenza;
- nessun prezzo pubblico;
- nessuna promessa assoluta.

Stato:

- pronto per review/pubblicazione solo dopo approvazione esplicita canale-per-canale;
- non pubblicato.

## Verifiche eseguite

```text
npm run test:social:daily
npm run test:social-public
git diff --check
```

Esito:

- `npm run test:social:daily`: verde.
- `npm run test:social-public`: verde.
- `git diff --check`: verde.

Nota tecnica:

- resi piu robusti gli screenshot dei renderer social con animazioni disabilitate, timeout piu alto e `--disable-gpu`, per evitare timeout non legati al contenuto.

## Repo e delivery

Stato worktree: sporco, con piu gruppi logici mischiati:

- sito Cantoni e contenuti pubblici;
- sistema social e pack giornalieri;
- rimozione/archiviazione Destination Cocoa, che non e un progetto Cantoni;
- asset e riferimenti Mr Collins usati come portfolio/proof, da non confondere con il lavoro operativo del progetto Mr Collins;
- script di verifica/browser/payment;
- nuovi file di policy/imprint e archive.

Regola applicata:

- non committare con `git add .`;
- prima serve staging per gruppi e review dei file pubblici/sicuri;
- niente deploy finche il pacchetto non e coerente e approvato.

## Prossime azioni

1. Rifare Gmail nel Browser destro con account Cantoni visibile.
2. Separare il worktree in gruppi committabili: Cantoni pubblico, social system, archive/no-Destination-Cocoa, documentazione.
3. Tenere fuori dati lead privati e file non pubblici.
4. Rilanciare i gate dopo ogni gruppo sostanziale.
5. Preparare commit ordinato e push solo su remote Cantoni dopo review.
