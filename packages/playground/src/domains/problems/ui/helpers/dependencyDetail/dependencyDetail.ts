import type { PendingVerdict } from "@/domains/evaluation/ui/helpers/evaluationStatus";
import {
  getPolicyName,
  getSkipReasonSentence,
  getVerdictIcon,
  getVerdictLabel,
  getVerdictMeta,
  getVerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";
import type { DependencyDetailFacts } from "@/domains/problems/helpers/problemSelectors";
import { getDependencyLocation } from "@/domains/problems/ui/helpers/dependencyLocation";

import type {
  DependencyDetailContent,
  PolicyCardContent,
  VerdictLineContent,
} from "./dependencyDetail.types";

/**
 * Writes the verdict line: what the engine says about the dependency, with the policy that decided it.
 * @param result The dependency with its verdict.
 * @param result.verdict
 * @param pendingVerdict What a dependency that no evaluation has decided yet shows, as `getPendingVerdict` writes it.
 * @returns The icon, the tone and the words: `allowed · policy 1`, `disallowed · default`, `not checked · external` or `not evaluated`. A dependency that no evaluation has decided yet has the icon and the words of `pendingVerdict`, and none while it is `undefined`, as its line in the file pane.
 */
function getVerdictLine(
  { verdict }: DependencyDetailFacts["result"],
  pendingVerdict: PendingVerdict | undefined
): VerdictLineContent {
  let text: string;

  if (verdict.status === "pending") {
    return {
      icon: pendingVerdict?.icon,
      tone: getVerdictTone(verdict),
      text: pendingVerdict?.label ?? "",
    };
  }
  if (verdict.status === "allowed") {
    text = `allowed · ${getPolicyName(verdict.policy)}`;
  } else if (verdict.status === "disallowed") {
    text = getVerdictMeta(verdict);
  } else {
    text = getVerdictLabel(verdict);
  }
  return {
    icon: getVerdictIcon(verdict),
    tone: getVerdictTone(verdict),
    text,
  };
}

/**
 * Writes the sentence under the verdict line.
 * @param result The dependency with its verdict.
 * @param result.verdict
 * @returns The message that the plugin reports for a disallowed dependency, the reason that a dependency is not checked as a sentence, and `undefined` for an allowed one and for one that is not evaluated.
 */
function getMessage({
  verdict,
}: DependencyDetailFacts["result"]): string | undefined {
  if (verdict.status === "disallowed") {
    return verdict.message;
  }
  return verdict.status === "not-checked"
    ? getSkipReasonSentence(verdict.reason)
    : undefined;
}

/**
 * Writes the column of the policy that decided the dependency.
 * @param facts The facts of the body of the tab.
 * @param facts.policy
 * @param facts.result
 * @returns The name of the policy, the pieces of its text and what `Open in config` opens, or `undefined` when no policy decided the dependency.
 */
function getPolicyCard({
  policy,
  result,
}: DependencyDetailFacts): PolicyCardContent | undefined {
  if (policy === undefined) {
    return undefined;
  }
  return {
    ref: policy.index === null ? "default" : `policies[${policy.index}]`,
    tokens: policy.tokens,
    target: {
      kind: "config",
      range: policy.range,
      policy: policy.index,
      dependency: result.ref,
    },
  };
}

/**
 * Turns the facts of the dependency in focus into what the body of its tab draws.
 * @param facts The facts, as `getProblemList` returns them.
 * @param pendingVerdict What a dependency that no evaluation has decided yet shows, as `getPendingVerdict` writes it.
 * @returns The verdict line, where the dependency is, the message and the policy that decided it.
 */
export function toDependencyDetail(
  facts: DependencyDetailFacts,
  pendingVerdict: PendingVerdict | undefined
): DependencyDetailContent {
  return {
    verdict: getVerdictLine(facts.result, pendingVerdict),
    location: getDependencyLocation(facts.result.ref, facts.result.source),
    message: getMessage(facts.result),
    policy: getPolicyCard(facts),
  };
}
