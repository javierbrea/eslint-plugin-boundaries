# Phase 10: a name for a policy

## Goal

A policy of `boundaries/dependencies` takes an optional `name`, a short string (decision 39). The default message of a denied dependency names it, `Denied by policy "<name>" (index N)`, a custom `message` reads it as `{{policy.name}}`, two policies of one rule with the same name give a warning diagnostic, and the playground shows the name where it shows the position today. A config with no `name` gives the messages and the diagnostics it gives today.

## Issue and PR

- Closes #689. Branch `feat/689/policy-name`, from `release`. PR into `release`, titled `feat(config): add a name to a policy`. It blocks no phase: the graph falls back to the position.
- The PR commits no plan file (`write-plan` skill, "Where it lives", point 4). The session reads the plan with `git show origin/feat/architecture-graph:.agents/plans/architecture-graph.md`, and the same for `architecture-graph/00-shared.md` and this file. Its plan edits are commits on `feat/architecture-graph`, pushed once the maintainer approves them.
- Changelog entries, by `.agents/rules/changelog-and-versioning.md` and `.github/CONTRIBUTING.md`, "Versioning". The property is new and optional, so each is a MINOR:
  - `packages/config/CHANGELOG.md`: `feat(#689)`, the `name` of a policy in the types and the schema, and the warning for a repeated name.
  - `packages/policies/CHANGELOG.md`: `feat(#689)`, the default message names the policy and custom messages get `{{policy.name}}`.
  - `packages/eslint-plugin/CHANGELOG.md`: `feat(#689)`, what a user of the plugin writes and reads.
  - `packages/website/CHANGELOG.md`, under `## [Unreleased]`: a `feat(#689)` entry for the playground and a `docs` entry for the pages.
  - `packages/analysis/CHANGELOG.md`, only if #686 is merged: no new entry while the package is unreleased, its first entry describes it as released; a `feat(#689)` entry if it was released.
  - The entries go under `## [Unreleased]`, or under the unreleased version section when the PR bumps the versions. The PR does not have to bump them; the release does (`release` skill).
- The PR description shows the message with and without a name, the warning as the plugin prints it, and a screenshot of the playground with a named policy.

## Read first

- Decision 39 of the index, and #689.
- `packages/config/AGENTS.md`: the layering, that functions never print, and that a title or a detail of a diagnostic is the text the plugin prints.
- `packages/policies/AGENTS.md`: the messages are the plugin's output.
- `packages/config/src/Shared/Settings.types.ts`: `DependenciesPolicy` and `DependenciesPolicyNormalized`, which have `importKind` and `message` and no name.
- `packages/config/src/Schemas/Schemas.ts`: `rulesOptionsSchema` builds the schema of a policy, `policyEntrySchema`, with `additionalProperties: false`. One object, `dependenciesRuleOptionsSchema`, is the schema of both `boundaries/dependencies` and the deprecated `boundaries/element-types` in `RULE_OPTIONS_SCHEMAS`, and `policyEntrySchema` is used for `policies` and for its deprecated alias `rules`. The legacy rules `entry-point` and `external` go through the same function with `isLegacy: true`.
- `packages/config/src/RuleOptions/`: `normalizeDependenciesPolicy` copies each property of a policy, and `validateRuleOptions` is where the options get their diagnostics. `packages/config/src/Diagnostics/`: the levels and the builder.
- `packages/policies/src/Messages/Messages.ts`: the default message ends with `Denied by policy at index ${ruleIndex}`. `packages/policies/src/Messages/CustomMessages.ts` and `CustomMessages.types.ts`: the template context, where `policy` is `{ index, selector }` and `rule` is the same object under its deprecated name.
- `packages/eslint-plugin/src/Rules/Dependencies.ts`: the rule takes its schema from `getRuleOptionsSchema` of `@boundaries/config`.
- `packages/website/docs/rules/dependencies.md` ("Options", "Error Messages") and `packages/website/docs/policies/policies.mdx` ("Policy Properties", and the table of template variables that has `{{policy.index}}`).
- `.agents/rules/docs-authoring.md`, `.agents/rules/mutation-testing.md` and `.agents/rules/eslint-rule-authoring.md`.

## Preconditions

None. It can run before or after any other phase. "Steps", point 5, says what changes with #686.

## Scope

