# The cut of the engine: `@boundaries/analysis`

Read from the code on 2026-11-22, function by function. The maintainer decided its points the same day: decisions 13 to 17, 25 to 27 and 29 of the index. "The package" below is `@boundaries/analysis`. Paths are relative to `packages/playground/` unless they start with another package; `E/` is `src/domains/evaluation/helpers/engine/`.

## The seam

The tie of the engine to the config text is narrow. Positions come only from `getRangeOf` and `toTextRange` (`E/locations.ts`), `parseConfig` and `tokenizeConfig`. Outside those files, `getRangeOf` is called at `E/evaluatedRule.ts:115,120`, `E/summaries.ts:78,107,144`, `E/diagnostics.ts:64` and `E/dependencyNodes.ts:59`. Everything else works on the parsed object and on diagnostic paths.

So `@boundaries/analysis` returns a config path wherever the playground has a `range` today, and the playground maps each path to a range with `getRangeOf(ast, path)`, which is what each call site does now.

## Where each export goes

| File | Exports | Goes to |
| --- | --- | --- |
| `E/engine.constants.ts` | `SETTINGS_KEY`, `RULES_KEY` | Both halves, copied |
| `E/engine.types.ts` | `TextRange`, `ConfigTokenKind`, `ConfigToken`, `ProblemLevel`, `ConfigProblem`, `Evaluation`, `Engine` | Stays |
| `E/engine.types.ts` | `ParentDescription`, `EntityDescription`, `DependencyRelationshipKind`, `DependencyRelationship`, `DependencyDescription`, `SkipReason` | The package, unchanged |
| `E/engine.types.ts` | `ElementTypeSummary`, `FileCategorySummary`, `RuleSummary`, `PolicySummary`, `PolicyRef` | Split: the package holds a `path`, the playground adds the `range` |
| `E/engine.types.ts` | `DependencyVerdict`, `NotEvaluatedReason`, `DependencyResult` | Split: the package has no `pending` verdict and no `config-unparsed` reason, and its own dependency type |
| `E/describeFiles.ts`, `E/descriptions.ts`, `E/rootPath.ts`, `E/selectorNames.ts` | all | The package |
| `E/dependencies.ts` | `evaluateDependencies` | The package, with two changes: the source of each dependency comes from the input (today the playground helper `getDependencySource`, line 184), and the `PolicyRef` carries a path |
| `E/dependencyNodes.ts` | `getReadNodeKinds` | The package |
| `E/dependencyNodes.ts` | `getAdditionalNodesProblems` | Stays: playground wording and a range |
| `E/diagnostics.ts` | `toConfigProblems` | Stays |
| `E/diagnostics.ts` | `pointsTo`, `hasErrorUnder`, `areRulesValid` | The package: they test diagnostic paths, no text |
| `E/evaluate.ts` | `createEngine` | Stays, as the adapter over the new package |
| `E/evaluate.ts` | `analyzeConfig` (private) | Split: normalizing, the validity of the rules and the rule choice (lines 42-49, 60) go to the package; parsing and the problems stay |
| `E/evaluate.ts` | `evaluateSketch` (private) | The package, as `evaluateProject`; `getFiles` stays in the adapter |
| `E/evaluatedRule.ts` | `selectRule` | The package, with paths: only lines 115 and 120 read positions |
| `E/normalizeConfigSafely.ts` | `normalizeConfigSafely` | The package: an object in, diagnostics with paths out |
| `E/policies.ts`, `E/summaries.ts` | the summaries | The package, with paths |
| `E/writtenConfig.ts` | `asRecord`, `readSettings`, `getElementsKey`, `getKeptIndexes` | The package, with `readSettings` taking the object |
| `E/locations.ts`, `E/parseConfig.ts`, `E/tokenizeConfig.ts` | all | Stays |
| `E/index.ts` | the entry of the engine | Stays, unchanged |
| `src/contract/Sketch.types.ts` | `Sketch`, `SketchNode` and the dependency types | Stay. The package declares the same shapes for the dependencies, renamed `Project*` |
| `src/domains/evaluation/.../evaluator/evaluator.types.ts` | what the worker sends back | Stays, unchanged |

Today `eslint.config.mjs:82` lets `contract` import nothing, and only the engine imports `@boundaries/*` (`eslint.config.mjs:322-332`, `AGENTS.md`). Decision 14 lets the contract import types of the package, to name what `onEvaluationChange` emits. The contract keeps its `Sketch*` types: the package declares the same shapes for the dependencies, and TypeScript checks that they match where the engine passes one to the other.

## Proposed public interface

