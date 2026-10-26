<!-- cspell:disable -->
# Phase 2: `@boundaries/config`

Goal: a new published package `@boundaries/config` (`packages/config`) that owns the normalization and validation of the `boundaries/*` settings and of the rule options and returns its problems as diagnostics, with the plugin consuming it and reporting exactly what it reports today.

Issue: #549. Branch `feat/549/config-package` from `release`; PR into `release`, title `feat: Extract @boundaries/config from the plugin`, `closes #549`. Changelog entries: `packages/config/CHANGELOG.md` (`## [1.0.0]`, first version) and `packages/eslint-plugin/CHANGELOG.md` (`refactor(#549): ...`, one entry saying the plugin now depends on `@boundaries/config` and nothing changes for its users; the version bump is a patch, RFC decision 10). The PR description lists the moved modules, the adapters left in the plugin, the browser check result, and confirms that the plugin's unit and e2e suites pass with no expectation changed.

Read first:

- [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559), decisions 1, 2, 3, 5, 7, 8, 9, 10: the source of everything below. If this file and the RFC disagree, the RFC wins and this file is corrected.
- Research note 2 on #539 (https://github.com/javierbrea/eslint-plugin-boundaries/issues/539#issuecomment-6410354387): the destination of every symbol and the specs that move.
- `00-shared.md` sections 3 and 4.
- `packages/elements`: the model for every file of the new package (`package.json`, `tsup.config.js`, `jest.config.js`, `tsconfig*.json`, `eslint.config.mjs`, `cspell.config.js`, `sonar-project.properties`, `project.json`, `AGENTS.md`, `README.md`, `CHANGELOG.md`).
- PR #560 (branch `feat/510-elements-in-browser`): `packages/elements/test/e2e/builds.spec.mjs`, the `test:e2e` script and the `no-restricted-globals` block of `packages/elements/eslint.config.mjs`, the model of step 5.
- `packages/eslint-plugin/src/Settings/`, `Shared/`, `Rules/Dependencies.ts` (`normalizeRuleOptions`), `Rules/EntryPoint.ts`, `Rules/External.ts`, `Debug/Debug.ts` (`warnOnce`) and the specs next to them.
- ESLint 9's `lib/config/config.js` (`getRuleOptionsSchema`, and the validation of `rules` with its error texts) and `lib/shared/ajv.js` (the `ajv` options): `validateRuleOptions` and `normalizeConfig` reproduce them.
- `.agents/skills/repo-architecture/SKILL.md` and the root `AGENTS.md` "Repository Overview": both name the published packages and gain this one.

Preconditions: none left: RFC #559 is accepted (2026-10-26). #510 is not required: see step 5.

## Scope

In: the package, the move of the modules the RFC assigns to `config`, the plugin adapters, the browser check, the agent files, CI and the docs that name packages, the changelogs. Out: `@boundaries/policies` (phase 3: the selector merging, the evaluation, the messages and the matcher stay in the plugin during this phase), loading a configuration from a path, a `test:mutation` target (`elements` stays the only package with one), any behavior change.

## Steps

### 1. Package scaffold

