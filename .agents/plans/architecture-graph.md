# Architecture graph plan

**Status (2026-11-22):** nothing is merged and no issue exists yet. The design is not complete: One question is open, the cost in a browser, which is a measurement. What is left of phase 1 is that measurement, a last look at the mockups with the maintainer, the split into phases and the issues. There is no RFC (decision 12): phase 1 completes the design in `architecture-graph/00-shared.md`, then files one issue per later phase in the milestone `architecture-graph`. The phases after it are written by phase 1.

## Where it lives

The plan is committed on the integration branch `feat/architecture-graph`, through an exception in `.gitignore`, and is removed before the branch merges into `release`. The `write-plan` skill says how it is shared ("Where it lives"), how a phase starts ("Starting a phase") and how it ends ("Finishing a phase").

## Files

| File | Read it when |
| --- | --- |
| `architecture-graph/00-shared.md` | Working on any phase: the design of the graph, which phase 1 completes |
| `architecture-graph/01-design-and-issues.md` | Working on phase 1: what is left to analyze, the open questions and how the issues are filed |
| `architecture-graph/engine-cut.md` | Designing or implementing `@boundaries/analysis`: where each export of the engine goes, its interface and its open questions |
| `architecture-graph/library-research.md` | Choosing or using the library of the Map: what was measured of Cytoscape.js, React Flow and Sigma |
| `architecture-graph/mockup/` | Looking at or changing the mockups: `index.html`, the four views with Cytoscape.js and Sigma, and `react-flow/`, the Map with React Flow and ELK; both read `data.json` |
| `architecture-graph/spike/` | Reading a real project again, or measuring it: the two scripts that produced the data of the mockup, and `graph-libraries/`, the benchmarks of `library-research.md` |

## Phases

| Phase | Issue | Branch | Depends on | PR target | PR title | PR |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Finish the design and file the issues | none: it creates the issues of the other phases | `feat/architecture-graph` | nothing | none: its result is the design, the milestone and the issues | none | none |

The phases after the first one come from the finished design and are added by phase 1, each with its issue.

## Integration plan

- `feat/architecture-graph` starts from `release` and merges `release`, never rebases. Each later phase is one pull request into it, and it goes into `release` at the end with one pull request. The issues of the milestone are closed by the release pull request into `master` (`.github/CONTRIBUTING.md`, "Publishing").
- The extractions that do not depend on the graph, `@boundaries/analysis` and `@boundaries/ui-kit`, go straight into `release`, each in its own pull request, as the extractions of the playground did (decision 21).
- The branching model and the release procedure are in `.github/CONTRIBUTING.md`.

## Decisions

Taken by the maintainer in the sessions of 2026-11-20 (1 to 11) and 2026-11-22 (12 to 35). They have no public link: the issues of phase 1 record the ones their readers need.

