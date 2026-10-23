# Agent Guidelines

These instructions apply to all agent-driven changes in this repository.

## Language Policy

All repository artifacts must be written in English.

- Code, comments, test names and descriptions, documentation, and configuration messages must be in English.
- The agent can converse in other languages with users, but any output persisted to the repository (files, code, docs, test titles) must be in English.

## Repository Overview

This repository is a pnpm + Nx monorepo containing the `@boundaries` packages: two published libraries (`elements`, `eslint-plugin`), a Docusaurus website, examples, and shared support configs. Projects live under `packages/`, `examples/`, `support/`, and `test/`.

Each package's own `README.md` covers its functionality and usage for consumers. Agent-facing implementation guidance — layering, hard constraints, entry points — lives in that project's own `AGENTS.md` instead; see below.

## Where the rules live

- **Per-file-type conventions** (TypeScript `type`/`interface` usage, unit-test structure, ESLint rule authoring, Nx `project.json` shape, changelog/versioning, docs authoring) live in `.agents/rules/` (symlinked as `.claude/rules/`) and load automatically when an agent touches a matching file. Browse that directory for the current list — do not assume this file is exhaustive.
- **Each project's own layering and hard constraints** (e.g. `eslint-plugin`'s boundary-element types, `elements`' Descriptor/Matcher grid) live in **its own `AGENTS.md`** — load `<project>/AGENTS.md` before implementing or reviewing a change there.
- **Architecture that spans projects** (the dependency graph between packages, the Nx target graph) lives in the **[`repo-architecture` skill](./.agents/skills/repo-architecture/SKILL.md)** — load it before designing anything cross-package.
- **Long-form reference docs** (per-rule documentation, ADRs, the contributing workflow) live in **[`docs/`](./docs/)** — non-normative companions to the rules/skills above: when a `docs/` file and a rule or skill disagree, the rule/skill wins.
- **A project's own `eslint.config.*` is ground truth over prose** wherever this repo lint-enforces its own layering (it dogfoods `eslint-plugin-boundaries` on itself) — read the config for the exact policy in force rather than trusting a paraphrase.
- **Before implementing or proposing any change, read the related project's `AGENTS.md`.** If a change conflicts with it, either follow it or update it in the same change; do not silently diverge.
- PRs target the `release` branch. The branching model, merge strategy and release procedure are in `.github/CONTRIBUTING.md` (run releases with the `release` skill); changelog entries and version bumps follow `.agents/rules/changelog-and-versioning.md`.
- Plans for multi-step changes go in `.agents/plans/`, which is git-ignored; no committed file may depend on them. A plan that several sessions must share is committed on its feature branch through an explicit `.gitignore` exception and is removed before that branch merges into `release`.

## Commands

The repository uses `pnpm` and Nx. Projects share the same target names: `lint`, `check:types`, `check:spell`, `build`, `test:unit`, `test:mutation`, `test:e2e` and `check:all` (all the checks plus the build). Test targets exist only in the projects that define them.

```bash
# One project
pnpm nx <target> <project> --output-style=stream
# Every project that defines the target, dependencies first
pnpm nx run-many -t <target> --all
# One unit spec; --coverage=false makes any unit run faster
pnpm nx test:unit eslint-plugin <file-path-relative-to-package> --output-style=stream --coverage=false
# Install dependencies
pnpm install
```

- **Through Nx:** use it for `build`, `check:all`, and any time you can't be sure the dependency graph is fresh (after pulling, switching branches, before a commit/PR). Nx resolves task dependencies and caches results.
- **Directly in the package:** for a tight single-file loop once the relevant upstream build is fresh, run `cd packages/<package-name> && pnpm test:unit <file> --coverage=false`. It is faster and passes native flags straight through.

## After Making Changes

1. Lint the modified file: `pnpm nx lint <package-name> <path-to-modified-file> --output-style=stream --fix`.
2. Run tests for the modified file immediately after changes, with `--coverage=false` for speed during development (see `.agents/rules/unit-testing.md` for test conventions).
3. Run the full package suite once the focused test passes.
