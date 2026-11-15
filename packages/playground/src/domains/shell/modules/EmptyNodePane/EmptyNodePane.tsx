import type { ReactNode } from "react";

import {
  useAddNode,
  useCapabilities,
  useOpen,
} from "@/domains/session/data/store";
import { EmptyNode } from "@/domains/shell/ui/molecules/EmptyNode";

import { EMPTY_NODE_PANE_TEST_ID } from "./EmptyNodePane.constants";
import type { EmptyNodePaneProps } from "./EmptyNodePane.types";

/**
 * The node pane when nothing is open: it opens the config, or adds a file and starts renaming it in the tree.
 * @param props EmptyNodePane props.
 * @param props.frameLabel The accessible name of the landmark of the pane.
 * @param props.autoFocus Whether the button that opens the config takes the keyboard focus when the pane is first rendered.
 * @returns The empty pane.
 */
export function EmptyNodePane({
  frameLabel,
  autoFocus = false,
}: Readonly<EmptyNodePaneProps>): ReactNode {
  const { editTree } = useCapabilities();
  const openTarget = useOpen();
  const addNode = useAddNode();

  return (
    <EmptyNode
      canAddFile={editTree}
      onOpenConfig={() => openTarget({ kind: "config" })}
      onAddFile={() => addNode("file")}
      autoFocusOpenConfig={autoFocus}
      frameLabel={frameLabel}
      testId={EMPTY_NODE_PANE_TEST_ID}
    />
  );
}
