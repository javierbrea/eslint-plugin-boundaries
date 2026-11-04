import type { Sketch } from "../contract";

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
  /** The sketch with the tree of the valid lines. The config is the one of the sketch given */
  readonly sketch: Sketch;
  /** The lines that were left out, in order */
  readonly problems: readonly TextProblem[];
};
