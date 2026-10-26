<!-- cspell:disable -->
# Phase 5: the interface mockup, then M1 Identify

Goal: first, an HTML mockup of the whole playground interface, iterated with the maintainer until the style and the layout are approved and kept in `playground/mockups/` as the ground truth; then the panes that classify files: project tree with text mode, the config node and its editor with located errors, the node pane for a file, the inspector with the three facets, the problems panel with its `Sketch` tab.

Issue: #552. Branch `feat/552/playground-identify` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): identify the files of a sketched project`, `closes #552`. The mockup is committed on `feat/539/playground` as a plan edit (`chore(playground): add the approved interface mockup`) once approved, before the components are written, so that the PR of this phase contains only code. The PR description shows screenshots of the real page next to the mockup renders, both themes, 1440 px, and the 390 px note.

Read first:

- RFC #538, "Interface" (decisions 1 to 7, the layout drawing, the problems panel states, the pane by pane description) and the sketches on the branch `rfc/538-playground-assets` (`playground-layout-*.png`, `playground-problems-*.png`, `playground-picker-*.png`): the RFC sketches are the starting point of the mockup, not its result.
- `04-scaffold.md` hand-offs: stack, contract, layout, CSS scheme, breakpoint.
- The redesign's home mockup process as a model: PR #536 and #537 descriptions, and the fact that the mockup (`mockup-b-blueprint.html`) was a single HTML file with the site's tokens, rendered at both widths in both themes by a Playwright script before any component was written.
- `packages/website/src/css/tokens.css`, `fonts.css`; `packages/website/src/components/home/PlaygroundTeaser/` for the result rows' vocabulary (`element · component · captured { name: "Price" }`).
- `packages/config` README and `AGENTS.md` for the diagnostics shape; `packages/policies` README for `describeEntity`.

Preconditions: for the mockup, none (it can start any time, even before phase 4 is merged, since it is static HTML); for the implementation, phase 4 merged.

## Scope

In: the mockup and its approval loop; the project pane (tree and text mode), the config node and editor with diagnostics, the file pane without dependencies, the inspector, the problems panel with the `Sketch` tab, live re-evaluation, resizable panes, the quick-start example as default state; the `SketchSource` model for tree and config. Out: dependencies and verdicts (phase 6), URL state, Share, example picker, navbar and teaser (phase 7).

## Steps

### 1. The mockup

- One static HTML file, `playground/mockups/playground.html`, with inline CSS that reads the website tokens (link `../../../packages/website/src/css/tokens.css` and `fonts.css` relatively, so it renders from the repo checkout), `data-theme` switch, desktop layout at 1440 px: top bar (`Drafting table` eyebrow, example picker, Share, Reset), project pane with the quick-start tree and `eslint.config.js` at the root, node pane showing a file with three import statements and verdict marks (so the M2 state is designed now, even if M1 renders no dependencies), inspector with the three facets, problems panel with the three tabs in their three states (three copies of the panel, or a toggle), the dependency picker as a static dialog, the config node state (editor with an underlined error), the empty state (nothing in focus) and the desktop-only note.
- A render script, `playground/mockups/render.mjs`, that uses `@playwright/test` (a root devDependency since #557; before it merges, the website's `playwright-core`) to screenshot the mockup in both themes at 1440×900 and 390×844 into `playground/mockups/*.png`, so that every iteration leaves renders the maintainer can compare without opening the file.
- Iterate with the maintainer: present the renders, apply the feedback, re-render. Each round is a message with what changed. Stop when the maintainer says it is approved; then record in this file ("Decisions of the mockup") the facts the components must follow (pane widths and min widths, type sizes, spacing, colors by token, icons, interaction states, what happens on focus changes) and commit mockup, renders and the plan edit on `feat/539/playground`.

### 2. The sketch model and the engine adapter

`src/contract/`: `SketchSource` holds `{ tree: Node[], config: string, dependencies: [] }` where a node is `{ path, kind: "file" | "folder" }` and the config is the JSON5 text; `src/engine/`: parse the config with the parser chosen in research note 3 into a value plus a location map (JSON path → range); call `normalizeConfig` of `config` on the parsed value and map its diagnostics (JSON paths rooted at the config object) to ranges; call `describeEntity` of `policies` for every file path with the normalized settings; expose one `evaluate(sketch) → { files: Map<path, description>, configDiagnostics, ... }` function, pure and memoized by sketch identity, run after a debounce (150 ms) from the component. Module origin: every file of the sketch is `local`, anything else `external` (RFC research 1).

### 3. The panes

Following the approved mockup and the RFC "Pane by pane":

- Project pane: tree component of the stack with add file / add folder / rename / delete, `eslint.config.js` pinned at the root, red state and count placeholders (counts arrive in phase 6), and the `⌨ text` mode: a textarea with one path per line (folders end with `/`), parsed back into the tree on blur or after a debounce; both modes edit the same `SketchSource`.
- Node in focus, file: the path as header and the (empty) dependency list with the `[+ dependency]` button disabled with a tooltip "Dependencies arrive in the next milestone" until phase 6; the mockup shows the final state.
- Node in focus, config: the editor chosen in note 3, with the JSON5 text, syntax highlighting themed by tokens, diagnostics underlined at their range with the message on hover, and a gutter highlight API (used by phase 6 for "Open policy in config").
- Inspector: for a file, the three rows in the teaser vocabulary (element type and captured values, file categories, module origin) from `describeEntity`; for the config node, the element types declared and how many files each matches; for nothing, the sketch in numbers (files, element types, policies).
- Problems panel: the `Sketch` tab with the config diagnostics (count in the tab, click opens the config node at the range); the tab strip and the resizable, collapsible panel. The file and dependency tabs arrive in phase 6, but the strip handles n tabs now.
- Layout: the four regions with resizable splits (library of the stack or a small custom splitter), minimum widths from the mockup; below the breakpoint, the host renders the note (phase 4), and the component also refuses to render below it (defensive).
- Default state: the quick-start example of the docs (`packages/website/docs/quick-start.mdx`: its tree and its config), as a `examples/quickStart.ts` in the package.

### 4. Tests and harness

Component tests for: the text mode round trip; the diagnostics mapping (a wrong key in the config is underlined and listed); the inspector rows for the quick-start files (compare with the plugin's `boundaries/debug` output for the same fixture, captured once into a test fixture). The harness renders the default state.

## Verification

- Acceptance criteria of #552, each checked and named in the PR description.
- Quality gates of `00-shared.md` section 6 on the real page.
- `pnpm nx check:all playground` and `website` pass; the chunk is still absent from other pages.
- The renders of the real page match the mockup within reason; where they differ deliberately, the mockup is updated (plan edit).

## Hand-offs

- To phase 6: the `SketchSource` shape with the `dependencies` field reserved, the engine `evaluate` function to extend with verdicts, the gutter highlight API of the editor, the tab strip API of the problems panel, the red-state placeholders of the tree.
- To phase 7: the `examples/` folder shape the example picker lists, and the `SketchSource` serialization the URL store needs.

## Decisions of the mockup

Filled by this phase once the mockup is approved.

## Open points

- Whether the text mode uses indentation or trailing `/` to mark folders. Default: trailing `/`, one path per line, as the RFC drawing shows.
- Where the quick-start example data lives so that phase 8's docs buttons and phase 7's picker reuse it. Default: in the package (`src/examples/`), exported for the website.
