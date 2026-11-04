<!-- cspell:disable -->
# T6: the node panes and the inspector

Goal: the middle pane in its three M1 states (a file, the config, nothing) and the right pane, the inspector, for the same three, from the `Evaluation` of the engine.

Read first: `README.md` of this folder (`Evaluation` and its summaries, `Focus`); the engine (T2, `src/engine/`), the foundation (T3) and the config editor (T4, `src/ui/config/`), all committed; `../00-shared.md` section 6 ("Panes": node in focus and inspector; "Focus"); the mockup's `file`, `config`, `empty` states and the `.code`, `.line`, `.add-dep`, `.empty`, `.inspector-body`, `.facet`, `.rows`, `.numbers`, `.summary` rules of `../mockups/playground.html`; `packages/website/src/components/home/PlaygroundTeaser/` for how a captured value reads (`captured { name: "Price" }`).

## Files

- `src/ui/node/FilePane.tsx`: `{ path: string }`. `PaneHead` `File` with the path; the code area (`--jsb-code`) with the dependency list, empty in M1: a line `No dependencies yet.` in `--jsb-code-comment`, then the dashed `+ Dependency` button, disabled, wrapped so that its `Tooltip` `Dependencies arrive in the next milestone` shows on hover and focus. Phase 6 fills the list (the lines of section 6: number, statement, actions, verdict); keep the list a component of its own (`DependencyLines`) that renders nothing for an empty list.
- `src/ui/node/ConfigPane.tsx`: `{ config: string; problems; readOnly; reveal?; highlight?; onChange }`. `PaneHead` `Config` with the path `eslint.config.js` and the hint `JSON5 · the settings and rules of an ESLint config`, then `ConfigEditor` (label `eslint.config.js`).
- `src/ui/node/EmptyPane.tsx`: `{ canAddFile: boolean; onOpenConfig: () => void; onAddFile: () => void }`. `PaneHead` `Nothing open`, the 16 px `--jsb-grid` grid background, the title `Open a file or the config` (Sora 16 px), the text of the mockup, and `Open eslint.config.js` (outlined) and `+ File` (text, only when `canAddFile`).
- `src/ui/node/index.ts`.
- `src/ui/inspector/Inspector.tsx`: `{ focus: Focus; evaluation: Evaluation; onReveal: (range: TextRange) => void }`, with `PaneHead` `Inspector` and:
  - a file: the path (mono 12.5 px), then the facets `element` (`types`, `path`, `captured`), `file` (`categories`) and `module` (`origin`) of `evaluation.files.get(path)`, in a 76 px key column. The dependency summary of the mockup comes in phase 6.
  - the config: `eslint.config.js`, then `Element types` (one row per `elementTypes` entry: the type, `n file`/`n files` in `--jsb-muted`, the patterns below; an ignored one shows its type and `ignored` in `--jsb-warn` and `invalid descriptor, line N` below), `File categories` (the same), `Policies` (one row per `rules` entry: the rule name and `n policies`; `not evaluated` in `--jsb-bad` with `invalid options` below when it is not valid). A row is a button: it calls `onReveal` with its range.
  - nothing: `Sketch` and a 2×2 grid of numbers (files, element types, file categories, policies, the sum of the rules' policies); phase 6 makes it the 2×3 grid of the mockup with dependencies and disallowed.
- `src/ui/inspector/FormatValue.ts`: formats a described value as the mockup shows it: `null`, a string in double quotes, an array as `[ "a", "b" ]`, an object as `{ name: "Price" }` (keys unquoted when they are identifiers), nested values the same way. `null` renders in `--jsb-faint`.
- `src/ui/inspector/index.ts`.
- Specs: each pane state; the disabled button and its tooltip; `onOpenConfig` and `onAddFile`; the inspector for the quick-start files (use `evaluate` of the engine on `QUICK_START_EXAMPLE` of `src/examples/`), for the config with and without the mockup's two problems, and for nothing; `onReveal`; `formatValue` for every kind.
