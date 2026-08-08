# Agent Guidelines

These instructions apply to all agent-driven changes in this repository.

## Language Policy

**CRITICAL:** All repository artifacts must be written in English.

- Code, comments, test names and descriptions, documentation, and configuration messages must be in English.
- The agent can converse in other languages with users, but any output persisted to the repository (files, code, docs, test titles) must be in English.

## Repository Overview

This repository is a pnpm + Nx monorepo containing the `@boundaries` packages: two published libraries (`elements`, `eslint-plugin`), a Docusaurus website, examples, and shared support configs. Projects live under `packages/`, `examples/`, `support/`, and `test/`.

Each package's own `README.md` covers its functionality and usage for consumers. Agent-facing implementation guidance — layering, hard constraints, entry points — lives in that project's own `AGENTS.md` instead; see below.

## Where the rules live

- **Per-file-type conventions** (TypeScript `type`/`interface` usage, unit-test structure, ESLint rule authoring, Nx `project.json` shape, changelog/versioning, docs authoring) live in `.agents/rules/` (symlinked as `.claude/rules/`) and load automatically when an agent touches a matching file. Browse that directory for the current list — do not assume this file is exhaustive.
- **Each project's own layering and hard constraints** (e.g. `eslint-plugin`'s boundary-element types, `elements`' Descriptor/Matcher grid) live in **its own `AGENTS.md`** — load `<project>/AGENTS.md` before implementing or reviewing a change there.
- **Architecture that spans projects** (the dependency graph between packages, the Nx target graph, the release flow) lives in the **[`repo-architecture` skill](./.agents/skills/repo-architecture/SKILL.md)** — load it before designing anything cross-package.
- **Long-form reference docs** (per-rule documentation, ADRs, the contributing workflow) live in **[`docs/`](./docs/)** — non-normative companions to the rules/skills above: when a `docs/` file and a rule or skill disagree, the rule/skill wins.
- **A project's own `eslint.config.*` is ground truth over prose** wherever this repo lint-enforces its own layering (it dogfoods `eslint-plugin-boundaries` on itself) — read the config for the exact policy in force rather than trusting a paraphrase.
- **Before implementing or proposing any change, read the related project's `AGENTS.md`.** If a change conflicts with it, either follow it or update it in the same change; do not silently diverge.
- Conventions that live only in **[`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md)** and aren't restated here: `release` is the default PR base branch, PRs squash-merge into `release` and merge-commit from `release` into `main`, and every PR adds a `CHANGELOG.md` entry under "unreleased" (see `.agents/rules/changelog-and-versioning.md`).

## Essential Commands

The repository uses `pnpm` as the package manager, and `nx` as the build system. Package task names are standardized across the repository. This means that commands for building, testing, linting, and formatting are consistent.

To run commands for a specific package, use the following format:

```bash
pnpm nx <task> <package-name> --output-style=stream 
```

Example:

```bash
pnpm nx test:unit eslint-plugin --output-style=stream
```

### Running Tests

**Run unit tests with coverage:**
```bash
pnpm nx test:unit eslint-plugin --output-style=stream
```

**Run tests without coverage (faster for development):**
```bash
pnpm nx test:unit eslint-plugin --output-style=stream --coverage=false
```

**Run tests for specific file:**
```bash
pnpm nx test:unit eslint-plugin <file-path-relative-to-package> --output-style=stream --coverage=false
```

Package task names are standardized across the repository. The following are the most common tasks:

* `lint`: Lints the package.
* `check:types`: Checks the TypeScript types in the package.
* `check:spell`: Checks the spelling in the package.
* `build`: Builds the package.
* `test:unit`: Runs the unit tests.
* `test:mutation`: Runs the mutation tests.
* `test:e2e`: Runs the end-to-end tests.
* `check:all`: Run all the checks and build the package.

### Running a task in all packages

To run a task in all packages, use the following syntax: `pnpm nx run-many <task> --all`. For example, to run the unit tests in all packages, use the following command:

```bash
pnpm nx run-many -t test:unit --all
```

This will run the `test:unit` task in all packages and also the corresponding dependencies, in the right order, so everything is built and tested correctly.

### Running check in all packages
To run all the checks in all packages, use the following command:

```bash
pnpm nx run-many -t check:all --all
```

## Monorepo commands: Nx vs. direct

- **Go through Nx** (`pnpm nx <target> <package> --output-style=stream`, or `pnpm nx run-many -t <target> --all`) for `build`, `check:all`, and any time you can't be sure the dependency graph is fresh (after pulling, switching branches, before a commit/PR). Nx resolves task dependencies and caches results.
- **Call the tool directly in the package** (`cd packages/<package-name> && pnpm test:unit <file> --coverage=false`) for a tight single-file lint/test loop once the relevant upstream build is fresh — it's faster and passes native flags straight through.

## After Making Changes

1. Lint the modified file: `pnpm nx lint <package-name> <path-to-modified-file> --output-style=stream --fix`.
2. Run tests for the modified file immediately after changes, with `--coverage=false` for speed during development (see `.agents/rules/unit-testing.md` for test conventions).
3. Run the full package suite once the focused test passes.

## Other Useful Commands

**Install dependencies:**

```bash
pnpm install
```
