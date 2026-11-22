# Phase 6: `@boundaries/graph`, the frame and the Map

## Goal

A new private package, `packages/graph` (`@boundaries/graph`, Nx project `graph`), exports one React component that takes what the playground emits and draws it. It has the frame that every view shares (the switch of views, the "group by", the filters, the status of the analysis, the metrics and an inspector), and the first view, the Map, drawn with React Flow and laid out by ELK in a web worker. No host renders it yet: it runs in its own harness.

## Issue and PR

- Issue #691, a sub-issue of #685, closed by the release pull request into `master`.
- Branch `feat/691/graph-map`, from `feat/architecture-graph`. Pull request into `feat/architecture-graph`, titled `feat(graph): add the graph component with the Map`.
- Changelog: no entry. The package is private, no deployed code imports it until phase 8, and a feature that is not released yet adds no entry (`.agents/rules/changelog-and-versioning.md`). Phase 8 writes the entry of the website.
- The plan edits of "Hand-offs" are commits of this pull request.
- The pull request description shows screenshots of the Map in both themes (collapsed, one type expanded, a node selected, the notice), the layout timings of "Verification" with how they were measured, the value chosen for the threshold with the measurement behind it, the keyboard checklist, and every deviation from this file.

## Read first

- `../architecture-graph.md`: decisions 4, 6, 13, 14, 18, 19, 23, 29, 31 to 35 and 39.
- `00-shared.md`: "How the playground and the graph work together", "Views", "Rendering library", "Cost in a browser" and "Accessibility".
- `library-research.md`: what React Flow brings (keyboard, ARIA, tokens through CSS) and what it does not (expand and collapse, layout), its bundle size and its DOM cost per edge.
- `browser-cost.md`: the edge counts of `packages/playground` by type and by element, and the layout times known so far.
- `mockup/react-flow/src/main.jsx` and `mockup/react-flow/src/template.html`: the model of the Map. `00-shared.md`, "Mockups", says what the maintainer liked and what is still not liked.
- `packages/graph-data/src/index.ts` and its `README.md`, which phase 5 creates: the aggregation the component calls.
- `packages/ui-kit/`, which phase 3 creates, and its `AGENTS.md`: the theme, the theme root and the components to build the frame with.
- `packages/playground/AGENTS.md`: "Host contract", "Layering", "Stack" and "Harness" are the model of this package. Its `eslint.config.mjs`, `package.json`, `project.json`, `tsup.config.js`, `tsup.playwright.config.js`, `jest.config.cjs`, `jest.setup.cjs` and `dev/` are the files to copy from.
- `packages/playground/src/domains/evaluation/helpers/evaluator/spawnWorker.ts` and its TSDoc: how a package creates a worker that the bundler of each host finds.
- `.agents/rules/playground-components.md`, `playground-testing.md`, `playwright-testing.md`, `typescript-conventions.md`, `unit-testing.md` and `nx-project-config.md`.

## Preconditions

- #687 and #690 are merged, the first into `release` and from there into `feat/architecture-graph`, the second into `feat/architecture-graph`. `packages/ui-kit` and `packages/graph-data` exist on the branch.
- The `status: blocked` label is off #691.
- #688 is not a precondition. When it is merged, read the type that `onEvaluationChange` emits in `packages/playground/src/contract/`; "Open points" says what to do when it is not.

## Scope

In:

- The package, its harness, its unit tests, its jsdom and Playwright page objects, its `README.md` and `AGENTS.md`.
- The frame, built for four views with the Map as the only one registered.
- The Map, the layout adapter, the ELK worker, the time limit, the cancel and the notice of decision 31.
- The agent docs and lists of the repository that a second React package changes.

Out:

- The Focus, Matrix and Composition views: phase 7.
- Any change to `packages/website` and the browser specs: phase 8.
- A force layout (decision 34), a phone layout (decision 32) and opening a project from a file (decision 30).
- The dagre engine, the synthetic projects and the timing read-outs of the mockup.

## Steps

Every change goes through the `implement-change` skill. The package, its entries and its dependencies make the change "architectural and new" there: the `architect` and the `skeptic` design the layering, the props and the layout adapter, and the maintainer approves them before any code.

### The package

