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

- `Sketch` (`src/contract/Sketch.types.ts`) already has `dependencies` in the shape of step 1, and every edit of `src/sketch/` keeps them coherent: `renameNode` moves their `from` and their node targets, `removeNode` drops the ones from or to what it removes, and `fromText` keeps the ones whose file and node target are still in the tree. `toText` writes no dependency, and `fromText` reports an indented line as a problem: step 4 changes both.
- `evaluate(sketch)` (`src/engine/Evaluate.ts`) returns an `Evaluation` (`src/engine/Engine.types.ts`), memoized by sketch object and by config text: the files described, the config problems, `rulesValid`, the summaries of the element types, file categories and rules, and `rangeOf(path)`, the range of any path of the config, which places a policy for "Open policy in config". It never throws: `normalizeConfigSafely` (`src/engine/NormalizeConfigSafely.ts`) leaves out the rule entries with a policy that `@boundaries/elements` cannot normalize and reports an error at that policy, and `describeFiles` (`src/engine/DescribeFiles.ts`) leaves out the descriptors that make `describeEntity` throw, a `capture` or `baseCapture` that is not a list, and reports an error at each one. The normalized settings carry `boundaries/root-path` resolved against the root of the sketch (`src/engine/RootPath.ts`), so the paths of the sketch go to `describeEntity` as they are. Step 2 adds the verdicts.
- `Focus` (`src/ui/state/Focus.types.ts`) is `none`, `config` or `file`, and the dependency variant is this phase's. The reducer (`src/ui/state/WorkbenchReducer.ts`) selects the tab of the node in focus; its tab ids (`ProblemsTabId`) are `sketch` and `node`, and the dependency tab is added to them.
- `ProblemCounts.byPath` is an empty map (`NO_PATH_COUNTS` in `src/ui/Workbench.tsx`). `ProjectTreeItem` already reads it: a file with a count has its name in `--jsb-bad`, a ✕ and the badge, and a folder has the badge.
- `ProblemsPanel` takes any list of `ProblemsTab` (`id`, `label`, `mono`, `count`, `tone`, `icon`) and the body of the selected one. Problem rows are `ProblemItem`s with the ids `config:<index>` and `text:<index>`; the `Sketch` tab lists the config problems, then the text problems, and the failing dependencies join that list.
- `ConfigEditor` and `ConfigPane` take `highlight`, a `TextRange` whose lines stay marked and follow the edits, and `reveal`, which scrolls to a range each time its key changes: "Open policy in config" uses both with `rangeOf`.
- `FilePane` (`src/ui/node/FilePane.tsx`) shows `No dependencies yet.` and a disabled `+ Dependency` with the tooltip `Dependencies arrive in the next milestone`. This phase removes both texts, enables the button and adds the hint that the mockup draws below it, `Dependencies are added and edited with the picker. Click a line to see its verdict in Problems.` (maintainer, 2026-11-04, review of the phase 5 page).
- The head hint of text mode is `One path per line` (`src/ui/project/ProjectPane.tsx`). This phase makes it `One path per line · dependencies indented`, as the mockup has it, when text mode reads dependencies (same review).
- The inspector of a file ends after its three facets, the inspector with nothing open shows four numbers (files, element types, file categories, policies), and the top bar reads `n files · n problems`. The `n dependencies ✓ k ✕ k – k not checked` line, the dependencies and disallowed numbers, the allowed and not-checked counts and the dependencies count of the top bar are this phase's (`00-shared.md` section 6).
- The picker widgets have no theme overrides yet: `InputLabel` (the floating label), `Autocomplete` and its listbox, `Chip` and `Radio` go into `src/theme/Theme.ts` with the picker.
- The engine spec compares the descriptions of the quick-start files with `src/engine/__fixtures__/quickStartDescriptions.ts`, captured from `boundaries/debug`; its TSDoc says how to capture it again.

## Scope

In: the dependency model and picker, rendering as import statements with verdict marks, evaluation through `policies`, red nodes and counts, the file and dependency tabs of the problems panel, "Open policy in config", the inspector additions, text mode extended with dependencies. Out: URL state, Share, example picker (phase 7).

## Steps

### 1. The dependency model

`Sketch.dependencies`, typed by phase 4 in `src/contract/Sketch.types.ts`: `{ from: path, target: { kind: "node", path } | { kind: "external", name }, syntax: "import" | "export-from" | "require" | "dynamic-import", importKind: "value" | "type", specifiers: Array<{ kind: "default" | "named" | "namespace", name, alias? }> }`. A renderer turns it into the import statement text (`import format, { round } from "../../helpers/format";`, relative paths computed from `from` to the target node, `import type` for `type`, `require("...")`, `import("...")`, `export { x } from "..."`); the text is display only.

### 2. Evaluation

Extend `engine.evaluate`: for every dependency, build the `describeDependency` input from the model (`from`: the file path; `to`: the target node's path, absent for an external target; `source`: the specifier the statement renders, relative for a node, the module name for an external target; `kind`: `importKind`; `nodeKind`: `import`, `export`, `require` or `dynamic-import` from `syntax`; `specifiers`: the names of the `named` specifiers only, as the plugin reads them from the AST), then call `evaluateDependency` with the normalized settings, the `dependencies` (or `element-types`) options of `normalizeConfig`'s `rules` and that description; collect `{ dependency, evaluation }`. A dependency with `checked: false` is shown as not checked by the rule, with its reason, and counts as no problem; derive per-file and per-folder failing counts for the tree, and the `Sketch` list (config diagnostics plus failing dependencies). Only the `dependencies` rule is evaluated (RFC scope); if the config declares other rules, they are shown in the inspector as "not evaluated here" and ignored.

### 3. The picker

A modal dialog of the stack (portal carrying the playground root class so that the scoped styles apply): target (radio: a node of the sketch, picked with a combobox over the file paths, or an external module name typed), syntax (radio), kind (radio), imported names (default / named / namespace chips with add and remove), a live preview of the statement, Cancel / Add (or Save when editing). Opened by `[+ dependency]` and by clicking the edit action of a line; a delete action on each line.

### 4. The panes

- Node in focus, file: one line per dependency, teal `✓` or vermilion `✕` mark, click puts the dependency in focus, edit and delete actions, `[+ dependency]` enabled.
- Tree: red nodes with the failing count, folders aggregate; the config node red with config errors (from phase 5).
- Problems panel: file tab (the failing dependencies of the open file, each with the policy index and the message, click focuses the dependency), dependency tab (the verdict, the policy copy as JSON5 read from the config text by its index, the templated message, the target path and its element, kind and syntax, `Open policy in config` which opens the config node scrolled to and gutter-highlighting the policy range from the location map); tabs follow the focus as decision 6 says (most specific activates, broader stay, absent levels hidden), counts in each tab.
- Inspector: for a file, `n dependencies · k ✕`; for the config node, how many dependencies each policy decides (from the results).
- Text mode: dependencies as indented import statements under their file, parsed back with a small grammar (the renderer's inverse for the four syntaxes); unknown lines are reported in the `Sketch` tab, not dropped.

### 5. Tests

The home's step 3 scenario as a fixture: the verdict, the policy index and the message equal the plugin's (captured from the plugin as `src/engine/__fixtures__/quickStartDescriptions.ts` was, or produced by running the plugin in a test); the focus rule of the tabs; the text mode round trip with dependencies; the relative path rendering.

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