Create `packages/config` by copying the `elements` files and editing: name `@boundaries/config`, version `1.0.0`, description, `exports` with the `browser`, `node` and `default` conditions, `dependencies: { "@boundaries/elements": "workspace:*", "ajv": "6.15.0" }` (the version ESLint 9.39.5 resolves in the lockfile), `devDependencies` `esbuild` `0.27.3`, `tsup` and `typescript` as `elements`, a `test:e2e` script (`node --test test/e2e/builds.spec.mjs`), `engines.node >=18.18`, `publishConfig`, `files`, `sonar.projectKey` (`javierbrea_eslint-plugin-boundaries_config`, the `elements` pattern). `tsup.config.js` has no `path-browserify` alias (PR #560 removes it from `elements`). `eslint.config.mjs` has the `no-restricted-globals` block of PR #560. `project.json`: name `config`, tags `type:node:lib`, `lint` depending on `eslint:config` only (no self-lint, RFC decision 8), `implicitDependencies` as `elements`.

### 2. Move the modules

Follow research note 2. Move the files and their specs with `git mv` so the history follows, then edit imports. Layout of `src/` (RFC decision 8), each folder importing only from the ones before it: `Shared` (constants and types of `Shared/Settings.types.ts` except the ESLint-typed ones and the environment variable names; a private copy of `TypeHelpers.ts`), `Diagnostics` (the `Diagnostic` and `ConfigResult` types and a builder that deduplicates by title and detail keeping the first occurrence), `Docs` (the URL builders of `Settings/Docs.ts`), `Schemas` (the schemas of `Settings/Rules.ts` plus the `meta.schema` of each rule, now built here, and the `ajv@6` validator configured as `eslint/lib/shared/ajv.js`), `Settings` (`normalizeSettings`), `RuleOptions` (`validateRuleOptions`, `normalizeDependenciesRuleOptions`), `Config` (`normalizeConfig`), `src/index.ts`.

- Every `warnOnce(title, detail)` becomes a diagnostic with the same `title` and `detail`, a `level` (`deprecation` for legacy syntax that works, `warning` for ignored or ineffective input, `error` only for schema failures and for the structure errors of `normalizeConfig`) and the JSON paths of the affected entries. The moved specs keep their texts: their `jest.mocked(warnOnce)` assertions become assertions on the returned diagnostics, in the same order.
- `normalizeSettings(settings, { rootPath? })`: `getSettings` without the cache, without `Rule.RuleContext` and without `getNormalizedRootPath`; `SettingsNormalized.rootPath` becomes `string | undefined` (it is not a public type of the plugin).
- `SETTINGS` splits as research note 2 says: `config` exports it without the environment variable names (`DEBUG`, `ENV_ROOT_PATH`); the plugin's `Shared` builds its own `SETTINGS` from it plus those two and `PLUGIN_ENV_VARS_PREFIX`, so the plugin's code keeps reading `SETTINGS.*`.
- `validateRuleOptions(ruleName, options, { legacyWarnings, schema = true })`: the schema validation, then `validateAndWarnRuleOptions` without its `WeakSet`. The schema validation is ESLint's: the `meta.schema` array wrapped as `{ type: "array", items, minItems: 0, maxItems: <length> }` (`[]` accepts no options), validating `[options]` (`[]` when `options` is `undefined`) with the `ajv` options and the draft-04 meta schema of `eslint/lib/shared/ajv.js`. A failure is one `error` diagnostic: title `[<ruleName>] Invalid rule options.`, detail ESLint's lines (`Value <data> <message>.`, plus `Unexpected property "<name>". Expected properties: ...` for an additional property) and the rule's docs link, one path per `ajv` error from its `dataPath`; the policy checks do not run after it, as ESLint never runs a rule whose options fail. No schema carries a `default` keyword, and a spec asserts it, so `useDefaults` never changes the input.
- `normalizeDependenciesRuleOptions(options)`: the selector normalization of `normalizeRuleOptions` in `Rules/Dependencies.ts` (`normalizeEntitySelector`, `normalizeDependencyInfoSelector`, `normalizeRuleEffect`), keeping each policy's `importKind` and `message`, plus `policies ?? rules`, `default` (`"disallow"`), `message` and the three `check*` flags with their `false` defaults. Policies are never dropped, so an index in the result is the index in the user's list. The precomputed selectors stay in the plugin until phase 3.
- `normalizeConfig(config, { pluginName = "boundaries", rootPath? })`: `{ settings, rules }`. A rule entry is a severity (`0`, `1`, `2`, `"off"`, `"warn"`, `"error"`) alone or first in an array, followed by the options. An `off` entry is listed but not validated, as ESLint skips it, and its options are normalized only when they pass the schema. An entry whose options fail the schema is left out of `rules`. The errors use ESLint's texts where it has one (an unknown rule: `Could not find "<name>" in plugin "<pluginName>".`). Paths are rooted at the config object: settings diagnostics get the prefix `["settings"]`, rule options diagnostics `["rules", "<pluginName>/<name>", 1]`. `legacyWarnings` comes from the normalized settings. Other plugins' keys are ignored.
- Public exports: the five functions, `getRuleOptionsSchema`, the diagnostics types, the types and constants the plugin's `Public/` exports today, the type guards it re-exports (`isSettingsKey`, `isDependencyNodeKey`, `isRuleEffect`, `isRulePolicy`, `isRuleName`, `isRuleShortName`) and the URL builders.

### 3. Plugin adapters

- `Settings/Settings.ts`: `getSettings(context)` keeps its `WeakMap` by `context.settings`, keeps `getNormalizedRootPath` (env variable, `process.cwd()`, `node:path`, its warning), calls `normalizeSettings(context.settings, { rootPath })` and prints every diagnostic with `warnOnce(title, detail)` in order. Its spec keeps only that: the cache, the root path resolution and the printing order; the rest of `Settings.spec.ts` moves.
- `Settings/Rules.ts`: `validateAndWarnRuleOptions(options, ruleName, legacyWarnings)` keeps its `WeakSet` and prints `validateRuleOptions(ruleName, options, { legacyWarnings, schema: false })`; a `getDependenciesRuleOptions(options)` caches `normalizeDependenciesRuleOptions` by options identity and replaces the policy normalization in `Rules/Dependencies.ts`; `warnMigrationToDependencies` stays.
- `Rules/Dependencies.ts`: `normalizeRuleOptions` disappears. `evaluatePolicies` takes `DependenciesPolicyNormalized[]` and caches the precomputed selectors in a `WeakMap` by normalized policy; `evaluatePoliciesAndReport` takes those policies and still reads `default` and the custom message from the rule's own options. The `dependencies` rule passes `getDependenciesRuleOptions(options).policies`; `entry-point` and `external` pass `normalizeDependenciesRuleOptions({ policies }).policies` of their translated policies, uncached, because the translation builds new objects for every dependency, as today. The `evaluatePolicies` specs of `Dependencies.spec.ts` build their policies with `normalizeDependenciesRuleOptions`; their expectations do not change.
- `Settings/Docs.ts`: only `deprecatedRuleInfo` stays, built on `ruleDocsUrl` from `config`.
- `Shared/`: `Rules`, `Config`, `PluginBoundaries`, `RuleMetaDefinition`, the environment variable names, the private type helpers; everything else is imported from `@boundaries/config`.
- `Public/`: same names, re-exported from `@boundaries/config`. Check with a type test or the `index.spec.ts` snapshot that the plugin's exported names do not change.
- Rule `meta.schema` comes from `getRuleOptionsSchema(ruleName)`.
- `packages/eslint-plugin/AGENTS.md` and its `eslint.config.mjs`: the element types keep their names (the `settings` folder is now an adapter); the layering paragraph says what each adapter does.

### 4. Layering of the package

Write the layering of step 2 in `packages/config/AGENTS.md` (under 200 lines, `.agents/rules/agents-md.md`) with the reason it is not lint-enforced, and the hard constraints: no `eslint`, `estree`, `eslint-module-utils`, `chalk` or `node:*` import; no `process`; no console output; no cache; inputs never mutated. A `CLAUDE.md` with `@AGENTS.md` next to it.

### 5. Browser check

Add the check of `00-shared.md` section 4 as the `test:e2e` target of `config`, `test/e2e/builds.spec.mjs`, copied from the `elements` one of PR #560: the Node.js CommonJS build, the ES module build and the browser bundles (imported and required, in `node:vm` without `process` or `require`) return the same results for `normalizeConfig` on the quick-start example of `packages/website/docs/quick-start.mdx` (no diagnostics), on a config with an invalid element descriptor and a deprecated selector (their diagnostics and paths), and for `validateRuleOptions` with the schema on invalid options. If #510 is not merged yet, use the exception of section 4 and say so in the PR; the first PR after #510 removes it.

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

- To phase 3: `SettingsNormalized`, `DependenciesRuleOptionsNormalized`, `DependenciesPolicyNormalized` and `Diagnostic`, imported from `@boundaries/config`; `getDependenciesRuleOptions` in the plugin's `Settings/` adapter, which phase 3 feeds to `evaluateDependency`; the precomputed selectors in `Rules/Dependencies.ts`, already cached by `DependenciesPolicyNormalized`, which phase 3 moves as they are.
- To phase 4 and 5: `normalizeConfig` and its diagnostics paths, rooted at the config object.
- To the index: the versions set (`config` 1.0.0, plugin patch).

## Open points

- If an Nx target of `config` needs the plugin's build for anything else (for example a type test), stop: it reintroduces the cycle of RFC decision 8.
- Whether `ajv` adds a type package. Default: use the types `ajv@6` ships.
