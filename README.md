# Artic

Fork of [EMU-webApp](https://github.com/IPS-LMU/EMU-webApp) by Humlab, Umeå University.

## Introduction

Artic is an online and offline web application for labeling, visualizing, and correcting speech and derived speech data.
It has been rewritten from the ground up to eliminate some overhead of the framework used in the original implementation, 
and has a three-tier audio signal processing pipeline, which enables it to support databases in many more audio (and video) formats
to be managed as efficiently as possible by the application.



## Quick start

Visit the demo and use **Open demo** on the start screen to load one of the small example databases, or drop your own audio files (optionally with `.TextGrid` or annotJSON files) onto the start screen to work in local mode.

## Development

* install [nodejs and npm](http://nodejs.org/)
* clone this repo with `git clone https://github.com/humlab-speech/artic.git`
* `cd artic && npm install`
* `npm start` — dev server at `http://localhost:9000`
* example WebSocket server: `cd exampleServers && node nodeEmuProtocolWsServer.js`
* auto-connecting dev: `http://localhost:9000/?autoConnect=true`
* GET-param dev (no WebSocket): `http://localhost:9000/?audioGetUrl=http:%2F%2Flocalhost:9000%2FdemoDBs%2Fae%2Fmsajc003.wav&labelGetUrl=http:%2F%2Flocalhost:9000%2FdemoDBs%2Fae%2Fmsajc003_annot.json&labelType=annotJSON`

## Modes and URL parameters

Artic remembers where the data came from and shows only what makes sense there:

| Source | Save | Export, add/rename level |
|---|---|---|
| Local files (**local mode**) | – | yes |
| Demo database | – | – |
| Server (WebSocket) | yes, if `activeButtons.saveBundle` | – |
| URL parameters / iframe | yes, if `activeButtons.saveBundle` | – |

| Parameter | Values | Effect |
|---|---|---|
| `theme` | `system`, `light`, `dark` | Theme for this visit (not stored) |
| `lang` | `sv`, `en` | UI language for this visit (not stored) |
| `chrome` | `full`, `embedded`, `toolbar` | Header with logo / header without logo / toolbar only |

## Fonts, icons and licences

Jost, Noto Serif and Noto Sans are SIL OFL 1.1; Font Awesome Free icons are CC BY 4.0 (code MIT). `src/assets/fonts/ArticNotoSans-*.woff2` is built with `scripts/fonts/build-noto-sans-ipa.py` (see `scripts/fonts/README.md`). See `docs/THIRD-PARTY-NOTICES.md`.

## Supported audio formats

The app decodes audio natively in the browser. WAV files use the original header-based pipeline; other formats fall back to `AudioContext.decodeAudioData()`.

| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| WAV (PCM/float) | Y | Y | Y | Y |
| MP3 | Y | Y | Y | Y |
| FLAC | Y | Y | Y | Y |
| AAC (MP4/M4A) | Y | Y | Y | Y |
| OGG Vorbis | Y | Y | N | Y |
| OGG Opus | Y | Y | Y* | Y |

*Safari 16.4+. Note: MP3 decoding may add small silence padding (~50ms) due to encoder delay — this is a browser limitation.

## Prebuilt distributions

`npm run build` writes `dist/` **and** `dist/artic-manifest.json` (version,
git sha, protocol, features). The manifest lets consumers pin a build and
feature-gate behaviour without parsing bundled JavaScript.

Two consumers exist, and neither is required for standalone use:

- **Standalone**: `dist/` is a self-contained static site (`npm run preview`,
  any static host, or the demo databases left in `dist/demoDBs/`). Release
  tarballs should ship the full build.
- **reindeer** (`annotate()`/`review()`): consumes a trimmed build
  (`demoDBs/` excluded — the demo button is disabled once connected over the
  WebSocket protocol). `tools/sync-artic-dist.R` in the reindeer repository
  vendors a pinned copy into `inst/artic/dist`; reindeer also verifies the
  manifest features (`bundleList`, `timeAnchors`) before serving a review
  playlist.

When changing the protocol or the bundle-list/time-anchor contract, bump the
`features` list in `scripts/emit-manifest.mjs` accordingly.

## Tests
* `npm test` — Jest (service specs) and Vitest (tokens, theme, i18n, components)
* `npm run test:jest` — Jest tests only
* `npm run test:vitest` — Vitest only
* `npm run test:visual` — Playwright visual regression; `npm run test:e2e` runs all Playwright specs (needs `npx playwright install chromium`; set `ARTIC_PORT` if 9000 is taken)
* `npm run lint:tokens` — fails on colour, font-family or px font-size literals outside `src/core/theme/`
* `npm run test:karma` — Karma tests (legacy)
* `npm e2e` — end-to-end tests (currently not working)

## Original authors

**Raphael Winkelmann** · [github](http://github.com/raphywink)
**Georg Raess** · [github](http://github.com/georgraess)
**Markus Jochim** · [github](http://github.com/MJochim)

[Institute of Phonetics and Speech Processing](http://www.en.phonetik.uni-muenchen.de/), LMU Munich
