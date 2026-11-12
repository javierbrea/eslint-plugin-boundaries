import { getShownTab } from "@/domains/problems/helpers/problemSelectors";
import { useFocus, useSessionSelector } from "@/domains/session/data/store";
import type { ProblemsTabId } from "@/domains/session/helpers/focus";

/**
 * Reads the tab of the problems panel that shows.
 * @returns The selected tab, or the sketch's when nothing is in focus.
 */
export function useShownTab(): ProblemsTabId {
  const openNode = useFocus();
  const tab = useSessionSelector((state) => state.tab);

  return getShownTab(openNode, tab);
}
