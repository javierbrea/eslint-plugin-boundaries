<!-- cspell:disable -->
# Phase 3: docs polish and site chrome

Goal: make the documentation pages read as part of the same design as the home: code blocks on the blueprint palette, heading rhythm, admonitions in the semantic colours, sidebar, table of contents, tabs, tables, search, breadcrumbs, pagination, announcement bar and the 404 page. No content changes under `docs/` or `versioned_docs/`; if a page turns out to need an edit for the restyle to work (it should not), `00-shared.md` section 2 applies: ask first, then edit both `docs/` and `versioned_docs/version-7.3.0/`.

Read first: `../website-redesign.md`, `00-shared.md`, `01-foundation.md` (what the bridge already covers). Phase 1 is merged and phase 2 lives on `feat/website-redesign-home`, the branch this phase starts from (see the index, "Phases"): reuse `src/prism/blueprintTheme.ts` and the home's components and tokens instead of creating them.

Pages to use as the test bed (cover every construct): `/docs/overview/` (intro + SVG schema), `/docs/quick-start/` (tabs, CodeDiff, admonitions tip/info/note), `/docs/rules/dependencies/` (long reference, tables, many code blocks), `/docs/classification/elements/` (nested headings), `/docs/releases/migration-guides/v6-to-v7/` (long page, TOC), `/docs/guides/typescript-support/`, an older versioned page such as `/docs/7.1.0/overview/` (version dropdown and banner; `/docs/` itself serves the latest version, 7.3.0), the working docs at `/docs/next/overview/`, and `/this-page-does-not-exist/` (404).

## Deliverables

### 1. Code blocks

- `docusaurus.config.ts` → `themeConfig.prism`: `theme: blueprintTheme`, `darkTheme: blueprintTheme` (import from `./src/prism/blueprintTheme`). Keep `additionalLanguages`.
- `src/components/CodeDiff/index.tsx`: render once with `blueprintTheme` instead of twice (light/dark); delete the `diff-theme-*` wrappers. In `custom.css` delete the `.diff-theme-*` rules (including the per-variant `pre` backgrounds phase 1 left there) and restyle `.diff-addition` (`color-mix(in srgb, var(--jsb-ok) 18%, transparent)`), `.diff-deletion` (`color-mix(in srgb, var(--jsb-bad) 18%, transparent)`), and the `+`/`-` markers in `--jsb-ok` / `--jsb-bad`. Remove the config comment that says to keep CodeDiff in sync with the Prism themes, since there is now one theme.
- Code block chrome: `--ifm-pre-border-radius: var(--jsb-radius-lg)`, a 3px left rule in `--jsb-accent` on `.theme-code-block` (same look as the home `CodeSnippet`), title bar (`.codeBlockTitle`) in mono 0.72rem on `--jsb-code` with a `--jsb-line` divider, copy button visible on hover with the icon in `--jsb-code-fg`. Highlighted lines keep `--docusaurus-highlighted-code-line-bg`.
- Inline `code` in prose: `--jsb-accent-soft` background, `--jsb-ink` text, radius 4px, no border (`--ifm-code-border-radius`, `--ifm-code-padding-horizontal: 0.35em`).

### 2. Typography and rhythm in `.markdown`

- `--ifm-heading-margin-top` / `-bottom`: h2 `2.4rem` / `0.8rem`, h3 `1.8rem` / `0.6rem`; h1 `margin-bottom: 1.2rem`; first heading after the breadcrumbs has no top margin.
- `.markdown` max line length stays Docusaurus' column; paragraph spacing `--ifm-paragraph-margin-bottom: 1rem`; lists `--ifm-list-paragraph-margin: 0.5rem`.
- Links: underline 1px with `text-underline-offset: 3px`, colour `--jsb-accent`, hover `--jsb-ink` (keep the 600 weight already in `custom.css`).
- `strong` stays 600 (Plex 600 is shipped); `em` uses the shipped 400 italic.
- Tables: header row mono 0.72rem uppercase 0.08em `--jsb-muted` on `--jsb-paper-2`, borders `--jsb-line`, zebra `--jsb-paper`, cell padding 0.55rem 0.8rem; wrap wide tables in Docusaurus' own scroll container (verify `/docs/rules/dependencies/` at 390px has no page overflow).
- Blockquotes: left 2px `--jsb-accent`, text `--jsb-muted`.
- `hr`: `--jsb-line`.

### 3. Admonitions

Infima's alerts read the `--ifm-color-*-contrast-background` variables set in phase 1. Add in `custom.css`:

