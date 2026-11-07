import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";

import type { SketchDependency } from "@/contract";
import { DependencyPicker } from "@/domains/files/ui/molecules/DependencyPicker";
import {
  getDependency,
  getFileDependencies,
} from "@/domains/project/helpers/sketch";
import {
  useAddDependency,
  useReplaceDependency,
  useSessionSelector,
  useTree,
} from "@/domains/session/data/store";

import { DEPENDENCY_PICKER_DIALOG_TEST_ID } from "./DependencyPickerDialog.constants";
import type { DependencyPickerDialogProps } from "./DependencyPickerDialog.types";

/**
 * The dialog that adds a dependency to a file or edits one, connected to the store: it reads the tree and the descriptions of the files for the options, the dependency being edited and the other dependencies of the file, whose names a draft must not repeat, and it adds or replaces the dependency the user confirms. It is its own element so that the file pane does not read the tree or the descriptions, which change with edits that leave the lines as they were.
 * @param props DependencyPickerDialog props.
 * @param props.open Whether the dialog is open.
 * @param props.from Path of the file the dependency belongs to.
 * @param props.index The position of the dependency being edited, or `undefined` to add one.
 * @param props.onClose Called when the dialog has to close.
 * @returns The dialog, which carries the test id of this element.
 */
export function DependencyPickerDialog({
  open: isOpen,
  from,
  index,
  onClose,
}: Readonly<DependencyPickerDialogProps>): ReactNode {
  const tree = useTree();
  const descriptions = useSessionSelector((state) => state.evaluation.files);
  const initial = useSessionSelector((state) =>
    index === undefined
      ? undefined
      : getDependency(state.sketch, { path: from, index })
  );
  const allDependencies = useSessionSelector(
    (state) => state.sketch.dependencies
  );
  // The dependency being edited is left out, so that it can keep its own names
  const dependencies = useMemo(
    () =>
      getFileDependencies({ dependencies: allDependencies }, from).filter(
        (_dependency, position) => position !== index
      ),
    [allDependencies, from, index]
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
      dependencies={dependencies}
      descriptions={descriptions}
      initial={initial}
      onCancel={onClose}
      onSubmit={submit}
      testId={DEPENDENCY_PICKER_DIALOG_TEST_ID}
    />
  );
}
