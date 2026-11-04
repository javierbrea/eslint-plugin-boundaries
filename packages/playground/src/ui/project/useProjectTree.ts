import { useMemo, useRef, useState } from "react";

import type { Sketch } from "../../contract";
import {
  CONFIG_PATH,
  addNode,
  getFiles,
  getParentPath,
  getUniquePath,
  hasNode,
  isSameOrInside,
  movePath,
  normalizePath,
  removeNode,
  renameNode,
} from "../../sketch";
import type { EditResult } from "../../sketch";
import type { Focus } from "../state/Focus.types";

import type {
  DeleteRequest,
  ProjectTreeController,
  ProjectTreeOptions,
} from "./useProjectTree.types";

/** The request that the dialog shows before there is one: it is closed, so nobody reads it */
const NO_REQUEST: DeleteRequest = { path: "", files: 0 };

/** The folders the user closed, before the user closes any */
const NONE_COLLAPSED: ReadonlySet<string> = new Set();

/** Names that a new file and a new folder start with, until the user renames them */
const NEW_NAMES = { file: "new-file.js", folder: "new-folder" } as const;

/**
 * Gets the id of the tree item that a focus is on.
 * @param openNode What is in focus.
 * @returns The path of the file, the id of the config node, or `undefined` when no item has the focus.
 */
function getFocusId(openNode: Focus): string | undefined {
  switch (openNode.kind) {
    case "file":
      return openNode.path;
    case "config":
      return CONFIG_PATH;
    default:
      return undefined;
  }
}

/**
 * Gets the folder that a new node goes in: the folder the user selected, the folder of the file in focus, or the root.
 * @param sketch The sketch.
 * @param files The paths of the files of the sketch.
 * @param pickedFolder The folder the user selected last, if any. It can be gone, or be a file, if the sketch was edited since.
 * @param openNode What is in focus.
 * @returns The path of the folder, or an empty string for the root.
 */
function getTargetFolder(
  sketch: Sketch,
  files: ReadonlySet<string>,
  pickedFolder: string | undefined,
  openNode: Focus
): string {
  // Nothing can be added under a file, and `hasNode` is true for one
  if (
    pickedFolder !== undefined &&
    hasNode(sketch, pickedFolder) &&
    !files.has(pickedFolder)
  ) {
    return pickedFolder;
  }
  return openNode.kind === "file" ? getParentPath(openNode.path) : "";
}

/**
 * Gets the item that takes the keyboard focus after a folder is removed: the nearest folder above it that the removal leaves, since a folder with nothing else in it goes with the last of its nodes.
 * @param sketch The sketch after the removal.
 * @param removedPath The path of the folder that was removed.
 * @returns The path of the folder, or the id of the config node when no folder is left above.
 */
function getItemAfterRemoval(sketch: Sketch, removedPath: string): string {
  for (
    let folder = getParentPath(removedPath);
    folder !== "";
    folder = getParentPath(folder)
  ) {
    if (hasNode(sketch, folder)) {
      return folder;
    }
  }
  return CONFIG_PATH;
}

/**
 * Opens the folders above a path, so that the node at it shows.
 * @param collapsed The folders that are closed.
 * @param path The path of a node.
 * @returns The folders that stay closed.
 */
function openAncestors(
  collapsed: ReadonlySet<string>,
  path: string | undefined
): ReadonlySet<string> {
  const stillClosed = new Set(collapsed);

  for (
    let folder = getParentPath(path ?? "");
    folder !== "";
    folder = getParentPath(folder)
  ) {
    stillClosed.delete(folder);
  }
  return stillClosed;
}

/**
 * Applies an edit: the new sketch goes to the pane's owner.
 * @param result What the edit returned.
 * @param onSketchChange Called with the new sketch.
 * @returns Why the edit was refused, or `undefined` when it was applied.
 */
function apply(
  result: EditResult,
  onSketchChange: (sketch: Sketch) => void
): string | undefined {
  if ("error" in result) {
    return result.error;
  }
  onSketchChange(result.sketch);
  return undefined;
}

