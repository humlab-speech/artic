# Artic

Fork of [EMU-webApp](https://github.com/IPS-LMU/EMU-webApp) by Humlab, Umeå University.

## Introduction

Artic is an online and offline web application for labeling, visualizing, and correcting speech and derived speech data.
It has been rewritten from the ground up to eliminate some overhead of the framework used in the original implementation, 
and has a three-tier audio signal processing pipeline, which enables it to support databases in many more audio (and video) formats
to be managed as efficiently as possible by the application.



## Quick start

Visit the demo and click the `open demo DB` button in the top menu to load one of the three small example databases.

## Development

* install [nodejs and npm](http://nodejs.org/)
* clone this repo with `git clone https://github.com/humlab-speech/artic.git`
* `cd artic && npm install`
* `npm start` — dev server at `http://localhost:9000`
* example WebSocket server: `cd exampleServers && node nodeEmuProtocolWsServer.js`
* auto-connecting dev: `http://localhost:9000/?autoConnect=true`
* GET-param dev (no WebSocket): `http://localhost:9000/?audioGetUrl=http:%2F%2Flocalhost:9000%2FdemoDBs%2Fae%2Fmsajc003.wav&labelGetUrl=http:%2F%2Flocalhost:9000%2FdemoDBs%2Fae%2Fmsajc003_annot.json&labelType=annotJSON`

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
* `npm test` — unit tests via Jest (262 tests)
* `npm run test:jest` — Jest tests only
* `npm run test:karma` — Karma tests (legacy)
* `npm e2e` — end-to-end tests (currently not working)

## Original authors

**Raphael Winkelmann** · [github](http://github.com/raphywink)
**Georg Raess** · [github](http://github.com/georgraess)
**Markus Jochim** · [github](http://github.com/MJochim)

[Institute of Phonetics and Speech Processing](http://www.en.phonetik.uni-muenchen.de/), LMU Munich
