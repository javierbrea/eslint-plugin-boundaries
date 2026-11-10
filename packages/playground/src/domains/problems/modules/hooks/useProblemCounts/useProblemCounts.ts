import { useState } from "react";

import { createProblemCountsReader } from "@/domains/problems/helpers/problemSelectors";
import type { ProblemCounts } from "@/domains/problems/helpers/problemSelectors";
import { useProblemSummary } from "@/domains/problems/modules/hooks/useProblemSummary";
import { useDependencyResults } from "@/domains/session/data/store";

/**
 * Reads the problems of each node of the tree: those of the config, and the failing dependencies of each file and folder.
 * @returns The counts; the same object while the numbers do not change, so that an evaluation with new verdicts but the same counts renders no item of the tree.
 */
export function useProblemCounts(): ProblemCounts {
  const { configCount, configHasErrors } = useProblemSummary();
  const dependencies = useDependencyResults();
  // The reader remembers the last counts for the life of the pane, and gives them back when the new ones say the same
  const [readCounts] = useState(createProblemCountsReader);

  return readCounts(configCount, configHasErrors, dependencies);
}
