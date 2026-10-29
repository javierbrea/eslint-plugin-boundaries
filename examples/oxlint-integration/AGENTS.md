# AGENTS Instructions — `@boundaries/example-oxlint-integration`

Package-scoped agent instructions for `@boundaries/example-oxlint-integration` (Nx project `example-oxlint-integration`). Intentionally minimal; will be enriched as this example grows.

Demonstrates configuring `eslint-plugin-boundaries` alongside Oxlint (`oxlint.config.ts`); its `lint` target depends on `eslint-plugin`'s `build`, so it always lints against the current plugin source, not a published version.

Primary checks: `lint`.
