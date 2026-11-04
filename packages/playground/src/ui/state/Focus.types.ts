/** What is in focus: nothing, the config node or a file. Phase 6 adds a dependency of the open file. */
export type Focus =
  | { readonly kind: "none" }
  | { readonly kind: "config" }
  | { readonly kind: "file"; readonly path: string };

/** Problems per node of the tree, for its badge. */
export type ProblemCounts = {
  /** Problems of the config. */
  readonly config: number;
  /** Whether the config node turns red. */
  readonly configHasErrors: boolean;
  /** Failing dependencies per file and folder; empty until phase 6. */
  readonly byPath: ReadonlyMap<string, number>;
};
