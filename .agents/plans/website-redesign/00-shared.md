<!-- cspell:disable -->
# Shared: environment, design system, conventions, gates

Read this file before any phase. It holds every fact more than one phase needs. Phase files only add what is specific to them. Do not edit the plan files from a phase branch: record deviations in the PR description.

## 1. Environment and commands

- Node: the version in the repo-root `.nvmrc` (24.x). Run `nvm use` in the worktree before anything else; `packages/website/package.json` declares `engines.node >= 24` and the build fails on older versions.
- Install once per worktree from the repo root: `pnpm install`.
- Website commands (run from the repo root):

```bash
pnpm nx start website                                     # dev server, http://localhost:3000
pnpm nx build website --output-style=stream               # production build into packages/website/build
pnpm --filter website serve                               # serve the production build (http://localhost:3000)
pnpm nx lint website --output-style=stream --fix          # ESLint (+ prettier), autofix
pnpm nx check:types website --output-style=stream         # tsc --noEmit
pnpm nx check:spell website --output-style=stream         # cspell
pnpm nx check:all website --output-style=stream           # everything above plus the build; run before opening the PR
```

- `pnpm nx build website` throws on broken links and anchors (`onBrokenLinks: "throw"`). Every `to`/`href` to an internal page must exist with a trailing slash (`trailingSlash: true`), e.g. `/docs/quick-start/`.
- New words for cspell go in `packages/website/cspell.config.js`: `createConfig({ words: ["Sora", ...] })`. Do not touch the shared dictionaries for website-only words.
- Repo rules that load automatically and apply here: `.agents/rules/typescript-conventions.md` (`type` over `interface`, TSDoc on exports), `.agents/rules/changelog-and-versioning.md`. Read `packages/website/AGENTS.md` and the root `AGENTS.md`.

## 2. Branching, PRs, changelog

