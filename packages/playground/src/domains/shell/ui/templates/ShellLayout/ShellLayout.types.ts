import type { ReactNode } from "react";

/** Props of {@link ShellLayout}. */
export type ShellLayoutProps = {
  /** The top bar, in the first row. */
  readonly topBar: ReactNode;
  /** The regions, in the row that takes what the top bar leaves. */
  readonly regions: ReactNode;
  /** The test id of the root element. It is the one of the layout when it is unset, and a module that is the shell gives it its own. */
  readonly testId?: string;
};
