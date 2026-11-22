# Phase 3: extract `@boundaries/ui-kit`

## Goal

`packages/ui-kit` is a new private package, `@boundaries/ui-kit` (Nx project `ui-kit`), that holds what `packages/playground/src/ui-kit` holds today: the MUI theme and the tones (`helpers/`), `ThemeRoot` (`providers/`), seven atoms and four molecules, with their specs and page objects. The playground consumes it with `workspace:*`, `packages/playground/src/ui-kit` no longer exists, and the playground looks and behaves as today.

## Issue and PR

- Closes #687. Branch `refactor/687/ui-kit-package`, from `release`. PR into `release`, titled `refactor(ui-kit): extract the theme and the ui-kit from the playground`.
- The PR commits no plan file (`write-plan` skill, "Where it lives", point 4). The session reads the plan with `git show origin/feat/architecture-graph:.agents/plans/architecture-graph.md`, and the same for `architecture-graph/00-shared.md` and this file. Its plan edits are commits on `feat/architecture-graph`, pushed once the maintainer approves them.
- Changelog entries, by `.agents/rules/changelog-and-versioning.md`:
  - `packages/website/CHANGELOG.md`, under `## [Unreleased]`: one `chore(#687)` entry. The website deploys the playground and what it bundles, and nothing changes for a visitor.
  - No `CHANGELOG.md` in `packages/ui-kit`: it is private, as `packages/playground` and `packages/design-tokens` are, and its version stays `0.0.0`.
  - `scripts/check-changelogs.js`: the `paths` of the website changelog gain `packages/ui-kit/`, and `UNPUBLISHED_FILES` gains for the new package what it lists for the playground (its `README.md` and the test support that moves).
- The PR description shows the diff of the specs reduced to imports, the entries of the new package, and a screenshot of the playground on the built website in both themes beside the same on `release`.

## Read first

- `architecture-graph/00-shared.md`, "Packages": what the package is for and who consumes it.
- `packages/playground/AGENTS.md`: "Host contract" (the tokens, `data-theme`, no global styles), "Layering" (the `ui-kit-*` rows of the table) and "Stack" (how the theme is scoped, the peer dependencies and why each is also a devDependency at the version of `packages/website/package.json`).
- `packages/playground/eslint.config.mjs`: the `ui-kit-*` element types, their descriptors under `src/ui-kit/` and their rows of `LAYER_TARGETS`.
- `packages/playground/package.json`, `project.json`, `tsup.config.js`, `tsup.playwright.config.js`, `jest.config.cjs`, `jest.setup.cjs` and `tsconfig.json`: the model of a private React package of this repository.
- `packages/playground/src/playwright.ts`: it exports four Playwright page objects of the ui-kit and the base `Pom`, which the page objects of the website extend.
- `.agents/rules/playground-components.md`, `.agents/rules/playground-testing.md` and `.agents/rules/playwright-testing.md`: the conventions the moved files follow, and whose `paths` name `packages/playground/src` today.
- `.agents/skills/repo-architecture/SKILL.md`: the `website build → playground build` line and the `build:playwright` lines that the new package joins.

## Preconditions

None. Decisions 5, 21, 23 and 24 of the index are taken. It does not depend on phase 2; when both are open, the second to merge resolves the conflicts in `packages/playground/package.json`, `project.json` and `AGENTS.md`.

## Scope

- In: the package with its build, its tests and its lint; the imports of the playground; the test support that the ui-kit files need; the lint config, `package.json`, `project.json` and agent docs of the playground; the rules and the skill that name the folder.
- Out: any visual change; any component that names a concept of the playground, which stays in `packages/playground/src/domains/`; new components for the graph, which phase 6 adds.
- Handed on: the entries of `@boundaries/ui-kit`, to phase 6.

## Steps

Every change goes through the `implement-change` skill; this one is "architectural and new". The facts below are what the design has to solve.

1. **Design the package.** What crosses the boundary today, read in `packages/playground/src`:
   - The code of the playground imports the entries of the elements (`@/ui-kit/atoms/Icon`, `@/ui-kit/helpers/theme`, `@/ui-kit/helpers/tone`, `@/ui-kit/providers/ThemeRoot` and the rest), and four constants files are imported by file from outside the folder (`Icon.constants`, `CountBadge.constants`, `Disclosure.constants`, `theme.constants`).
   - Specs and page objects of the playground import the jsdom page objects of the ui-kit by file (`@/ui-kit/atoms/Icon/Icon.pom` and others, from 33 files outside the folder), and `src/playwright.ts` exports its Playwright ones (`CountBadgePom`, `PaneHeadPom`, `CopyButtonPom`, `DisclosurePom`).
   - The other way, the ui-kit files import test support of the playground: `@/shared/testing/pom` and `@/shared/testing/pom/pom.playwright` (the base of every page object), `@/shared/testing/renderInRoot` and `@/shared/testing/emittedStyle`. They import nothing else of the playground.
   - Its external imports are React, `@mui/material`, `@emotion/react` and `@emotion/cache`. It reads the `--jsb-*` tokens as CSS variables and imports no file of `@boundaries/design-tokens`.
   So the package needs a production entry, a way to reach its jsdom page objects and test support from the specs of the playground, and a way to reach its Playwright page objects from `packages/playground/src/playwright.ts`. "Open points" has the default.
