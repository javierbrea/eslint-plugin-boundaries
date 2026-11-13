import type { SketchNode } from "@/contract";

import type { ProjectMenuAction } from "./projectMenu.types";

/** The actions that add a node in the folder of the menu */
const ADD_ACTIONS: readonly ProjectMenuAction[] = ["add-file", "add-folder"];

/** The actions that change the node of the menu */
const EDIT_ACTIONS: readonly ProjectMenuAction[] = ["rename", "delete"];

/**
 * Gets what the menu of the project tree offers for a node, in groups that the menu separates: the actions that add a node first, as in the menu of an editor, then the ones that rename and remove the node. The root of the project can be neither renamed nor removed.
 * @param target The node the menu is about, or the folder with an empty path for the root.
 * @returns The groups of actions, in the order the menu lists them.
 */
export function getMenuGroups(
  target: SketchNode
): readonly (readonly ProjectMenuAction[])[] {
  return target.path === "" ? [ADD_ACTIONS] : [ADD_ACTIONS, EDIT_ACTIONS];
}
