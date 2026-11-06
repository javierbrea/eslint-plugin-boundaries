import type { ReactNode } from "react";

import type { ProjectTreeContextValue } from "./projectTreeContext.types";

/** Props of {@link ProjectTreeProvider}. */
export type ProjectTreeProviderProps = {
  /** What the items of the tree take from the tree. A new value renders every item again, so the tree keeps it stable. */
  readonly value: ProjectTreeContextValue;
  /** The tree that renders the items. */
  readonly children: ReactNode;
};
