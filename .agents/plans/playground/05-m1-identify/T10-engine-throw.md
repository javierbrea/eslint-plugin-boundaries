<!-- cspell:disable -->
# T10: a selector that the engine cannot normalize

Goal: `evaluate` never throws. A policy whose selector `@boundaries/elements` cannot normalize, such as `{ disallow: {} }`, makes `normalizeConfig` throw `Invalid entity selector`, so a policy half typed in the editor breaks the workbench. The engine turns it into an error placed at that policy and keeps the rest of the evaluation.

Read first: `README.md` of this folder (`ConfigProblem`, `Evaluation`); the engine (T2, `src/engine/`, committed), above all `Evaluate.ts`, `Diagnostics.ts` and `Summaries.ts`; `packages/config/src/Config/Config.ts` (`normalizeConfig` and `normalizeRuleEntry`) and `packages/config/src/RuleOptions/DependenciesRuleOptions.ts`; `packages/config/README.md` ("Diagnostics" and "Diagnostic Paths").

## Facts

Measured on 2026-11-04 with the built `@boundaries/config`:

- `normalizeConfig` validates each entry of a plugin rule with `validateRuleOptions` and then normalizes its options. It normalizes only `boundaries/dependencies` and `boundaries/element-types`, with `normalizeDependenciesRuleOptions`, and the error comes from `normalizeSingleEntitySelector` of `@boundaries/elements`. The throw drops every diagnostic collected before it.
- These policies throw: `{ disallow: {} }`, `{ allow: {} }`, `{ allow: { to: {} } }`, `{ allow: { to: { element: {} } } }` and `{ from: {}, allow: { to: { element: { type: "a" } } } }`, and the same under the legacy `rules` key of `boundaries/element-types`. `{}` and `{ from: 3 }` do not throw: they fail the schema (`Invalid rule options.`).
- For each policy that throws, `validateRuleOptions` returns a warning, `[boundaries/dependencies] Detected an unrecognized selector shape in 1 policy at indices: 0.`, at the path `["policies", 0]` of the options (`["rules", 0]` under the legacy key).
- The ESLint plugin normalizes the policies only for the dependencies it checks (RFC #559, Amendment 1), so ESLint stops with this error at the first dependency that the rule checks. The published packages stay as they are.

## Files

- `src/engine/Evaluate.ts`, and a helper module of the engine with its spec if that reads better. When `normalizeConfig` throws:
  - it finds the entries of the plugin rules that throw, by normalizing each one alone with the settings;
  - it normalizes the config again without them, and that value and its diagnostics are the evaluation's;
  - for each entry that throws, it adds the diagnostics of `validateRuleOptions` for its options, rooted at `["rules", <rule>, 1]`, with the `legacyWarnings` of the normalized settings;
  - for each policy of that entry that throws, found by normalizing it alone with `normalizeDependenciesRuleOptions`, it adds one `error`. Its title is the message of the error, `Invalid entity selector`, its detail is `ESLint stops with this error at the first dependency that the rule checks.`, and its path is the policy as written, `["rules", <rule>, 1, "policies" | "rules", <index>]`;
  - the problems of the entries that throw come after the problems of the rest of the config.
- The error is under `["rules", <rule>]`, so `rulesValid` is `false` and the summary of the rule is not valid without a change to `Diagnostics.ts` or `Summaries.ts`. The files are described with the normalized settings, as for any config.
- Specs, in `src/engine/Evaluate.spec.ts` or the helper's spec:
  - the quick-start config with `{ disallow: {} }` added to its policies: `evaluate` returns, the warning and the error are at the range of the policy, `rulesValid` is `false`, the summary of the rule is not valid, and the files are described as they are without the policy;
  - two policies that throw in one entry give two errors;
  - an entry that throws next to one that does not keeps the diagnostics of the other;
  - the legacy `rules` key of `boundaries/element-types`;
  - the memoization by sketch and by config text still holds.

## Notes

The texts that the plugin prints are not changed: the title is the message of the error and the warning is the one of `validateRuleOptions`. The note of the problems panel for invalid rule options (T8) stays as it is.

Done (2026-11-04) in `src/engine/NormalizeConfigSafely.ts`. One deviation: an entry of a rule that is off (`"off"` or `0`) also throws, because `normalizeConfig` normalizes its options without validating them; the engine leaves it out and reports nothing for it, because ESLint never runs a rule that is off and `normalizeConfig` reports nothing for the options of one either.
