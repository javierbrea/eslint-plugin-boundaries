<!-- cspell:disable -->
# Phase 2: `@boundaries/config`

Goal: a new published package `@boundaries/config` (`packages/config`) that owns the normalization and validation of the `boundaries/*` settings and of the rule options and returns its problems as diagnostics, with the plugin consuming it and reporting exactly what it reports today.

Issue: #549. Branch `feat/549/config-package` from `release`; PR into `release`, title `feat: Extract @boundaries/config from the plugin`, `closes #549`. Changelog entries: `packages/config/CHANGELOG.md` (`## [1.0.0]`, first version) and `packages/eslint-plugin/CHANGELOG.md` (`refactor(#549): ...`, one entry saying the plugin now depends on `@boundaries/config` and nothing changes for its users; the version bump is a patch, RFC decision 10). The PR description lists the moved modules, the adapters left in the plugin, the browser check result, and confirms that the plugin's unit and e2e suites pass with no expectation changed.

Read first:

- [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559), decisions 1, 2, 3, 5, 7, 8, 9, 10: the source of everything below. If this file and the RFC disagree, the RFC wins and this file is corrected.
- Research note 2 on #539 (https://github.com/javierbrea/eslint-plugin-boundaries/issues/539#issuecomment-6410354387): the destination of every symbol and the specs that move.
- `00-shared.md` sections 3 and 4.
- `packages/elements`: the model for every file of the new package (`package.json`, `tsup.config.js`, `jest.config.js`, `tsconfig*.json`, `eslint.config.mjs`, `cspell.config.js`, `sonar-project.properties`, `project.json`, `AGENTS.md`, `README.md`, `CHANGELOG.md`).
- `packages/eslint-plugin/src/Settings/`, `Shared/`, `Rules/Dependencies.ts` (`normalizeRuleOptions`), `Debug/Debug.ts` (`warnOnce`) and the specs next to them.
- `.agents/skills/repo-architecture/SKILL.md` and the root `AGENTS.md` "Repository Overview": both name the published packages and gain this one.

Preconditions: RFC #559 accepted (see the index, "Open questions"). #510 is not required: see step 5.

## Scope

In: the package, the move of the modules the RFC assigns to `config`, the plugin adapters, the browser check, the agent files, CI and the docs that name packages, the changelogs. Out: `@boundaries/policies` (phase 3: the selector merging, the evaluation, the messages and the matcher stay in the plugin during this phase), loading a configuration from a path, any behavior change.

## Steps

### 1. Package scaffold

Create `packages/config` by copying the `elements` files and editing: name `@boundaries/config`, version `1.0.0`, description, `exports` with the `browser`, `node` and `default` conditions, `dependencies: { "@boundaries/elements": "workspace:*", "ajv": "<6.x, the version ESLint 9 resolves in the lockfile>" }`, `engines.node >=18.18`, `publishConfig`, `files`, `sonar.projectKey` (`javierbrea_eslint-plugin-boundaries_config`, the `elements` pattern). `project.json`: name `config`, tags `type:node:lib`, `lint` depending on `eslint:config` only (no self-lint, RFC decision 8), `implicitDependencies` as `elements`.

### 2. Move the modules

Follow research note 2. Move the files and their specs with `git mv` so the history follows, then edit imports. Layout of `src/` (RFC decision 8), each folder importing only from the ones before it: `Shared` (constants and types of `Shared/Settings.types.ts` except the ESLint-typed ones and the environment variable names; a private copy of `TypeHelpers.ts`), `Diagnostics` (the `Diagnostic` and `ConfigResult` types and a builder that deduplicates by title and detail keeping the first occurrence), `Docs` (the URL builders of `Settings/Docs.ts`), `Schemas` (the schemas of `Settings/Rules.ts` plus the `meta.schema` of each rule, now built here, and the `ajv@6` validator configured as `eslint/lib/shared/ajv.js`), `Settings` (`normalizeSettings`), `RuleOptions` (`validateRuleOptions`, `normalizeDependenciesRuleOptions`), `Config` (`normalizeConfig`), `src/index.ts`.

- Every `warnOnce(title, detail)` becomes a diagnostic with the same `title` and `detail`, a `level` (`deprecation` for legacy syntax that works, `warning` for ignored or ineffective input, `error` only for schema failures and for the structure errors of `normalizeConfig`) and the JSON paths of the affected entries. The moved specs keep their texts: their `jest.mocked(warnOnce)` assertions become assertions on the returned diagnostics, in the same order.
- `normalizeSettings(settings, { rootPath? })`: `getSettings` without the cache, without `Rule.RuleContext` and without `getNormalizedRootPath`; `SettingsNormalized.rootPath` becomes `string | undefined` (it is not a public type of the plugin).
- `validateRuleOptions(ruleName, options, { legacyWarnings, schema = true })`: the schema validation, then `validateAndWarnRuleOptions` without its `WeakSet`. With `ajv`'s `useDefaults`, validate a copy or check that no schema carries a `default` keyword: the function must not change its input.
- `normalizeDependenciesRuleOptions(options)`: the selector normalization of `normalizeRuleOptions` in `Rules/Dependencies.ts` (`normalizeEntitySelector`, `normalizeDependencyInfoSelector`, `normalizeRuleEffect`), plus `policies ?? rules`, `default` (`"disallow"`), `message` and the three `check*` flags with their `false` defaults. The precomputed selectors stay in the plugin until phase 3.
- `normalizeConfig(config, { pluginName = "boundaries", rootPath? })`: `{ settings, rules }`, ESLint's rule entry forms (`2`, `"error"`, `[severity, options]`), paths rooted at the config object, unknown plugin rules as errors, other plugins' keys ignored.
- Public exports: the five functions, `getRuleOptionsSchema`, the diagnostics types, the types and constants the plugin's `Public/` exports today, the type guards it re-exports (`isSettingsKey`, `isDependencyNodeKey`, `isRuleEffect`, `isRulePolicy`, `isRuleName`, `isRuleShortName`) and the URL builders.

