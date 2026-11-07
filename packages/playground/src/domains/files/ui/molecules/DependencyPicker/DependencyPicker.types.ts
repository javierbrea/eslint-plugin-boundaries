import type { Sketch, SketchDependency } from "@/contract";
import type { FileDescription } from "@/domains/evaluation/helpers/engine";

/** Props of {@link DependencyPicker}. */
export type DependencyPickerProps = {
  /** Whether the dialog is open. A dialog that opens starts from `initial`, or from an empty draft */
  readonly open: boolean;
  /** Path of the file the dependency belongs to */
  readonly from: string;
  /** The tree of the sketch: the files the target is picked from, and what the draft is checked against */
  readonly tree: Sketch["tree"];
  /** The other dependencies of the file, which the draft is checked against: the names it imports or exports must not be the ones of another statement. When a dependency is being edited, it is not among them, so that it can keep its own names */
  readonly dependencies: readonly SketchDependency[];
  /** The description of each file, by path, for the element types the options show */
  readonly descriptions: ReadonlyMap<string, FileDescription>;
  /** The dependency being edited, or `undefined` to add one */
  readonly initial?: SketchDependency;
  /** Called when the user gives up: the cancel button, Escape, or a click outside the dialog */
  readonly onCancel: () => void;
  /** Called with the dependency of the draft when the user confirms it, with the name that is being typed in the editor of the names if there is one; only a draft that `getDependencyError` accepts */
  readonly onSubmit: (dependency: SketchDependency) => void;
  /** The test id of the root element, for a component that is the dialog to give it its own. It defaults to the test id of the dialog */
  readonly testId?: string;
};

/** An option of the list of files, as its page object reads it. */
export type FileOption = {
  /** The path of the file. */
  readonly path: string;
  /** What the option says of the element of the file, right-aligned. */
  readonly element: string;
};
