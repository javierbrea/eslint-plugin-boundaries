<!-- cspell:disable -->
# Phase 3: `@boundaries/policies`

Goal: a new published package `@boundaries/policies` (`packages/policies`) that evaluates normalized rule options against described files and dependencies and produces the messages, with the `dependencies` rule of the plugin reduced to AST reading, resolution and `report`.

Issue: #550. Branch `feat/550/policies-package` from `release` (after phase 2 is merged); PR into `release`, title `feat: Extract @boundaries/policies from the plugin`, `closes #550`. Changelog entries: `packages/policies/CHANGELOG.md` (first version) and `packages/eslint-plugin/CHANGELOG.md` (`refactor(#550): ...`). Versions as the RFC decided. The PR description lists the moved modules, the adapters left in the plugin, the bundle check result, and an example call of the evaluation interface with its result.

Read first:

- The RFC of phase 1, and this file once phase 1 updated it with the final interfaces.
- `02-config.md` and its PR: the package shape and the self-linting decision are repeated here.
- `packages/eslint-plugin/src/Rules/Dependencies.ts` (`evaluatePolicies`, `resolveCustomMessage`, `buildErrorMessage`, `evaluatePoliciesAndReport`), `Messages/`, `Elements/Elements.ts`, `Debug/Debug.ts` (`printDependenciesRuleResult`, which stays), and the specs under `packages/eslint-plugin/src/Rules/` and `test/`.
- `packages/elements/src/index.ts`: `Elements`, `Matcher`, `describeElement`, `isDependencyMatch`, the description types; `policies` builds on them and duplicates nothing.

Preconditions: phase 2 merged into `release`; this file updated with the RFC interfaces.

## Scope

In: the package, the evaluation and message modules, the description helpers, the plugin adapters, the browser check, the repository files. Out: the rules other than `dependencies` beyond what the RFC moves, `boundaries/debug` output (stays in the plugin), any behavior change.

## Steps

### 1. Package scaffold

As phase 2, copying `packages/config`: name `@boundaries/policies`, `dependencies: { "@boundaries/elements": "workspace:*", "@boundaries/config": "workspace:*", "handlebars": <same version as elements> }` if the templating stays on Handlebars (it does: `CustomMessages.ts`), `project.json` name `policies`. CI jobs that enumerate packages gain it.

### 2. Move the modules

Per the RFC inventory: `evaluatePolicies` and the message builders from `Rules/Dependencies.ts`, `Messages/Messages.ts` and `CustomMessages.ts` (the parts the `dependencies` evaluation uses, the other rules' messages following the RFC's decision), the matcher cache and the description helpers from `Elements/Elements.ts` with the resolved path as an input (no `eslint-module-utils`, no AST). Expose the interface the RFC fixed: at least `evaluateDependency(settings, ruleOptions, from, to, dependencyInfo?) → { allowed, policyIndex, effect, selector, message }`, `describeFile(settings, path)`, `describeDependency(settings, from, to, dependencyInfo?)`, with the matcher cached per settings object.

### 3. Plugin adapters

`Rules/Dependencies.ts` keeps the rule definition, `evaluatePoliciesAndReport` (now a call to `evaluateDependency` followed by `printDependenciesRuleResult` and `context.report`) and the AST-to-dependency conversion (`getSpecifiers`, `dependencyDescription` with `eslint-module-utils/resolve`). The reported messages are byte-identical; the plugin's rule specs are the proof.

### 4. Layering, browser check, repository files

As phase 2, steps 4 to 6, with the graph line `eslint-plugin → policies → config → elements` and the `policies` row in the `repo-architecture` skill. `README.md`: the interface table with one example.

## Verification

- `pnpm nx run-many -t check:all --all` and the e2e suite pass with no expectation changed.
- `pnpm nx graph` shows `eslint-plugin → policies → config → elements`, no cycle.
- The browser check passes; no `eslint`, `estree`, `eslint-module-utils`, `chalk` or `node:*` import under `packages/policies/src`.
- A unit test of `policies` reproduces the home's step 3 case (quick-start config, `src/helpers/format` imported from `src/components/Price/index.ts`) and asserts the verdict, the policy index and the message the plugin reports for it (take the expected message from the plugin's own spec of that scenario).
- Coverage 100%.

## Hand-offs

- To phases 5 and 6: the exact interface and result type of the evaluation, the shape of `dependencyInfo` (kind, specifiers, node type) the picker must produce, and how module origin is given for a sketched tree (everything not in the sketch is external, RFC research 1).
- To the index: versions set.

## Open points

- If `getElementsMatcher`'s cache keyed by `SettingsNormalized` identity is what the playground needs to re-evaluate after each edit, keep it in `policies`; if the playground needs explicit invalidation, expose `clearCache()` as `elements` does. Default: identity cache, no explicit API.