2. **Create `packages/ui-kit/`**, modeled on `packages/playground`: private, an ES module built with tsup that keeps its dependencies as imports, React, React DOM, `@mui/material`, `@emotion/react` and `@emotion/styled` as peer dependencies and as devDependencies at the versions of `packages/website/package.json`, Jest in jsdom with the 100% `coverageThreshold` and the same `collectCoverageFrom` exclusions, `check:pom-parity` and `build:playwright` if it has Playwright files. `@emotion/cache` moves from the dependencies of the playground, since only `ThemeRoot.tsx` imports it.
3. **Move the files** of `packages/playground/src/ui-kit/` with their specs, page objects, constants and types, and the test support they need. A spec changes only its imports.
4. **Lint the layering of the package.** Its `eslint.config.mjs` carries the `ui-kit-*` element types and their rows of `LAYER_TARGETS` from `packages/playground/eslint.config.mjs`, and the guards that apply to its files (specs, components, barrels, Playwright files).
5. **Update the playground.**
   - Every `@/ui-kit/...` import becomes an import of the package. The folder `packages/playground/src/ui-kit` is deleted.
   - `eslint.config.mjs`: the `ui-kit-*` element types, descriptors and rows go, the `ui-kit` segment leaves the `files` globs, and each layer that listed a `ui-kit-*` type is allowed the external module `@boundaries/ui-kit` instead, so that `helper`, `data` and `contract` still cannot import it. The policy "shared and ui-kit never depend on a domain" keeps `shared`.
   - `package.json`: `@boundaries/ui-kit` with `workspace:*`. `project.json`: the lists of builds that `check:types`, `test:unit`, `dev` and `build` depend on gain `ui-kit`, and `build:playwright` and `check:pom-parity` follow what step 1 decides.
   - `src/playwright.ts` keeps exporting `Pom` and the four page objects, so that `packages/website` and `test/website-e2e` change nothing.
6. **Update the agent docs.** `packages/playground/AGENTS.md` (the tree, the `ui-kit-*` rows, "Stack", the `ThemeRoot` path in "Host contract"), a new `packages/ui-kit/AGENTS.md` with its `CLAUDE.md` that takes the facts of "Stack" about the theme, the root `AGENTS.md` (the list of packages), the `repo-architecture` skill (component map and dependency graph), the `paths` and the text of `.agents/rules/playground-components.md`, `playground-testing.md`, `typescript-conventions.md` and `unit-testing.md`, and a `README.md` for the package.

## Verification

- `pnpm nx run-many -t check:all --all` passes (criterion 3). It includes `test:unit` of `ui-kit`, `playground` and `website`, and `test:e2e` of `website-e2e`.
- `git diff origin/release -- '*.spec.ts' '*.spec.tsx'`, with renames followed, shows only import lines changed in the specs of the playground, of the website and of `test/website-e2e` (criterion 1). The PR says so with the command.
- `test ! -e packages/playground/src/ui-kit` and `grep -rn "@/ui-kit" packages/playground` prints nothing (criterion 2).
- `pnpm nx lint playground` fails on a temporary `helper` file that imports `@boundaries/ui-kit`, and `pnpm nx lint ui-kit` fails on a temporary atom that imports a molecule: the limits moved with the code.
- `pnpm nx check:types website` passes, which fails when two versions of a peer dependency are installed (`packages/playground/AGENTS.md`, "Stack").
- `pnpm nx dev playground` and the built website show the playground as on `release`, in both themes.

## Hand-offs

- To phase 6 (`06-graph-map.md`): the name `@boundaries/ui-kit`, its entries as merged (production, test support, Playwright), what each exports, its peer dependencies with their versions, and that a host mounts `ThemeRoot` once around each component.

## Open points

- **The entries of the package.** Not decided in the plan. Default, for the `architect` to confirm with the maintainer: three entries, as the playground has. `@boundaries/ui-kit` exports the components, the theme, the tones, their types and the constants that production code reads. `@boundaries/ui-kit/testing` exports the jsdom page objects, the base `Pom`, `renderInRoot` and `emittedStyle`, for specs only. `@boundaries/ui-kit/playwright` exports the Playwright page objects and their base, built apart by `build:playwright`. The alternative is to keep the page objects of the ui-kit in the playground, which leaves the package without its own specs.
- **Where the base `Pom` lives.** The page objects of the ui-kit extend it and a package cannot import from the playground. Default: `pom`, `renderInRoot` and `emittedStyle` move to the package, and `packages/playground/src/shared/testing/` keeps `inlineWorker` and `resizeObserver`, which no ui-kit file imports. Check each before moving it.
- **The Playwright bundle of the playground.** Its `build:playwright` fails on any bare import other than `@playwright/test` (`scripts/check-bundle-imports.js`), and depends on no build. Default: allow `@boundaries/ui-kit/playwright` there with `--allow`, as `packages/website/package.json` allows `@boundaries/playground/playwright`, and make it depend on the `build:playwright` of `ui-kit`.
- **The dependency on `@boundaries/design-tokens`.** `00-shared.md` and #687 say the package depends on it, but no file of the folder imports it: the host loads the tokens. Default: a devDependency only if a spec or a harness of the package loads the tokens, and the `README.md` says the host loads them. Ask the maintainer if a `dependencies` entry is wanted.
- **Whether the package is built.** Default: built with tsup and consumed through `workspace:*` and a build dependency, as every in-repo package is. The website bundles the built playground, which keeps `@boundaries/ui-kit` as an import, so the build of the playground depends on the build of `ui-kit`.
- **`.agents/rules/playground-components.md` and `playground-testing.md`.** Default: their `paths` gain `packages/ui-kit/src/...` and their text names both packages, in place of a second pair of rules.