- Map admonition types: `note` → secondary (muted), `tip` → success (`--jsb-ok`), `info` → info (`--jsb-accent`), `warning`/`caution` → warning (`--jsb-warn`), `danger` → danger (`--jsb-bad`).
- Shape: radius `--jsb-radius-lg`, 3px left border in the type colour, no box shadow, title in Sora 600 0.95rem with the Docusaurus icon tinted the type colour, body text `--jsb-ink`.
- Check contrast of `--jsb-warn` text on the warning background in light (`#b26b00` on the 14% mix passes AA; adjust the mix, not the token, if it does not).

### 4. Sidebar, TOC, breadcrumbs, pagination, tabs, badges

- Sidebar (`.menu`): font 0.9rem; category labels 500; active link `--jsb-accent` on `--jsb-accent-soft` with a 2px accent bar on the left (`::before`); collapsible carets `--jsb-faint`; the "Legacy"/"Deprecated Rules" categories unchanged (no extra styling).
- TOC (`.table-of-contents`): 0.82rem, left border `--jsb-line`, active item `--jsb-accent` with the border segment accent.
- Breadcrumbs: mono 0.72rem, active chip `--jsb-accent-soft`.
- Pagination (`.pagination-nav__link`): `--jsb-line` border, radius `--jsb-radius-lg`, hover border `--jsb-accent` and a 2px lift; sublabel mono 0.68rem uppercase `--jsb-faint`.
- Tabs (`.tabs__item`): mono 0.78rem; active underline 2px `--jsb-accent`; hover `--jsb-accent-soft`.
- Badges (`.badge--primary`, used for "New in v7"): mono 0.62rem uppercase 0.1em on `--jsb-accent` / `--jsb-accent-ink`.
- Version banner (`.theme-doc-version-banner`) and the docs version dropdown: tokens only, no Infima defaults left.

### 5. Navbar, search, announcement bar, footer

- Navbar: `.navbar__link--active` gets the growing underline (`::after` 1px, `scaleX`), hover colour `--jsb-ink`; dropdown menus on `--jsb-card` with `--jsb-line` border and `--jsb-shadow`; mobile sidebar (`.navbar-sidebar`) on `--jsb-paper` (done in phase 1: the navbar is opaque below 997px and the sidebar inherits its background; verify only).
- DocSearch button: `--jsb-card` background, `--jsb-line` border, mono placeholder `--jsb-muted`, keys on `--jsb-paper`; modal uses the `--docsearch-*` variables set in phase 1 (verify the hit highlight uses `--jsb-accent-soft`).
- Announcement bar: keep phase 1 colours; link inside underlined, `--jsb-accent` on dark ink reads badly, so set links to `--jsb-paper` with underline.
- Footer: if phase 2 is merged, only verify; otherwise apply the footer CSS from `02-home.md` section 7 here (both phases may touch it; the merge is trivial).

### 6. 404 page

Swizzle `NotFound/Content` (`--eject --typescript`): mono eyebrow `404`, Sora h1 `Nothing is drawn here`, lead `The page you asked for does not exist or moved. The docs index is the best place to start.`, primary `Button` to `/docs/overview/` (reuse `src/components/ui/Button` when phase 2 is merged; otherwise a plain `Link` with the same class names, replaced later).

### 7. Clean-up

- `custom.css` ends up grouped by component with a one-line comment per group; nothing references `--ifm-color-primary-*` shades directly.
- Delete the `#7a839d`/`#96a5be` era rules if any survived phase 1.
- cspell: add any Docusaurus class fragments the checker flags (`codeBlockTitle`, `docsearch`, …).

## Acceptance

- Everything in `00-shared.md` section 8 for the eight test-bed pages, both themes, both widths.
- Code blocks look the same on the home and in the docs (same background, palette, radius, left rule); CodeDiff `+`/`-` rows read in both themes.
- Admonitions of all five types shown on a scratch MDX page during development (do not commit it) use the semantic colours and pass contrast.
- No Infima default colour left: search the rendered CSS of a docs page for `#25c2a0`, `#2e8555`, `#303846` and get no hits.
- Lighthouse Accessibility 100 on `/docs/overview/`, `/docs/quick-start/` and `/docs/rules/dependencies/`: with the Prism `github` theme gone, the `color-contrast` miss accepted in phases 1 and 2 (`00-shared.md` section 8) no longer applies.
- Changelog entry, e.g. `feat: Documentation pages adopt the new design: blueprint code blocks, semantic admonitions, restyled sidebar, table of contents, search and 404 page.`
