import type { SketchNode } from "@/contract";
import type { ProblemCounts } from "@/domains/problems/helpers/problemSelectors";
import type { MenuPosition } from "@/domains/project/ui/helpers/projectMenu";

/** What the items of the tree take from the tree that holds them: the library renders them, so their props are not ours. */
export type ProjectTreeContextValue = {
  /** Problems per node, for the badges */
  readonly counts: ProblemCounts;
  /** Whether nodes can be added, renamed and removed */
  readonly editable: boolean;
  /** The path of the node that the dependency in focus points to, if any. Its item is outlined and tagged */
  readonly target: string | undefined;
  /** The path of the node whose name is being edited, if any */
  readonly renaming: string | undefined;
  /** The item that must take the keyboard focus once it is in the tree, if any */
  readonly focusRequest: string | undefined;
  /** Called when the requested item took the keyboard focus */
  readonly onFocusDone: () => void;
  /** Called when the user asks to rename a node */
  readonly onRename: (path: string) => void;
  /** Called with the name that the user typed for a node. It returns why the name is refused, or `undefined` when the node was renamed */
  readonly onRenameCommit: (path: string, name: string) => string | undefined;
  /** Called when the user gives up renaming */
  readonly onRenameCancel: () => void;
  /** Called when the user asks to remove a node */
  readonly onDelete: (path: string) => void;
  /** Called when the user opens the context menu of a node, or of the root of the project, which is the folder with an empty path, where the menu must open */
  readonly onOpenMenu: (target: SketchNode, position: MenuPosition) => void;
};
