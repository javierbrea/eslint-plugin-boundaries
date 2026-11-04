import type { Sketch } from "../../contract";
import type { ProblemCounts } from "../state";

/** An item of the tree view: the config node, or a node of the sketch. Its id is its path, and the id of the config node is `eslint.config.js` */
export type ProjectItem = {
  /** The path of the node, which is the id of the item */
  readonly id: string;
  /** The last segment of the path */
  readonly name: string;
  /** What the row reads: the name, with a trailing `/` for a folder */
  readonly label: string;
  /** Whether the item is the config node, a file or a folder */
  readonly kind: "config" | "file" | "folder";
  /** The items inside a folder. The tree view takes a mutable array */
  readonly children: ProjectItem[];
};

/** Props of {@link ProjectTree}. */
export type ProjectTreeProps = {
  /** The nodes of the sketch to show as a tree. The items are built again only when they change, not when the config does */
  readonly tree: Sketch["tree"];
  /** Problems per node, for the badges */
  readonly counts: ProblemCounts;
  /** Whether nodes can be renamed and removed */
  readonly editable: boolean;
  /** The id of the selected item, if any */
  readonly selectedId: string | null;
  /** The folders the user closed. The others are open */
  readonly collapsed: ReadonlySet<string>;
  /** The path of the node whose name is being edited, if any */
  readonly renaming: string | undefined;
  /** The item that must take the keyboard focus once it is in the tree, if any */
  readonly focusRequest: string | undefined;
  /** Called when the requested item took the keyboard focus */
  readonly onFocusDone: () => void;
  /** Called with the id of the item the user selected */
  readonly onSelect: (id: string | null) => void;
  /** Called when a folder opens or closes */
  readonly onToggle: (id: string, isExpanded: boolean) => void;
  /** Called when the user asks to rename a node */
  readonly onRename: (path: string) => void;
  /** Called with the name that the user typed for a node. It returns why the name is refused, or `undefined` when the node was renamed */
  readonly onRenameCommit: (path: string, name: string) => string | undefined;
  /** Called when the user gives up renaming */
  readonly onRenameCancel: () => void;
  /** Called when the user asks to remove a node */
  readonly onDelete: (path: string) => void;
};

/** What the items of the tree take from the tree that holds them: the library renders them, so their props are not ours */
export type ProjectTreeContextValue = Pick<
  ProjectTreeProps,
  | "counts"
  | "editable"
  | "renaming"
  | "focusRequest"
  | "onFocusDone"
  | "onRename"
  | "onRenameCommit"
  | "onRenameCancel"
  | "onDelete"
>;
