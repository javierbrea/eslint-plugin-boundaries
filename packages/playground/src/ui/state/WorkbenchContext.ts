import { createContext } from "react";

import type { WorkbenchContextValue } from "./WorkbenchProvider.types";

/** The store of the instance and what goes with it. `WorkbenchProvider` provides it; the hooks of `ui/state` read it. */
export const WorkbenchContext = createContext<WorkbenchContextValue | null>(
  null
);
