<!-- cspell:disable -->
# Phase 6: M2 Verdicts

Goal: files have dependencies, entered through the picker and rendered as import statements with a verdict per line; the problems panel has its three focus tabs with the policy that decided and its message; the tree shows red nodes with counts.

Issue: #553. Branch `feat/553/playground-verdicts` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): verdicts of the dependencies`, `closes #553`. The PR description shows the quick-start error of the home's step 3 reproduced, the three problems panel states and the picker, both themes.

Read first:

- RFC #538, "Interface" decisions 3, 4 and 6, the picker drawing, the problems panel states, and "Milestones" M2.
- The approved mockup (`playground/mockups/`, the `dependency`, `picker` and `policy` states) and section 6 "Interface" of `00-shared.md`.
- `packages/policies` README and `AGENTS.md`: `describeDependency` and its input (`DependencyDescriptorOptions`: `from`, `to`, `source`, `kind`, `nodeKind`, `specifiers`), `evaluateDependency` and its result (`checked` with a skip `reason`, or `allowed`, `policyIndex`, `match`, `message`, `diagnostics`), whose `message` is set only when `allowed` is `false`; `getDependencySkipReason(options, description)` gives the skip reason alone.
- `packages/website/src/components/home/Steps/` for the exact step 3 scenario and the message the home shows.

Preconditions: phase 5 merged. Phase 3 is in `feat/539/playground` since the merge of `release` on 2026-11-02.

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

`Sketch.dependencies`, typed by phase 4 in `src/contract/Sketch.types.ts`: `{ from: path, target: { kind: "node", path } | { kind: "external", name }, syntax: "import" | "export-from" | "require" | "dynamic-import", importKind: "value" | "type", specifiers: Array<{ kind: "default" | "named" | "namespace", name, alias? }> }`. A renderer turns it into the import statement text (`import format, { round } from "../../helpers/format";`, relative paths computed from `from` to the target node, `import type` for `type`, `require("...")`, `import("...")`, `export { x } from "..."`); the text is display only.

### 2. Evaluation

Extend `evaluate` of the engine (`createEngine`): for every dependency, build the `describeDependency` input from the model (`from`: the file path; `to`: the target node's path, absent for an external target; `source`: the specifier the statement renders, relative for a node, the module name for an external target; `kind`: `importKind`; `nodeKind`: `import`, `export`, `require` or `dynamic-import` from `syntax`; `specifiers`: the names of the `named` specifiers only, as the plugin reads them from the AST), then call `evaluateDependency` with the normalized settings, the `dependencies` (or `element-types`) options of `normalizeConfig`'s `rules` and that description; collect `{ dependency, evaluation }`. A dependency with `checked: false` is shown as not checked by the rule, with its reason, and counts as no problem; derive per-file and per-folder failing counts for the tree, and the `Sketch` list (config diagnostics plus failing dependencies). Only the `dependencies` rule is evaluated (RFC scope); if the config declares other rules, they are shown in the inspector as "not evaluated here" and ignored.

### 3. The picker

A modal dialog of the stack (portal carrying the playground root class so that the scoped styles apply): target (radio: a node of the sketch, picked with a combobox over the file paths, or an external module name typed), syntax (radio), kind (radio), imported names (default / named / namespace chips with add and remove), a live preview of the statement, Cancel / Add (or Save when editing). Opened by `[+ dependency]` and by clicking the edit action of a line; a delete action on each line.

### 4. The panes

- Node in focus, file: one line per dependency, teal `✓` or vermilion `✕` mark, click puts the dependency in focus, edit and delete actions, `[+ dependency]` enabled.
- Tree: red nodes with the failing count, folders aggregate; the config node red with config errors (from phase 5).
- Problems panel: file tab (the failing dependencies of the open file, each with the policy index and the message, click focuses the dependency), dependency tab (the verdict, the policy copy as JSON5 read from the config text by its index, the templated message, the target path and its element, kind and syntax, `Open policy in config` which opens the config node scrolled to and gutter-highlighting the policy range with the range that the verdict carries); tabs follow the focus as decision 6 says (most specific activates, broader stay, absent levels hidden), counts in each tab.
- Inspector: for a file, `n dependencies · k ✕`; for the config node, how many dependencies each policy decides (from the results).
- Text mode: dependencies as indented import statements under their file, parsed back with a small grammar (the renderer's inverse for the four syntaxes); unknown lines are reported in the `Sketch` tab, not dropped.

### 5. Tests

The home's step 3 scenario as a fixture: the verdict, the policy index and the message equal the plugin's (captured from the plugin as `src/domains/evaluation/helpers/engine/quickStartDescriptions.mock.ts` was, or produced by running the plugin in a test); the focus rule of the tabs; the text mode round trip with dependencies; the relative path rendering.

## Verification

- Acceptance criteria of #553, each checked in the PR description.
- Quality gates of `00-shared.md` section 4, with the dialog open included in the screenshots (focus trap, no overflow).
- `pnpm nx check:all playground` and `website` pass.

## Hand-offs

- To phase 7: the complete `Sketch` (tree, config, dependencies) to serialize; the engine as the single evaluation entry.
- To phase 8: the message texts and the picker vocabulary the guide page documents.

## Open points

- Whether policies that decide nothing for the sketch are highlighted in the inspector as unused. Default: show `0 dependencies` for them; no extra styling.
- How the policy copy is extracted when the config has a parse error. Default: the dependency tab shows the index and the message only, with a note that the config does not parse.
