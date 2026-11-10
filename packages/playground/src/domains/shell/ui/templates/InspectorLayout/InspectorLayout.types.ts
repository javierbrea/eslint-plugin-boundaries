import type { ReactNode } from "react";

/** Props of the inspector layout. */
export type InspectorLayoutProps = {
  /** What the inspector describes, which fills the scrolling content under the head. */
  readonly children: ReactNode;
  /** Whether what it describes is out of date, such as while a newer evaluation runs: the content fades. Unset, it does not. */
  readonly dimmed?: boolean;
  /** The test id of the root element. It is the one of the layout when it is unset, and a module that is this pane gives it its own. */
  readonly testId?: string;
};
