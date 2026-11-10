<!-- cspell:disable -->
# Phase 8: the guide page and the docs buttons

Goal: a "Playground" page under the website guides, "Open in playground" buttons on the docs pages whose examples fit a sketch, and the bug report template asking for a playground link.

Issue: #555. Branch `docs/555/playground-guide` from `feat/539/playground`; PR into `feat/539/playground`, title `docs(website): document the playground`, `closes #555`. Changelog: the playground entry under `[Unreleased]` → `Added` of `packages/website/CHANGELOG.md` covers the page; add a short `docs` entry only if the `release` skill needs one per page (it does not today). The PR description lists the pages that got a button.

The playground calls what the user builds a project in every text it shows (decision 21 of the index); the guide does the same, and keeps "sketch" only as a verb.

Read first:

- `documentation-writer` skill (Diátaxis: the guide is a how-to, with a short explanation section), `.agents/rules/docs-authoring.md`, `packages/website/AGENTS.md` (`sidebars.ts` and `versioned_sidebars/version-7.4.1-sidebars.json` hold the navigation). Every change of this phase goes in `docs/` and in the snapshot of the latest release, today `versioned_docs/version-7.4.1/` (`playground.md`, decision 20).
- The existing guides under `packages/website/docs/guides/` for tone and length (`debugging.md` is the closest in purpose).
- "From phase 7" below: the docs component, the examples of the picker and the docs pages already fixed.
- RFC #538 "Scope" and "Interface" decision 5 for the limits to state plainly (no real source code, no `node_modules` resolution, the `dependencies` rule only, the config node holds the `settings` and `rules` sub-objects as JSON5).
- `.github/ISSUE_TEMPLATE/bug_report.md`.

