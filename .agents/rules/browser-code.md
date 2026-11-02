---
paths:
  - "packages/config/src/**/*.ts"
  - "packages/policies/src/**/*.ts"
  - "packages/elements/src/**/*.ts"
---

# Code that runs in browsers

`@boundaries/config`, `@boundaries/policies` and `@boundaries/elements` run in browsers as well as in Node.js. Browsers do not define the Node.js globals, such as `process` or `require`, so `src` never references one directly; the unit tests run only in Node.js and may use them. `createBrowserConfig` of `support/eslint-config/index.js`, which the `eslint.config.mjs` of each package calls, enforces it. `test/browser-e2e` runs the packages in Chromium, Firefox and WebKit; a new public function adds its scenario there (its `README.md`, "Adding a scenario").
