<!-- cspell:disable -->
# Phase 6: M2 Verdicts

Goal: files have dependencies, entered through the picker and rendered as import statements with a verdict per line; the problems panel has its three focus tabs with the policy that decided and its message; the tree shows red nodes with counts.

Issue: #553. Branch `feat/553/playground-verdicts` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): verdicts of the dependencies`, `closes #553`. The PR description shows the quick-start error of the home's step 3 reproduced, the three problems panel states and the picker, both themes.

Read first:

- RFC #538, "Interface" decisions 3, 4 and 6, the picker drawing, the problems panel states, and "Milestones" M2.
- The approved mockup (`playground/mockups/`, the `dependency`, `picker` and `policy` states) and section 6 "Interface" of `00-shared.md`.
- `packages/policies` README and `AGENTS.md`: `describeDependency` and its input (`DependencyDescriptorOptions`: `from`, `to`, `source`, `kind`, `nodeKind`, `specifiers`), `evaluateDependency` and its result (`checked` with a skip `reason`, or `allowed`, `policyIndex`, `match`, `message`, `diagnostics`), whose `message` is set only when `allowed` is `false`; `getDependencySkipReason(options, description)` gives the skip reason alone.
- `packages/website/src/components/home/Steps/` for the exact step 3 scenario and the message the home shows.

