<!-- cspell:disable -->
# T8: the workbench, the page and the harness

Goal: the playground works end to end: `Workbench` holds the state and lays out the panes of T5 to T7 with resizable splits, `Playground` renders it and saves every edit to the store, the entry exports the example, the harness and the website render the quick-start example, and the website page has the layout of section 6 ("Page"). This task runs alone, so it may use Nx and the whole suite.

Read first: `README.md` of this folder (design and data flow); every committed task (T1 to T7 and T10); `../05-m1-identify.md` steps 3 and 4 ("Layout", "Default state", tests and harness); `../00-shared.md` sections 3, 4 and 6 (all of it); the mockup and its renders; `packages/playground/src/Playground.tsx` and its spec, `dev/main.tsx`, `packages/website/src/pages/playground.tsx` and `playground.module.css`; `packages/website/AGENTS.md`; the docs of `react-resizable-panels` 4 in `packages/playground/node_modules/react-resizable-panels`.

## Files

- `src/ui/state/Workbench.types.ts`, `useWorkbench.ts`: the state of the data flow (sketch, focus, project view, selected problems tab, collapsed, text problems, the pending `reveal` of the editor) in a reducer, with actions for each edit. Rules: a focus on a node selects its tab; `none` selects `Sketch`; opening a config problem focuses the config and reveals its range; the focus follows renames and removals (the project pane reports them).
- `src/ui/state/useEvaluation.ts`: `evaluate` of the engine 150 ms after the last change of the sketch, the first one at once (no empty first render), the debounce cleared on unmount.
- `src/ui/layout/TopBar.tsx`: the 44 px bar with the status of section 6 in M1: `n files · n problems` after the dot (`--jsb-ok`, or `--jsb-bad` and `config has errors` when the config has errors); the dependencies count is phase 6, the example picker, Help, Reset and Share phase 7.
- `src/ui/layout/Regions.tsx`: the regions of section 6 with `react-resizable-panels`: the default sizes and minimums in pixels, the problems panel collapsible to its 34 px head, the project panel 420 px while text mode is on and back to its previous size after; separators with their ARIA role and keyboard support, styled as section 6 says.
- `src/ui/Workbench.tsx`: composes the top bar, `ProjectPane`, the node pane for the focus (`FilePane`, `ConfigPane`, `EmptyPane`), `Inspector` and `ProblemsPanel` with its tabs (`Sketch` with config and text problems; the open node's tab: `eslint.config.js` with the config problems, or the file label with no problems in M1, `No problems in this file.`; the note when `rulesValid` is false). Below 997 px it renders the desktop-only note instead (CSS media query), defensive: the website does not render it there.
- `src/ui/index.ts`: exports `Workbench` and the load states; `src/ui/Placeholder.tsx` and its types are deleted (the loading and failed states move to a small component of `src/ui/`, with the texts the placeholder has).
- `src/theme/Root.tsx`: the root element gets the base of section 6 ("Regions and sizes"): background `--jsb-card`, color `--jsb-ink`, and the body font at 13 px with a 1.45 line height. Dialogs, menus and tooltips render inside the root element and not inside the workbench, so they take their text from it: without it, T3 found the text of a `DialogContent` at the host's 16 px.
- `src/Playground.tsx`: renders the load states and the `Workbench` with the loaded sketch and the source's capabilities, and saves each sketch the workbench produces with `store.save`, never the loaded one. A failed save shows nothing in M1 (the memory store cannot fail; phase 7's hash store decides).
- `src/index.ts`: exports `QUICK_START_EXAMPLE`, `EXAMPLES` and the `Example` type.
- `dev/main.tsx`: the harness uses `QUICK_START_EXAMPLE.sketch` instead of its own sample, and fills the viewport below its bar.
- `packages/website/src/pages/playground.tsx` and `playground.module.css`: the page of section 6 ("Page"): no eyebrow, visible title or lead; a visually hidden `h1` `Playground`; `Layout` keeps `title` and `description`; from 997 px the stage fills the viewport below the navbar (`max(620px, 100vh - var(--ifm-navbar-height))`) with no border, radius or margin, and the footer is hidden by CSS scoped to this page (`wrapperClassName` of `Layout` and a sibling selector, or another way that touches only this page); below 997 px the note with its margin and the footer. The lazy factory passes `new SketchSource(QUICK_START_EXAMPLE.sketch)`. The `Eyebrow` import goes if nothing else uses it there.
- Specs: `src/Playground.spec.tsx` updated (the load states, the workbench renders, saving to the store after an edit and not on load); `src/ui/Workbench.spec.tsx` (open a file, open the config, a config problem opens the editor at its range, text mode round trip, focus follows a rename and a removal, tabs follow the focus, collapse); the reducer and the hooks (fake timers for the debounce).
- `packages/playground/README.md`: the usage example shows `QUICK_START_EXAMPLE`.

## Verification of this task

- `pnpm nx check:all playground --output-style=stream` and `pnpm nx check:all website --output-style=stream` pass.
- `pnpm nx dev playground` renders the quick-start example; screenshot the harness with Playwright in both themes at 1440×900 in the states `empty`, `file` and `config` (with the mockup's two typos typed in), and put the images next to the mockup's renders of the same states in the report, with every visible difference listed.
- Every element the panes add renders the same in the harness and on the website (`pnpm nx start website`, `/playground/`), where Infima's element styles apply (`../05-m1-identify.md`, "From phase 4").

## Done (2026-11-04)

Deviations, for T9 and the PR:

- `Root` is `height: 100%`, so the host gives the container its height (the harness stage, the website `.stage`); `packages/playground/AGENTS.md` and `README.md` say so.
- `+ File` of the empty pane adds a free `new-file.js` at the root and opens it; `ProjectPane` has no way to start a rename from outside, so the user renames it in the tree.
- The `Sketch` tab lists the config problems and then the text problems; the invalid-rules note shows in the `Sketch` and config tabs; a text problem row opens nothing.
- The top bar reads `0 problems` in `--jsb-muted` when there are none.
- Changes to committed files of other tasks: `ProblemsPanel` expands when its selected tab is pressed while collapsed (T7); `EmptyPane` and `ConfigPane` reset Infima's `code` chip and the `h2` letter spacing, and `MuiDialogTitle` has `letterSpacing: normal` (T3, T6); and, from the coordinator's review of the screenshots, the `PaneHead` hint is weight 400, the disabled `+ Dependency` stays dashed, and an ignored element type has its name in `--jsb-warn` (T3, T6).

Differences from the mockup that are not M1 by design, for T9 step 3: the config problems come in the engine's order (the warning at 5:7 before the error at 15:16); the warning row appends its detail (`Invalid descriptors: [...]`); the lint tooltip opens above the range; the open config editor shows its focus ring; the selected tree row shows its rename and delete actions while it has focus.
