import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import { useProblemList } from "@/domains/problems/modules/hooks/useProblemList";
import { useProblemTabs } from "@/domains/problems/modules/hooks/useProblemTabs";
import { useShownTab } from "@/domains/problems/modules/hooks/useShownTab";
import {
  toProblemListContent,
  toProblemsTabs,
} from "@/domains/problems/ui/helpers/problemItems";
import { ProblemList } from "@/domains/problems/ui/molecules/ProblemList";
import { ProblemsPanel } from "@/domains/problems/ui/molecules/ProblemsPanel";
import { RulesNote } from "@/domains/problems/ui/molecules/RulesNote";
import {
  useOpen,
  useProblemsCollapsed,
  useSelectTab,
  useSetProblemsCollapsed,
} from "@/domains/session/data/store";
import type { ProblemsTabId } from "@/domains/session/helpers/focus";

import { PROBLEMS_PANE_TEST_ID } from "./ProblemsPane.constants";

/**
 * The problems pane: the panel with a tab for the sketch and one for the node in focus, and the problems of the tab that shows. A row opens what it points at.
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
  // Memoized on the facts, so the tabs and the rows keep their references while the facts do not change, as the hooks returned before
  const tabs = useMemo(() => toProblemsTabs(tabFacts), [tabFacts]);
  const { items, empty, rulesNote } = useMemo(
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
      {rulesNote ? <RulesNote /> : null}
      <ProblemList items={items} empty={empty} onOpen={openTarget} />
    </ProblemsPanel>
  );
}

/** The problems pane. It reads the store, so it renders again only when what it shows changes. */
export const ProblemsPane = memo(ProblemsPaneContent);
