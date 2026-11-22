# Phase 9: docs and closing

## Goal

The website explains the graph in one page of the docs, linked from the playground guide and from the graph itself. The playground section of the home page shows a screenshot of the graph in both themes, and the "Playground" section of the README is two bullets, one for the playground and one for the graph. Every fact of the plan that outlives it is in an `AGENTS.md` or in the tracking issue #685, and the plan and its `.gitignore` exception are gone, so that `feat/architecture-graph` can merge into `release`. It is the last phase of the plan (`write-plan` skill, "Where it lives", point 2).

## Issue and PR

- Issue #694, a sub-issue of #685, closed by the release pull request into `master`.
- Branch `docs/694/architecture-graph`, from `feat/architecture-graph`. Pull request into `feat/architecture-graph`, titled `docs(website): document the architecture graph`, merged last.
- Changelog:
  - `packages/website/CHANGELOG.md`: the `feat(#685)` entry that phase 8 wrote under `## [Unreleased]` is extended to name the guide and the home page, instead of adding entries that repeat it. The `feat(#539)` entry of the playground is the model.
  - `packages/eslint-plugin/CHANGELOG.md`: a `chore` entry under a new `## [Unreleased]` section, because the plugin publishes the root `README.md`. The README entry of its version 7.4.3 is the model. It is a PATCH; no version is bumped here.
  - `packages/graph-data/CHANGELOG.md` keeps its first-version entry.
- The pull request description shows the docs page rendered, the home page section in both themes at a desktop and a phone width, the README section, the comment posted on #685, and the output of `git ls-files .agents/plans`, which is empty.

## Read first

- `../architecture-graph.md`: decision 38, which sets the scope of the docs, and decisions 18, 19, 20 and 31 to 35, which the docs and the closing comment quote.
- `00-shared.md`, whole: the source of the docs page and of the comment on #685.
- `packages/website/AGENTS.md`: "Structure" (the working docs and the snapshot of the latest release) and "Playground" (the docs of what is deployed with the site go in both).
- `packages/website/docs/guides/playground.md`: the guide the new page sits beside, and its register. `packages/website/sidebars.ts`: the "Guides" category.
- `packages/website/src/components/home/PlaygroundTeaser/` and `packages/website/src/pages/index.tsx`: the section that gets the screenshot.
- `packages/website/src/data/site/links.ts` and `packages/website/src/pages/playground.tsx`: where `DOCS_PLAYGROUND_GUIDE` is declared and passed, the model for the URL of the graph guide.
- The root `README.md`, "Playground" section. `packages/eslint-plugin/README.md` is not a tracked file: `packages/eslint-plugin/.gitignore` ignores it and the `build` target of `packages/eslint-plugin/project.json` copies the root one into the package.
- `packages/graph/AGENTS.md` and `README.md`, and `packages/graph-data/README.md`: the names on screen and what the docs can link to.
- The `documentation-writer` skill, and `.agents/rules/docs-authoring.md`, `agents-md.md` and `changelog-and-versioning.md`.
- `.gitignore`, its last lines, and the `check-root` job of `.github/workflows/build.yml`, which fails a pull request into `release` while `git ls-files .agents/plans` lists a file.

## Preconditions

- #692 and #693 are merged into `feat/architecture-graph`, and the `status: blocked` label is off #694.
- Every other phase file of the plan is deleted, or its phase is merged into `release` (phases 2, 3, 4 and 10). A phase that is still open keeps the plan alive: tell the maintainer before removing anything.
- `release` is merged into `feat/architecture-graph`, so that the docs describe what will ship.

## Scope

In:

- One docs page, in the working docs and in the snapshot of the latest release, with its sidebar entries.
- The links to it: from the playground guide and from the graph.
- The screenshot in `PlaygroundTeaser`.
- The two bullets of the README.
- The facts of the plan moved to their lasting homes, and the plan removed.

Out:

