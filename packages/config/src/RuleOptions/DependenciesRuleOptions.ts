import {
  isBackwardCompatibleDependencySelector,
  normalizeDependencyInfoSelector,
  normalizeDependencySelector,
  normalizeEntitySelector,
} from "@boundaries/elements";

import {
  isUndefined,
  RULE_EFFECT_ALLOW,
  RULE_EFFECT_DISALLOW,
} from "../Shared";
import type {
  DependenciesPolicy,
  DependenciesPolicyNormalized,
  DependenciesRuleOptions,
  DependenciesRuleOptionsNormalized,
} from "../Shared";

/**
 * Normalizes the `allow` or `disallow` selector of a policy, which can be a dependency selector or, for backward compatibility, an entity selector.
 * @param selector The `allow` or `disallow` value of the policy.
 * @returns The normalized selector, or undefined when the policy does not define it.
 */
function normalizePolicyEffectSelector(
  selector: DependenciesPolicy["allow"] | DependenciesPolicy["disallow"]
):
  | DependenciesPolicyNormalized["allow"]
  | DependenciesPolicyNormalized["disallow"] {
  if (isUndefined(selector)) {
    return selector;
  }
  if (isBackwardCompatibleDependencySelector(selector)) {
    return normalizeDependencySelector(selector);
  }
  return normalizeEntitySelector(selector);
}

/**
 * Normalizes the selectors of a policy of the dependencies rule.
 * @param policy The policy, as the user wrote it.
 * @returns The policy with its selectors normalized.
 */
function normalizeDependenciesPolicy(
  policy: DependenciesPolicy
): DependenciesPolicyNormalized {
  return {
    from: policy.from ? normalizeEntitySelector(policy.from) : undefined,
    to: policy.to ? normalizeEntitySelector(policy.to) : undefined,
    dependency: policy.dependency
      ? normalizeDependencyInfoSelector(policy.dependency)
      : undefined,
    importKind: policy.importKind,
    allow: normalizePolicyEffectSelector(policy.allow),
    disallow: normalizePolicyEffectSelector(policy.disallow),
    message: policy.message,
  };
}

/**
 * Applies the defaults of the dependencies rule options and normalizes the selectors of their policies. It assumes options that passed the rule schema, and reports no problem: `validateRuleOptions` does.
 * @param options The options of the dependencies rule, or of the deprecated `element-types` rule, or the `dependencies` policies that a legacy rule translates its options into.
 * @returns The normalized options. Each policy keeps the index it has in the options. The selectors are shared with the memoization of `@boundaries/elements`: do not mutate them.
 */
export function normalizeDependenciesRuleOptions(
  options: DependenciesRuleOptions | undefined
): DependenciesRuleOptionsNormalized {
  const policies = options?.policies ?? options?.rules ?? [];
  return {
    default:
      options?.default === RULE_EFFECT_ALLOW
        ? RULE_EFFECT_ALLOW
        : RULE_EFFECT_DISALLOW,
    message: options?.message,
    policies: policies.map(normalizeDependenciesPolicy),
    checkAllOrigins: options?.checkAllOrigins ?? false,
    checkUnknownLocals: options?.checkUnknownLocals ?? false,
    checkInternals: options?.checkInternals ?? false,
  };
}
