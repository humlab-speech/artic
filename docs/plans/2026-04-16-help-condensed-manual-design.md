## Summary

Replace the current `Manual` help tab with a condensed in-app quick-start guide. Keep the existing three-tab help modal structure (`Introduction`, `Keys`, `Manual`) and treat the new manual as the practical bridge between the descriptive intro and the exhaustive keyboard reference.

## Context

The live help window is opened from the top-right Artic crystal button (`#aboutBtn`) and already renders three tabs from static HTML files. The current `Manual` content is long-form and reads more like external documentation than modal help. `Introduction` is descriptive and `Keys` is comprehensive, so the best fit is to make `Manual` short, task-oriented, and scan-friendly.

Relevant files:

- `src/svelte-app/components/modals/HelpModal.svelte`
- `src/views/helpTabs/intro.html`
- `src/views/helpTabs/keys.html`
- `src/views/helpTabs/manual.html`
- `public/views/helpTabs/intro.html`
- `public/views/helpTabs/keys.html`
- `public/views/helpTabs/manual.html`

No Svelte modal changes are expected unless verification reveals a rendering issue.

## Chosen Approach

Use the existing `Manual` tab as a condensed quick-start cheat sheet.

Why this approach:

- Fits the current modal structure with minimal code churn.
- Complements the existing tabs instead of duplicating them.
- Gives users a practical "how do I use this?" page without sending them to long external docs.

Alternatives considered:

1. Add a fourth tab for the condensed manual.
   Rejected because it adds UI weight when the current `Manual` tab already matches the need.

2. Merge condensed guidance into `Introduction` and `Keys`.
   Rejected because it would blur the role of each tab and make both tabs less focused.

## Content Design

The new manual should be short enough to read comfortably inside the modal with limited scrolling.

Proposed sections:

1. `Overview`
   One short paragraph describing Artic as a browser app for loading speech data, reviewing aligned annotations, and correcting derived views.

2. `Open Data`
   Concise guidance for:
   - drag-and-drop
   - `open demo`
   - `connect`

3. `Navigate`
   Compact guidance for:
   - bundle list/menu
   - zoom and pan
   - perspectives
   - hierarchy view

4. `Edit And Listen`
   Compact guidance for:
   - selecting items
   - labeling/editing
   - playback controls

5. `Save And Export`
   Concise guidance for:
   - saving current work
   - TextGrid export
   - JSON export

6. `Need More Detail?`
   Point users to:
   - `Introduction` for product/context info
   - `Keys` for the full shortcut list

## Presentation Rules

- Keep prose minimal.
- Prefer short paragraphs and compact tables.
- Avoid repeating the full keyboard shortcut inventory from `Keys`.
- Avoid deep implementation/configuration details better suited to external docs.
- Mention the actual help entry point: the top-right Artic crystal button.

## Data Flow / Rendering

The modal already fetches static HTML by tab URL and injects it as raw HTML. Replacing `manual.html` in both `src/views/helpTabs/` and `public/views/helpTabs/` is sufficient for the current delivery model.

## Error Handling / Risk

Main risk is drift between `src/views/helpTabs/manual.html` and `public/views/helpTabs/manual.html`, since the project currently keeps both copies. The implementation should update both to keep dev and served assets aligned.

## Testing / Verification

Verify by loading the app on port `9000`, opening the help modal via `#aboutBtn`, switching to `Manual`, and confirming:

- content renders without broken markup
- manual is visibly shorter and easier to scan
- the three-tab structure remains unchanged
- the guidance complements rather than duplicates `Introduction` and `Keys`
