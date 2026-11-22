import type {
  ConfigAnalysis,
  ElementTypeSummary,
  FileCategorySummary,
  PolicySummary,
} from "../Config";

import type { PolicyCount } from "./Counts.types";
import type { DependencyResult } from "./Evaluation.types";

/** What a policy that decided no dependency has counted */
const NO_DECISIONS: PolicyCount = { decided: 0, disallowed: 0, errors: 0 };

/**
 * Counts the dependencies that each policy decided.
 * @param results The dependencies of the project with their verdicts.
 * @returns The count of each policy by its index, with `null` for the default. A dependency that is not checked or not evaluated counts for nobody, and neither does one whose custom message fails to render, as nothing says which policy decided it.
 */
function countDecisions(
  results: readonly DependencyResult[]
): Map<number | null, PolicyCount> {
  const counts = new Map<number | null, PolicyCount>();

  for (const { verdict } of results) {
    // Surviving Stryker mutant: replacing the condition with false survives because a verdict that is not allowed or disallowed has no `policy`, so the check of the policy below skips it as well; the condition narrows the type of the verdict
    // Stryker disable next-line BlockStatement: emptying the block is the same as replacing the condition with false, which survives for the reason above
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
 * Adds to the summaries of the policies the dependencies that each one decided.
 * @param policies The summaries of the policies of the evaluated rule and its default, as the analysis of the config gives them.
 * @param results The dependencies of the project with their verdicts.
 * @returns Each summary, in the same order, with how many dependencies it decided, how many of them it disallowed and how many of those are errors.
 */
export function addPolicyDecisions(
  policies: ConfigAnalysis["policies"],
  results: readonly DependencyResult[]
): PolicySummary[] {
  const counts = countDecisions(results);
  return policies.map((summary) => ({
    ...summary,
    ...(counts.get(summary.index) ?? NO_DECISIONS),
  }));
}

/**
 * Adds to the summaries of the file descriptors the files of the project that each one gives its category to.
 * @param fileCategories The summaries of the file descriptors, as the analysis of the config gives them: one per descriptor of the normalized settings, in their order.
 * @param fileDescriptorFiles How many files each file descriptor of the normalized settings labels, in their order.
 * @returns Each summary, in the same order, with the files of the descriptor at its position.
 */
export function addFileCategoryFiles(
  fileCategories: ConfigAnalysis["fileCategories"],
  fileDescriptorFiles: readonly number[]
): FileCategorySummary[] {
  return fileCategories.map((summary, position) => ({
    ...summary,
    files: fileDescriptorFiles[position],
  }));
}

/**
 * Adds to the summaries of the element descriptors the files of the project that each one gives its type to.
 * @param elementTypes The summaries of the element descriptors as written, as the analysis of the config gives them. The normalized settings keep, in their order, the ones that are not ignored.
 * @param elementDescriptorFiles How many files each element descriptor of the normalized settings labels, in their order.
 * @returns Each summary, in the same order, with the files of the normalized descriptor at its position among the summaries that are not ignored, or 0 when it is ignored.
 */
export function addElementTypeFiles(
  elementTypes: ConfigAnalysis["elementTypes"],
  elementDescriptorFiles: readonly number[]
): ElementTypeSummary[] {
  const kept = elementTypes.filter(({ ignored }) => !ignored);
  return elementTypes.map((summary) => ({
    ...summary,
    files: summary.ignored ? 0 : elementDescriptorFiles[kept.indexOf(summary)],
  }));
}
