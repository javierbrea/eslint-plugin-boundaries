---
paths:
  - "packages/*/src/**/*.playwright.ts"
  - "packages/*/src/playwright.ts"
---

# Playwright page objects

The browser specs reach the page only through Playwright page objects, which the components own: a change in the DOM of a component updates the page objects in its folder and no spec. The import limits and the wait guards below are enforced by the `eslint.config.mjs` of `packages/playground` and `packages/website`.

## Where a page object goes

- A component of `packages/playground` that a browser spec reaches has `X.pom.playwright.ts` beside its jsdom `X.pom.ts` (`.agents/rules/playground-testing.md`), with the same class names and a subset of their public members.
- A page object of `packages/website` lives beside the component or page it describes, as `X.pom.playwright.ts`, and has no jsdom sibling; one under `src/pages/` stays out of the routes as `packages/website/AGENTS.md` says.
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

- A value getter returns a promise, reads once and never waits, such as `isRendered`.
- A method that waits for a state uses a web-first assertion on a locator, `locator.waitFor()` or `expect.poll` over value getters. A fixed wait (`waitForTimeout`), a wait on a selector or a function (`waitForSelector`, `waitForFunction`) and the `networkidle` load state are lint errors.
