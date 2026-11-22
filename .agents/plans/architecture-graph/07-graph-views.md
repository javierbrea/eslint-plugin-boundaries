# Phase 7: the Focus, Matrix and Composition views

## Goal

`@boundaries/graph` has its four views. Focus shows one group with what depends on it and what it depends on, Matrix shows group by group with counts, and Composition shows what the project is made of, one breakdown at a time. The three follow the "group by" and the filters of the frame, fill the inspector on a selection, and are added in one pull request (decision 36).

## Issue and PR

- Issue #692, a sub-issue of #685, closed by the release pull request into `master`.
- Branch `feat/692/graph-views`, from `feat/architecture-graph`. Pull request into `feat/architecture-graph`, titled `feat(graph): add the Focus, Matrix and Composition views`.
- Changelog: no entry. The package is private and the feature is not released yet, so the entry of the website, which phase 8 writes, describes it as it is released (`.agents/rules/changelog-and-versioning.md`).
- The plan edits of "Hand-offs" are commits of this pull request.
- The pull request description shows a screenshot of each view in both themes, the keyboard checklist of "Verification", and every deviation from this file.

## Read first

- `../architecture-graph.md`: decisions 33, 34, 36, 37 and 39.
- `00-shared.md`, "Views" and "Accessibility".
- `mockup/index.html`: `renderFocus`, `renderMatrix`, `renderComp` and `renderInspector` are the reference of the three views, which stay as it draws them (decision 37). It is opened through a static server in `mockup/`, since it fetches `data.json`.
- `packages/graph/AGENTS.md` and the frame as phase 6 merged it: how a view is registered and what it receives.
- `packages/graph-data/src/index.ts` and its `README.md`: the edges, the metrics and the breakdowns the views read.
- `.agents/rules/playground-components.md`, `playground-testing.md` and `playwright-testing.md`, as far as phase 6 extended them to `packages/graph`.
- Issue #689 and, when it is merged, the policy summary type of `@boundaries/analysis`: where the name of a policy comes from.

## Preconditions

- #691 is merged into `feat/architecture-graph`, and the `status: blocked` label is off #692.
- #689 is not a precondition (decision 39): without it, a policy is shown by its position.

## Scope

In:

- The three views, registered in the switch of the frame, with their specs and page objects, jsdom and Playwright.
- What the views need of the frame that phase 6 did not build, such as the choice of the group in focus.
- A change of `@boundaries/graph-data` only when a view needs a count that it does not return; it then follows `packages/graph-data/AGENTS.md`, keeps its unit and mutation thresholds, and adds no changelog entry beyond the first-version one.

Out:

- The Map, the layout and the notice of decision 31: phase 6.
- The website: phase 8. The docs: phase 9.
- Pies and donuts (decision 34), and the "Violations by element type" card of the mockup, which is not one of the breakdowns of decision 37.

Not carried over from `mockup/index.html`:

- Its plain HTML frame, filters and inspector, and its strings of markup: the views are React components over `@boundaries/ui-kit`.
- Its Cytoscape.js and Sigma code, and the two placements of the switch.
- `data.json`, its invented violations (`inv`) and their "invented" chips.
- Its hard-coded values: the test categories (`TEST_CATS`), the `domain` and `scope` captured keys, the folder depth, and the `hue()` colors.

## Steps

Every change goes through the `implement-change` skill. Each view is a set of elements placed after the layering of `packages/graph/AGENTS.md`; the three can be separate tasks, run one after another where they share a file of the frame.

### Focus

- One group in the center, the groups that depend on it at one side and the groups it depends on at the other, each link as thick as its dependencies are many, with the tone of its verdicts: allowed, dashed disallowed, both directions.
- The center shows its files and its internal dependencies. A control chooses the group, sorted by fan-in plus fan-out as in the mockup, and selecting a neighbor moves the focus to it.
- Selecting the center or a neighbor fills the inspector with the node, and selecting a link fills it with the edge.
- When a side has more groups than fit, the rest are counted ("+ N more"), and every one of them stays reachable in the Matrix and in the inspector.

### Matrix

