<!-- cspell:disable -->
# Phase 8: the guide page and the docs buttons

Goal: a "Playground" page under the website guides, "Open in playground" buttons on the docs pages whose examples fit a sketch, and the bug report template asking for a playground link.

Issue: #555. Branch `docs/555/playground-guide` from `feat/539/playground`; PR into `feat/539/playground`, title `docs(website): document the playground`, `closes #555`. Changelog: the website entry of phase 7 covers the page; add a short `docs` entry only if the `release` skill needs one per page (it does not today). The PR description lists the pages that got a button.

Read first:

- `documentation-writer` skill (Diátaxis: the guide is a how-to, with a short explanation section), `.agents/rules/docs-authoring.md`, `packages/website/AGENTS.md` (docs are added to `docs/` only; `sidebars.ts` holds the navigation).
- The existing guides under `packages/website/docs/guides/` for tone and length (`debugging.md` is the closest in purpose).
- `07-m3-share-embed.md` hand-offs: the MDX component props, the encoder, the examples.
- RFC #538 "Scope" and "Interface" decision 5 for the limits to state plainly (no real source code, no `node_modules` resolution, the `dependencies` rule only, the config node holds the `settings` and `rules` sub-objects as JSON5).
- `.github/ISSUE_TEMPLATE/bug_report.md`.

Preconditions: phase 7 merged.

## Scope

In: the guide page and its sidebar entry, the buttons on the chosen docs pages with their sketches, the bug template line. Out: any playground feature; docs of `@boundaries/config` and `@boundaries/policies` as packages (their READMEs cover them until an RFC says otherwise).

## Steps

1. `packages/website/docs/guides/playground.md`: what the playground is for (two scenarios of the RFC), how to sketch a project (tree, text mode, config node, dependency picker), how to read the results (the three facets, verdicts, the problems panel), how to share a state and use it in an issue, the limits, and a "Not the same as running ESLint" note (resolution, other rules). Screenshots only if the website already hosts docs screenshots; otherwise none (the page links the playground). Add it to the `Guides` category in `sidebars.ts`.
2. Buttons: `quick-start.mdx` (the three element types, two file categories, three policies example that reproduces the home's step 3), the selectors and policies pages whose examples are self-contained, one button per example block with its sketch declared next to it as props. Do not add buttons to pages whose examples need features the playground lacks (resolution, other rules).
3. `.github/ISSUE_TEMPLATE/bug_report.md`: under the reproduction section, one line asking for a playground link when the bug is about a classification or a verdict.
4. Run `pnpm nx build website`: no broken link; check the new page in both themes at 1440 and 390 px with the screenshots script.

## Verification

- Acceptance criteria of #555 checked in the PR description.
- `pnpm nx check:all website` passes.

## Hand-offs

- To phase 9: the list of `screenshots/*` branches created by phases 4 to 8, to delete.

## Open points

- Whether the guide also documents the two packages for library consumers. Default: no; one sentence links their READMEs.
