# Phase 4: the playground emits its evaluation and opens a target

## Goal

The host contract of `@boundaries/playground` has two additions. A new optional prop, `onEvaluationChange`, receives each complete evaluation as the `ProjectAnalysis` of `@boundaries/analysis`, a `stale` status while the evaluation on screen is behind the sketch, and a third status when the config text does not parse. A new input lets the host open a file or a dependency in the editor. The worker replies with both forms in one message, the panes read the `Evaluation` they read today, and a host that passes neither addition sees no change.

## Issue and PR

- Closes #688. Branch `feat/688/playground-emits-evaluation`, from `release`. PR into `release`, titled `feat(playground): emit the evaluation and open a target` (decision 36: nothing reads what it emits until the graph does).
- The PR commits no plan file (`write-plan` skill, "Where it lives", point 4). The session reads the plan with `git show origin/feat/architecture-graph:.agents/plans/architecture-graph.md`, and the same for `architecture-graph/00-shared.md`, `architecture-graph/engine-cut.md`, `architecture-graph/browser-cost.md` and this file. Its plan edits are commits on `feat/architecture-graph`, pushed once the maintainer approves them.
- Changelog entries, by `.agents/rules/changelog-and-versioning.md`: one entry in `packages/website/CHANGELOG.md`, under `## [Unreleased]`, because the website deploys the playground. It is a `chore(#688)` entry: a visitor of the site sees nothing new. `packages/analysis/CHANGELOG.md` gets none unless the package changes; if it does before its first release, its first entry is corrected instead.
- The PR description shows:
  - The two additions to the contract, with the type of each.
  - The cost table: the round trip of the evaluation of `packages/playground` with the reply of today and with both forms, measured as `browser-cost.md` did, and the percentage added.
  - How it was checked that no code of `@boundaries/analysis` loads outside the worker chunk.

## Read first

- `architecture-graph/00-shared.md`, "How the playground and the graph work together" and the phase 4 item of "Acceptance".
- `architecture-graph/engine-cut.md`, "What the playground emits": the statuses, what is doubled in the reply and why the panes do not change.
- `architecture-graph/browser-cost.md`, "The reply with both forms" and "Method": the numbers to beat and the scripts, in `architecture-graph/spike/browser-cost/sources.tar.gz` (`cost-all.sh` runs everything, `cost-tables.mjs` prints the tables). There the second form was simulated; this phase measures the real one.
- `packages/playground/AGENTS.md`: "Host contract", and in "Layering" the limits of `contract`, of the engine and of the `session` domain, and the paragraph on the store.
- `packages/playground/eslint.config.mjs`: `contract: []` in `LAYER_TARGETS`, the policies of external modules per element, and the `ENGINE` policies that keep the values of the engine in the worker.
- The code on the path of the prop: `packages/playground/src/contract/Props.types.ts`, `src/app/Playground.tsx`, `src/domains/shell/modules/Shell/`, `src/domains/session/data/store/SessionProvider.tsx` (its `onSketchChange` effect is the model) and `store.ts` (`receive`).
- The code on the path of the reply: `src/domains/evaluation/helpers/evaluator/serveEvaluations.ts`, `evaluator.types.ts` (`EvaluationReply`, `EvaluationOutcome`, `EvaluationStatus`) and `evaluator.ts`, and the engine adapter that phase 2 left in `src/domains/evaluation/helpers/engine/`.
- The code of a target: `src/domains/session/helpers/focus/focus.types.ts` (`Target`) and `open` of the store, which applies `openTarget`.
- `.agents/rules/playground-testing.md` and `.agents/rules/playground-components.md`.

## Preconditions

- #686 is merged into `release` (phase 2, #695): the emitted type is the `ProjectAnalysis` of `packages/analysis/src/index.ts`.
- Decisions 6, 8, 13, 14, 29 and 36 of the index are taken.

## Scope

