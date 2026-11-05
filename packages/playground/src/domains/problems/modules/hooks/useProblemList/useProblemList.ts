import { useMemo } from "react";

import { getProblemList } from "@/domains/problems/helpers/problemSelectors";
import type { ProblemListFacts } from "@/domains/problems/helpers/problemSelectors";
import { useShownTab } from "@/domains/problems/modules/hooks/useShownTab";
import { useTextProblems } from "@/domains/problems/modules/hooks/useTextProblems";
import {
  useConfigProblems,
  useFocus,
  useSessionSelector,
} from "@/domains/session/data/store";

/**
 * Reads the facts of what the tab that shows lists.
 * @returns What the list is about, the problems it holds and whether the note about invalid rule options shows; the same object while its inputs do not change.
 */
export function useProblemList(): ProblemListFacts {
  const tab = useShownTab();
  const openNode = useFocus();
  const problems = useConfigProblems();
  const rulesValid = useSessionSelector((state) => state.evaluation.rulesValid);
  const textProblems = useTextProblems();

  return useMemo(
    () => getProblemList(tab, openNode, problems, rulesValid, textProblems),
    [tab, openNode, problems, rulesValid, textProblems]
  );
}
