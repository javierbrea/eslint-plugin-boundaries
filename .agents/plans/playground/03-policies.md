<!-- cspell:disable -->
# Phase 3: `@boundaries/policies`

Goal: a new published package `@boundaries/policies` (`packages/policies`) that describes files and dependencies from paths, evaluates normalized `dependencies` options against them and produces the messages, with the `dependencies` rule of the plugin reduced to AST reading, resolution, debug output and `report`.

Issue: #550. Branch `feat/550/policies-package` from `release`; PR into `release`, title `feat: Extract @boundaries/policies from the plugin`, `closes #550`. Changelog entries: `packages/policies/CHANGELOG.md` (`## [1.0.0]`, first version) and `packages/eslint-plugin/CHANGELOG.md` (`refactor(#550): ...` under `[Unreleased]`, next to the `refactor(#549)` entry; the plugin's patch version is set at release time). The PR description lists the moved modules, the adapters left in the plugin, the browser check result, and an example call of `evaluateDependency` with its result.

Read first:

- [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559), decisions 1, 4, 5, 6, 7, 8, 9, 10 and Amendment 1 (`getDependencySkipReason`). If this file and the RFC disagree, the RFC wins and this file is corrected.
- Research note 2 on #539 (https://github.com/javierbrea/eslint-plugin-boundaries/issues/539#issuecomment-6410354387): the destination of every symbol and the specs that move.
- `02-config.md` (its "Outcome" too) and PR #561: the package shape, the adapters and the diagnostics are repeated here.
- `packages/config` as it is on `release`: the model of the package, including what it gained after phase 2 (the browser lint of `createBrowserConfig`, #576; `test:mutation` with Stryker, #577).
- `packages/eslint-plugin/src/Rules/Dependencies.ts`, `Messages/`, `Elements/Elements.ts`, `Rules/Support/DependencyRule.ts`, `Rules/EntryPoint.ts`, `Rules/External.ts`, `Rules/NoPrivate.ts`, `Debug/Debug.ts` (`printDependenciesRuleResult`, `debugDescription` and `warnDiagnostics`, which stay), and the specs next to them.
- `packages/elements/src/index.ts`: `Elements`, `Matcher` (`describeEntity`, `describeDependency`, `getDependencySelectorMatchingDescription`), `DependencyDescriptorOptions`, the description and match result types; `policies` builds on them and duplicates nothing.
- `test/browser-e2e/README.md`: how a package and its scenarios are added.

Preconditions: phase 2 merged into `release` (#561, 2026-10-28).

## Scope

In: the package, the move of the modules the RFC assigns to `policies`, the plugin adapters, the browser check, the repository files. Out: the rules other than `dependencies` beyond the calls of RFC decision 6, `boundaries/debug` output (stays in the plugin), any behavior change.

## Steps

### 1. Package scaffold

Copy `packages/config` as it is on `release`, which has every convention a package needs, and change only: name `@boundaries/policies`, version `1.0.0`, `dependencies: { "@boundaries/elements": "workspace:*", "@boundaries/config": "workspace:*", "handlebars": "4.7.10" }` (the version the plugin pins), `project.json` name `policies`, `sonar.projectKey` `javierbrea_eslint-plugin-boundaries_policies`, and `policies` as the Stryker `dashboard.module` and in the mutation badge of the README. The plugin loses its `handlebars` dependency.

### 2. Move the modules

Follow research note 2. Layout of `src/` (RFC decision 8): `Shared` (private type helpers), `Messages` (`Messages/` of the plugin, whole), `Descriptions` (`getMatcher` from `getElementsMatcher` with its `WeakMap` and `Elements` instance, `describeEntity`, `describeDependency`), `Evaluation` (`buildEntrySelector`, `mergeImportKind` and the `merge*` helpers, the precomputed selectors cached by `DependenciesPolicyNormalized` identity, `getDependencySkipReason`, `evaluatePolicies`, `evaluateDependency`), `src/index.ts`.

- `evaluatePolicies(settings, options, dependency)`: today's `evaluatePolicies` over `options.policies`, then the `default` and message part of `evaluatePoliciesAndReport` (`resolveCustomMessage`, `buildErrorMessage`). The result is `{ allowed, policyIndex, match, message?, diagnostics }`; it keeps `policyIndex` and `match` for allowed dependencies too. The `warnOnce` of `safeMatch` becomes a diagnostic with the same title and detail.
- `getDependencySkipReason(options, dependency)` (RFC #559, Amendment 1): the first skip reason in this order, or `null`: `from-ignored` and `from-unknown` (the checks of `dependencyRule()`), then `to-ignored`, `not-local`, `unknown-local`, `internal` (the checks of the rule function in `Rules/Dependencies.ts`). It reads only `checkAllOrigins`, `checkUnknownLocals` and `checkInternals`, each `false` when not set, so it takes the options as the user wrote them or normalized.
- `evaluateDependency(settings, options, dependency)`: `{ checked: false, reason }` when `getDependencySkipReason` returns a reason; otherwise `{ checked: true, ...evaluatePolicies(...) }`.
- `describeDependency(settings, input)` takes `DependencyDescriptorOptions` as is; the default `kind: "value"` that the plugin applies today stays in the plugin adapter.
- Public exports: `getMatcher`, `describeEntity`, `describeDependency`, `getDependencySkipReason`, `evaluatePolicies`, `evaluateDependency`, `customErrorMessage`, `elementDescriptionMessage`, the result and skip reason types, and the `CustomMessageTemplate*Context` types the plugin's `Public/` re-exports.
- Specs: `Messages/*.spec.ts` and `Elements/Elements.spec.ts` move; the `evaluatePolicies`, `resolveCustomMessage` and `buildErrorMessage` blocks of `Rules/Dependencies.spec.ts` move (they mock `../Debug`, `../Elements`, `../Messages`; the moved copy uses the real modules of the package or mocks its own).

### 3. Plugin adapters

- `Elements/Elements.ts`: keeps `getSpecifiers` and `EslintLiteralNode`; `entityDescription` calls `describeEntity` then `debugDescription(result, settings, getMatcher(settings))`; `dependencyDescription` builds the input (`resolve(source, context)`, `kind || "value"`, `nodeKind`, `getSpecifiers(node)`), calls `describeDependency`, then `debugDescription`.
- `Rules/Dependencies.ts`: the rule definition, the `element-types` rename warning, `validateAndWarnRuleOptions`, then `getDependencySkipReason(options, dependency)` with the options as the user wrote them, and only when it returns `null`, `evaluatePolicies(settings, getDependenciesRuleOptions(options), dependency)`. The policies are normalized only for the dependencies the rule checks, as today: normalizing a selector that passed the schema can still throw in `@boundaries/elements`, and the spec "does not normalize the policies when it skips the dependency, so an invalid selector does not throw" of `Rules/Dependencies.spec.ts` keeps passing. When the dependency is not allowed, `printDependenciesRuleResult(match, policyIndex, dependency, settings, getMatcher(settings))` and `context.report({ message, node })`; the diagnostics are printed with `warnDiagnostics`. A shared reporting helper keeps that sequence for the legacy rules.
- `Rules/EntryPoint.ts` and `Rules/External.ts`: keep their checks and their translation into `dependencies` policies, then `normalizeDependenciesRuleOptions({ ...options, policies })` and `evaluatePolicies`, and the same reporting helper.
- `Rules/NoPrivate.ts`: imports `customErrorMessage` and `elementDescriptionMessage` from `@boundaries/policies`.
- `Messages/` disappears. In `packages/eslint-plugin/eslint.config.mjs`, the `messages` element type goes, the `rule` policy loses `messages`, and the `public` policy goes because `Public/` re-exports only from `@boundaries/config` and `@boundaries/policies`; `packages/eslint-plugin/AGENTS.md` says eight element types and the new layering.
- The reported messages are byte-identical; the plugin's rule specs under `test/rules/` are the proof.

### 4. Layering, browser check, repository files

As phase 2, steps 4 to 6, with:

- The graph line `eslint-plugin → policies → config → elements` and the `policies` row in the `repo-architecture` skill.
- `.github/workflows/build.yml`: `policies` wherever `config` is named (`test-node-versions`, the `policies-build` and `policies-coverage` artifacts, `build-windows`, Coveralls, and a Sonar step guarded by `SONAR_TOKEN_POLICIES`). `.github/workflows/test-mutation.yml`: `policies` in the matrix.
- The browser check of `test/e2e/builds.spec.mjs` calls `describeDependency` and `evaluateDependency` on the quick-start example.
- `test/browser-e2e`: `src/scenarios/policies.js` (the home's step 3 case, an allowed dependency, a skipped one), and `policies` in `PACKAGES` of `scripts/build.js` and in its `package.json`.
- `README.md`: the interface table with one `evaluateDependency` example and its result.

## Verification

- `pnpm nx run-many -t check:all --all` and the e2e suite pass with no expectation changed.
- `pnpm nx graph` shows `eslint-plugin → policies → config → elements`, no cycle.
- The browser check passes; no `eslint`, `estree`, `eslint-module-utils`, `chalk` or `node:*` import and no `process` under `packages/policies/src`.
- A unit test of `policies` reproduces the home's step 3 case (quick-start config, `src/helpers/format` imported from `src/components/Price/index.ts`) and asserts the verdict, the policy index and the message the plugin reports for it (take the expected message from the plugin's own spec of that scenario).
- Coverage 100%, and `pnpm nx test:mutation policies` above the `break` threshold of `stryker.config.mjs`.

## Outcome

Deviations from the steps, also in the description of PR #588:

- `PolicyEvaluation` is a union on `allowed`: `message` is a `string` when `allowed` is `false` and `undefined` otherwise, so that a consumer reads the message without a cast. The RFC's `message?: string` reads the same.
- `policies` exports `DependencySkipOptions`, the type of the options that `getDependencySkipReason` reads, and keeps `DEPENDENCY_SKIP_REASONS_MAP` internal.
- The deprecated `CustomMessageTemplateRuleContext` alias is defined in the plugin's `Public/Messages.types.ts`, not in `policies`, so that the new package does not start with a deprecated type. The plugin exports the same names and types as before.
- The plugin keeps `evaluatePoliciesAndReport` in `Rules/Dependencies.ts` as the shared reporting helper: it takes normalized options, calls `evaluatePolicies`, prints the diagnostics with `warnDiagnostics` and, when the dependency is not allowed, prints `printDependenciesRuleResult` and reports the message. `entry-point` and `external` call it with `normalizeDependenciesRuleOptions({ default, message, policies })`.
- `entry-point` keeps its messages byte-identical by giving each translated policy the message of the user's policy at the same index (open point 1). The maintainer decided on 2026-10-29 not to file the bug, because the rule is deprecated.
- The error of a selector that makes the matcher throw is a `warning` diagnostic with the path `["policies", index]`, from the root of the options.
- `src/Evaluation/` is split into `Selectors.ts` (the merged selectors of each policy, cached by policy identity) and `Evaluation.ts` (`getDependencySkipReason`, `evaluatePolicies`, `evaluateDependency`). The moved specs keep testing the selector merging through `evaluatePolicies` with a mocked matcher; `src/index.spec.ts` runs the public interface on the quick-start example without mocks.
- The home's step 3 case is a helper importing a component (`src/helpers/format/index.js` reports `There is no policy allowing dependencies from elements of type "helper" to elements of type "component"`), not the reverse. With the quick-start patterns, a component is a folder two levels under `components/` (`components/atoms/Price`).

## Hand-offs

- To phases 5 and 6: `describeEntity(settings, path)` for the inspector; `describeDependency(settings, { from, to, source, kind, nodeKind, specifiers })` and `evaluateDependency(settings, options, description)` for the verdicts, with `options` the `dependencies` (or `element-types`) entry of `normalizeConfig`'s `rules`; the result is `{ checked: false, reason }` or `{ checked: true, allowed, policyIndex, match, message, diagnostics }`, with `message` set only when `allowed` is `false`; module origin for a sketched tree: `to` only for nodes of the sketch, everything else external or core (RFC #538, research 1). `getDependencySkipReason(options, description)` gives the reason alone.
- To the index: versions set (`policies` 1.0.0 in its `package.json`; the plugin's patch is set at release time from its `[Unreleased]` entries).
- Measured on 2026-10-29 with esbuild 0.28.2, minified and gzipped: `policies` alone is 4.2 KB; with `config`, `elements` and their dependencies it is 95.9 KB, against 73.2 KB for `config` and its dependencies, because `policies` pulls the matcher of `elements` and `handlebars`.

## Open points

- `entry-point` translates a policy with several `target` selectors into one `dependencies` policy per selector, and today `resolveCustomMessage` reads the custom message from the user's policies at the translated index, so a later policy can report another policy's message or none (found in phase 2, which keeps it). `evaluatePolicies` reads it from the translated policies, which is what the user wrote. Decided in the PR: the messages stay byte-identical, and the bug is not filed, because the rule is deprecated (maintainer, 2026-10-29).
- `DiagnosticsBuilder` is internal to `config`. `policies` reports one kind of problem (the `safeMatch` error), so it builds that `Diagnostic` itself. Decided in the PR: no new export from `config`; `policies` builds that `Diagnostic` itself.
- If the playground (phase 6) shows that the `elements` caches grow without bound over a long session, add a `clearCache()` to `policies` that delegates to the `Elements` instance, in its own PR into `release`. Default: none (RFC decision 7).
