import { useRef } from "react";
import type { ReactNode } from "react";

import type { ConfigEditorSnapshot } from "./configEditorSnapshot.types";
import { ConfigEditorSnapshotContext } from "./configEditorSnapshotContext";
import type { ConfigEditorSnapshotProviderProps } from "./ConfigEditorSnapshotProvider.types";

/**
 * Keeps the snapshot of the config editor for as long as it is mounted, so that the config opens again as the user left it after it was closed.
 * @param props ConfigEditorSnapshotProvider props.
 * @param props.children The components that read the snapshot.
 * @returns The provider.
 */
export function ConfigEditorSnapshotProvider({
  children,
}: Readonly<ConfigEditorSnapshotProviderProps>): ReactNode {
  const snapshot = useRef<ConfigEditorSnapshot | undefined>(undefined);

  return (
    <ConfigEditorSnapshotContext value={snapshot}>
      {children}
    </ConfigEditorSnapshotContext>
  );
}
