import type { ProjectCapabilities, Sketch } from "@/contract";
import type { ShellTopBarProps } from "@/domains/shell/modules/ShellTopBar";

/** Props of {@link Shell}. The callbacks of the top bar, which are the ones that ask the host to replace the sketch or to share it, are the ones of {@link ShellTopBarProps}. */
export type ShellProps = ShellTopBarProps & {
  /** The sketch to start from. The shell owns the sketch from then on: a later value is ignored, and a host that wants to show another one renders the shell again. */
  readonly initialSketch: Sketch;
  /** What the user can change in the project. */
  readonly capabilities: ProjectCapabilities;
  /** Called with each new sketch after an edit, and never with the first one. The host keeps it. */
  readonly onSketchChange: (sketch: Sketch) => void;
};
