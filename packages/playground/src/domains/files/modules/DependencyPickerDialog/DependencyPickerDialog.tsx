import { useCallback } from "react";
import type { ReactNode } from "react";

import type { SketchDependency } from "@/contract";
import { DependencyPicker } from "@/domains/files/ui/molecules/DependencyPicker";
import { getDependency } from "@/domains/project/helpers/sketch";
import {
  useAddDependency,
  useReplaceDependency,
  useSessionSelector,
  useTree,
} from "@/domains/session/data/store";

import type { DependencyPickerDialogProps } from "./DependencyPickerDialog.types";

/**
 * The dialog that adds a dependency to a file or edits one, connected to the store: it reads the tree and the descriptions of the files for the options, the resolvers of the config for the preview, and the dependency being edited, and it adds or replaces the dependency the user confirms. It is its own element so that the file pane does not read the tree or the descriptions, which change with edits that leave the lines as they were.
 * @param props DependencyPickerDialog props.
 * @param props.open Whether the dialog is open.
 * @param props.from Path of the file the dependency belongs to.
 * @param props.index The position of the dependency being edited, or `undefined` to add one.
 * @param props.onClose Called when the dialog has to close.
 * @returns The dialog.
 */
export function DependencyPickerDialog({
  open: isOpen,
  from,
  index,
  onClose,
}: Readonly<DependencyPickerDialogProps>): ReactNode {
  const tree = useTree();
  const descriptions = useSessionSelector((state) => state.evaluation.files);
  const resolvers = useSessionSelector((state) => state.evaluation.resolvers);
  const initial = useSessionSelector((state) =>
    index === undefined
      ? undefined
      : getDependency(state.sketch, { path: from, index })
  );
  const addDependency = useAddDependency();
  const replaceDependency = useReplaceDependency();

  const submit = useCallback(
    (dependency: SketchDependency) => {
      if (index === undefined) {
        addDependency(dependency);
      } else {
        replaceDependency({ path: from, index }, dependency);
      }
      onClose();
    },
    [index, from, addDependency, replaceDependency, onClose]
  );

  return (
    <DependencyPicker
      open={isOpen}
      from={from}
      tree={tree}
      descriptions={descriptions}
      resolvers={resolvers}
      initial={initial}
      onCancel={onClose}
      onSubmit={submit}
    />
  );
}
