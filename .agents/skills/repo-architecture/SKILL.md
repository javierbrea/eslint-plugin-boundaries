---
name: repo-architecture
description: Cross-cutting architecture reference for the eslint-plugin-boundaries monorepo — the dependency graph between packages and the Nx target graph. Load before designing or reviewing anything that spans more than one project.
---

# eslint-plugin-boundaries repository architecture

This is a pnpm + Nx monorepo publishing `@boundaries/elements`, `@boundaries/eslint-plugin`, and the `jsboundaries.dev` documentation website. Its architecture is defined by each project's `AGENTS.md` plus this cross-cutting reference, not by convention alone.

## Where the rules live

The map of where each kind of rule lives is in the root `AGENTS.md`; read the `AGENTS.md` of the project you touch. `eslint-plugin` and `website` lint-enforce their own layering (their `eslint.config.mjs`, ground truth over prose); `elements`' layering is described in its `AGENTS.md`.

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

- **`elements` has no in-repo dependencies.** `eslint-plugin` depends on it for classification. `eslint-plugin-e2e`, both `examples/*` and `website` depend on the *built* `eslint-plugin` (via Nx's `dependsOn: ["build"]` / `["^build"]` and a `workspace:` dependency, never a published version).
- **`support/eslint-config` and `support/cspell-config` are depended on by every project** via `implicitDependencies` in each `project.json`, and via each project's own `lint`/`check:spell` target depending on that support package's `eslint:config`/`cspell:config` target.
- **`website` is downstream of `eslint-plugin`** conceptually (it documents the plugin's current API and versions its docs alongside plugin releases) and lints its own `src/` with it, so its `lint` builds `eslint-plugin` first — keep `packages/website/docs/rules/` in sync with `eslint-plugin` changes manually.
- Run `pnpm nx graph` to see the live dependency graph rather than trusting this table if it's unclear whether it's stale.

## Nx target graph

The standardized target names are listed in the root `AGENTS.md` ("Commands"). They get common defaults from `nx.json`'s `targetDefaults` and are overridden per-project in `project.json` only where a project's needs diverge; `.agents/rules/nx-project-config.md` covers that override mechanism and why it matters for caching.

Only `eslint-plugin` and `eslint-plugin-e2e` make `lint` depend on their own `build`; each project's `AGENTS.md` says why.
