import type { ReactNode } from "react";

/** Props of {@link PaneFrame}. */
export type PaneFrameProps = {
  /** The accessible name of the landmark. */
  label: string;
  /** The test id of the root element. The frame renders none when it is unset: the component that is the frame sets its own. */
  testId?: string;
  /** The head of the pane and its body. */
  children: ReactNode;
};
