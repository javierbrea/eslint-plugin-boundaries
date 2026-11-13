import type { ProjectMenuAction } from "@/domains/project/ui/helpers/projectMenu";

/** What the accessible name of the menu of a node says before the path of the node. */
export const NODE_MENU_LABEL = "Actions for";

/** The accessible name of the menu of the root of the project, which the empty space of the tree opens. */
export const ROOT_MENU_LABEL = "Actions for the project";

/** What each item of the menu says, which is also its accessible name. */
export const PROJECT_MENU_ACTION_LABELS: Readonly<
  Record<ProjectMenuAction, string>
> = {
  "add-file": "New file",
  "add-folder": "New folder",
  rename: "Rename",
  delete: "Delete",
};

/** The key that picks an item from anywhere in the menu, and does what the item does from the row. The item announces it and writes it at its end, and it is also the `key` of its key press. */
export const PROJECT_MENU_SHORTCUTS: Readonly<
  Partial<Record<ProjectMenuAction, string>>
> = {
  rename: "F2",
  delete: "Delete",
};

/** How long the menu takes to open and to close, in milliseconds. It closes at once, so that the action the user picked, which runs once the menu is gone, starts right away. */
export const PROJECT_TREE_MENU_TRANSITION = { enter: 150, exit: 0 } as const;
