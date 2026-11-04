<!-- cspell:disable -->
# Phase 5: the interface mockup, then M1 Identify

Goal: first, an HTML mockup of the whole playground interface, iterated with the maintainer until the style and the layout are approved and kept in `playground/mockups/` as the ground truth; then the panes that classify files: project tree with text mode, the config node and its editor with located errors, the node pane for a file, the inspector with the three facets, the problems panel with its `Sketch` tab.

Issue: #552. Branch `feat/552/playground-identify` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): identify the files of a sketched project`, `closes #552`. Changelog: none (the package is private; the website entry comes with phase 7). The mockup, its renders and the "Interface" section of `00-shared.md` are one commit of this PR (`chore(playground): add the approved interface mockup`), made once the maintainer approves the mockup and before the first component. The PR description shows screenshots of the real page next to the mockup renders, both themes, 1440 px, and the 390 px note.

Read first:

- RFC #538, "Interface" (decisions 1 to 7, the layout drawing, the problems panel states, the pane by pane description) and the sketches on the branch `rfc/538-playground-assets` (`playground-layout-*.png`, `playground-problems-*.png`, `playground-picker-*.png`): the RFC sketches are the starting point of the mockup, not its result.
- `packages/playground/AGENTS.md` (host contract, layering, stack, harness) and its `eslint.config.mjs` (the element types in force); decisions 14 and 15 of the index.
- Research notes [3](https://github.com/javierbrea/eslint-plugin-boundaries/issues/539#issuecomment-6577804232) and [4](https://github.com/javierbrea/eslint-plugin-boundaries/issues/539#issuecomment-6577804811) on #539: the versions measured and the limits found (momoa error messages, the JSON5 grammar of CodeMirror, the widgets of MUI).
- The redesign's home mockup process as a model: PR #536 and #537 descriptions, and the fact that the mockup (`mockup-b-blueprint.html`) was a single HTML file with the site's tokens, rendered at both widths in both themes by a Playwright script before any component was written. `packages/website/scripts/screenshots.mjs` is the model for the render script.
- `packages/website/src/css/tokens.css`, `fonts.css`; `packages/website/src/components/home/PlaygroundTeaser/` for the result rows' vocabulary (`element · component · captured { name: "Price" }`).
- `packages/config` README ("Diagnostics", "Diagnostic Paths", the `rootPath` option) and `AGENTS.md`; `packages/policies` README for `describeEntity`.

Preconditions: met on 2026-11-03. Phase 4 is merged (#599) and `release` is merged into `feat/539/playground` after it (0a033f7d). Run `pnpm install` after checking out the phase branch.

## From phase 4

- `src/theme/Theme.ts` is where the mockup's values go: typography, shape, elevation, ripple. In the dark scheme, MUI's `Paper` adds a lighter overlay that the theme overrides.
- `src/ui/Placeholder.tsx` stands in for the panes, and this phase replaces it. `Playground` (`src/Playground.tsx`) loads the store's sketch first and the source's when the store has none, and shows the reason when the load fails; the panes keep both behaviors.
- The libraries still to add, each a `dependency` at an exact version: `@humanwhocodes/momoa`, CodeMirror 6 (`@codemirror/state`, `@codemirror/view`, `@codemirror/language`, `@codemirror/lint` and what the editor setup needs), `codemirror-json5`, `@mui/x-tree-view` and `react-resizable-panels`, at the versions of research notes 3 and 4 or newer ones at least two days old (`00-shared.md` section 1).
- `engine` is declared in `eslint.config.mjs` with no file yet; `examples` is not declared. A new element type is declared there, with its policies, before its first file.
- The website page (`packages/website/src/pages/playground.tsx`) shows the desktop-only note and never requests the chunk below 996 px, the mobile navbar breakpoint of Docusaurus. Its lazy factory creates an empty `SketchSource` and a `MemoryStore`.
- Infima's element styles (links, `code`, tables, lists, headings) reach the playground on the website and not in the harness. The placeholder's heading, text, button and dialog render the same in both (2026-11-02); this phase checks the elements it adds.

## Scope

In: the mockup and its approval loop; the project pane (tree and text mode), the config node and editor with diagnostics, the file pane without dependencies, the inspector, the problems panel with the `Sketch` tab, live re-evaluation, resizable panes, the quick-start example as default state; the `Sketch` model for tree and config. Out: dependencies and verdicts (phase 6), URL state, Share, example picker, navbar and teaser (phase 7).

## Steps

### 1. The mockup

- One static HTML file, `playground/mockups/playground.html`, with inline CSS that links the website tokens and fonts relatively (`../../../../packages/website/src/css/tokens.css` and `fonts.css`, so it renders from the repo checkout), a `data-theme` switch, and the desktop layout at 1440 px: top bar (`Drafting table` eyebrow, example picker, Share, Reset), project pane with the quick-start tree and `eslint.config.js` at the root, node pane showing a file with three import statements and verdict marks (so the M2 state is designed now, even if M1 renders no dependencies), inspector with the three facets, problems panel with the three tabs in their three states (three copies of the panel, or a toggle), the dependency picker as a static dialog, the config node state (editor with an underlined error), the empty state (nothing in focus) and the desktop-only note.
- The mockup draws the widgets that MUI and `@mui/x-tree-view` provide (decision 15), restyled to the tokens, so that the components can reach it through the theme. A widget that MUI does not have is named as such when the mockup is approved.
- A render script, `playground/mockups/render.mjs`, that uses `@playwright/test` (a root devDependency) to screenshot the mockup in both themes at 1440×900 and 390×844 into `playground/mockups/*.png`, so that every iteration leaves renders the maintainer can compare without opening the file. `fonts.css` loads the fonts from `/fonts/`, so the script serves the repository over a local HTTP server, with `/fonts/` mapped to `packages/website/static/fonts/`, instead of opening the file.
- Iterate with the maintainer: present the renders, apply the feedback, re-render. Each round is a message with what changed. Stop when the maintainer says it is approved; then write in `00-shared.md`, as section 6 "Interface (phases 5 to 8)", the facts the components must follow (pane widths and min widths, type sizes, spacing, colors by token, icons, interaction states, what happens on focus changes), because phases 6 and 7 build on them too, and commit the mockup, the renders and that section.

### 2. The sketch model and the engine adapter

`src/contract/Sketch.types.ts` is the model: a `Sketch` is `{ config, tree, dependencies }`, where `config` is the JSON5 text, a node of `tree` is `{ path, kind: "file" | "folder" }`, and `dependencies` has the shape of phase 6 (empty until then); `SketchSource` serves one.

`src/engine/`:

- Parse the config with `@humanwhocodes/momoa` in JSON5 mode into a value plus a location map (JSON path → range). A parse error is a diagnostic at its position; momoa's messages name tokens (a spread reads as `Unexpected token Number found`), so the engine prefixes them with what the node accepts: one JSON5 object `{ settings, rules }` (RFC #538, Interface decision 5).
- Call `normalizeConfig` of `config` on the parsed value and map each diagnostic to ranges: a diagnostic has one path per affected entry, rooted at the config object, and the empty path is the whole config. A path resolves to a range by walking it down the momoa tree (research note 3).
- Call `describeEntity` of `policies` for every file path with the normalized settings.
- Expose one `evaluate(sketch) → { files: Map<path, description>, configDiagnostics, ... }` function, pure and memoized by sketch identity, run after a debounce (150 ms) from the component. Module origin: every file of the sketch is `local` (research note 1).

### 3. The panes

Following the approved mockup and the RFC "Pane by pane":

- Project pane: `RichTreeView` of `@mui/x-tree-view`, with label editing for rename, and add file / add folder / delete; `eslint.config.js` pinned at the root, red state and count placeholders (counts arrive in phase 6), and the `⌨ text` mode: a textarea with one path per line (folders end with `/`), parsed back into the tree on blur or after a debounce; both modes edit the same `Sketch`.
- Node in focus, file: the path as header and the (empty) dependency list with the `[+ dependency]` button disabled with a tooltip "Dependencies arrive in the next milestone" until phase 6; the mockup shows the final state.
- Node in focus, config: CodeMirror 6 with the JSON5 grammar of `codemirror-json5` (decision 14), syntax highlighting themed by tokens (`EditorView.theme` and a `HighlightStyle` with `var()` values), diagnostics underlined at their range with the message on hover (`@codemirror/lint`), and a gutter highlight API (used by phase 6 for "Open policy in config").
- Inspector: for a file, the three rows in the teaser vocabulary (element type and captured values, file categories, module origin) from `describeEntity`; for the config node, the element types declared and how many files each matches; for nothing, the sketch in numbers (files, element types, policies).
- Problems panel: the `Sketch` tab with the config diagnostics (count in the tab, click opens the config node at the range); the tab strip and the resizable, collapsible panel. The file and dependency tabs arrive in phase 6, but the strip handles n tabs now.
- Layout: the four regions with resizable splits (`react-resizable-panels`, decision 15), with the sizes of `00-shared.md` section 6; the component also refuses to render below 996 px (defensive), where the website already shows its note. The website page loses its header and gives the playground the full page (section 6, "Page").
- Default state: the quick-start example of the docs (`packages/website/docs/quick-start.mdx`: its tree and its config), as `src/examples/quickStart.ts` in the package, in a new element type `examples` that the entry exports; the website's lazy factory and the harness (`dev/main.tsx`, which has a sample sketch of its own today) pass it to their `SketchSource`.

### 4. Tests and harness

Component tests for: the text mode round trip; the diagnostics mapping (a wrong key in the config is underlined and listed); the inspector rows for the quick-start files (compare with the plugin's `boundaries/debug` output for the same fixture, captured once into a test fixture). The harness renders the default state.

## Verification

- Acceptance criteria of #552, each checked and named in the PR description.
- Quality gates of `00-shared.md` section 4 on the real page.
- `pnpm nx check:all playground` and `website` pass; the chunk is still absent from other pages.
- The elements the panes add render the same in the harness and on the website, where Infima's element styles apply.
- The renders of the real page match the mockup within reason; where they differ deliberately, the mockup is updated (plan edit).

## Hand-offs

- To phase 6: the `Sketch` model with its `dependencies`, the engine `evaluate` function to extend with verdicts, the gutter highlight API of the editor, the tab strip API of the problems panel, the red-state placeholders of the tree; and the theme overrides of the picker widgets, which phase 5 does not use and does not write: `InputLabel` (the floating label), `Autocomplete` and its listbox, `Chip` and `Radio`, in `src/theme/Theme.ts`.
- To phase 7: the `src/examples/` folder the example picker lists, and the sketch serialization the URL store needs.

## Open points

- Whether the text mode uses indentation or trailing `/` to mark folders. Default: trailing `/`, one path per line, as the RFC drawing shows.
- Where the quick-start example data lives so that phase 8's docs buttons and phase 7's picker reuse it. Default: in the package (`src/examples/`), exported for the website.
- The sketch paths are relative to its root. Check how `describeEntity` treats them and whether `normalizeConfig` needs a `rootPath`. Default: pass the paths as they are and no `rootPath`, if the descriptions match `boundaries/debug` on the fixture.
- `codemirror-json5` had its last release in June 2023 and depends on `json5` for a linter the playground does not use. Default: use it; if either becomes a problem, define the language from `lezer-json5` directly (research note 3).
