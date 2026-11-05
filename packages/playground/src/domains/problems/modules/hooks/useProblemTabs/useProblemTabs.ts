import { useMemo } from "react";

import { getProblemTabs } from "@/domains/problems/helpers/problemSelectors";
import type { ProblemTabFacts } from "@/domains/problems/helpers/problemSelectors";
import { useProblemSummary } from "@/domains/problems/modules/hooks/useProblemSummary";
import { useFocus } from "@/domains/session/data/store";

/**
 * Reads the facts of the tabs of the problems panel.
 * @returns The tabs, in order; the same array while the focus and the problems do not change.
 */
export function useProblemTabs(): readonly ProblemTabFacts[] {
  const openNode = useFocus();
  const summary = useProblemSummary();

  return useMemo(() => getProblemTabs(openNode, summary), [openNode, summary]);
}
