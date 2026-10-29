# Språkbanken Graphic Profile Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Re-skin and restructure Artic according to Språkbanken's graphic profile (Jost* and Noto typography, the five profile colours, Font Awesome icons, the profile's header/footer structure), make the light and dark themes both work (following the operating system by default), and restrict level-structure editing and export to an explicit *local mode*.

**Architecture:** One TypeScript token module (`src/core/theme/tokens.ts`) is the single source of truth for colours, typography, spacing and canvas palettes. At startup it is serialised to CSS custom properties (`--sb-*`), and canvas renderers read the same values directly through a new `ThemeService`. A new `DataSourceService` records where the loaded data came from (`none | local | demo | server | url`) and derives capabilities (`canSave`, `canExport`, `canEditStructure`, …). The new Svelte shell uses those capabilities, and so do the keyboard handlers, instead of raw `activeButtons` flags. The shell is `AppHeader`, `DataSelector`, `HeaderMenu`, `Toolbar`, `StartView` and `AppFooter`. Icons are inline SVG from `@fortawesome/free-solid-svg-icons`, rendered by one `Icon.svelte`. A framework-agnostic i18n module provides Swedish and English strings.

**Tech Stack:** Svelte 5 (runes), TypeScript 5, Vite 8, SCSS, Canvas 2D, `@fontsource-variable/jost`, `@fontsource/noto-serif`, a self-built Noto Sans IPA subset (fontTools), `@fortawesome/free-solid-svg-icons` 7.3, Jest (existing suite), Vitest + `@testing-library/svelte` (new unit/component tests), Playwright + `@axe-core/playwright` (visual and accessibility checks).

**Design references:**

- Design plan (Swedish, Claude Docs): https://claude.ai/code/artifact/aa496a3b-ab0d-4bf0-8b43-4d05c7f8703c. It is private until shared from its Share menu.
- Språkbanken profile assets: https://github.com/spraakbanken/communication (`logotypes/`, `fonts/`).
- Target mockups in this repository: `docs/plans/2026-10-13-sprakbanken-profile-redesign/`
  - `target-work-online-light.png`, `target-work-online-dark.png` show the work view with data served from a server.
  - `target-header-local.png` shows the header and toolbar in local mode.
  - `target-start-light.png` shows the start view with the footer.
  - `palette.png` shows the profile colours, their derived variants and measured contrast.

The mockups are HTML sketches built with real data, real fonts and real icons. They set the target layout and colour use, not pixel-exact dimensions.

---

## 0. Decisions this plan implements

| # | Decision | Status | Consequence in code |
|---|---|---|---|
| 1 | Artic gets its own tool logo: the snowflake symbol in sborange, "Artic" in Jost Light and a tagline in Jost Medium. The tagline is "Språkbankens verktyg för talannotering" / "Språkbanken's speech annotation tool". | Accepted by the team, pending approval from Språkbanken communications | `Logo.svelte` renders the symbol as SVG and the words as live Jost text. Swapping in an approved SVG later touches one file. |
| 2 | The footer shows node logos for **both** Umeå universitet and Humlab, linked, in light and dark variants. | Decided | Assets must be supplied (Task 0.3). |
| 3 | The default theme **follows the operating system**. An explicit choice in the theme menu persists and wins. | Decided | `ThemeService` preference `system` is the default. |
| 4 | The footer is **hidden in the work view**. Its content moves to the About dialog. | Decided | `AppFooter` is shown only in the start view and in the About tab. |
| 5 | When embedded in Visp or reindeer: header with data selector and menu, or the toolbar only? | **Open** | The `chrome` option supports `full`, `embedded` and `toolbar`. The default is `full`. |
| 6 | Text-safe variants of the profile colours: #C04615, #187A7F, #457B12 and ochre #B69000. | **Open** (needs Språkbanken) | Tokens `*-strong` / `*-text`. Fallback if rejected: black text on orange fills, a two-token change. |
| 7 | Noto size factor: 0.8 (profile) or 0.86–0.875 (measured x-height). | **Open** | Token `--sb-noto-scale`, default 0.875. |
| 8 | The UI is in Swedish and English. The help manual stays in English. | Decided | Phase 5 and Phase 7. Help tab titles are translated, help HTML is not. |
| 9 | **Local mode** (files added by the user, no server besides the web server) shows add segment level, add event level, rename level and export. **Online modes never show them.** | Decided | `DataSourceService.capabilities`. |
| 10 | Rename level exists in local mode only. | Decided | Same as #9. |
| 11 | The database field is never a chooser. It shows the name only. Demo databases are chosen in the start view only. | Decided | `DataSelector` shows the database as a read-only label. |
| 12 | Save applies to the open bundle only, so the Save button sits next to the bundle in the data selector. This was verified in code: `DbObjLoadSaveService.saveBundle()` sends exactly one bundle. | Decided | `DataSelector` owns Save in online modes and Export in local mode. |

---

## 1. Ground rules for the implementer

1. **Branch and commits.** Work on `feature/sprakbanken-profile` from `master` (currently `a2a36042`). Use conventional commit prefixes, as in the existing history: `feat:`, `fix:`, `style:`, `refactor:`, `test:`, `docs:`. Each task below suggests a commit message. Follow the repo's plan convention and **commit only when the user asks**.
2. **Green at every task.** Run `npm test` (Jest), `npm run test:vitest` and `npm run build`. Visual tasks also run `npm run test:visual` and attach the screenshots to the PR.
3. **Keep element IDs.** Do not rename existing element IDs (Appendix F). Old e2e specs and host integrations may target them. New components put the old ID on the equivalent control.
4. **Keep contracts.** Do not change the EMU WebSocket protocol, the bundle/annotation schemas or the `dist/artic-manifest.json` format. The only exception is additive `features` entries (Task 8.4).
5. **No ad hoc styling.** After Phase 2, colour literals, font-family literals and px font sizes may only appear under `src/core/theme/`. Allow-listed data settings are the exception (Task 1.5).
6. **Mirrored copies.** Keep `src/` and `public/` copies in sync where both exist: `schemaFiles/`, `configFiles/`, `views/helpTabs/`.
7. **Strings.** Every new user-facing string goes through `tr()`/`t()` from the moment the i18n core exists (Phase 5). Do not add English literals to new components.

---

## 2. Baseline: audit of `master` @ a2a36042

### 2.1 Inventory