- A real table: a row depends on a column, with the count in the cell, a marker for disallowed dependencies and one for both directions, and the internal dependencies on the diagonal.
- Rows and columns are sorted from the groups that mostly depend on others to the groups that others mostly depend on, as the mockup does, so that a layered architecture fills one side of the diagonal. A line above the table says how to read it.
- Each cell with dependencies is reachable and activated with the keyboard, has an accessible name that says the two groups and the counts, and fills the inspector with its edge. Row and column headers are table headers.
- The strength of a cell's background comes from the theme, not from a computed color literal.

### Composition

- Tabs, one breakdown at a time (decision 37): files by element type, files by captured value, files by file category, and dependencies by deciding policy.
- Each breakdown is sorted bars with the name and the count. The policy tab also lists the policies that decide nothing.
- A policy is shown by its name when it has one and by its position when it has none (decision 39), through the same helper as the inspector. The label of a policy with no name can add its action and its `from` and `to` names, which its summary carries.
- A bar is selectable where the selection means something in the inspector: a group fills it with its node, and a policy with the dependencies it decided.

### Shared

- Each view reads the aggregation that the frame already computed and never calls an evaluation. A view that is not on screen computes nothing.
- An empty result (no analysis, every dependency filtered out) has its own message in each view.
- Colors come from the theme and the tokens only, in both themes.
- `packages/graph/AGENTS.md` and `README.md` are updated where they list the views.

## Verification

- `pnpm nx run-many -t check:all --all`, and `pnpm lint` and `pnpm check:spell` at the root.

Each acceptance criterion of #692:

| Criterion | Check |
| --- | --- |
| Each view follows the "group by" and the filters of the frame, and a selection fills the inspector | Per view, a spec that changes the "group by" and one filter and sees the view change, with a control, and a spec that selects and reads the inspector through its page object |
| Every dependency that a view draws can be reached in the matrix or in the lists of the inspector with the keyboard | A spec that, for a small analysis, walks the cells of the Matrix with the keyboard, opens each edge in the inspector and finds there every dependency of the analysis that the filters keep; and the checklist by hand in the harness: Tab order, activation with Enter and Space, focus visible in both themes |
| Unit tests and `check:all` | The command above, with coverage at 100% as phase 6 set it |

Also checked:

- With an analysis whose policies have no `name`, every policy shows by its position; with a `name`, when the type has it, by its name.
- The harness shows the three views for the analysis of the size of `packages/playground` without a frame of the page longer than the Map leaves, by element type and by element.
- No color literal under `packages/graph/src`: this command finds nothing.

```bash
git grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(" -- packages/graph/src
```

## Hand-offs

- To phase 9 (`09-docs-and-closing.md`): the names on screen of the three views, of the tabs of Composition and of their controls, and how each view is read, which the docs page explains.
- To phase 8 (`08-website-graph.md`), when it has not merged yet: the Playwright page objects of the views that `@boundaries/graph/playwright` exports.
- To phase 10 (#689), when it has not merged yet: the helper that labels a policy and the type it reads, so that the name reaches the graph. It goes in `10-policy-name.md`.

## Open points

- **#689 not merged when the phase starts.** The policy summary has no `name` then. Default: the label helper takes the summary and shows the position, with a spec for the fallback only, and the hand-off above.
- **How many neighbors Focus draws per side.** Default: the 16 of the mockup, tuned to the height of the stage.
- **The Matrix with many groups.** By element, `packages/playground` has 119 groups (`browser-cost.md`), so the table is 119 by 119. Default: the table scrolls inside the stage with sticky headers, with no virtualization; measure its render in the harness and tell the maintainer when it drops frames.
- **A tab of Composition with no data,** such as captured values in a config that captures none. Default: the tab stays and says that there is nothing to show.
- **Which captured key the "files by captured value" tab uses.** Default: the key that the "group by" of the frame has, or the first key of the analysis when the "group by" is another one, with a control in the tab to change it.
- **A view that needs the frame to change in a way phase 6 did not foresee.** Default: change the frame in this pull request and say it in the description, rather than working around it in the view.
