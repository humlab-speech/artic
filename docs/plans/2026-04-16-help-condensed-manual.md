# Help Condensed Manual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current long-form `Manual` help tab with a condensed, scan-friendly quick-start guide in the existing help modal.

**Architecture:** Keep the existing Svelte help modal unchanged and update only the static HTML content that it already fetches for the `Manual` tab. Maintain both `src/views/helpTabs/manual.html` and `public/views/helpTabs/manual.html` so the dev source and served asset stay aligned.

**Tech Stack:** Svelte 5 app shell, static HTML help tab content, `cmux` browser automation for manual verification.

---

### Task 1: Capture the final condensed manual structure

**Files:**
- Modify: `src/views/helpTabs/manual.html`
- Reference: `src/views/helpTabs/intro.html`
- Reference: `src/views/helpTabs/keys.html`

**Step 1: Write the target outline in the source manual file**

Replace the current long-form sections with this shorter structure:

```html
<h1>Quick Manual</h1>
<p>Short overview paragraph.</p>

<h2>Open Data</h2>
<table>...</table>

<h2>Navigate</h2>
<table>...</table>

<h2>Edit And Listen</h2>
<table>...</table>

<h2>Save And Export</h2>
<table>...</table>

<h2>Need More Detail?</h2>
<p>Point to Introduction and Keys.</p>
```

Content requirements:

- Mention the help entry point as the top-right Artic crystal button.
- Cover drag-and-drop, `open demo`, and `connect`.
- Cover bundle list, zoom/pan, perspectives, and hierarchy.
- Cover selection/editing/playback at a high level without duplicating the full key list.
- Cover save, TextGrid export, and JSON export.
- End with pointers to `Introduction` and `Keys`.

**Step 2: Keep markup simple and modal-friendly**

Use only short paragraphs, headings, and compact tables already consistent with the other help tabs.

Do not add:

- new scripts
- new CSS classes unless absolutely necessary
- long historical/configuration sections
- full shortcut duplication from `keys.html`

**Step 3: Review the source file for broken HTML before moving on**

Check for:

- balanced tags
- no accidental Markdown syntax inside HTML
- readable section order

**Step 4: Commit**

Do not commit yet unless the user explicitly asks for a commit.

### Task 2: Mirror the manual into the served public copy

**Files:**
- Modify: `public/views/helpTabs/manual.html`
- Reference: `src/views/helpTabs/manual.html`

**Step 1: Copy the finalized condensed content into the public manual file**

Make `public/views/helpTabs/manual.html` semantically identical to `src/views/helpTabs/manual.html`.

**Step 2: Verify both copies stay aligned**

Compare these files for content parity:

- `src/views/helpTabs/manual.html`
- `public/views/helpTabs/manual.html`

Minor whitespace differences are acceptable. Content drift is not.

**Step 3: Commit**

Do not commit yet unless the user explicitly asks for a commit.

### Task 3: Verify the live help modal with cmux

**Files:**
- Verify: `src/svelte-app/components/modals/HelpModal.svelte`
- Verify: `src/views/helpTabs/manual.html`
- Verify: `public/views/helpTabs/manual.html`

**Step 1: Start or reuse the dev app on port 9000**

Run:

```bash
npm start
```

Expected: the app is reachable at `http://localhost:9000`.

**Step 2: Open the app in cmux browser automation**

Run commands equivalent to:

```bash
cmux browser goto http://localhost:9000 --surface <browser-surface>
cmux browser wait --surface <browser-surface> --url-contains localhost:9000 --timeout-ms 15000
```

Expected: the Artic app loads successfully.

**Step 3: Open the help modal from the real entry point**

Use the actual toolbar button:

```bash
cmux browser click "#aboutBtn" --surface <browser-surface>
cmux browser wait --surface <browser-surface> --text "Artic Help" --timeout-ms 10000
```

Expected: modal opens with tabs `Introduction`, `Keys`, and `Manual`.

**Step 4: Switch to the Manual tab and inspect the content**

Run commands equivalent to:

```bash
cmux browser click "text=Manual" --surface <browser-surface>
cmux browser snapshot --surface <browser-surface> --compact
```

Expected:

- condensed manual renders cleanly
- section order is correct
- content is shorter than the original long manual
- no broken markup or missing text

**Step 5: Validate the role split between tabs**

Confirm manually from the modal:

- `Introduction` still explains what Artic is
- `Keys` still contains the exhaustive shortcut reference
- `Manual` now acts as the quick-start guide

**Step 6: Commit**

Do not commit yet unless the user explicitly asks for a commit.

### Task 4: Final review and handoff

**Files:**
- Modify: none
- Verify: `docs/plans/2026-04-16-help-condensed-manual-design.md`
- Verify: `docs/plans/2026-04-16-help-condensed-manual.md`

**Step 1: Summarize the user-visible change**

Prepare a concise summary covering:

- help still opens from the top-right crystal icon
- `Manual` is now condensed and practical
- `Introduction` and `Keys` remain in place for context and full shortcuts

**Step 2: Record verification evidence**

Include the key verification facts:

- app checked on port `9000`
- help modal opened via `#aboutBtn`
- `Manual` tab rendered successfully

**Step 3: Commit**

Do not commit yet unless the user explicitly asks for a commit.
