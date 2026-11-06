import { useMemo } from "react";

import { getProblemList } from "@/domains/problems/helpers/problemSelectors";
import type { ProblemListFacts } from "@/domains/problems/helpers/problemSelectors";
import { useShownTab } from "@/domains/problems/modules/hooks/useShownTab";
import { useTextProblems } from "@/domains/problems/modules/hooks/useTextProblems";
import {
  useEvaluation,
  useFocus,
  usePolicyHighlight,
} from "@/domains/session/data/store";

/**
 * Reads the facts of what the tab that shows lists: the rows of the sketch, of a file or of the config with their notes, or the body of the dependency in focus.
 * @returns What the list is about and what it holds; the same object while its inputs do not change.
 */
export function useProblemList(): ProblemListFacts {
  const tab = useShownTab();
  const openNode = useFocus();
  const evaluation = useEvaluation();
  const textProblems = useTextProblems();
  const highlight = usePolicyHighlight();

  return useMemo(
    () =>
      getProblemList({ tab, openNode, evaluation, textProblems, highlight }),
    [tab, openNode, evaluation, textProblems, highlight]
  );
}
