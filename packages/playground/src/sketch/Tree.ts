import type { Sketch, SketchNode } from "@/contract";

import { getAncestors, getPathError } from "./Paths";
import type { TreeItem } from "./Sketch.types";

/** A node of the trie that {@link toItems} builds while it reads the paths */
type Entry = {
  readonly path: string;
  readonly name: string;
  readonly kind: SketchNode["kind"];
  readonly children: Map<string, Entry>;
};

/**
 * Compares two names: numbers inside them by value, and ignoring the case, with the full comparison as a tiebreaker so that the order does not depend on the order of the input.
 * @param first A name.
 * @param second Another name.
 */
function compareNames(first: string, second: string): number {
  return (
    first.localeCompare(second, "en", {
      numeric: true,
      sensitivity: "base",
    }) || first.localeCompare(second, "en")
  );
}

/**
 * Compares two items of the same level: folders first, then files, each by name.
 * @param first An item.
 * @param second Another item.
 */
function compareItems(first: TreeItem, second: TreeItem): number {
  if (first.kind !== second.kind) {
    return first.kind === "folder" ? -1 : 1;
  }
  return compareNames(first.name, second.name);
}

/**
 * Turns the entries of a level of the trie into sorted items.
 * @param level The entries of the level, by name.
 */
function sortEntries(level: ReadonlyMap<string, Entry>): TreeItem[] {
  return Array.from(level.values(), (entry) => {
    const children = sortEntries(entry.children);

    return {
      path: entry.path,
      name: entry.name,
      // A node with something under it is a folder, even if the sketch declares it as a file
      kind: children.length > 0 ? "folder" : entry.kind,
      children,
    } satisfies TreeItem;
  }).sort(compareItems);
}

/**
 * Builds the items of the tree: every path adds its folders, so a folder exists when a node is under it or when the nodes declare it.
 * @param nodes The nodes of a sketch.
 */
function toItems(nodes: readonly SketchNode[]): readonly TreeItem[] {
  const root = new Map<string, Entry>();

  for (const node of nodes) {
    const segments = node.path.split("/");
    let level = root;

    segments.forEach((segment, index) => {
      let entry = level.get(segment);

      if (entry === undefined) {
        entry = {
          path: segments.slice(0, index + 1).join("/"),
          name: segment,
          kind: index === segments.length - 1 ? node.kind : "folder",
          children: new Map(),
        };
        level.set(segment, entry);
      }
      level = entry.children;
    });
  }
  return sortEntries(root);
}

/**
 * Flattens items into the nodes they come from: files, and folders that have nothing in them.
 * @param items The items of a level.
 */
function flatten(items: readonly TreeItem[]): SketchNode[] {
  return items.flatMap((item) =>
    item.children.length > 0
      ? flatten(item.children)
      : [{ path: item.path, kind: item.kind }]
  );
}

/**
 * Builds the tree that the project pane shows. Folders are implied by the files under them, and a `folder` node adds an empty folder.
 * @param sketch The sketch to read: only its tree counts, so that a caller can keep the result while the config changes.
 * @returns The items of the root: folders first, then files, each sorted by name, numbers by value and ignoring the case.
 */
export function buildTree(sketch: Pick<Sketch, "tree">): readonly TreeItem[] {
  return toItems(sketch.tree);
}

/**
 * Puts nodes in the order of the tree and drops the folders that the nodes under them imply, so that a folder node is only an empty folder.
 * @param nodes The nodes of a sketch, in any order.
 * @returns The files and the empty folders, in the order that {@link buildTree} shows them.
 */
export function canonicalizeNodes(
  nodes: readonly SketchNode[]
): readonly SketchNode[] {
  return flatten(toItems(nodes));
}

/**
 * Gets the paths of the files of a sketch.
 * @param sketch The sketch to read: only its tree counts.
 * @returns The file paths, in the order of the tree.
 */
export function getFiles(sketch: Pick<Sketch, "tree">): readonly string[] {
  return canonicalizeNodes(sketch.tree)
    .filter((node) => node.kind === "file")
    .map((node) => node.path);
}

/**
 * Counts the files inside a folder, at any depth.
 * @param sketch The sketch to read.
 * @param path The path of the folder.
 * @returns How many files {@link getFiles} gives that are under the path. It is 0 for a file, for a path with no node, and for a folder with no file in it.
 */
export function countFilesUnder(sketch: Sketch, path: string): number {
  return getFiles(sketch).filter((file) => file.startsWith(`${path}/`)).length;
}

/**
 * Tells what is at a path of a list of nodes. A path with a node under it is a folder, declared or not.
 * @param nodes The nodes to look into.
 * @param path A path of the sketch.
 * @returns The kind of node, or `undefined` when there is none.
 */
export function getNodeKind(
  nodes: readonly SketchNode[],
  path: string
): SketchNode["kind"] | undefined {
  if (nodes.some((node) => node.path.startsWith(`${path}/`))) {
    return "folder";
  }
  return nodes.find((node) => node.path === path)?.kind;
}

/**
 * Tells whether a sketch has a file or a folder at a path, implied folders included.
 * @param sketch The sketch to read.
 * @param path A path of the sketch.
 */
export function hasNode(sketch: Sketch, path: string): boolean {
  return getNodeKind(sketch.tree, path) !== undefined;
}

/**
 * Tells why a node cannot be added at a path: the path is invalid, there is already a node there, or a file is above it.
 * @param nodes The nodes of the sketch.
 * @param path The path of the new node.
 * @param kind Whether the new node is a file or a folder.
 * @returns The reason as a sentence for the user, or `undefined` when the node can be added.
 */
export function getAddError(
  nodes: readonly SketchNode[],
  path: string,
  kind: SketchNode["kind"]
): string | undefined {
  const pathError = getPathError(path);

  if (pathError !== undefined) {
    return pathError;
  }

  const existing = getNodeKind(nodes, path);

  if (existing !== undefined) {
    return existing === kind
      ? "That path already exists."
      : `A ${existing} already exists at that path.`;
  }

  const file = getAncestors(path).find(
    (ancestor) => getNodeKind(nodes, ancestor) === "file"
  );

  return file === undefined
    ? undefined
    : `"${file}" is a file, so nothing can be added under it.`;
}
