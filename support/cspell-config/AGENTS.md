# AGENTS Instructions — `@boundaries/repo-cspell-config`

Package-scoped agent instructions for `@boundaries/repo-cspell-config` (Nx project `cspell-config`). Intentionally minimal; will be enriched as this shared config grows.

Shared cspell config (`index.js` + `createConfig()`) consumed by every other project's `cspell.config.*` via `implicitDependencies`/`dependsOn` on its `cspell:config` target. Add project-wide dictionary words here rather than duplicating an ignore list per package.

Primary checks: `lint` (self-lints with `eslint`), `check:spell`.
