import { memo } from "react";
import type { ReactNode } from "react";

import { ConfigNode } from "@/domains/config/modules/ConfigNode";
import { FilePane } from "@/domains/files/ui/molecules/FilePane";
import { useFocus } from "@/domains/session/data/store";
import { EmptyNodePane } from "@/domains/shell/modules/EmptyNodePane";
import { NODE_FRAME_LABEL } from "@/domains/shell/ui/helpers/nodeFrame";

/**
 * The middle pane: the node in focus, which is a file, the config, or nothing.
 * @returns The pane of the node in focus.
 */
function NodePaneContent(): ReactNode {
  const openNode = useFocus();

  if (openNode.kind === "file") {
    return <FilePane path={openNode.path} frameLabel={NODE_FRAME_LABEL} />;
  }
  return openNode.kind === "config" ? (
    <ConfigNode frameLabel={NODE_FRAME_LABEL} />
  ) : (
    <EmptyNodePane frameLabel={NODE_FRAME_LABEL} />
  );
}

/** The node pane. It reads the store, so it renders again only when the focus changes. */
export const NodePane = memo(NodePaneContent);
