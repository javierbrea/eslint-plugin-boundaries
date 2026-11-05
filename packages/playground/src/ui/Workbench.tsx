import type { ReactNode } from "react";

import { ConfigEditorSnapshotProvider } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import { useProblemSummary } from "@/domains/problems/modules/hooks/useProblemSummary";
import { ProblemsPane } from "@/domains/problems/modules/ProblemsPane";
import { getCountTone } from "@/domains/problems/ui/helpers/problemItems";
import { ProjectPane } from "@/domains/project/modules/ProjectPane";
import {
  SessionProvider,
  useProblemsCollapsed,
  useSessionSelector,
  useSetProblemsCollapsed,
  useView,
} from "@/domains/session/data/store";
import { InspectorPane } from "@/domains/shell/modules/InspectorPane";
import { NodePane } from "@/domains/shell/modules/NodePane";
import { TopBar } from "@/domains/shell/ui/atoms/TopBar";
import { ShellLayout } from "@/domains/shell/ui/templates/ShellLayout";
import { ShellRegions } from "@/domains/shell/ui/templates/ShellRegions";

import type { WorkbenchProps } from "./Workbench.types";

/**
 * The top bar of the instance, with the numbers of the store.
 * @returns The bar.
 */
function WorkbenchTopBar(): ReactNode {
  const files = useSessionSelector((state) => state.evaluation.files.size);
  const { total, hasErrors, configHasErrors } = useProblemSummary();

  return (
    <TopBar
      files={files}
      problems={total}
      tone={getCountTone(hasErrors)}
      configHasErrors={configHasErrors}
    />
  );
}

/**
 * The regions of the workbench with their panes. Each pane reads the store itself, so this component renders again only when the view or the problems panel changes size.
 * @returns The regions.
 */
function WorkbenchRegions(): ReactNode {
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
    />
  );
}

/**
 * The workbench: the whole playground once a sketch is loaded. It creates the store of the instance and lays out the project, the node in focus, the inspector and the problems panel, which read the store through the hooks of the session.
 * @param props Workbench props.
 * @param props.initialSketch The sketch to start from.
 * @param props.capabilities What the user can change in the project.
 * @param props.onSketchChange Called with each new sketch after an edit.
 * @returns The workbench, as large as its container.
 */
export function Workbench({
  initialSketch,
  capabilities,
  onSketchChange,
}: Readonly<WorkbenchProps>): ReactNode {
  return (
    <SessionProvider
      initialSketch={initialSketch}
      capabilities={capabilities}
      onSketchChange={onSketchChange}
    >
      <ConfigEditorSnapshotProvider>
        <ShellLayout
          topBar={<WorkbenchTopBar />}
          regions={<WorkbenchRegions />}
        />
      </ConfigEditorSnapshotProvider>
    </SessionProvider>
  );
}
