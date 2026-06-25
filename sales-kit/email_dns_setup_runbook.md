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

Per trasformare quel JSON in un piano Cloudflare senza modificare DNS:

```bash
npm run dns:cloudflare:plan
```

Il comando usa l'ultimo payload generato. Senza credenziali non contatta
Cloudflare e segnala che serve il lookup live. Con `CLOUDFLARE_API_TOKEN` e
`CLOUDFLARE_ZONE_ID` disponibili, legge i record esistenti e produce azioni
`create`, `update`, `noop` o `blocked`. Prima di leggere i record, verifica che
lo zone id appartenga alla zona attiva `cantonidigitalstudio.com`; se punta a un
altro dominio, il piano resta bloccato e l'apply non puo mutare nulla.

Prima di qualunque apply, eseguire anche:

```bash
npm run audit:cloudflare-api
```

Deve confermare token attivo, identita della zona `cantonidigitalstudio.com` e
lettura DNS della zona Cantoni. Il check e read-only e non sostituisce
l'approvazione esplicita dell'apply.

L'applicazione reale e separata e richiede consenso esplicito nel processo:

```bash
CLOUDFLARE_API_TOKEN=... \
CLOUDFLARE_ZONE_ID=... \
CANTONI_DNS_APPROVAL=apply-cantoni-email-dns \
npm run dns:cloudflare:apply
```

Per sicurezza, lo script non sovrascrive automaticamente record SPF, DMARC o MX
gia presenti ma divergenti. Dopo review, si puo consentire una singola
sostituzione esplicita con:

```bash
CANTONI_DNS_ALLOW_EXISTING_REPLACE=yes
```

Non usare mai questa opzione per DKIM: il record `google._domainkey` resta
manuale finche Google Admin non fornisce il valore reale.

Il piano e incluso anche in `npm run export:launch-operator-pack`, cosi il
pacchetto di lancio contiene sia i file record sia lo stato applicabile del
dry-run Cloudflare. Se il pack mostra `source=no_credentials`, non e un via
libera: serve ripetere il piano con token e zone id del solo account Cantoni.
Se mostra `source=cloudflare_zone_identity_blocked`, lo zone id non e quello
attivo di `cantonidigitalstudio.com` e non va usato per l'apply.

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
