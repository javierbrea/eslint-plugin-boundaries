import { useMemo } from "react";

import type { TextProblem } from "@/domains/project/helpers/sketch";
import {
  useConfigProblems,
  useFocus,
  useSessionSelector,
  useTextDraft,
} from "@/domains/session/data/store";
import type { ProblemsTabId } from "@/domains/session/helpers/focus";

import type {
  ProblemCounts,
  ProblemListContent,
  ProblemSummary,
  ProblemsTab,
} from "./Problems.types";
import {
  getProblemCounts,
  getProblemList,
  getProblemTabs,
  getShownTab,
  getTextProblems,
  summarizeProblems,
} from "./Selectors";

/**
 * Reads the lines of text mode that cannot be read, derived from the draft.
 * @returns The lines, in order; the same array while the draft does not change.
 */
export function useTextProblems(): readonly TextProblem[] {
  const draft = useTextDraft();

  return useMemo(() => getTextProblems(draft), [draft]);
}

/**
 * Reads how many problems there are and how serious they are.
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

/**
 * Reads the tabs of the problems panel.
 * @returns The tabs, in order; the same array while the focus and the problems do not change.
 */
export function useProblemTabs(): readonly ProblemsTab<ProblemsTabId>[] {
  const openNode = useFocus();
  const summary = useProblemSummary();

  return useMemo(() => getProblemTabs(openNode, summary), [openNode, summary]);
}

/**
 * Reads the tab of the problems panel that shows.
 * @returns The selected tab, or the sketch's when nothing is in focus.
 */
export function useShownTab(): ProblemsTabId {
  const openNode = useFocus();
  const tab = useSessionSelector((state) => state.tab);

  return getShownTab(openNode, tab);
}

/**
 * Reads what the tab that shows lists.
 * @returns The rows, the text for no rows and whether the note about invalid rule options shows.
 */
export function useProblemList(): ProblemListContent {
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