- In: the type, the schema, the normalization and the duplicate warning in `@boundaries/config`; the default message and the template variable in `@boundaries/policies`; the tests of the plugin; the name in the policy summaries and in the playground; the docs.
- Out: a `description` of a policy; the deprecated rules, which do not take the property (decision 39); functions for custom messages (#315); the graph, which reads the name in phase 7.
- Handed on: the `name` of the policy summaries, to phase 7.

## Steps

Every change goes through the `implement-change` skill; this one adds to a public type and crosses four packages.

1. **`@boundaries/config`.**
   - `DependenciesPolicy` and `DependenciesPolicyNormalized` gain `name?: string`, with TSDoc, and `normalizeDependenciesPolicy` carries it.
   - The schema of a policy of `boundaries/dependencies` accepts `name` as a string. The schemas of the deprecated rules stay as they are; "Open points" says what that means for `boundaries/element-types`, which shares the schema object today.
   - Two policies of one rule with the same `name` give one diagnostic of level `warning`, with the paths of every policy that repeats the name, and both policies still apply. It is added where the options of the rule are validated, through `DiagnosticsBuilder`. Its title and detail follow the ones the package has, with the docs link built in `packages/config/src/Docs/`.
2. **`@boundaries/policies`.**
   - The default message of a denied dependency ends with `Denied by policy "<name>" (index N)` when the policy that decided has a name, and with `Denied by policy at index N` when it has none, as today.
   - The template context of a custom message gets `policy.name`, in `CustomMessageTemplatePolicyContext`. The deprecated `rule` alias is the same object, so it gets it too.
3. **`eslint-plugin`.** No code is expected to change: the rule takes the schema and the messages from the two packages. Its rule specs and `test/eslint-plugin-e2e` get cases with a named policy, and `packages/eslint-plugin/src/Shared/Settings.types.ts` and `src/Public/Rules.types.ts`, which name `DependenciesPolicy`, are checked for a type of their own that needs the property.
4. **The docs.** `packages/website/docs/rules/dependencies.md`: `name` in the properties of a policy under "Options", and the named form of the message under "Error Messages". `packages/website/docs/policies/policies.mdx`: a `name` section under "Policy Properties", and `{{policy.name}}` in the table of template variables. `packages/website/docs/guides/playground.md` describes `✓ policy N` as the policy at index `N`: it follows what the playground shows. The docs change only under `packages/website/docs/`, the unreleased version; `packages/website/AGENTS.md` says when a snapshot changes too.
5. **The summaries and the playground.**
   - `PolicySummary` gains the name of its policy. If #686 is merged, the type and the policy summaries are in `packages/analysis`, where `analyzeConfig` builds the part that depends on the config only, the name included (decision 41), and the engine of the playground maps it; if it is not, they are in `packages/playground/src/domains/evaluation/helpers/engine/` (`engine.types.ts`, `policies.ts`), and phase 2 moves them with the name.
   - The playground shows the name in place of the position wherever it names a policy. `getPolicyName` of `packages/playground/src/domains/evaluation/ui/helpers/verdictText/verdictText.ts` returns `policy 2` today, and `explainEmptyMessage` of the engine's `dependencies.ts` writes `the policy at index N`. A search for the callers of `getPolicyName` and for `policy.index` and `PolicySummary` gives the rest. A policy with no name reads as today.

## Verification

- `pnpm nx run-many -t check:all --all` passes (criterion 5).
- Criterion 1, no `name` behaves as today: the existing specs of `config`, `policies`, `eslint-plugin` and `playground` pass with no assertion changed, and `test/eslint-plugin-e2e` passes unchanged.
- Criterion 2: unit tests in `packages/policies/src/Messages/` for the default message with a name and for `{{policy.name}}` with and without a name, and in `packages/config/src/RuleOptions/` or `src/Config/` for the warning: its level, its paths, that two unnamed policies give none, and that the same name in two different rules gives none. `pnpm nx test:mutation config` and `pnpm nx test:mutation policies` stay over their thresholds.
- A spec of the schema shows that `name` passes in `boundaries/dependencies` and that a non-string `name` fails, and states what each deprecated rule does with it.
- Criterion 3: a spec of the playground shows the name of a named policy where an unnamed one shows its position, and the PR has the screenshot.
- Criterion 4: the three changelogs have their `feat(#689)` entry, and `node scripts/check-changelogs.js origin/release HEAD origin/master` passes.
- `pnpm nx build website` passes with the docs changed, and every heading that a docs link of `packages/config/src/Docs/` points to keeps its anchor.

## Hand-offs

- To phase 7 (`07-graph-views.md`): the name of the field of `PolicySummary` that holds the name, and that it is `undefined` for a policy with none and for the default, so that the graph falls back to the position (`00-shared.md`, "Views").
- To phase 2 (`02-analysis-package.md`), when this phase merges first: `PolicySummary` and `summarizePolicies` of the engine carry the name, and the extraction moves them as they are. When phase 2 merges first, this phase adds the name in `packages/analysis` and corrects `00-shared.md` if the interface there lists the fields.

## Open points

- **`boundaries/element-types`.** Decision 39 says the deprecated rules do not take the property, and `boundaries/element-types` shares the schema object and the `DependenciesPolicy` type of `boundaries/dependencies`. Default: the decision applies to it, so `rulesOptionsSchema` builds a second schema without `name` for `RULE_NAMES_MAP.ELEMENT_TYPES`, a config with `name` there fails its schema as today, and the shared type documents that only `boundaries/dependencies` reads it. Ask the maintainer before the split if it costs more than one option of `rulesOptionsSchema`.
- **The deprecated `rules` alias of `policies`.** It is an option name of `boundaries/dependencies`, not a deprecated rule, and uses the same `policyEntrySchema`. Default: it takes `name`.
- **"Short".** Decision 39 says a short string and gives no limit. Default: any string, with no maximum length in the schema, and the docs say it is meant to be short. An empty `name` is treated as no name unless the maintainer prefers a schema error.
- **Where the duplicate warning is computed.** `normalizeDependenciesRuleOptions` reports no problem by contract and `validateRuleOptions` does. Whether `validateRuleOptions` sees the policies of each rule in a place that fits the check was not read. Default: there, and never in the normalization.
- **The debug output of the plugin.** `packages/eslint-plugin/src/Debug/Debug.ts` prints `Policy at index N reported a violation`. #689 does not list it. Default: it names the policy the same way as the default message, since it is the same reference, and the PR says so.
- **The quoting of the name.** The message wraps the name in double quotes. Default: the name is written as it is, with no escaping, as the other values of the message are; check how `formatPropertyValue` of `Messages.ts` writes a value before choosing.
- **The version sections.** Default: entries under `## [Unreleased]` and no version bump in the PR.
