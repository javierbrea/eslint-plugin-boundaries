import type { TextRange } from "@/domains/evaluation/helpers/engine";

/** What is in focus: nothing, the config node or a file. Phase 6 adds a dependency of the open file. */
export type Focus =
  | { readonly kind: "none" }
  | { readonly kind: "config" }
  | { readonly kind: "file"; readonly path: string };

/** What a row, a button or a node opens: everything that opens something produces one, and the session opens it in one transition. Phase 6 adds a dependency of a file. */
export type Target =
  /** The config node, scrolled to a range of its text when there is one. */
  | { readonly kind: "config"; readonly range?: TextRange }
  /** A file of the sketch. */
  | { readonly kind: "file"; readonly path: string };

/** How the project pane shows the sketch: as a tree, or as one path per line. */
export type ProjectView = "tree" | "text";

/** A tab of the problems panel in M1: the sketch as a whole, or the node in focus. Phase 6 adds the dependency in focus. */
export type ProblemsTabId = "sketch" | "node";

/** A request to show a range of the config: the editor scrolls to it and puts the cursor at its start each time the key changes. */
export type ConfigReveal = {
  /** The range to show. */
  readonly range: TextRange;
  /** Changes for each request, so that the same range can be shown again after the user scrolled away. */
  readonly key: number;
};
