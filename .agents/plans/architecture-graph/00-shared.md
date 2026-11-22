# Shared: the design of the architecture graph

What every phase builds. Phase 1 (`01-design-and-issues.md`) completes it: it has no `TODO` left since 2026-11-22.

## Summary

A view of a project as its boundaries config sees it: its element types, its elements and the dependencies between them, allowed or disallowed, instead of one node per file. It is first drawn on the website, over the sketch of the playground, and it is built so that a later local tool draws a real project with the same components.

## Motivation

- A boundaries config describes an architecture, but today the only way to see it is to read the config. The playground of [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538) shows one file and one dependency at a time.
- Import-graph tools draw one node per file, which is unreadable for a project of any size and knows nothing of element types, captured values or policies.
- RFC #538 reserved this view ("Later, the graph") and its visual language, and left its design for later.

The view is a tool to analyze an architecture, so each of its parts answers a question: which layers exist and how they depend on each other, what a given element depends on and what depends on it, where the cycles and the coupling are, what the project is made of, and which policies decide what.

## Design

### Packages

| Package | Role | Depends on |
| --- | --- | --- |
| `@boundaries/analysis` | Evaluates a whole project: the config as an object, the files and the dependencies in, the description of each file and the verdict of each dependency out. Extracted from the engine of the playground. | `config`, `policies`, `elements` |
| `@boundaries/graph-data` | Aggregates an evaluated project into nodes and edges, by a "group by" and filters, with its metrics. Pure, no React. | the types of `analysis` |
| `@boundaries/graph` | The React component: the views, the filters and the inspector. | `graph-data`, `ui-kit` |
| `@boundaries/ui-kit` | The MUI theme, the theme root and the domain-free components that the playground has today. | `design-tokens` |

`analysis` and `graph-data` are published; `graph` and `ui-kit` are private. The extractions of `analysis` and `ui-kit` go straight into `release`, before the graph (decisions 21, 23 and 24).

### The interface of `@boundaries/analysis`

`E/` is `packages/playground/src/domains/evaluation/helpers/engine/`, which the package is cut from; `engine-cut.md` says where each export goes. The description types (`EntityDescription`, `DependencyDescription`, `SkipReason`) and the summaries are the ones the engine has today.

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

`@boundaries/graph-data` takes the `ProjectAnalysis` (decision 14); `engine-cut.md`, "Input of `@boundaries/graph-data`", lists what it reads of it.

### How the playground and the graph work together

- The playground evaluates the sketch once, in its worker, and emits each complete evaluation through `onEvaluationChange`: `{ status: "current", analysis }`, or `{ status: "stale" }` while the evaluation is behind the sketch. The analysis is the `ProjectAnalysis` of `@boundaries/analysis`. The graph keeps the last one and shows it as loading or out of date. It aggregates it, and aggregates again when a filter changes, without evaluating.
- The host composes both. On the website, the playground stays mounted and hidden while the graph is on screen, so that the session and the worker are kept.
- The playground gets an input to open a file or a dependency, so that a selection in the graph leads back to the editor.
- The switch between both is a row of tabs that the host draws above them (decision 28).
- When the config text does not parse, the playground emits a third status with the detail of the error, and the graph says why it draws nothing (decision 29).

### Views

| View | Question | What it draws |
| --- | --- | --- |
| Map | Which layers are there and how do they depend on each other? | A graph of groups, with edges as thick as their dependencies are many |
| Focus | What does this group depend on, and what depends on it? | One group in the center, with what comes in and what goes out |
| Matrix | Where are the cycles and the coupling? | Group by group, with counts |
| Composition | What is the project made of? | Files by type, captured value and category; dependencies by deciding policy |

