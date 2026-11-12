import type { Sketch } from "@/contract";
import { CONFIG_PATH, buildTree } from "@/domains/project/helpers/sketch";
import type { TreeItem } from "@/domains/project/helpers/sketch";

import type { ProjectItem } from "./projectItems.types";

/** The config node, pinned above the tree */
const CONFIG_ITEM: ProjectItem = {
  id: CONFIG_PATH,
  name: CONFIG_PATH,
  label: CONFIG_PATH,
  kind: "config",
  children: [],
};

/**
 * Turns an item of the sketch's tree into an item of the tree view.
 * @param item The item to turn.
 * @returns The item of the tree view, with its children turned too.
 */
function toProjectItem(item: TreeItem): ProjectItem {
  return {
    id: item.path,
    name: item.name,
    label: item.kind === "folder" ? `${item.name}/` : item.name,
    kind: item.kind,
    children: item.children.map(toProjectItem),
  };
}

/**
 * Builds the items the tree view shows: the config node first, then the tree of the sketch.
 * @param tree The nodes of the sketch to show.
 * @returns The items of the root of the tree view.
 */
export function getProjectItems(tree: Sketch["tree"]): ProjectItem[] {
  return [CONFIG_ITEM, ...buildTree({ tree }).map(toProjectItem)];
}

/**
 * Gets the ids of the folders of a list of items, at any depth.
 * @param items The items to look into.
 * @returns The path of each folder, each folder before the folders inside it.
 */
export function getFolderIds(items: readonly ProjectItem[]): string[] {
  return items.flatMap((item) =>
    item.kind === "folder" ? [item.id, ...getFolderIds(item.children)] : []
  );
}
