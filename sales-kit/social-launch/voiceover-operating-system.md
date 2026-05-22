# Cantoni Digital Studio - Voiceover Operating System

## Obiettivo

Usare la voce di Emanuele come riferimento di stile per Reel, TikTok e YouTube Shorts, mantenendo contenuti credibili, naturali e sicuri.

## Regola principale

Le note vocali WhatsApp non sono una libreria da usare in blocco. Si possono usare solo clip selezionate, inviate da Emanuele, dove parla Emanuele, senza audio di altre persone, senza dati privati e con approvazione esplicita.

## Cosa possiamo fare subito

1. Ascoltare note vocali selezionate per capire:
   - ritmo;
   - parole ricorrenti;
   - energia;
   - pause;
   - modo di spiegare;
   - tono naturale.
2. Trasformare quello stile in script piu simili al modo in cui parla Emanuele.
3. Preparare voiceover guide in italiano e in altre lingue.
4. Usare voci built-in o voce umana registrata, con disclosure interna e review.

## Cosa non va fatto in automatico

- Non clonare la voce da WhatsApp senza una procedura di consenso e provider adatto.
- Non usare note vocali con terze persone.
- Non usare vocali ricevuti da altri account come riferimento della voce di Emanuele.
- Non pubblicare audio sintetico facendolo passare come registrazione spontanea non revisionata.
- Non salvare audio privato nel repo.
- Non addestrare modelli o caricare note vocali su servizi esterni senza approvazione.

## Custom voice / clonazione

La clonazione della voce non e parte della skill audio locale disponibile qui. Per farla in modo serio servono:

1. provider che supporti custom voice con consenso;
2. registrazioni pulite scelte da Emanuele;
3. consenso esplicito registrato o scritto;
4. verifica che l'audio non contenga terzi;
5. output sempre revisionato prima della pubblicazione;
6. tracciamento di lingua, script e piattaforma.

La scelta piu sicura per partire e: script nello stile di Emanuele + registrazione reale di Emanuele quando possibile. La seconda scelta e voce AI built-in con istruzioni di tono. La clonazione multilingua viene dopo, solo con provider e consenso corretti.

## Multilingua

Per fare video in lingue diverse senza effetto finto:

- mantenere fraseggio semplice;
- non tradurre parola per parola dall'italiano;
- usare sottotitoli nella lingua target;
- per accenti o pronunce difficili, creare una riga di pronuncia;
- se la voce e sintetica, evitare espressioni troppo colloquiali che suonano innaturali;
- fare sempre review da ascolto prima di pubblicare.

## Stile voce Cantoni

Direzione base:

- tono: diretto, concreto, umano;
- ritmo: medio, con pause brevi dopo i concetti importanti;
- energia: sicura ma non urlata;
- parole: semplici, commerciali, comprensibili a clienti non tecnici;
- evitare: voce da pubblicita finta, entusiasmo eccessivo, gergo tecnico non spiegato.

## Cartelle

Audio privato selezionato:

```text
sales-kit/social-launch/voice-reference-private/
```

Output audio privato:

```text
sales-kit/social-launch/voice-renders-private/
```

Entrambe le cartelle sono escluse da git.

## Workflow operativo

1. Lo script prepara una review privata filtrata su `VOICE_DIRECTION=sent_by_me`, usando solo metadati WhatsApp `ZWAMESSAGE.ZISFROMME=1`.
2. Emanuele seleziona o autorizza clip WhatsApp specifiche.
3. Le clip vengono salvate nella cartella privata, non nel repo pubblico.
4. Si scartano clip con altre voci o dati privati.
5. Si scrive una scheda stile: ritmo, tono, parole, pause.
6. Si genera o registra una prova breve.
7. Si ascolta e si corregge.
8. Solo dopo review si usa per Reel/TikTok/Shorts.

## Gate

```bash
npm run test:social:voice
```