Preconditions: phase 7 and the two pane pull requests (#637, #638) merged.

## From phase 6

The words the guide documents are in the code, so the page quotes them from there:

- The verdicts and their reasons: `src/domains/evaluation/ui/helpers/verdictText/` (`policy N`, `default`, `not checked · external`, `not read`, `not evaluated`, and the sentence of each skip reason and of each reason why nothing is evaluated).
- The picker: the labels of its targets in `src/domains/files/ui/molecules/DependencyPicker/DependencyPicker.constants.ts` (`A file of the project`, `An external module`), the kinds and the imported names in `src/domains/files/ui/helpers/dependencyLabels/`, the syntaxes `import`, `export … from`, `require()`, `import()` with what each one holds in the table `SYNTAX_FACTS` of `src/domains/project/helpers/sketch/sketch.constants.ts`, which the picker and the checks of a dependency both read, and the statement forms that text mode reads and writes, in `src/domains/project/helpers/sketch/statements.ts`.
- What differs from running ESLint, for the "Not the same as running ESLint" note:
  - A statement writes its source as the relative path of its target in full, with its extension and its `index` (`getDependencySource` of `src/domains/project/helpers/sketch/statements.ts`), so `dependency.source`, `customSourcePatterns` and `{{dependency.source}}` see that full path. Nothing is resolved from `node_modules`.
  - Text mode also reads short sources with a rule of the playground's own, not with the resolvers of `import/resolver`, which the playground does not read (decision 19 of the plan, `findSourceFiles` in the same file): the file named exactly, else the one that adds a code extension or `/index` and one; a folder source reads only its `index`; several matches are a problem of the line, which asks for the extension.
  - `eslint-import-resolver-typescript` 4.4.5 resolves the full path of a JavaScript file to the TypeScript file of the same stem beside it: `./b.js` to `b.ts`, `b.tsx` or `b.d.ts`, `./c.jsx` to `c.tsx`, `./d.mjs` to `d.mts` and `./e.cjs` to `e.cts`; `eslint-import-resolver-node` 0.3.9 takes the file written (measured on 2026-11-07). There, the playground judges the file written and ESLint with the `typescript` resolver judges the other one.
  - The selectors of `boundaries/additional-dependency-nodes` are not run, and the playground warns at the setting; only the `dependencies` rule is evaluated, or `element-types` when it is the one written; a rule entry without options checks nothing, as in the plugin; a syntax that `boundaries/dependency-nodes` leaves out is `not read`.

## From phase 7

- The docs component is `packages/website/src/components/OpenInPlayground/` (element type `docs-component`): `<OpenInPlayground config={playgroundConfig} project={playgroundProject} />`. `config` is the JSON5 text of `{ settings, rules }`, as the config node of the playground holds it (no spread of predefined rules, nothing a JSON5 text cannot hold); `project` is the text of text mode, one path per line, folders ending in `/`, dependencies indented two spaces under their file, with the statements written in full. It computes the link during the server render with `getPlaygroundHash` of `@boundaries/playground/share`, the light entry of the package that docs components import statically; a project with problems fails the build, which lists them. In MDX, the texts go in `export const` declarations passed as props, because MDX removes up to two spaces of indentation from the lines of a template literal written inside a JSX attribute, which unindents the dependencies (the Quick start has the first button, at the end of step 6, written that way in `docs/quick-start.mdx` and `versioned_docs/version-7.4.1/quick-start.mdx`). The link skips the broken link check (`noBrokenLinkCheck` of `src/components/ui/Button`), because its hash is not an anchor of the page. The first button on a page adds about 8.6 KB gzipped to its scripts (measured on 2026-11-09), most of it the text mode reader and `fflate`. The docs of the latest release are served at `/docs/…` and the unreleased ones at `/docs/next/…`, and a button shows on both.
- The examples of the picker are `EXAMPLES` (`packages/playground/src/domains/examples/data/examples/`): Quick start (`docs/quick-start.mdx`), Overview (`docs/overview.md`), Policies (the Complete Example of `docs/policies/policies.mdx`) and Dependencies rule (`docs/rules/dependencies.md`). Each one holds what ESLint 9.39.5 and the workspace plugin report for its files (`*Verdicts.mock.ts`). A button next to the code block of one of them opens the same sketch: take its config and its project (the text that `toText` writes) from the example's file. Nothing checks that the texts of a button equal its example: open the link from the built page and check that the picker reads `Example <title>`.
- Pages measured and left out as examples, because they need what the playground lacks: the rules other than `dependencies` (`external`, `entry-point`, `no-private`, `no-unknown-*`, `no-ignored-dependencies`), the guides that need module resolution or another parser (`monorepo-setup`, `custom-resolvers`, `typescript-support`, `oxlint-integration`), `settings/settings.md` (additional dependency nodes, `flag-as-external`, `root-path`), `settings/config-helpers.md` and step 5 of the Quick start (the predefined rules), `guides/debugging.md`, and the classification and selectors pages, whose blocks are fragments without a full config.
- Phase 7 fixed, in `docs/` and `versioned_docs/version-7.4.1/`, what ESLint does not do as these pages said: the Overview (`checkAllOrigins`, the `axios` policy, the sample message), the Complete Example of Policies (`checkAllOrigins`), and the rule pages of `dependencies` (`src/` file patterns, the `policies` option, the sample messages), `entry-point` and `external` (the `policies` option, the sample messages). A button added next to one of their blocks takes the block as it is now.
- For the part of the guide on sharing, the words and limits are in the code: Share copies a link whose hash holds the whole sketch, which a browser never sends to a server; it warns above 8,192 characters (`LONG_LINK_LENGTH`, `src/domains/share/helpers/sketchHash/sketchHash.constants.ts`) and refuses, with the reason, a sketch that a link cannot open: more than 1,000 files and folders or 3,000 dependencies (`src/domains/project/helpers/sketch/sketch.constants.ts`), or more than 4 MiB of JSON. The messages are in `src/domains/share/ui/helpers/shareMessage/`. Reset brings back the sketch of the source, the Quick start example on the website, and asks first when the sketch on screen is neither an example nor that sketch.

## Scope

In: the guide page and its sidebar entry, the buttons on the chosen docs pages with their sketches, the bug template line. Out: any playground feature; docs of `@boundaries/config` and `@boundaries/policies` as packages (their READMEs cover them until an RFC says otherwise).

## Steps

1. `packages/website/docs/guides/playground.md`: what the playground is for (two scenarios of the RFC), how to sketch a project (tree, text mode, config node, dependency picker), how to read the results (the inspector's `from`, `to` and `dependency` with the properties that selectors match, verdicts, the problems panel), how to share a state and use it in an issue, the limits, and a "Not the same as running ESLint" note (resolution, other rules). Screenshots only if the website already hosts docs screenshots; otherwise none (the page links the playground). Add it to the `Guides` category in `sidebars.ts`. The same page goes in `versioned_docs/version-7.4.1/guides/playground.md` and in the `Guides` category of `versioned_sidebars/version-7.4.1-sidebars.json`.
2. Buttons: `quick-start.mdx` has one already (phase 7); add one next to the block of each other example of the picker (Overview, the Complete Example of Policies, the `boundaries/dependencies` rule page) and next to any other block of those pages that fits a sketch, with its texts declared as `export const` next to it ("From phase 7"). Each button goes in the page of `docs/` and in the same page of `versioned_docs/version-7.4.1/`, after checking that the block next to it is the same in both. The pages that "From phase 7" lists as left out get none.
3. `.github/ISSUE_TEMPLATE/bug_report.md`: under the reproduction section, one line asking for a playground link when the bug is about a classification or a verdict.
4. Run `pnpm nx build website`: no broken link; check the new page under `/docs/` and `/docs/next/` in both themes at 1440 and 390 px with the screenshots script, and open each button from both.

## Verification

- Acceptance criteria of #555 checked in the PR description.
- `pnpm nx check:all website` passes.

## Hand-offs

- To phase 11: the list of `screenshots/*` branches created by phases 4 to 8, to delete.

## Open points

- Whether the guide also documents the two packages for library consumers. Default: no; one sentence links their READMEs.
