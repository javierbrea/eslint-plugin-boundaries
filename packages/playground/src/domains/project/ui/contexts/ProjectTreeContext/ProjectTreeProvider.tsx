import type { ReactNode } from "react";

import { ProjectTreeContext } from "./projectTreeContext";
import type { ProjectTreeProviderProps } from "./ProjectTreeProvider.types";

/**
 * Gives the items of the project tree what they need from the tree that renders them.
 * @param props ProjectTreeProvider props.
 * @param props.value What the items take from the tree.
 * @param props.children The tree that renders the items.
 * @returns The provider.
 */
export function ProjectTreeProvider({
  value,
  children,
}: Readonly<ProjectTreeProviderProps>): ReactNode {
  return <ProjectTreeContext value={value}>{children}</ProjectTreeContext>;
}
