# Phase 2: extract `@boundaries/analysis`

## Goal

`packages/analysis` is a new published package, `@boundaries/analysis` (Nx project `analysis`), that evaluates a whole project without the config text: `analyzeConfig(config)` and `evaluateProject(analysis, project)` take a config object, the files and the dependencies, and return a `ProjectAnalysis` with config paths in place of text ranges. The engine of the playground, `packages/playground/src/domains/evaluation/helpers/engine/` (`E/` below), is an adapter over it: it parses the text, calls the package and maps each path back to a range. The playground shows what it shows today.

## Issue and PR

- Closes #686. Branch `refactor/686/analysis-package`, from `release`. PR into `release`, titled `refactor(analysis): extract the evaluation of a project from the playground`.
- The PR commits no plan file (`write-plan` skill, "Where it lives", point 4). The session reads the plan with `git show origin/feat/architecture-graph:.agents/plans/architecture-graph.md`, and the same for `architecture-graph/00-shared.md`, `architecture-graph/engine-cut.md` and this file. Its plan edits are commits on `feat/architecture-graph`, pushed once the maintainer approves them.
- Changelog entries, by `.agents/rules/changelog-and-versioning.md`:
  - `packages/analysis/CHANGELOG.md` is created with its first entry, `feat(#686): First version. ...`, as `packages/policies/CHANGELOG.md` has for its `1.0.0`. Until the package is first released, later changes add no entry: they correct this one.
  - `packages/website/CHANGELOG.md`, under `## [Unreleased]`: one `chore(#686)` entry, because the website deploys the playground and `scripts/check-changelogs.js` makes its changelog cover `packages/playground/`.
  - `packages/eslint-plugin/CHANGELOG.md`: one `chore(#686)` entry, because step 6 adds a row to the package table of the root `README.md`, which that changelog covers.
  - None in `config`, `policies` and `elements`: their code does not change.
- The PR description shows:
  - That `E/evaluate.spec.ts` passes against the adapter with every assertion kept, and the old-to-new list of the specs that moved to the package.
  - The result of decision 27 (the package lints its own layering, or why it cannot).
  - The tasks left to the maintainer before the first release: the first version of a new package is published from the maintainer's machine and then gets its trusted publisher (`.github/CONTRIBUTING.md`, "Trusted publishing"), and the SonarCloud project and its token secret are created by the maintainer.

## Read first

- `architecture-graph/00-shared.md`, "The interface of `@boundaries/analysis`": the types and the two functions to export.
- `architecture-graph/engine-cut.md`: "Where each export goes" is the table this phase follows export by export; "What the extraction changes" lists the lint, the package graph, Nx and the agent docs.
- `packages/policies/`: the model of a published package that runs in browsers (`package.json`, `project.json`, `tsup.config.js`, `jest.config.js`, `stryker.config.mjs`, `sonar-project.properties`, `eslint.config.mjs`, `test/e2e/builds.spec.mjs`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `LICENSE`).
- `packages/playground/AGENTS.md` and `packages/playground/eslint.config.mjs`: only the engine imports `@boundaries/*`, and only the worker creates an engine.
- `.agents/skills/repo-architecture/SKILL.md`: the dependency graph that the new package changes, and why `config` and `policies` do not lint themselves with the workspace plugin.
- `.agents/rules/browser-code.md` and `test/browser-e2e/README.md`, "Adding a scenario": the last paragraph says how a new package joins the suite.
- `.agents/rules/unit-testing.md`, `.agents/rules/mutation-testing.md`, `.agents/rules/nx-project-config.md` and `.agents/rules/agents-md.md`.

## Preconditions

None. Decisions 2, 14 to 17, 23 to 27 and 41 to 43 of the index are taken.

## Scope

- In: the package with its build, tests, docs and CI entries; the engine turned into the adapter; the lint config, the `package.json` and the `project.json` of the playground; the scenario in `test/browser-e2e`; the agent docs that name the published packages.
- Out: any change of what the playground shows; any change of `E/engine.types.ts` other than re-exporting the description types of the package (decision 42) and correcting a TSDoc (step 2); any change of `E/index.ts` or of the reply of the worker (`packages/playground/src/domains/evaluation/helpers/evaluator/evaluator.types.ts`); the `onEvaluationChange` prop and the import of the package by the contract, which are phase 4 (`04-playground-emits-evaluation.md`).
- Handed on: the `ProjectAnalysis` type and the entry of the package, to phases 4 and 5.

## Steps

Every change goes through the `implement-change` skill; this one is "architectural and new", so the `architect` and the `skeptic` see the design before any code. The order below is the one of `engine-cut.md`, "Straight into `release`?".

