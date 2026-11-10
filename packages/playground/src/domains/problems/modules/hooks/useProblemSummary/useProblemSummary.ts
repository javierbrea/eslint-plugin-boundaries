import { useMemo } from "react";

import { summarizeProblems } from "@/domains/problems/helpers/problemSelectors";
import type { ProblemSummary } from "@/domains/problems/helpers/problemSelectors";
import { useTextProblems } from "@/domains/problems/modules/hooks/useTextProblems";
import {
  useConfigProblems,
  useDependencyResults,
} from "@/domains/session/data/store";

/**
 * Reads how many problems there are and whether any is an error: the problems of the config, the lines of text mode that cannot be read and the dependencies that the rule disallows.
 * @returns The summary; the same object while the problems and the verdicts do not change.
 */
export function useProblemSummary(): ProblemSummary {
  const problems = useConfigProblems();
  const textProblems = useTextProblems();
  const dependencies = useDependencyResults();

  return useMemo(
    () => summarizeProblems(problems, textProblems, dependencies),
    [problems, textProblems, dependencies]
  );
}