- Integration branch: `feat/website-redesign`. Each phase works on its own branch (`feat/website-redesign-<phase>`) created from the integration branch, and opens a PR against the integration branch. Do not target `release`.
- Commit messages: Conventional Commits, scope `website` (`feat(website): ...`, `chore(website): ...`). English.
- Changelog: add one short entry under `## [Unreleased]` → `### Changed` (or `### Added`) in `packages/website/CHANGELOG.md`, written for site visitors, one or two sentences, prefixed `feat:`. Do not bump `packages/website/package.json` `version` and do not create a version section: the redesign is deployed by merging into `master`, not by a release, and the entries stay under `[Unreleased]` until whichever website version comes next.
- Docs markdown: the redesign changes no docs page except the acknowledgments page (phase 2). The site is one build shared by every docs version and it is deployed from `master` without a release, so `/docs/` keeps serving the current snapshot, `versioned_docs/version-7.3.0/`, and `/docs/next/` serves `docs/`. Any docs edit the redesign needs is therefore applied identically to both `docs/` and `versioned_docs/version-7.3.0/` (a deliberate backport to the current version, the case `.agents/rules/docs-authoring.md` allows), and never to older snapshots. If a phase finds it needs another docs edit, it stops and asks the maintainer first.
- PR description: what changed, screenshots at 1440px and 390px in both themes (the phase's screenshot script produces them), Lighthouse scores for the pages the phase touches, and the checklist of section 8 with every box ticked.

## 3. Design tokens (`src/css/tokens.css`)

Prefix `--jsb-`. Light values on `:root`, dark values on `[data-theme="dark"]` (Docusaurus always sets `data-theme` on `<html>` before first paint, so no `prefers-color-scheme` block is needed). Every colour in site CSS references a token; literal colours are allowed only inside this file, in the per-theme Infima shade scales of `infima-bridge.css`, in the CodeDiff rules of `custom.css` and inside the Prism theme object.

```css
:root {
  --jsb-paper: #f3f4f9;
  --jsb-paper-2: #ffffff;
  --jsb-ink: #161a33;
  --jsb-muted: #5a6080;
  --jsb-faint: #9397b6;
  --jsb-line: rgba(22, 26, 51, 0.13);
  --jsb-line-strong: rgba(22, 26, 51, 0.28);
  --jsb-grid: rgba(76, 82, 216, 0.1);
  --jsb-accent: #4c52d8;
  --jsb-accent-ink: #ffffff;
  --jsb-accent-soft: rgba(76, 82, 216, 0.1);
  --jsb-ok: #0f8f7c;
  --jsb-bad: #d7442f;
  --jsb-warn: #b26b00;
  --jsb-card: #ffffff;
  --jsb-code: #1b1f3b;
  --jsb-code-fg: #e7e9f8;
  --jsb-code-keyword: #b3b8ff;
  --jsb-code-string: #8fe3cf;
  --jsb-code-comment: #7a7fa3;
  --jsb-code-error: #ff8f7c;
  --jsb-code-number: #ffd479;
  --jsb-code-line: rgba(143, 148, 255, 0.18);
  --jsb-shadow: 0 24px 50px -30px rgba(22, 26, 51, 0.35);
  --jsb-glow-a: color-mix(in srgb, var(--jsb-accent) 24%, transparent);
  --jsb-glow-b: color-mix(in srgb, var(--jsb-ok) 13%, transparent);
  --jsb-font-display: "Sora", "Avenir Next", "Helvetica Neue", sans-serif;
  --jsb-font-body: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --jsb-font-mono: "IBM Plex Mono", "SFMono-Regular", Menlo, monospace;
  --jsb-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --jsb-radius: 6px;
  --jsb-radius-lg: 8px;
  --jsb-radius-xl: 12px;
}

[data-theme="dark"] {
  --jsb-paper: #0f1222;
  --jsb-paper-2: #141833;
  --jsb-ink: #e9ebf7;
  --jsb-muted: #a4a9c9;
  --jsb-faint: #6a6f93;
  --jsb-line: rgba(233, 235, 247, 0.12);
  --jsb-line-strong: rgba(233, 235, 247, 0.28);
  --jsb-grid: rgba(143, 148, 255, 0.11);
  --jsb-accent: #8f94ff;
  --jsb-accent-ink: #0f1222;
  --jsb-accent-soft: rgba(143, 148, 255, 0.14);
  --jsb-ok: #3fd1b4;
  --jsb-bad: #ff7a66;
  --jsb-warn: #ffd479;
  --jsb-card: #171b36;
  --jsb-code: #0b0e1d;
  --jsb-code-fg: #e7e9f8;
  --jsb-shadow: 0 24px 50px -30px rgba(0, 0, 0, 0.7);
}
```

Semantics: `paper` page background, `paper-2` alternate section background and surfaces, `card` bordered boxes, `ink` text, `muted` secondary text, `faint` captions and labels only (it fails AA contrast for body text; never use it for running text or links), `line`/`line-strong` borders, `accent` the single brand colour, `ok` "allowed" and success, `bad` "violation" and danger, `warn` warnings, `code*` the always-dark code palette (identical in both themes, so code blocks look the same everywhere).

## 4. Type scale

Font files and `@font-face` rules are phase 1 deliverables. Sizes (rem is 15px at the browser default once phase 1 sets `--ifm-font-size-base: 93.75%`):

| Role | Family / weight | Size | Notes |
| --- | --- | --- | --- |
| Body | IBM Plex Sans 400 | 15px, line-height 1.6 | docs and home |
| Lead paragraph | IBM Plex Sans 400 | 1.04rem, `--jsb-muted`, max-width 54ch | home |
| Display h1 | Sora 600 | `clamp(2.2rem, 4.8vw, 3.6rem)`, line-height 1.1, letter-spacing -0.02em, `text-wrap: balance` | home hero |
| Display h2 | Sora 600 | `clamp(1.6rem, 3vw, 2.3rem)`, line-height 1.1, letter-spacing -0.02em | home sections |
| h3 | Sora 600 | 1.02rem | home cards |
| Docs h1 / h2 / h3 / h4 | Sora 600 | 2.1rem / 1.55rem / 1.2rem / 1rem, line-height 1.2 | via Infima variables |
| Eyebrow | IBM Plex Mono 400 | 0.7rem, uppercase, letter-spacing 0.14em, `--jsb-accent`, 22px rule before the text | section labels |
| Mono labels (`dt`, captions, stats pill) | IBM Plex Mono 400/500 | 0.7–0.78rem | |
| Code | IBM Plex Mono 400 | 0.8rem (home), 88% of base (docs inline code) | |
| Big numbers | Sora 600 | `clamp(2rem, 4vw, 3rem)`, letter-spacing -0.03em, `font-variant-numeric: tabular-nums` | stats |

Weights shipped: Sora 500, 600, 700; IBM Plex Sans 400, 400 italic, 500, 600; IBM Plex Mono 400, 500. Nothing else may be requested in CSS.

## 5. Motion spec

- Easing: `var(--jsb-ease)` everywhere. Durations: 0.25s hover states, 0.3s underlines, 0.6s button sheen, 0.7s reveals, 1.6s hero draw-in.
- Reveal on scroll: element starts at `opacity: 0; transform: translateY(16px)`, transitions to visible when 8% of it enters the viewport (IntersectionObserver `threshold: 0.08`, `rootMargin: "0px 0px -8% 0px"`), once. Siblings stagger with `transition-delay` 0.05–0.1s steps via a `--d` custom property. Elements are visible by default and only hidden when JS has marked `<html class="jsb-js">`, so SSR HTML and no-JS visitors see everything.
- Buttons: primary lifts `translateY(-2px)` with a soft accent shadow and a diagonal sheen that sweeps once on hover; outline buttons recolour the border to accent and lift; arrow icons slide 3px right.
- Links in nav and text: 1px underline that grows from the left on hover (`scaleX(0) → 1`, transform-origin flips so it exits to the right).
- Hero sheet: paths draw themselves on load (`pathLength="1"`, dashoffset 1 → 0, staggered 0.25s per layer), the violation edge has a marching dash loop, the sheet tilts up to 8°/10° following the pointer and resets on leave; slabs lift 6px on hover/focus.
- `@media (prefers-reduced-motion: reduce)`: reveals render visible with no transition, draw-in and marching dash are off, tilt is not attached, button and slab transitions are none. Also skip the tilt on `(hover: none)` devices.

## 6. UI vocabulary (phase 2 builds these in `src/components/ui`, phase 3 reuses the CSS for docs)

Reference CSS: the `<style>` block of `mockups/mockup-b-blueprint.html`, selectors `.btn*`, `.link`, `.eyebrow`, `.lead`, `.code`, `.install`, `.stars`, `.icon-btn`. Port them replacing `--paper`→`--jsb-paper`, `--ink`→`--jsb-ink`, etc. Values to keep exactly: button height 42px, radius 6px, padding 0 1.15rem, font 600 0.9rem; stars pill height 34px mono 0.78rem; focus ring `outline: 2px solid var(--jsb-accent); outline-offset: 3px`.

Components: `Button` (`variant: "primary" | "outline"`, optional arrow icon, renders `Link` when `to`/`href` given), `Eyebrow`, `SectionHead` (eyebrow + h2 + optional lead, max-width 60ch), `CodeSnippet` (Prism highlight on the always-dark palette, left accent rule, shadow), `TerminalOutput` (preformatted text with error/path/position colours), `Reveal` (wrapper applying the reveal behaviour).

## 7. Code conventions for the website

- TypeScript function components returning `ReactNode`; one folder per component with `<Name>.tsx` and `<Name>.module.css`; re-export nothing from barrels (import the file).
- Styling: CSS Modules for components, `src/css/*.css` for globals only. No inline `style` except values computed at runtime (tilt transform, stagger `--d`). No `!important` unless overriding a Docusaurus inline style (announcement bar); comment why.
- Imports inside `src/` are relative (`../ui/Button/Button`), never `@site/src/...`; `@site/` stays for MDX docs only. Reason: the boundaries lint config added in phase 2 only sees resolvable imports.
- Internal links use `Link` from `@docusaurus/Link`; headings on the home use `Heading` from `@theme/Heading` for h1/h2.
- SSR safety: no `window`, `document`, `localStorage`, `matchMedia` at module scope or during render; use `useEffect`, `useIsBrowser` (`@docusaurus/useIsBrowser`) or `BrowserOnly`. Values that differ between build and client (current year, live stats) render the fallback first and update in an effect, so hydration never mismatches.
- Accessibility: every icon-only control has `aria-label`; decorative SVG has `aria-hidden="true"`; the hero SVG has an `aria-label` describing the drawing; interactive SVG groups are focusable (`tabIndex={0}`, `role="button"`) and react to focus like hover; colour is never the only signal (the violation edge is dashed and labelled); keyboard focus is visible (section 6 ring).
- Copy and code are in English. The texts of the home are fixed in `02-home.md`; do not rewrite them.
- Dependencies: adding one needs a reason in the PR. Allowed by this plan: `playwright-core` (dev), `eslint-plugin-boundaries` (dev), `@fontsource/*` (dev, only to copy font files). Removed by this plan: `react-github-btn`.

## 8. Quality gates and definition of done

A phase is done when all of these hold and the PR says so:

- [ ] `pnpm nx check:all website` passes (lint, types, spell, build).
- [ ] The screenshot script (phase 2 adds `packages/website/scripts/screenshots.mjs`; before that, run the scratch script listed in `02-home.md` section 10 from a folder outside the repo) reports no horizontal overflow and no console errors at 1440×900 and 390×844, light and dark, for every page the phase touches.
- [ ] Lighthouse (desktop preset) on the touched pages: Performance ≥ 95, Accessibility 100, Best practices ≥ 95. Command: `pnpm dlx lighthouse@12 http://localhost:3000/<path> --preset=desktop --only-categories=performance,accessibility,best-practices --output=html --output-path=./lighthouse-<name>.html` against `pnpm --filter website serve`. Report the numbers; a miss is acceptable only with a stated cause outside the phase (for example third-party scripts).
- [ ] Both themes checked by eye against `mockups/mockB-light.png` / `mockB-dark.png` where applicable; system theme switching works (toggle and OS preference).
- [ ] Reduced motion checked once (OS setting or DevTools emulation): nothing is hidden, nothing moves.
- [ ] No request leaves to Google Fonts or any font CDN (Network tab).
- [ ] Changelog entry added; no `packages/website/package.json` version bump.
- [ ] Nothing from the mockup that was "mockup-only" ships (background switch, `data-bg` variants, hard-coded stats as the final value).
