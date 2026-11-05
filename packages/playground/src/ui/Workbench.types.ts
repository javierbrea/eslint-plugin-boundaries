import type { ProjectCapabilities, Sketch } from "@/contract";

/** Props of {@link Workbench}. */
export type WorkbenchProps = {
  /** The sketch to start from. The workbench owns the sketch from then on: a later value is ignored, and a host that wants to show another one renders the workbench again. */
  readonly initialSketch: Sketch;
  /** What the user can change in the project. */
  readonly capabilities: ProjectCapabilities;
  /** Called with each new sketch after an edit, and never with the first one. The host keeps it. */
  readonly onSketchChange: (sketch: Sketch) => void;
};
