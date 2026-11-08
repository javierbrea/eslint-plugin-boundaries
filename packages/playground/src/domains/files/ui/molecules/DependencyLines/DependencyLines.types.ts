import type { DependencyLine } from "@/domains/files/ui/helpers/dependencyLines";

/** Props of {@link DependencyLines}. */
export type DependencyLinesProps = {
  /** The lines of the file, in the order of its code. */
  readonly lines: readonly DependencyLine[];
  /** The position of the line in focus, or `undefined` when no line of the file is. */
  readonly selectedIndex: number | undefined;
  /** Whether the dependencies can be edited and removed. The lines draw no actions when they cannot. */
  readonly editable: boolean;
  /** Called with the position of the line that the user chose, with a click or with Enter or Space. */
  readonly onSelect: (index: number) => void;
  /** Called with the position of the line whose edit action the user pressed. */
  readonly onEdit: (index: number) => void;
  /** Called with the position of the line whose delete action the user pressed. */
  readonly onRemove: (index: number) => void;
  /** Called when the line that was removed was the only one, so that the keyboard focus goes to what the pane has left. The lines move it between themselves otherwise. */
  readonly onEmptied?: () => void;
};
