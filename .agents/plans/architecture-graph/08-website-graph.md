# Phase 8: the graph on the website

## Goal

The playground page of the website, `/playground/`, has a row of tabs above the playground and the graph. The graph draws what the playground evaluates, a selection in the graph opens its file or its dependency in the playground, and the code of the graph, React Flow and the ELK worker load only when the graph tab is first opened. The website carries the third-party notice of `elkjs`.

## Issue and PR

- Issue #693, a sub-issue of #685, closed by the release pull request into `master`.
- Branch `feat/693/website-graph`, from `feat/architecture-graph`. Pull request into `feat/architecture-graph`, titled `feat(website): add the architecture graph to the playground page`.
- Changelog: one `feat(#685)` entry under `## [Unreleased]` of `packages/website/CHANGELOG.md`, which covers the private packages that the website deploys. It describes the graph as a visitor gets it, in one or two sentences, as the `feat(#539)` entry of the playground does. It is the only entry of the feature in that changelog: phases 6 and 7 wrote none.
- The plan edits of "Hand-offs" are commits of this pull request.
- The pull request description shows screenshots of the page with each tab open in both themes, the list of the scripts and workers requested before and after the graph tab is opened, the accessibility results of "Verification" for both tabs, and every deviation from this file.

## Read first

- `../architecture-graph.md`: decisions 1, 6, 7, 8, 13, 19, 28, 29, 30, 32 and 33.
- `00-shared.md`, "How the playground and the graph work together" and "Accessibility".
- `packages/website/AGENTS.md`, "Playground" and "Playwright page objects", and `packages/website/src/pages/playground.tsx` with its `playground.module.css`, `playground.constants.ts` and `playground.pom.playwright.ts`: the host this phase changes, with its lazy chunk, `BrowserOnly`, the narrow-screen note and the loading box.
- `packages/website/eslint.config.mjs`: the rule that keeps `@boundaries/playground` out of static imports, the element types of `src/`, and the modules that only Playwright files import.
- `packages/website/project.json` and `test/website-e2e/project.json`: the targets that name the `playground` project.
- `packages/playground/AGENTS.md`, "Host contract", as phase 4 left it: the `onEvaluationChange` prop and the input that opens a target.
- `packages/graph/AGENTS.md` and `README.md`: the props of the component, the files a host serves and how the React Flow stylesheet is loaded.
- `test/website-e2e/README.md` and `AGENTS.md`, `test/website-e2e/test/playground-chunk.spec.ts`, and `script-responses.ts` and `started-workers.ts` under `test/website-e2e/test/support/`: how a spec proves that a chunk is or is not requested and which workers a page starts.
- `.agents/rules/playwright-testing.md`, `docs-authoring.md` and `changelog-and-versioning.md`.

## Preconditions

- #688 is merged into `release`, and `release` is merged into `feat/architecture-graph`.
- #691 is merged into `feat/architecture-graph`. #692 is not a precondition: the page shows the views that the graph has.
- The `status: blocked` label is off #693.

## Scope

In:

- The tabs, the composition of both components and the wiring between them, in `packages/website`.
- The lazy load of the graph, and the build and lint configuration that keeps it lazy.
- The third-party notice of `elkjs`.
- The browser specs, the page objects of the page, and the docs of the e2e suite.
- The agent docs that the new dependency changes.

Out:

- The docs page of the graph, the screenshot of the home page and the README: phase 9. Until then the graph gets no guide URL.
- Opening a project from a file (decision 30) and a phone layout (decision 32).
- Any change inside `packages/playground` or `packages/graph` beyond a defect that this phase finds, fixed in this pull request and said in its description.

## Steps

Every change goes through the `implement-change` skill. A new dependency between packages makes the change "architectural and new" there.

### The dependency and the build

- `packages/website/package.json` gets `@boundaries/graph` with `workspace:*`. `@xyflow/react` and `elkjs` come through it; the website adds neither.
- In `packages/website/project.json`, the `build`, `check:types` and `start` targets depend on the build of `graph` beside the one of `playground`, and `lint`, `check:types` and `build:playwright` on its `build:playwright`. The `build` inputs keep leaving the Playwright files out.
- In `packages/website/eslint.config.mjs`, `@boundaries/graph` joins the paths that no file under `src/` imports statically, types aside, and `@boundaries/graph/playwright` joins the modules that only Playwright files import. The `build:playwright` script of `packages/website/package.json` allows that entry in `scripts/check-bundle-imports.js`.

### The page

- The host draws a row of tabs above both components, "Playground" and "Graph", with the roles and the keyboard behavior of a tab list, styled with the site's own tokens and CSS modules. A new component is classified in `eslint.config.mjs` before it is used.
- The playground stays mounted and hidden while the graph is on screen, so that its session and its worker are kept (decision 7). Coming back shows it as it was: the open file, the panes, the scroll.
- The graph is a second `React.lazy` chunk, with the stylesheet that `packages/graph/README.md` asks the host to load. It is requested when the graph tab is first opened, never on load, and stays mounted after.
- The host keeps the last value that `onEvaluationChange` emits and passes it to the graph. When the graph asks to open a file or a dependency, the host shows the playground tab and gives the target to the input of the playground.
- The page keeps what it has today: the hidden heading, the loading box of the server render, and the `key` that mounts the playground again on a visit that the router makes.
- On a narrow screen nothing changes: the note shows, and neither chunk is requested (decision 32).

### The notice

