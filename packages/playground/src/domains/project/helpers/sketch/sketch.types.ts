import type {
  Sketch,
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

/** What text mode reads. */
export type TextReadOptions = {
  /** Whether the indented lines are read as dependencies. When it is `false` they are ignored, whatever they say: they are not read and never reported as problems, and the dependencies of the sketch given stay, as far as their files remain. A host that lets the user edit the tree but not the dependencies reads text mode so. It defaults to `true`. */
  readonly dependencies?: boolean;
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