- Create `packages/graph` after `packages/playground`: a library build with tsup that keeps dependencies and peers as imports, `private: true`, the peers and their exact devDependency versions as "Stack" of `packages/playground/AGENTS.md` gives them, `@boundaries/graph-data` and `@boundaries/ui-kit` with `workspace:*`, and the types of `@boundaries/analysis`.
- Add `@xyflow/react` 13.0.2 and `elkjs` 0.12.1 at exact versions. `elkjs` stays an import in `dist`: no code of it is copied into the build (decision 19).
- Entries: the component, and a `./playwright` entry with the Playwright page objects, built by `build:playwright` and checked by `scripts/check-bundle-imports.js` and `check:pom-parity`, as in the playground.
- `eslint.config.mjs` classifies every source file and enforces the layering with the workspace plugin. The layers are those of the playground unless the design says otherwise. It also holds: no import from a host; `@xyflow/react` only in the elements of the Map; `elkjs` only in the layout adapter and its worker script; `@boundaries/analysis` as types only.
- A Vite harness in `dev/`, started by `pnpm nx dev graph`, after `packages/playground/dev/`: the tokens and fonts of `@boundaries/design-tokens`, a theme toggle, and a choice of analyses that covers a sketch-sized one, one of the size of `packages/playground`, a stale one and an invalid config.

### The host contract

- The component takes the emitted evaluation as a prop: `{ status: "current", analysis }`, `{ status: "stale" }`, or the status of a config that does not parse (decisions 13 and 29). The package declares this type itself, over the types of `@boundaries/analysis`, and never imports the playground: TypeScript checks that both match where the host of phase 8 passes one to the other.
- It takes a callback that receives the file or the dependency that a selection asks to open, as a path or a `DependencyRef` of `@boundaries/analysis`.
- It takes an optional URL of its guide, as `guideUrl` of `packages/playground/src/contract/Props.types.ts`, and links to it from the frame; without it, there is no link. Phase 9 writes the guide and passes the URL.
- It fills its container, follows the `data-theme` of the host and reads the `--jsb-*` tokens, under the same limits as the playground: no global style of its own, no `localStorage`, `window` and `document` only in effects and handlers.
- It keeps the last analysis. With `stale` it keeps drawing it, marked as out of date; before the first one it shows that it is loading; with an invalid config it says why it draws nothing.

### The frame

- The switch of views is drawn from a list of registered views, so that phase 7 adds three entries and no frame code.
- The "group by" and every filter of `00-shared.md` ("Views") are controls of the frame, and their state is the options of `@boundaries/graph-data`. A change aggregates again and never asks for an evaluation.
- The metrics of the aggregation are on screen at all times.
- The inspector lists the dependencies behind the selected node or edge, each with its verdict and its deciding policy, shown by its name when it has one and by its position when it has none (decision 39). Activating a row calls the callback of the host. The list is complete, so that it is the keyboard and screen reader reading of what the Map draws (decision 33).
- The frame and the inspector are `@boundaries/ui-kit` and MUI components, not the plain HTML of the mockups.

### The Map

- It opens as decision 35 says: one circle per element type, as big as its files are many, test files hidden, thin translucent edges with no numbers. `getSize`, `CircleNode`, `OpenType`, `DirectEdge` and `focusFlow` of the mockup are the model: each edge is one curve from circle to circle, not the route that ELK returns.
- Selecting a node dims what it does not touch. A type expands into its elements and collapses again, through a button inside the node with an accessible name.
- Each node and edge has an accessible label that says what it is and its counts, as the `ariaLabel` values of the mockup do.
- The React Flow attribution stays visible (decision 18): no option hides it.
- Colors come from the theme of `@boundaries/ui-kit` and the tokens only: teal allowed, dashed vermilion disallowed, orange for both directions, in both themes.

### The layout

- An adapter in a `helper` element is the only code that knows the engine: it takes the visible nodes with their sizes and the edges, and returns positions and a way to stop. `layoutWithElk` of the mockup holds the ELK options to start from.
- ELK runs in a web worker that the package creates as `spawnWorker` does, so that the bundler of each host finds its script. A new layout stops the one in flight.
- A layout has a time limit, after which it stops and the Map says so, and a control cancels it while it runs. The previous drawing stays on screen meanwhile.
- Above the threshold of visible edges the Map shows a notice that suggests a higher minimum weight (decision 31). The threshold starts at 1000 and is a constant of the package. Measure the layout between 600 and 5000 edges, which `browser-cost.md` leaves unmeasured, and set the value from it.

### The repository

- `packages/graph/AGENTS.md` (host contract, layering, stack, harness) and `README.md` (usage for a host), under `.agents/rules/agents-md.md`.
- The `paths` of the rules `playground-components`, `playground-testing`, `typescript-conventions` and the placement table of `unit-testing` cover `packages/graph`, with their text reworded where it names only the playground.
- The root `AGENTS.md` overview and the `repo-architecture` skill (component map, `graph → graph-data, ui-kit`).
- `scripts/check-changelogs.js`: `packages/graph/` joins the paths of the website changelog, and its `README.md`, `dev/` and Playwright entry join the unpublished files, as those of the playground.

## Verification

- `pnpm nx run-many -t check:all --all`, and `pnpm lint` and `pnpm check:spell` at the root.