```ts
// Input
/** The boundaries part of an ESLint config object, as written; only settings and rules are read */
export type ProjectConfig = { readonly settings?: unknown; readonly rules?: unknown };
export type ProjectDependencyTarget =
  | { readonly kind: "file"; readonly path: string }
  | { readonly kind: "external"; readonly name: string };
export type ProjectSpecifier = { readonly kind: "default" | "named" | "namespace"; readonly name: string; readonly alias?: string };
export type ProjectDependencySyntax = "import" | "export-from" | "require" | "dynamic-import";
export type ProjectDependency = {
  readonly from: string;
  readonly target: ProjectDependencyTarget;
  readonly syntax: ProjectDependencySyntax;
  readonly importKind: "value" | "type";
  readonly specifiers: readonly ProjectSpecifier[];
  /** New and required (decision 16): the source as the statement writes it */
  readonly source: string;
};
export type Project = {
  readonly config: ProjectConfig;
  readonly files: readonly string[];
  readonly dependencies: readonly ProjectDependency[];
};

// Output
export type ConfigPath = readonly (string | number)[];
export type DependencyRef = { readonly path: string; readonly index: number };
export type PolicyRef = { readonly index: number | null; readonly path: ConfigPath };
export type NotEvaluatedReason = "rules-invalid" | "no-rule" | "rule-off" | "no-options";
export type DependencyVerdict =
  | { readonly status: "allowed"; readonly policy: PolicyRef }
  | { readonly status: "disallowed"; readonly policy: PolicyRef | undefined; readonly message: string; readonly level: "error" | "warning" }
  | { readonly status: "not-checked"; readonly reason: SkipReason }
  | { readonly status: "not-evaluated" };
export type DependencyResult = {
  readonly dependency: ProjectDependency;
  readonly ref: DependencyRef;
  readonly source: string;
  readonly description: DependencyDescription | undefined;
  readonly verdict: DependencyVerdict;
};
export type ProjectAnalysis = {
  readonly files: ReadonlyMap<string, EntityDescription>;
  readonly dependencies: readonly DependencyResult[];
  readonly diagnostics: readonly Diagnostic[];
  readonly rulesValid: boolean;
  readonly notEvaluated: NotEvaluatedReason | undefined;
  readonly policies: readonly PolicySummary[];
  readonly elementTypes: readonly ElementTypeSummary[];
  readonly fileCategories: readonly FileCategorySummary[];
  readonly rules: readonly RuleSummary[];
};
export function analyzeConfig(config: ProjectConfig): ConfigAnalysis;
export function evaluateProject(analysis: ConfigAnalysis, project: Pick<Project, "files" | "dependencies">): ProjectAnalysis;
```

- The summaries move to the package (decision 25) and keep the fields they have today, with `path: ConfigPath` in place of `range`. `ConfigAnalysis` is the one of `E/evaluate.types.ts` without `text`, `parsed` and `problems`.
- Two functions (decision 15) because they are the seam that exists today between `analyzeConfig` and `evaluateSketch`: the playground keeps memoizing the analysis by the config text (`E/evaluate.ts:148-151`).
- The target kind is `file` (decision 26), where the `Sketch` of the playground says `node`: the adapter already builds each dependency again to add its source.
- The engine of the playground becomes an adapter. It parses the text, calls `analyzeConfig` and `evaluateProject` with `getFiles(sketch)` and each dependency plus its source, and maps the output back to the `Evaluation` of today: paths to ranges, one ranged `PolicyRef` per policy built once per analysis, and `config-unparsed` when the text does not parse. `E/engine.types.ts` and `E/index.ts` do not change, so no page code does.

## Does a real project fit?

Checked against what the spike reads (`spike/read-project.mjs`).

| Today | What blocks a real project | In the proposal |
| --- | --- | --- |
| `Sketch.config` is a text | The reader has an object | `ProjectConfig` is an object |
| The source is made up from the target (`getDependencySource`) | The origin of a module depends on the source as written: core modules, aliases, custom source patterns (`packages/elements/src/Descriptor/Module/ModuleDescriptor.ts:181-193`) | `source` is required |
| The syntax is one of 4 values, mapped to a node kind | Additional dependency nodes have names that the user chooses | Not solved; an optional `nodeKind` can be added later without breaking |
| `importKind` is `value` or `type` | The `typeof` kind exists in the descriptions | Not solved; it can be added later the same way |
| A file target is a file of the project | A resolved file outside the root | The reader writes it as `external`, as the spike does |
| Specifiers are structured | The spike writes names only | The reader maps them |
| `files` of the evaluation is a `Map` | It is not JSON | A snapshot holds the `Project`, not the evaluation |

The limits of 1000 nodes and 3000 dependencies (`sketch.constants.ts`) apply to reading an untrusted sketch only, not to the engine. An absolute `boundaries/root-path` is taken as the root (`E/rootPath.ts:20-22`), so the reader has to write it relative.

## What the playground emits

Decisions 13 and 14 of the index.

