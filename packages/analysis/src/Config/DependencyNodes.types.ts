import type { DependencyNodeSelector } from "@boundaries/config";

/** Whether a statement imports values or only types, which the built-in selectors of each syntax tell apart */
export type ReadImportKind = "value" | "type";

/** The built-in selectors of one syntax and one import kind, in the order of `DEFAULT_DEPENDENCY_NODES` */
export type BuiltInSelectorGroup = {
  /** The key of the built-in nodes of the syntax in `DEFAULT_DEPENDENCY_NODES`, such as `require` */
  readonly syntax: string;
  /** The import kind of the statements that the selectors read */
  readonly importKind: ReadImportKind;
  /** The selectors of the built-in nodes of the syntax that have that `kind` */
  readonly selectors: readonly string[];
};

/** The dependency node that the analysis reads the statements of a syntax and an import kind through */
export type ReadNode = {
  /** The `name` of the node, which the plugin passes as the `nodeKind` of the description, or `undefined` when the node has none */
  readonly name: DependencyNodeSelector["name"];
  /** The `kind` of the node, which the plugin passes as the `kind` of the description. `@boundaries/config` keeps an additional node with no `kind`, so it can be `undefined` or empty, and the plugin then passes `value` */
  readonly kind: DependencyNodeSelector["kind"] | undefined;
};

/** For each syntax, by the key of its built-in nodes in `DEFAULT_DEPENDENCY_NODES` such as `require`, and each import kind, the node that reads its statements. A syntax that no node reads is left out, and so is an import kind of a syntax that no node reads */
export type ReadNodes = ReadonlyMap<
  string,
  ReadonlyMap<ReadImportKind, ReadNode>
>;
