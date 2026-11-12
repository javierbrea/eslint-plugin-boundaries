import { createContext } from "react";
import type { RefObject } from "react";

import type { ConfigEditorSnapshot } from "./configEditorSnapshot.types";

/** The place where the config editor leaves its snapshot. `ConfigEditorSnapshotProvider` provides it; `useConfigEditorSnapshot` reads it. */
export const ConfigEditorSnapshotContext = createContext<RefObject<
  ConfigEditorSnapshot | undefined
> | null>(null);
