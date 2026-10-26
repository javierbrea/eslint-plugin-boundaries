<!-- cspell:disable -->
# Phase 3: `@boundaries/policies`

Goal: a new published package `@boundaries/policies` (`packages/policies`) that describes files and dependencies from paths, evaluates normalized `dependencies` options against them and produces the messages, with the `dependencies` rule of the plugin reduced to AST reading, resolution, debug output and `report`.

Issue: #550. Branch `feat/550/policies-package` from `release` (after phase 2 is merged); PR into `release`, title `feat: Extract @boundaries/policies from the plugin`, `closes #550`. Changelog entries: `packages/policies/CHANGELOG.md` (`## [1.0.0]`, first version) and `packages/eslint-plugin/CHANGELOG.md` (`refactor(#550): ...`; a patch, or no new bump if phase 2's patch is not released yet). The PR description lists the moved modules, the adapters left in the plugin, the browser check result, and an example call of `evaluateDependency` with its result.

Read first:

- [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559), decisions 1, 4, 5, 6, 7, 8, 9, 10. If this file and the RFC disagree, the RFC wins and this file is corrected.
- Research note 2 on #539 (https://github.com/javierbrea/eslint-plugin-boundaries/issues/539#issuecomment-6410354387): the destination of every symbol and the specs that move.
- `02-config.md` and its PR: the package shape, the adapters and the diagnostics are repeated here.
- `packages/eslint-plugin/src/Rules/Dependencies.ts`, `Messages/`, `Elements/Elements.ts`, `Rules/Support/DependencyRule.ts`, `Rules/EntryPoint.ts`, `Rules/External.ts`, `Rules/NoPrivate.ts`, `Debug/Debug.ts` (`printDependenciesRuleResult`, `debugDescription`, which stay), and the specs next to them.
- `packages/elements/src/index.ts`: `Elements`, `Matcher` (`describeEntity`, `describeDependency`, `getDependencySelectorMatchingDescription`), `DependencyDescriptorOptions`, the description and match result types; `policies` builds on them and duplicates nothing.

Preconditions: phase 2 merged into `release`.

## Scope

In: the package, the move of the modules the RFC assigns to `policies`, the plugin adapters, the browser check, the repository files. Out: the rules other than `dependencies` beyond the calls of RFC decision 6, `boundaries/debug` output (stays in the plugin), any behavior change.

## Steps

### 1. Package scaffold

As phase 2, copying `packages/config`: name `@boundaries/policies`, version `1.0.0`, `dependencies: { "@boundaries/elements": "workspace:*", "@boundaries/config": "workspace:*", "handlebars": "<the version the plugin pins today>" }`, `project.json` name `policies`, `sonar.projectKey` `javierbrea_eslint-plugin-boundaries_policies`. The plugin loses its `handlebars` dependency.

### 2. Move the modules

Follow research note 2. Layout of `src/` (RFC decision 8): `Shared` (private type helpers), `Messages` (`Messages/` of the plugin, whole), `Descriptions` (`getMatcher` from `getElementsMatcher` with its `WeakMap` and `Elements` instance, `describeEntity`, `describeDependency`), `Evaluation` (`buildEntrySelector`, `mergeImportKind` and the `merge*` helpers, the precomputed selectors cached by `DependenciesPolicyNormalized` identity, `evaluatePolicies`, `evaluateDependency`), `src/index.ts`.

- `evaluatePolicies(settings, options, dependency)`: today's `evaluatePolicies` over `options.policies`, then the `default` and message part of `evaluatePoliciesAndReport` (`resolveCustomMessage`, `buildErrorMessage`). The result is `{ allowed, policyIndex, match, message?, diagnostics }`; it keeps `policyIndex` and `match` for allowed dependencies too. The `warnOnce` of `safeMatch` becomes a diagnostic with the same title and detail.
- `evaluateDependency(settings, options, dependency)`: returns `{ checked: false, reason }` in this order: `from-ignored` and `from-unknown` (the checks of `dependencyRule()`), then `to-ignored`, `not-local`, `unknown-local`, `internal` (the checks of the rule function in `Rules/Dependencies.ts`, with the `check*` options); otherwise `{ checked: true, ...evaluatePolicies(...) }`.
- `describeDependency(settings, input)` takes `DependencyDescriptorOptions` as is; the default `kind: "value"` that the plugin applies today stays in the plugin adapter.
- Public exports: `getMatcher`, `describeEntity`, `describeDependency`, `evaluatePolicies`, `evaluateDependency`, `customErrorMessage`, `elementDescriptionMessage`, the result and skip reason types, and the `CustomMessageTemplate*Context` types the plugin's `Public/` re-exports.
- Specs: `Messages/*.spec.ts` and `Elements/Elements.spec.ts` move; the `evaluatePolicies`, `resolveCustomMessage` and `buildErrorMessage` blocks of `Rules/Dependencies.spec.ts` move (they mock `../Debug`, `../Elements`, `../Messages`; the moved copy uses the real modules of the package or mocks its own).

