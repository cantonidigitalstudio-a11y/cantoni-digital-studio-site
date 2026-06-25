# Cantoni deliverability audit - 2026-06-10

## Stato

Obiettivo commerciale: aumentare outreach globale senza sembrare spam e senza bruciare la reputazione di Cantoni Digital Studio.

## Controlli DNS eseguiti

```text
dig +short TXT cantonidigitalstudio.com
dig +short TXT _dmarc.cantonidigitalstudio.com
dig +short MX cantonidigitalstudio.com
dig +short CNAME google._domainkey.cantonidigitalstudio.com
dig +short TXT google._domainkey.cantonidigitalstudio.com
```

Risultato: nessun record email evidente restituito dai comandi.

## Impatto

Finche l'outreach parte da `cantonidigitalstudio@gmail.com`, la strategia corretta resta:

- batch piccoli;
- messaggi testuali;
- nessun allegato;
- massimo due link;
- audit reale cliente-per-cliente;
- invio manuale solo da Gmail Cantoni visibile nel Browser destro;
- controllo risposte prima di ogni nuovo invio.

Una sprint da 1000 contatti non va interpretata come 1000 invii immediati. Va interpretata come 1000 lead ricercati, con solo una parte pronta per invio quando la reputazione e il controllo Gmail lo consentono.

## Per scalare davvero

Prima di aumentare volume oltre micro-batch, serve impostare una casella su dominio, per esempio `studio@cantonidigitalstudio.com` o `hello@cantonidigitalstudio.com`, con:

- MX corretti verso Google Workspace o provider scelto;
- SPF;
- DKIM;
- DMARC almeno in monitoraggio;
- firma coerente con sito, WhatsApp e social;
- warm-up progressivo;
- monitoraggio bounce, risposte e spam.

## Regola operativa aggiornata

Non inviare piu di 10-20 cold email al giorno da `cantonidigitalstudio@gmail.com` finche:

1. Gmail Cantoni non e visibile nel Browser destro;
2. non abbiamo controllato risposte e duplicati;
3. non esiste una base dominio email autenticata;
4. non c'e evidenza che i batch precedenti arrivino in inbox e generino risposte.

## Gate locale

Usare il gate DNS prima di aumentare volume o passare a una casella su dominio:

```bash
npm run audit:email-dns
```

Durante sviluppo locale, il tool puo essere verificato senza bloccare la suite finche i record non esistono:

```bash
npm run test:email-dns-audit
```

`audit:email-dns` deve restare rosso finche mancano MX, SPF, DMARC e DKIM coerenti con il provider scelto.

## Prossimo passo consigliato

1. Completare login Gmail Cantoni nel Browser destro.
2. Ricontrollare risposte e bounce.
3. Inviare al massimo Batch 004 se approvato esplicitamente e se non emergono risposte/duplicati.
4. Preparare configurazione dominio email prima di parlare di 1000 invii reali.
