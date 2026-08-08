# AGENTS Instructions — `@boundaries/eslint-plugin-e2e`

Package-scoped agent instructions for `@boundaries/eslint-plugin-e2e` (Nx project `eslint-plugin-e2e`). Intentionally minimal; will be enriched as this suite grows.

Runs `test/e2e.spec.js`, a plain Node script (not Jest), against the built `eslint-plugin` — its `test:e2e` target depends on `build`. `test:performance` is gated behind the `RUN_PERFORMANCE_TESTS` environment variable and is skipped otherwise.

Primary checks: `lint`, `test:e2e`.
