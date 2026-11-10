<!-- cspell:disable -->
# Phase 9: Playwright page objects owned by the components

Goal: the playground and the website each export Playwright page objects from a `./playwright` entry, built apart from their production code. In the playground they sit beside the jsdom page objects and a parity script checks them against those; lint and an agent rule keep both families in shape. This phase builds the mechanism and the page objects of the two roots, the `Playground` component and the website page that hosts it; phase 10 adds the page objects its specs need, with the specs.

Issue: #640, its first pull request; phase 10 closes it. Branch `test/640/playwright-page-objects` from `feat/539/playground`; PR into `feat/539/playground`, title `test(playground): add Playwright page objects owned by the components`, with `Part of #640` and no `closes` line. Changelog: none for test code (`.agents/rules/changelog-and-versioning.md`); a `chore` entry in `packages/website/CHANGELOG.md` only if the phase changes a file the website deploys, such as `docusaurus.config.ts`. The PR description shows the parity check failing on a member that the jsdom sibling lacks and passing with the exception comment, and the closure check failing on a forbidden import.

Read first:

- Decision 22 of the index and issue #640: they fix the design, and this file does not reopen it.
- `.agents/rules/playground-testing.md` and the jsdom base in `packages/playground/src/shared/testing/pom/` (`pom.ts`, `pom.types.ts`): the Playwright base mirrors its options and members.
- `packages/playground/AGENTS.md` ("Host contract" for the entries and where each one runs, "Layering" for the `testing` element) and `packages/playground/eslint.config.mjs` (the `pom` and `constants` file categories and the rules that limit what a page object imports).
- `packages/playground/package.json`, `tsup.config.js`, `project.json`, `jest.config.cjs` and the `tsconfig*.json` files: the build, the coverage exclusions and the type check that the new files join.
- `packages/website/AGENTS.md`, `packages/website/eslint.config.mjs` (element types, `boundaries/no-unknown-files` on), `docusaurus.config.ts` and `src/pages/playground.tsx`.
- `.agents/rules/nx-project-config.md` and the `targetDefaults` of `nx.json`, for the two new targets.
- [Playwright locators](https://playwright.dev/docs/locators) and [auto-waiting](https://playwright.dev/docs/actionability).

Preconditions: phase 8 merged.

## Scope

In: the Playwright base, the two `./playwright` entries and their builds, the closure check of their output, the parity check, the lint of the Playwright files, the page objects of the two roots, the page object part of the agent rule and the `AGENTS.md` updates. Out, for phase 10: the `website-e2e` project, every spec, CI, and the other page objects, each added with the spec that reaches it.

## Steps

### Playwright base

1. `packages/playground/src/shared/testing/pom/pom.playwright.ts` and `pom.types.playwright.ts`: an abstract `Pom` whose root is a lazy `Locator`, so that building a page object touches no browser and a parent can hand out a child before it mounts. Its options are those of the jsdom base (`testId`, `name`, `index`, `containing`, `parent`, `root`, `portal`) plus a required `page`. Its members are those of the jsdom base that have a Playwright equivalent: `defaultTestId`, `findRoot` by test id filtered by `containing` and picked by `index`, `findRootBySelector`, `childPom` and `isRendered`. A value getter reads once and never waits; a spec that asserts a value that settles uses a locator getter with a web-first assertion, or `expect.poll`. Every member has TSDoc, as in the jsdom base.
2. The jsdom base and its barrel stay as they are: `src/shared/testing/pom/index.ts` exports nothing of the Playwright family, so that Jest never loads `@playwright/test`.

### The playground entry

3. `packages/playground/src/playwright.ts` re-exports the Playwright base, for the website's page objects to extend, and each Playwright page object, by file. `package.json` gets `exports["./playwright"]`, with `types` and `import` in `dist-playwright/`.
4. A `build:playwright` target builds that entry alone into `dist-playwright/`, with `outputs` and `inputs` as `.agents/rules/nx-project-config.md` asks. It is not part of `build`, so that the production build of the website never waits for it. Git, ESLint and cspell ignore `dist-playwright/` as they ignore `dist/` (the root `.gitignore` pattern `dist` does not match it).
5. A closure check, a script that `build:playwright` runs after the build, fails when the output imports a bare specifier other than `@playwright/test`. A Playwright page object imports only `@playwright/test`, other Playwright page objects, the Playwright base and `X.constants.ts` files, and a constants file that imports anything else is caught here.
6. `jest.config.cjs` leaves `src/**/*.pom.playwright.ts` and `src/playwright.ts` out of coverage. `check:types` covers them with the types of `@playwright/test`, a root devDependency (decision 11); the package declares it at the root's exact version only if pnpm does not resolve it otherwise.

### Lint

7. `packages/playground/eslint.config.mjs`: a file category for `src/**/*.pom.playwright.ts` and the Playwright base, and one for the entry `src/playwright.ts`. A Playwright page object imports only what step 5 lists; the entry imports only Playwright page objects and the base; no other file imports either (production code, specs, jsdom page objects, mocks). `no-restricted-syntax` or `no-restricted-properties` forbid the fixed waits: `waitForTimeout`, `waitForSelector`, `waitForFunction` and `networkidle`.
8. `packages/playground/AGENTS.md`: the third entry, `@boundaries/playground/playwright`, runs in Node.js inside the Playwright runner, never in a host, and loads no React, MUI or component; the layering section names the new categories.

### Parity check

9. `scripts/check-pom-parity.js`, with the TypeScript compiler API: for every `*.pom.playwright.ts` under `packages/playground/src`, the sibling `X.pom.ts` exists, both export the same class names, and every public instance member of a Playwright class is a member of the jsdom class of the same name, unless the line before it is a `// pom-parity: <reason>` comment. A `check:pom-parity` target of `playground` runs it, and the `check:all` of `playground` depends on it. With no Playwright page object it passes.

### Website

10. A page object of the website lives beside the component it describes, as `X.pom.playwright.ts`, and extends the base of `@boundaries/playground/playwright`. Docusaurus makes a route of every file under `src/pages/` that the `exclude` of its pages plugin misses, and the defaults of 3.10.2 are `**/_*.{js,jsx,ts,tsx,md,mdx}`, `**/_*/**`, `**/*.test.{js,jsx,ts,tsx}` and `**/__tests__/**`. The page object of `playground.tsx` therefore needs either that option to add `**/*.playwright.ts` to the defaults, or another place (open point).
11. `packages/website/src/playwright.ts`, `exports["./playwright"]` in its `package.json`, a `build:playwright` target and the closure check, as in steps 3 to 5, with `@boundaries/playground/playwright` external and allowed next to `@playwright/test`. The website's `check:types` and `lint` cover the new files, and `eslint.config.mjs` classifies them with the import limits of the playground's.
12. `packages/website/AGENTS.md`: the `./playwright` entry, where its page objects live, and why none of them may become a route.

### The root page objects

13. `Playground` (`packages/playground/src/app/`): a Playwright page object beside `Playground.pom.ts`, mirroring the members that phase 10 needs first. The website page (`src/pages/playground.tsx`): the note at narrow widths, the loading box, and the `Playground` page object as a child. Each one is exported from its entry.

### Agent rule

14. `.agents/rules/playwright-testing.md`, with `paths` `packages/*/src/**/*.playwright.ts`, `packages/*/src/playwright.ts` and `test/website-e2e/**`: where a Playwright page object goes, what it imports, the parity rule and its exception comment, value getters that never wait, the entry that exports each one, the closure check, and the route exclusion of the website. Phase 10 adds the sections on specs, determinism and running.
15. `.agents/rules/playground-testing.md` says that a component a browser spec reaches also has a Playwright page object, and points to the new rule. The root `AGENTS.md` ("Commands") lists `build:playwright` and `check:pom-parity`. The `repo-architecture` skill records the two entries and that the `build:playwright` of `website` depends on that of `playground`.

## Verification

- `pnpm nx check:all playground` and `pnpm nx check:all website` pass, `check:pom-parity` included.
- `pnpm nx build:playwright playground` and `pnpm nx build:playwright website` build and pass their closure checks; an import of `react` added to a page object fails the check (shown in the PR, not committed).
- A member added to the Playwright page object of `Playground` that its jsdom sibling lacks fails `check:pom-parity`, and a `// pom-parity:` comment over it makes it pass (shown in the PR, not committed).
- `pnpm nx build website` produces the same routes as on `feat/539/playground` before the phase.
- `pnpm nx run-many -t check:all --all` passes.

## Hand-offs

- To phase 10, as the implementation left them: the import paths of the two entries, the options of the base (`page` required), the names of the two root page objects, how a page object is added (sibling file, entry export, parity), and the rule file whose spec sections phase 10 writes.

## Open points

- Where the page object of `src/pages/playground.tsx` lives. Default: beside it, with `**/*.playwright.ts` added to the `exclude` of the pages plugin in `docusaurus.config.ts`, keeping the default globs.
- `eslint-plugin-playwright` instead of plain `no-restricted-*` rules for the fixed waits. Default: the plain rules; a new dependency only if the maintainer agrees.
- The build tool of the entries. Default: tsup with `@playwright/test` external, as the `build` of the playground; `tsc` with an alias rewrite if tsup cannot emit the types of the entry.
