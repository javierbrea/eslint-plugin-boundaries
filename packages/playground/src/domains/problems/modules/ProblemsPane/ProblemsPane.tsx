import { memo, useMemo } from "react";
import type { ReactNode } from "react";

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
  useOpen,
  useProblemsCollapsed,
  useSelectTab,
  useSetProblemsCollapsed,
} from "@/domains/session/data/store";
import type { ProblemsTabId } from "@/domains/session/helpers/focus";

import { PROBLEMS_PANE_TEST_ID } from "./ProblemsPane.constants";

/**
 * The problems pane: the panel with a tab for the sketch, one for the node in focus and one for the dependency in focus, and what the tab that shows has: notes and problems, or the body of the dependency. A row opens what it points at, and so does the button that opens the policy of a dependency.
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
      testId={PROBLEMS_PANE_TEST_ID}
    >
      {detail === undefined ? (
        <>
          {notes.map((note) => (
            <ProblemNote key={note}>{note}</ProblemNote>
          ))}
          <ProblemList items={items} empty={empty} onOpen={openTarget} />
        </>
      ) : (
        <DependencyDetail detail={detail} onOpen={openTarget} />
      )}
    </ProblemsPanel>
  );
}

/** The problems pane. It reads the store, so it renders again only when what it shows changes. */
export const ProblemsPane = memo(ProblemsPaneContent);