- A new prop, `onEvaluationChange`, goes from `Playground` to `Shell` to `SessionProvider`, where an effect over the evaluation and its status emits it. The worker, the evaluator and the store already carry what it needs: the store keeps the last evaluation and `evaluationStatus`, one of 5 values (`src/domains/session/data/store/store.ts:110-137`).
- It emits `{ status: "current"; analysis: ProjectAnalysis }`, `{ status: "stale" }` or the status of a config that does not parse, below. `current` is the status `current` of the store; `pending`, `late`, `stopped` and `failed` are `stale`. The graph keeps the last analysis and shows it as loading or out of date. The evaluation that the store aligns to a newer sketch, with its pending verdicts, is never emitted.
- The emitted object is the `ProjectAnalysis` of the package, with config paths and no range. The contract imports its type from `@boundaries/analysis`, as a type only, so that no code of the package loads outside the worker. The paragraph of `AGENTS.md` that says the types of the engine are the playground's own is rewritten: it holds for `elements` and `policies`, not for the package that is the shared model.
- The worker replies with both forms in one message: the `Evaluation` that the panes read, with ranges, and the `ProjectAnalysis`. The descriptions of the files and of the dependencies are the same objects in both, and the structured clone of a message copies an object once however many times the message references it. What is doubled is one small object per dependency and per policy, element type, file category and rule. Its cost is not measured: it is part of the measurement of the cost in a browser, the open question of `01-design-and-issues.md`.
- The panes do not change. Making them read the `ProjectAnalysis` too, with the ranges in a table from path to range, is a later refactor that the graph would not notice: 13 production files and 25 spec and mock files outside the engine use ranges.
- When the config text does not parse there is no analysis of it: the playground emits a third status with the detail of the error (decision 29), such as `{ status: "invalid"; problems }`, whose exact shape the phase that adds the prop settles.

Of what the mockup reads from `data.json`, the analysis holds everything except the text of each policy, which `spike/compact.mjs` makes from the normalized policy and the playground slices from the config text by range. The label of a policy in the graph can be built from its index, its action and its `from` and `to` names, with no text. The mockup uses none of the element type, file category and rule summaries.

## Input of `@boundaries/graph-data`

The `ProjectAnalysis` type of the package (decision 14). What it reads of it: of each file, the element (`types`, `path`, `captured`, `parents`, `isUnknown`) and the file categories; of each dependency, its `ref`, its `target`, `syntax` and `importKind`, the module `origin` and `source` of its target, its `kind`, `nodeKind` and `relationship`, and its verdict with the index of the deciding policy; of each policy, `index`, `action`, `from`, `to`, `decided` and `disallowed`.

## What the extraction changes

- **Lint.** `@boundaries/analysis` joins the packages that the engine may import (`eslint.config.mjs:325-329`), and the contract may import its types. The engine keeps `@boundaries/config` and drops `policies` and `elements`, which become devDependencies of the playground because `E/evaluate.spec.ts` and the mocks import them.
- **Package graph.** `analysis → policies, config, elements`, and `playground → analysis, config`. The worker chunk carries `analysis` too. `browser-e2e` gets a scenario for it (`.agents/rules/browser-code.md`).
- **Nx.** A new project modeled on `packages/policies/project.json`. The four lists of build dependencies in the `project.json` of the playground become `config` and `analysis`.
- **Agent docs that become false:** the `repo-architecture` skill, the package count in the root `AGENTS.md` (if published), the rules `browser-code`, `typescript-conventions`, `unit-testing`, `mutation-testing` and `sonar` (if published), the `release` skill and `.github/CONTRIBUTING.md` (if published), and `packages/policies/AGENTS.md`.

## Straight into `release`?

It can: it is a refactor that preserves behavior. The entry of the engine and the reply of the worker keep their shapes, and the proof is that `E/evaluate.spec.ts` passes against the adapter with every assertion kept. Its tasks, in order:

1. Create the package, modeled on `packages/policies/`.
2. Move the config half with paths: the written-config readers, the diagnostic tests, `normalizeConfigSafely`, `resolveRootPath`, `selectRule`, the summaries, `analyzeConfig`. Its specs move, rewritten from text to objects and from ranges to paths.
3. Move the description and evaluation half: the descriptions, `describeFiles`, `getReadNodeKinds`, `evaluateDependencies`, `readSelectorNames`, `summarizePolicies`, `evaluateProject`.
4. Add the browser scenario in `test/browser-e2e`.
5. Turn the engine into the adapter and delete what moved.
6. Update the agent docs.

About 4,900 lines of specs move and are rewritten.

## Risks

- `E/evaluate.spec.ts` counts the calls to `normalizeConfig` through a mock of `@boundaries/config`. After the cut that call happens inside the built code of the package; whether the mock still reaches it was not tried.
- The placeholder for a text that does not parse is normalized today without a root path. Through `analyzeConfig` it would get an empty one. A comment in `E/rootPath.ts` says that `elements` treats it as no root path; it was not proved.
