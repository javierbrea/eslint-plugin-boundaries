import { createContext } from "react";

import type { ProjectTreeContextValue } from "./projectTreeContext.types";

/** What the items of the project tree need from the tree that renders them. `ProjectTreeProvider` provides it; `useProjectTreeContext` reads it. */
export const ProjectTreeContext = createContext<ProjectTreeContextValue | null>(
  null
);
