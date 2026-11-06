import type {
  Sketch,
  SketchDependency,
  SketchDependencySyntax,
  SketchSpecifier,
} from "@/contract";

/** A node of the tree as the project pane shows it: folders are implied by the paths of their files */
export type TreeItem = {
  /** Path from the root of the sketch. It is the id of the item */
  readonly path: string;
  /** Last segment of the path */
  readonly name: string;
  /** Whether the item is a file or a folder */
  readonly kind: "file" | "folder";
  /** Items inside a folder: folders first, then files, each by name. Empty for a file and for an empty folder */
  readonly children: readonly TreeItem[];
};

/** A line of text mode that could not be read */
export type TextProblem = {
  /** Number of the line, from 1 */
  readonly line: number;
  /** The line as it was written */
  readonly text: string;
  /** Why the line was left out, as a sentence for the user */
  readonly reason: string;
};

/** The resolvers of `import/resolver` that the playground runs: the ones of the packages `eslint-import-resolver-node` and `eslint-import-resolver-typescript` */
export type SourceResolverName = "node" | "typescript";

/** A resolver of the `import/resolver` setting that the playground runs, to write the source of a dependency the way the resolver finds the file back, and to read it */
export type SourceResolver = {
  /** Which resolver it is */
  readonly name: SourceResolverName;
  /** The extensions it adds to a source, and to the `index` of a folder, in the order it tries them: its `extensions` option, or its default list */
  readonly extensions: readonly string[];
};

/** What text mode reads. */
export type TextReadOptions = {
  /** Whether the indented lines are read as dependencies. When it is `false` they are ignored, whatever they say: they are not read and never reported as problems, and the dependencies of the sketch given stay, as far as their files remain. A host that lets the user edit the tree but not the dependencies reads text mode so. It defaults to `true`. */
  readonly dependencies?: boolean;
  /** The resolvers that the sources of the dependencies are read with, in the order they are tried. They come from the config, as `Evaluation.resolvers` has them */
  readonly resolvers: readonly SourceResolver[];
};

/** The result of an edit: the new sketch, or why the edit is refused */
export type EditResult =
  | { readonly sketch: Sketch }
  | { readonly error: string };

/** The result of renaming a node with the name typed for it: the new sketch and the path the node has in it, or why the rename is refused */
export type RenameResult =
  | { readonly sketch: Sketch; readonly path: string }
  | { readonly error: string };

/** A path as a user wrote it, cleaned up */
export type NormalizedPath = {
  /** Path without the leading `./` or `/` and without the trailing `/` */
  readonly path: string;
  /** Whether the input ended with `/`, which marks a folder */
  readonly isFolder: boolean;
};

/** The result of reading text mode: the sketch made of its valid lines, and the lines that could not be read */
export type TextResult = {
  /** The sketch with the tree and the dependencies of the valid lines. The config is the one of the sketch given */
  readonly sketch: Sketch;
  /** The lines that were left out, in order */
  readonly problems: readonly TextProblem[];
};

/** Identifies a dependency: its file and its position among the dependencies of that file, in the order of `Sketch.dependencies`. Its line is `index + 1` */
export type DependencyRef = {
  /** Path of the file that has the dependency */
  readonly path: string;
  /** Position among the dependencies of the file, from 0 */
  readonly index: number;
};

/** A piece of a statement, so that the ui colors it: a keyword (`import`, `type`, `from`, `export`, `require`, `as`), the source with its quotes, or anything else (names, punctuation, spaces) */
export type StatementToken = {
  /** What the piece is */
  readonly kind: "keyword" | "source" | "text";
  /** The piece as written. All the pieces of a statement joined are the statement */
  readonly text: string;
};

/** A statement read from text: what it says, before its source is resolved to a target */
export type ParsedStatement = {
  /** Syntax of the statement */
  readonly syntax: SketchDependencySyntax;
  /** Whether the statement imports values or only types */
  readonly importKind: "value" | "type";
  /** Names imported or exported by the statement, in the order they are written */
  readonly specifiers: readonly SketchSpecifier[];
  /** The source as written, without its quotes */
  readonly source: string;
};

/** The kind of a name of a statement: `default`, `named` or `namespace` */
export type SpecifierKind = SketchSpecifier["kind"];

/** Whether a statement imports values or only types */
export type ImportKind = SketchDependency["importKind"];

/** What a syntax holds: the one table that the checks of a dependency and the picker read, so that the picker never offers what the sketch refuses */
export type SyntaxFacts = {
  /** How the syntax is called, as the statement writes it: `import`, `export … from`, `require()` or `import()` */
  readonly name: string;
  /** The kinds of statement it holds, in the order the picker shows them. A syntax that holds one kind has nothing to choose, and the picker hides the row of the kinds */
  readonly importKinds: readonly ImportKind[];
  /** The kinds of name it holds, in the order the picker offers them. Empty when it holds no names at all, as `require()` and `import()` do, and the picker hides the row of the names */
  readonly specifierKinds: readonly SpecifierKind[];
};
