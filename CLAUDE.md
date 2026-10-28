# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Artic (formerly grazer / EMU-webApp) is a Svelte 5 SPA for labeling, visualizing, and correcting speech and derived speech data (spectrograms, waveforms, annotation tiers). Humlab fork of IPS-LMU original (v1.5.3-humlab-1.6.0).

## Commands

```bash
npm install           # install deps
npm start             # dev server (Vite) at http://localhost:5173
npm run build:svelte  # production build to /dist
npm test              # Jest (service specs) + Vitest (theme, i18n, components)
npm run test:jest     # Jest tests only
npm run test:vitest   # Vitest only
npm run test:visual   # Playwright visual regression (npx playwright install chromium; ARTIC_PORT if 9000 is taken)
npm run lint:tokens   # no colour/font literals outside src/core/theme
```

For WebSocket-based dev (loads example DB):
```bash
cd exampleServers && node nodeEmuProtocolWsServer.js
# then open: http://localhost:5173/?autoConnect=true
```

## Architecture

**Fully frontend app** — no backend bundled. Communicates with external EMU Protocol servers via WebSocket, or loads data via GET params/demo DBs.

**Stack:** Svelte 5 + TypeScript 5 + Vite + D3.js 5 + HTML5 Canvas

### Key Layers

- **`src/core/services/`** — 38 framework-agnostic services (pure TS classes with `initDeps()` pattern):
  - `io-handler.service` / `websocket-handler.service` — data loading/saving, WebSocket comms
  - `draw-helper.service` / `view-state.service` — canvas rendering state
  - `handleglobalkeystrokes.service` — keyboard interaction (action-map pattern)
  - `config-provider.service` — URL params, deployment settings
  - `history.service` / `validation.service` — undo/redo and schema validation

- **`src/core/interfaces/`** — TypeScript interfaces (IViewPort, ISsffFile, IAnnotJSON, etc.)

- **`src/core/workers/`** — Web Workers for heavy parsing (TextGrid, SSFF, ESPS, spectrogram drawing, WAV range requests)

- **`src/core/util/`** — Shared utilities (http-get, deep-copy, event-bus, safe-storage)

- **`src/svelte-app/`** — Svelte 5 UI layer:
  - `stores/services.ts` — service DI container (replaces Angular DI)
  - `components/` — Svelte components (oscillogram, spectrogram, annotation levels, hierarchy)

- **`src/demoDBs/`** — example speech databases for offline/dev use

- **`src/configFiles/`** / **`src/schemaFiles/`** — JSON config and EMU database schema definitions

### Testing

Tests use `test/angular-compat.js` shim that emulates Angular DI for existing test files. The shim creates fresh service instances per test suite via `createFreshServices()`. No test files were modified during migration.

### Theming and shell

- **`src/core/theme/tokens.ts`** is the single source of truth for colours, typography, spacing and canvas palettes. `css.ts` serialises it to `--sb-*` custom properties at startup; `canvas-style.ts` (`getCanvasStyle()`) gives renderers the resolved palette. Call it at the point of use in every draw; never cache colours.
- **Rule:** colour literals, `font-family` literals and px font sizes may only appear under `src/core/theme/` (`npm run lint:tokens` enforces it). SCSS and components use `var(--sb-*)`.
- **`ThemeService`** (`system|light|dark`, default system) sets `data-theme` on `<html>`. **`DataSourceService`** records provenance (`none|local|demo|server|url`) and derives capabilities (`canSave`, `canExport`, `canEditStructure`, ...); use them instead of raw `activeButtons` for save, export and structure editing.
- **i18n:** `src/core/util/i18n.ts` (`t()`, services) and `stores/i18n.svelte.ts` (`tr()`, components); dictionaries in `src/i18n/{en,sv}.json` must keep key parity (tested). Help HTML stays English.
- **Shell:** `src/svelte-app/components/shell/` (header, data selector, toolbar, start view, footer) and `ui/` primitives (`Button`, `Menu`, `Field`, `Badge`, `Icon`). Icons come only from `ui/icons.ts`. Keep the element IDs listed in `docs/plans/2026-10-13-sprakbanken-profile-redesign.md`, Appendix F.

### Data Flow

External EMU Protocol server (WebSocket) or URL params → `io-handler.service` → core services → Svelte stores → Canvas renderers (D3 + raw Canvas API) + Svelte components

### Build

Vite with Svelte plugin. TypeScript compiled targeting ES2020.
