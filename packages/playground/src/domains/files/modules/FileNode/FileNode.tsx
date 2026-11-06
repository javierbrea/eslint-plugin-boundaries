import { memo, useCallback, useState } from "react";
import type { ReactNode } from "react";

import { DependencyPickerDialog } from "@/domains/files/modules/DependencyPickerDialog";
import { FilePane } from "@/domains/files/ui/organisms/FilePane";
import {
  useCapabilities,
  useOpen,
  useRemoveDependency,
} from "@/domains/session/data/store";

import type { FileNodeProps, PickerRequest } from "./FileNode.types";
import { useDependencyLines } from "./hooks/useDependencyLines";
import { useSelectedDependency } from "./hooks/useSelectedDependency";

/** The picker before the user opens it. */
const CLOSED: PickerRequest = { isOpen: false, index: undefined };

/**
 * The file in the node pane: its dependencies with the verdict of each one, and the picker that adds and edits them. It reads the lines of the file and the line in focus, so an evaluation that changes neither renders nothing of it. It keeps whether the picker is open and which dependency it edits, which belong to the page and not to the store.
 * @param props FileNode props.
 * @param props.path The path of the open file.
 * @param props.frameLabel The accessible name of the landmark of the pane.
 * @returns The file pane, and the picker while it is open.
 */
function FileNodeContent({
  path,
  frameLabel,
}: Readonly<FileNodeProps>): ReactNode {
  const lines = useDependencyLines(path);
  const selectedIndex = useSelectedDependency(path);
  const { editDependencies } = useCapabilities();
  const openTarget = useOpen();
  const removeDependency = useRemoveDependency();
  const [picker, setPicker] = useState(CLOSED);

  const select = useCallback(
    (index: number) => openTarget({ kind: "dependency", path, index }),
    [openTarget, path]
  );
  const remove = useCallback(
    (index: number) => removeDependency({ path, index }),
    [removeDependency, path]
  );
  const add = useCallback(
    () => setPicker({ isOpen: true, index: undefined }),
    []
  );
  const edit = useCallback(
    (index: number) => setPicker({ isOpen: true, index }),
    []
  );
  const closePicker = useCallback(
    () => setPicker((request) => ({ ...request, isOpen: false })),
    []
  );

  return (
    <>
      <FilePane
        path={path}
        frameLabel={frameLabel}
        lines={lines}
        selectedIndex={selectedIndex}
        editable={editDependencies}
        onSelect={select}
        onEdit={edit}
        onRemove={remove}
        onAdd={add}
      />
      <DependencyPickerDialog
        open={picker.isOpen}
        from={path}
        index={picker.index}
        onClose={closePicker}
      />
    </>
  );
}

/** The file node. It reads the store, so it renders again only when the lines of the file or the line in focus change. */
export const FileNode = memo(FileNodeContent);
