import { memo, useCallback, useState } from "react";
import type { ReactNode } from "react";

import { ConfigNode } from "@/domains/config/modules/ConfigNode";
import { FileNode } from "@/domains/files/modules/FileNode";
import { useClose, useFocus } from "@/domains/session/data/store";
import { getFocusedPath } from "@/domains/session/helpers/focus";
import { EmptyNodePane } from "@/domains/shell/modules/EmptyNodePane";
import { NODE_FRAME_LABEL } from "@/domains/shell/ui/helpers/nodeFrame";

/**
 * The middle pane: the node in focus, which is a file (with a dependency in focus, or not), the config, or nothing. The close button of a file or of the config leaves nothing in focus, and the keyboard focus that the button had goes to the first button of the pane that shows nothing open.
 * @returns The pane of the node in focus.
 */
function NodePaneContent(): ReactNode {
  const openNode = useFocus();
  const closeFocus = useClose();
  // The close button goes with the pane it closes, so the pane that comes after it is asked to take the keyboard focus. Only a close asks: the same pane shows when the open file is removed, and the focus stays where the removal left it. So the request goes as soon as something is open again
  const [isFocusRequested, setFocusRequested] = useState(false);

  if (isFocusRequested && openNode.kind !== "none") {
    setFocusRequested(false);
  }

  const closeNode = useCallback(() => {
    setFocusRequested(true);
    closeFocus();
  }, [closeFocus]);
  // A dependency in focus belongs to the open file, which stays on show
  const filePath = getFocusedPath(openNode);

  if (filePath !== undefined) {
    return (
      <FileNode
        path={filePath}
        frameLabel={NODE_FRAME_LABEL}
        onClose={closeNode}
      />
    );
  }
  return openNode.kind === "config" ? (
    <ConfigNode frameLabel={NODE_FRAME_LABEL} onClose={closeNode} />
  ) : (
    <EmptyNodePane frameLabel={NODE_FRAME_LABEL} autoFocus={isFocusRequested} />
  );
}

/** The node pane. It reads the store, so it renders again only when the focus changes, and keeps whether the pane that shows nothing open must take the keyboard focus, which belongs to the page. */
export const NodePane = memo(NodePaneContent);
