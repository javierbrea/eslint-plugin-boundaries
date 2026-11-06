import type { DependenciesPolicyNormalized } from "@boundaries/config";

import type {
  DependencyResult,
  PolicyRef,
  PolicySummary,
} from "./engine.types";
import type { EvaluatedRule } from "./evaluatedRule.types";
import type { PolicyCount } from "./policies.types";
import { readSelectorNames } from "./selectorNames";

/** What a policy that decided no dependency has counted */
const NO_DECISIONS: PolicyCount = { decided: 0, disallowed: 0, errors: 0 };

/**
 * Counts the dependencies that each policy decided.
 * @param results The dependencies of the sketch with their verdicts.
 * @returns The count of each policy by its index, with `null` for the default. A dependency that is not checked or not evaluated counts for nobody, and neither does one whose custom message fails to render, as nothing says which policy decided it.
 */
function countDecisions(
  results: readonly DependencyResult[]
): Map<number | null, PolicyCount> {
  const counts = new Map<number | null, PolicyCount>();

  for (const { verdict } of results) {
    if (verdict.status !== "allowed" && verdict.status !== "disallowed") {
      continue;
    }
    const { policy } = verdict;
    if (policy === undefined) {
      continue;
    }
    const known = counts.get(policy.index) ?? NO_DECISIONS;
    const isDisallowed = verdict.status === "disallowed";
    counts.set(policy.index, {
      decided: known.decided + 1,
      disallowed: known.disallowed + (isDisallowed ? 1 : 0),
      errors:
        known.errors + (isDisallowed && verdict.level === "error" ? 1 : 0),
    });
  }
  return counts;
}

/**
 * Tells what a policy does with the dependencies it matches.
 * @param policy The policy, normalized.
 * @param policy.allow
 * @param policy.disallow
 * @returns `disallow` when it has a `disallow` and no `allow`, `allow` when it has an `allow` and no `disallow`, and `both` otherwise.
 */
function getAction({
  allow,
  disallow,
}: DependenciesPolicyNormalized): PolicySummary["action"] {
  if (disallow !== undefined && allow === undefined) {
    return "disallow";
  }
  return allow !== undefined && disallow === undefined ? "allow" : "both";
}

/**
 * Summarizes the policies of the rule that is evaluated, and its default.
 * @param rule The rule, with the places of its policies in the config text.
 * @param results The dependencies of the sketch with their verdicts.
 * @returns One summary for each policy of the rule, in their order, then one for the default. Each counts the dependencies it decided, the ones it disallowed and how many of those are errors, from the verdicts.
 */
export function summarizePolicies(
  rule: EvaluatedRule,
  results: readonly DependencyResult[]
): PolicySummary[] {
  const counts = countDecisions(results);
  const countOf = ({ index }: PolicyRef): PolicyCount =>
    counts.get(index) ?? NO_DECISIONS;

  return [
    ...rule.policies.map(
      (ref, index): PolicySummary => ({
        index,
        action: getAction(rule.options.policies[index]),
        ...readSelectorNames(rule.options.policies[index]),
        ...countOf(ref),
        range: ref.range,
      })
    ),
    {
      index: null,
      action: rule.options.default,
      from: [],
      to: [],
      ...countOf(rule.defaultPolicy),
      range: rule.defaultPolicy.range,
    },
  ];
}
