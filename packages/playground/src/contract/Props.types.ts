import type { ProjectSource } from "./ProjectSource.types";
import type { StateStore } from "./StateStore.types";

/** Props of the playground, the whole contract between it and its host */
export type PlaygroundProps = {
  /** Where the project comes from, and what the user can change in it */
  source: ProjectSource;
  /** Where the state is kept; a saved sketch takes precedence over the one of the source */
  store: StateStore;
  /** URL of the Quick start guide, which the help dialog links to; without it the dialog draws no link */
  quickStartUrl?: string;
};
