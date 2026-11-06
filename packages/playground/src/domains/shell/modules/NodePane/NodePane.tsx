import { memo } from "react";
import type { ReactNode } from "react";

import { ConfigNode } from "@/domains/config/modules/ConfigNode";
import type { DependencyLine } from "@/domains/files/ui/helpers/dependencyLines";
import { FilePane } from "@/domains/files/ui/organisms/FilePane";
import { useFocus } from "@/domains/session/data/store";
import { getFocusedPath } from "@/domains/session/helpers/focus";
import { EmptyNodePane } from "@/domains/shell/modules/EmptyNodePane";
import { NODE_FRAME_LABEL } from "@/domains/shell/ui/helpers/nodeFrame";

/** The dependencies of the file, none until the pane reads them from the evaluation of the store. */
const NO_LINES: readonly DependencyLine[] = [];

/** What the file pane calls until the pane connects it to the store: it cannot edit dependencies yet, so it asks for none. */
const DO_NOTHING = (): void => undefined;

/**
 * The middle pane: the node in focus, which is a file (with a dependency in focus, or not), the config, or nothing.
 * @returns The pane of the node in focus.
 */
function NodePaneContent(): ReactNode {
  const openNode = useFocus();
  // A dependency in focus belongs to the open file, which stays on show
  const filePath = getFocusedPath(openNode);

  if (filePath !== undefined) {
    return (
      <FilePane
        path={filePath}
        frameLabel={NODE_FRAME_LABEL}
        lines={NO_LINES}
        selectedIndex={undefined}
        editable={false}
        onSelect={DO_NOTHING}
        onEdit={DO_NOTHING}
        onRemove={DO_NOTHING}
        onAdd={DO_NOTHING}
      />
    );
  }
  return openNode.kind === "config" ? (
    <ConfigNode frameLabel={NODE_FRAME_LABEL} />
  ) : (
    <EmptyNodePane frameLabel={NODE_FRAME_LABEL} />
  );
}

/** The node pane. It reads the store, so it renders again only when the focus changes. */
export const NodePane = memo(NodePaneContent);
