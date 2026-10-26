<!-- cspell:disable -->
# Phase 6: M2 Verdicts

Goal: files have dependencies, entered through the picker and rendered as import statements with a verdict per line; the problems panel has its three focus tabs with the policy that decided and its message; the tree shows red nodes with counts.

Issue: #553. Branch `feat/553/playground-verdicts` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): verdicts of the dependencies`, `closes #553`. The PR description shows the quick-start error of the home's step 3 reproduced, the three problems panel states and the picker, both themes.

Read first:

- RFC #538, "Interface" decisions 3, 4 and 6, the picker drawing, the problems panel states, and "Milestones" M2.
- The approved mockup (`playground/mockups/`) and "Decisions of the mockup" in `05-m1-identify.md`.
- `packages/policies` README and `AGENTS.md`: `describeDependency` and its input (`DependencyDescriptorOptions`: `from`, `to`, `source`, `kind`, `nodeKind`, `specifiers`), `evaluateDependency` and its result (`checked` with a skip `reason`, or `allowed`, `policyIndex`, `match`, `message`, `diagnostics`); `03-policies.md` hand-offs.
- `packages/website/src/components/home/Steps/` for the exact step 3 scenario and the message the home shows.

Preconditions: phase 5 merged; phase 3 merged into `release` and `release` merged into `feat/539/playground`.

## Scope

In: the dependency model and picker, rendering as import statements with verdict marks, evaluation through `policies`, red nodes and counts, the file and dependency tabs of the problems panel, "Open policy in config", the inspector additions, text mode extended with dependencies. Out: URL state, Share, example picker (phase 7).

## Steps

### 1. The dependency model

`SketchSource.dependencies`: `{ from: path, target: { kind: "node", path } | { kind: "external", name }, syntax: "import" | "export-from" | "require" | "dynamic-import", importKind: "value" | "type", specifiers: Array<{ kind: "default" | "named" | "namespace", name, alias? }> }`. A renderer turns it into the import statement text (`import format, { round } from "../../helpers/format";`, relative paths computed from `from` to the target node, `import type` for `type`, `require("...")`, `import("...")`, `export { x } from "..."`); the text is display only.

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

The home's step 3 scenario as a fixture: the verdict, the policy index and the message equal the plugin's (reuse the fixture captured in phase 5 or run the plugin in a test to produce the expected values); the focus rule of the tabs; the text mode round trip with dependencies; the relative path rendering.

## Verification

- Acceptance criteria of #553, each checked in the PR description.
- Quality gates of `00-shared.md` section 6, with the dialog open included in the screenshots (focus trap, no overflow).
- `pnpm nx check:all playground` and `website` pass.

## Hand-offs

- To phase 7: the complete `SketchSource` (tree, config, dependencies) to serialize; the engine as the single evaluation entry.
- To phase 8: the message texts and the picker vocabulary the guide page documents.

## Open points

- Whether policies that decide nothing for the sketch are highlighted in the inspector as unused. Default: show `0 dependencies` for them; no extra styling.
- How the policy copy is extracted when the config has a parse error. Default: the dependency tab shows the index and the message only, with a note that the config does not parse.
