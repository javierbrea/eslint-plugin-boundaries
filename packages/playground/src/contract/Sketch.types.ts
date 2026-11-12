/** A file or a folder of the sketch */
export type SketchNode = {
  /** Path from the root of the sketch, such as `src/components/Price/index.ts` */
  readonly path: string;
  /** Whether the node is a file or a folder */
  readonly kind: "file" | "folder";
};

/** What a dependency points to: a node of the sketch, or a module outside it, such as `react` or `node:fs` */
export type SketchDependencyTarget =
  | { readonly kind: "node"; readonly path: string }
  | { readonly kind: "external"; readonly name: string };

/** A name imported or exported by a dependency */
export type SketchSpecifier = {
  /** `default` for `import x`, `named` for `import { x }`, `namespace` for `import * as x` */
  readonly kind: "default" | "named" | "namespace";
  /** Name in the target module */
  readonly name: string;
  /** Local name, when it differs from `name` */
  readonly alias?: string;
};

/** Syntax of the statement that creates a dependency: `import`, `export … from`, `require()` or `import()` */
export type SketchDependencySyntax =
  | "import"
  | "export-from"
  | "require"
  | "dynamic-import";

/** A dependency of a file of the sketch, as the plugin reads it from the code */
export type SketchDependency = {
  /** Path of the file that has the dependency */
  readonly from: string;
  /** What the dependency points to */
  readonly target: SketchDependencyTarget;
  /** Syntax of the statement */
  readonly syntax: SketchDependencySyntax;
  /** Whether the statement imports values or only types */
  readonly importKind: "value" | "type";
  /** Names imported or exported by the statement */
  readonly specifiers: readonly SketchSpecifier[];
};

/** A project as the playground shows it. The playground never changes one; an edit creates a new sketch */
export type Sketch = {
  /** The boundaries part of an ESLint config, `{ settings, rules }`, as JSON5 text */
  readonly config: string;
  /** Files and folders of the project */
  readonly tree: readonly SketchNode[];
  /** Dependencies of the files */
  readonly dependencies: readonly SketchDependency[];
};
