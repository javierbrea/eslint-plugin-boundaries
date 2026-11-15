# AGENTS Instructions — `@boundaries/repo-eslint-config`

Package-scoped agent instructions for `@boundaries/repo-eslint-config` (Nx project `eslint-config`). Intentionally minimal; will be enriched as this shared config grows.

Shared ESLint flat config (`index.js`) consumed by the root `eslint.config.js` and by the `eslint.config.*` of every other project except the `examples/`, via `implicitDependencies`/`dependsOn` on its `eslint:config` target. A change here affects all those lint runs — verify with `pnpm nx run-many -t lint --all` and the root `pnpm lint` after editing.

Primary checks: `lint` (self-lints with `eslint`), `check:spell`.
