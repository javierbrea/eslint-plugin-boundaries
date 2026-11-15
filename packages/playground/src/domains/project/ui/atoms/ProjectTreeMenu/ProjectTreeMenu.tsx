import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";

import { getMenuGroups } from "@/domains/project/ui/helpers/projectMenu";
import type { ProjectMenuAction } from "@/domains/project/ui/helpers/projectMenu";

import {
  NODE_MENU_LABEL,
  PROJECT_MENU_ACTION_LABELS,
  PROJECT_MENU_SHORTCUTS,
  PROJECT_TREE_MENU_TRANSITION,
  ROOT_MENU_LABEL,
} from "./ProjectTreeMenu.constants";
import type { ProjectTreeMenuProps } from "./ProjectTreeMenu.types";

/** A context menu is wide enough for its longest item and the key at its end */
const LIST_STYLES = { minWidth: 180 } as const;

// The key is written for the eyes only: the item announces it
const Shortcut = styled("span")(({ theme }) => ({
  marginLeft: "auto",
  paddingLeft: 24,
  color: "var(--jsb-muted)",
  ...theme.typography.monoCaption,
}));

/**
 * Keeps the menu of the browser from opening over this one.
 * @param menuEvent The right click, or the key that opens a menu, inside this one.
 */
function preventBrowserMenu(menuEvent: ReactMouseEvent): void {
  menuEvent.preventDefault();
}

/**
 * Finds the item of the menu that a key press does, by the key written at its end.
 * @param actions The actions that the menu offers.
 * @param key The `key` of the key press, such as `F2`.
 * @returns The action of the item, or `undefined` when no item of the menu has that key.
 */
function findShortcutAction(
  actions: readonly ProjectMenuAction[],
  key: string
): ProjectMenuAction | undefined {
  return actions.find((action) => PROJECT_MENU_SHORTCUTS[action] === key);
}

/**
 * The context menu of the project tree, which opens where the user right clicked: on a file or a folder, it adds a file or a folder in the folder of the node and renames or removes the node; on the empty space of the tree, it adds them at the root. The key written at the end of an item picks it from anywhere in the menu, and does the same from the row. A right click outside the menu closes it, as a click does, and the menu of the browser never opens over it.
 * @param props ProjectTreeMenu props.
 * @param props.isOpen Whether the menu is open.
 * @param props.target The node the menu is about, or the folder with an empty path for the root.
 * @param props.position Where the menu opens.
 * @param props.onAction Called with the action that the user picks, with the pointer or the keyboard.
 * @param props.onClose Called when the user closes the menu without picking.
 * @param props.onExited Called when the menu is gone from the page after it closed.
 * @returns The menu, which opens inside the root element of the playground.
 */
export function ProjectTreeMenu({
  isOpen,
  target,
  position,
  onAction,
  onClose,
  onExited,
}: Readonly<ProjectTreeMenuProps>): ReactNode {
  const menuName =
    target.path === "" ? ROOT_MENU_LABEL : `${NODE_MENU_LABEL} ${target.path}`;
  const groups = getMenuGroups(target);

  /**
   * Picks the item whose key the user pressed, wherever the focus is in the menu.
   * @param keyEvent The key press inside the menu.
   */
  function handleKeyDown(keyEvent: ReactKeyboardEvent): void {
    const action = findShortcutAction(groups.flat(), keyEvent.key);

    if (action !== undefined) {
      keyEvent.preventDefault();
      onAction(action);
    }
  }

  return (
    <Menu
      open={isOpen}
      onClose={() => onClose()}
      anchorReference="anchorPosition"
      anchorPosition={position}
      transitionDuration={PROJECT_TREE_MENU_TRANSITION}
      slotProps={{
        list: {
          "aria-label": menuName,
          sx: LIST_STYLES,
          onKeyDown: handleKeyDown,
        },
        paper: { onContextMenu: preventBrowserMenu },
        backdrop: {
          onContextMenu: (menuEvent: ReactMouseEvent) => {
            preventBrowserMenu(menuEvent);
            onClose();
          },
        },
        transition: { onExited },
      }}
    >
      {groups.flatMap((actions, index) => [
        ...(index > 0 ? [<Divider key={`divider-${index}`} />] : []),
        ...actions.map((action) => {
          const shortcut = PROJECT_MENU_SHORTCUTS[action];

          return (
            <MenuItem
              key={action}
              aria-keyshortcuts={shortcut}
              onClick={() => onAction(action)}
            >
              {PROJECT_MENU_ACTION_LABELS[action]}
              {shortcut === undefined ? null : (
                <Shortcut aria-hidden>{shortcut}</Shortcut>
              )}
            </MenuItem>
          );
        }),
      ])}
    </Menu>
  );
}
