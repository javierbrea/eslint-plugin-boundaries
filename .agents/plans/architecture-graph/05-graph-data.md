# Phase 5: `@boundaries/graph-data`

## Goal

A new published package, `packages/graph-data` (`@boundaries/graph-data`, Nx project `graph-data`), takes a `ProjectAnalysis` of `@boundaries/analysis` and returns the nodes, the edges and the metrics that the views of the graph draw. It is pure TypeScript with no React and no browser API, it runs in Node.js and in browsers, and it has the quality gates of the other published packages.

## Issue and PR

- Issue #690, a sub-issue of #685. The release pull request into `master` closes it, so the pull request of the phase links it without waiting for it to close.
- Branch `feat/690/graph-data`, from `feat/architecture-graph`. Pull request into `feat/architecture-graph`, titled `feat(graph-data): aggregate an evaluated project into a graph`.
- Changelog: `packages/graph-data/CHANGELOG.md` is created with one entry, `feat(#690): First version. …`, under the section of its first version, with no date. The last section of `packages/policies/CHANGELOG.md` is the model. No other changelog gets an entry: no released package depends on this one.
- The plan edits of "Hand-offs" are commits of this pull request (`write-plan` skill, "Finishing a phase").
- The pull request description shows the public interface as exported, the mutation score, the timings of "Verification" and every deviation from this file.

## Read first

- `../architecture-graph.md`: decisions 3, 9, 14, 23, 24, 31 and 39.
- `00-shared.md`, "The interface of `@boundaries/analysis`" and "Views": the input type and what the views ask of the aggregation.
- `engine-cut.md`, "Input of `@boundaries/graph-data`": the fields of the analysis that the package reads.
- `browser-cost.md`, "Aggregation and what it gives the layout": the numbers that the package reproduces for `packages/playground`.
- `mockup/index.html` (`groupOf`, `aggregate`, `renderComp`) and `mockup/react-flow/src/main.jsx` (`aggregate`): models of the aggregation, of the edges between whatever is visible and of the breakdowns. They read the compact `mockup/data.json`, not a `ProjectAnalysis`, so their field names do not carry over.
- `packages/analysis/src/index.ts` and `packages/analysis/AGENTS.md`, which phase 2 creates: the exported types as they are. They win over the sketch of `00-shared.md`.
- `packages/policies/`: the model of a published package that runs in browsers, file by file, and its `AGENTS.md`.
- `.agents/rules/browser-code.md`, `mutation-testing.md`, `sonar.md`, `typescript-conventions.md`, `unit-testing.md`, `nx-project-config.md`, `changelog-and-versioning.md` and `agents-md.md`.
- `test/browser-e2e/README.md`, "Adding a scenario": how a new package and its scenario are added.
- The `repo-architecture` skill and `.github/CONTRIBUTING.md`, "Versioning" and "Trusted publishing".

## Preconditions

- #686 is merged into `release`, and `release` is merged into `feat/architecture-graph`, so that `packages/analysis` exists on the branch and exports `ProjectAnalysis`.
- The `status: blocked` label is off #690.

## Scope

In:

- The package, with its build for Node.js and browsers, its unit, mutation and build tests, and its `README.md`, `AGENTS.md` and changelog.
- The aggregation: "group by", expansion, filters, metrics, and the dependencies behind each node and edge.
- The counts that the Composition view shows, so that phase 7 aggregates nothing in React.
- A scenario in `test/browser-e2e`.
- The lists of the repository that name the published packages: workflows, scripts, agent docs.

Out:

- Any drawing, layout, size or position, and any React code: phases 6 and 7.
- The text shown for a group or a policy. The package returns facts (names, indexes, counts), and the graph turns them into labels.
- The notice of decision 31. The package returns the number of visible edges, and phase 6 compares it with the threshold.
- A snapshot format or a reader of real projects (decision 9).

## Steps

Every change goes through the `implement-change` skill. The package, its public exports and its dependency on `@boundaries/analysis` make the change "architectural and new" there, so the `architect` and the `skeptic` design the public interface and the maintainer approves it before any code.

### The package

- Create `packages/graph-data` after `packages/policies`: `package.json` (`publishConfig.access` public, the `browser`, `node` and `default` export conditions, `engines.node` as `policies` has it, exact versions), `project.json`, `tsup.config.js` with the two builds, the `tsconfig` files, `jest.config.js` (Node.js environment, 100% thresholds), `stryker.config.mjs` (the thresholds of `policies`, dashboard module `graph-data`), `sonar-project.properties`, `eslint.config.mjs` with `createBrowserConfig`, `cspell.config.js`, `babel.config.js`, the two `serve.*.json`, `LICENSE`, `.gitignore`, `CLAUDE.md` and `test/e2e/builds.spec.mjs`.
- `src/index.ts` is the public interface, as in `policies`: a symbol is public only when it lists it.
- `README.md` documents the interface for a consumer with no React, with one example in Node.js. `AGENTS.md` holds the layering and the hard constraints, under the limits of `.agents/rules/agents-md.md`.

### The aggregation

The names and the shape of the exports come from the design step. Whatever the shape, the result gives:

