---
paths:
  - "packages/config/src/**/*.ts"
  - "packages/elements/src/**/*.ts"
---

# Code that runs in browsers

`@boundaries/config` and `@boundaries/elements` run in browsers as well as in Node.js. Browsers do not define the Node.js globals, such as `process` or `require`, so the code of these packages never references one directly: the reference throws a `ReferenceError` in browsers. The unit tests run only in Node.js and may use them.
