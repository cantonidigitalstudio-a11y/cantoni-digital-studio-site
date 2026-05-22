# Cantoni Digital Studio - Voice Reference Selection Protocol

## Stato

Il sistema puo trovare vocali WhatsApp locali e preparare una review privata, ma non deve scegliere automaticamente quali audio rappresentano la voce di Emanuele. La selezione richiede ascolto e controllo umano per evitare clip con terzi, dati privati o tono non adatto.

Filtro obbligatorio: la review standard deve usare solo vocali inviati da Emanuele, non vocali ricevuti. Lo script legge solo metadati locali WhatsApp e usa `ChatStorage.sqlite` con `ZWAMESSAGE.ZISFROMME=1`; non legge il testo dei messaggi e non trascrive l'audio.

## Review privata

Pagina locale:

```text
http://127.0.0.1:4194/sales-kit/social-launch/voice-reference-private/incoming/review-candidates/index.html
```

File metadati privato:

```text
sales-kit/social-launch/voice-reference-private/analysis/voice-candidates.json
```

Rigenerazione:

```bash
VOICE_DIRECTION=sent_by_me VOICE_CANDIDATE_LIMIT=40 npm run build:social:voice-review
```

## Criteri di selezione

Tenere una clip solo se:

- risulta inviata da Emanuele nel filtro WhatsApp;
- parla solo Emanuele;
- non contiene nomi, numeri, password, dati cliente, pagamenti o materiale personale;
- l'audio e pulito;
- il tono e naturale;
- la durata e utile, idealmente 8-45 secondi;
- contiene fraseggio spontaneo utile per capire ritmo, pause e intonazione.

Scartare una clip se:

- si sente un'altra persona;
- contiene informazioni private;
- e troppo rumorosa;
- il tono e arrabbiato o non rappresentativo del brand;
- e troppo breve per capire lo stile.

## Output desiderato

Selezionare 10-15 ID, per esempio:

```text
VR-001, VR-004, VR-009
```

Poi copiare o linkare solo quelle clip in:

```text
sales-kit/social-launch/voice-reference-private/selected/
```

## Uso successivo

Le clip selezionate servono per:

- creare una scheda stile vocale;
- scrivere script social piu simili al modo in cui parla Emanuele;
- preparare voiceover guide;
- valutare in futuro un provider di custom voice, solo con consenso esplicito.

Non servono per:

- pubblicazione diretta;
- training automatico;
- upload a provider esterni;
- clonazione voce senza autorizzazione separata.
