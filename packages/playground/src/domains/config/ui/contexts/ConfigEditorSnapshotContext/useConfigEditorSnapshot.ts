import { useContext } from "react";
import type { RefObject } from "react";

import type { ConfigEditorSnapshot } from "./configEditorSnapshot.types";
import { ConfigEditorSnapshotContext } from "./configEditorSnapshotContext";

/**
 * Gets where the config editor leaves its snapshot when the config closes, so that it opens again as the user left it.
 * @returns The ref of the instance.
 * @throws {Error} When the component is not inside a `ConfigEditorSnapshotProvider`.
 */
export function useConfigEditorSnapshot(): RefObject<
  ConfigEditorSnapshot | undefined
> {
  const snapshot = useContext(ConfigEditorSnapshotContext);

  if (snapshot === null) {
    throw new Error(
      "A pane of the playground is outside ConfigEditorSnapshotProvider."
    );
  }
  return snapshot;
}