- Group by: element type, element, captured value, file category, module origin, folder.
- Filters: verdict, deciding policy, kind, syntax, relationship, externals, test files, minimum weight, path glob.
- Metrics: groups that depend on each other, fan-in and fan-out, policies that decide nothing, unclassified files.
- A selection lists the real dependencies behind a node or an edge.
- The Map opens as a summary: one circle per element type, tests hidden, thin edges with no numbers, and the detail on demand by selecting or expanding (decision 35).
- The four views stay, as the first mockup draws them (decision 37). The Map has the layered layout only in its first version (decision 34). Composition draws sorted bars, one breakdown at a time behind tabs: files by type, by captured value and by category, and dependencies by deciding policy.
- A policy is shown by its name when it has one, and by its position when it has none. The name is a new optional property of a policy of `boundaries/dependencies` (decision 39).
- A graph too big for the layered layout starts collapsed by element type, its layout has a time limit and can be cancelled, and a notice suggests a higher minimum weight (decision 31). The notice shows above 1000 visible edges, a starting value that the phase of the Map tunes.

### Rendering library

React Flow (`@xyflow/react`) renders the Map, with its attribution visible (decision 18). Its nodes are React components styled with the tokens, and it brings keyboard and ARIA support. ELK (`elkjs`) computes the layered layout in a web worker, behind an adapter, and each edge is one curve between two circles, not the route that ELK returns (decision 35; decision 19 which also holds the conditions of its license). `mockup/react-flow/` shows both.

### Cost in a browser

`browser-cost.md` holds the measurement. For `packages/playground`, 725 files and 2740 dependencies, the evaluation in the worker takes about 0.4 s and grows with the dependencies; replying with both forms adds 3 ms, and the aggregation takes 0.3 ms. A sketch of the website, with tens of files, is far under that. What limits the Map is the number of edges that the layout has to place.

### Accessibility

The Map is operable with the keyboard, which React Flow brings. The matrix and the lists of the inspector are a complete reading of the same data. The graph passes the checks that the rest of the website passes. Where reaching this costs too much in one part, the maintainer decides whether to lower it there (decision 33).

## What stays out

- The local app and the project reader. A command that reads a real project through the Node.js API of ESLint and writes it in the project model is designed apart, later; a first spike read the 725 files of `packages/playground` this way. The types of `@boundaries/analysis` and `@boundaries/graph-data` are designed so that such a project fits them.
- Opening a project from a file on the website, which comes with the project reader (decision 30).
- Phones: the graph is desktop only, as the playground is, with the same notice (decision 32).

## Alternatives considered

- **The graph as a view inside the `Playground` component.** One component for two hosts and no contract between two packages, but the graph could not be used without the editor, and its library would load with the playground.
- **The type of the evaluation in `@boundaries/graph-data`, with the engine left in the playground.** Less work now, and a refactor later, when the first consumer outside the browser needs the engine.
- **A rule or an option of the ESLint plugin that collects the dependencies.** A rule sees one file at a time and ESLint only visits the files it is given, so the read may be partial.

## Acceptance

Each item is an acceptance criterion of the issue of the phase named.

- The extraction of `@boundaries/analysis` changes no behavior of the playground: its unit and e2e suites pass with no assertion changed other than the imports (phase 2). The same holds for `@boundaries/ui-kit` (phase 3).
- With no `onEvaluationChange` prop, the playground behaves as today, and replying with both forms adds under 1% to the round trip of the evaluation of `packages/playground`, as `browser-cost.md` measured it (phase 4).
- `@boundaries/graph-data` imports no React and no browser API, and runs in Node.js (phase 5).
- The Map of an analysis as big as `packages/playground`, 725 files and 2740 dependencies, is laid out by element type in under 1 s and never blocks the page; above 1000 visible edges it shows the notice of decision 31 (phase 6).
- The Map is operable with the keyboard, and every dependency that a view draws can be reached in the matrix or in the lists of the inspector (phases 6 and 7).
- The code of the graph, React Flow and the ELK worker load only when the graph is opened, not with the home page or with the playground (phase 8).
- The example that the playground opens with is drawn, a disallowed dependency of the sketch shows as one in the graph, and selecting it leads to its file in the editor (phase 8).
- `check:all` passes, and the page with the graph open passes the accessibility checks that the playground page passes (phase 8).
- A page of the docs explains the graph, and the website carries the third-party notice of `elkjs` (phase 9).
