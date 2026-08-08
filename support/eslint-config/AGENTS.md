# AGENTS Instructions — `@boundaries/repo-eslint-config`

Package-scoped agent instructions for `@boundaries/repo-eslint-config` (Nx project `eslint-config`). Intentionally minimal; will be enriched as this shared config grows.

Shared ESLint flat config (`index.js`) consumed by every other project's `eslint.config.*` via `implicitDependencies`/`dependsOn` on its `eslint:config` target. A change here affects every project's lint run — verify with `pnpm nx run-many -t lint --all` after editing.

Primary checks: `lint` (self-lints with `eslint`), `check:spell`.
