import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { ProjectTreeProvider } from "@/domains/project/ui/contexts/ProjectTreeContext";
import type { ProjectTreeContextValue } from "@/domains/project/ui/contexts/ProjectTreeContext";
import {
  getFolderIds,
  getProjectItems,
} from "@/domains/project/ui/helpers/projectItems";
import type { ProjectItem } from "@/domains/project/ui/helpers/projectItems";
import { ProjectTreeItem } from "@/domains/project/ui/molecules/ProjectTreeItem";

import {
  PROJECT_TREE_LABEL,
  PROJECT_TREE_TEST_ID,
} from "./ProjectTree.constants";
import type { ProjectTreeProps } from "./ProjectTree.types";

/** The tree fills its pane and scrolls when it does not fit */
const TREE_STYLES = {
  boxSizing: "border-box",
  height: "100%",
  padding: "6px",
  overflow: "auto",
} as const;

/**
 * The tree of the sketch, with `eslint.config.js` pinned first: folders open and close, files and the config are selected, and the rows can be renamed and removed. It shows the state it is given and reports what the user does; the store keeps the state. The handlers must be stable, so that an item renders again only when what it shows changes.
 * @param props ProjectTree props.
 * @param props.tree The nodes of the sketch to show.
 * @param props.counts Problems per node, for the badges.
 * @param props.editable Whether nodes can be renamed and removed.
 * @param props.target The path of the node that the dependency in focus points to, which is outlined.
 * @param props.selectedId The id of the selected item.
 * @param props.collapsed The folders the user closed.
 * @param props.renaming The path of the node being renamed.
 * @param props.focusRequest The item that must take the keyboard focus once it is in the tree.
 * @param props.onFocusDone Called when the requested item took the keyboard focus.
 * @param props.onSelect Called with the item the user selected.
 * @param props.onToggle Called when a folder opens or closes.
 * @param props.onRename Called when the user asks to rename a node.
 * @param props.onRenameCommit Called with the name typed for a node.
 * @param props.onRenameCancel Called when the user gives up renaming.
 * @param props.onDelete Called when the user asks to remove a node.
 * @returns The tree.
 */
export function ProjectTree({
  tree,
  counts,
  editable,
  target,
  selectedId,
  collapsed,
  renaming,
  focusRequest,
  onFocusDone,
  onSelect,
  onToggle,
  onRename,
  onRenameCommit,
  onRenameCancel,
  onDelete,
}: Readonly<ProjectTreeProps>): ReactNode {
  const items = useMemo(() => getProjectItems(tree), [tree]);
  const expandedItems = useMemo(
    () => getFolderIds(items).filter((id) => !collapsed.has(id)),
    [items, collapsed]
  );
  // The tree view keeps its items from rendering again while their props do not change; a new context value would render all of them
  const context = useMemo<ProjectTreeContextValue>(
    () => ({
      counts,
      editable,
      target,
      renaming,
      focusRequest,
      onFocusDone,
      onRename,
      onRenameCommit,
      onRenameCancel,
      onDelete,
    }),
    [
      counts,
      editable,
      target,
      renaming,
      focusRequest,
      onFocusDone,
      onRename,
      onRenameCommit,
      onRenameCancel,
      onDelete,
    ]
  );

  return (
    <ProjectTreeProvider value={context}>
      <RichTreeView<ProjectItem, false>
        aria-label={PROJECT_TREE_LABEL}
        data-testid={PROJECT_TREE_TEST_ID}
        items={items}
        slots={{ item: ProjectTreeItem }}
        expandedItems={expandedItems}
        selectedItems={selectedId}
        onItemExpansionToggle={(_event, id, isExpanded) =>
          onToggle(id, isExpanded)
        }
        onSelectedItemsChange={(_event, id) => onSelect(id)}
        sx={TREE_STYLES}
      />
    </ProjectTreeProvider>
  );
}
