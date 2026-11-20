# RFC draft: the architecture graph

Draft of the body of the RFC, to complete in phase 1 (`01-rfc.md`). A sentence marked `TODO` waits for an open question of that file.

---

**Status:** 🟡 Draft

## Summary

A view of a project as its boundaries config sees it: its element types, its elements and the dependencies between them, allowed or disallowed, instead of one node per file. It is first drawn on the website, over the sketch of the playground, and it is built so that a later local tool draws a real project with the same components.

## Motivation

- A boundaries config describes an architecture, but today the only way to see it is to read the config. The playground of [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538) shows one file and one dependency at a time.
- Import-graph tools draw one node per file, which is unreadable for a project of any size and knows nothing of element types, captured values or policies.
- RFC #538 reserved this view ("Later, the graph") and its visual language, and left its design to an RFC of its own.

The view is a tool to analyze an architecture, so each of its parts answers a question: which layers exist and how they depend on each other, what a given element depends on and what depends on it, where the cycles and the coupling are, what the project is made of, and which policies decide what.

## Proposal

### Packages

| Package | Role | Depends on |
| --- | --- | --- |
| `@boundaries/project` | Evaluates a whole project: the config as an object, the files and the dependencies in, the description of each file and the verdict of each dependency out. Extracted from the engine of the playground. | `config`, `policies`, `elements` |
| `@boundaries/graph-data` | Aggregates an evaluated project into nodes and edges, by a "group by" and filters, with its metrics. Pure, no React. | the types of `project` |
| `@boundaries/graph` | The React component: the views, the filters and the inspector. | `graph-data`, the shared UI package |
| Shared UI package (TODO: name) | The MUI theme, the theme root and the domain-free components that the playground has today. | `design-tokens` |

TODO: names (question 6), which ones are published (question 7), and the order of the extractions (question 5).

### How the playground and the graph work together

- The playground evaluates the sketch once, in its worker, and emits the evaluation with its status through an `onChange`. The graph aggregates it, and aggregates again when a filter changes, without evaluating.
- The host composes both. On the website, the playground stays mounted and hidden while the graph is on screen, so that the session and the worker are kept.
- The playground gets an input to open a file or a dependency, so that a selection in the graph leads back to the editor.
- TODO: the exact type that the `onChange` emits (question 4) and where the switch is (question 1).

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
- TODO: the views and options that stay after the mockup is iterated (question 3), with its images.

### Rendering library

TODO: the research note (question 2).

## What stays out

- The local app and the project reader. A command that reads a real project through the Node.js API of ESLint and writes it in the project model gets its own RFC; a first spike read the 725 files of `packages/playground` this way. The types of `@boundaries/project` and `@boundaries/graph-data` are designed so that such a project fits them.
- TODO: opening a project from a file on the website (question 9), phones (question 10).

## Alternatives considered

- **The graph as a view inside the `Playground` component.** One component for two hosts and no contract between two packages, but the graph could not be used without the editor, and its library would load with the playground.
- **The type of the evaluation in `@boundaries/graph-data`, with the engine left in the playground.** Less work now, and a refactor later, when the first consumer outside the browser needs the engine.
- **A rule or an option of the ESLint plugin that collects the dependencies.** A rule sees one file at a time and ESLint only visits the files it is given, so the read may be partial.

## Open questions

TODO: the questions of `01-rfc.md` that are still open when the RFC is published.

## Acceptance

TODO, from the model of RFC #538: quality gates of the website with the graph loaded, the chunk of the graph loaded only when it is opened, the Quick start example drawn with its violation, and a size of project that the views stay usable with.