Preconditions: met. Phase 5 merged into `feat/539/playground` on 2026-11-06 (#621), and `release` with v7.4.2 was merged into it on 2026-11-05.

## From phase 5

The code is the reference; these are the seams phase 5 left for this phase.

- `Sketch` (`src/contract/Sketch.types.ts`) already has `dependencies` in the shape of step 1, and every edit of `src/domains/project/helpers/sketch/` keeps them coherent: `renameNode` moves their `from` and their node targets, `removeNode` drops the ones from or to what it removes, and `fromText` keeps the ones whose file and node target are still in the tree. `toText` writes no dependency, and `fromText` and `readTextProblems` report an indented line as a problem: step 4 changes them.
- `createEngine()` (`src/domains/evaluation/helpers/engine/evaluate.ts`) makes the engine of one instance, whose `evaluate(sketch)` returns an `Evaluation` (`src/domains/evaluation/helpers/engine/engine.types.ts`), memoized per engine by sketch object and by config text: the files described (the ones `getFiles` gives, so the engine and the tree agree), the config problems, `rulesValid`, and the summaries of the element types, file categories and rules. A problem has its range in the config text, its `detail` without the docs links, and the links apart in `links`. The engine places every range it reports: there is no `rangeOf` on the evaluation, so step 2 gives each verdict the `range` of its policy, read with `getRangeOf` (`src/domains/evaluation/helpers/engine/locations.ts`). It never throws: `normalizeConfigSafely` (`src/domains/evaluation/helpers/engine/normalizeConfigSafely.ts`) leaves out the rule entries with a policy that `@boundaries/elements` cannot normalize and reports an error at that policy, and `describeFiles` (`src/domains/evaluation/helpers/engine/describeFiles.ts`) describes the files with the normalized settings, from which `normalizeConfig` has left out the descriptors that `describeEntity` cannot use, such as a `capture` or `baseCapture` that is not a list, with a warning at each one. The normalized settings carry `boundaries/root-path` resolved against the root of the sketch (`src/domains/evaluation/helpers/engine/rootPath.ts`), so the paths of the sketch go to `describeEntity` as they are. Step 2 adds the verdicts.
- The state of an instance is a store (`src/domains/session/data/store/store.ts`) that `SessionProvider` creates per mount of `Shell`. Its commands apply the pure transitions of `src/domains/session/data/store/transitions.ts`, and it owns the engine: a tree edit is evaluated at once, a config edit 150 ms after the last one. Only the panes read it, through the hooks of `src/domains/session/data/store/store.hooks.ts` and the module-hooks of the domains, and the leaf components take props. A transition is complete: `renameNode` and `removeNode` move or drop the focus, the selected folder and the closed folders with the sketch, so the dependency in focus is remapped there and nowhere else.
- `Focus` and `Target` (`src/domains/session/helpers/focus/focus.types.ts`) are what is open and what a row, a line or a button opens: `none`, `config` or `file`, and `config` (with an optional range) or `file`. This phase adds the dependency variant to both; `openTarget` puts a target in focus, selects the most specific tab, shows it in the tree and prepares the reveal in the config. Everything that opens something produces a `Target`: dependency lines, failing dependency rows, `Open policy in config` and the inspector rows.
- The problems panel: `ProblemsTabId` (`src/domains/session/helpers/focus/focus.types.ts`) is `sketch` and `node`, and `getProblemTabs`, `getShownTab` and `getProblemList` (`src/domains/problems/helpers/problemSelectors/`) give the facts of the tabs and of the list of the tab that shows, which `toProblemsTabs` and `toProblemListContent` (`src/domains/problems/ui/helpers/problemItems/`) turn into what the panel draws. The dependency tab is added to the facts of `problemSelectors` and to the presentation of `problemItems`; `ProblemsPanel` (`src/domains/problems/ui/molecules/ProblemsPanel/`) is generic over the ids, so the new id does not compile until the problems pane (`src/domains/problems/modules/ProblemsPane/`) handles it. Problem rows are `ProblemItem`s (`src/domains/problems/ui/helpers/problemItems/`) with a `key` and an optional `target`; a row without one is plain content. The `Sketch` tab lists the config problems, then the lines of text mode, and the failing dependencies join that list with a dependency target.
- `ProblemCounts.byPath` is an empty map (`NO_PATH_COUNTS` in `src/domains/problems/helpers/problemSelectors/problemSelectors.ts`), and `useProblemCounts` memoizes the counts on their numbers, so that an evaluation that changes no count renders no item of the tree. `ProjectTreeItem` already reads `byPath`: a file with a count has its name in `--jsb-bad`, a ✕ and the badge, and a folder has the badge.
- `ConfigEditor` and `ConfigPane` take `highlight`, a `TextRange` whose lines stay marked and follow the edits, and `reveal` (`ConfigReveal`), which scrolls to a range each time its key changes and which `openTarget` sets for a config target with a range: "Open policy in config" opens `{ kind: "config", range }` with the range of the verdict and passes the highlight. The editor leaves its state and scroll in the snapshot of `ConfigEditorSnapshotContext` (`src/domains/config/ui/contexts/ConfigEditorSnapshotContext/`) when the config closes, so the undo history survives a file opened in between.
- Text mode keeps what the user types in the store (`textDraft`), and its problems are derived from it with `readTextProblems`; leaving text mode drops the draft.
- `eslint.config.mjs` splits `src` into domains and layers (`packages/playground/AGENTS.md`, "Layering"): a module reads the store and composes `ui` components, and a `ui` component takes props and imports no store. The picker of step 3 is an element of the `files` domain, in the layer its imports put it in, and the policy says which.
- `FilePane` (`src/domains/files/ui/molecules/FilePane/`) shows `No dependencies yet.` and a disabled `+ Dependency` with the tooltip `Dependencies arrive in the next milestone`. This phase removes both texts, enables the button and adds the hint that the mockup draws below it, `Dependencies are added and edited with the picker. Click a line to see its verdict in Problems.` (maintainer, 2026-11-04, review of the phase 5 page).
- The head hint of text mode is `One path per line` (`PROJECT_PANE_LAYOUT_TEXT_HINT` in `src/domains/project/ui/templates/ProjectPaneLayout/ProjectPaneLayout.constants.ts`). This phase makes it `One path per line · dependencies indented`, as the mockup has it, when text mode reads dependencies (same review).
- The inspector of a file ends after its three facets, the inspector with nothing open shows four numbers (files, element types, file categories, policies), and the top bar reads `n files · n problems`. The `n dependencies ✓ k ✕ k – k not checked` line, the dependencies and disallowed numbers, the allowed and not-checked counts and the dependencies count of the top bar are this phase's (`00-shared.md` section 6).
- The picker widgets have no theme overrides yet: `InputLabel` (the floating label), `Autocomplete` and its listbox, `Chip` and `Radio` go into `src/ui-kit/helpers/theme/theme.ts` with the picker.
- The engine spec compares the descriptions of the quick-start files with `src/domains/evaluation/helpers/engine/quickStartDescriptions.mock.ts`, captured from `boundaries/debug`; its TSDoc says how to capture it again.

## Scope

In: the dependency model and picker, rendering as import statements with verdict marks, evaluation through `policies`, red nodes and counts, the file and dependency tabs of the problems panel, "Open policy in config", the inspector additions, text mode extended with dependencies. Out: URL state, Share, example picker (phase 7).

## Steps

### 1. The dependency model

`Sketch.dependencies`, typed by phase 4 in `src/contract/Sketch.types.ts`: `{ from: path, target: { kind: "node", path } | { kind: "external", name }, syntax: "import" | "export-from" | "require" | "dynamic-import", importKind: "value" | "type", specifiers: Array<{ kind: "default" | "named" | "namespace", name, alias? }> }`.

- A dependency is identified by its file and its position among the dependencies of that file, in the order of `Sketch.dependencies` (`{ path, index }`). Its line in the file pane and in the problem locations is `index + 1`.
- `src/domains/project/helpers/sketch/` gains the operations that add, replace and remove a dependency of a file, returning an `EditResult` as the node edits do. They refuse a dependency whose target is its own file or is not a file of the sketch, and one that its syntax cannot write (below), so that a sketch never holds one.
- A renderer in the same element turns a dependency into the statement text; the text is display only. What each syntax writes, with `type` adding `import type` or `export type`:

| Syntax | Names it holds | Statements |
| --- | --- | --- |
| `import` | one `default`, plus one `namespace` or any `named`; none for a side-effect import, which is a `value` | `import format, { round as r } from "<source>";`, `import * as ns from "<source>";`, `import "./Button.css";` |
| `export-from` | any `named` (`default` is a name: `export { default } from`), or one `namespace`; none exports everything | `export { round, x as y } from "<source>";`, `export * as ns from "<source>";`, `export * from "<source>";` |
| `require` | none, and `value` only | `require("<source>");` |
| `dynamic-import` | none, and `value` only | `import("<source>");` |

- The source of a node target is the path from the folder of `from`, starting with `./` or `../`, without the extension of a JavaScript or TypeScript module (`.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts`) and without a trailing `/index`, as a resolver finds them back: `../../helpers/format` for `src/helpers/format/index.js`, `./Button.css` for a style. When the shorter source would resolve to another file of the sketch first, the renderer drops less. Resolution tries the path as written, then each extension in the order above, then `/index` with each extension. The source of an external target is its name.
- `QUICK_START_EXAMPLE` (`src/domains/examples/data/examples/quickStart.ts`) gets the nine dependencies of the mockup, which its `text` state lists under their files. Their verdicts: `src/helpers/format/index.js` → `src/components/atoms/Button/index.js` disallowed by the default (the home's step 3), `src/modules/checkout/index.js` → `src/components/atoms/Button/Button.spec.js` disallowed by policy 2, three allowed (policy 0 once, policy 1 twice) and four not checked (`internal` twice, `not-local` for `react`, `from-unknown` for `src/index.js`), so the top bar reads `6 files · 9 dependencies · 2 problems`.

### 2. Evaluation

Extend `evaluate` of the engine (`createEngine`) with a verdict per dependency, in the order of `Sketch.dependencies`, memoized with the rest of the evaluation. Its types are the playground's own, as the other types of the engine are.

- The input of `describeDependency`: `from` the file path; `to` the target node's path, absent for an external target; `source` the source that the statement renders; `kind` the `importKind`; `nodeKind` `import`, `export`, `require` or `dynamic-import` from `syntax`, the `name` that the plugin passes for its default dependency nodes (`packages/config/src/Shared/Settings.types.ts`); `specifiers` as `getSpecifiers` of `packages/eslint-plugin/src/Elements/Elements.ts` reads them from the AST: for `import` the imported names of the `named` specifiers, not their aliases; for `export-from` the exported names, which are the aliases when there are; none for `default` and `namespace` specifiers, `require` and `dynamic-import`.
- The rule is the `dependencies` entry of `normalizeConfig`'s `rules`, or the deprecated `element-types` when `dependencies` is not written. No dependency is evaluated while the config does not parse, while `rulesValid` is false, or when neither rule is written or its severity is `off`: every line reads `not evaluated`, nothing counts as a problem, and a note of the problems panel says why (the note of phase 5 for invalid options, and one for a missing or `off` rule). Other rules of the plugin are not evaluated (RFC scope).
- A dependency whose `nodeKind` is not among the names of `settings.dependencyNodes`, because `boundaries/dependency-nodes` leaves its syntax out, is never seen by the plugin: it is not checked, with the playground's own reason `not-read`.
- `evaluateDependency` takes the normalized settings, the options of the rule and the description. `checked: false` is not checked, with its reason, and counts as no problem. Otherwise the verdict is allowed or disallowed with its `policyIndex` (`null` for the default) and, when disallowed, its `message` and the level of the rule severity (`error` or `warning`).
- A custom message that fails to render makes `evaluateDependency` throw (`packages/policies/AGENTS.md`). The engine never throws: that dependency is disallowed, with the error text as its message and no policy index.
- Each verdict decided by a policy carries the `range` of that policy (`getRangeOf` at `rules › <rule as written> › 1 › policies › <index>`, or `rules` when the options use the deprecated key); one decided by the default carries the range of `default`, or of the options when `default` is not written. The policy card reads its text from that range.
- Derived from the verdicts: the failing count of each file and folder (`ProblemCounts.byPath`), how many dependencies each policy and the default decided and how many of them it disallowed, and the totals of the sketch (dependencies, allowed, disallowed, not checked). The problems of the sketch are the config problems, the lines of text mode and the failing dependencies.

### 3. The picker

A `Dialog`, which renders inside the root element (`packages/playground/AGENTS.md`, "Stack") as `DeleteFolderDialog` does, laid out as the mockup's `picker` state. It is an element of the `files` domain, opened by a module that reads the store; its widgets get their theme overrides in `src/ui-kit/helpers/theme/theme.ts` (`InputLabel`, `Autocomplete` and its listbox, `Chip`, `Radio`).

- Title `Add a dependency` (`Edit a dependency` when editing), with the path of the open file below it.
- `Target`: `A file of the sketch`, with a `File` combobox over the files of the sketch other than the open one, each option with its element type or `no element`; or `An external module`, with a `Module` text field.
- `Syntax` (`import`, `export from`, `require`, `import()`) and `Kind` (`value`, `type`; only for `import` and `export from`), as radios.
- `Imported`: a chip per name (`default format`, `named round`, `named round as r`) with a remove button, and `+ Name` to add one, offering the kinds the syntax holds; the row is hidden for `require` and `import()`.
- `Preview`: the statement, written by the renderer of step 1.
- `Cancel` and `Add` (`Save` when editing); `Add` is disabled while the target is missing or a name is empty.
- Opened by `+ Dependency` and by the edit action of a line. The delete action of a line removes it without asking.

### 4. The panes

- Focus: `Focus` and `Target` gain `{ kind: "dependency", path, index }`. `openTarget` opens its file, puts the dependency in focus and selects its tab; the tree outlines its target (`00-shared.md` section 6, "Focus"). The sketch operations of step 1 and text mode move the focus with the dependencies: removing the dependency in focus leaves its file in focus, removing one before it shifts the index.
- `Open policy in config` opens `{ kind: "config", range }` with the range of the verdict, and the store keeps that range and the dependency it came from while the config stays in focus: `ConfigNode` passes it as the `highlight` of the editor, and the note of the `eslint.config.js` tab names the dependency (`Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js.`, after `No problems in the config.` when it has none).
- Node in focus, a file: one line per dependency (`00-shared.md` section 6, "Panes"), the statement colored as the mockup does; the verdict reads `✓ policy N`, `✓ default`, `✕ policy N`, `✕ default`, `– not checked · <reason>` (`external` for `not-local`, the reason as it is for the others, `not read` for `not-read`, with a tooltip that says it in a sentence) or `– not evaluated`. A click puts the dependency in focus; edit and delete actions; `+ Dependency` enabled, with the hint of the mockup below it.
- Tree: red nodes with the failing count, folders aggregate; the config node red with config errors (from phase 5).
- Problems panel: the tabs follow the focus as decision 6 says (most specific selected, broader ones kept, absent levels hidden). The file tab counts the failing dependencies of the file and lists them (`:3 <source>`, the message, `disallowed · policy N` or `disallowed · default`); the `Sketch` tab lists them after the config problems and the lines of text mode (`<path>:3 → <source>`). The dependency tab, `line N` with the icon of its verdict, shows the verdict, the message, the facts (`to`, `element`, `file`, `kind`, `syntax`), `Open policy in config →` and the policy card (`// policies[N]` or `// default`, then the text of the range). A row puts its dependency in focus.
- Inspector: for a file, `n dependencies ✓ k ✕ k – k not checked`; for the config node, a row per policy of the evaluated rule and one for the default, each with how many dependencies it decided (`--jsb-bad` when it disallowed any) and opening the config at its range, and the other rules of the plugin as `not evaluated here`; with nothing in focus, the six numbers and the allowed and not-checked counts of `00-shared.md` section 6.
- Top bar: `n files · n dependencies · n problems`.
- Text mode: dependencies as statements indented two spaces under their file, read back with the inverse of the renderer for the four syntaxes and the resolution of step 1. A line that cannot be read (an unknown statement, a source that resolves to no file, a dependency that its syntax cannot write) is reported in the `Sketch` tab and stays in the draft. The head hint becomes `One path per line · dependencies indented`.

### 5. Tests

- The verdicts of the quick-start example equal the plugin's. A script out of the package (scratchpad) writes the nine statements into a fixture project with the quick-start config, runs ESLint with the workspace plugin, and its output is captured into `src/domains/evaluation/helpers/engine/quickStartVerdicts.mock.ts`, with a TSDoc that says how to capture it again, as `quickStartDescriptions.mock.ts` does. The engine spec checks that the disallowed dependencies, their lines and their messages are the ones ESLint reports, and that every other one is allowed or not checked.
- The focus rule of the tabs; the text mode round trip with dependencies; the rendering of the sources and of the four syntaxes; every skip reason, `not-read`, `not evaluated` and the custom message that fails to render.

## Verification

- Acceptance criteria of #553, each checked in the PR description.
- Quality gates of `00-shared.md` section 4, with the dialog open included in the screenshots (focus trap, no overflow).
- `pnpm nx check:all playground` and `website` pass.

## Hand-offs

- To phase 7: the complete `Sketch` (tree, config, dependencies) to serialize, and the check of the sketch operations that refuses a dependency its syntax cannot write, which a sketch read from a URL passes too; the engine as the single evaluation entry.
- To phase 8: the message texts and the picker vocabulary the guide page documents.

## Open points

- Whether policies that decide nothing for the sketch are highlighted in the inspector as unused. Default: show `0 dependencies` for them; no extra styling.
- The name of a policy row in the inspector, which the mockup writes by hand (`0 · component → helper`, `1 · module → component, helper`, `2 · disallow → test`, `default · disallow`). Default: `<index> · <from> → <to>`, where each side lists the element types and file categories that the selectors of the policy name, `from` is the action (`allow`, `disallow`) when the policy has no `from`, and `to` is `*` when its selectors name none.
- Whether `type` is offered with `require` and `import()` (`import type x = require("…")`, `typeof import("…")`). Default: no; they are rare, and the model and the picker stay simpler.
