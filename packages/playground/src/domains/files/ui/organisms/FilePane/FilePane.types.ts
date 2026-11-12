import type { DependencyLine } from "@/domains/files/ui/helpers/dependencyLines";

/** Props of the file pane. */
export type FilePaneProps = {
  /** Path of the open file, from the root of the sketch. */
  readonly path: string;
  /** The accessible name of the landmark of the pane. */
  readonly frameLabel: string;
  /** The dependencies of the file, in the order of its code. */
  readonly lines: readonly DependencyLine[];
  /** The position of the line in focus, or `undefined` when no line of the file is. */
  readonly selectedIndex: number | undefined;
  /** Whether the dependencies can be added, edited and removed. The pane draws no actions, no `+ Dependency` button and no hint when they cannot. */
  readonly editable: boolean;
  /** Called with the position of the line that the user chose. */
  readonly onSelect: (index: number) => void;
  /** Called with the position of the line whose edit action was pressed. */
  readonly onEdit: (index: number) => void;
  /** Called with the position of the line whose delete action was pressed. */
  readonly onRemove: (index: number) => void;
  /** Called when the user presses `+ Dependency`. */
  readonly onAdd: () => void;
  /** The test id of the root element, for a component that is the pane to give it its own. It defaults to the test id of the pane. */
  readonly testId?: string;
};
