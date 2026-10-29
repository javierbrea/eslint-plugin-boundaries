# AGENTS Instructions — `@boundaries/example-typescript`

Package-scoped agent instructions for `@boundaries/example-typescript` (Nx project `example-typescript`). Intentionally minimal; will be enriched as this example grows.

A minimal TypeScript project demonstrating `eslint-plugin-boundaries` configuration; its `lint` target depends on `eslint-plugin`'s `build`, so it always lints against the current plugin source, not a published version.

Primary checks: `lint`.
