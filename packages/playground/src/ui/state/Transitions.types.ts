import type { WorkbenchState } from "./WorkbenchState.types";

/** The result of a rename: the state after it with the new path of the node, or why the name is refused. */
export type RenameTransition =
  | { readonly state: WorkbenchState; readonly path: string }
  | { readonly error: string };
