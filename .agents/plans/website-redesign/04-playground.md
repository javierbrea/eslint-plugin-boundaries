<!-- cspell:disable -->
# Phase 4: playground (separate milestone)

Goal: an in-site app at `/playground/` where a visitor pastes (or edits) a `settings` object, sketches a folder tree, and sees how every file is classified (element, file, module facets) and which dependencies a policy set allows or disallows. Two scenarios from the brief:

1. Review a config: paste `boundaries/elements` + `boundaries/files` (+ optionally a `boundaries/dependencies` policy list) and get it validated and explained.
2. Identify elements: given a fake folder structure and a config, show the description of each file, and the verdict of selected imports.

This phase starts with research; nothing here is final until the research tasks below are answered and the maintainer picks the stack. Phases 1–3 do not depend on it.

Read first: `../website-redesign.md`, `00-shared.md`, `.agents/skills/repo-architecture/SKILL.md` (this phase is a cross-package change), `packages/elements/AGENTS.md`, `packages/elements/README.md`.

## Fixed points

- Route `src/pages/playground.tsx` → Docusaurus `Layout` + `BrowserOnly` + `React.lazy` of `src/playground/App.tsx`. Client-only by design; the server render shows a skeleton with the page title and the eyebrow `Drafting table`.
- Code lives in `packages/website/src/playground/` while it is small; it becomes `packages/playground` (own Nx project, consumed by the website) if it grows beyond the website's scope. Either way, it consumes `@boundaries/elements` from the workspace, which adds an Nx dependency `website build → elements build`: update `project.json`, the `repo-architecture` skill table and `packages/website/AGENTS.md` in the same change.
- Visual language: the hero drawing's vocabulary (slabs per element type, teal `allow` edges, dashed vermilion `disallow` edges, mono descriptor captions) and the result rows of the home's playground teaser (`element · component · captured { name: "Price" }`, `report · … · disallowed`). The canvas dependency graph from `mockups/mockup-a-signal.html` is a candidate for the "whole project" result view.
- Tokens, fonts and the UI components of phases 1–2 are the base; whatever component library is chosen must read the `--jsb-*` tokens and must not restyle the rest of the site (no global resets, no `CssBaseline`, scoped style injection).
- The home's "Playground SOON" teaser and the navbar link are switched on in the same PR that ships the first usable version.

## Research tasks (each answered in a short note under `.agents/plans/website-redesign/research/`)

1. Browser build of `@boundaries/elements`: bundle `Elements.getMatcher(...).describeEntity(path)` and `isDependencyMatch` into a Docusaurus page and check it runs with no Node-only APIs (`path`, `fs`, resolver code). Measure the gzipped size. If the module resolver is the blocker, the playground supplies module origins itself (the sketched tree is the whole universe: anything not in it is `external`).
2. Policy evaluation: `isDependencyMatch` matches selectors; the `default/allow/disallow` ordering and the message templating live in `packages/eslint-plugin`. Options: (a) run ESLint's `Linter` in the browser with the plugin (how the ESLint playground works; size and feasibility with the plugin's resolver settings), (b) extract the policy evaluation into `@boundaries/elements` or a new small package so the website and the plugin share it, (c) re-implement the ordering in the playground (last resort; drift risk). Recommend one.
3. Editor: CodeMirror 6 (`@codemirror/lang-javascript`, ~150 KB gz with language support) vs a plain `textarea` with `JSON5`/`eval`-free parsing for the settings input. The settings are JS objects, not JSON (unquoted keys, trailing commas, `${from.element.type}` templates): decide the input format (JSON5 is the pragmatic answer).
4. Component stack: MUI (`@mui/material` 6/7 with `cssVariables: true`, theme tokens mapped from `--jsb-*`, Emotion `CacheProvider` scoped to the playground root, `disableTransitionOnChange`, no `CssBaseline`; cost ≈ 90 KB gz lazy-loaded) vs Base UI/Radix primitives + CSS Modules (cost ≈ 20 KB gz, more work on forms/tables) vs CSS Modules only (consistent with the site; fine for one form, one tree, one table). Decide by counting the widgets the two scenarios actually need.
5. State and sharing: encode the config + tree in the URL hash (compressed) so a playground state can be linked from issues and docs. Check Docusaurus routing keeps the hash on client navigation.

## Milestones after research

- M1 Identify: tree editor (indented text or a small tree component), settings editor, results table with the three facets per file, inline validation errors from `@boundaries/elements` config parsing.
- M2 Verdicts: pick `from` and `to` files (or list every import written in the tree as `a → b` lines) and show the policy that decided, with its templated message.
- M3 Share and embed: URL state, "Open in playground" buttons generated from code blocks in the docs (MDX component).

## Acceptance (to be refined with the stack decision)

- Everything in `00-shared.md` section 8 for `/playground/`, with Performance measured on the loaded app (lazy chunk included).
- The docs' own quick-start example (three element types, two file categories, three policies) reproduces in the playground the error shown on the home's step 3.
- The playground's chunk is not loaded on any other page (check the network tab on `/` and a docs page).
