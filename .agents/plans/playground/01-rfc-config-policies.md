<!-- cspell:disable -->
# Phase 1: inventory of the plugin and the RFC of `@boundaries/config` and `@boundaries/policies`

Goal: a GitHub Discussion in the RFCs category that fixes the cut between the plugin and the two new packages, their public interfaces, how the plugin consumes them and how they are versioned and released, so that phases 2 and 3 implement it without design decisions of their own. The inventory that supports it is posted on #539 as research note 2.

Issue: #548. No branch and no PR: the outputs are a comment on #539, a Discussion, and an amendment to RFC #538. The plan edit of this phase (the final inventory and interfaces copied into `02-config.md` and `03-policies.md`) goes on `feat/539/playground` with the maintainer's approval.

Read first:

- RFC #538, "Decisions" 1 and the table of the resulting layering, and "Research tasks" 2: the names, the first inventory and the candidate interfaces (`normalizeSettings`, `normalizeRuleOptions`; `describeFile`, `describeDependency`, `evaluateDependency`).
- RFC #513 (https://github.com/javierbrea/eslint-plugin-boundaries/discussions/513), point 7: the MCP server is the second consumer of the same layer; its needs (describe a file, check a dependency, explain a violation) are inputs to the interfaces.
- `docs/contributing-workflow.md`, step 1: how an RFC is written and amended. The existing RFCs are the style model: #538 for a long one with closed decisions, #513 for a short one with open questions.
- `packages/eslint-plugin/AGENTS.md` and `packages/eslint-plugin/eslint.config.mjs`: the nine element types of the plugin and the lint-enforced layering the cut must respect.
- `packages/elements/AGENTS.md` and `packages/elements/src/index.ts`: what `elements` already exposes (`Elements`, matchers, descriptors, `Config` normalization of the settings shape, `describeElement`, `isDependencyMatch`). Nothing that exists there is duplicated in the new packages.
- `docs/adr/adr-0001-multidimensional-classification-entity-model.md`: the entity model (element, file, module) the interfaces describe.

Preconditions: none. This phase can start now and run in parallel with #510.

## Scope

In: the inventory, the interfaces, the plugin migration, the layering of each package, the versioning and release policy, the browser constraint, the RFC text, the amendment to #538. Out: any code.

## Steps

### 1. Inventory

Produce a table with one row per exported symbol (or per cohesive group) of these modules, with columns `symbol`, `file`, `destination` (`config`, `policies`, `plugin`, `splits`), `ESLint or Node.js coupling to remove`, `consumers in the plugin`. The starting point, from a read of the sources on 2026-10-25 (line counts without specs):

| Module | Lines | What it holds | Likely destination |
| --- | --- | --- | --- |
| `Settings/Settings.ts` | 1044 | Normalization and validation of every `boundaries/*` setting (`getNormalized*`), legacy types and alias deprecations, debug filters; `getSettings(context)` caches by `context.settings` | `config`; `getSettings(context: Rule.RuleContext)` becomes a plugin adapter around a pure `normalizeSettings(raw)`; `node:path` (`isAbsolute`, `resolve` for `rootPath`) leaves: `config` returns the setting as written and the plugin resolves it, or the caller passes a `cwd` |
| `Settings/Rules.ts` | 1443 | Rule options: JSON schemas (`rulesOptionsSchema`, `legacyPoliciesSchema`), type guards, legacy formats (`rules` vs `policies`, `importKind`, `${}` templates), `validateAndWarnRuleOptions`, `normalizeRuleOptions` with the precomputed `allow` / `disallow` selectors | `config` (schemas, validation, normalization); the warning side effects (`warnOnce` from `Debug`) become returned diagnostics |
| `Settings/Docs.ts` | 179 | URLs of the docs and migration guides used in warnings and messages; imports `Rule` from ESLint only for `deprecatedRuleInfo` | `config` (URL constants and builders), the ESLint-typed helper stays |
| `Shared/Settings.types.ts` | 911 | Every constant and type: rule names, setting keys, defaults, `Settings`, `SettingsNormalized`, rule options types, `RuleEffect`; `Config` and `PluginBoundaries` extend ESLint types | `config` for constants and types; `Config` and `PluginBoundaries` stay in the plugin (`Public/`) |
| `Shared/TypeHelpers.ts` | 71 | `isString`, `isObject`, ... | `config`, re-exported where needed |
| `Messages/Messages.ts` | 969 | Default messages: `elementDescriptionMessage`, `dependenciesRuleMatchedMessage`, `dependenciesRuleDefaultErrorMessage` and the messages of the other rules | `policies` (the messages of the `dependencies` evaluation); messages of the other rules follow their rule (see step 2) |
| `Messages/CustomMessages.ts` | 353 | Handlebars templating of custom messages, legacy `${}` replacements | `policies` |
| `Elements/Elements.ts` | 149 | `getElementsMatcher(settings)` (cache of `Elements` matchers per settings), `getSpecifiers(node)` (ESLint AST), `entityDescription`, `dependencyDescription` (uses `eslint-module-utils/resolve`) | splits: matcher cache and descriptions to `policies` with the resolved path as input; AST reading and module resolution stay in the plugin |
| `Rules/Dependencies.ts` | 858 | `evaluatePolicies(rules, dep, matcher, settings)` with last-match-wins and `disallow` over `allow` within a policy, `resolveCustomMessage`, `buildErrorMessage`; `evaluatePoliciesAndReport` and the rule definition | `policies` for the first three; the rule and `report` stay |
| `Rules/Support/*`, `Rules/*.ts` (other rules), `Config/*`, `Debug/Debug.ts`, `src/index.ts` | — | ESLint rule factory, the rules, flat configs, console output with `chalk`, the plugin object | plugin |