- A new pitch of the home page or of the README around the visual analysis, which waits for a reader of real projects (decision 38). The headline, the lead and the button of `PlaygroundTeaser`, and every other section of the README, stay as they are.
- An image in the README.
- The third-party notice of `elkjs`, which phase 8 added (#693, point 5). The docs page links to it.
- The pull request from `feat/architecture-graph` into `release`, and the release. The maintainer opens it once this phase merges (`../architecture-graph.md`, "Integration plan").

## Steps

A change of the code, the tests or the configs goes through the `implement-change` skill: the link constant, the host prop, `PlaygroundTeaser` and its styles, any spec. The docs page, the README and the agent docs are documentation only, and a `reviewer` subagent reviews them before they are shown (root `AGENTS.md`).

### The docs page

- A guide under `packages/website/docs/guides/`, listed in the "Guides" category of `sidebars.ts` after `guides/playground`, written with the `documentation-writer` skill in the register of the playground guide.
- It explains what the graph is for, how to open it, the four views and the question each one answers, the "group by" values and the filters, the inspector, and how it follows the playground: it draws the last evaluation, says when it is out of date or when the config cannot be read, and a selection opens its file or dependency in the editor.
- It says the limits: a wide screen only, sketches only (no project opened from a file), the layered layout only, and what happens with a graph too big (the notice, the time limit, the cancel), with the numbers that `00-shared.md` holds after phase 6.
- It uses the names that are on screen, and shows a policy as the graph does: by its name when it has one, by its position otherwise.
- The same page and sidebar entry go in `versioned_docs/version-<X.Y.Z>/` and `versioned_sidebars/version-<X.Y.Z>-sidebars.json` of the latest release, the first entry of `packages/website/versions.json`. No older snapshot changes.
- `packages/website/docs/guides/playground.md` links to it where it describes what the playground shows, in both copies.

### The link from the graph

- A constant for the URL of the page in `packages/website/src/data/site/links.ts`, beside `DOCS_PLAYGROUND_GUIDE`, passed by the host of `playground.tsx` to the guide URL prop of the graph.
- A check that the link is there: in the browser spec of the graph tab, through the page objects.

### The home page

- `PlaygroundTeaser` gets a screenshot of the graph, one image per theme, each shown under its `data-theme` with CSS, with a text alternative that says what it shows. The images live under `packages/website/static/img/` and have explicit dimensions, so that nothing moves while they load.
- The section keeps its headline, its lead and its button. The static preview of the tree stays unless the maintainer says otherwise.
- The screenshot is taken from the production build, of the example that the playground opens with, at a fixed viewport, in both themes.

### The README

- In the root `README.md`, the "Playground" section becomes two bullets: one for the playground, with what the paragraph says today, and one for the graph, with a link to the playground page. No image, and no other section changes.
- `pnpm nx build eslint-plugin` then copies it to `packages/eslint-plugin/README.md`.

### Closing the plan

1. Move what outlives the plan. Before deleting, read each file of the plan and place every fact that is still true and that no repository file holds:
   - Layering, constraints and conventions go to the `AGENTS.md` of their package: the conditions of the `elkjs` license (a dependency, never bundled into a published package, behind the adapter, with the notice on the website) and the visible React Flow attribution in `packages/graph/AGENTS.md`; what keeps the graph lazy in `packages/website/AGENTS.md`. Most are there since the phase that set them up: check, and add only what is missing.
   - Design decisions, measurements and what was left for later go to a comment on #685, written with the `writing-style` skill and shown to the maintainer before it is posted: the numbers of `library-research.md` and `browser-cost.md` that the design rests on, what stays out (the project reader, the snapshot, the local app, a force layout, the new pitch), and the hand-off of phase 5 about the first publication of `@boundaries/graph-data`.
2. Delete `.agents/plans/architecture-graph.md` and the folder `.agents/plans/architecture-graph/`, with its mockups and spike.
3. In `.gitignore`, replace the last four lines with the two that `release` has:

   ```
   # Agent working plans (local only). The architecture-graph plan is shared on its integration branch and removed before the branch merges into release
   .agents/plans/*
   !.agents/plans/architecture-graph.md
   !.agents/plans/architecture-graph/
   ```

   becomes

   ```
   # Agent working plans (local only)
   .agents/plans/
   ```

4. Search the repository for what still names the plan: `git grep -n "agents/plans/architecture-graph\|feat/architecture-graph"` finds nothing in a tracked file.

## Verification

- `pnpm nx run-many -t check:all --all`, and `pnpm lint` and `pnpm check:spell` at the root.
- `pnpm nx build website` reports no broken link or anchor.

Each acceptance criterion of #694:

| Criterion | Check |
| --- | --- |
| The docs page is linked from the playground guide and from the graph | The link in both copies of `guides/playground.md` resolves in the build, and the browser spec reads the link of the graph |
| The home page shows the screenshot in both themes | `pnpm --filter website screenshots` against the served build captures `/` at both widths and both themes with no overflow and no console error, and the captures go in the pull request description |
| The README of the repository and the one of `packages/eslint-plugin` carry the two bullets | After `pnpm nx build eslint-plugin`, `diff README.md packages/eslint-plugin/README.md` prints nothing, and the section has two bullets and no image |
| No file under `.agents/plans/` is tracked on the branch | `git ls-files .agents/plans` prints nothing |

Also checked:

- `git diff --stat` against `feat/architecture-graph` shows docs changes only in `docs/` and in the snapshot of the latest release.
- Every statement of the docs page was seen on the built site, in the graph, before it was written.
- The comment on #685 is posted, and it names no file of the plan as a place to read more.

## Hand-offs

None: no phase follows. What the release needs is in the comment on #685.

## Open points

- **The name and the id of the page.** Default: `guides/architecture-graph.md`, titled "Architecture graph", with the constant `DOCS_GRAPH_GUIDE`.
- **How the screenshot is made.** The site has no themed image today, and `scripts/screenshots.mjs` is a visual check, not a generator. Default: a script under `packages/website/scripts/`, after `social-card.mjs`, that drives the built page and writes both images, run by hand and committed with them; the build does not regenerate them.
- **Where the screenshot sits in the section.** Default: below the head and the static preview, full width of the section, checked at a phone width; shown to the maintainer in the preview.
- **The wording of the two bullets.** Default: the first keeps the sentence of today shortened to one line, and the second says that the same page draws the sketch as a graph of element types and their dependencies; shown to the maintainer in the preview.
- **The mockups and the spike.** They are deleted with the plan, and a squash merge keeps no history of them on `release`. Default: delete them, say in the comment on #685 which pull requests of this branch hold them, and ask the maintainer whether any should be kept elsewhere first.
- **A phase into `release` that is still open** (2, 3, 4 or 10) when this one starts. Default: stop and ask the maintainer.
- **The version of the website.** The page goes in the working docs and in the latest snapshot alike, so the release decides between a new version and a revision (`.github/CONTRIBUTING.md`, "Publishing", step 2). Default: nothing to do here.
