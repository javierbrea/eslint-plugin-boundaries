import { memo } from "react";
import type { ReactNode } from "react";

import { useEvaluation, useFocus, useOpen } from "../state";

import { Inspector } from "./Inspector";

/**
 * The inspector of the instance: what is in focus, described from the evaluation of the store. A row of the config inspector opens the config at its entry.
 * @returns The inspector.
 */
function InspectorPaneContent(): ReactNode {
  const openNode = useFocus();
  const evaluation = useEvaluation();
  const openTarget = useOpen();

  return (
    <Inspector focus={openNode} evaluation={evaluation} onOpen={openTarget} />
  );
}

/** The inspector pane. It reads the store, so it renders again only when the focus or the evaluation changes. */
export const InspectorPane = memo(InspectorPaneContent);