| Area | Today | Where |
|---|---|---|
| Colour tokens | Navy #2A4765 bars, cream "white" #F1EFE4, warm grey #A09B8E. Signal colours are #f00, #ff0 and #eeff41. `:root` holds the dark theme; `[data-theme="light"]` overrides it. | `src/styles/artic-design.scss` |
| Canvas palette | A static object with no theme awareness (`colorWhite`, `colorBlue` = tan #D7B17C, `colorCursor` = #F0581A, …), used in about 120 places. | `src/core/util/styles.ts` |
| Hard-coded colours | 52 lines in 15 Svelte/TS files and 54 lines in SCSS outside the token file. The contour palette exists in three copies. | Appendix C and Appendix D |
| Typography | Arial/HelveticaNeue at 12–16 px. 12 `font-size: …px` declarations in SCSS/Svelte. 11 canvas uses of `styles.fontSmallSize` ('12px'). | `font.scss`, `text.scss`, canvas code |
| Icons | The Material Icons font, used 21 times in `TopMenu` (9), `BottomMenu` (9), `BundleListSidebar` (2) and `PerspectivesSidebar` (1). Glyphs ◀ ▶ ▸ ▾ ⇧ × 🔍 ↻ appear in markup. The artic crystal SVG is the About button. | |
| Styles | 26 SCSS files, 24 imported by `main.ts` (`modal.scss` twice). `intro.scss` is unused. 31 inline `style=""` attributes and 10 components with `<style>` blocks. | `src/styles/`, `src/svelte-app/` |
| Theme | `ConfigProviderService.initTheme/setTheme/getTheme` uses `localStorage` directly. There is no UI to switch theme. Dark is hard-wired as the default. | `config-provider.service.ts` |
| Modes | `comMode` ∈ {DEMO, WS, EMBEDDED, GITLAB}. Local files load `standalone_articConfig.json`, whose comMode is **EMBEDDED**, the same as URL-parameter embedding. | `drag-n-drop.service.ts`, `io-handler.service.ts`, configs |
| Strings | About 230 English UI strings: 140 text nodes, 58 modal messages, 20 progress texts, 12 title/placeholder/aria attributes. There is no i18n. | All components and some services |
| Tests | Jest runs `test/spec/services/**` (jsdom) with no UI tests. Vitest is configured for `test/vitest/**/*.test.ts`, but that directory does not exist. The Protractor e2e specs do not run. | `jest.config.js`, `vitest.config.ts` |
| Bundle | `dist/assets` is 1.2 MB, of which 373 kB is Material Icons in four formats. JS is 479 kB plus 47 kB d3. CSS is 44 kB. | `dist/` |

### 2.2 Defects to fix along the way

| ID | Defect | Fixed in |
|---|---|---|
| D1 | The light theme is unreadable. Canvases draw from the static `styles.ts`, so labels come out white on light grey and signals stay black. | Phase 2 |
| D2 | The spectrogram "rendering…" overlay draws black text on a black fill (`Spectrogram.svelte`, `showRenderingOverlay`). | Task 2.2 |
| D3 | Switching bundle with unsaved changes can show **two** dialogs in WS mode: the confirm in `BundleListSidebar.loadBundle`, then `saveChanges` from `DbObjLoadSaveService.loadBundle`. | Task 4.3 |
| D4 | The save shortcut (`keyMappings.saveBndl` = 83) calls `saveBundle()` without checking `activeButtons.saveBundle`. In DEMO, `IoHandlerService.saveBundle()` has no branch and returns `undefined`, and `getAnnotationAndSaveBndl` then calls `.then` on it. In local mode (comMode EMBEDDED) it posts to `window.parent` and resets the unsaved counter although nothing was stored. **This is read from the code; reproduce it before fixing.** | Task 4.2 |
| D5 | `embedded_articConfig.json` enables TextGrid/annotJSON export in online, URL-embedded mode. This contradicts decision 9. | Task 4.2 |
| D6 | The About button uses the absolute path `/assets/artic_crystal_icon_dark.svg`, which breaks when served under a sub-path. | Task 6.4 |
| D7 | Dead weight: `modal.scss` is imported twice, `intro.scss` is unused, `src/fonts/*` (373 kB) duplicates node_modules, `public/img/*.svg` and `LoadFilesModal` are unused, and `default_articDesign.json` is only read by legacy tests. | Task 3.2, Task 6.12 |
| D8 | `deleteSingleLevel` (activeButtons) and `LevelService.deleteLevel` have no UI. They are only reachable through undo of an inserted level. | Note only. Keep for undo. |

---

## 3. Target architecture

### 3.1 File layout (new and moved)

```
src/core/theme/
  tokens.ts          # primitives + semantic (light/dark) + canvas palettes + typography/space/radius/layout/motion
  css.ts             # tokensToCss(): CSS custom properties + temporary legacy aliases
  contrast.ts        # WCAG relative-luminance helpers (used by tests and by tokens self-check)
  canvas-style.ts    # getCanvasStyle(): resolved palette, font strings and px sizes for renderers
  fonts.ts           # family names, ensureFontsLoaded()
src/core/services/
  theme.service.ts         # preference (system|light|dark) → resolved theme, data-theme, events
  data-source.service.ts   # provenance of loaded data → capabilities
src/core/util/i18n.ts      # t(), setLanguage(), detectLanguage(), onLanguageChange()
src/i18n/en.json, src/i18n/sv.json
src/assets/fonts/ArticNotoSans-400.woff2, ArticNotoSans-600.woff2, OFL-NotoSans.txt
src/assets/brand/artic-symbol.svg, umu-*.svg, humlab-*.svg
src/styles/base.scss, ui.scss, fonts.css # new; artic-design.scss removed at the end
src/svelte-app/stores/theme.svelte.ts, i18n.svelte.ts   # reactive wrappers (runes)
src/svelte-app/components/ui/      Icon.svelte, icons.ts, Button.svelte, IconButton.svelte, Menu.svelte, Field.svelte, Badge.svelte
src/svelte-app/components/shell/   AppHeader.svelte, Logo.svelte, DataSelector.svelte, HeaderMenu.svelte,
                                   ThemeMenu.svelte, LanguageMenu.svelte, Toolbar.svelte, toolbar-actions.ts,
                                   StartView.svelte, AppFooter.svelte, AboutTab.svelte
scripts/fonts/build-noto-sans-ipa.py, scripts/fonts/README.md
scripts/lint-tokens.mjs
test/vitest/**            # new unit + component tests
test/playwright/**        # visual + a11y + integration specs
```

### 3.2 Tokens (single source of truth)

**Why TypeScript and not SCSS:** canvas code needs the values synchronously and per theme, and new unit tests run in jsdom, where `getComputedStyle` returns empty custom properties. A TS module serves the CSS, the canvases and the tests from one place, and SCSS references only `var(--sb-*)`.

```ts
// src/core/theme/tokens.ts (shape — values in Appendix A)
export type ThemeName = 'light' | 'dark';

/** Språkbanken profile colours. Components never use these directly — only semantic tokens. */
export const profile = {
	orange: '#F0581A', // "sborange": graphics, next step in a workflow
	blue: '#1E989F',   // interactive elements, help
	red: '#D42225',    // results that block the workflow, destructive actions
	yellow: '#F6C200', // results that change the workflow; never text on white
	green: '#5AA018',  // success
} as const;

export interface SemanticColors {
	surface: string; surface2: string; surface3: string;
	border: string; borderControl: string;
	text: string; textMuted: string; onFill: string;
	brand: string; brandStrong: string; brandTint: string;
	interactive: string; interactiveText: string; interactiveTint: string;
	danger: string; dangerText: string; dangerTint: string;
	warning: string; warningTint: string; onWarning: string;
	success: string; successText: string; successTint: string;
	focusRing: string; overlay: string;
}
export interface CanvasColors {
	bg: string; signal: string; zeroLine: string; text: string; textMuted: string; accentText: string;
	boundary: string; boundaryMuted: string; tierBg: string; tierActive: string;
	selectionFill: string; selectionEdge: string; segmentSelected: string; hoverFill: string;
	cursor: string; playedFill: string; error: string; warning: string;
	contours: readonly string[];
	hierarchy: { node: string; nodeStroke: string; nodeSelected: string; link: string; linkSelected: string; collapsed: string };
}
export const semantic: Record<ThemeName, SemanticColors> = { light: { /* … */ }, dark: { /* … */ } };
export const canvas: Record<ThemeName, CanvasColors> = { light: { /* … */ }, dark: { /* … */ } };

export const typography = {
	fontUi: '"Jost Variable", Jost, system-ui, sans-serif',
	fontData: '"Artic Noto Sans", "Noto Sans", system-ui, sans-serif',
	fontBody: '"Noto Serif", Georgia, serif',
	fontCode: 'ui-monospace, Menlo, Consolas, "Liberation Mono", monospace',
	notoScale: 0.875, // decision 7 (profile: 0.8; measured x-height ratio Jost/Noto: 0.86)
	size: { xs: 0.75, sm: 0.875, md: 1, lg: 1.25, xl: 1.5, xxl: 2 }, // rem
	weight: { light: 300, regular: 400, medium: 500, semibold: 600 },
} as const;
export const space = { 1: 0.25, 2: 0.5, 3: 0.75, 4: 1, 5: 1.5, 6: 2 } as const; // rem
export const radius = { sm: 0.25, md: 0.375, lg: 0.5, pill: 1 } as const;   // rem
export const layout = { headerHeight: 4, toolbarHeight: 2.9, sidebarWidth: 15, railWidth: 2.75 } as const; // rem
export const zIndex = { canvas: 1, chrome: 5, sidebar: 20, menu: 50, toast: 90, modal: 100 } as const;
export const motion = { period: 400 } as const; // ms — replaces styles.animationPeriod
```

`css.ts` emits:

- `:root { …light semantic…, …typography/space/radius/layout… }`
- `:root[data-theme="dark"] { …dark semantic… }`
- a temporary alias block that maps the old **semantic** variables to the new ones. The `--color-*` variables are **not** aliased, because their meaning differs per use. They are removed file by file in Phase 6.

| Old variable | Alias to |
|---|---|
| `--bg-primary`, `--bg-surface`, `--bg-modal`, `--bg-dropdown`, `--input-bg` | `--sb-surface` |
| `--bg-secondary`, `--bg-sidebar`, `--bg-menu`, `--scrollbar-bg` | `--sb-surface-2` |
| `--text-primary`, `--input-text` | `--sb-text` |
| `--text-secondary`, `--text-muted` | `--sb-text-muted` |
| `--text-on-accent` | `--sb-on-fill` |
| `--accent`, `--border-accent` | `--sb-interactive` |
| `--accent-hover` | `--sb-interactive-text` |
| `--border-color`, `--input-border` | `--sb-border-control` |
| `--scrollbar-thumb` | `--sb-border-control` |
| `--bg-toast` | `--sb-surface-3` |

Naming rule: `--sb-<group>-<kebab-name>`, for example `--sb-interactive-tint`, `--sb-canvas-selection-fill`, `--sb-font-ui`, `--sb-size-sm`. Sizes are emitted as `rem` strings.

### 3.3 ThemeService

```ts
// src/core/services/theme.service.ts
export type ThemePreference = 'system' | 'light' | 'dark';
const KEY = 'artic-theme'; // same key as today; absent ⇒ 'system'

class ThemeService {
	private pref: ThemePreference = 'system';
	private mql: MediaQueryList | null = null;
	private listeners = new Set<(t: ThemeName) => void>();

	init(search = window.location.search) { /* URL ?theme=system|light|dark (not persisted) > storage > 'system';
	                                          subscribe to (prefers-color-scheme: dark); apply() */ }
	get preference(): ThemePreference
	get resolved(): ThemeName           // pref, or matchMedia when 'system'; 'light' when matchMedia is unavailable
	setPreference(p: ThemePreference)   // 'system' ⇒ safeRemoveItem(KEY); else safeSetItem(KEY, p); apply()
	onChange(fn): () => void
	private apply() { document.documentElement.dataset.theme = this.resolved;
	                  update <meta name="theme-color">; notify listeners }
}
export const themeService = new ThemeService();
```

- `data-theme` is **always** set to the resolved theme, `light` or `dark`. This replaces today's "absent means dark".
- `ConfigProviderService.initTheme/setTheme/getTheme` stay as thin deprecated delegates, because hosts may call them.
- `safe-storage.ts` gets a `safeRemoveItem(key)`.
- In `stores/services.ts`, `themeService.onChange(() => { invalidate(); invalidateMarkup(); })` so that every canvas redraws.
- Print: `@media print` forces light UI tokens. Optionally switch to light on `beforeprint` and back on `afterprint`, so that the canvases are printed light.

### 3.4 Typography and fonts

| Role | Family (token) | Weights | Files |
|---|---|---|---|
| Headings, all UI | `--sb-font-ui` = Jost Variable | 300 (logo, h1), 400, 500 (buttons, labels), 600 (on coloured fills) | `@fontsource-variable/jost/wght.css`: latin 26.6 kB and latin-ext 17.1 kB woff2, loaded by `unicode-range` |
| Data: labels, level names, bundle names, times, tables | `--sb-font-data` = **Artic Noto Sans** (self-built) | 400, 600 | `src/assets/fonts/ArticNotoSans-{400,600}.woff2`: about 100 kB and 107 kB (measured, see Task 1.3) |
| Body text: help, manual, long dialog text | `--sb-font-body` = Noto Serif | 400, 400 italic, 700 | `@fontsource/noto-serif/{latin,latin-ext}-{400,400-italic,700}.css` |
| Code: export preview | `--sb-font-code`, system monospace | 400 | n/a |

- **Why a self-built Noto Sans:** Fontsource subsets cover the IPA letters (U+0250–02AF are in `latin-ext`) but only 3 of the combining diacritics (U+0304, U+0308, U+0329). Combining marks must sit in the same font file as their base letters, or mark positioning breaks across faces. The Greek letters used in IPA (β θ χ) live in U+0370–03FF. One file per weight therefore holds all ranges. In the prototype, 149 IPA characters and diacritics were covered, except ↗ ↘ (U+2197/2198), which Noto Sans lacks and which fall back to the system font.
- **Sizes:** never set the base size, so the browser handles it, and use `rem` only. `h1` 2rem/300, `h2` 1.5rem/400 (as the profile suggests), `h3` 1.25rem/500, UI 0.875rem/500.
- **Data and body text** use `font-size: calc(var(--sb-noto-scale) * <role size>)`.
- **Canvas:** sizes come from `getCanvasStyle().px(rem)`, which uses `parseFloat(getComputedStyle(document.documentElement).fontSize)` with 16 as the fallback, so canvas text follows the browser's text size. Canvas never draws before `ensureFontsLoaded()` resolves, with a 1.5 s timeout. Afterwards, `document.fonts.ready` triggers one more `invalidate()`.

### 3.5 Icons

- `src/svelte-app/components/ui/Icon.svelte` takes `{ icon, label?, size? }`. It renders `<svg viewBox="0 0 w h" fill="currentColor" height="1em">` with the path from the `IconDefinition`.
- With no `label`, the icon is `aria-hidden="true"`. With a `label`, it is `role="img"` with an `aria-label`.
- `src/svelte-app/components/ui/icons.ts` is the only file that imports from `@fortawesome/free-solid-svg-icons`. It uses named imports so that Vite tree-shakes the package (`sideEffects: false`) and exports a registry such as `icons.save`, `icons.theme`, ….
- The final mapping is in Appendix B.

### 3.6 DataSourceService and capabilities

```ts
// src/core/services/data-source.service.ts
export type DataSource = 'none' | 'local' | 'demo' | 'server' | 'url';
export interface Capabilities {
	showStartView: boolean;      // source === 'none'
	canSave: boolean;            // (server|url) && activeButtons.saveBundle
	canExport: boolean;          // local
	canEditStructure: boolean;   // local — add SEGMENT/EVENT level
	canRenameLevel: boolean;     // local
	canChooseDatabase: false;    // decision 11 — always false in the header
	closeLabelKey: 'toolbar.closeFiles' | 'toolbar.closeDemo' | 'toolbar.closeAndDisconnect';
}
class DataSourceService {
	source: DataSource = 'none';
	initDeps(deps: { ConfigProviderService: any }) { Object.assign(this, deps); }
	set(source: DataSource) { this.source = source; }
	get capabilities(): Capabilities { /* see matrix */ }
}
```

| Capability | none | local | demo | server (WS/GITLAB) | url (URL params / iframe) |
|---|---|---|---|---|---|
| Start view | ✔ | – | – | – | – |
| Save (data selector) | – | – | – | ✔ if `activeButtons.saveBundle` | ✔ if `activeButtons.saveBundle` (`saveToWindowParent=true`) |
| Export TextGrid/annotJSON (data selector) | – | ✔ | – | – | – |
| Add segment/event level, rename level (toolbar) | – | ✔ | – | – | – |
| "Local mode" badge | – | ✔ | – | – | – |
| Close label | – | Close files | Close demo database | Close and disconnect | Close and disconnect |

- `comMode` keeps meaning **transport**. `DataSourceService.source` means **provenance**. The EMBEDDED branches in `IoHandlerService.getBundle`, `saveBundle` and `PublisherService` stay untouched.
- **Entry points:**

  | Event | Location | `source` |
  |---|---|---|
  | Local files | `DragnDropService.handleLocalFiles()` | `'local'` |
  | Demo database opened | `openDemoDb()` (moved from `TopMenu`) | `'demo'` |
  | Connected | `App.svelte` `handleConnectedToWSserver()`, WS and GITLAB | `'server'` |
  | URL-parameter load | `App.svelte` `loadFilesForEmbeddedApp()` | `'url'` |
  | Reset | `AppStateService.resetToInitState()` | `'none'` |

- **Precedence:** capabilities override `activeButtons` for the structure and export keys (`addLevelSeg`, `addLevelEvent`, `renameSelLevel`, `downloadTextGrid`, `downloadAnnotation`). Those keys remain valid in the schema, because emuR/EMU-SDMS database configs send them, but online they no longer show anything. **This is a behaviour change.** Announce it in NEWS.md and through a manifest feature (Task 8.4).

### 3.7 Chrome levels (decision 5)

`chrome` = `full` | `embedded` | `toolbar`. It is resolved from the URL `?chrome=`, then `EMUwebAppConfig.main.chrome` (schema addition), then the default `full`.

| Element | full | embedded | toolbar |
|---|---|---|---|
| Logo + tagline | ✔ | – | – |
| Data selector (database, bundle, Save/Export, navigation) | header centre | header centre | start of the toolbar (compact) |
| Menu (user, theme, language, info) | header right | header right | end of the toolbar (icons only) |
| Start view and footer | ✔ | start view without footer | – |
| Toolbar, sidebars, canvases, bottom bar | ✔ | ✔ | ✔ |

When decision 5 is made, Visp and reindeer pass the chosen value. No code change is needed.

### 3.8 Component map

| Today | Becomes | Notes |
|---|---|---|
| `TopMenu.svelte` | `shell/Toolbar.svelte` + `shell/toolbar-actions.ts` | Logic moves to `toolbar-actions.ts` (add level, rename, export, settings, hierarchy, search, close, `openDemoDb`, `connect`). Open demo and connect move to `StartView`. |
| (none) | `shell/AppHeader.svelte`, `Logo.svelte`, `DataSelector.svelte`, `HeaderMenu.svelte`, `ThemeMenu.svelte`, `LanguageMenu.svelte` | Profile structure |
| Drop zone inside `BundleListSidebar` | `shell/StartView.svelte` | The sidebar no longer renders the drop zone. |
| (none) | `shell/AppFooter.svelte`, `shell/AboutTab.svelte` | Footer in the start view; About tab in Help |
| `BottomMenu.svelte` | restyled in place | Icons, button variants, time readout |
| `BundleListSidebar.svelte`, `PerspectivesSidebar.svelte`, `SplitPane.svelte`, `ProgressBar.svelte`, `ToastNotification.svelte`, `HistoryActionPopup.svelte`, `NewVersionHint.svelte`, `DropZone.svelte`, `LargeTextFieldInput.svelte`, `Level.svelte` attribute buttons | restyled in place | |
| `Modal.svelte` + 14 dialogs | new modal shell styles and semantic buttons | Mapping in Task 6.9 |
| `LoadFilesModal.svelte` | removed | Never opened anywhere |

### 3.9 Internationalisation

- `src/core/util/i18n.ts` is framework-agnostic, so core services can use it for progress and error texts.
  - `t(key, params?)` looks up the current language, falls back to `en`, then to the key itself. Missing keys log a warning in dev.
  - `{name}` interpolation is supported.
  - `setLanguage(lang, persist = true)` sets `document.documentElement.lang` and notifies listeners.
  - `detectLanguage()` checks the URL `?lang=sv|en` (not persisted), then storage key `artic-lang`, then `navigator.language` (`sv*` gives `sv`), then `en`.
- `src/svelte-app/stores/i18n.svelte.ts` holds a `$state` tick that is bumped on language change, and exports `tr(key, params?)`. Components call `tr()`. Services call `t()` and rely on `invalidate()` for re-render.
- Dictionaries are `src/i18n/{en,sv}.json` with nested namespaces: `header.*`, `toolbar.*`, `dataSelector.*`, `start.*`, `footer.*`, `dialog.*`, `progress.*`, `error.*`, `settings.*`, `help.*`. Add `resolveJsonModule` to `tsconfig` if type-checking complains.
- Glossary: Appendix E.

### 3.10 Canvas rendering contract

- Every draw function starts with `const cs = getCanvasStyle();` and reads colours, font strings and px sizes from `cs`. **Do not cache colours across draws.**
- `cs.font.data(px, weight?)` returns, for example, `"600 13px "Artic Noto Sans", …"`. `cs.size.sm` is in px, derived from rem.
- `FontScaleService.drawUndistortedText(…)` keeps its signature. Callers pass `cs.size.*` and `cs.font.family.data` instead of `styles.*`.
- Spectrogram: unless the user has set `invert` in Settings, `invert` follows the theme. Dark theme means inverted, light energy on dark. `viewStateService.spectroSettings.invertSource` = `'theme' | 'user'`. The heat-map anchors are a user data setting and are not themed.

### 3.11 Accessibility baseline (WCAG 2.1 AA, required by DOS-lagen through EN 301 549)

- **Text contrast** is at least 4.5:1, and at least 3:1 for UI component boundaries and graphics. `test/vitest/theme/contrast.test.ts` checks the pairs in Appendix A for both themes.
- **Focus:** `:focus-visible` gives a 2px `--sb-focus-ring` outline with a 2px offset. Mouse clicks on toolbar buttons do not leave a focus ring.
- **Icon-only buttons** have an `aria-label` (via `tr`) and a `title` tooltip.
- **Colour never carries meaning alone.** The unsaved dot has an `aria-label` and a tooltip. The local-mode badge contains text. Error dialogs have an icon and a heading.
- **Keyboard:** global shortcuts in `HandleGlobalKeystrokesService` are suspended while a menu or dialog is open. Enter and Space are ignored when `e.target` is inside `button, a, input, select, textarea, [role=menu], [role=menuitem], [contenteditable]`. Escape closes menus.
- **`prefers-reduced-motion: reduce`** disables sidebar and toast transitions.

---

## 4. Work plan

### 4.1 Phases, PRs and order

| PR | Phase | Tasks | Size | Depends on |
|---|---|---|---|---|
| A | 4 – Data-source modes and behaviour fixes | 4.1–4.4 | M | none; recommended first, because it is functional and independent of visuals |
| B | 0 – Preparation, and 1 – Foundation | 0.1–0.3, 1.1–1.5 | L | none |
| C | 2 – Canvas theming (fixes the light theme) | 2.1–2.3 | L | B |
| D | 3 – Icons | 3.1–3.2 | S | B |
| E | 5 – i18n core | 5.1 | M | none |
| F | 6 – App shell | 6.1–6.12 | XL; split F1 (6.1–6.5) and F2 (6.6–6.12) | A, B, C, D, E |
| G | 7 – Translation pass | 7.1–7.2 | M | F |
| H | 8 – Accessibility, verification, docs, release | 8.1–8.4 | M | G |

Sizes are S ≤ ½ day, M = 1–2 days, L = 3–4 days and XL ≥ 5 days. The indicative total is 25–35 developer-days. Re-estimate after PR B.

---

### Phase 0 — Preparation

#### Task 0.1: Playwright harness for screenshots and smoke runs

**Files:**
- Create: `playwright.config.ts`, `test/playwright/helpers.ts`, `test/playwright/visual.spec.ts`
- Modify: `package.json`: add devDependencies `@playwright/test` and `@axe-core/playwright`, and scripts `"test:visual": "playwright test test/playwright/visual.spec.ts"` and `"test:e2e": "playwright test"`

**Steps:**
1. Configure `webServer: { command: 'npm run dev -- --port 9000 --strictPort', url: 'http://localhost:9000', reuseExistingServer: true }` with the viewport at 1440×900. On a developer machine, run `npx playwright install chromium` once.
2. In `helpers.ts`, add these helpers:
   - `openStart(page, theme)`: `page.emulateMedia({ colorScheme: theme })`, then go to `/`, then wait for `networkidle`.
   - `openDemo(page, name='ae')`: today, hover `#demoDB` and click `#demo0`. After Task 6.6 it goes through the start view's demo menu, so keep one helper and update it there.
   - `openLocalFiles(page)`: `page.setInputFiles('input[type=file]', ['iframe-demo/msajc003.wav', 'iframe-demo/msajc003_annot.json'])`.
   - `openUrlMode(page)`: `/?audioGetUrl=http://localhost:9000/demoDBs/ae/msajc003.wav&labelGetUrl=http://localhost:9000/demoDBs/ae/msajc003_annot.json&labelType=annotJSON`.
   - `openWs(page)`: enabled when `ARTIC_WS=1`; it starts `node exampleServers/nodeEmuProtocolWsServer.js` and goes to `/?autoConnect=true`.
3. `visual.spec.ts` runs every helper in light and dark. In **capture mode** (env `VISUAL_CAPTURE=1`) it writes PNGs to `test/playwright/__captures__/<phase>/` without asserting. Assertions are switched on in Task 8.2.
4. Capture the baseline now as `__captures__/baseline/`.

**Acceptance:** `VISUAL_CAPTURE=1 npm run test:visual` writes 10 PNGs: 5 scenarios × 2 themes, with WS skipped without the env flag.

**Commit:** `test: add Playwright harness for visual captures`

#### Task 0.2: Vitest bootstrap

**Files:**
- Create: `test/vitest/setup.ts` (jsdom `matchMedia` stub, `localStorage` reset), `test/vitest/smoke.test.ts`
- Modify: `vitest.config.ts` (`setupFiles`), `package.json` (`"test": "npm run test:jest && npm run test:vitest"`)

**Acceptance:** `npm test` runs both suites, and the existing Jest suite is unchanged and green.

**Commit:** `test: bootstrap vitest suite`

#### Task 0.3: Assets and decisions (non-code, run in parallel)

- Ask Språkbanken communications (the contact named in the communication repository README) to approve the logo and tagline (decision 1) and the text-safe colour variants (decision 6).
- Obtain the Umeå universitet and Humlab logos as SVG in light and dark variants, following Umeå universitet's graphic profile. Store them in `src/assets/brand/`.
- Agree decision 5 (chrome level) with the Visp and reindeer maintainers.
- Track these as checkboxes in the PR description of PR F.

---

### Phase 1 — Foundation

#### Task 1.1: Token module and CSS injection

**Files:**
- Create: `src/core/theme/tokens.ts`, `src/core/theme/css.ts`, `src/core/theme/contrast.ts`, `test/vitest/theme/contrast.test.ts`, `test/vitest/theme/css.test.ts`
- Modify: `src/svelte-app/main.ts`, `index.html`

**Steps:**
1. Implement `tokens.ts` with the values in Appendix A. Implement `css.ts` (§3.2) and `contrast.ts` (`relativeLuminance`, `contrastRatio`).
2. In `main.ts`, before `mount()`:
   ```ts
   import { tokensToCss } from '../core/theme/css';
   const tokenStyle = document.createElement('style');
   tokenStyle.id = 'sb-tokens';
   tokenStyle.textContent = tokensToCss();
   document.head.prepend(tokenStyle);
   ```
3. In `index.html`, add `<meta name="color-scheme" content="light dark">` and `<meta name="theme-color" content="#FFFFFF">`. Add a tiny inline `<style>` that sets `html{background:#fff}` and `@media (prefers-color-scheme:dark){html{background:#1E1E1E}}`, to avoid a white flash before JS runs.
4. `contrast.test.ts` asserts every pair in Appendix A's contrast table for both themes. Text pairs must reach 4.5 and UI/graphic pairs 3.0.
5. `css.test.ts` snapshots `tokensToCss()` and asserts that every semantic key appears in both theme blocks.

**Acceptance:** Tests are green, and the app looks the same except where legacy semantic aliases now resolve to new values. That partial change is expected.

**Commit:** `feat(theme): add Språkbanken design tokens and CSS variable injection`

#### Task 1.2: ThemeService

**Files:**
- Create: `src/core/services/theme.service.ts`, `src/svelte-app/stores/theme.svelte.ts` (a reactive `currentTheme()`), `test/vitest/theme/theme-service.test.ts`
- Modify: `src/core/util/safe-storage.ts` (add `safeRemoveItem`), `src/core/services/config-provider.service.ts` (delegate the theme methods), `src/svelte-app/stores/services.ts` (register as tier 0 and subscribe `invalidate`), `src/svelte-app/main.ts` (call `themeService.init()` before mount), `src/svelte-app/App.svelte` (remove `configProviderService.initTheme()`)

**Tests:**
- Default `system` follows a mocked `matchMedia`, and a `change` event flips `data-theme`.
- A stored `light` wins over the OS setting.
- `setPreference('system')` removes the key.
- The URL `?theme=dark` applies without persisting.
- Storage that throws falls back to `system`.
- `getTheme()` and `setTheme()` on ConfigProviderService still work.

**Commit:** `feat(theme): ThemeService with system/light/dark preference`

#### Task 1.3: Fonts

**Files:**
- Create: `scripts/fonts/build-noto-sans-ipa.py`, `scripts/fonts/README.md`, `src/assets/fonts/ArticNotoSans-400.woff2`, `src/assets/fonts/ArticNotoSans-600.woff2`, `src/assets/fonts/OFL-NotoSans.txt`, `src/styles/fonts.css`, `src/core/theme/fonts.ts`
- Modify: `package.json` (dependencies `@fontsource-variable/jost` ^5.3.0 and `@fontsource/noto-serif` ^5.3.0), `src/svelte-app/main.ts` (font imports come first, then call `ensureFontsLoaded().then(invalidate)`)

**Steps:**
1. The build script is dev-only and needs Python with `fonttools` and `brotli`. It takes its source from `google/fonts`, file `ofl/notosans/NotoSans[wdth,wght].ttf` (OFL). It was prototyped as:
   ```bash
   python -m fontTools.varLib.instancer "NotoSans[wdth,wght].ttf" wdth=100 wght=400 -o NotoSans-400.ttf
   python -m fontTools.subset NotoSans-400.ttf \
     --unicodes="U+0000-024F,U+0250-02FF,U+0300-036F,U+0370-03FF,U+1AB0-1AFF,U+1D00-1DBF,U+1DC0-1DFF,U+1E00-1EFF,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+25CC,U+2C60-2C7F,U+A700-A7FF" \
     --layout-features='*' --flavor=woff2 --output-file=ArticNotoSans-400.woff2
   # same with wght=600
   ```
   The measured outputs were 99,860 B (400) and 106,884 B (600). Record the source commit or tag in `scripts/fonts/README.md`.
2. The script ends with a **coverage assertion**. It loads the woff2, checks the IPA chart letters, the diacritics (U+0325 030A 032C 0324 0330 033C 032A 033A 033B 0303 031A 0339 031C 031F 0320 0308 033D 0329 032F 0318 0319 031D 031E 0334 0361 035C 0300 0301 0302 0304 030B 030C 030F 1DC4 1DC5 1DC8), the tone letters (U+02E5–02E9), ꜛꜜ and ⁿ, and exits non-zero if any are missing.
3. Font imports at the top of `main.ts`, as plain CSS imports that Vite resolves from `node_modules`:
   ```ts
   import '@fontsource-variable/jost/wght.css';          // family "Jost Variable"; latin, latin-ext, cyrillic via unicode-range
   import '@fontsource/noto-serif/latin-400.css';
   import '@fontsource/noto-serif/latin-ext-400.css';
   import '@fontsource/noto-serif/latin-400-italic.css';
   import '@fontsource/noto-serif/latin-700.css';
   import '@fontsource/noto-serif/latin-ext-700.css';
   import '../styles/fonts.css';
   ```
   `src/styles/fonts.css`:
   ```css
   @font-face { font-family: 'Artic Noto Sans'; font-weight: 400; font-display: swap;
     src: url('../assets/fonts/ArticNotoSans-400.woff2') format('woff2'); }
   @font-face { font-family: 'Artic Noto Sans'; font-weight: 600; font-display: swap;
     src: url('../assets/fonts/ArticNotoSans-600.woff2') format('woff2'); }
   ```
   These are relative URLs, so Vite hashes them and respects the base path. The Jest `moduleNameMapper` already stubs `.css` and `.woff2`.
4. `ensureFontsLoaded()` runs `Promise.race([Promise.all([document.fonts.load('400 1rem "Artic Noto Sans"', 'ʃ̩'), document.fonts.load('600 1rem "Artic Noto Sans"'), document.fonts.load('500 1rem "Jost Variable"')]), timeout(1500)])`.

**Acceptance:**
- In a Playwright check, `document.fonts.check('1rem "Artic Noto Sans"', 'ʃ̩ ŋ̊ ɛ̃ t͡s')` is true.
- `npm run build` emits two ArticNotoSans woff2 files and Jost woff2 files.

**Commit:** `feat(fonts): bundle Jost, Noto Serif and IPA-complete Noto Sans subset`

#### Task 1.4: Typography and base styles

**Files:**
- Create: `src/styles/base.scss`
- Modify: `src/svelte-app/main.ts` (import `base.scss` after the tokens), `src/styles/font.scss`, `src/styles/text.scss`, and every SCSS/Svelte file with `font-size: …px` (12 occurrences) or `font-family`

**Steps:**
1. `base.scss` covers the following:
   - `body { font-family: var(--sb-font-ui); color: var(--sb-text); background: var(--sb-surface); }`. Do **not** set a base font-size.
   - The heading scale from §3.4.
   - `.sb-data { font-family: var(--sb-font-data); font-size: calc(var(--sb-noto-scale) * 1em); }`
   - `.sb-prose { font-family: var(--sb-font-body); font-size: calc(var(--sb-noto-scale) * 1rem); line-height: 1.6; }`
   - The `:focus-visible` ring, and `@media (prefers-reduced-motion: reduce)`.
2. Rewrite `font.scss` so that the legacy classes map to roles: `.artic-font-small` → UI `--sb-size-sm`, `.artic-font-large` → `--sb-size-md`, `.artic-font-input` → `--sb-font-data` at `--sb-size-sm`, and `.artic-font-code` → `--sb-font-code`. Mark them deprecated, because Phase 6 replaces them.
3. `text.scss` (help content, `.artic-text`) uses the `.sb-prose` rules. Its headings use Jost. Remove the `!important` 16px rules.
4. Replace all px font sizes with rem tokens.

**Acceptance:** `rg "font-size:\s*[0-9.]+px" src --glob '!src/core/theme/**'` returns nothing. Arial and HelveticaNeue are gone from `src/styles`.

**Commit:** `style: typography roles with Jost, Noto Sans and Noto Serif in rem`

#### Task 1.5: Token lint guard

**Files:**
- Create: `scripts/lint-tokens.mjs`, `scripts/lint-tokens.allow.json`
- Modify: `package.json` (`"lint:tokens": "node scripts/lint-tokens.mjs"`)

**Behaviour:**
- Scan `src/**/*.{scss,svelte,ts,js}` for hex colours, `rgb()`/`rgba()`/`hsl()`, `font-family:` literals and `font-size: Npx`.
- Skip `src/core/theme/**`, `src/demoDBs/**`, `src/configFiles/**`, `src/schemaFiles/**`, `src/core/workers/spectro-drawing.worker.js` (default heat-map anchors are data) and the allow-list entries, for example `view-state.service.ts` `getColorOfAnchor`.
- Report-only (exit 0) until Task 6.12, then strict.

**Commit:** `chore: add token lint guard (report mode)`

---

### Phase 2 — Canvas theming

#### Task 2.1: Canvas style module

**Files:**
- Create: `src/core/theme/canvas-style.ts`, `test/vitest/theme/canvas-style.test.ts`
- Modify: `src/core/util/styles.ts` (becomes a deprecated shim that re-exports `motion.period` as `animationPeriod`; colour and font fields are removed as consumers migrate)

```ts
export function getCanvasStyle() {
	const theme = themeService.resolved;
	const root = typeof document !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16;
	const px = (rem: number) => Math.round(rem * root);
	return {
		theme,
		color: canvas[theme],
		px,
		size: { xs: px(typography.size.xs), sm: px(typography.size.sm), md: px(typography.size.md) },
		family: { data: typography.fontData, ui: typography.fontUi },
		font: {
			data: (sizePx: number, weight = 400) => `${weight} ${sizePx}px ${typography.fontData}`,
			ui: (sizePx: number, weight = 500) => `${weight} ${sizePx}px ${typography.fontUi}`,
		},
	};
}
```

**Tests:** It returns light or dark palettes according to `themeService`, and `px()` scales with a mocked root font size.

**Commit:** `feat(theme): canvas style accessor`

#### Task 2.2: Migrate renderers

**Files (modify):** `src/core/services/draw-helper.service.ts`, `Level.svelte`, `LevelCanvasMarkup.svelte`, `SignalCanvasMarkup.svelte`, `Spectrogram.svelte`, `OsciOverview.svelte`, `SsffCanvas.svelte`, `SsffTrack.svelte`, `DotsCanvas.svelte`, `EpgGridCanvas.svelte`, `EmuHierarchy.svelte`, `HierarchyPathCanvas.svelte`, `TwoDimPanel.svelte`, `src/core/services/view-state.service.ts` (spectro `invertSource`), `Settings.svelte` (mark `invertSource = 'user'` when the user toggles invert)

**Steps:**
1. Work file by file through the **worksheet in Appendix C**. Each line lists the old reference and the new token.
2. Replace the three `CONTOUR_COLORS` copies with `cs.color.contours`.
3. `Spectrogram.showRenderingOverlay` fills with `cs.color.bg` and writes in `cs.color.textMuted`. This fixes D2.
4. `OsciOverview`: remove the inline `background:#000; border:1px solid gray`, and use the `.artic-preview-canvas` class with tokens.
5. Hierarchy canvases use `cs.color.hierarchy.*`.
6. After each file, run `npm test`, then capture `demo ae` and `demo ema` in both themes and look at them.

**Acceptance:** `rg "styles\.(color|font)" src` returns nothing. In light theme, labels, boundaries, signals and times are legible in `ae`, `ema` and `epgdorsal`.

**Commit:** `fix(theme): theme-aware canvas rendering (light theme legible)`

#### Task 2.3: Redraw on theme change

**Files (modify):** `src/svelte-app/stores/services.ts`, `Spectrogram.svelte` (settings key includes the resolved theme when `invertSource === 'theme'`), `EmuHierarchy.svelte` (subscribe and redraw)

**Acceptance:** A Playwright test toggles the theme via `page.evaluate(() => themeService.setPreference('dark'))`. All canvases change without a reload.

**Commit:** `feat(theme): redraw canvases on theme change`

---

### Phase 3 — Icons

#### Task 3.1: Icon component and registry

**Files:**
- Create: `src/svelte-app/components/ui/Icon.svelte`, `src/svelte-app/components/ui/icons.ts`, `test/vitest/ui/icon.test.ts`
- Modify: `package.json` (dependency `@fortawesome/free-solid-svg-icons` ^7.3.1)

```svelte
<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	let { icon, label = undefined, class: cls = '' }: { icon: IconDefinition; label?: string; class?: string } = $props();
	const [w, h, , , path] = icon.icon;
	const d = Array.isArray(path) ? path.join(' ') : path;
</script>
<svg class="sb-icon {cls}" viewBox="0 0 {w} {h}" fill="currentColor" height="1em"
	aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label}>
	<path {d} />
</svg>
```

**Tests:** Without a label, `aria-hidden="true"` is set. With a label, `role="img"` and the `aria-label` are present. `viewBox` comes from the definition.

**Commit:** `feat(ui): Font Awesome icon component`

#### Task 3.2: Replace Material Icons and glyphs

**Files:**
- Modify: `TopMenu.svelte`, `BottomMenu.svelte`, `BundleListSidebar.svelte`, `PerspectivesSidebar.svelte`, `NewVersionHint.svelte`, `ToastNotification.svelte`, `modals/HierarchyModal.svelte`, `src/styles/artic.scss` (delete the Material Icons `@font-face` and `.material-icons`), `package.json` (remove `material-design-icons` and `@material/button`)
- Delete: `src/fonts/` (D7)

**Steps:**
1. Replace each icon according to Appendix B. Also replace these glyphs:
   - `&#9664;`/`&#9654;` (time anchors) → `backward-step`/`forward-step`
   - `#artic-dropdown-arrow` ▸/▾ → `chevron-right`/`chevron-down`
   - the 🔍 placeholder → `filter` icon plus text
   - × (toast) → `xmark`
   - ↻ (hierarchy rotate) → `arrow-rotate-right`
   - ⇧ (about hint) → `circle-info`
2. Credit Font Awesome Free (icons CC BY 4.0, code MIT) in the About tab (Task 6.7) and in `docs/THIRD-PARTY-NOTICES.md` (create it).

**Acceptance:** `rg "material-icons|MaterialIcons" src` returns nothing. After `npm run build`, `dist/assets` has no MaterialIcons files, which saves 373 kB.

**Commit:** `refactor(ui): replace Material Icons with Font Awesome`

---

### Phase 4 — Data-source modes and behaviour fixes (PR A, can go first)

#### Task 4.1: DataSourceService

**Files:**
- Create: `src/core/services/data-source.service.ts`, `test/vitest/modes/data-source.test.ts`
- Modify: `src/svelte-app/stores/services.ts` (register it and inject `DataSourceService` into `DragnDropService`, `AppStateService` and `HandleGlobalKeystrokesService`), `src/core/services/drag-n-drop.service.ts` (`handleLocalFiles` → `set('local')`), `src/core/services/app-state.service.ts` (`resetToInitState` → `set('none')`), `src/svelte-app/App.svelte` (`handleConnectedToWSserver` → `set('server')`; `loadFilesForEmbeddedApp` → `set('url')`), `src/svelte-app/components/TopMenu.svelte` (`openDemoDB` → `set('demo')`)

**Tests:** The full capability matrix (§3.6), including `canSave` with `activeButtons.saveBundle` true and false, and `reset` returning to `none`.

**Commit:** `feat(modes): track data source and derive capabilities`

#### Task 4.2: Gate UI and shortcuts by capability (fixes D4 and D5)

**Files (modify):** `TopMenu.svelte` (until it is replaced in Task 6.5: show add/rename/download only if the capability allows; show Save only if `canSave`), `BundleListSidebar.svelte` (the per-row save button respects `canSave`), `src/core/services/handleglobalkeystrokes.service.ts` (`[km.saveBndl]` requires `capabilities.canSave`), `src/configFiles/embedded_articConfig.json` and `public/configFiles/embedded_articConfig.json` (set `downloadTextGrid` and `downloadAnnotation` to `false`, documentation only, because capabilities already win)

**Steps:**
1. Reproduce D4 in demo mode: load `ae`, change a boundary and press **S**. Note the result in the PR.
2. Add the gates, and add a vitest that mocks the services: the `saveBndl` handler does not call `saveBundle` when `canSave` is false.

**Acceptance:**
- Online modes never show the add-level, rename or download buttons.
- In local mode they appear.
- **S** does nothing in demo and local mode.

**Commit:** `fix(modes): structure editing and export only in local mode; gate save shortcut`

#### Task 4.3: One dialog when switching bundle (fixes D3)

**Files:**
- Create: `src/svelte-app/components/shell/bundle-switch.ts` with `requestBundleSwitch(bndl)`
- Modify: `BundleListSidebar.svelte` (use `requestBundleSwitch`), `modals/SaveChangesModal.svelte` (buttons depend on `canSave`), `src/core/services/db-obj-load-save.service.ts` (no logic change; keep the `'saveChanges' | 'discardChanges'` results)

**Logic:**
```ts
export function requestBundleSwitch(bndl) {
	const dirty = historyService.movesAwayFromLastSave !== 0;
	if (!dirty || dataSourceService.capabilities.canSave) return dbObjLoadSaveService.loadBundle(bndl); // service shows SaveChanges when needed
	return modalService.open('views/saveChanges.html', bundleLabel(curBndl)).then((res) => {          // same dialog, discard-only variant
		if (res === 'discardChanges') { historyService.resetToInitState(); return dbObjLoadSaveService.loadBundle(bndl); }
	});
}
```

**SaveChanges dialog:** it has a warning icon. With `canSave`, the buttons are **Save and continue** (primary), **Discard changes** (danger) and **Cancel**. Without `canSave`, they are **Discard changes and continue** (danger) and **Cancel**. In local mode it also has a secondary **Export first** button, which opens the export menu and keeps the current bundle.

**Tests:** `dbObjLoadSaveService.spec.js` stays green. A new vitest covers `requestBundleSwitch` for clean, dirty with save, and dirty without save.

**Commit:** `fix(ui): single unsaved-changes dialog when switching bundle`

#### Task 4.4: Local-mode safety

**Files (modify):** `modals/ExportModal.svelte` (after a successful download in local mode, `historyService.movesAwayFromLastSave = 0` and `invalidate()`), `App.svelte` (`onBeforeUnload` must cover local mode: check the current condition with dropped files and extend it if needed)

**Acceptance:** In local mode, editing and then closing the tab warns. Exporting clears the unsaved dot.

**Commit:** `feat(modes): export counts as saved in local mode`

---

### Phase 5 — i18n core

#### Task 5.1: i18n module

**Files:**
- Create: `src/core/util/i18n.ts`, `src/svelte-app/stores/i18n.svelte.ts`, `src/i18n/en.json`, `src/i18n/sv.json` (seeded with the keys the shell needs in Phase 6), `test/vitest/i18n/i18n.test.ts`
- Modify: `src/svelte-app/main.ts` (`setLanguage(detectLanguage(), false)` before mount), `tsconfig.json` (`resolveJsonModule`, if needed)

**Tests:**
- **Key parity:** every key in `en` exists in `sv` and vice versa.
- Interpolation works.
- A missing key falls back to `en` and then to the key.
- `?lang=sv` wins without persisting.
- `navigator.language = 'sv-SE'` gives `sv`.
- `document.documentElement.lang` is updated.

**Commit:** `feat(i18n): framework-agnostic translations with sv/en`

---

### Phase 6 — App shell (PR F1: 6.1–6.5, PR F2: 6.6–6.12)

#### Task 6.1: UI primitives

**Files (create):** `ui/Button.svelte`, `ui/IconButton.svelte`, `ui/Menu.svelte`, `ui/Field.svelte`, `ui/Badge.svelte`, `src/styles/ui.scss`, `test/vitest/ui/menu.test.ts`

**Variants (tokens only):**

| Component | Look |
|---|---|
| `Button variant="default"` | Transparent, icon in `--sb-interactive`, text `--sb-text`. Hover gives `--sb-interactive-tint`. |
| `variant="primary"` (next step) | Fill `--sb-brand-strong`, text `--sb-on-fill`, weight 600 |
| `variant="danger"` | 1px `--sb-danger` border with `--sb-danger-text` text. Hover gives `--sb-danger-tint`. |
| `variant="outline"` | 1px `--sb-interactive` border |

- Sizes: `md` is 2.1rem high and `sm` is 1.9rem.
- Disabled buttons use `--sb-text-muted` with a dashed `--sb-border`.
- `Menu` has a trigger button and a popover list with `role="menu"`. Arrow keys move, Enter selects, Escape closes, an outside click closes, and it sets `viewStateService.menuOpen = true` while open (used in Task 8.1).
- `Field` has `mode="readonly" | "button"`, a small uppercase label (`--sb-size-xs`, 500) and a value in `--sb-font-data`.
- `Badge` has `tone="warning"` (`--sb-warning-tint` background, `--sb-warning` border, `--sb-on-warning` text, 600) and an optional icon.

**Commit:** `feat(ui): button, menu, field and badge primitives`

#### Task 6.2: Logo and brand assets

**Files:**
- Create: `src/assets/brand/artic-symbol.svg` (the existing snowflake geometry from `public/assets/artic_crystal_icon_light.svg`, all strokes and the centre in `#F0581A`), `shell/Logo.svelte`
- Modify: `public/assets/artic_favicon.svg` and the PNG favicons (regenerate with `public/assets/genEmuIcons.sh`, adapted), `index.html` (`<title>Artic</title>`; keep the favicon links relative)

**Logo.svelte:**
- The inline symbol SVG in `--sb-brand`.
- "Artic" in Jost 300 at 2rem.
- The tagline `tr('header.tagline')` in Jost 500 at 0.8rem.
- The wordmark uses `currentColor`, so it follows `--sb-text` in dark mode.
- The whole logo is a link to the start view (see Task 6.3).
- Props: `size="header" | "hero"`.

**Commit:** `feat(brand): Artic tool logo in Språkbanken style`

#### Task 6.3: AppHeader and DataSelector

**Files:**
- Create: `shell/AppHeader.svelte`, `shell/DataSelector.svelte`, `test/vitest/shell/data-selector.test.ts`
- Modify: `App.svelte` (render `AppHeader` above the toolbar), `src/styles/artic.scss` (layout grid)

**Layout:** a grid of `1fr auto 1fr`, 4rem high, `--sb-surface` background, a 1px `--sb-border` bottom border. The logo is on the left, `DataSelector` in the centre and `HeaderMenu` on the right. Below 1100px, hide the tagline and the "n of m" count.

**DataSelector contents:**
1. In local mode, a `Badge` "Local mode" with a `triangle-exclamation` icon and the tooltip `tr('dataSelector.localModeHint')`.
2. `Field readonly` Database. Its value is the database name (`configProviderService.curDbConfig.name`, the demo name, or `tr('dataSelector.localFiles')`). In the start view it shows `tr('dataSelector.noDatabase')` in `--sb-text-muted`.
3. `Field button` Session / bundle shows `session / name` in `--sb-font-data`. An orange unsaved dot (`aria-label`) appears when dirty, and there is a `chevron-down`. Clicking it toggles `BundleListSidebar` through the existing `viewStateService.toggleBundleListSideBar`. The button has the ID `bundleListSideBarOpen`. It is disabled when `disableBundleListSidebar` is set.
4. The action slot:
   - With `canSave`: **Save**, `floppy-disk`, primary when dirty and default otherwise, tooltip `tr('dataSelector.saveTooltip', { name, key: 'S' })`.
   - With `canExport`: **Export ▾**, a `Menu` with TextGrid and annotJSON (the functions from `toolbar-actions.ts`), primary when dirty.
5. Navigation: `backward-fast`, `backward`, `forward` and `forward-fast` move to the first, previous, next or last bundle in `loadedMetaDataService.getBundleList()` order, through `requestBundleSwitch`. They are disabled at the ends. Then comes "n of m" in `--sb-font-data` / `--sb-text-muted`.

**Logo click:** confirm with the close dialog (Task 6.9). On confirm, call `appStateService.resetToInitState()`. The logo is inactive in the start view.

**Tests:** The database is never a button. The action is Save, Export or nothing per capability. Navigation is disabled at the list ends.

**Commit:** `feat(shell): header with logo and data selector`

#### Task 6.4: HeaderMenu (user, theme, language, info)

**Files:**
- Create: `shell/HeaderMenu.svelte`, `shell/ThemeMenu.svelte`, `shell/LanguageMenu.svelte`
- Modify: `modals/LoginModal.svelte` (on success, store `loadedMetaDataService.currentUser = username`), `TopMenu.svelte` (remove the About image button; this fixes D6)

**Contents, left to right:**
1. The **user**: shown only after a successful login during connect, as the `user` icon plus the name in `--sb-font-data`. There is **no** standalone "Log in" button: in this protocol, login is requested by the server during connect (`GETDOUSERMANAGEMENT`).
2. The **theme menu**: `IconButton` `circle-half-stroke` with the options System, Light and Dark (`menuitemradio`).
3. The **language menu**: `globe` plus the current language name, with Svenska and English. It is functional after Task 5.1.
4. **Info**: `IconButton` `circle-info` with the ID `aboutBtn`. It opens the Help modal on the About tab.

**Commit:** `feat(shell): header menu with theme and language`

#### Task 6.5: Toolbar (replaces TopMenu)

**Files:**
- Create: `shell/Toolbar.svelte`, `shell/toolbar-actions.ts`, `test/vitest/shell/toolbar.test.ts`
- Delete: `TopMenu.svelte` (after moving its logic)
- Modify: `App.svelte`

**Groups, left to right:**
1. **Local mode only:** `plus` "Segment level" and `plus` "Event level" (IDs as before where they exist), then `pen` "Rename level".
2. Separator.
3. `sitemap` "Hierarchy" (`#showHierarchy`, when `activeButtons.showHierarchy`) and `magnifying-glass` "Search" (when `activeButtons.search`).
4. Separator.
5. `gear` "Settings" (`#spectSettingsBtn`, when `activeButtons.specSettings`).
6. Spacer.
7. `right-from-bracket` with the close label (`#clear`, when `activeButtons.clear`), danger variant.

- Height 2.9rem, `--sb-surface-2` background, `--sb-border` bottom border.
- Below 1200px the labels are visually hidden, with the `aria-label` and `title` kept.

**Tests:** It renders exactly the expected buttons for local, demo, server and url.

**Commit:** `feat(shell): toolbar with mode-gated actions`

#### Task 6.6: StartView

**Files:**
- Create: `shell/StartView.svelte`
- Modify: `BundleListSidebar.svelte` (remove the drop-zone branch), `DropZone.svelte` (tokens: `--sb-interactive-tint` background and a 2px dashed `--sb-interactive` border), `App.svelte` (render `StartView` instead of the canvas area when `capabilities.showStartView`), `test/playwright/helpers.ts` (`openDemo` goes through the start view)

**Contents:**
- The hero `Logo` symbol and the heading `tr('start.title')` in Jost 300 at about 2.6rem.
- The lead `tr('start.lead')` in `.sb-prose`.
- Three cards:
  - **Open files** (next step): a 2px `--sb-brand` border and a primary button "Choose files" that opens the hidden `<input type=file multiple accept=…>` (the same accept list as today). The whole start view is a drop target calling `dragnDropService.handleDrop`.
  - **Demo database**, when `activeButtons.openDemoDB`: an outline `Menu` with `vals.demoDBs` (plus `devDemoDBs` in dev) that calls `toolbar-actions.openDemoDb(name)`. Keep the `#demoDB` and `#demo{i}` IDs on the trigger and the items.
  - **Connect to server**, when `activeButtons.connect`: an outline button that opens the Connect dialog.
- Below the cards: `AppFooter` when `chrome === 'full'`.

**Commit:** `feat(shell): start view replaces sidebar drop zone`

#### Task 6.7: AppFooter and About tab

**Files:**
- Create: `shell/AppFooter.svelte`, `shell/AboutTab.svelte`
- Modify: `modals/HelpModal.svelte` (tab titles via `tr`, plus a fourth tab "About" that renders `AboutTab`)

**Footer (profile structure):**
- **Left:** the Språkbanken logo (`sprakbanken_logo.svg` from the communication repository, copied to `src/assets/brand/`), linked to `https://sprakbanken.se/`. Links: About us → `https://sprakbanken.se/om`, News from Språkbanken → `https://sprakbanken.se/aktuellt`, Other platforms → `https://sprakbanken.se/plattformar`.
- **Centre:** "Använder du våra plattformar, datamängder eller analyser i ditt arbete? Då vill vi gärna höra från dig!", with Contact us → `https://sprakbanken.se/kontakt` and Cite us → `https://sprakbanken.se/om/referera-till-oss`.
- **Right:** the Umeå universitet and Humlab logos, linked to their sites. Pick the right variant for the theme.
- The profile gives Swedish texts only. Translate them for `en`. Use English page URLs only after checking that they exist.

**About tab:**
- The footer block.
- Version (`package.json`), `__BUILD_TIME__` and `__GIT_SHA__`.
- Credits: EMU-webApp origin (IPS-LMU) and the Humlab fork.
- Licences: Artic MIT; Jost* OFL; Noto Sans and Noto Serif OFL; Font Awesome Free (icons CC BY 4.0, code MIT).

**Commit:** `feat(shell): Språkbanken footer and About tab`

#### Task 6.8: Restyle sidebars, bottom bar and small components

**Files (modify):** `BundleListSidebar.svelte` + `bundleListSideBar.scss`, `PerspectivesSidebar.svelte` + `rightSideMenu.scss`, `BottomMenu.svelte`, `OsciOverview.svelte`, `SplitPane.svelte` + `splitPanes.scss`, `ProgressBar.svelte` + `progressBar.scss`, `ToastNotification.svelte`, `HistoryActionPopup.svelte` + `historyActionPopup.scss`, `NewVersionHint.svelte` + `aboutHint.scss`, `LargeTextFieldInput.svelte` + `largeTextInputField.scss`, `Level.svelte` (attribute-definition buttons), `src/styles/button.scss` (`.artic-label-edit`), `src/core/services/handleglobalkeystrokes.service.ts` (label-edit validity: replace inline `rgba(255,255,0,1)` / `rgba(255,0,0,1)` with toggling `.is-valid` / `.is-invalid` classes)

**Specs:**

| Component | Spec |
|---|---|
| Bundle list | `--sb-surface-2` background. Heading "Bundles" in small caps. Filter field with a `filter` icon. Session rows with a `chevron-right`/`chevron-down` and the name in `--sb-font-data` 600. Bundle rows in `--sb-font-data`. The current bundle has a `--sb-interactive-tint` background, a 3px `--sb-interactive` left border and 600 weight. The unsaved dot is `--sb-brand`. The per-row save button is removed, because Save lives in the data selector. Time anchors: `backward-step`/`forward-step` and "Anchor n/m". The footer line shows `lock`/`lock-open` with "Read-only"/"Editable", derived from `restrictions.editItemName \|\| editItemSize \|\| addItem \|\| deleteItem`. |
| Perspectives | `layer-group` trigger, list items in Jost, current item with the tint and left border. |
| Bottom bar | `--sb-surface-2`. The overview canvas has a `--sb-border` frame, the viewport rectangle is 2px `--sb-interactive`, the signal is `canvas.signal`. Buttons use the `Button` default variant with icons from Appendix B; "Play view" uses the outline variant. A new right-aligned selection readout (`--sb-font-data`, muted) shows "Selection 0.740–0.893 s (153 ms)". |
| Split pane | Handle `--sb-surface-2` with a `grip-lines` icon. Hover gives `--sb-interactive-tint`. |
| Progress bar | Overlay `--sb-overlay`, card `--sb-surface`, bar `--sb-interactive`, text `--sb-text`. |
| Toasts, history popup, new-version hint | Variants info (`circle-info`, interactive), success (`circle-check`, green), warning (`triangle-exclamation`, yellow tint) and error (`circle-exclamation`, red). Close with `xmark`. |
| Label edit field | `--sb-surface` with a 2px `--sb-interactive` border. Invalid: `--sb-danger-tint` with a 2px `--sb-danger` border. |
| Level attribute buttons | Round 0.75rem dots. The current one is `--sb-interactive`, the others `--sb-border-control`. |

**Commit:** `style: restyle sidebars, bottom bar and feedback components`

#### Task 6.9: Modal shell and dialogs

**Files (modify):** `src/styles/modal.scss` (rewrite), `Modal.svelte`, all 13 remaining dialogs in `components/modals/`, `src/core/services/modal.service.ts` (an optional `{ variant: 'danger' | 'primary' }` for confirm dialogs)

**Shell:**
- `--sb-overlay` backdrop.
- Dialog sizes `sm` (28rem), `md` (40rem) and `lg` (min(70rem, 92vw)), replacing the uniform 84% × 90%.
- White header with the title in Jost 400 at 1.25rem and an `xmark` close button.
- Body padding 1.5rem.
- Footer buttons right-aligned.
- Focus is trapped inside the dialog, and Escape cancels.

| Dialog | Size | Icon | Buttons (left → right) |
|---|---|---|---|
| Error | sm | `circle-exclamation` (danger) | **Close** |
| Confirm (generic) | sm | none | **Cancel**, **Confirm**: danger variant for close/disconnect and discard, otherwise primary |
| Save changes | sm | `triangle-exclamation` (warning) | Task 4.3 |
| Connect | md | `plug` | **Cancel**, **Connect** (primary). The saved-URL list is a styled listbox. (+)/(−) become `plus` and `trash-can` icon buttons with labels. |
| Login | sm | `user` | **Cancel**, **Log in** (primary). Errors in `--sb-danger-text` with an icon. |
| Rename level (local) | sm | `pen` | **Cancel**, **Rename** (primary) |
| Export (local) | lg | `file-export` | **Cancel**, **Download** (primary). Preview in `--sb-font-code` on `--sb-surface-2`. |
| Search | lg | `magnifying-glass` | **Close**, **Save results as anchors** (primary). Results table in `--sb-font-data`. Sort icons `chevron-down`/`chevron-up` only if sorting is added later. |
| Settings | lg | `gear` | **Cancel**, **Save** (primary). Validation errors use the `.sb-field-error` class instead of inline `#f00` (9 places). |
| Hierarchy | lg | `sitemap` | Play selection, Viewport sync (toggle), Rotate (`arrow-rotate-right`), **Close** |
| Help | lg | `circle-info` | Tabs Introduction, Keys, Manual, About; body `.sb-prose`; **Close** |
| SelectLabel, SelectThreshold | sm | none | **Cancel**, **OK** (primary) |
| LoadFiles | n/a | n/a | Delete the component and the route (D7). |

Keep the IDs `modalCancelBtn`, `artic-modal-cancel`, `artic-modal-confirm`, `artic-modal-save`, `artic-error-text`, `modalHeading`, `artic-selection` and `tabs`.

**Commit:** `style: Språkbanken modal shell and semantic dialog buttons`

#### Task 6.10: Chrome levels

**Files (modify):** `src/schemaFiles/articConfigSchema.json` and `public/schemaFiles/articConfigSchema.json` (`main.chrome: { "enum": ["full", "embedded", "toolbar"] }`), `config-provider.service.ts` (`getChrome()`: URL, then config, then `full`), `AppHeader.svelte`, `Toolbar.svelte` (hosts the compact `DataSelector` and the icon-only menu when `toolbar`), `StartView.svelte`, `iframe-demo/index.html` (add a chrome selector)

**Acceptance:** `?chrome=embedded` and `?chrome=toolbar` render per §3.7. Capture screenshots of all three levels.

**Commit:** `feat(shell): chrome levels for embedding hosts`

#### Task 6.11: Document shell, print and meta

**Files (modify):**
- `index.html`: keep `lang` in sync from i18n (runtime). Keep the meta tags added in Task 1.1. Make the favicon links relative.
- `src/styles/print.scss`: light tokens and no chrome; print only the canvases and the `printTitle`.
- `App.svelte`: the `printTitle` uses `tr`.

**Commit:** `chore: document meta, print styles`

#### Task 6.12: Remove legacy styling

**Files:**
- Delete: `src/styles/intro.scss`, `src/styles/artic-design.scss.d.ts`, `src/core/util/styles.ts` (once nothing imports it), the `:export` block and the `--color-*` variables in `artic-design.scss` (delete the file once empty), `media-query.scss` (mini-button widths), unused classes in `button.scss` and `text.scss`, `public/img/*.svg` (D7), `components/modals/LoadFilesModal.svelte`
- Modify: `main.ts` (drop the second `modal.scss` import and the deleted files), `css.ts` (drop the legacy alias block), `scripts/lint-tokens.mjs` (strict mode)

**Acceptance:** `npm run lint:tokens` exits 0 in strict mode. `rg "var\(--(color|bg|text|accent|border|input|scrollbar)-" src` returns nothing.

**Commit:** `refactor(styles): remove legacy design variables and dead styles`

---

### Phase 7 — Translation pass

#### Task 7.1: Extract and translate the remaining strings

**Files (modify):**
- All components with English literals: about 140 text nodes and 12 attributes.
- Services with user-facing text: modal messages (58) and progress texts (20). They are in `App.svelte`, `db-obj-load-save.service.ts`, `drag-n-drop.service.ts`, `io-handler.service.ts`, `app-state.service.ts`, `handleglobalkeystrokes.service.ts`, `websocket-handler.service.ts`, `TopMenu` successors and the modals.
- `src/i18n/en.json`, `src/i18n/sv.json`.

**Rules:**
- Use the glossary in Appendix E.
- Error messages keep technical payloads (JSON dumps) untranslated after a translated lead sentence.
- Help HTML stays in English (decision 8).

**Acceptance:** `rg ">[^<{]*[A-Za-z]{3,}[^<{]*<" src/svelte-app --glob '*.svelte'` lists only allow-listed literals (proper names, units). The parity test is green.

**Commit:** `feat(i18n): Swedish and English UI strings`

#### Task 7.2: Language switching end to end

**Acceptance:**
- Switching between Svenska and English updates the header, toolbar, dialogs and progress texts without a reload.
- `?lang=sv` works for hosts.
- Capture screenshots in both languages.

**Commit:** `feat(i18n): live language switch`

---

### Phase 8 — Accessibility, verification, docs, release

#### Task 8.1: Accessibility pass

**Files:**
- Create: `test/playwright/a11y.spec.ts`
- Modify: `handleglobalkeystrokes.service.ts` (ignore rules from §3.11; suspend shortcuts while `viewStateService.menuOpen` or a modal is open), primitives as needed

**Checks:**
- **Automated:** `@axe-core/playwright` must report zero serious or critical violations on the start view, the work view (local, demo, server) and every dialog. Exclude the `<canvas>` internals with `exclude('canvas')`.
- **Keyboard walkthrough** (record it in the PR):
  1. Tab order goes header, toolbar, sidebar, bottom bar.
  2. Every control shows a focus ring.
  3. Menus open with Enter or Space and close with Escape.
  4. The annotation shortcuts still work after clicking a toolbar button and moving the mouse into the canvas.
  5. Space and Enter on a focused button do not also trigger global shortcuts.

**Commit:** `fix(a11y): focus handling, labels and shortcut suspension`

#### Task 8.2: Visual regression

Switch `visual.spec.ts` from capture mode to `expect(page).toHaveScreenshot()` with `maxDiffPixelRatio: 0.01`. The matrix covers:
- start, local, demo, url and server (`ARTIC_WS=1`)
- light and dark
- `sv` and `en` (start and work views only)
- chrome `full`, `embedded` and `toolbar` (work view, light)

Review the result against the mockups in `docs/plans/2026-10-13-sprakbanken-profile-redesign/` and commit the baselines.

**Commit:** `test: visual regression baselines for the redesign`

#### Task 8.3: Integration checks

| Host or mode | Check |
|---|---|
| reindeer `annotate()` / `review()` (WS) | Run with the new trimmed `dist` (`tools/sync-artic-dist.R`). Save works, anchors work, and there are no structure or export buttons. The `manifest.features` check passes. |
| Visp (iframe) | The chosen `chrome` level renders. Save posts to the parent when `saveToWindowParent=true`. |
| `iframe-demo` | URL mode works with every chrome level. |
| `exampleServers/nodeEmuProtocolWsServer.js` | Connect, the login prompt where configured, save, close and disconnect. |
| Local files | Drop a WAV with a TextGrid and with annotJSON. Add a level, rename it, export both formats, check the unsaved dot and the beforeunload warning. |
| Browsers | Current Chrome, Firefox and Safari: fonts, IPA rendering and canvas colours. |

#### Task 8.4: Documentation and release

**Files (modify):**
- `public/views/helpTabs/{intro,keys,manual}.html` and `src/views/helpTabs/*`: remove references to the crystal button. Describe the info button, Save in the data selector, local mode for export and structure editing, and the theme menu.
- `README.md`: modes, URL parameters (`theme`, `lang`, `chrome`), fonts and licences, test commands.
- `CLAUDE.md`: a "Theming" section (tokens.ts → css.ts → canvas-style.ts; rules from §1), the DataSourceService and the test commands.
- `src/NEWS.md`: the redesign, and the behaviour changes (online modes hide structure editing and export; the theme follows the OS).
- `scripts/emit-manifest.mjs`: add `features` `"dataSourceModes"`, `"theming"`, `"i18n"`, `"chromeLevels"`.
- `package.json`: version `1.5.3-humlab-2.0.0`.
- `docs/THIRD-PARTY-NOTICES.md`: fonts and icons.

**Acceptance:**
- `npm run build` passes.
- `dist/artic-manifest.json` lists the new features.
- `dist/assets` has no Material fonts; record the font sizes in the PR.

**Commit:** `docs: redesign documentation, manifest features and version 2.0.0`

---

## 5. Testing strategy

| Layer | Tool | What | When |
|---|---|---|---|
| Existing services | Jest (`npm run test:jest`) | All current specs stay green. | Every task |
| Tokens and contrast | Vitest | WCAG pairs for both themes; CSS output complete | Phase 1 onward |
| Theme, data source, i18n | Vitest | Preference resolution, capability matrix, key parity, interpolation | Phases 1, 4, 5 |
| Components | Vitest + @testing-library/svelte | Icon, Menu keyboard, DataSelector per mode, Toolbar per mode, SaveChanges variants | Phases 3–6 |
| Fonts | Python (build script) + Playwright | Glyph coverage assertion; `document.fonts.check` with IPA | Task 1.3 |
| Visual | Playwright screenshots | Capture mode in Phases 0–7, assertions in Phase 8 | Each visual PR |
| Accessibility | @axe-core/playwright + keyboard checklist | No serious or critical violations | Phase 8 (spot-check from Phase 6) |
| Integration | Manual + scripted | reindeer, Visp, iframe-demo, WS example server, local files, three browsers | Phase 8 |
| Guard | `npm run lint:tokens` | No colours, fonts or px text outside the theme | Report from Phase 1, strict from Task 6.12 |

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The behaviour change (online modes hide structure editing and export) surprises emuR or EMU-SDMS users whose DB configs enable them | NEWS entry, a manifest feature flag (`dataSourceModes`), and a call-out in the reindeer and Visp release notes. |
| The canvas draws before the fonts arrive (wrong metrics, fallback glyphs) | `ensureFontsLoaded()` gate with a timeout, plus a redraw on `document.fonts.ready`. |
| Hard-coded colours are missed in rarely used views (EPG, 2D, hierarchy) | The Appendix C/D worksheets, the lint guard, and captures of `epgdorsal` and `ema`. |
| Focus rings or menu focus interfere with keyboard-driven annotation | §3.11 rules, Task 8.1 walkthrough, menus suspend shortcuts. |
| Språkbanken rejects the text-safe variants (decision 6) or changes the logo (decision 1) | Both are isolated: two token values and `Logo.svelte`. |
| The profile's "frontend" section is WIP (dropdowns, links, workflows) | All such patterns are in `ui/` primitives, so they can be swapped centrally. |
| jsdom cannot test canvas output | Canvas correctness is covered by Playwright captures. Unit tests cover the palette selection logic. |
| Bundle-size growth from fonts | Measured: Artic Noto Sans is about 100 kB and 107 kB, Jost 27–44 kB, Noto Serif loaded only by help text, against 373 kB of Material files removed (44 kB woff2 actually fetched). |
| The decision 5 outcome needs UI changes late | The `chrome` levels are implemented up front, so the decision only sets a parameter. |

## 7. Definition of done (whole project)

- [ ] Every row of the decision table (§0) is implemented, or explicitly parked with its owner named.
- [ ] Light and dark themes are both legible in every mode. The default follows the OS, and the theme menu persists a choice.
- [ ] Jost, Artic Noto Sans and Noto Serif are used per §3.4. No px font sizes remain. IPA renders correctly.
- [ ] Font Awesome only; no Material Icons in the source or in `dist`.
- [ ] Header, toolbar, start view and footer follow the mockups. The footer is hidden in the work view.
- [ ] Local mode alone shows add level, rename level and export. Save sits in the data selector and acts on the open bundle.
- [ ] Swedish and English UI with live switching; the manual is in English.
- [ ] WCAG 2.1 AA checks pass (Task 8.1). Visual baselines are committed. Integration checks are done.
- [ ] Docs, NEWS, manifest features and version are updated.

---

## Appendix A — Token values

**Semantic colours** (contrast measured with the WCAG formula):

| Token | Light | Dark | Use / check |
|---|---|---|---|
| `surface` | #FFFFFF | #1E1E1E | Main surface, header, dialogs |
| `surface-2` | #F2F2F2 | #262626 | Toolbar, sidebars, footer, bottom bar |
| `surface-3` | #E6E6E6 | #333333 | Raised elements, toasts |
| `border` | #D9D9D9 | #3D3D3D | Decorative dividers only |
| `border-control` | #808080 | #7A7A7A | Field and control boundaries (≥3:1: light 3.95 on white and 3.53 on #F2F2F2; dark 3.88 on #1E1E1E and 3.53 on #262626) |
| `text` | #1E1E1E | #F2F2F2 | Text (14.9:1 on #F2F2F2; 13.5:1 on #262626) |
| `text-muted` | #666666 | #A6A6A6 | Muted text (5.7/5.1:1; 6.8/6.2:1) |
| `on-fill` | #FFFFFF | #FFFFFF | Text on `brand-strong` fills |
| `brand` | #F0581A | #F0581A | sborange: logo, cursor, unsaved dot, next-step card border (graphics ≥3:1: 3.43 on white, 4.86 on #1E1E1E) |
| `brand-strong` | #C04615 | #C04615 | Primary button fill (white text 5.09:1); orange text (4.54:1 on #F2F2F2) — decision 6 |
| `brand-tint` | #FCDED1 | #482A1D | Next-step message backgrounds |
| `interactive` | #1E989F | #1E989F | Icons, focus ring, borders, selection edges (3.47 on white; 4.80 on #1E1E1E) |
| `interactive-text` | #187A7F | #3FB3BA | Links and blue text (4.54 on #F2F2F2; 6.03 on #262626). **Never on `interactive-tint`** (4.05) — use `text` there. |
| `interactive-tint` | #D2EAEC | #1E3638 | Hover, current bundle, hovered segment (text 13.3:1 / 11.4:1) |
| `danger` / `danger-text` | #D42225 | #E16769 | Errors and destructive actions (5.18 on white, 4.63 on #F2F2F2; 4.57 on #262626) |
| `danger-tint` | #F6D3D3 | #421F1F | Error backgrounds |
| `warning` | #F6C200 | #F6C200 | Icons and borders only — never text on light surfaces (1.66:1) |
| `warning-tint` / `on-warning` | #FDF3CC / #1E1E1E | #493F18 / #F2F2F2 | Warning backgrounds and text (15.0:1 / 9.3:1) |
| `success` | #5AA018 | #5AA018 | Success icons |
| `success-text` | #457B12 | #5AA018 | Green text (4.58 on #F2F2F2; 4.67 on #262626) |
| `success-tint` | #DEECD1 | #2A381D | Success backgrounds |
| `focus-ring` | #1E989F | #1E989F | Focus outline |
| `overlay` | rgba(30,30,30,0.45) | rgba(0,0,0,0.6) | Modal backdrop |

Tints are 20 % colour + 80 % white in light mode (the profile's 80:20 rule) and 20 % colour + 80 % #1E1E1E in dark mode. Greys are neutral (R = G = B).

**Canvas colours:**

| Token | Light | Dark |
|---|---|---|
| `bg` | #FFFFFF | #141414 |
| `signal` | #3A3A3A (11.4:1) | #CFCFCF (11.8:1) |
| `zeroLine` | #BDBDBD | #4D4D4D |
| `text` | #1E1E1E | #F2F2F2 |
| `textMuted` | #666666 | #A6A6A6 |
| `accentText` | #187A7F | #3FB3BA |
| `boundary` | #8C8C8C (3.36:1) | #6E6E6E (3.61:1) |
| `boundaryMuted` | #BDBDBD | #4D4D4D |
| `tierBg` | #FAFAFA | #1A1A1A |
| `tierActive` | rgba(30,152,159,0.08) | rgba(30,152,159,0.14) |
| `selectionFill` | rgba(30,152,159,0.16) | rgba(30,152,159,0.28) |
| `selectionEdge` | #1E989F | #1E989F |
| `segmentSelected` | rgba(30,152,159,0.24) | rgba(30,152,159,0.36) |
| `hoverFill` | #D2EAEC | #1E3638 |
| `cursor` | #F0581A | #F0581A |
| `playedFill` | rgba(240,88,26,0.12) | rgba(240,88,26,0.18) |
| `error` | #D42225 | #E16769 |
| `warning` | #B69000 | #F6C200 |
| `contours` | #1E989F, #5AA018, #B69000, #0F4C50, #F0581A, #666666 | #1E989F, #5AA018, #F6C200, #7FCBCF, #F0581A, #A6A6A6 |
| `hierarchy.node` / `nodeStroke` | #FFFFFF / #666666 | #262626 / #A6A6A6 |
| `hierarchy.nodeSelected` / `link` / `linkSelected` / `collapsed` | #1E989F / #8C8C8C / #1E989F / #F0581A | #1E989F / #6E6E6E / #1E989F / #F0581A |

The contour palette avoids red, which is reserved for errors, and puts orange fifth because the cursor is orange. Check it with a colour-vision-deficiency simulator before locking it.

**Typography, space, layout:** see §3.2. The profile asks for `h2` at 1.5rem.

## Appendix B — Icon map (Font Awesome Free, classic solid; verified against 7.3.1)

| Function | Today | Font Awesome | Source |
|---|---|---|---|
| Theme menu | none | `circle-half-stroke` | Profile |
| Language menu | none | `globe` | Profile |
| First / last bundle | none | `backward-fast` / `forward-fast` | Profile |
| Previous / next bundle | none | `backward` / `forward` | Profile |
| Previous / next time anchor | ◀ ▶ | `backward-step` / `forward-step` | Plan (distinguishes anchors from bundles) |
| Session collapsed / expanded | `chevron_right` / `expand_more` | `chevron-right` / `chevron-down` | Profile |
| Sort ascending / descending (if added) | none | `chevron-down` / `chevron-up` | Profile |
| Read-only / editable database | none | `lock` / `lock-open` | Profile |
| Personal resource (if the server reports it) | none | `user-lock` | Profile |
| Info / About and help | crystal image | `circle-info` | Profile |
| Show bundle list (field chevron) | `menu` | `chevron-down` in the field | Plan |
| Save | `save` | `floppy-disk` | Plan |
| Export TextGrid / annotJSON (local) | `save` | `file-export` | Plan |
| Settings | `settings` | `gear` | Plan |
| Connect | `input` | `plug` | Plan |
| Signed-in user | none | `user` | Plan |
| Hierarchy | `details` (rotated) | `sitemap` | Plan |
| Search | `search` | `magnifying-glass` | Plan |
| Filter bundles | 🔍 in placeholder | `filter` | Plan |
| Close / disconnect | `clear_all` | `right-from-bracket` | Plan |
| Add level / rename level (local) | text only | `plus` / `pen` | Plan |
| Zoom in / out | `expand_less` / `expand_more` | `magnifying-glass-plus` / `magnifying-glass-minus` | Plan |
| Move view left / right | `chevron_left` / `chevron_right` | `arrow-left` / `arrow-right` | Plan (chevron-right is "collapsed" in the profile) |
| Whole file / zoom to selection | `unfold_less` / `unfold_more` (rotated) | `arrows-left-right-to-line` / `arrows-left-right` | Plan |
| Play view / selection / whole file | `play_arrow` / `play_circle_outline` / `play_circle_filled` | `play` / `circle-play` / `play` (label distinguishes) | Plan |
| Perspectives | `menu` | `layer-group` | Plan |
| Open files / demo database | none | `file-arrow-up` / `database` | Plan |
| Local-mode badge, warnings | none | `triangle-exclamation` | Plan |
| Errors | none | `circle-exclamation` | Plan |
| Success | none | `circle-check` | Plan |
| Close dialog / toast | × | `xmark` | Plan |
| Rotate hierarchy | ↻ | `arrow-rotate-right` | Plan |
| Split-pane handle | CSS bar | `grip-lines` | Plan |
| Delete saved server URL | (−) | `trash-can` | Plan |

## Appendix C — Canvas migration worksheet (line numbers at a2a36042)

`cs = getCanvasStyle()`. "data font" means `cs.family.data`, and sizes come from `cs.size.*` (px from rem).

| File:line | Function | Old | New |
|---|---|---|---|
| draw-helper.service.ts:357, 402, 438–439 | `freshRedrawDrawOsciOnCanvas` | `colorWhite` (waveform/envelope) | `cs.color.signal` |
| draw-helper.service.ts:484–485 | same (zero line) | `colorBlue` | `cs.color.zeroLine` |
| draw-helper.service.ts:526 | `drawMovingBoundaryLine` | `colorBlue` | `cs.color.selectionEdge` |
| draw-helper.service.ts:544 | `drawCurViewPortSelected` | `fontSmallSize` | `cs.size.sm` |
| draw-helper.service.ts:560, 579, 611, 615, 624 | same (time and sample labels) | `colorWhite` | `cs.color.text` |
| draw-helper.service.ts:584 | same (selection fill) | `colorTransparentLightGrey` | `cs.color.selectionFill` |
| draw-helper.service.ts:586 | same (selection edges) | `colorWhite` | `cs.color.selectionEdge` |
| draw-helper.service.ts:576, 608, 615, 624 | same | `fontSmallFamily` | data font |
| draw-helper.service.ts:639–640 | `drawCrossHairX` | `colorCursor` | `cs.color.cursor` |
| draw-helper.service.ts:654–760 | `drawCrossHairs` (lines and value labels) | `colorCursor`, `fontSmall*` | `cs.color.cursor`, data font, `cs.size.sm` |
| draw-helper.service.ts:776–807 | `drawMinMaxAndName` (track name, min/max) | `colorBlue`, `fontSmall*` | `cs.color.textMuted`, data font |
| draw-helper.service.ts:815–839 | `drawViewPortTimes` | `colorWhite`, `fontSmall*` | `cs.color.textMuted`, data font |
| Level.svelte:43, 45 | `getAttrDefBtnColor` (DOM style) | `colorYellow` / `colorWhite` | classes `.sb-attr-dot.is-current` / `.sb-attr-dot` |
| Level.svelte:51, 56, 67, 72 | `drawLevelDetailsFor` | `fontSmall*` | data font, `cs.size.sm` |
| Level.svelte:90 | same (name of the current attribute level) | `colorBlue` | `cs.color.accentText` |
| Level.svelte:97 | same (level name and type) | `colorWhite` | `cs.color.text` |
| Level.svelte:105, 121, 145, 187, 196 | same (start boundaries, event markers, upper guide) | `colorWhite` | `cs.color.boundary` |
| Level.svelte:125, 154 | same (end boundary, lower guide) | `colorGrey` | `cs.color.boundaryMuted` |
| Level.svelte:136, 203 | same (segment and event labels) | `colorWhite` | `cs.color.text` |
| Level.svelte:169, 180, 210 | same (sample numbers, durations) | `colorBlue` | `cs.color.textMuted` |
| LevelCanvasMarkup.svelte:461 | `drawLevelMarkup` (active level wash) | `colorTransparentGrey` | `cs.color.tierActive` |
| LevelCanvasMarkup.svelte:490 | same (selected segments) | `colorTransparentYellow` | `cs.color.segmentSelected` |
| LevelCanvasMarkup.svelte:492, 523 | same | `colorWhite` | `cs.color.boundary` (verify while migrating) |
| LevelCanvasMarkup.svelte:501 | same (preselected boundary) | `colorBlue` | `cs.color.selectionEdge` |
| SignalCanvasMarkup.svelte:129–130 | `drawMarkup` | `colorCursor` | `cs.color.cursor` |
| SignalCanvasMarkup.svelte:147 | `drawPlayHead` (played region) | `colorTransparentLightGrey` | `cs.color.playedFill`, plus a 1.5px `cs.color.cursor` line |
| Spectrogram.svelte:39, 48 | `showRenderingOverlay` | `colorBlack` fill and text (D2) | `cs.color.bg` / `cs.color.textMuted` |
| Spectrogram.svelte:44–45 | same | `fontSmall*` | data font, `cs.size.xs` |
| SsffCanvas.svelte:14, 123–124 | contours, cursor | `CONTOUR_COLORS`, `'#F0581A'` | `cs.color.contours`, `cs.color.cursor` |
| SsffCanvas.svelte:176–189 | `isEmpty` message | `colorTransparentRed`, `fontSmall*` | `cs.color.error`, data font |
| SsffTrack.svelte:18–20, 136–137 | constants, cursor | `COLOR_WHITE`, `COLOR_TRANSPARENT_RED`, `CONTOUR_COLORS`, `'#F0581A'` | `cs.color.text`, `cs.color.error`, `cs.color.contours`, `cs.color.cursor` |
| DotsCanvas.svelte:15, 28–29, 192–274 | contours, labels | `CONTOUR_COLORS`, `colorWhite`, `fontInput*` | `cs.color.contours`, `cs.color.text`, data font |
| EpgGridCanvas.svelte:45–46, 73–74 | grid labels | `colorBlack`, `fontInput*` | `cs.color.text`, data font |
| OsciOverview.svelte:13–14, 192 | constants and inline style | `COLOR_*`, `background:#000` | `cs.color.signal`, `cs.color.selectionFill`, class + tokens |
| EmuHierarchy.svelte:19–25 | constants | seven literals | `cs.color.hierarchy.*`, `cs.color.text`, `cs.color.error` |
| HierarchyPathCanvas.svelte:17–21, 286 | constants and inline rgba | five literals | `cs.color.hierarchy.*`, `--sb-surface-3` |

## Appendix D — Hard-coded colours outside canvas code

| File | What | Replace with |
|---|---|---|
| BundleListSidebar.svelte:115, 117 (`getBndlColor`), 170 | Red/grey row backgrounds, `#ccc` divider | Classes `.is-current`, `.is-dirty` (the dot) and `--sb-border` |
| TopMenu.svelte (`unsavedChangesStyle`) | Red Save background | Removed; Save variant in `DataSelector` |
| Settings.svelte:89, 199–242 | `#f00` validation (9×) | `.sb-field-error` (`--sb-danger-text` plus icon) |
| DropZone.svelte:42–54 | #0078ff, white text-shadow | `--sb-interactive-tint` background, `--sb-interactive` dashed border, `--sb-text` |
| SplitPane.svelte:85, 96 | #444 / #888 | `--sb-surface-2`, `--sb-border-control` |
| HistoryActionPopup.svelte:14–15 | Black background with #0f0 text | Toast info variant |
| handleglobalkeystrokes.service.ts:103–104 | Label-edit validity rgba | `.is-valid` / `.is-invalid` classes |
| view-state.service.ts:707 | Heat-map anchor swatch | Keep (user data; allow-list) |
| SCSS: artic-design.scss (48), text.scss (10), intro.scss (9, delete), modal.scss (7), levelCanvasesGrid.scss (7), drop.scss (5), bundleListSideBar.scss (4), aboutHint.scss (4), artic.scss (3), splitPanes.scss (2), button.scss (2), rightSideMenu.scss (1) | Literals | Tokens per component (Phase 6) |

## Appendix E — Swedish UI glossary

| English | Svenska | | English | Svenska |
|---|---|---|---|---|
| bundle | yttrande | | selection | markering |
| session | session | | viewport / view | vy |
| database | databas | | zoom in / out | zooma in / ut |
| level | nivå | | play view / selection / whole file | spela vy / markering / hela filen |
| segment level / event level | segmentnivå / händelsenivå | | save | spara |
| item (hierarchy) | enhet | | discard changes | kasta ändringar |
| label | etikett | | export | exportera |
| attribute definition | attribut | | settings | inställningar |
| boundary | gräns | | search | sök |
| perspective | perspektiv | | connect / disconnect | anslut / koppla från |
| hierarchy | hierarki | | close files | stäng filerna |
| link | länk | | time anchor | ankare |
| oscillogram / spectrogram | oscillogram / spektrogram | | local mode | lokalt läge |
| track (SSFF) | spår | | read-only / editable | skrivskyddad / redigerbar |
| sample | sampel | | theme: system / light / dark | tema: system / ljust / mörkt |

Write "Språkbanken" everywhere, never "SB" or "Nationella språkbanken".

## Appendix F — Element IDs to preserve

`MainCtrl`, `mainWindow`, `aboutBtn`, `bundleListSideBarOpen`, `clear`, `demoDB`, `demo{i}`, `downloadTextgrid`, `downloadAnnotation`, `showHierarchy`, `spectSettingsBtn`, `zoomInBtn`, `zoomOutBtn`, `zoomLeftBtn`, `zoomRightBtn`, `zoomAllBtn`, `zoomSelBtn`, `playViewBtn`, `playSelBtn`, `playAllBtn`, `modalHeading`, `modalCancelBtn`, `artic-modal-cancel`, `artic-modal-confirm`, `artic-modal-save`, `artic-error-text`, `artic-selection`, `tabs`.

`#artic-dropdown-arrow` disappears with the old demo dropdown. Core services also query the class returned by `LevelService.getlasteditArea()` (the label-edit area), so keep that class name.
