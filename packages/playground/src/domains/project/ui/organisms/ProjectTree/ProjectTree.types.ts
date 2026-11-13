import type { Sketch } from "@/contract";
import type { ProjectTreeContextValue } from "@/domains/project/ui/contexts/ProjectTreeContext";

/** Props of {@link ProjectTree}: what the items take from the tree (the counts of problems, whether nodes can be edited and the handlers of the rename, the removal and the context menu) and what only the tree itself needs. */
export type ProjectTreeProps = ProjectTreeContextValue & {
  /** The nodes of the sketch to show as a tree. The items are built again only when they change, not when the config does */
  readonly tree: Sketch["tree"];
  /** The id of the selected item, if any */
  readonly selectedId: string | null;
  /** The folders the user closed. The others are open */
  readonly collapsed: ReadonlySet<string>;
  /** Called with the id of the item the user selected */
  readonly onSelect: (id: string | null) => void;
  /** Called when a folder opens or closes */
  readonly onToggle: (id: string, isExpanded: boolean) => void;
};
