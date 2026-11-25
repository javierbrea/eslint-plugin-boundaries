import type { DependenciesPolicyNormalized } from "@boundaries/config";

import type { EvaluatedRule, PolicySummary } from "./Config.types";
import { readSelectorNames } from "./SelectorNames";

/**
 * Tells what a policy does with the dependencies it matches.
 * @param policy The policy, normalized.
 * @param policy.allow What it allows.
 * @param policy.disallow What it disallows.
 * @returns `disallow` when it has no `allow`, `allow` when it has no `disallow`, and `both` when it has both; a policy with neither never reaches it, because the schema of `@boundaries/config` requires one of them, so the rules are invalid and no policy is summarized.
 */
function getAction({
  allow,
  disallow,
}: DependenciesPolicyNormalized): PolicySummary["action"] {
  if (allow === undefined) {
    return "disallow";
  }
  return disallow === undefined ? "allow" : "both";
}

/**
 * Summarizes the policies of the rule that is evaluated, and its default, without the dependencies they decided, which depend on the project.
 * @param rule The rule, with the paths of its policies in the config object.
 * @returns One summary for each policy of the rule, in their order, then one for the default, each with what it does, the element types and file categories that it names, and its path.
 */
export function summarizePolicies(
  rule: EvaluatedRule
): Omit<PolicySummary, "decided" | "disallowed" | "errors">[] {
  return [
    ...rule.policies.map((ref, index) => ({
      index,
      action: getAction(rule.options.policies[index]),
      ...readSelectorNames(rule.options.policies[index]),
      path: ref.path,
    })),
    {
      index: null,
      action: rule.options.default,
      from: [],
      to: [],
      path: rule.defaultPolicy.path,
    },
  ];
}