/**
 * Holds what the project tree remembers between renders and does with the sketch: which item is selected, which folders are closed, which node is being renamed, the folder waiting for the user to confirm its removal, and the edits that the rows and the foot of the pane ask for. It lives in the pane, not in the tree, so that the foot can add a node and so that the tree keeps its state while the text is shown.
 * @param options What the hook needs from the pane.
 * @param options.sketch The sketch the tree edits.
 * @param options.focus What is in focus.
 * @param options.view How the project is shown.
 * @param options.onViewChange Called with the view that the pane must show.
 * @param options.onSketchChange Called with the new sketch after each edit.
 * @param options.onFocus Called with what the user opens, or with `none` when the open file is removed.
 * @returns The state and the handlers, for the tree, the foot and the confirmation dialog.
 */
export function useProjectTree({
  sketch,
  focus: openNode,
  view,
  onViewChange,
  onSketchChange,
  onFocus,
}: Readonly<ProjectTreeOptions>): ProjectTreeController {
  const [collapsed, setCollapsed] =
    useState<ReadonlySet<string>>(NONE_COLLAPSED);
  // A folder the user selected: it does not take the focus, which stays on the file that is open, but it is where `+ File` adds
  const [pickedFolder, setPickedFolder] = useState<string | undefined>(
    undefined
  );
  const [renaming, setRenaming] = useState<string | undefined>(undefined);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(NO_REQUEST);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // The item that must take the keyboard focus once the tree shows it: after a rename, the one that was renamed
  const [focusRequest, setFocusRequest] = useState<string | undefined>(
    undefined
  );
  // Where the keyboard goes once the dialog is gone after the user confirmed: the dialog has the focus until then, and the folder it asked about does not exist any more
  const afterDeleteRef = useRef<string | undefined>(undefined);
  const files = useMemo(() => new Set(getFiles(sketch)), [sketch]);

  const focusId = getFocusId(openNode);
  const [seenFocusId, setSeenFocusId] = useState(focusId);

  // A focus that comes from elsewhere, such as a problem, replaces the selected folder and is shown even if a folder above it is closed
  if (seenFocusId !== focusId) {
    setSeenFocusId(focusId);
    setPickedFolder(undefined);
    setCollapsed(openAncestors(collapsed, focusId));
  }

  /**
   * Ends a rename, whatever came of it, and gives the keyboard back to the tree.
   * @param path The path of the node that has the focus now.
   */
  function finishRename(path: string | undefined): void {
    setRenaming(undefined);
    setFocusRequest(path);
  }

  /**
   * Handles the selection of an item. A file and the config take the focus, so that they open; a folder is only selected, and is where the next node is added.
   * @param id The id of the item, or `null` when the keyboard cleared the selection, which leaves everything as it was.
   */
  function select(id: string | null): void {
    if (id === null) {
      return;
    }
    if (id === CONFIG_PATH || files.has(id)) {
      setPickedFolder(undefined);
      onFocus(
        id === CONFIG_PATH ? { kind: "config" } : { kind: "file", path: id }
      );
    } else {
      setPickedFolder(id);
    }
  }

  /**
   * Remembers that a folder was opened or closed.
   * @param id The path of the folder.
   * @param isExpanded Whether the folder is open now.
   */
  function toggle(id: string, isExpanded: boolean): void {
    const next = new Set(collapsed);

    if (isExpanded) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCollapsed(next);
  }

  /**
   * Adds a file or a folder with a free name, selects it and starts renaming it. It opens the folders above it, and the tree if the text was shown.
   * @param kind Whether to add a file or a folder.
   */
  function add(kind: "file" | "folder"): void {
    const folder = getTargetFolder(sketch, files, pickedFolder, openNode);
    const path = getUniquePath(sketch, folder, NEW_NAMES[kind]);

    // The path is free and valid, and no file is above it: the folder is a folder of the sketch, or the root
    apply(addNode(sketch, path, kind), onSketchChange);
    setCollapsed(openAncestors(collapsed, path));
    if (kind === "file") {
      setPickedFolder(undefined);
      onFocus({ kind: "file", path });
    } else {
      setPickedFolder(path);
    }
    setRenaming(path);
    // Text mode has no row to rename in
    if (view === "text") {
      onViewChange("tree");
    }
  }

  /**
   * Renames a node in its folder with the name the user typed. The sketch, the focus, the selected folder and the closed folders follow the rename.
   * @param path The path of the node.
   * @param typedName The name as typed: it can have a path, which moves the node.
   * @returns Why the name is refused, or `undefined` when the node was renamed or did not change.
   */
  function commitRename(path: string, typedName: string): string | undefined {
    const cleaned = normalizePath(typedName).path;
    const folder = getParentPath(path);
    // An empty name has no folder in front of it, so that the reason is the one of an empty path
    const newPath =
      folder === "" || cleaned === "" ? cleaned : `${folder}/${cleaned}`;

    if (newPath === path) {
      finishRename(path);
      return undefined;
    }

    const refusal = apply(renameNode(sketch, path, newPath), onSketchChange);

    if (refusal !== undefined) {
      return refusal;
    }
    if (openNode.kind === "file" && isSameOrInside(openNode.path, path)) {
      onFocus({ kind: "file", path: movePath(openNode.path, path, newPath) });
    }
    if (pickedFolder !== undefined) {
      setPickedFolder(movePath(pickedFolder, path, newPath));
    }
    // The node can move into a closed folder, which opens so that the node shows
    setCollapsed(
      openAncestors(
        new Set(Array.from(collapsed, (id) => movePath(id, path, newPath))),
        newPath
      )
    );
    finishRename(newPath);
    return undefined;
  }

  /**
   * Removes a node and everything under it. If it holds what is in focus, nothing is in focus after.
   * @param path The path of the node.
   * @returns The sketch without the node, or the same sketch when there was no such node.
   */
  function remove(path: string): Sketch {
    const result = removeNode(sketch, path);

    apply(result, onSketchChange);
    if (openNode.kind === "file" && isSameOrInside(openNode.path, path)) {
      onFocus({ kind: "none" });
    }
    if (pickedFolder !== undefined && isSameOrInside(pickedFolder, path)) {
      setPickedFolder(undefined);
    }
    return "error" in result ? sketch : result.sketch;
  }

  /**
   * Removes a node, or asks first when it is a folder with files.
   * @param path The path of the node.
   */
  function requestDelete(path: string): void {
    const inside = Array.from(files).filter((file) =>
      file.startsWith(`${path}/`)
    ).length;

    if (inside === 0) {
      remove(path);
    } else {
      setDeleteRequest({ path, files: inside });
      setIsDeleteOpen(true);
    }
  }

  /** Removes the folder the dialog asked about, and closes the dialog. The keyboard goes back to the tree when the dialog is gone. */
  function confirmDelete(): void {
    const next = remove(deleteRequest.path);

    afterDeleteRef.current = getItemAfterRemoval(next, deleteRequest.path);
    setIsDeleteOpen(false);
  }

  /** Gives the keyboard to the tree when the dialog is gone after a removal. Closing the dialog without one leaves the keyboard where the dialog restores it, on the folder, which is still there. */
  function deleteExited(): void {
    setFocusRequest(afterDeleteRef.current);
    afterDeleteRef.current = undefined;
  }

  return {
    collapsed,
    renaming,
    focusRequest,
    focusDone: () => setFocusRequest(undefined),
    selectedId: pickedFolder ?? focusId ?? null,
    deleteRequest,
    isDeleteOpen,
    select,
    toggle,
    add,
    startRename: setRenaming,
    commitRename,
    cancelRename: () => finishRename(renaming),
    requestDelete,
    confirmDelete,
    cancelDelete: () => setIsDeleteOpen(false),
    deleteExited,
  };
}
