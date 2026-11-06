import { memo } from "react";
import type { ReactNode } from "react";

import { ConfigInspector } from "@/domains/config/ui/molecules/ConfigInspector";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { FileInspector } from "@/domains/files/ui/molecules/FileInspector";
import { ProjectSummary } from "@/domains/project/ui/molecules/ProjectSummary";
import { useEvaluation, useFocus, useOpen } from "@/domains/session/data/store";
import { getFocusedPath } from "@/domains/session/helpers/focus";
import type { Focus, Target } from "@/domains/session/helpers/focus";
import { InspectorLayout } from "@/domains/shell/ui/templates/InspectorLayout";

import { INSPECTOR_PANE_TEST_ID } from "./InspectorPane.constants";

/** Props of {@link InspectorContent}. */
type InspectorContentProps = {
  /** What is in focus. */
  focus: Focus;
  /** What the engine says about the sketch. */
  evaluation: Evaluation;
  /** Called with what a row opens. */
  onOpen: (target: Target) => void;
};

/**
 * Picks what the inspector shows for the focus.
 * @param props InspectorContent props.
 * @param props.focus What is in focus.
 * @param props.evaluation What the engine says about the sketch.
 * @param props.onOpen Called with what a row opens.
 * @returns The inspector of a file, of the config, or of the sketch when nothing is open.
 */
function InspectorContent({
  focus: current,
  evaluation,
  onOpen,
}: Readonly<InspectorContentProps>): ReactNode {
  // A dependency in focus belongs to the open file, which the inspector keeps describing
  const filePath = getFocusedPath(current);

  if (filePath !== undefined) {
    return <FileInspector path={filePath} evaluation={evaluation} />;
  }
  if (current.kind === "config") {
    return <ConfigInspector evaluation={evaluation} onOpen={onOpen} />;
  }
  return <ProjectSummary evaluation={evaluation} />;
}

/**
 * The inspector of the instance: it describes what is in focus, from the evaluation of the store. A file shows how the plugin describes it, the config lists its entries, and nothing in focus shows the numbers of the sketch. A row of the config inspector opens the config at its entry.
 * @returns The inspector.
 */
function InspectorPaneContent(): ReactNode {
  const openNode = useFocus();
  const evaluation = useEvaluation();
  const openTarget = useOpen();

  return (
    <InspectorLayout testId={INSPECTOR_PANE_TEST_ID}>
      <InspectorContent
        focus={openNode}
        evaluation={evaluation}
        onOpen={openTarget}
      />
    </InspectorLayout>
  );
}

/** The inspector pane. It reads the store, so it renders again only when the focus or the evaluation changes. */
export const InspectorPane = memo(InspectorPaneContent);
