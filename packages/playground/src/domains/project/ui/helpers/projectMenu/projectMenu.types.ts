import type { SketchNode } from "@/contract";

/** What the user can do from the menu of the project tree: add a file or a folder in the folder of the menu, and rename or remove its node */
export type ProjectMenuAction = "add-file" | "add-folder" | "rename" | "delete";

/** Where a menu opens, in pixels from the top left corner of the viewport, such as where the pointer was */
export type MenuPosition = {
  /** The distance from the top of the viewport */
  readonly top: number;
  /** The distance from the left of the viewport */
  readonly left: number;
};

/** A menu that the user opened on the project tree */
export type ProjectMenuRequest = {
  /** The node the menu is about. The root of the project, which the empty space of the tree stands for, is the folder with an empty path */
  readonly target: SketchNode;
  /** Where the menu opens */
  readonly position: MenuPosition;
};