- **Nodes.** One per group of the "group by": element type, element, captured value, file category, module origin or folder. Each has a stable id, the kind and the key of its group, its parent when it has one, how many files it holds, whether it can expand, its fan-in and fan-out, and the dependencies inside it.
- **Expansion.** A set of expanded nodes is an input. An expanded type gives its elements and an expanded element its files, and the edges are aggregated again between whatever is visible, as `aggregate` of `mockup/react-flow/src/main.jsx` does.
- **Edges.** One per ordered pair of visible nodes, with how many dependencies it holds by verdict, whether the opposite edge exists, and the `DependencyRef` of each dependency behind it.
- **Filters.** Verdict, deciding policy, kind (value or type), syntax, relationship, externals (hidden, one node, or one node per module), test files, minimum weight and path glob. An edge with a disallowed dependency is kept whatever the minimum weight, as in `mockup/index.html`.
- **Metrics.** The pairs of groups that depend on each other, the fan-in and fan-out of each group, the policies that decide nothing, the unclassified files, and the number of visible nodes and edges.
- **Breakdowns.** Files by element type, by captured value and by file category, and dependencies by deciding policy, each as sorted counts.
- **Policies.** A policy is referred to by its index, with the `name` of its summary when the type of `@boundaries/analysis` has one (decision 39).

Constraints:

- Every function is pure: the same input gives the same output, the input is never mutated, and nothing reads the clock, the environment or a global.
- The same analysis and options give nodes and edges in the same order, so that a layout draws the same picture twice.
- The work is in proportion to the files plus the dependencies: no scan of the dependencies per node or per edge.
- The input type is the `ProjectAnalysis` of `@boundaries/analysis`, imported as a type. A status, a text range or a `Sketch` of the playground never appears in the interface.

### The repository

`policies` is named in each of these today, and phase 2 adds `analysis` beside it. Add `graph-data` the same way:

- `test/browser-e2e`: the dependency in `package.json`, `PACKAGES` in `scripts/build.js`, a scenarios module in `src/scenarios/` listed in `src/scenarios/index.js`, with at least one scenario that aggregates the analysis of the quick-start example.
- `.github/workflows/build.yml`: the coverage and build artifacts, the unit tests of `test-node-versions`, Coveralls and the SonarCloud scan. `.github/workflows/test-mutation.yml`: the matrix. `.github/workflows/publish.yml`: the two build commands.
- `scripts/check-changelogs.js`: an entry of `CHANGELOGS`.
- `.github/CONTRIBUTING.md` ("Publishing", steps 1 and 6, and "Trusted publishing") and the `release` skill, where they list the published packages.
- The root `AGENTS.md` (the count and the list of published libraries), the `repo-architecture` skill (component map, dependency graph, what `browser-e2e` runs), and the `paths` of the rules `browser-code`, `mutation-testing`, `sonar` and `typescript-conventions`, plus the placement table of `unit-testing`.

## Verification

- `pnpm nx run-many -t check:all --all`, and `pnpm lint` and `pnpm check:spell` at the root.
- `pnpm nx test:mutation graph-data` passes the `break` threshold, and each surviving mutant is killed or commented as `.agents/rules/mutation-testing.md` says. The workflow runs it only on `release` and `master`, so it is run locally.

Each acceptance criterion of #690:

| Criterion | Check |
| --- | --- |
| No React and no browser API, tests in Node.js | `package.json` has no `react` and no DOM library; `createBrowserConfig` lints `src`; `jest.config.js` has `testEnvironment: "node"`; `pnpm nx test:e2e graph-data` runs the browser bundles without Node.js globals |
| Unit and mutation thresholds of the published packages | The coverage thresholds of `jest.config.js` and the thresholds of `stryker.config.mjs` equal those of `packages/policies` |
| A scenario in the browser e2e suite | `pnpm nx test:e2e browser-e2e` lists a test named `graph-data: …` per browser |
| `check:all`, `README.md`, `AGENTS.md`, first changelog entry | The command above, and the three files exist |

Also measured, for the pull request description: aggregating the analysis of `packages/playground` by element type and by element takes the order of the times of `browser-cost.md`, and gives its node and edge counts or the difference is explained.

## Hand-offs

- To phases 6 and 7 (`06-graph-map.md`, `07-graph-views.md`): the public interface as merged, by pointing to `packages/graph-data/src/index.ts` and its `README.md`, and how each open point below was settled.
- To phase 6: the name of the field that holds the number of visible edges, which the notice of decision 31 reads.
- To phase 7: the names of the breakdowns and of the metric of the policies that decide nothing.
- To the release: the first version of a new package is published from the maintainer's machine before its trusted publisher is added (`.github/CONTRIBUTING.md`, "Trusted publishing"). It goes in the pull request description, and in the tracking issue #685 when phase 9 closes the plan.

## Open points

- **The first version.** Default: `1.0.0`, as `config` and `policies` started.
- **How `@boundaries/analysis` is declared.** Its types appear in the published declarations. Default: a `dependency` with `workspace:*`, imported with `import type` only, and a check that the browser bundle of `test/browser-e2e` holds no code of it beyond what the scenario itself calls.
- **Linting its own layering with the workspace plugin.** Default: what phase 2 settled for `analysis` (decision 27), read in `packages/analysis/AGENTS.md`; whichever it is, `pnpm nx graph` shows no cycle.
- **Which files are test files.** The config does not say, and both mockups hard-code the category names of this repository. Default: the filter takes a list of file category names from the caller and the package has no list of its own; phase 6 chooses what the frame passes.
- **Which captured value groups.** The mockup hard-codes `domain` and `scope`. Default: the "group by" takes the name of the captured key, and the result lists the keys that the analysis has, for the frame to offer.
- **A file with several file categories.** Default: its first category, as the mockup does, said in the TSDoc.
- **The depth of the folder grouping.** Default: an option in path segments, 2 when it is not given.
- **The matcher of the path glob.** Default: `picomatch`, at the exact version that `packages/elements/package.json` has, as a dependency; it has to pass the browser bundles.
- **SonarCloud.** The scan needs a project and a token secret that only the maintainer can create. Default: add `sonar-project.properties` and the workflow step guarded by its secret, as the other packages have it, and ask the maintainer to create the project before the branch reaches `release`.
