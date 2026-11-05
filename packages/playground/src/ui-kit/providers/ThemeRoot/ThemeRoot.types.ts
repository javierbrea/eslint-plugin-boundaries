import type { ReactNode } from "react";

/** Props of {@link ThemeRoot}. */
export type ThemeRootProps = {
  /** Content of the playground. */
  children: ReactNode;
  /** The test id of the root element, for the component that is the playground to name it. The root has none by default. */
  testId?: string;
};