Confirm each row against the code (imports of `eslint`, `estree`, `node:*`, `eslint-module-utils`, `chalk`), and list the test files that move with each module (`*.spec.ts` next to the sources, fixtures under `packages/eslint-plugin/test/`).

### 2. The cut

Decide and write down:

- Which rules' logic beyond `dependencies` is shared with `policies` (`entry-point`, `external`, `no-private` all match selectors against descriptions). The RFC's position is that `policies` serves the `dependencies` evaluation first; say whether the other rules' evaluation moves now, later, or never, and keep the plugin's behavior unchanged either way.
- How `config` reports problems without a console: a result type such as `{ value, diagnostics: Array<{ level: "error" | "warning", message, path?, position? }> }` for settings and for rule options. The plugin prints diagnostics through its `Debug` module with the same texts as today; the playground lists them in its problems panel. Positions are the JSON path into the input (the editor maps paths to source positions, see `04-scaffold.md`).
- Whether `config` exposes the JSON schemas for the rule `meta` (the plugin needs them) and in what form.
- What `policies` returns for a dependency: the verdict, the index of the deciding policy, the matched selector and effect, and the templated message, as one result (`evaluateDependency(settings, ruleOptions, from, to, dependencyInfo?)`), and whether `describeFile` / `describeDependency` are thin wrappers over `elements` that only add the plugin's conventions (module origin from the sketch, `flagAsExternal`).
- Caching: the plugin caches normalized settings by `context.settings` identity and matchers by settings; say which caches move (identity-keyed `WeakMap`s are fine in the browser) and which stay.

### 3. Plugin migration

List the plugin files that become adapters and what each one does afterwards; state that the public exports of `@boundaries/eslint-plugin` (types under `Public/`, `configs`) do not change, re-exporting from `config` where they used to be local, so that consumers of the plugin's types are not affected.

### 4. Layering of the new packages

Propose the element types of `packages/config/src` and `packages/policies/src` (for example `settings`, `rules`, `schemas`, `diagnostics`, `shared` in `config`; `evaluation`, `messages`, `description`, `shared` in `policies`) and their downward policies, and whether each package lints itself with the plugin (see `00-shared.md`, section 3, the cycle question).

### 5. Versioning and release

Propose: initial versions (`1.0.0` for both is the default proposal: they are new public packages with a committed interface), the plugin bump (a patch by the CONTRIBUTING rule for internal dependency changes, or a minor because two new public packages appear in its dependency tree; propose one and the reason), what `publish-to-github.yml` and the `release` skill must add, and whether the website docs document the packages now (proposal: a short "Packages" mention in the elements README style, full docs later).

### 6. Browser constraint

State it as an acceptance criterion of both packages, with the check of `00-shared.md` section 4.

### 7. Write and publish

- Post the inventory table on #539 as "Research note 2: extraction inventory".
- Open the Discussion in the RFCs category: `**Status:** 🟡 Draft, open for comments`, Summary, Motivation (two sentences, pointing to #538), Decisions proposed (the cut, the interfaces as TypeScript signatures, the migration, the layering, versioning), Alternatives considered (re-implementing in the website, running ESLint in the browser, one package instead of two: all discarded in #538, one line each), Acceptance (the criteria of #549 and #550), Sub-issues (#549, #550). Write it with the `writing-style` skill; show the maintainer the full text before posting.
- Add an amendment to #538 linking the new RFC from its "Dependencies" and "Decisions" sections (format in `docs/contributing-workflow.md`).
- Link the RFC in #548 and tick its acceptance criteria.

## Verification

- The maintainer approves the RFC text before it is posted.
- Every symbol of the inventory has a destination and every ESLint or Node.js import of the moved modules has a stated replacement.
- The RFC's "Acceptance" matches the acceptance criteria of #549 and #550; if the RFC changes them, the issues are edited in the same session.

## Hand-offs

- To phase 2 and 3: the final inventory and the interfaces, copied into `02-config.md` and `03-policies.md` ("Steps") as part of this phase's plan update.
- To phase 4: the diagnostics shape (paths and positions) the config editor maps to source positions.
- To the maintainer: the versioning proposal (open question of the index).

## Open points

- Whether `policies` moves the evaluation of the rules other than `dependencies` now. Default: no; the RFC records it as a later step with the shared matching helpers moved only if the `dependencies` evaluation needs them.
- Whether `config` keeps the Node.js resolution of `rootPath`. Default: no; `config` returns the raw setting plus a `cwd` parameter contract and the plugin resolves it.
