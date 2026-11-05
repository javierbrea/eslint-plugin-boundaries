import type { ReactNode } from "react";

/** Props of {@link ShellRegions}. */
export type ShellRegionsProps = {
  /** The project pane, on the left. */
  readonly project: ReactNode;
  /** The node in focus, in the middle. It takes the width the other two leave. */
  readonly node: ReactNode;
  /** The inspector, on the right. */
  readonly inspector: ReactNode;
  /** The problems panel, below the other three. Its head is all that shows while it is collapsed. */
  readonly problems: ReactNode;
  /** Whether the project is shown as text, which gives the project pane the room to read paths. */
  readonly isTextMode: boolean;
  /** Whether the problems panel is collapsed to its head. */
  readonly isProblemsCollapsed: boolean;
  /** Called when the panel collapses or expands without the shell asking, such as when the user drags its separator down. */
  readonly onProblemsCollapsedChange: (collapsed: boolean) => void;
  /** The test id of the root element. It is the one of the regions when it is unset, and a module that is these regions gives it its own. */
  readonly testId?: string;
};
