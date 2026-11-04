import { memo } from "react";
import type { ReactNode } from "react";

import {
  useAddNode,
  useCapabilities,
  useChangeConfig,
  useConfig,
  useConfigEditorSnapshot,
  useConfigProblems,
  useFocus,
  useOpen,
  useReveal,
} from "../state";

import { ConfigPane } from "./ConfigPane";
import { EmptyPane } from "./EmptyPane";
import { FilePane } from "./FilePane";

/**
 * The config open in the node pane: it renders again for each edit of the config, and the rest of the node pane does not.
 * @returns The config pane, with the editor of the instance.
 */
function OpenConfig(): ReactNode {
  const config = useConfig();
  const problems = useConfigProblems();
  const reveal = useReveal();
  const snapshot = useConfigEditorSnapshot();
  const { editConfig } = useCapabilities();
  const changeConfig = useChangeConfig();

  return (
    <ConfigPane
      config={config}
      problems={problems}
      readOnly={!editConfig}
      reveal={reveal}
      snapshot={snapshot}
      onChange={changeConfig}
    />
  );
}

/**
 * The node pane when nothing is open: it opens the config, or adds a file and starts renaming it in the tree.
 * @returns The empty pane.
 */
function NothingOpen(): ReactNode {
  const { editTree } = useCapabilities();
  const openTarget = useOpen();
  const addNode = useAddNode();

  return (
    <EmptyPane
      canAddFile={editTree}
      onOpenConfig={() => openTarget({ kind: "config" })}
      onAddFile={() => addNode("file")}
    />
  );
}

/**
 * The middle pane: the node in focus, which is a file, the config, or nothing.
 * @returns The pane of the node in focus.
 */
function NodePaneContent(): ReactNode {
  const openNode = useFocus();

  if (openNode.kind === "file") {
    return <FilePane path={openNode.path} />;
  }
  return openNode.kind === "config" ? <OpenConfig /> : <NothingOpen />;
}

/** The node pane. It reads the store, so it renders again only when the focus changes. */
export const NodePane = memo(NodePaneContent);