1. The graph is first drawn on the website, over the sketch that the user edits in the playground. The local app is out of this plan.
2. `@boundaries/analysis` evaluates a whole project: it takes the config as an object, the files and the dependencies, and returns the descriptions and the verdicts. It is extracted from the playground from the start, so that no later refactor is needed.
3. `@boundaries/graph-data` (name to confirm) aggregates an evaluated project into nodes and edges, by a "group by" and filters. It is pure, with no React, so that the MCP server of [RFC #513](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/513) or a CLI can use it.
4. `@boundaries/graph`, the name [RFC #374](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/374) reserved, is the React component that renders the graph, its filters and its views.
5. The MUI theme, `ThemeRoot` and the ui-kit of `packages/playground/src/ui-kit` are extracted to a shared UI package (name pending), which the playground, the graph and later the local app consume.
6. The evaluation is computed once, in the worker of the playground. The playground emits it (decision 13); the graph only aggregates, and aggregates again when a filter changes.
7. The website composes the playground and the graph. The playground stays mounted and hidden while the graph is on screen, so that the session and the worker are kept.
8. The playground gets an input to open a target (a file or a dependency), so that a selection in the graph leads back to the editor.
9. The scope of this plan is the website and the model. The project reader and its snapshot are designed apart, later, and the input type of `@boundaries/graph-data` must not prevent them.
10. The project reader is a command, not a rule or an option of the ESLint plugin, and its first version supports ESLint configs only. Later: oxlint, and projects without ESLint through a config file of our own that can ideally be imported into an ESLint or oxlint config.
11. The mockup uses real data of `packages/playground`, with invented violations marked as invented. Bigger fixtures for extreme cases come later.
12. There is no RFC. The design is consolidated in `architecture-graph/00-shared.md` on this branch once every detail is settled. Each phase then gets an issue in the milestone `architecture-graph`, on the Backlog of the project board, with the dependencies between the issues marked.
13. The playground emits complete evaluations only, through a new `onEvaluationChange` prop: `{ status: "current", analysis }`, or `{ status: "stale" }` while the evaluation on screen is behind the sketch (pending, late, stopped or failed). The graph keeps the last analysis and shows it as loading or out of date; the evaluation that the playground aligns to a newer sketch is never emitted.
14. What is emitted is the `ProjectAnalysis` of `@boundaries/analysis`, with config paths and no text range, and `@boundaries/graph-data` takes that same type. The contract of the playground imports it as a type only, and the worker replies with it beside the `Evaluation` that the panes read, which do not change. `architecture-graph/engine-cut.md`, "What the playground emits".
15. `@boundaries/analysis` exports two functions, `analyzeConfig` and `evaluateProject`, so that the playground keeps memoizing the analysis of a config by its text.
16. Each dependency of the input of `@boundaries/analysis` carries its `source` as written, required, because the origin of a module depends on it.
17. The package that evaluates a whole project is `@boundaries/analysis`, not `@boundaries/project`: the name says what it does, and `project` is a domain of the playground.
18. React Flow (`@xyflow/react`) renders the Map, with its attribution visible. `architecture-graph/library-research.md`.
19. ELK (`elkjs`) lays out the Map, in a web worker, so that a slow layout never blocks the page and can be cancelled. Its license, `EPL-2.0 OR GPL-3.0-or-later`, is accepted on three conditions: `elkjs` is a dependency and is never bundled into a published package, the layout sits behind an adapter in `@boundaries/graph` so that the engine can change, and the website carries a third-party notice that links the source of `elkjs`. `@boundaries/graph` is private at first.
20. A tracking issue sits above the issues of the phases, which are its sub-issues. It holds the summary of the design and the decisions, which outlive the plan and the branch there.
21. The extractions of `@boundaries/analysis` and of the shared UI package go straight into `release`, before the graph.
22. [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538) gets an amendment once the milestone exists: the graph is designed without an RFC, before the local app, and the amendment links the milestone.
23. `@boundaries/analysis` and `@boundaries/graph-data` are published. `@boundaries/graph` and the shared UI package are private.
24. The aggregation package keeps the name `@boundaries/graph-data`, and the shared UI package is `@boundaries/ui-kit`, the name its folder has in the playground.
25. The summaries of policies, element types, file categories and rules move to `@boundaries/analysis`, with config paths in place of text ranges.
26. The target of a dependency in the input of `@boundaries/analysis` has the kind `file`, not `node`.
27. `@boundaries/analysis` lints its own layering with the workspace plugin, unless that creates a cycle in the build graph, which the phase that creates the package checks.
28. The switch between the playground and the graph is a row of tabs that the host draws above both.
29. When the config text does not parse, the playground emits a third status with the detail of the error, so that the graph says why it draws nothing.
30. Opening a project from a file on the website is out of this plan: it comes with the project reader.
31. A graph too big for the layered layout: the Map starts collapsed by element type, a layout has a time limit and can be cancelled, and a notice suggests a higher minimum weight. The threshold comes from the measurement of the cost in a browser.
32. The graph is desktop only, as the playground is, with the same notice on a phone.
33. Accessibility: the Map is operable with the keyboard, the matrix and the lists of the inspector are a complete reading of the same data, and the graph passes the checks that the rest of the website passes. The maintainer accepts a lower bar in a part where reaching it costs too much, decided case by case.
34. The four views stay. In its first version the Map has the layered layout only, with no force layout, and Composition draws sorted bars, not pies. The maintainer took it before opening the React Flow mockup, so the look of each view is still open to what they say of the mockups.
35. The Map opens as a summary and gives the detail on demand. It starts with one circle per element type, as big as its files are many, with tests, mocks and page objects hidden, and thin translucent edges with no numbers; selecting a node dims what it does not touch, and a type expands into its elements. The maintainer found the first React Flow mockup, which drew boxes, every file and numbered routed edges, too hard to read, and preferred this look, which is the one of the first mockup.

## Open questions

All are decided by the maintainer in phase 1, which lists them with what is known about each: `architecture-graph/01-design-and-issues.md`, "Open questions".
