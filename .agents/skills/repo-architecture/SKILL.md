---
name: repo-architecture
description: Cross-cutting architecture reference for the eslint-plugin-boundaries monorepo — the dependency graph between packages, the Nx target graph, and the release flow. Load before designing or reviewing anything that spans more than one project.
---

# eslint-plugin-boundaries repository architecture

This is a pnpm + Nx monorepo publishing `@boundaries/elements`, `@boundaries/eslint-plugin`, and the `jsboundaries.dev` documentation website. Its architecture is defined by each project's `AGENTS.md` plus this cross-cutting reference, not by convention alone.

## Where the rules live

The map of where each kind of rule lives is in the root `AGENTS.md`; read the `AGENTS.md` of the project you touch. Only `eslint-plugin` lint-enforces its own layering (`packages/eslint-plugin/eslint.config.mjs`, ground truth over prose); `elements`' layering is described in its `AGENTS.md`.

## Component map

| Directory | Nx project | Publishes | Role |
|---|---|---|---|
| `packages/elements` | `elements` | `@boundaries/elements` | Element descriptors and matchers — the classification engine `eslint-plugin` builds rules on |
| `packages/eslint-plugin` | `eslint-plugin` | `@boundaries/eslint-plugin` | The ESLint plugin itself: rules, settings parsing, messages |
| `packages/website` | `website` | (deployed, not published) | Docusaurus site for `jsboundaries.dev`; versioning in its `AGENTS.md` |
| `examples/typescript` | `example-typescript` | (not published) | Minimal TypeScript project consuming the plugin, built against current source |
| `examples/oxlint-integration` | `example-oxlint-integration` | (not published) | Demonstrates pairing the plugin with Oxlint |
| `support/eslint-config` | `eslint-config` | `@boundaries/repo-eslint-config` | Shared ESLint flat config every project's `eslint.config.*` composes |
| `support/cspell-config` | `cspell-config` | `@boundaries/repo-cspell-config` | Shared cspell config every project's `cspell.config.*` composes |
| `test/eslint-plugin-e2e` | `eslint-plugin-e2e` | (not published) | Plain-Node end-to-end suite against the built plugin |

## Dependency graph and direction

- **`elements` has no in-repo dependencies.** `eslint-plugin` depends on it for classification. `eslint-plugin-e2e` and both `examples/*` depend on the *built* `eslint-plugin` (via Nx's `dependsOn: ["build"]` / `["^build"]`, not a published version).
- **`support/eslint-config` and `support/cspell-config` are depended on by every project** via `implicitDependencies` in each `project.json`, and via each project's own `lint`/`check:spell` target depending on that support package's `eslint:config`/`cspell:config` target.
- **`website` is downstream of `eslint-plugin`** conceptually (it documents the plugin's current API and versions its docs alongside plugin releases) but has no Nx build dependency on it — keep `packages/website/docs/rules/` in sync with `eslint-plugin` changes manually.
- Run `pnpm nx graph` to see the live dependency graph rather than trusting this table if it's unclear whether it's stale.

## Nx target graph

Standardized target names (`lint`, `check:types`, `check:spell`, `build`, `test:unit`, `test:mutation`, `test:e2e`, `check:all`) are defined with common defaults in `nx.json`'s `targetDefaults`, and overridden per-project in `project.json` only where a project's needs diverge — see `.agents/rules/nx-project-config.md` for what that override mechanism looks like and why it matters for caching.

The one non-obvious edge: **`eslint-plugin` makes its own `lint` target depend on `build`**, because it dogfoods its own compiled output (`eslint-local-rules.js` requires `./dist/index.js`) to lint its own source. A stale `dist/` means a `lint` run's boundary checks are stale too — Nx handles this automatically via the `dependsOn`, but be aware of it when reasoning about why a lint result did or didn't change.

## Release flow

Packages are versioned independently (`.agents/rules/changelog-and-versioning.md`). PRs target `release`, and releases merge `release` into `master`; the procedure is in `.github/CONTRIBUTING.md` and the `release` skill runs it.

The stable branch is `master`: the remote, the CI workflows, and `nx.json`'s `defaultBase` use it.
