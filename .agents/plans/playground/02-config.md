<!-- cspell:disable -->
# Phase 2: `@boundaries/config`

Goal: a new published package `@boundaries/config` (`packages/config`) that owns the normalization and validation of the `boundaries/*` settings and of the rule options, with the plugin consuming it and reporting exactly what it reports today.

Issue: #549. Branch `feat/549/config-package` from `release`; PR into `release`, title `feat: Extract @boundaries/config from the plugin`, `closes #549`. Changelog entries: `packages/config/CHANGELOG.md` (first version) and `packages/eslint-plugin/CHANGELOG.md` (`refactor(#549): ...`, one entry saying the plugin now depends on `@boundaries/config` and nothing changes for its users). Versions as the RFC of phase 1 decided. The PR description lists the moved modules, the adapters left in the plugin, the bundle check result, and confirms the plugin's unit and e2e suites pass unchanged.

Read first:

- The RFC of phase 1 (linked from #548 and #539): the inventory, the interfaces and the layering are its decisions, and this file's "Steps" section is updated with them before this phase starts (see "Preconditions").
- `00-shared.md` sections 3 and 4.
- `packages/elements`: the model for every file of the new package (`package.json`, `tsup.config.js`, `jest.config.js`, `tsconfig*.json`, `eslint.config.mjs`, `cspell.config.js`, `sonar-project.properties`, `project.json`, `AGENTS.md`, `README.md`, `CHANGELOG.md`).
- `packages/eslint-plugin/src/Settings/`, `Shared/`, `Debug/Debug.ts` (`warnOnce`) and the specs next to them; `packages/eslint-plugin/test/` for the fixtures the moved specs use.
- `.agents/skills/repo-architecture/SKILL.md` and the root `AGENTS.md` "Repository Overview": both name the published packages and must gain this one.

Preconditions: the RFC of phase 1 is accepted (consensus or 7 days without objections, `docs/contributing-workflow.md`, step 2), and this file has been updated with its final inventory and interfaces. Until then the "Steps" below are the shape of the work, not its content.

## Scope

In: the package, the move of the modules the RFC assigns to it, the plugin adapters, the browser check, the agent files, the workflows and skills that name packages, the changelogs. Out: loading a configuration from a path (future), the `policies` package (phase 3), any behavior change.

## Steps

### 1. Package scaffold

Create `packages/config` by copying the `elements` files and editing: name `@boundaries/config`, description, `exports` with the three conditions, `dependencies: { "@boundaries/elements": "workspace:*" }` (the settings normalization uses its types and its `Config` helpers), `publishConfig`, `files`, `sonar.projectKey`. `project.json` name `config`, tags `type:node:lib`, `implicitDependencies` as the others. Add the package to the `Build and Test Mutation` CI matrix only if a job enumerates packages (check `.github/workflows/build.yml` `test-node-versions` and `build-windows`: they run `elements` and `eslint-plugin` tests by name; add `config` there).

### 2. Move the modules

Per the RFC inventory: move the files and their specs with `git mv` so the history follows, then edit imports. Replace every `warnOnce` call with a pushed diagnostic in the result; keep the exact message texts (the plugin's specs assert them). Keep `node:path` out: `rootPath` handling as the RFC decided. Keep the public exports of the plugin unchanged by re-exporting from `@boundaries/config` in `packages/eslint-plugin/src/Public/` and `Shared/`.

### 3. Plugin adapters

`getSettings(context)` stays in the plugin (it reads `context.settings`, resolves `rootPath` and caches by `context.settings` identity) and calls the pure normalization; the rule option validation of each rule calls `config` and prints its diagnostics through `Debug` (`warnOnce`, same titles, same links). `RuleMetaDefinition` schemas come from `config`. The plugin's `eslint.config.mjs` loses the `settings` element type if the folder disappears, or keeps it as the adapter folder; update `packages/eslint-plugin/AGENTS.md` accordingly (nine element types today).

### 4. Layering of the package

Declare the element types of `packages/config/src` in its `eslint.config.mjs` as the RFC decided, with `no-unknown-files` on, if the package can lint itself with the plugin without an Nx cycle; otherwise describe the layering in `AGENTS.md` only (`00-shared.md`, section 3).

### 5. Browser check

Add the esbuild + `node:vm` check (`00-shared.md`, section 4) as a test of `config`; it must build with no alias and run without `process`.

### 6. Repository files

- `repo-architecture` skill: component map row and dependency graph line (`eslint-plugin → config → elements`).
- Root `AGENTS.md`: the "Repository Overview" sentence names three published libraries.
- `.github/workflows/publish-to-github.yml` and `.agents/skills/release/SKILL.md`: add the package wherever `elements` and `eslint-plugin` are named; `.github/CONTRIBUTING.md` "Publishing" step 1 and 6 if they enumerate packages.
- `packages/config/README.md`: what the package is, its public interface in a short table, a note that it is consumed by the plugin and the playground; link the website.
- Changelogs (see the header).

## Verification

- `pnpm nx run-many -t check:all --all` passes; `packages/eslint-plugin` unit tests and `test/eslint-plugin-e2e` (`pnpm nx test:e2e eslint-plugin-e2e`) pass with no expectation changed.
- `pnpm nx graph` shows `eslint-plugin → config → elements` and no cycle.
- The browser check of step 5 passes.
- `grep -r "from \"../Settings\"" packages/eslint-plugin/src` finds only the adapter, and no `eslint` import remains under `packages/config/src`.
- Coverage of `config` is 100%; the moved specs are the baseline.

## Hand-offs

- To phase 3: the `SettingsNormalized` and rule options types and the diagnostics type, now imported from `@boundaries/config`; the decision on self-linting (cycle or not), which `policies` repeats.
- To phase 4: the package builds for the browser; the diagnostics carry JSON paths.
- To the index: whether the plugin bump was patch or minor, and the versions set.

## Open points

- If moving a spec drags a fixture tree from `packages/eslint-plugin/test/fixtures`, copy only the files the spec needs into `packages/config/test/fixtures`. Default: copy, do not share across packages.
- If the `build-windows` job must run the new package's tests, mirror what #510 does for `elements` in that job.
