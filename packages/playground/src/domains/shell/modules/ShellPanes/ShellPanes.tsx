import type { ReactNode } from "react";

import { ProblemsPane } from "@/domains/problems/modules/ProblemsPane";
import { ProjectPane } from "@/domains/project/modules/ProjectPane";
import {
  useProblemsCollapsed,
  useSetProblemsCollapsed,
  useView,
} from "@/domains/session/data/store";
import { InspectorPane } from "@/domains/shell/modules/InspectorPane";
import { NodePane } from "@/domains/shell/modules/NodePane";
import { ShellRegions } from "@/domains/shell/ui/templates/ShellRegions";

import { SHELL_PANES_TEST_ID } from "./ShellPanes.constants";

/**
 * The regions of the shell with their panes. Each pane reads the store itself, so this component renders again only when the view or the problems panel changes size.
 * @returns The regions.
 */
export function ShellPanes(): ReactNode {
  const view = useView();
  const problemsCollapsed = useProblemsCollapsed();
  const setProblemsCollapsed = useSetProblemsCollapsed();

  return (
    <ShellRegions
      project={<ProjectPane />}
      node={<NodePane />}
      inspector={<InspectorPane />}
      problems={<ProblemsPane />}
      isTextMode={view === "text"}
      isProblemsCollapsed={problemsCollapsed}
      onProblemsCollapsedChange={setProblemsCollapsed}
      testId={SHELL_PANES_TEST_ID}
    />
  );
}
