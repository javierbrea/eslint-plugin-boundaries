import type { SketchNode } from "@/contract";
import type {
  MenuPosition,
  ProjectMenuAction,
} from "@/domains/project/ui/helpers/projectMenu";

/** Props of {@link ProjectTreeMenu}. */
export type ProjectTreeMenuProps = {
  /** Whether the menu is open. */
  readonly isOpen: boolean;
  /** The node the menu is about, or the folder with an empty path for the root of the project. It keeps the last one while the menu closes. */
  readonly target: SketchNode;
  /** Where the menu opens, such as where the pointer was. */
  readonly position: MenuPosition;
  /** Called with the action that the user picks. The menu does not close by itself. */
  readonly onAction: (action: ProjectMenuAction) => void;
  /** Called when the user closes the menu without picking: Escape, Tab, or a click or a right click outside it. */
  readonly onClose: () => void;
  /** Called when the menu is gone from the page after it closed, which is after it gave the keyboard back to where it was. */
  readonly onExited: () => void;
};
