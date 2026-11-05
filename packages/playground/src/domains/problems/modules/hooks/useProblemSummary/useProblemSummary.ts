import { useMemo } from "react";

import { summarizeProblems } from "@/domains/problems/helpers/problemSelectors";
import type { ProblemSummary } from "@/domains/problems/helpers/problemSelectors";
import { useTextProblems } from "@/domains/problems/modules/hooks/useTextProblems";
import { useConfigProblems } from "@/domains/session/data/store";

/**
 * Reads how many problems there are and whether any is an error.
 * @returns The summary; the same object while the problems do not change.
 */
export function useProblemSummary(): ProblemSummary {
  const problems = useConfigProblems();
  const textProblems = useTextProblems();

  return useMemo(
    () => summarizeProblems(problems, textProblems),
    [problems, textProblems]
  );
}
