# Phase 1: finish the analysis and publish the RFC

## Goal

The RFC of the architecture graph is published in the "RFCs" category of the discussions, its tracking issue exists, and this plan holds one file per phase that the RFC produces. Every open question below is closed or written in the RFC as an open question.

## Issue and PR

- No issue and no pull request: the results are the RFC, the tracking issue with its sub-issues, and commits on `feat/architecture-graph` that update this plan.
- The RFC follows `docs/contributing-workflow.md`, step 1, and the `writing-style` skill. Its draft is `rfc-draft.md`. [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538) is the model for its sections and its level of detail.
- The issues are created with the `create-issue` skill, with a preview for the maintainer before anything is published.
- The images of the RFC live on an orphan branch, as `rfc/538-playground-assets` does for RFC #538.

## Read first

- The index, `../architecture-graph.md`: the decisions already taken.
- `rfc-draft.md`: what the RFC says so far.
- RFC #538, "Later, the graph" and decision 2: what was reserved for the graph and the host contract of the playground.
- [RFC #374](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/374): the package names it reserved. It was not read in the first session.
- `packages/playground/AGENTS.md`: the host contract, the layering and the stack that the new packages share.
- `packages/playground/src/domains/evaluation/helpers/engine/`: the code that `@boundaries/project` is cut from.
- The `repo-architecture` skill: the dependency graph between packages, which four new packages change.

## Preconditions

None.

## Scope

- In: closing the open questions with the maintainer, iterating the mockup, the research notes, the cut of the engine read function by function, the RFC, the tracking issue and its sub-issues, the phase files of this plan.
- Out: any change of the code of the packages. The project reader and the snapshot, which get their own RFC; this phase only keeps what the spike found about them.

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

`packages/playground/src/domains/evaluation/helpers/engine` holds two halves. The cut was read from file names and imports, not function by function.

| Half | Files | Goes to |
| --- | --- | --- |
| Project | `describeFiles`, `descriptions`, `dependencies`, `rootPath`, `policies`, `selectorNames`, the read node kinds of `dependencyNodes`, the rule selection of `evaluatedRule` | `@boundaries/project` |
| Text | `parseConfig`, `locations`, `tokenizeConfig`, `diagnostics`, `writtenConfig`, `summaries`, `normalizeConfigSafely`, the ranges of `evaluatedRule` | stays in the playground |

- The project model (the `Sketch` of `src/contract/Sketch.types.ts` without the config text) moves to the new package, and the contract of the playground uses it.
- The rule selection is tied to the positions in the config text and has to be split.
- `AGENTS.md` of the playground says that the engine is the only production code that imports `@boundaries/*` and that it loads in the worker only. The extraction has to keep both.

### The project reader, for the later RFC

- A command (such as `@boundaries/cli`) reads a real project and writes a snapshot, a JSON file in the project model, which the website opens from a file. It is the first half of the local app: the same reader, plus serving the components and reading again when files change.
- It is not a rule of the plugin because a rule sees one file at a time and has no end-of-run hook, ESLint only visits the files it is given (`--cache`, lint-staged, the editor), and rules in several threads share no memory. A partial read breaks the trace of the dependencies. The command controls the whole run: every file, no cache, one process.
- One flat config file can give different boundaries settings to different files, such as a block per package of a monorepo. The first version detects it and writes one snapshot per distinct config.
- Without the snapshot, the graph on the website only shows sketches of tens of files.

## Open questions

Each is decided by the maintainer. The default is what the first session recommended.

1. **Where is the switch between the playground and the graph?** Tabs that the host draws above both (no slot, no second bar, about 36 px of height), or a slot at the right of "Share" in the top bar of the playground with a twin bar in the graph. The mockup has both. Default: host tabs.
2. **Which library renders the map?** Cytoscape.js (compound nodes, layered and force layouts; canvas, so theming and accessibility cost more), React Flow with ELK (DOM nodes with MUI; layout apart, slower with thousands of nodes), Sigma with graphology (WebGL, scales; no native groups). These facts come from memory: size, theming with the `--jsb-*` tokens, accessibility and the license are measured in a research note before the RFC names one.
3. **Which views and options stay?** The four views, pies against sorted bars or a treemap in Composition, layered against force layouts (force gives a different drawing each time unless the seed or the positions are kept).
4. **What does the `onChange` of the playground emit, exactly?** The type lives in `@boundaries/project` and `@boundaries/graph-data` reads it. To settle: its shape, how the status travels, and whether the graph also needs the summaries that stay in the playground (element types, categories, policies with their text).
5. **Does the extraction of `@boundaries/project` go straight into `release`, before the graph?** Default: yes, as the extractions of `@boundaries/config` and `@boundaries/policies` did, and the same for the shared UI package.
6. **Which names?** `@boundaries/project`, `@boundaries/graph-data` (against `graph-engine`) and the shared UI package. Check them against RFC #374.
7. **Are the new packages published or private?** `@boundaries/playground` is private. An MCP server or a CLI needs `project` and `graph-data` published; `graph` and the shared UI package may stay private at first.
8. **How long do the evaluation in the worker and the aggregation take on a big project, in a browser?** The spike measured Node.js only. The mockup shows the time of each aggregation under the filters; nobody wrote it down.
9. **Does the RFC include opening a project from a file on the website?** Decision 9 leaves the snapshot out, and the website then shows small sketches only. The RFC says so, or brings forward the "open a file" half.
10. **How does the graph look on a phone?** The playground is desktop only (RFC #538, decision 7).
11. **Which accessibility does the graph promise?** A canvas has no accessible tree; the matrix and the lists of the inspector may be the accessible reading of the same data.

## Steps

1. Close the open questions with the maintainer, in Spanish and with a table of what each option produces. Record each answer as a decision in the index.
2. Iterate the mockup with the maintainer until the views, the filters and the placement of the switch are agreed. Add what "The mockup" lists as missing when a decision depends on it.
3. Write the research notes: the library (question 2) and the cost in a browser (question 8). They are posted on the tracking issue once it exists, as the research notes of #539 were.
4. Read the engine function by function and write the public interface of `@boundaries/project` and the input type of `@boundaries/graph-data` into the draft.
5. Complete `rfc-draft.md`, render the images of the mockup in both themes, show the maintainer a preview and publish the RFC.
6. When the RFC is accepted, create the tracking issue and its sub-issues, and write the phase files of this plan with the index updated. Delete this file, `rfc-draft.md` and what no later phase uses, as "Finishing a phase" of the `write-plan` skill says.

## Verification

- Every open question has a decision in the index or is an open question of the RFC.
- Every number in the RFC is measured, with how it was measured, or read in code.
- The RFC names no private repository and no file outside this repository.

## Hand-offs

None yet: the phases that receive them do not exist.

## Open points

- The maintainer may want the RFC published before the mockup is final. Default: publish with the mockup as it is and say what is still open.
