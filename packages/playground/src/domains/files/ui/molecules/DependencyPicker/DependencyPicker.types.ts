import type { Sketch, SketchDependency } from "@/contract";
import type { FileDescription } from "@/domains/evaluation/helpers/engine";
import type { SourceResolver } from "@/domains/project/helpers/sketch";

/** Props of {@link DependencyPicker}. */
export type DependencyPickerProps = {
  /** Whether the dialog is open. A dialog that opens starts from `initial`, or from an empty draft */
  readonly open: boolean;
  /** Path of the file the dependency belongs to */
  readonly from: string;
  /** The tree of the sketch: the files the target is picked from, and what the draft is checked against */
  readonly tree: Sketch["tree"];
  /** The description of each file, by path, for the element types the options show */
  readonly descriptions: ReadonlyMap<string, FileDescription>;
  /** The resolvers of the config, which the source of the statement in the preview is written for */
  readonly resolvers: readonly SourceResolver[];
  /** The dependency being edited, or `undefined` to add one */
  readonly initial?: SketchDependency;
  /** Called when the user gives up: the cancel button, Escape, or a click outside the dialog */
  readonly onCancel: () => void;
  /** Called with the dependency of the draft when the user confirms it; only a draft that `getDependencyError` accepts */
  readonly onSubmit: (dependency: SketchDependency) => void;
};

/** An option of the list of files, as its page object reads it. */
export type FileOption = {
  /** The path of the file. */
  readonly path: string;
  /** What the option says of the element of the file, right-aligned. */
  readonly element: string;
};
