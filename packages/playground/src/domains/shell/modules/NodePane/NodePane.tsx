import { memo } from "react";
import type { ReactNode } from "react";

import { ConfigNode } from "@/domains/config/modules/ConfigNode";
import { FileNode } from "@/domains/files/modules/FileNode";
import { useFocus } from "@/domains/session/data/store";
import { getFocusedPath } from "@/domains/session/helpers/focus";
import { EmptyNodePane } from "@/domains/shell/modules/EmptyNodePane";
import { NODE_FRAME_LABEL } from "@/domains/shell/ui/helpers/nodeFrame";

/**
 * The middle pane: the node in focus, which is a file (with a dependency in focus, or not), the config, or nothing.
 * @returns The pane of the node in focus.
 */
function NodePaneContent(): ReactNode {
  const openNode = useFocus();
  // A dependency in focus belongs to the open file, which stays on show
  const filePath = getFocusedPath(openNode);

  if (filePath !== undefined) {
    return <FileNode path={filePath} frameLabel={NODE_FRAME_LABEL} />;
  }
  return openNode.kind === "config" ? (
    <ConfigNode frameLabel={NODE_FRAME_LABEL} />
  ) : (
    <EmptyNodePane frameLabel={NODE_FRAME_LABEL} />
  );
}

/** The node pane. It reads the store, so it renders again only when the focus changes. */
export const NodePane = memo(NodePaneContent);
