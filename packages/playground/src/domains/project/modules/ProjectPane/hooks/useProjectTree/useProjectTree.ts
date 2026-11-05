import { useCallback, useRef, useState } from "react";

import type { Sketch } from "@/contract";
import {
  CONFIG_PATH,
  countFilesUnder,
  getParentPath,
  hasNode,
} from "@/domains/project/helpers/sketch";
import {
  useAddNode,
  useCancelRename,
  useClosedFolders,
  useFocus,
  usePickedFolder,
  useRemoveNode,
  useRenameNode,
  useRenaming,
  useSelectItem,
  useSessionStore,
  useStartRename,
  useToggleFolder,
} from "@/domains/session/data/store";
import type { Focus } from "@/domains/session/helpers/focus";

import type {
  DeleteRequest,
  ProjectTreeController,
} from "./useProjectTree.types";

/** The request that the dialog shows before there is one: it is closed, so nobody reads it */
const NO_REQUEST: DeleteRequest = { path: "", files: 0 };

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
 * Connects the project tree to the store, and holds what belongs to the page and not to the store: the item that must take the keyboard focus, and the dialog that asks before a folder with files goes. The edits are transitions of the store, which move the focus, the selected folder and the closed folders with the sketch. Every handler is stable while what it reads does not change, so that the items of the tree do not render again.
 * @returns The state and the handlers, for the tree, the foot and the confirmation dialog.
 */
export function useProjectTree(): ProjectTreeController {
  const store = useSessionStore();
  const openNode = useFocus();
  const pickedFolder = usePickedFolder();
  const closedFolders = useClosedFolders();
  const renaming = useRenaming();
  const selectItem = useSelectItem();
  const toggleFolder = useToggleFolder();
  const addNode = useAddNode();
  const startRename = useStartRename();
  const renameNode = useRenameNode();
  const cancelRenameInStore = useCancelRename();
  const removeNode = useRemoveNode();
  // The item that must take the keyboard focus once the tree shows it: after a rename, the one that was renamed
  const [focusRequest, setFocusRequest] = useState<string | undefined>(
    undefined
  );
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(NO_REQUEST);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // Where the keyboard goes once the dialog is gone after the user confirmed: the dialog has the focus until then, and the folder it asked about does not exist any more
  const afterDeleteRef = useRef<string | undefined>(undefined);

  // The keyboard can clear the selection, which leaves everything as it was
  const select = useCallback(
    (id: string | null) => {
      if (id !== null) {
        selectItem(id);
      }
    },
    [selectItem]
  );

  const focusDone = useCallback(() => setFocusRequest(undefined), []);

  // A rename that ends gives the keyboard back to the tree, on the node with its new path
  const commitRename = useCallback(
    (path: string, typedName: string) => {
      const outcome = renameNode(path, typedName);

      if ("error" in outcome) {
        return outcome.error;
      }
      setFocusRequest(outcome.path);
      return undefined;
    },
    [renameNode]
  );

  const cancelRename = useCallback(() => {
    setFocusRequest(renaming);
    cancelRenameInStore();
  }, [renaming, cancelRenameInStore]);

  // The sketch is read when the user asks, so that the handler does not change with each edit
  const requestDelete = useCallback(
    (path: string) => {
      const files = countFilesUnder(store.getState().sketch, path);

      if (files === 0) {
        removeNode(path);
      } else {
        setDeleteRequest({ path, files });
        setIsDeleteOpen(true);
      }
    },
    [store, removeNode]
  );

  /** Removes the folder the dialog asked about, and closes the dialog. The keyboard goes back to the tree when the dialog is gone. */
  function confirmDelete(): void {
    removeNode(deleteRequest.path);
    afterDeleteRef.current = getItemAfterRemoval(
      store.getState().sketch,
      deleteRequest.path
    );
    setIsDeleteOpen(false);
  }

  /** Gives the keyboard to the tree when the dialog is gone after a removal. Closing the dialog without one leaves the keyboard where the dialog restores it, on the folder, which is still there. */
  function deleteExited(): void {
    setFocusRequest(afterDeleteRef.current);
    afterDeleteRef.current = undefined;
  }

  return {
    collapsed: closedFolders,
    renaming,
    focusRequest,
    focusDone,
    selectedId: pickedFolder ?? getFocusId(openNode) ?? null,
    deleteRequest,
    isDeleteOpen,
    select,
    toggle: toggleFolder,
    add: addNode,
    startRename,
    commitRename,
    cancelRename,
    requestDelete,
    confirmDelete,
    cancelDelete: () => setIsDeleteOpen(false),
    deleteExited,
  };
}
