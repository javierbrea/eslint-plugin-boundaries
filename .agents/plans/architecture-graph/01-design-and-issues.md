# Phase 1: finish the design and file the issues

## Goal

The design of the architecture graph is complete in `00-shared.md`, with no `TODO` left and every open question below closed. The milestone `architecture-graph` holds one issue per later phase, each on the Backlog of the project board and with its dependencies marked, and this plan holds one file per phase.

## Issue and PR

- No issue and no pull request of its own: the results are the design, the milestone, the issues of the other phases, and commits on `feat/architecture-graph` that update this plan.
- There is no RFC (decision 12 of the index), which leaves out step 1 of `docs/contributing-workflow.md`. Steps 2 to 4 apply without the RFC: the issues open with their `Context` instead of a `From [RFC ...]` line, and the milestone is the feature one of "Filing the issues".
- The issues are created with the `create-issue` skill, with a preview for the maintainer before anything is published. "Filing the issues" below says what this plan adds to it.

## Read first

- The index, `../architecture-graph.md`: the decisions already taken.
- `00-shared.md`: what the design says so far, and its `TODO` marks.
- [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538), "Later, the graph" and decision 2: what was reserved for the graph and the host contract of the playground.
- `packages/playground/AGENTS.md`: the host contract, the layering and the stack that the new packages share.
- `engine-cut.md` and `packages/playground/src/domains/evaluation/helpers/engine/`: the proposed cut and the code that `@boundaries/analysis` is cut from.
- The `repo-architecture` skill: the dependency graph between packages, which four new packages change.
- The `create-issue` skill: the structure and the bookkeeping of the issues.

## Preconditions

None.

## Scope

- In: closing the open questions with the maintainer, iterating the mockup, the research notes, the cut of the engine read function by function, the design in `00-shared.md`, the milestone, the issues and their dependencies, the phase files of this plan.
- Out: any change of the code of the packages. The project reader and the snapshot, which are designed apart; this phase only keeps what the spike found about them.

## What the first session left

### Views

Every view answers an architecture question. The mockup draws the four.

| View | Question | What it draws |
| --- | --- | --- |
| Map | Which layers are there and how do they depend on each other? | Nodes by the "group by", edges as thick as their dependencies are many; teal allowed, dashed vermilion disallowed, orange in both directions |
| Focus | What does this group depend on, and what depends on it? | One node in the center, the groups that depend on it at the left, the ones it depends on at the right |
| Matrix | Where are the cycles and the coupling? | Group by group with counts; a row depends on a column |
| Composition | What is the project made of? | Files by type, captured value and category; dependencies by deciding policy; policies that decide nothing |

- Group by: element type, element, captured value (such as `domain`), file category, module origin, folder. A type expands into its elements, an element into its files.
- Filters: verdict, deciding policy, kind (value or type), syntax, relationship, externals, test files, minimum weight, path glob.
- Metrics: pairs of groups that depend on each other, fan-in and fan-out, policies that decide nothing, unclassified files.
- A selection shows the real dependencies behind a node or an edge, and leads back to the file in the playground.
- The visual language is the one RFC #538 reserved (teal allowed, dashed vermilion disallowed, the `--jsb-*` tokens), with a modern look close to the graph tools in fashion.

### The mockup

`mockup/index.html` is a page fragment that fetches `mockup/data.json`, so it is opened through a static server (such as `python3 -m http.server` in `mockup/`), not from the file system. The maintainer saw it on 2026-11-20 and liked it; no view was confirmed or dropped yet.

- It has the four views, the two placements of the switch, and the map with Cytoscape.js (layered with dagre, or force, and elements nested in their type) and with Sigma (force only).
- It was never seen rendered by the session that wrote it: only the syntax of its script was checked.
- Missing: the filters by deciding policy, relationship and path glob, the "module origin" grouping, and expanding a type into its elements with a click (it is done by changing "Group by").
- React Flow is not in it: it needs React and its stylesheet, which a single page cannot load. Comparing it needs the Vite harness of the playground or a separate build.
- Its frame, filters and inspector are plain HTML, not the MUI components of the playground.

### The React Flow mockup

`mockup/react-flow/` draws the Map with React Flow and ELK, over the same `data.json`. `node build.mjs <folder with node_modules>` writes `dist/` (git-ignored): the page with its script inlined, the ELK worker and the data. The packages are the ones of `spike/graph-libraries/package.json`.

- Its look is the one of decision 35, in its second version: the first one drew boxes, every file and numbered edges along the routes of ELK, and the maintainer found it too hard to read.
- A type is one circle, or a group with its elements when expanded. The edges are aggregated between whatever is visible and drawn as one curve from circle to circle; the routes that ELK can return are not used.
- It shows the time of each layout and the longest time the page did not respond meanwhile, and it can switch to dagre on the page thread and to synthetic projects of 600 and 5000 links to compare. A layout in the worker can be cancelled and stops after 30 s.
- Seen rendered on 2026-11-22 in headless Chromium, in both themes: 18 nodes and 65 edges were laid out in about 160 ms; with every type expanded, 137 nodes and 371 edges in about 0.5 s, with no frame of the page longer than 17 ms.
- Not liked yet: the drawing is tall and narrow, so the names are small until the user zooms, and the arrow heads are hard to see from far.
- Missing: the filters other than the minimum weight and the tests, the other "group by" values, externals, and the views other than the Map.

### The data and the spike