### 3. Plugin adapters

- `Elements/Elements.ts`: keeps `getSpecifiers` and `EslintLiteralNode`; `entityDescription` calls `describeEntity` then `debugDescription(result, settings, getMatcher(settings))`; `dependencyDescription` builds the input (`resolve(source, context)`, `kind || "value"`, `nodeKind`, `getSpecifiers(node)`), calls `describeDependency`, then `debugDescription`.
- `Rules/Dependencies.ts`: the rule definition, the `element-types` rename warning, `validateAndWarnRuleOptions`, then `evaluateDependency(settings, getDependenciesRuleOptions(options), dependency)`; when it is checked and not allowed, `printDependenciesRuleResult(match, policyIndex, dependency, settings, getMatcher(settings))` and `context.report({ message, node })`; every diagnostic is printed with `warnOnce`. A shared reporting helper keeps that sequence for the legacy rules.
- `Rules/EntryPoint.ts` and `Rules/External.ts`: keep their checks and their translation into `dependencies` policies, then `normalizeDependenciesRuleOptions({ ...options, policies })` and `evaluatePolicies`, and the same reporting helper.
- `Rules/NoPrivate.ts`: imports `customErrorMessage` and `elementDescriptionMessage` from `@boundaries/policies`.
- `Messages/` disappears; the `messages` element type leaves `packages/eslint-plugin/eslint.config.mjs` and `packages/eslint-plugin/AGENTS.md` (eight element types).
- The reported messages are byte-identical; the plugin's rule specs under `test/rules/` are the proof.

### 4. Layering, browser check, repository files

As phase 2, steps 4 to 6, with the graph line `eslint-plugin → policies → config → elements`, the `policies` row in the `repo-architecture` skill, `policies-build` in the `build-windows` job, and `SONAR_TOKEN_POLICIES`. The browser check calls `describeDependency` and `evaluateDependency` on the quick-start example. `test/browser-e2e` (#558) gets the `policies` scenarios in this PR if it is merged (the home's step 3 case, an allowed dependency, a skipped one), or in its own PR otherwise. `README.md`: the interface table with one `evaluateDependency` example and its result.

## Verification

- `pnpm nx run-many -t check:all --all` and the e2e suite pass with no expectation changed.
- `pnpm nx graph` shows `eslint-plugin → policies → config → elements`, no cycle.
- The browser check passes; no `eslint`, `estree`, `eslint-module-utils`, `chalk` or `node:*` import and no `process` under `packages/policies/src`.
- A unit test of `policies` reproduces the home's step 3 case (quick-start config, `src/helpers/format` imported from `src/components/Price/index.ts`) and asserts the verdict, the policy index and the message the plugin reports for it (take the expected message from the plugin's own spec of that scenario).
- Coverage 100%.

## Hand-offs

- To phases 5 and 6: `describeEntity(settings, path)` for the inspector; `describeDependency(settings, { from, to, source, kind, nodeKind, specifiers })` and `evaluateDependency(settings, options, description)` for the verdicts, with `options` the `dependencies` (or `element-types`) entry of `normalizeConfig`'s `rules`; the result `{ checked, reason }` or `{ checked, allowed, policyIndex, match, message, diagnostics }`; module origin for a sketched tree: `to` only for nodes of the sketch, everything else external or core (RFC #538, research 1).
- To the index: versions set.

## Open points

- If the playground (phase 6) shows that the `elements` caches grow without bound over a long session, add a `clearCache()` to `policies` that delegates to the `Elements` instance, in its own PR into `release`. Default: none (RFC decision 7).
