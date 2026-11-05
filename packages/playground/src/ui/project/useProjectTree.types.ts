import type { WorkbenchStore } from "@/ui/state";

import type { ProjectTreeProps } from "./ProjectTree.types";

/** A folder that is about to lose files: the dialog asks the user before it goes */
export type DeleteRequest = {
  /** The path of the folder */
  readonly path: string;
  /** How many files are inside it, at any depth */
  readonly files: number;
};

/** What {@link useProjectTree} gives the pane: the state of the tree and the handlers of the tree, the foot and the confirmation dialog. */
export type ProjectTreeController = {
  /** The folders the user closed */
  readonly collapsed: ReadonlySet<string>;
  /** The path of the node whose name is being edited, if any */
  readonly renaming: string | undefined;
  /** The item that must take the keyboard focus once the tree shows it, if any */
  readonly focusRequest: string | undefined;
  /** The item took the keyboard focus */
  readonly focusDone: () => void;
  /** The id of the selected item: the selected folder, or what is in focus */
  readonly selectedId: string | null;
  /** The folder the dialog asks about. It keeps the last one while the dialog closes */
  readonly deleteRequest: DeleteRequest;
  /** Whether the dialog is open */
  readonly isDeleteOpen: boolean;
  /** An item was selected in the tree */
  readonly select: ProjectTreeProps["onSelect"];
  /** A folder was opened or closed */
  readonly toggle: ProjectTreeProps["onToggle"];
  /** Adds a file or a folder, selects it and starts renaming it */
  readonly add: WorkbenchStore["addNode"];
  /** Starts renaming a node */
  readonly startRename: ProjectTreeProps["onRename"];
  /** Renames a node with the name typed, or says why it cannot */
  readonly commitRename: ProjectTreeProps["onRenameCommit"];
  /** Gives up renaming */
  readonly cancelRename: ProjectTreeProps["onRenameCancel"];
  /** Removes a node, after the dialog when it is a folder with files */
  readonly requestDelete: ProjectTreeProps["onDelete"];
  /** Removes the folder the dialog asked about */
  readonly confirmDelete: () => void;
  /** Closes the dialog and removes nothing */
  readonly cancelDelete: () => void;
  /** The dialog is gone from the page, which is when the keyboard can go back to the tree */
  readonly deleteExited: () => void;
};