- The website names `elkjs` and its license (`EPL-2.0 OR GPL-3.0-or-later`) and links its source, the repository that its `package.json` names (decision 19).
- It goes in `packages/website/docs/misc/acknowledgments.mdx`, under "Technical Foundation", and in the same file of the snapshot of the latest release, the first entry of `packages/website/versions.json`, because the graph is deployed with the site (`packages/website/AGENTS.md`, "Playground").

### The browser specs

- The page object of the page, `playground.pom.playwright.ts`, gets the tabs and the graph, the graph as a child built from the page object that `@boundaries/graph/playwright` exports, as it builds `PlaygroundPom` today. `test/website-e2e` keeps importing only the two entries it imports now.
- `test/website-e2e/project.json` adds `graph` to the projects whose `build:playwright` its targets wait for.
- New specs, tagged `@desktop`, each with a control where it checks that something does not happen:
  - The switch: the graph tab shows the graph of the example that the playground opens with, and the playground tab shows the playground as it was left.
  - A disallowed dependency of a sketch shows as disallowed in the graph, and selecting it in the inspector shows the playground tab with its file open.
  - A stale analysis: while the evaluation is behind the sketch, the graph keeps its last drawing and says that it is out of date, and it becomes current again.
  - The chunk: `/` and `/playground/` before the graph tab is opened request no script that holds the marker of the graph and start no layout worker; opening the tab requests it. The narrow project requests neither chunk.
  - The keyboard on the Map, for what phase 6 could not cover in jsdom.
- `test/website-e2e/README.md` gets the rows of the new specs, and `test/website-e2e/AGENTS.md` the marker of the graph chunk.

### The agent docs

- `packages/website/AGENTS.md`, "Playground": the graph as a second lazy entry and what keeps it lazy.
- The `repo-architecture` skill: `website build → graph build`, and the `build:playwright` chain.

## Verification

- `pnpm nx run-many -t check:all --all`, which runs `website-e2e`, and `pnpm lint` and `pnpm check:spell` at the root.

Each acceptance criterion of #693:

| Criterion | Check |
| --- | --- |
| The example that the playground opens with is drawn, a disallowed dependency shows as one, and selecting it leads to its file in the editor | The first two specs above |
| No code of the graph loads with the home page or before the graph tab is opened | The chunk spec, with its control |
| The page with the graph open passes the accessibility checks that the playground page passes | See "Open points": the same tools, run on the built site with the playground tab open and with the graph tab open, in both themes, with no new finding in the second |
| The e2e suite covers the switch, a selection that opens a file, and a stale analysis | The first three specs above, listed in the README of the suite |
| `check:all` passes | The command above |

Also checked:

- `pnpm nx build website` logs no warning about the worker of the graph, and the built site serves its script.
- With the graph tab open, an edit made after coming back to the playground reaches the graph on the next switch without a reload.
- The `pageErrors` fixture stays clean with the graph open: no console error from React Flow or the worker.

## Hand-offs

- To phase 9 (`09-docs-and-closing.md`): the names of the tabs, where the host passes the guide URL to the graph, the place of the third-party notice to link from the docs page, the page objects of the page that a screenshot script can drive, and what the docs say about how the graph follows the playground (when it updates, what "out of date" means, what a selection opens).
- To phase 9, for `packages/website/AGENTS.md` and the tracking issue: any limit found while composing both, such as what the playground loses or keeps while hidden.

## Open points

- **The accessibility checks.** The repository has no automated accessibility check: no axe, Lighthouse or lint plugin for it is installed. Default: run axe and Lighthouse by hand on the served production build, on `/playground/` with each tab open and in both themes, record the versions and the results in the pull request description, and tell the maintainer each finding that the graph adds (decision 33).
- **How the playground is hidden.** Its panes and its editor measure their container. Default: the `hidden` attribute on its stage; check that the panes, the editor and the tree come back with the right sizes, and switch to hiding it off screen with `inert` and `aria-hidden` when they do not.
- **Whether the open tab is in the URL.** The hash belongs to the `HashStore` of the playground. Default: the tab is page state only, and a load always opens the playground tab.
- **How a spec makes the analysis stale.** The evaluation of an example takes milliseconds. Default: a sketch whose config has a pattern that repeats `**/` over a deep path, which the playground guide documents as slow, so that the evaluation is late for long enough to read the status; if that is not deterministic, ask the maintainer rather than add a wait.
- **Which sketch has a disallowed dependency.** Default: the example that the playground opens with, when its verdicts include one (`packages/playground/src/domains/examples/data/examples/`), or another example picked in the spec.
- **A visit that mounts the playground again.** The `key` of `useLocation` in `playground.tsx` mounts a new playground when the router visits the page while it is open. Default: the graph stays mounted, the page goes back to the playground tab, and the graph draws the next evaluation that arrives.
- **The text of the page.** Its title, its description and its narrow-screen note name only the playground. Default: leave them, and ask the maintainer in the preview whether the description names the graph.
- **Where the tabs component lives.** Default: an element of `src/components/site/`, with its page object beside it, unless the design step places it in the page.
- **The bundler and the ELK worker.** The website bundles the worker of the playground from a `new URL` expression; whether it does the same for the script of the graph was not tried. Default: follow what `packages/graph/README.md` says, and fix it in `packages/graph` when the site cannot find the script.
- **The wording of the notice.** Default: one short paragraph, shown to the maintainer in the preview of the pull request, since it is a license statement.
