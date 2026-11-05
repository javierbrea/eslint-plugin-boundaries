import type { ReactNode } from "react";

import type { ProjectView } from "@/domains/session/helpers/focus";

/** Props of {@link ProjectPaneLayout}. */
export type ProjectPaneLayoutProps = {
  /** How the project is shown. The head adds a hint while it is shown as text. */
  readonly view: ProjectView;
  /** The project as a tree or as text, which fills the space between the head and the foot. */
  readonly children: ReactNode;
  /** The foot of the pane, under the body. */
  readonly foot: ReactNode;
  /** The test id of the root element. It is the one of the layout when it is unset, and a module that is this pane gives it its own. */
  readonly testId?: string;
};
