# AGENTS Instructions — `@boundaries/website-e2e`

Package-scoped agent instructions for `@boundaries/website-e2e` (Nx project `website-e2e`).

Sanity suite of the website and the playground: `@playwright/test` in Chromium, in a `desktop` project (1440×900) and a `narrow` one (390×844), against the production build of `packages/website` that `docusaurus serve` serves on a fixed port. What it covers, how to run it and how to read a failure: `README.md`. How a spec and a page object are written: `.agents/rules/playwright-testing.md`.

- Page objects never live in this project (the rule says where they go). The checks of the playground in detail stay in its jsdom specs; a spec here checks what only a browser shows.
- The suite serves `packages/website/build` as it is: `pnpm nx test:e2e website-e2e` builds the site and both entries first (the `repo-architecture` skill), while `playwright test` run in this folder does not.
- `test:e2e` needs Chromium, so every CI job that runs this project installs the browsers first with `.github/actions/install-browsers`: the `test-browsers` job of `.github/workflows/build.yml` and the publish jobs, which run `pnpm check:all`. The `build` job leaves the project out.
- The narrow spec recognizes the chunk of the playground by `PLAYGROUND_CHUNK_MARKER` of `test/support/script-responses.ts`, whose TSDoc says why it stays true.

Primary checks: `lint`, `check:types`, `test:e2e`.