### 3. Plugin adapters

- `Settings/Settings.ts`: `getSettings(context)` keeps its `WeakMap` by `context.settings`, keeps `getNormalizedRootPath` (env variable, `process.cwd()`, `node:path`, its warning), calls `normalizeSettings(context.settings, { rootPath })` and prints every diagnostic with `warnOnce(title, detail)` in order.
- `Settings/Rules.ts`: `validateAndWarnRuleOptions(options, ruleName, legacyWarnings)` keeps its `WeakSet` and prints `validateRuleOptions(ruleName, options, { legacyWarnings, schema: false })`; a `getDependenciesRuleOptions(options)` caches `normalizeDependenciesRuleOptions` by options identity and replaces the policy normalization in `Rules/Dependencies.ts`; `warnMigrationToDependencies` stays.
- `Settings/Docs.ts`: only `deprecatedRuleInfo` stays, built on `ruleDocsUrl` from `config`.
- `Shared/`: `Rules`, `Config`, `PluginBoundaries`, `RuleMetaDefinition`, the environment variable names, the private type helpers; everything else is imported from `@boundaries/config`.
- `Public/`: same names, re-exported from `@boundaries/config`. Check with a type test or the `index.spec.ts` snapshot that the plugin's exported names do not change.
- Rule `meta.schema` comes from `getRuleOptionsSchema(ruleName)`.
- `packages/eslint-plugin/AGENTS.md` and its `eslint.config.mjs`: the element types keep their names (the `settings` folder is now an adapter); the layering paragraph says what each adapter does.

### 4. Layering of the package

Write the layering of step 2 in `packages/config/AGENTS.md` (under 200 lines, `.agents/rules/agents-md.md`) with the reason it is not lint-enforced, and the hard constraints: no `eslint`, `estree`, `eslint-module-utils`, `chalk` or `node:*` import; no `process`; no console output; no cache; inputs never mutated. A `CLAUDE.md` with `@AGENTS.md` next to it.

### 5. Browser check

Add the check of `00-shared.md` section 4 as a test of `config`: esbuild `platform: "browser"`, no alias, run in `node:vm` without `process`, calling `normalizeConfig` on the quick-start example of `packages/website/docs/quick-start.mdx` and asserting no diagnostics. If #510 is not merged yet, mark `@boundaries/elements` as external in that bundle and say so in the PR; the first PR after #510 removes the exception.

If `test/browser-e2e` (#558) is merged, add its `config` scenarios in this PR: `normalizeConfig` on the quick-start example, and on a config with an invalid element descriptor and a deprecated selector, compared with Node.js. If it is not merged yet, #558 adds them.

### 6. Repository files

- `repo-architecture` skill: component map row and dependency graph line (`eslint-plugin → config → elements`).
- Root `AGENTS.md`: the "Repository Overview" sentence names three published libraries.
- `.github/workflows/build.yml`: `test-node-versions` runs `pnpm nx test:unit config`; `build` uploads `config-build` (`packages/config/dist`) and `config-coverage`; `build-windows` downloads `config-build` next to `elements-build`; `reports` adds the Coveralls step and a Sonar step guarded by a `SONAR_TOKEN_CONFIG` secret.
- `.github/CONTRIBUTING.md` "Publishing" (steps 1 and 6) and `.agents/skills/release/SKILL.md`: name `config` wherever `elements` and `eslint-plugin` are named. `publish.yml` and `publish-to-github.yml` do not change.
- `packages/config/README.md`: what the package is, its interface in a short table, one `normalizeConfig` example with a diagnostic and its path, a note that the plugin and the playground consume it.
- Changelogs (see the header).

## Verification

- `pnpm nx run-many -t check:all --all` passes; the `eslint-plugin` unit tests and `test/eslint-plugin-e2e` (`pnpm nx test:e2e eslint-plugin-e2e`) pass with no expectation changed.
- `pnpm nx graph` shows `eslint-plugin → config → elements` and no cycle.
- The browser check of step 5 passes.
- No `eslint`, `estree`, `chalk`, `eslint-module-utils` or `node:` import and no `process` under `packages/config/src` (grep); the plugin imports settings and rule-option normalization only from `@boundaries/config` (grep for the old functions in `packages/eslint-plugin/src`).
- Coverage of `config` is 100%; the moved specs are the baseline.

## Hand-offs

- To phase 3: `SettingsNormalized`, `DependenciesRuleOptionsNormalized`, `DependenciesPolicyNormalized` and `Diagnostic`, imported from `@boundaries/config`; `getDependenciesRuleOptions` in the plugin's `Settings/` adapter, which phase 3 feeds to `evaluateDependency`.
- To phase 4 and 5: `normalizeConfig` and its diagnostics paths, rooted at the config object.
- To the index: the versions set (`config` 1.0.0, plugin patch).

## Open points

- If an Nx target of `config` needs the plugin's build for anything else (for example a type test), stop: it reintroduces the cycle of RFC decision 8.
- Whether `ajv` adds a type package. Default: use the types `ajv@6` ships.
