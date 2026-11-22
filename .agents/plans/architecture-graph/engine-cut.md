# The cut of the engine: `@boundaries/analysis`

What phases 4 and 5 read of the cut that phase 2 made (#695). Read from the code on 2026-11-22; decisions 13, 14, 16 and 29 of the index. "The package" below is `@boundaries/analysis`. Paths are relative to `packages/playground/` unless they start with another package; `E/` is `src/domains/evaluation/helpers/engine/`, the adapter over the package.

## Does a real project fit?

Checked against what the spike reads (`spike/read-project.mjs`).

| The sketch of the playground | What a real project needs | The input of the package |
| --- | --- | --- |
| `Sketch.config` is a text | The reader has an object | `ProjectConfig` is an object |
| The source is made up from the target (`getDependencySource`, in the adapter) | The origin of a module depends on the source as written: core modules, aliases, custom source patterns (`packages/elements/src/Descriptor/Module/ModuleDescriptor.ts:181-193`) | `source` is required (decision 16) |
| The syntax is one of 4 values, mapped to a node kind | Additional dependency nodes have names that the user chooses | Not solved; an optional `nodeKind` can be added later without breaking |
| `importKind` is `value` or `type` | The `typeof` kind exists in the descriptions | Not solved; it can be added later the same way |
| A file target is a file of the project | A resolved file outside the root | The reader writes it as `external`, as the spike does |
| Specifiers are structured | The spike writes names only | The reader maps them |
| `files` of the analysis is a `Map` | It is not JSON | A snapshot holds the `Project`, not the evaluation |

The limits of 1000 nodes and 3000 dependencies (`sketch.constants.ts`) apply to reading an untrusted sketch only, not to the package. An absolute `boundaries/root-path` is taken as the root (`resolveRootPath` of `packages/analysis/src/Config/RootPath.ts`), so the reader has to write it relative.

## What the playground emits

Decisions 13 and 14 of the index.

- A new prop, `onEvaluationChange`, goes from `Playground` to `Shell` to `SessionProvider`, where an effect over the evaluation and its status emits it. The worker, the evaluator and the store already carry the status it needs, and each gets a new field for the analysis, since the reply and the state hold an `Evaluation` only (`evaluator.types.ts`, `sessionState.types.ts`): the store keeps the last evaluation and `evaluationStatus`, one of 5 values (`src/domains/session/data/store/store.ts:110-137`).
- It emits `{ status: "current"; analysis: ProjectAnalysis }`, `{ status: "stale" }` or the status of a config that does not parse, below. `current` is the status `current` of the store; `pending`, `late`, `stopped` and `failed` are `stale`. The graph keeps the last analysis and shows it as loading or out of date. The evaluation that the store aligns to a newer sketch, with its pending verdicts, is never emitted.
- The emitted object is the `ProjectAnalysis` of the package, with config paths and no range. The contract imports its type from `@boundaries/analysis`, as a type only, so that no code of the package loads outside the worker. The paragraph of `AGENTS.md` on the types of the engine names the description types and `SkipReason` as the ones the engine re-exports from the package (decision 42); phase 4 adds the contract.
- The worker replies with both forms in one message: the `Evaluation` that the panes read, with ranges, and the `ProjectAnalysis`. The descriptions of the files and of the dependencies are the same objects in both, and the structured clone of a message copies an object once however many times the message references it. What is doubled is one small object per dependency and per policy, element type, file category and rule. `browser-cost.md` measures it: 3 ms more for a project of 725 files and 2740 dependencies, under 1% of the round trip.
- The panes do not change. Making them read the `ProjectAnalysis` too, with the ranges in a table from path to range, is a later refactor that the graph would not notice: 13 production files and 25 spec and mock files outside the engine use ranges.
- When the config text does not parse there is no analysis of it: the playground emits a third status with the detail of the error (decision 29), such as `{ status: "invalid"; problems }`, whose exact shape the phase that adds the prop settles.

Of what the mockup reads from `data.json`, the analysis holds everything except the text of each policy, which `spike/compact.mjs` makes from the normalized policy and the playground slices from the config text by range. The label of a policy in the graph can be built from its index, its action and its `from` and `to` names, with no text. The mockup uses none of the element type, file category and rule summaries.

## Input of `@boundaries/graph-data`

The `ProjectAnalysis` type of the package (decision 14). What it reads of it: of each file, the element (`types`, `path`, `captured`, `parents`, `isUnknown`) and the file categories; of each dependency, its `ref`, its `target`, `syntax` and `importKind`, the module `origin` and `source` of its target, its `kind`, `nodeKind` and `relationship`, and its verdict with the index of the deciding policy; of each policy, `index`, `action`, `from`, `to`, `decided` and `disallowed`.
