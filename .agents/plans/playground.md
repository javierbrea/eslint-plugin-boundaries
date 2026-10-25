<!-- cspell:disable -->
# Playground (RFC #538)

Index of the plan. The plan is split so that an independent session can implement one phase with no other context than the files named here plus the repository's own agent files. The source of every design decision is [RFC #538](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538); the tracking issue is #539 and the milestone is [Playground](https://github.com/javierbrea/eslint-plugin-boundaries/milestone/45).

Status (2026-10-25): plan written, no phase started. The skills branch `chore/539/issue-and-plan-skills` (phase 0) is ready for its PR into `release`, and this branch is created from it. Issues #548 to #555 exist as sub-issues of #539; #510 is in the milestone.

This plan is committed on the integration branch `feat/539/playground` through a `.gitignore` exception (`write-plan` skill, "Where it lives"). Phase 9 removes it, the exception and the clause in the root `AGENTS.md` before the branch merges into `release`. Every phase starts by bringing the plan up to date and showing the maintainer the diff before committing it on this branch (`write-plan` skill, "Starting a phase"); plan edits are `chore(playground)` commits on this branch, pushed, never only on a phase branch.

## Files

| File | Read it when |
| --- | --- |
| `playground/00-shared.md` | Always. Environment, branching, package conventions, quality gates, definition of done. |
| `playground/01-rfc-config-policies.md` | Phase 1 (#548): inventory of the plugin and the RFC of the two packages. |
| `playground/02-config.md` | Phase 2 (#549): `@boundaries/config`. |
| `playground/03-policies.md` | Phase 3 (#550): `@boundaries/policies`. |
| `playground/04-scaffold.md` | Phase 4 (#551): research notes 1, 3, 4; `packages/playground`; the website shell. |
| `playground/05-m1-identify.md` | Phase 5 (#552): the HTML mockup of the interface, then M1. |
| `playground/06-m2-verdicts.md` | Phase 6 (#553): M2. |
| `playground/07-m3-share-embed.md` | Phase 7 (#554): M3. |
| `playground/08-docs.md` | Phase 8 (#555): the guide page and the docs buttons. |
| `playground/09-cleanup.md` | Phase 9: remove the plan before merging into `release`. |
| `playground/mockups/` | Created by phase 5: the approved HTML mockup of the interface and its renders. Until then, the RFC sketches live on the branch `rfc/538-playground-assets`. |

## Phases

| Phase | Issue | Branch | Depends on | PR target | PR title |
| --- | --- | --- | --- | --- | --- |
| 0 Skills | — | `chore/539/issue-and-plan-skills` | — | `release` | `chore: Add the writing-style, create-issue and write-plan skills` |
| 1 RFC | #548 | none (a Discussion) | — | — | — |
| 2 config | #549 | `feat/549/config-package` | 1 accepted | `release` | `feat: Extract @boundaries/config from the plugin` |
| 3 policies | #550 | `feat/550/policies-package` | 2 merged | `release` | `feat: Extract @boundaries/policies from the plugin` |
| — Browser build | #510 | `fix/510/elements-browser-build` | — | `release` | as the issue says |
| 4 Scaffold | #551 | `feat/551/playground-scaffold` | #510 and 2 merged into `release` and `release` merged here | `feat/539/playground` | `feat(playground): scaffold the package and the website shell` |
| 5 M1 | #552 | `feat/552/playground-identify` | 4 merged; the mockup can start before | `feat/539/playground` | `feat(playground): identify the files of a sketched project` |
| 6 M2 | #553 | `feat/553/playground-verdicts` | 5 merged, 3 merged into `release` and `release` merged here | `feat/539/playground` | `feat(playground): verdicts of the dependencies` |
| 7 M3 | #554 | `feat/554/playground-share` | 6 merged | `feat/539/playground` | `feat(playground): share by URL and embed in the docs` |
| 8 Docs | #555 | `docs/555/playground-guide` | 7 merged | `feat/539/playground` | `docs(website): document the playground` |
| 9 Cleanup | — | `chore/539/playground-cleanup` | 8 merged | `feat/539/playground` | `chore(playground): remove the playground plan` |

What can run in parallel: phase 1 and #510 from the start; the HTML mockup of phase 5 at any time (it needs no code); phases 2 and 3 are sequential; phase 4 waits for #510 and 2; phase 6 waits for 3. Two sessions at most at a time (user rule).

## Integration plan

The branching model and the merge strategies are in `.github/CONTRIBUTING.md` ("Branching model"); this section only says what goes where.

1. **Extraction into `release`, as early as possible.** Phases 2 and 3 (and #510) are refactors with no change in what the plugin reports. Each one is its own PR into `release`, squash-merged, so that every branch created afterwards starts from the new package layout and no later merge has to move code between packages. They do not need a release to `master` by themselves: the published plugin is unaffected until the next release, and `pnpm -r publish` publishes the new packages together with the plugin bump when that release happens. If the maintainer wants the refactor validated on npm before the playground ships, the natural moment is a release right after phase 3 (plugin, config, policies and the `elements` fix of #510 together); it is a maintainer decision, not a step of this plan.
2. **The playground on one integration branch.** `feat/539/playground` is created from `release` (through the skills branch) and tracks `release` by merging it, never rebasing: other sessions build on it. Phases 4 to 9 are one PR each into this branch, so that every review has the size of one phase. After phase 2, phase 3 and #510 merge into `release`, `release` is merged into this branch before the phase that needs them starts.
3. **Shipping.** After phase 9, the maintainer opens one PR from `feat/539/playground` into `release` (title `feat: Website playground`, body built from the phase PRs, `closes #539`), then promotes `release` to `master` as CONTRIBUTING says. The playground goes live with that deploy. Phase 8 changes `packages/website/docs/`, so the website takes a new version at the next code release or a documentation-only one (`CONTRIBUTING.md`, "Publishing", step 2); which one is decided when `release` is promoted, with the `release` skill.
4. **Closing.** `closes #N` lines only act on merges into `master`; the sub-issues are ticked in #539 as their PRs merge and closed by the release PR. The branches `rfc/538-playground-assets` (RFC images) stays as long as the RFC does; the mockup renders of phase 5 live in `playground/mockups/` and leave with the plan.

## Decisions (closed)

Taken in RFC #538 unless another source is named. A session does not reopen them; a session that finds one unworkable stops and asks the maintainer.

1. Two packages are extracted from the plugin, `@boundaries/config` (what the user wrote) and `@boundaries/policies` (how it is evaluated, messages included), both pure, browser-ready and consumed through public interfaces only; the exact cut and the interfaces are fixed by the RFC of phase 1 (#548), not by this plan.
2. The playground is `packages/playground` (`@boundaries/playground`, private), one React component plus one CSS file, host-agnostic through `ProjectSource` and `StateStore`; the website is the first host, a local app the second (out of scope).
3. The website shell is `packages/website/src/pages/playground.tsx`: Docusaurus `Layout` + `BrowserOnly` + `React.lazy`; the chunk loads on that page only.
4. Interface: explorer left, node in focus middle, inspector right, problems panel bottom with focus tabs; `eslint.config.js` is a node of the sketch holding `{ settings, rules }` as JSON5, the only free text; dependencies are a model entered through a picker and rendered as import statements; desktop only.
5. Visual language and tokens of the website redesign (`--jsb-*`, teal `allow`, vermilion `disallow`); any component library is scoped to the playground root and never restyles the site (redesign decision 7).
6. Internal packages are consumed with `workspace:` + Nx `^build`, never a published version (memory of the maintainer, 2026-10-23).
7. The research notes of the RFC are not issues: note 2 is phase 1, notes 1, 3 and 4 are phase 4, note 5 is phase 7; each is posted as a comment on #539 (this plan, 2026-10-25).
8. M1 starts with an HTML mockup of the interface iterated with the maintainer until approved; no component is written before (maintainer, 2026-10-25, when the issues were created).
9. The milestone is `Playground`, a feature milestone across releases; the release that publishes the extraction uses its own version milestone for the release bookkeeping if the `release` skill needs one (this plan, 2026-10-25).

## Open questions

| Question | Decided by | Needed by |
| --- | --- | --- |
| Initial versions of `config` and `policies`, and whether the plugin bump is patch or minor | RFC of phase 1 | Phase 2 |
| Release to `master` right after phase 3, or wait for the playground | Maintainer | After phase 3 |
| Config editor and parser (JSON5 with locations vs `acorn`; CodeMirror vs plain editor) | Phase 4, research note 3 | Phase 5 |
| Component stack (MUI scoped, headless primitives, CSS Modules only) | Phase 4, research note 4 | Phase 5 |
| Website version after phase 8 (code release or `-docs.N`) | Maintainer, `release` skill | Shipping |
