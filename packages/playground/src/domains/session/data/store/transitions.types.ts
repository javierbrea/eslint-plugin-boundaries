import type { SessionState } from "./sessionState.types";

/** The result of a rename: the state after it with the new path of the node, or why the name is refused. */
export type RenameTransition =
  | { readonly state: SessionState; readonly path: string }
  | { readonly error: string };
