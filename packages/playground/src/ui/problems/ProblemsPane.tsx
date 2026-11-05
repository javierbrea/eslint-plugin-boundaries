import { memo } from "react";
import type { ReactNode } from "react";

import {
  useOpen,
  useProblemList,
  useProblemTabs,
  useProblemsCollapsed,
  useSelectTab,
  useSetProblemsCollapsed,
  useShownTab,
} from "@/ui/state";
import type { ProblemsTabId } from "@/ui/state";
import { Note } from "@/ui-kit/molecules/Note";

import { ProblemList } from "./ProblemList";
import { ProblemsPanel } from "./ProblemsPanel";

/**
 * The problems pane: the panel with a tab for the sketch and one for the node in focus, and the problems of the tab that shows. A row opens what it points at.
 * @returns The pane, as tall as its container.
 */
function ProblemsPaneContent(): ReactNode {
  const tabs = useProblemTabs();
  const shownTab = useShownTab();
  const { items, empty, rulesNote } = useProblemList();
  const collapsed = useProblemsCollapsed();
  const selectTab = useSelectTab();
  const setProblemsCollapsed = useSetProblemsCollapsed();
  const openTarget = useOpen();

  return (
    <ProblemsPanel<ProblemsTabId>
      tabs={tabs}
      selected={shownTab}
      onSelect={selectTab}
      collapsed={collapsed}
      onCollapsedChange={setProblemsCollapsed}
    >
      {rulesNote ? (
        <Note>
          Dependencies are not evaluated while the rule options are invalid:
          ESLint does not run a rule whose options fail its schema.
        </Note>
      ) : null}
      <ProblemList items={items} empty={empty} onOpen={openTarget} />
    </ProblemsPanel>
  );
}

/** The problems pane. It reads the store, so it renders again only when what it shows changes. */
export const ProblemsPane = memo(ProblemsPaneContent);