`spike/read-project.mjs <project folder> <output file>` reads a project and writes the raw evaluation; `spike/compact.mjs <folder with raw.json>` writes `data.json` and prints its statistics. Both need the `@boundaries` packages built. Run on `packages/playground` on 2026-11-20, on one machine with Node.js 24; the times are of the first run unless said:

- 725 files under `src`, 119 elements, 2740 dependencies (2209 local, 531 external; 1813 value, 927 type), 56 policies.
- The ESLint API (`ESLint#calculateConfigForFile`) gave the resolved config of the 725 files in 2.1 s in a first run and 1.1 s in a second one, with no loader of our own, and one boundaries config for all of them.
- Reading and resolving the imports with TypeScript took 0.9 s. Describing the files took 67 ms and describing and evaluating the dependencies 541 ms, with `describeEntity`, `describeDependency` and `evaluateDependency` of `@boundaries/policies`.
- The package has no violation: `compact.mjs` marks 19 allowed dependencies as disallowed, with `inv: 1`.
- 4 pairs of elements depend on each other, such as `src/domains/examples/data/examples` and `src/domains/project/helpers/sketch`.
- 19 of the 56 policies decide no dependency. How many of them are `disallow` policies that are expected to match nothing was not checked.

What the spike did not prove: the imports are read by TypeScript, not by the plugin, so the internal rule that collects what the plugin reads from the AST is untested, and so is a project whose flat config gives different boundaries settings to different files.

### The cut of the engine

`engine-cut.md` holds the cut read function by function on 2026-11-22, the proposed public interface of `@boundaries/analysis`, the input of `@boundaries/graph-data`, what the playground would emit and the tasks of the extraction. Decisions 13 to 17 of the index come from it; its questions are closed too.

- The engine is tied to the config text only where it turns a config path into a range, so the new package returns paths and the playground maps them to ranges. More moves than the first session expected: `normalizeConfigSafely`, the written-config readers, the diagnostic tests and the summaries.
- The contract of the playground keeps its `Sketch*` types and the new package declares the same shapes. The contract imports from it only the type of what the playground emits (decision 14).
- The extraction preserves behavior, so it goes straight into `release` (decision 21).

### The project reader, for later

- A command (such as `@boundaries/cli`) reads a real project and writes a snapshot, a JSON file in the project model, which the website opens from a file. It is the first half of the local app: the same reader, plus serving the components and reading again when files change.
- It is not a rule of the plugin because a rule sees one file at a time and has no end-of-run hook, ESLint only visits the files it is given (`--cache`, lint-staged, the editor), and rules in several threads share no memory. A partial read breaks the trace of the dependencies. The command controls the whole run: every file, no cache, one process.
- One flat config file can give different boundaries settings to different files, such as a block per package of a monorepo. The first version detects it and writes one snapshot per distinct config.
- Without the snapshot, the graph on the website only shows sketches of tens of files.

## Open questions

None. The maintainer closed them on 2026-11-22, decisions 12 to 39 of the index.

What was read in code for decision 39, which phase 10 needs: a policy has no name today, `DependenciesPolicy` (`packages/config/src/Shared/Settings.types.ts`) has selectors, `importKind` and `message`, and it is referred to by its position, "Denied by policy at index N" (`packages/policies/src/Messages/Messages.ts`). Its schema has `additionalProperties: false` (`packages/config/src/Schemas/Schemas.ts`), so a config with a `name` fails on every version released before, and adding the optional property is a MINOR of `@boundaries/config`, `@boundaries/policies` and `eslint-plugin-boundaries`.

## Filing the issues

What this plan adds to the `create-issue` skill:

- **Tracking issue** (decision 20). It is filed first, with the summary of the design and the decisions. Each phase issue is its sub-issue and links it from `Context`.
- **Milestone.** `architecture-graph`, created when the first issue is. Its description is one sentence on the feature and the tracking issue, as the one of the milestone "Playground" has.
- **One issue per later phase**, each a deliverable with its own pull request. The `Context` of each one says what its reader needs of the design, since no RFC holds it; the steps stay in the phase file, and the issue names the branch `feat/architecture-graph` as the place of the plan.
- **Project board.** Every issue goes to the Backlog.
- **Dependencies.** Each issue that cannot start before another one is marked as blocked by it with the issue dependencies of GitHub, has a `## Blocked by` section and takes the `status: blocked` label. The "Depends on" column of the phases table of the index says the same. The label comes off an issue when the pull requests of all its blockers have merged; the issues themselves stay open until the release closes them.

## Steps

1. Done on 2026-11-22: the open questions are closed.
2. Done on 2026-11-22: `00-shared.md` has no `TODO` and holds the public interface.
3. Done on 2026-11-22: the split into phases is in the phases table of the index (decision 36).
4. Done on 2026-11-22: milestone 49, the tracking issue #685, the phase issues #686 to #694 and the amendment to RFC #538.
5. Write the phase files of this plan, with the index updated: the phases table with the issues and the dependencies, the status line, the files table. Delete this file and what no later phase uses, as "Finishing a phase" of the `write-plan` skill says. The facts of "The project reader, for later" and "The data and the spike", which no phase uses, first go to the tracking issue or to an issue of their own on the Backlog, for the later design of the reader.

## Verification

- `00-shared.md` has no `TODO`.
- Every number in the design and in the issues is measured, with how it was measured, or read in code.
- Every phase after the first one has an issue in the milestone `architecture-graph` and on the Backlog of the board, and the dependencies on GitHub match the "Depends on" column.
- No issue and no plan file names a private repository or a file outside this repository.

## Hand-offs

None yet: the phases that receive them do not exist.

## Open points

None.
