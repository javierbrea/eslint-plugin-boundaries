import { useContext } from "react";

import { ProjectTreeContext } from "./projectTreeContext";
import type { ProjectTreeContextValue } from "./projectTreeContext.types";

/**
 * Gets what the tree gives its items: the counts of problems, whether nodes can be edited, and the handlers of the rename and the removal.
 * @returns The value of the tree that renders the item.
 * @throws {Error} When the component is not inside a `ProjectTreeProvider`.
 */
export function useProjectTreeContext(): ProjectTreeContextValue {
  const context = useContext(ProjectTreeContext);

  if (context === null) {
    throw new Error("A project tree item is outside ProjectTreeProvider.");
  }
  return context;
}
