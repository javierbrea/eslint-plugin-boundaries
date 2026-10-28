# AGENTS Instructions — `@boundaries/browser-e2e`

Package-scoped agent instructions for `@boundaries/browser-e2e` (Nx project `browser-e2e`).

Runs the scenarios of `src/scenarios/` in Node.js and, bundled by `scripts/build.js`, in Chromium, Firefox and WebKit with `@playwright/test`, and requires every browser to return the Node.js result. How it works and how to add a scenario or a package: `README.md`.

- `src/` runs in Node.js and in the browsers, so it never uses a Node.js module or global: `eslint.config.js` forbids the globals, and the bundle fails on Node.js modules. A scenario returns JSON values that depend on its inputs alone.
- The bundle is built without aliases, polyfills or `define`s, and includes the browser build of every package in `PACKAGES` of `scripts/build.js`. A package that fails here is fixed in the package, never with one of those.
- `test:e2e` needs the browsers and their system dependencies, so CI runs this project in the `test-browsers` job of `.github/workflows/build.yml` and leaves it out of the `build` job.

Primary checks: `lint`, `check:types`, `test:e2e`.
