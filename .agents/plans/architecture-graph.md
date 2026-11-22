# Architecture graph plan

**Status (2026-11-22):** nothing is merged. The design in `00-shared.md` is complete and no question is open. The milestone [architecture-graph](https://github.com/javierbrea/eslint-plugin-boundaries/milestone/49) holds the tracking issue #685 and one issue per phase, #686 to #694, all on the Backlog and with their dependencies marked. What is left of phase 1 is the phase files. There is no RFC (decision 12): phase 1 files one issue per later phase in the milestone `architecture-graph` and writes their files.

## Where it lives

The plan is committed on the integration branch `feat/architecture-graph`, through an exception in `.gitignore`, and is removed before the branch merges into `release`. The `write-plan` skill says how it is shared ("Where it lives"), how a phase starts ("Starting a phase") and how it ends ("Finishing a phase").

## Files

| File | Read it when |
| --- | --- |
| `architecture-graph/00-shared.md` | Working on any phase: the design of the graph, which phase 1 completes |
| `architecture-graph/01-design-and-issues.md` | Working on phase 1: what is left to analyze, the open questions and how the issues are filed |
| `architecture-graph/engine-cut.md` | Designing or implementing `@boundaries/analysis`: where each export of the engine goes, its interface and its open questions |
| `architecture-graph/library-research.md` | Choosing or using the library of the Map: what was measured of Cytoscape.js, React Flow and Sigma |
| `architecture-graph/browser-cost.md` | Sizing anything by the size of a project: what the evaluation, its reply and the aggregation cost in a browser |
| `architecture-graph/mockup/` | Looking at or changing the mockups: `index.html`, the four views with Cytoscape.js and Sigma, and `react-flow/`, the Map with React Flow and ELK; both read `data.json` |
| `architecture-graph/spike/` | Reading a real project again, or measuring it: the two scripts that produced the data of the mockup, `graph-libraries/`, the benchmarks of `library-research.md`, and `browser-cost/`, the scripts of `browser-cost.md` |

## Phases

| Phase | Issue | Branch | Depends on | PR target | PR title | PR |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Finish the design and file the issues | none: it creates the issues of the other phases | `feat/architecture-graph` | nothing | none: its result is the design, the milestone and the issues | none | none |

| 2. Extract `@boundaries/analysis` | #686 | `refactor/686/analysis-package` | nothing | `release` | `refactor(analysis): extract the evaluation of a project from the playground` | none |
| 3. Extract `@boundaries/ui-kit` | #687 | `refactor/687/ui-kit-package` | nothing | `release` | `refactor(ui-kit): extract the theme and the ui-kit from the playground` | none |
| 4. The playground talks to the graph: `onEvaluationChange`, both forms in the reply of the worker, the input that opens a target | #688 | `feat/688/playground-emits-evaluation` | 2 | `release` | `feat(playground): emit the evaluation and open a target` | none |
| 5. `@boundaries/graph-data` | #690 | `feat/690/graph-data` | 2 | `feat/architecture-graph` | `feat(graph-data): aggregate an evaluated project into a graph` | none |
| 6. `@boundaries/graph`: the frame, the filters, the inspector and the Map | #691 | `feat/691/graph-map` | 3, 5 | `feat/architecture-graph` | `feat(graph): add the graph component with the Map` | none |
| 7. The Focus, Matrix and Composition views, in one pull request | #692 | `feat/692/graph-views` | 6 | `feat/architecture-graph` | `feat(graph): add the Focus, Matrix and Composition views` | none |
| 8. The graph on the website | #693 | `feat/693/website-graph` | 4, 6 | `feat/architecture-graph` | `feat(website): add the architecture graph to the playground page` | none |
| 9. Docs and closing: the guide, a screenshot of the graph in the playground section of the home page, the graph in the README, the plan removed | #694 | `docs/694/architecture-graph` | 7, 8 | `feat/architecture-graph` | `docs(website): document the architecture graph` | none |
| 10. A name for a policy (decision 39) | #689 | `feat/689/policy-name` | nothing; 7 reads the name when it exists | `release` | `feat(config): add a name to a policy` | none |

The numbers are the ones the maintainer agreed on 2026-11-22, so phase 10, added after, keeps the last number although it can run at any time. The tracking issue is #685. The phase files are added by phase 1.

## Integration plan

- `feat/architecture-graph` starts from `release` and merges `release`, never rebases. Each later phase is one pull request into it, and it goes into `release` at the end with one pull request. The issues of the milestone are closed by the release pull request into `master` (`.github/CONTRIBUTING.md`, "Publishing").
- What does not depend on the graph goes straight into `release`, each in its own pull request, as the extractions of the playground did: `@boundaries/analysis` and `@boundaries/ui-kit` (decision 21), what the playground emits and its input to open a target (decision 36), and the name of a policy.
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
22. [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538) gets an amendment once the milestone exists: the graph is designed without an RFC, before the local app, and the amendment links the milestone. Posted on 2026-11-22 as [a comment of the discussion](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538#discussioncomment-19813686).
23. `@boundaries/analysis` and `@boundaries/graph-data` are published. `@boundaries/graph` and the shared UI package are private.
24. The aggregation package keeps the name `@boundaries/graph-data`, and the shared UI package is `@boundaries/ui-kit`, the name its folder has in the playground.
25. The summaries of policies, element types, file categories and rules move to `@boundaries/analysis`, with config paths in place of text ranges.
26. The target of a dependency in the input of `@boundaries/analysis` has the kind `file`, not `node`.
27. `@boundaries/analysis` lints its own layering with the workspace plugin, unless that creates a cycle in the build graph, which the phase that creates the package checks.
28. The switch between the playground and the graph is a row of tabs that the host draws above both.
29. When the config text does not parse, the playground emits a third status with the detail of the error, so that the graph says why it draws nothing.
30. Opening a project from a file on the website is out of this plan: it comes with the project reader.
31. A graph too big for the layered layout: the Map starts collapsed by element type, a layout has a time limit and can be cancelled, and a notice suggests a higher minimum weight. The threshold is a number of visible edges, 1000 to start with (`architecture-graph/browser-cost.md`).
32. The graph is desktop only, as the playground is, with the same notice on a phone.
33. Accessibility: the Map is operable with the keyboard, the matrix and the lists of the inspector are a complete reading of the same data, and the graph passes the checks that the rest of the website passes. The maintainer accepts a lower bar in a part where reaching it costs too much, decided case by case.
34. The four views stay. In its first version the Map has the layered layout only, with no force layout, and Composition draws sorted bars, not pies. The maintainer took it before opening the React Flow mockup, so the look of each view is still open to what they say of the mockups.
35. The Map opens as a summary and gives the detail on demand. It starts with one circle per element type, as big as its files are many, with tests, mocks and page objects hidden, and thin translucent edges with no numbers; selecting a node dims what it does not touch, and a type expands into its elements. The maintainer found the first React Flow mockup, which drew boxes, every file and numbered routed edges, too hard to read, and preferred this look, which is the one of the first mockup.
36. The phases are the ones of the table above. Phase 4 goes into `release`, not into the integration branch: it changes the playground only and nothing reads what it emits until the graph does. The three views of phase 7 are one issue and one pull request.
37. The Focus, Matrix and Composition views stay as the first mockup draws them. Composition shows one breakdown at a time, behind tabs (files by type, by captured value, by category; dependencies by deciding policy), in place of all of them stacked.
38. The docs phase keeps the pitch of the home page and of the README as it is. It adds a screenshot of the graph to the playground section of the home page (`PlaygroundTeaser`), and turns the "Playground" section of the README into two bullets, one for the playground and one for the graph, with no image. A pitch around the visual analysis waits for the project reader.
39. A policy of `boundaries/dependencies` gets an optional `name`, a short string, and no `description`. The default message names it (`Denied by policy "<name>" (index N)`) and stays as it is without one; a custom `message` gets the `{{policy.name}}` variable; two policies with the same name give a warning diagnostic; `@boundaries/analysis` carries it in its policy summaries, and the playground and the graph show it in place of the position. The deprecated rules do not take it. It is phase 10, into `release`, and blocks nothing: the graph falls back to the position.

## Open questions

None.
