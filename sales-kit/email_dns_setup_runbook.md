# Cantoni Email DNS Setup Runbook

## Stato attuale

`cantonidigitalstudio.com` e gestito su Cloudflare, ma la posta su dominio non e
ancora pronta. Il gate autorevole e:

```bash
npm run audit:email-dns
```

Il comando deve tornare `ok=true` prima di rimuovere `sales-kit/outbound_pause.flag`
o scalare outreach da indirizzi `@cantonidigitalstudio.com`.

Per generare un pacchetto operativo Markdown/JSON/CSV con i record Cloudflare
derivati dal gate corrente:

```bash
npm run export:email-dns-handoff
```

Il CSV generato e un handoff operativo, non un permesso a modificare DNS senza
review: il valore DKIM resta manuale finche non viene generato in Google Admin.
Lo stesso comando genera anche un JSON API-safe per Cloudflare che esclude i
record con valore manuale non ancora disponibile.

## Profilo scelto

Profilo operativo: Google Workspace manuale a basso volume.

- account operativo corrente: `cantonidigitalstudio@gmail.com`
- dominio da abilitare: `cantonidigitalstudio.com`
- indirizzi/alias da creare prima di affidarsi ai record:
  - `hello@cantonidigitalstudio.com`
  - `quotes@cantonidigitalstudio.com`
  - `support@cantonidigitalstudio.com`
  - `dmarc@cantonidigitalstudio.com`

## Record DNS da creare in Cloudflare

| Tipo | Nome | Priorita | Valore |
| --- | --- | ---: | --- |
| MX | `@` | 1 | `smtp.google.com` |
| TXT | `@` | - | `v=spf1 include:_spf.google.com ~all` |
| TXT | `_dmarc` | - | `v=DMARC1; p=none; rua=mailto:dmarc@cantonidigitalstudio.com; adkim=s; aspf=s` |
| TXT | `google._domainkey` | - | valore DKIM generato in Google Admin |

Note operative:

- non creare piu record SPF separati: SPF deve restare un solo TXT record;
- il record DKIM non ha un valore fisso: va generato da Google Admin console;
- `dmarc@cantonidigitalstudio.com` deve esistere come mailbox, alias, gruppo o
  destinazione monitorata prima di usare quel `rua`;
- lasciare DMARC su `p=none` durante la fase di verifica, poi passare a policy
  piu restrittive solo dopo evidenza di SPF/DKIM allineati.

## Sequenza di sblocco

1. In Google Admin, creare utenti o alias necessari.
2. In Cloudflare DNS, aggiungere MX, SPF e DMARC.
3. In Google Admin, generare DKIM per `cantonidigitalstudio.com`.
4. In Cloudflare DNS, aggiungere il TXT `google._domainkey`.
5. Attendere propagazione DNS.
6. Eseguire:

```bash
npm run audit:email-dns
npm run test:launch-readiness-audit
```

7. Solo se il gate email e verde, rivedere `sales-kit/outbound_pause.flag` e
   decidere manualmente se rimuoverlo.

## Fonti operative

- Google Workspace MX: https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace
- Google Workspace SPF: https://knowledge.workspace.google.com/admin/security/set-up-spf
- Google Workspace DMARC: https://knowledge.workspace.google.com/admin/security/set-up-dmarc
