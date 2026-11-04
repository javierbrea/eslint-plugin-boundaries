import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { InspectorPane } from "./inspector";
import { Regions, TopBar } from "./layout";
import { NodePane } from "./node";
import { ProblemsPane } from "./problems";
import { ProjectPane } from "./project";
import {
  WorkbenchProvider,
  useProblemSummary,
  useProblemsCollapsed,
  useSetProblemsCollapsed,
  useView,
  useWorkbenchSelector,
} from "./state";
import type { WorkbenchProps } from "./Workbench.types";

const Frame = styled("section")({
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
});

const Layout = styled("div")({
  display: "grid",
  gridTemplateRows: "44px minmax(0, 1fr)",
  height: "100%",
});

/**
 * The top bar of the instance, with the numbers of the store.
 * @returns The bar.
 */
function WorkbenchTopBar(): ReactNode {
  const files = useWorkbenchSelector((state) => state.evaluation.files.size);
  const { total, tone, configHasErrors } = useProblemSummary();

  return (
    <TopBar
      files={files}
      problems={total}
      tone={tone}
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
    <Regions
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
 * The workbench: the whole playground once a sketch is loaded. It creates the store of the instance and lays out the project, the node in focus, the inspector and the problems panel, which read the store through the hooks of `ui/state`.
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
    <WorkbenchProvider
      initialSketch={initialSketch}
      capabilities={capabilities}
      onSketchChange={onSketchChange}
    >
      <Frame aria-label="Playground">
        <Layout>
          <WorkbenchTopBar />
          <WorkbenchRegions />
        </Layout>
      </Frame>
    </WorkbenchProvider>
  );
}
