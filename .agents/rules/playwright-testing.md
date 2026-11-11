---
paths:
  - "packages/*/src/**/*.playwright.ts"
  - "packages/*/src/playwright.ts"
  - "test/website-e2e/**"
---

# Playwright page objects and browser specs

The browser specs of `test/website-e2e` reach the page only through Playwright page objects, which the components own: a change in the DOM of a component updates the page objects in its folder and no spec. The import limits and the wait guards below are enforced by the `eslint.config.mjs` of `packages/playground` and `packages/website` and by `test/website-e2e/eslint.config.js`.

## Where a page object goes

- A component of `packages/playground` that a browser spec reaches has `X.pom.playwright.ts` beside its jsdom `X.pom.ts` (`.agents/rules/playground-testing.md`), with the same class names and a subset of their public members.
- A page object of `packages/website` lives beside the component or page it describes, as `X.pom.playwright.ts`, and has no jsdom sibling; one under `src/pages/` or `src/theme/` stays clear of the files that Docusaurus turns into routes or components, as `packages/website/AGENTS.md` says. A component that Docusaurus renders and the site does not own, such as the navbar or `@docusaurus/Link`, gets its page object in `src/theme/<Component>/<Component>.pom.playwright.ts`.
- Each page object is exported by file from the `src/playwright.ts` of its package: `@boundaries/playground/playwright` and `website/playwright`.
- `build:playwright` builds each entry into `dist-playwright/`, apart from the production build, and `scripts/check-bundle-imports.js` fails it when the output imports anything but `@playwright/test`, plus `@boundaries/playground/playwright` in the website.

## What a page object imports

- `@playwright/test`, other Playwright page objects, the Playwright base and `X.constants.ts` files; a website page object imports the base and the playground's page objects from `@boundaries/playground/playwright`. A child it needs gets its own Playwright page object, never a copy of a query that another element's page object owns.
- The entry bundles the constants files that a page object imports, so a page object imports only constants files that reach nothing the closure check refuses; lint holds a constants file to the limits of its element, not to those of the Playwright files.
- The entry imports only page objects, and the base in the playground. Nothing else imports a Playwright file or `@playwright/test`: production code, jsdom page objects, specs and mocks never do.

## The base

`packages/playground/src/shared/testing/pom/pom.playwright.ts` is the base of every Playwright page object, the website's included; its TSDoc documents each member, and the TSDoc of `pom.types.playwright.ts` each option. It mirrors the jsdom base with a lazy `Locator` as the root: the options are those of the jsdom base plus a required `page`, which `childPom` passes to a child with its `parent`, and building a page object touches no browser. The jsdom barrel `src/shared/testing/pom/index.ts` exports nothing of it, so that Jest never loads `@playwright/test`.

## Parity with the jsdom page object

- `check:pom-parity` of `playground` (`scripts/check-pom-parity.js`, part of its `check:all`) fails when an `X.pom.playwright.ts` has no `X.pom.ts` beside it, when the two export different page object class names, when a Playwright class and the jsdom class of the same name extend different classes, or when the Playwright class declares a public member that the jsdom class lacks, declared or inherited. Members are compared by name, since the Playwright ones are async, and what a Playwright class inherits is not compared.
- A member that only a browser can have is marked by a `// pom-parity: <reason>` line right above it, above its TSDoc block, with the reason.

## Values and waits

- A value getter returns a promise, reads once and never waits, such as `isRendered`. It reads through methods that do not wait for their element, such as `readText` and `readAttribute` of the base, `count()`, `isVisible()` or `evaluateAll()`, never through one that does, such as `textContent()`, `getAttribute()` or `inputValue()`.
- A method that waits for a state uses a web-first assertion on a locator, `locator.waitFor()` or `expect.poll` over value getters. A spec waits the same way, through a waiting method of a page object or `expect.poll` over a value getter.
- A fixed wait (`waitForTimeout`, or a sleep through `setTimeout`, `setInterval` or `node:timers`), a wait on a selector or a function (`waitForSelector`, `waitForFunction`) and the `networkidle` load state are lint errors in every Playwright file and every file of `test/website-e2e`, through `createFixedWaitConfig` of `support/eslint-config`.
- A test that passes only on retry is a defect to fix where it is nondeterministic, never a reason for another retry, a longer timeout or a wait. CI retries once only to keep a trace.

## Specs

- A spec of `test/website-e2e/test/` imports `test` and `expect` from `test/fixtures.ts`, never from `@playwright/test`. The fixtures give the root page objects and the records of what the pages do, such as the scripts they request and the web workers they start.
- A file of `test/website-e2e` imports, of the workspace packages, only `@boundaries/playground/playwright` and `website/playwright`, never by a relative path: its `lint` and `check:types` build those two entries and nothing else.
- A file of `test/website-e2e/test/` (a spec, the fixtures or a support file) drives the page (`goto`, `reload`, `addInitScript`) but never queries it: no locator, selector or DOM query. A component that a spec needs without a page object gets one beside it in the same change. Lint recognizes a page by the name of the variable that holds it (`page`, `popup` or a name ending in `Page`), so a page object held in such a variable has no member named like a page method.
- A spec opens another tab or a context with empty storage through a fixture that returns the page object of the page it opened, never as a `Page` of its own.
- A spec follows a link of the site through the `follow()` of a website link page object, which waits for the page to hydrate, so that the router of the site makes the navigation. A spec that claims a page logs no error waits for the hydration first.
- The `pageErrors` fixture fails every test on a console error or a page error. An error the site makes on purpose is excused in `test/support/page-errors.ts`, never in a spec.
- A spec that needs the panes of the playground is tagged `{ tag: "@desktop" }`, and one that needs the narrow page `{ tag: "@narrow" }`; `playwright.config.ts` skips each in the other project, and an untagged spec runs in both.
- Every assertion can fail: a spec that checks that something does not happen has a control that sees it happen under the opposite condition, and one that checks that a project came from a link starts from a state where another project would show instead.

## Running the suite

`pnpm nx test:e2e website-e2e` builds the site and both `./playwright` entries and runs every spec; `test/website-e2e/README.md` says how to run one spec or one project, and how to read a failure.