1. **Create the package.** `packages/analysis/`, modeled file by file on `packages/policies/`: the same `exports` map with the `browser`, `node` and `default` conditions, the same scripts, `engines.node`, the 100% `coverageThreshold` and the Stryker thresholds. Its dependencies are `@boundaries/config`, `@boundaries/policies` and `@boundaries/elements`, with `workspace:*`. Its Stryker `dashboard.module` is `analysis`. `src/index.ts` is its public interface.
2. **Move the config half, with paths.** The written-config readers (`E/writtenConfig.ts`, with `readSettings` taking the object), `pointsTo`, `hasErrorUnder` and `areRulesValid` of `E/diagnostics.ts`, `E/normalizeConfigSafely.ts`, `E/rootPath.ts`, `selectRule` of `E/evaluatedRule.ts`, `E/summaries.ts`, and the part of `analyzeConfig` of `E/evaluate.ts` that normalizes, checks the rules and chooses the rule. `analyzeConfig` also builds the summaries of element types, file categories and rules without the counts that depend on the project (decision 41); the policy summaries join it in step 3, with `E/policies.ts` and `E/selectorNames.ts`. The TSDoc of `ElementTypeSummary.ignored` (`E/engine.types.ts:152`) says that a descriptor is also ignored when describing the files with it throws, which no code does: the type of the package and the one of the playground drop that clause. Each place that calls `getRangeOf` today (`E/evaluatedRule.ts`, `E/summaries.ts`) returns the config path it passes to it instead. Their specs move with them, rewritten from texts to objects and from ranges to paths.
3. **Move the description and evaluation half.** `E/descriptions.ts`, `E/describeFiles.ts`, `getReadNodeKinds` of `E/dependencyNodes.ts`, `E/dependencies.ts`, `E/selectorNames.ts`, `E/policies.ts` and `evaluateSketch` of `E/evaluate.ts`, as `evaluateProject`, which adds the counts to the summaries and never reads the config as written. `evaluateDependencies` takes the source of each dependency from the input (decision 16) where it calls `getDependencySource` today, and a file target has the kind `file` (decision 26). The package declares its own `Project*` input types; it has no `pending` verdict and no `config-unparsed` reason.
4. **Add the browser scenario.** In `test/browser-e2e`: the package in `package.json`, its name in `PACKAGES` of `scripts/build.js`, a scenarios module in `src/scenarios/` listed in `src/scenarios/index.js`, and the package named in its `README.md`.
5. **Turn the engine into the adapter and delete what moved.** `E/evaluate.ts` parses the text, calls `analyzeConfig` and `evaluateProject` with `getFiles(sketch)` and each dependency plus its source, and maps the result to the `Evaluation` of today: each path to a range with `getRangeOf`, one ranged `PolicyRef` per policy, and `config-unparsed` when the text does not parse. The memo of the analysis by config text stays. What stays in `E/` is in the table of `engine-cut.md`: the text half (`locations`, `parseConfig`, `tokenizeConfig`), `toConfigProblems`, `getAdditionalNodesProblems`, the types and the entry.
   - The ranged `PolicyRef`s and the problems are built once per config text and kept with its analysis: `E/evaluate.spec.ts` expects the same objects for two sketches with the same config text ("the same reference to the policy that decided", "keep the problems of the config in their place"). No pane depends on that identity: `findHighlightPolicy` (`packages/playground/src/domains/session/helpers/focus/focus.ts`) finds a policy by its range.
   - `E/evaluate.spec.ts` keeps its count of the calls to `normalizeConfig`, and a text that does not parse can be analyzed as an empty config through `analyzeConfig`: `engine-cut.md`, "Risks", has the measurements behind both.
   - `getAdditionalNodesProblems` reads the written settings with `readSettings` of `E/writtenConfig.ts` (`E/dependencyNodes.ts:45`), which moves to the package and stays out of its interface, so the adapter reads `settings` from the object it parsed, the one it passes to `analyzeConfig` (decision 43).
   - `E/engine.types.ts` re-exports `ParentDescription`, `EntityDescription`, `DependencyRelationshipKind`, `DependencyRelationship`, `DependencyDescription` and `SkipReason` from `@boundaries/analysis` with `export type`, in place of its own declarations (decision 42). The types whose shape differs, the summaries with a range and the verdicts with `pending`, stay declared in the playground.
   - `packages/playground/eslint.config.mjs`: the policy that lets the engine import `@boundaries/config`, `@boundaries/policies`, `@boundaries/elements` and `@humanwhocodes/momoa` lists `@boundaries/analysis`, and drops the packages the engine no longer imports.
   - `packages/playground/package.json`: `@boundaries/analysis` joins the dependencies with `workspace:*`; `@boundaries/policies` and `@boundaries/elements` become devDependencies if only specs and mocks import them.
   - `packages/playground/project.json`: the four `build` lists (`check:types`, `test:unit`, `dev`, `build`) name the packages the sources import after the cut.
