# Browser E2E Tests

This private project checks that the browser builds of `@boundaries/elements` and `@boundaries/config` return the same results in Chromium, Firefox and WebKit as their Node.js builds. Each package checks its own browser build on V8 with `node:vm` (its own `test:e2e` target); this project loads the packages together in real browsers, through their `browser` export condition, as the playground and any other browser consumer does.

## How it works

1. **Scenarios**: `src/scenarios/` defines them. Each one calls the packages and returns what they return. The same module runs in Node.js and in the browsers.
2. **Bundle**: the `build` target (`scripts/build.js`) bundles the scenarios with esbuild for browsers (`platform: "browser"`, without aliases or polyfills) into `dist/scenarios.js`, and copies `src/index.html`, the static page that loads it. The build fails if the bundle does not include the browser build of every package.
3. **Tests**: the `test:e2e` target installs the browsers of the `@playwright/test` version in the root `package.json` and runs `test/scenarios.spec.js`, one test per scenario and browser. Each test opens the page, runs the scenario in the browser and in Node.js, and compares both results.

A scenario whose browser result differs from the Node.js one fails with the scenario name, the browser, both results and their diff.

## Run tests

```bash
pnpm nx test:e2e browser-e2e
```

The first run downloads Chromium, Firefox and WebKit. On Linux, install their system dependencies once with `pnpm exec playwright install --with-deps chromium firefox webkit`.

A browser that does not launch on your machine does not fail the run: `test/global-setup.js` launches each browser once before the tests, prints why one does not launch, and its tests are skipped. When the `CI` environment variable is set, as in GitHub Actions, nothing is skipped, so a browser that does not launch fails its tests.

To run one browser, build the project and run Playwright from this folder:

```bash
pnpm nx build browser-e2e
pnpm exec playwright test --project=webkit
```

## Adding a scenario

1. Add an entry to the scenarios of the package in `src/scenarios/` (`elements.js`, `config.js`). Inputs that several packages share, such as the quick-start example of the docs, are in `src/scenarios/quick-start.js`.
2. `name` is unique and starts with the package name, such as `config: normalizeConfig of the quick-start example`. It is the title of the test.
3. `run` takes no arguments and returns only JSON values that depend on its inputs alone: no Node.js modules or globals, and nothing read from the environment, the clock or a random source, so that Node.js and every browser return the same.

To test a new package that runs in browsers, add it with `workspace:*` to `package.json`, add its name to `PACKAGES` in `scripts/build.js`, and add its scenarios module to `SCENARIOS` in `src/scenarios/index.js`.
