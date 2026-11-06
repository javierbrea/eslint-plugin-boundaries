import { useMemo } from "react";

import { getProblemCounts } from "@/domains/problems/helpers/problemSelectors";
import type { ProblemCounts } from "@/domains/problems/helpers/problemSelectors";
import { useProblemSummary } from "@/domains/problems/modules/hooks/useProblemSummary";

/**
 * Reads the problems of each node of the tree.
 * @returns The counts; the same object while the numbers do not change.
 */
export function useProblemCounts(): ProblemCounts {
  const { configCount, configHasErrors } = useProblemSummary();

  // Keyed on the numbers, not on the problems: an evaluation of the config with as many problems as before must not render every item of the tree again
  return useMemo(
    () => getProblemCounts(configCount, configHasErrors),
    [configCount, configHasErrors]
  );
}
