<!-- cspell:disable -->
# Playground (RFC #538)

Index of the plan. The plan is split so that an independent session can implement one phase with no other context than the files named here plus the repository's own agent files. The source of every design decision is [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538); the tracking issue is #539 and the milestone is [Playground](https://github.com/javierbrea/eslint-plugin-boundaries/milestone/45).

Status (2026-11-06): the extraction is released (`config` and `policies` 1.0.1 in v7.4.2, 2026-11-05), and `release` was merged into this branch after it. Phases 4 (#599) and 5 (#621, merged on 2026-11-06) are in this branch: the panes classify the files of a sketch, following the mockup (decision 16). Phase 6 (#553) is in progress on `feat/553/playground-verdicts`.

This plan lives on the integration branch `feat/539/playground`. How it is shared, kept true and removed is in the "Where it lives", "Starting a phase" and "Finishing a phase" sections of the `write-plan` skill; phase 9 removes it.

## Files

| File | Read it when |
| --- | --- |
| `playground/00-shared.md` | Always. Environment, branching, package conventions, quality gates, definition of done, the interface. |
| `playground/06-m2-verdicts.md` | Phase 6 (#553): M2. |
| `playground/07-m3-share-embed.md` | Phase 7 (#554): M3. |
| `playground/08-docs.md` | Phase 8 (#555): the guide page and the docs buttons. |
| `playground/09-cleanup.md` | Phase 9: remove the plan before merging into `release`. |
| `playground/mockups/` | Phases 6 to 8: the approved HTML mockup of the interface and its renders, which `00-shared.md` section 6 describes. |

## Phases

| Phase | Issue | Branch | Depends on | PR target | PR title | PR |
| --- | --- | --- | --- | --- | --- | --- |
| 0 Skills | — | `chore/539/issue-and-plan-skills` | — | `release` | `chore: Add the writing-style, create-issue and write-plan skills` | #556 |
| 1 RFC | #548 | none (Discussion [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559)) | — | — | — | — |
| 2 config | #549 | `feat/549/config-package` | 1 done | `release` | `feat: Extract @boundaries/config from the plugin` | #561 |
| 3 policies | #550 | `feat/550/policies-package` | 2 merged | `release` | `feat: Extract @boundaries/policies from the plugin` | #588 |
| — Browser build | #510 | `feat/510-elements-in-browser` | — | `release` | as the issue says | #560 |
| — Playwright | #557 | `chore/557/playwright-root-dependency` | — | `release` | `chore: Run the website browser scripts on Playwright's pinned Chromium` | #582 |
| — Browser e2e | #558 | `chore/558/browser-e2e` | #510 and #557 merged | `release` | `chore: Test the browser builds in Chromium, Firefox and WebKit` | #583 |
| 4 Scaffold | #551 | `feat/551/playground-scaffold` | #510 and 2 merged into `release` and `release` merged here | `feat/539/playground` | `feat(playground): scaffold the package and the website shell` | #599 |
| 5 M1 | #552 | `feat/552/playground-identify` | 4 merged | `feat/539/playground` | `feat(playground): identify the files of a sketched project` | #621 |
| 6 M2 | #553 | `feat/553/playground-verdicts` | 5 merged | `feat/539/playground` | `feat(playground): verdicts of the dependencies` | |
| 7 M3 | #554 | `feat/554/playground-share` | 6 merged | `feat/539/playground` | `feat(playground): share by URL and embed in the docs` | |
| 8 Docs | #555 | `docs/555/playground-guide` | 7 merged | `feat/539/playground` | `docs(website): document the playground` | |
| 9 Cleanup | — | `chore/539/playground-cleanup` | 8 merged | `feat/539/playground` | `chore(playground): remove the playground plan` | |

What can run in parallel: phases 5 to 9 are sequential, each one on the merge of the previous one. Two sessions at most at a time (user rule).

## Integration plan

The branching model and the merge strategies are in `.github/CONTRIBUTING.md` ("Branching model"); this section only says what goes where.

1. **Extraction into `release`, as early as possible.** Phases 2 and 3 (and #510; #557 and #558 change only tooling and tests) are refactors with no change in what the plugin reports. Each one is its own PR into `release`, squash-merged, so that every branch created afterwards starts from the new package layout and no later merge has to move code between packages. The release that follows phase 3 (decision 13) publishes the new packages with `pnpm -r publish`, together with the plugin bump.
2. **The playground on one integration branch.** `feat/539/playground` is created from `release` (through the skills branch) and tracks `release` by merging it, never rebasing: other sessions build on it. Phases 4 to 9 are one PR each into this branch, so that every review has the size of one phase. After phase 2, phase 3 and #510 merge into `release`, `release` is merged into this branch before the phase that needs them starts.
3. **Shipping.** After phase 9, the maintainer opens one PR from `feat/539/playground` into `release` (title `feat: Website playground`, body built from the phase PRs, `closes #539`), then promotes `release` to `master` as CONTRIBUTING says. The playground goes live with that deploy. Phase 8 changes `packages/website/docs/`, so the website takes a new version at the next code release or a documentation-only one (`CONTRIBUTING.md`, "Publishing", step 2); which one is decided when `release` is promoted, with the `release` skill.
4. **Closing.** `closes #N` lines only act on merges into `master`; the sub-issues are ticked in #539 as their PRs merge and closed by the release PR. The branches `rfc/538-playground-assets` (RFC images) stays as long as the RFC does; the mockup renders of phase 5 live in `playground/mockups/` and leave with the plan.

## Decisions (closed)

Taken in RFC #538 unless another source is named. A session does not reopen them; a session that finds one unworkable stops and asks the maintainer.

1. Two packages are extracted from the plugin, `@boundaries/config` (what the user wrote) and `@boundaries/policies` (how it is evaluated, messages included), both pure, browser-ready and consumed through public interfaces only; the exact cut and the interfaces are fixed by [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559) (phase 1), not by this plan.
2. The playground is `packages/playground` (`@boundaries/playground`, private), one React component with no CSS file (its styles live in JavaScript, decision 15), host-agnostic through `ProjectSource` and `StateStore`; the website is the first host, a local app the second (out of scope).
3. The website shell is `packages/website/src/pages/playground.tsx`: Docusaurus `Layout` + `BrowserOnly` + `React.lazy`; the chunk loads on that page only.
4. Interface: explorer left, node in focus middle, inspector right, problems panel bottom with focus tabs; `eslint.config.js` is a node of the sketch holding `{ settings, rules }` as JSON5, the only free text; dependencies are a model entered through a picker and rendered as import statements; desktop only.
5. Visual language and tokens of the website redesign (`--jsb-*`, teal `allow`, vermilion `disallow`); any component library is scoped to the playground root and never restyles the site (redesign decision 7).
6. Internal packages are consumed with `workspace:` + Nx `^build`, never a published version (memory of the maintainer, 2026-10-23).
7. The research notes of the RFC are not issues: note 2 is phase 1, notes 1, 3 and 4 are phase 4, note 5 is phase 7; each is posted as a comment on #539 (this plan, 2026-10-25).
8. M1 starts with an HTML mockup of the interface iterated with the maintainer until approved; no component is written before (maintainer, 2026-10-25, when the issues were created).
9. The milestone is `Playground`, a feature milestone across releases; the release that publishes the extraction uses its own version milestone for the release bookkeeping if the `release` skill needs one (this plan, 2026-10-25).
10. Browser support of `elements`, `config` and `policies` is checked twice: per package with esbuild and `node:vm` (fast, in `test:e2e`), and together in Chromium, Firefox and WebKit by the Nx project `test/browser-e2e` (#558), against the Node.js results (maintainer, 2026-10-26).
11. `@playwright/test` is a root devDependency, pinned; every script that uses a browser installs the browser it needs through it and never uses a local Chrome, so that renders and tests run on the same browser build everywhere (maintainer, 2026-10-26; #557).
12. [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559) is accepted as proposed (maintainer, 2026-10-26): the cut, the interfaces, the plugin adapters, no self-lint for `config` and `policies`, `1.0.0` for both packages and a patch for the plugin; a later change is an amendment of the RFC. Amendment 1 (2026-10-29) adds `getDependencySkipReason` to `policies`, so that the plugin keeps normalizing policies only for the dependencies it checks.
13. A release follows phase 3, before the playground phases: `config` and `policies` at `1.0.0`, a patch of the plugin, and whatever else `release` holds, with the `release` skill (maintainer, 2026-10-29).
14. The config node is parsed with `@humanwhocodes/momoa` in JSON5 mode and edited with CodeMirror 6, the JSON5 grammar of `codemirror-json5` and `@codemirror/lint` (research note 3, maintainer, 2026-11-02).
15. The widgets are MUI (`@mui/material`, `@mui/x-tree-view`), chosen over React Aria Components because the later local app and its graph view build on it (research note 4, maintainer, 2026-11-02). The theme reads the `--jsb-*` tokens through `cssVariables: { nativeColor: true }`, scoped with `rootSelector` and `colorSchemeSelector` to the playground root and the host's `data-theme`; Emotion uses its own cache key; no `CssBaseline`; overlays render into the root; the `ThemeProvider` gets `colorSchemeNode={null}` and `storageManager={null}`, because MUI otherwise sets its own `data-theme` attribute on `<html>` and reads and follows the mode saved in `localStorage` (phase 4, 2026-11-02; corrected in the review of #599). The MUI variables have their own prefix, `jsb-play`, and overlays stay in the root, with the limits that `packages/playground/AGENTS.md` ("Stack") records (review of #599, maintainer, 2026-11-03). React, React DOM, `@mui/material`, `@emotion/react` and `@emotion/styled` are peer dependencies, so that each host has one instance of their context. Split panes are `react-resizable-panels`.
16. The interface follows the mockup in `playground/mockups/`, approved by the maintainer on 2026-11-04, updated with the review of the phase 5 page the same day, and described in `00-shared.md` section 6: the page has no visible header and the playground fills it below the navbar, with a help dialog in the top bar in place of the lead.
17. The state of a playground instance is a store per mount of the shell, written as pure transitions and read through hooks, and whatever opens something produces a typed `Target` that one transition opens; the store owns the engine of the instance. The data of a local app reaches it through other implementations of `ProjectSource` and `StateStore`, not through other hooks (review of #621, maintainer, 2026-11-04).

## Open questions

| Question | Decided by | Needed by |
| --- | --- | --- |
| Website version after phase 8 (code release or `-docs.N`) | Maintainer, `release` skill | Shipping |
| Should the `--jsb-*` tokens and the fonts move to a workspace package that the website, the harness and the local app consume with `workspace:`? The harness reaches into the website by relative paths (`dev/main.tsx`, `publicDir` in `vite.config.js`) that Nx cannot see, and nothing checks `publicDir` (review of #599) | Maintainer | The local app (out of scope); phase 9 files it as an issue if still open |