---
name: repo-architecture
description: Cross-cutting architecture reference for the eslint-plugin-boundaries monorepo — the dependency graph between packages, the Nx target graph, and the release flow. Load before designing or reviewing anything that spans more than one project.
---

# eslint-plugin-boundaries repository architecture

This is a pnpm + Nx monorepo publishing `@boundaries/elements`, `@boundaries/eslint-plugin`, and the `jsboundaries.dev` documentation website. Its architecture is defined by each project's `AGENTS.md` plus this cross-cutting reference, not by convention alone.

## Where the rules live

- `<project>/AGENTS.md` is the source of truth for that project — every `packages/*`, `examples/*`, `support/*`, and `test/*` directory. Read the one(s) touching the area before making a judgment call.
- Per-file conventions live in `.agents/rules/[rule-name].md`. Read them when you need to know what's expected in a given file type — e.g. `.agents/rules/eslint-rule-authoring.md` when adding a rule to `eslint-plugin`.
- `packages/eslint-plugin/eslint.config.mjs` and `packages/elements/eslint.config.mjs` are where each package's internal layering becomes mechanically enforced (both dogfood `eslint-plugin-boundaries` on themselves) — treat them as ground truth over any prose description when the two disagree.
- Long-form reference docs (per-rule documentation, ADRs) live in `docs/` and `packages/website/docs/` — non-normative companions: rules/skills win on disagreement.

## Component map

| Directory | Nx project | Publishes | Role |
|---|---|---|---|
| `packages/elements` | `elements` | `@boundaries/elements` | Element descriptors and matchers — the classification engine `eslint-plugin` builds rules on |
| `packages/eslint-plugin` | `eslint-plugin` | `@boundaries/eslint-plugin` | The ESLint plugin itself: rules, settings parsing, messages |
| `packages/website` | `website` | (deployed, not published) | Docusaurus site for `jsboundaries.dev`; version kept in lockstep with `eslint-plugin` |
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

The one non-obvious edge: **`eslint-plugin` and `elements` both make their own `lint` target depend on `build`**, because each dogfoods its own compiled output (`eslint-local-rules.js` requires `./dist/index.js`) to lint its own source. A stale `dist/` means a `lint` run's boundary checks are stale too — Nx handles this automatically via the `dependsOn`, but be aware of it when reasoning about why a lint result did or didn't change.

## Release flow

Each package is versioned independently under semver — see `.agents/rules/changelog-and-versioning.md`. At a high level: `release` is the default PR base branch (PRs squash-merge into it); a maintainer periodically opens a PR from `release` to `main` (merge-commit strategy) to cut a release, tags each modified package as `<package-name>-vX.Y.Z`, and publication to npm happens automatically once a GitHub release is created. Full detail lives in `.github/CONTRIBUTING.md`.

**Known inconsistency, not yet resolved:** `.github/CONTRIBUTING.md` and `nx.json`'s `defaultBase` disagree on the stable branch name (`main` vs `master`), and `README.md`/`.github/PULL_REQUEST_TEMPLATE.md` mostly link via `master`. Don't silently pick one when it matters — flag it.
