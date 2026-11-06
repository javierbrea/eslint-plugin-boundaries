import type { SketchDependency } from "@/contract";
import {
  getPolicyName,
  getSkipReasonSentence,
  getVerdictIcon,
  getVerdictLabel,
  getVerdictMeta,
  getVerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";
import { SYNTAX_OPTIONS } from "@/domains/files/ui/helpers/dependencyLabels";
import type { DependencyDetailFacts } from "@/domains/problems/helpers/problemSelectors";

import type {
  DependencyDetailContent,
  DependencyFact,
  PolicyCardContent,
  VerdictLineContent,
} from "./dependencyDetail.types";

/** How each syntax is called, as the picker calls it. */
const SYNTAX_LABELS = Object.fromEntries(
  SYNTAX_OPTIONS.map(({ value, label }) => [value, label])
) as Record<SketchDependency["syntax"], string>;

/**
 * Writes the verdict line: what the engine says about the dependency, with the policy that decided it.
 * @param result The dependency with its verdict.
 * @param result.verdict
 * @returns The icon, the tone and the words: `allowed · policy 1`, `disallowed · default`, `not checked · external` or `not evaluated`.
 */
function getVerdictLine({
  verdict,
}: DependencyDetailFacts["result"]): VerdictLineContent {
  let text: string;

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
 * Writes the value of a fact about the file that the dependency points to: the names that the plugin gives it, joined.
 * @param names The element types or the file categories of the file.
 * @returns The names joined by a comma and a space, or `null` when the file has none, or the dependency points to a module outside the sketch.
 */
function joinNames(names: readonly string[] | null | undefined): string | null {
  return names === null || names === undefined || names.length === 0
    ? null
    : names.join(", ");
}

/**
 * Lists the facts of the dependency: where it points to, how the plugin describes the file it points to, and how it is written.
 * @param facts The facts of the body of the tab.
 * @param facts.result
 * @param facts.description
 * @returns `to`, `element`, `file`, `kind` and `syntax`, in order.
 */
function getFacts({
  result,
  description,
}: DependencyDetailFacts): readonly DependencyFact[] {
  const { target, importKind, syntax } = result.dependency;

  return [
    {
      label: "to",
      value: target.kind === "node" ? target.path : target.name,
    },
    { label: "element", value: joinNames(description?.element.types) },
    { label: "file", value: joinNames(description?.file.categories) },
    { label: "kind", value: importKind },
    { label: "syntax", value: SYNTAX_LABELS[syntax] },
  ];
}

/**
 * Writes the card of the policy that decided the dependency.
 * @param facts The facts of the body of the tab.
 * @param facts.policy
 * @param facts.result
 * @returns The heading, the text and what `Open policy in config` opens, or `undefined` when no policy decided the dependency.
 */
function getPolicyCard({
  policy,
  result,
}: DependencyDetailFacts): PolicyCardContent | undefined {
  if (policy === undefined) {
    return undefined;
  }
  return {
    heading:
      policy.index === null ? "// default" : `// policies[${policy.index}]`,
    text: policy.text,
    target: { kind: "config", range: policy.range, dependency: result.ref },
  };
}

/**
 * Turns the facts of the dependency in focus into what the body of its tab draws.
 * @param facts The facts, as `getProblemList` returns them.
 * @returns The verdict line, the message, the facts and the card of the policy.
 */
export function toDependencyDetail(
  facts: DependencyDetailFacts
): DependencyDetailContent {
  return {
    verdict: getVerdictLine(facts.result),
    message: getMessage(facts.result),
    facts: getFacts(facts),
    policy: getPolicyCard(facts),
  };
}
