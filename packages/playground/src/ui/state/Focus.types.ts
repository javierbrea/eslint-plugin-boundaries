import type { TextRange } from "../../engine";

/** What is in focus: nothing, the config node or a file. Phase 6 adds a dependency of the open file. */
export type Focus =
  | { readonly kind: "none" }
  | { readonly kind: "config" }
  | { readonly kind: "file"; readonly path: string };

/** What a row, a button or a node opens: everything that opens something produces one, and the workbench opens it in one transition. Phase 6 adds a dependency of a file. */
export type Target =
  /** The config node, scrolled to a range of its text when there is one. */
  | { readonly kind: "config"; readonly range?: TextRange }
  /** A file of the sketch. */
  | { readonly kind: "file"; readonly path: string };
