# Social Launch

Sistema contenuti per Instagram, Facebook, TikTok e YouTube Shorts di Cantoni
Digital Studio.

## File principali

- `posts.json`: sorgente dei contenuti base.
- `portfolio-content-registry.json`: prova e contesto dei progetti citabili.
- `daily-calendar-2026-05-18.json`: calendario giornaliero corrente.
- `daily-publish-pack/`: review, caption, script e asset generati per giorno.
- `published-status/`: stato reale delle pubblicazioni gia chiuse.
- `video-storyboard-pack/`: storyboard e piani video.

## Build e test

```bash
npm run build:social:daily
npm run test:social:daily
npm run build:social:carousel
npm run test:social:carousel
```

I PNG, MP4 e ZIP dentro `daily-publish-pack/` sono output rigenerabili: restano
locali, ma non devono appesantire il commit. Prima di pubblicare serve comunque
review visiva nel Browser laterale o sul device reale.
