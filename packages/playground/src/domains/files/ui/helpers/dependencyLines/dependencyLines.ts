import type { DependencyResult } from "@/domains/evaluation/helpers/engine";
import type { EvaluationStatus } from "@/domains/evaluation/helpers/evaluator";
import {
  getPendingVerdictLabel,
  isEvaluationDimmed,
} from "@/domains/evaluation/ui/helpers/evaluationStatus";
import {
  VERDICT_ICON_LABELS,
  getSkipReasonSentence,
  getVerdictIcon,
  getVerdictLabel,
  getVerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";
import { toStatementTokens } from "@/domains/project/helpers/sketch";

import type { DependencyLine } from "./dependencyLines.types";

/**
 * Turns the dependencies of a file into the lines of its pane.
 * @param results The dependencies of the file with their verdicts, in the order of the file.
 * @param evaluationStatus How the evaluation that gave the verdicts stands to the sketch.
 * @returns One line for each, in the same order: the statement as the sketch writes it, and the icon, the color and the text of the verdict, faded while the evaluation is out of date and late, stopped or failed. A dependency that is not checked also has the sentence that says why. A dependency that no evaluation has decided yet has no verdict, until the evaluation is late, stopped or failed and the line says so.
 */
export function getDependencyLines(
  results: readonly DependencyResult[],
  evaluationStatus: EvaluationStatus
): DependencyLine[] {
  const dimmed = isEvaluationDimmed(evaluationStatus);

  return results.map(({ dependency, ref, source, verdict }) => {
    const id = `${ref.path}:${ref.index}`;
    const tokens = toStatementTokens(dependency, source);

    if (verdict.status === "pending") {
      const label = getPendingVerdictLabel(evaluationStatus);

      return {
        id,
        tokens,
        icon: label === undefined ? undefined : "skip",
        iconLabel: undefined,
        tone: "faint",
        label: label ?? "",
        hint: undefined,
        dimmed,
      };
    }

    const icon = getVerdictIcon(verdict);

    return {
      id,
      tokens,
      icon,
      iconLabel: VERDICT_ICON_LABELS[icon],
      tone: getVerdictTone(verdict),
      label: getVerdictLabel(verdict),
      hint:
        verdict.status === "not-checked"
          ? getSkipReasonSentence(verdict.reason)
          : undefined,
      dimmed,
    };
  });
}
