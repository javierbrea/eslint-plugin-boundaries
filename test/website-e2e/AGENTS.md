# AGENTS Instructions — `@boundaries/website-e2e`

Package-scoped agent instructions for `@boundaries/website-e2e` (Nx project `website-e2e`).

Sanity suite of the website and the playground: `@playwright/test` in Chromium, in a `desktop` project (1440×900) and a `narrow` one (390×844), against the production build of `packages/website` that `docusaurus serve` serves on a fixed port. What it covers, how to run it and how to read a failure: `README.md`.

- A spec reaches the page only through page objects and holds no locator or selector. Page objects never live in this project: each lives beside its component, as `X.pom.playwright.ts`, in `packages/playground` or `packages/website`, and `.agents/rules/playwright-testing.md` says how it is written. A spec that needs a component without a page object adds it there, in the same change.
- `eslint.config.js` forbids the fixed waits in every file, and the page methods that take a selector or return a locator in the specs. It recognizes a page by the name of the variable that holds it: `page`, `popup` or a name ending in `Page`. A page object whose variable ends in `Page`, such as `playgroundPage`, has no member named like one of those methods.
- A spec imports `test` and `expect` from `test/fixtures.ts`, never from `@playwright/test`. The `pageErrors` fixture fails every test on a console error or a page error, except the ones that `test/support/page-errors.ts` lists; a new exception goes there, never in a spec.
- A spec that needs the panes of the playground is tagged `{ tag: "@desktop" }` and `playwright.config.ts` skips it in `narrow`; one that needs the narrow page is tagged `@narrow` and skipped in `desktop`. An untagged spec runs in both.
- A value that settles is awaited with a waiting method of a page object or with `expect.poll` over a value getter, never with a fixed wait. A test that passes only on retry is a defect to fix, not a reason for another retry, a longer timeout or a wait: CI retries once only to keep a trace.
- `test:e2e` depends on the `build` of `website` and the `build:playwright` of `playground` and `website`; `lint` and `check:types` depend on the two `build:playwright`, since they resolve the imports of the two entries.
- `test:e2e` needs Chromium, so every CI job that runs this project installs the browsers first with `.github/actions/install-browsers`: the `test-browsers` job of `.github/workflows/build.yml` and the publish jobs, which run `pnpm check:all`. The `build` job leaves the project out.
- The narrow spec recognizes the chunk of the playground by the class of its root element, `PLAYGROUND_CHUNK_MARKER` in `test/support/script-responses.ts`, which no other script of the site holds. The `@desktop` control spec finds it on a wide screen, so renaming the class fails that spec instead of turning the narrow one into a test that cannot fail.

Primary checks: `lint`, `check:types`, `test:e2e`.