6. **Wire the package into the repository.** Each of these names the published packages one by one today:
   - `.github/workflows/build.yml` (coverage and build artifacts, the unit tests on the other Node.js versions, Coveralls, SonarCloud), `.github/workflows/publish.yml` (the two `build` lines) and `.github/workflows/test-mutation.yml` (the matrix).
   - `scripts/check-changelogs.js`: an entry of `CHANGELOGS` for `packages/analysis/`.
   - The root `AGENTS.md` (the count and the list of published libraries), the `repo-architecture` skill (component map, dependency graph, the `browser-e2e` and `website build` lines), the `paths` and the text of `.agents/rules/browser-code.md`, `typescript-conventions.md`, `unit-testing.md`, `mutation-testing.md` and `sonar.md`, the `release` skill, and `.github/CONTRIBUTING.md` ("Publishing" and "Trusted publishing").
   - `packages/playground/AGENTS.md`: the sentences on which `@boundaries/*` packages the engine imports and what the worker chunk carries, and the sentence of "Layering" that says the types the engine exports are the playground's own, which no longer holds for the description types it re-exports (decision 42).
   - `packages/policies/AGENTS.md`: its second paragraph says that the website playground calls the functions of the package, which it does through `@boundaries/analysis` after the cut.
   - `packages/analysis/AGENTS.md`, written by `.agents/rules/agents-md.md`, with its `CLAUDE.md`, and `packages/analysis/README.md` for its consumers.
   - The package table of the root `README.md` and `packages/website/docs/releases/releases.md`, which list the published packages.

## Verification

- `pnpm nx run-many -t check:all --all` passes (criterion 4).
- `pnpm nx build analysis`, `pnpm nx test:unit analysis` with 100% coverage, and `pnpm nx test:mutation analysis` over the `break` threshold of `packages/policies/stryker.config.mjs` (criterion 1). `pnpm nx test:e2e analysis` checks its browser builds, as `packages/policies/test/e2e/builds.spec.mjs` does.
- `pnpm nx test:unit playground` and `pnpm nx test:e2e website-e2e` pass. The diff of the specs that stay in the playground shows no assertion changed other than imports, and `E/evaluate.spec.ts` keeps every assertion (criterion 2). For each spec that moved, the PR lists the old assertion and the new one.
- `grep -rl "@boundaries/analysis" packages/playground/src | grep -v "domains/evaluation/helpers/engine/"` prints nothing, and the lint of the playground fails on such an import in a temporary file outside the engine (criterion 3).
- `pnpm nx test:e2e browser-e2e` runs the new scenario in the three browsers.
- `packages/analysis/CHANGELOG.md` has its first entry, and `node scripts/check-changelogs.js origin/release HEAD origin/master` passes (criterion 5).
- `packages/playground/dist/index.js` and `packages/playground/dist/share.js` contain no `@boundaries/` specifier after the build, as today.

## Hand-offs

- To phase 4 (`04-playground-emits-evaluation.md`) and phase 5 (`05-graph-data.md`): the `ProjectAnalysis` type as it was merged, the entry `@boundaries/analysis`, and the names of `analyzeConfig`, `evaluateProject` and the `Project*` input types. Any difference with `00-shared.md`, "The interface of `@boundaries/analysis`", is corrected there in the same plan commit.
- To phase 4: where the adapter holds the `ProjectAnalysis` before it maps it, since the worker replies with it there.
- To phase 10 (`10-policy-name.md`): whichever merges second carries the name. If #689 is merged, the `PolicySummary` of the package has its `name` from this phase, as the engine has it then. If it is not, phase 10 adds it to the package.

## Open points

- **Decision 27.** `packages/eslint-plugin/package.json` depends on `config`, `elements` and `policies` and on nothing that would depend on `analysis`, so a devDependency of `analysis` on the workspace plugin should create no cycle; it was not run. Default: add it, with `lint` on `^build` and the other targets narrowed to the builds of `elements`, `config` and `policies` as `packages/playground/project.json` does, so that only `lint` builds the plugin. If Nx refuses the graph, the layering is described in `packages/analysis/AGENTS.md` and not lint-enforced, as in `packages/policies/AGENTS.md`.
- **The first version.** Default `1.0.0`, the first version of `@boundaries/policies`.