Each acceptance criterion of #691:

| Criterion | Check |
| --- | --- |
| The Map of an analysis as big as `packages/playground` (725 files, 2740 dependencies), by element type, is laid out in under 1 s and the page keeps responding | In the harness, in Chromium, median of at least 5 runs of the time from the request to the positions, and the longest gap between two frames meanwhile, measured as `useFreezeMeter` of the mockup does; the gap stays near one frame. Both numbers go in the pull request description |
| Keyboard: move between nodes and edges, select, expand, clear | A spec per action where jsdom can run it, and the checklist run by hand in the harness in both themes: Tab reaches every node and edge, Enter selects, the button of a type expands and collapses it, Escape clears |
| Both themes from the design tokens, no color of its own | No color literal under `packages/graph/src`, with the command below the table, and the screenshots of both themes |
| Unit tests and `check:all` | The command above, with coverage at 100% outside barrels, page objects, mocks and test support, as in the playground |

The color check, which finds nothing:

```bash
git grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(" -- packages/graph/src
```

Also checked:

- The built `packages/graph/dist` imports `elkjs` and `@xyflow/react` by name and holds no copy of either.
- Above the threshold the notice shows, and below it does not, in a spec with a control.
- A layout that passes the time limit stops, and one that is cancelled stops, each in a spec with a fake engine behind the adapter.
- With `stale` the last drawing stays and is marked; with an invalid config the reason shows; a filter change calls no layout when the visible graph does not change.

## Hand-offs

- To phase 7 (`07-graph-views.md`): how a view is registered, what it receives (the aggregated graph, the options, the selection and how to set it), the elements of the frame it reuses, and the helper that turns a policy into its label.
- To phase 8 (`08-website-graph.md`): the name of the component and its props, the files of the build that a host has to serve (the worker script) and how a host finds them, how the React Flow stylesheet reaches the page, the page objects that `@boundaries/graph/playwright` exports, and a string that only the chunk of the graph holds, for the spec that proves it loads lazily.
- To phase 9 (`09-docs-and-closing.md`): the names on screen of the views, the "group by" values, the filters and the statuses, which the docs page uses.
- To `00-shared.md`: the final threshold of visible edges and the time limit of a layout, since phases 8 and 9 quote them.

## Open points

- **The name of the component and of its props.** Default: `Graph`, as `Playground` in its package, with the names the design step gives the props.
- **The third status when #688 is not merged.** Default: `{ status: "invalid"; problems }`, each problem with a title and a detail as text, after the sketch of `engine-cut.md` ("What the playground emits"), and a hand-off to phase 8 to match it with what the playground emits.
- **The page object base.** It lives in `packages/playground/src/shared/testing/pom` today, and this package cannot import the playground. Phase 3 decides whether the base, `renderInRoot` and `emittedStyle` move to `@boundaries/ui-kit` and through which entries: read `packages/ui-kit/AGENTS.md` and its `package.json`. Default when they are still in the playground: ask the maintainer before starting, and propose moving them to `@boundaries/ui-kit` in a pull request into `release` of its own.
- **The React Flow stylesheet.** The playground exports no CSS file and adds no global style, and React Flow ships `dist/style.css`. Default: the host imports the stylesheet inside the chunk that loads the graph, the README says so as part of the host contract, and the harness does the same.
- **The script of the ELK worker.** `elkjs` ships it as `elkjs/lib/elk-worker.min.js`, used with `elkjs/lib/elk-api.js` on the page. Default: a `*.worker.ts` file of the adapter element that imports it, built as a separate entry as `evaluation.worker` is in `packages/playground/tsup.config.js`, with `elkjs` external. Check it in the harness and with the bundler of the website before settling.
- **The time limit of a layout.** Default: the 30 s of the mockup, lowered if the measurement between 600 and 5000 edges supports it.
- **What jsdom can test of the Map.** Whether React Flow renders nodes and handles keys in jsdom was not tried. Default: try it with the `ResizeObserver` support that the playground has in `src/shared/testing/resizeObserver`; what cannot run there is covered by a browser spec in phase 8 and listed in the hand-off.
- **The analysis of the size of `packages/playground` for the harness.** `spike/read-project.mjs` reads the package but writes the shape of the mockup. Default: a script under `packages/graph/dev/` that reads it and calls `@boundaries/analysis`, generating the fixture on demand, with nothing of the plan referenced.
- **The categories hidden as test files.** Default: a constant list of category names in the package, starting with `test`, `mock`, `pom`, `playwright` and `playwright-entry` as the mockup has, which the frame lets the user turn off.
- **What is still not liked of the mockup.** The drawing is tall and narrow, and the arrow heads are hard to see from far. Default: try the ELK direction and spacing options and a larger marker, and show the result to the maintainer in the pull request.
