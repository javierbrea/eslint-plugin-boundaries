import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import {
  getEvaluationNote,
  isEvaluationDimmed,
} from "@/domains/evaluation/ui/helpers/evaluationStatus";
import { useProblemList } from "@/domains/problems/modules/hooks/useProblemList";
import { useProblemTabs } from "@/domains/problems/modules/hooks/useProblemTabs";
import { useShownTab } from "@/domains/problems/modules/hooks/useShownTab";
import {
  toProblemListContent,
  toProblemsTabs,
} from "@/domains/problems/ui/helpers/problemItems";
import { DependencyDetail } from "@/domains/problems/ui/molecules/DependencyDetail";
import { ProblemList } from "@/domains/problems/ui/molecules/ProblemList";
import { ProblemNote } from "@/domains/problems/ui/molecules/ProblemNote";
import { ProblemsPanel } from "@/domains/problems/ui/molecules/ProblemsPanel";
import {
  useEvaluationStatus,
  useOpen,
  useProblemsCollapsed,
  useSessionSelector,
  useSelectTab,
  useSetProblemsCollapsed,
} from "@/domains/session/data/store";
import type { ProblemsTabId } from "@/domains/session/helpers/focus";

import { PROBLEMS_PANE_TEST_ID } from "./ProblemsPane.constants";

/**
 * The problems pane: the panel with a tab for the sketch, one for the node in focus and one for the dependency in focus, and what the tab that shows has: notes and problems, or the body of the dependency. A row opens what it points at, and so does the button that opens the policy of a dependency. While the evaluation on screen is out of date and late, stopped or failed, the body fades, and a note above it says when the evaluation stopped or failed, or that the first one is late; before the first evaluation, an empty list says nothing.
 * @returns The pane, as tall as its container.
 */
function ProblemsPaneContent(): ReactNode {
  const tabFacts = useProblemTabs();
  const shownTab = useShownTab();
  const listFacts = useProblemList();
  const collapsed = useProblemsCollapsed();
  const selectTab = useSelectTab();
  const setProblemsCollapsed = useSetProblemsCollapsed();
  const openTarget = useOpen();
  const evaluationStatus = useEvaluationStatus();
  const hasEvaluation = useSessionSelector(
    (state) => state.evaluation !== undefined
  );
  const evaluationNote = getEvaluationNote(evaluationStatus, hasEvaluation);
  // Memoized on the facts, so the tabs and the rows keep their references while the facts do not change
  const tabs = useMemo(() => toProblemsTabs(tabFacts), [tabFacts]);
  const { items, empty, notes, detail } = useMemo(
    () => toProblemListContent(listFacts),
    [listFacts]
  );

  return (
    <ProblemsPanel<ProblemsTabId>
      tabs={tabs}
      selected={shownTab}
      onSelect={selectTab}
      collapsed={collapsed}
      onCollapsedChange={setProblemsCollapsed}
      notice={
        evaluationNote === undefined ? undefined : (
          <ProblemNote>{evaluationNote}</ProblemNote>
        )
      }
      dimmed={hasEvaluation && isEvaluationDimmed(evaluationStatus)}
      testId={PROBLEMS_PANE_TEST_ID}
    >
      {detail === undefined ? (
        <>
          {notes.map((note) => (
            <ProblemNote key={note}>{note}</ProblemNote>
          ))}
          <ProblemList
            items={items}
            // Before the first evaluation the list cannot say that there are no problems
            empty={hasEvaluation ? empty : undefined}
            onOpen={openTarget}
          />
        </>
      ) : (
        <DependencyDetail detail={detail} onOpen={openTarget} />
      )}
    </ProblemsPanel>
  );
}

/** The problems pane. It reads the store, so it renders again only when what it shows changes. */
export const ProblemsPane = memo(ProblemsPaneContent);