- In: the two additions to the contract and their types; the reply of the worker with both forms; what the evaluator and the store carry for it; the lint policy that lets the contract import the type; the specs; `packages/playground/AGENTS.md`.
- Out: the graph, the tabs and any change of the website page (#693, phase 8); making the panes read the `ProjectAnalysis` (`engine-cut.md` says why it is a later refactor); any change of what `@boundaries/analysis` computes.
- Handed on: the prop, its statuses and the input that opens a target, to phase 8.

## Steps

Every change goes through the `implement-change` skill; this one adds public exports and a dependency of the contract on a package, so it is "architectural and new".

1. **The types of the contract.** In `packages/playground/src/contract/`, exported from `src/contract/index.ts` and `src/index.ts`:
   - What `onEvaluationChange` receives: `{ status: "current"; analysis: ProjectAnalysis }`, `{ status: "stale" }`, or the status of a config that does not parse with the detail of the error (decision 29; "Open points" has the default shape). `ProjectAnalysis` comes from `@boundaries/analysis` with `import type`.
   - The target the host opens: a file by its path, or a dependency by the path of its file and its index among the dependencies of that file, which is the `ref` of a `DependencyResult` of the analysis. The contract declares its own type: it imports nothing of the `session` domain.
   - `PlaygroundProps` gains `onEvaluationChange` and the input, both optional, with TSDoc that says when each is called or read.
2. **The lint config.** `packages/playground/eslint.config.mjs` lets the `contract` element import `@boundaries/analysis` as a type only, and nothing else changes for it: a value import from the contract, and any import of the package from an element other than the engine and the contract, still fail. `@boundaries/analysis` is already a dependency of the playground since phase 2.
3. **The reply with both forms.** The engine gives the `ProjectAnalysis` it already computes beside the `Evaluation` it maps from it, `serveEvaluations` posts both in one message, and `EvaluationReply`, the evaluator and its `evaluated` outcome carry the analysis. The descriptions of the files and of the dependencies are the same objects in both forms, so that the structured clone copies them once (`engine-cut.md`). The `Evaluation` and what the panes read do not change.
   - The analysis is `project`, a local of `evaluateSketch` in `E/evaluate.ts` (`packages/playground/src/domains/evaluation/helpers/engine/`), which the adapter maps into the `Evaluation`. The `WeakMap` of `createEngine` keeps the `Evaluation` only, so a second evaluation of the same sketch has no analysis unless the engine keeps it beside the `Evaluation`.
   - For a config text that does not parse, `project` is the analysis of an empty config (`EMPTY_CONFIG`). It is never emitted: the third status is emitted in its place (decision 29).
   - Each `DependencyResult` of the analysis holds the `ProjectDependency` that the adapter built from the dependency of the sketch (a file target has the kind `file`, and it carries its `source`), not the `SketchDependency` itself, and has no `source` of its own (decision 45).
4. **The store.** It keeps the analysis of the last evaluation beside the evaluation. `receive` of `store.ts` already tells an evaluation of the sketch on screen (status `current`) from one of an older sketch; the analysis is never aligned to a newer sketch as the evaluation is (`alignEvaluation`).
5. **The emission.** `Playground` passes the prop to `Shell`, and `Shell` to `SessionProvider`, where an effect over the status and the analysis calls it, after the render that shows them, as the `onSketchChange` effect does.
   - `current` of the store emits `{ status: "current", analysis }`, or the third status when the config text of that sketch does not parse (`Evaluation.configParsed` is `false`).
   - `pending`, `late`, `stopped` and `failed` emit `{ status: "stale" }`.
   - A callback that changes between renders does not make the same value be emitted again, and a run of stale statuses emits `stale` once.
   - `Playground` mounts a new `Shell` for each sketch that comes from outside (`key={generation}` in `Playground.tsx`), with a new store: the emission of the new one starts as `stale`.
6. **The input that opens a target.** The host's request reaches `SessionProvider`, which calls `open` of the store with a `Target` of kind `file` or `dependency`. Each request opens once; a later render with the same request opens nothing.
7. **The agent docs.** `packages/playground/AGENTS.md`: "Host contract" describes the two additions, and the sentence of "Layering" on the types the engine exports, which phase 2 rewrote for the description types it re-exports from `@boundaries/analysis` (decision 42), also says that `ProjectAnalysis`, the shared model, reaches the contract as a type. The row of `contract` in the layers table says what it may import. `packages/playground/README.md` documents both additions if it documents the props.

## Verification

- `pnpm nx run-many -t check:all --all` passes.
- Criterion 1, no prop behaves as today: `pnpm nx test:unit playground` and `pnpm nx test:e2e website-e2e` pass with no existing assertion changed, other than the ones of the specs of `serveEvaluations`, the evaluator and the store that state the shape of the reply. The PR lists those.
- Criterion 2: a spec of `SessionProvider` (or of the module-hook that holds the effect) shows `current` with the analysis, `stale` for each of the four statuses, the third status for a config that does not parse, and that after an edit the callback gets `stale` and never an analysis of the older sketch presented as current. A spec of `Playground` shows the prop wired end to end with the inline worker of `src/shared/testing/inlineWorker`.
- Criterion 3: a spec opens a file and a dependency through the input and reads the focus through the page objects, and shows that the same request rendered twice opens once.
- Criterion 4: after `pnpm nx build playground`, `grep -c "@boundaries/analysis" packages/playground/dist/index.js packages/playground/dist/share.js` prints 0 for both, and the lint of the playground fails on a temporary value import of `@boundaries/analysis` in the contract. On the built website, the chunks that load before the worker starts contain no code of the package; `test/website-e2e/test/playground-chunk.spec.ts` is where a check on chunks lives today.
- Criterion 5: `packages/playground/AGENTS.md` describes both additions.
- The cost (`00-shared.md`, "Acceptance"): the scripts of `browser-cost.md` run again with the built worker of this branch, with the sketch of `packages/playground` (725 files, 2740 dependencies). The reply with both forms adds under 1% to the warm round trip, which `browser-cost.md` measured at 380 ms, with 3 ms for the second form. The PR shows the table and the machine.

## Hand-offs

To phase 8 (`08-website-graph.md`):

- The name and the type of `onEvaluationChange`, the three statuses with the exact shape of the third, and when each is emitted: once per complete evaluation, `stale` once per run, and `stale` again from each new `Shell`.
- The name and the type of the input that opens a target, and that a request opens once.
- That the host imports the types from `@boundaries/playground`, and `ProjectAnalysis` from `@boundaries/analysis` as a type only, so that the page chunk loads no code of it.
- What the measurement gave, if it differs from `browser-cost.md`.

## Open points

- **The shape of the third status.** `engine-cut.md` suggests `{ status: "invalid"; problems }` and leaves it to this phase. The contract cannot import `ConfigProblem` of the engine. Default: `{ status: "invalid"; problems }` where each problem is a type of the contract with the `title`, the `detail` and the `line` and `column` of the parse problems of the evaluation (`source: "parse"`), with no text range.
- **The shape of the input.** Not decided in the plan beyond "an input of the host contract". Default: an optional prop that holds a request, the target plus a `key` that the host changes for each request, as `ConfigReveal` of `src/domains/session/helpers/focus/focus.types.ts` does for the editor. It keeps the props as the whole contract and lets the host ask for the same target twice. The `architect` proposes its name.
- **A target that the sketch does not have.** What `openTarget` does with a path or an index that does not exist was not read. Default: the request is ignored and nothing opens; a spec states it.
- **A request made while no shell is mounted,** such as while the sketch loads. Default: it is dropped, not kept for the next shell.
- **The first emission.** Default: a new store emits `stale` once at start, before its first evaluation, so that a host that kept an analysis of the previous sketch marks it out of date.
- **How the engine exposes the analysis.** Phase 2 left the `Engine` type and the entry of the engine unchanged, so `Engine.evaluate` returns the `Evaluation` only. Default: it returns both, and only `serveEvaluations` reads the second.
- **The chunk check on the built website.** Whether `playground-chunk.spec.ts` can assert that the page chunk holds no code of `@boundaries/analysis` was not read. Default: the `grep` on `dist` and the lint policy are the gate, and the website check is added only if the spec already inspects chunk contents.
- **The memory pressure of the measurement.** `browser-cost.md` was measured on a machine short of memory. Default: report medians with the same number of runs, and the absolute times beside the percentage.
