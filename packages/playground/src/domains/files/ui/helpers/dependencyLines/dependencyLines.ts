import type { DependencyResult } from "@/domains/evaluation/helpers/engine";
import {
  getSkipReasonSentence,
  getVerdictIcon,
  getVerdictLabel,
  getVerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";
import { toStatementTokens } from "@/domains/project/helpers/sketch";

import { VERDICT_ICON_LABELS } from "./dependencyLines.constants";
import type { DependencyLine } from "./dependencyLines.types";

/**
 * Turns the dependencies of a file into the lines of its pane.
 * @param results The dependencies of the file with their verdicts, in the order of the file.
 * @returns One line for each, in the same order: the statement as the sketch writes it, and the icon, the color and the text of the verdict. A dependency that is not checked also has the sentence that says why.
 */
export function getDependencyLines(
  results: readonly DependencyResult[]
): DependencyLine[] {
  return results.map(({ dependency, ref, source, verdict }) => {
    const icon = getVerdictIcon(verdict);

    return {
      id: `${ref.path}:${ref.index}`,
      tokens: toStatementTokens(dependency, source),
      icon,
      iconLabel: VERDICT_ICON_LABELS[icon],
      tone: getVerdictTone(verdict),
      label: getVerdictLabel(verdict),
      hint:
        verdict.status === "not-checked"
          ? getSkipReasonSentence(verdict.reason)
          : undefined,
    };
  });
}
