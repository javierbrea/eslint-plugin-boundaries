# Shared: the design of the architecture graph

What every phase builds. Phase 1 (`01-design-and-issues.md`) completes it: a sentence marked `TODO` waits for the open question or a step of that file. No phase after the first one starts while a `TODO` is left.

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
| `@boundaries/graph-data` | Aggregates an evaluated project into nodes and edges, by a "group by" and filters, with its metrics. Pure, no React. | the types of `project` |
| `@boundaries/graph` | The React component: the views, the filters and the inspector. | `graph-data`, `ui-kit` |
| `@boundaries/ui-kit` | The MUI theme, the theme root and the domain-free components that the playground has today. | `design-tokens` |

`analysis` and `graph-data` are published; `graph` and `ui-kit` are private. The extractions of `analysis` and `ui-kit` go straight into `release`, before the graph (decisions 21, 23 and 24).

The public interface of `@boundaries/analysis` is in `engine-cut.md`, "Proposed public interface": two functions, `analyzeConfig` and `evaluateProject`, a `Project` in and a `ProjectAnalysis` out, which is also the input of `@boundaries/graph-data`. TODO: move it here once the questions of that file are closed (step 4 of `01-design-and-issues.md`).

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
- The four views stay. The Map has the layered layout only in its first version, and Composition draws sorted bars (decision 34). TODO: what the maintainer says of each view in the mockups (step 2 of `01-design-and-issues.md`).
- A graph too big for the layered layout starts collapsed by element type, its layout has a time limit and can be cancelled, and a notice suggests a higher minimum weight (decision 31). TODO: the threshold, from the measurement below.

### Rendering library

React Flow (`@xyflow/react`) renders the Map, with its attribution visible (decision 18). Its nodes are React components styled with the tokens, and it brings keyboard and ARIA support. ELK (`elkjs`) computes the layered layout in a web worker, behind an adapter, and its routes draw the edges (decision 19, which also holds the conditions of its license). `mockup/react-flow/` shows both.

### Cost in a browser

TODO: the measurement (the open question of `01-design-and-issues.md`).

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

TODO, from the model of RFC #538: quality gates of the website with the graph loaded, the chunk of the graph loaded only when it is opened, the Quick start example drawn with its violation, and a size of project that the views stay usable with. Each item becomes an acceptance criterion of the issue of the phase that delivers it.
