import type {
  DependencyResult,
  DependencyVerdict,
} from "@/domains/evaluation/helpers/engine";

import type { VerdictCounts } from "./verdictCounts.types";

/**
 * Counts the dependencies of a set whose verdict has a given status.
 * @param results The dependencies with their verdicts.
 * @param wanted The status to count.
 * @returns How many have it.
 */
function countStatus(
  results: readonly DependencyResult[],
  wanted: DependencyVerdict["status"]
): number {
  return results.filter(({ verdict }) => verdict.status === wanted).length;
}

/**
 * Counts the dependencies of a file or of the whole sketch by what the engine decided.
 * @param results The dependencies with their verdicts, such as the ones of a file in `Evaluation.dependencies`.
 * @returns The total and how many were allowed, disallowed and not checked. A disallowed dependency counts whatever the level of the rule, and one that is not evaluated counts only in the total.
 */
export function countVerdicts(
  results: readonly DependencyResult[]
): VerdictCounts {
  return {
    total: results.length,
    allowed: countStatus(results, "allowed"),
    disallowed: countStatus(results, "disallowed"),
    notChecked: countStatus(results, "not-checked"),
  };
}
