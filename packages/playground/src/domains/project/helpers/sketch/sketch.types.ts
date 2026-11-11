import type {
  Sketch,
  SketchDependency,
  SketchDependencySyntax,
  SketchNode,
  SketchSpecifier,
} from "@/contract";

/** A limit of the size of a sketch read from outside: how many files and folders it has, or how many dependencies */
export type SketchLimit = "nodes" | "dependencies";

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

/** What text mode reads. */
export type TextReadOptions = {
  /** Whether the indented lines are read as dependencies. When it is `false` they are ignored, whatever they say: they are not read and never reported as problems, and the dependencies of the sketch given stay, as far as their files remain. A host that lets the user edit the tree but not the dependencies reads text mode so. It defaults to `true`. */
  readonly dependencies?: boolean;
};

/** An indented line of text mode, as {@link fromText} reads it: the file it is under and, when the line was read as a dependency, which one */
export type TextDependencyLine = {
  /** Path of the file that the line is under */
  readonly path: string;
  /** Position of the dependency among the ones read for the file, from 0: with `path` it is the {@link DependencyRef} that the sketch of {@link fromText} gives the line. It is `undefined` when the line cannot be read, such as a statement that is not one or a source that does not resolve */
  readonly index: number | undefined;
};

/** The result of an edit: the new sketch, or why the edit is refused */
export type EditResult =
  | { readonly sketch: Sketch }
  | { readonly error: string };

/** The result of reading a value as a sketch: the sketch, in the order that text mode reads back, or why the value is not one */
export type SketchReadResult =
  | { readonly sketch: Sketch }
  | {
      /** Why the value is not a sketch, as a sentence for the user */
      readonly error: string;
      /** Present only when the value is refused for its size: the limit that it passes, more files and folders (`nodes`) or more dependencies (`dependencies`) than a sketch read from outside can have */
      readonly tooLarge?: SketchLimit;
    };

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

/** Tells what is at a path of a tree: the kind of node, or `undefined` when there is none. A path with a node under it is a folder, declared or not */
export type KindOf = (path: string) => SketchNode["kind"] | undefined;

/** A path of the index of a tree: what the first node added there declares, and the entries under it */
export type IndexEntry = {
  /** The kind of the first node added at the path, or `folder` when a node under it was added first. It tells what is at the path only when nothing is under it */
  readonly kind: SketchNode["kind"];
  /** The entries of the paths one segment longer, by segment */
  readonly children: Map<string, IndexEntry>;
};

/** The nodes of a tree indexed by path, so that checking a long list of nodes one after the other takes time in proportion to the size of the list, where scanning the nodes already checked for each one takes the square of it */
export type NodeIndex = {
  /** Tells what is at a path among the nodes added so far, as `getNodeKind` does for a list of nodes */
  readonly kindOf: KindOf;
  /** Tells why a node cannot be added after the nodes added so far, as `getAddError` does for a list of nodes. It adds nothing */
  readonly getAddError: (
    path: string,
    kind: SketchNode["kind"]
  ) => string | undefined;
  /** Adds a node. It does not check it: the first node added at a path is the one that declares it */
  readonly add: (node: SketchNode) => void;
};

/** The checks of a list of dependencies one after the other, each against the tree and the ones accepted before it */
export type DependencyChecker = {
  /** Tells why the sketch cannot hold the dependency after the ones accepted so far, as `getDependencyError` does, and when it can, accepts it: the next dependencies are checked against its names */
  readonly accept: (dependency: SketchDependency) => string | undefined;
};
