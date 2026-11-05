import type { Sketch, SketchNode } from "@/contract";

import { normalizePath } from "./paths";
import { CONFIG_PATH } from "./sketch.constants";
import type { TextProblem, TextResult } from "./sketch.types";
import { canonicalizeNodes, getAddError, getNodeKind } from "./tree";

/** Matches a line that starts with a space or a tab: a dependency of the file above it, which text mode does not read yet */
const INDENTED_LINE = /^[ \t]/;

/**
 * Writes a sketch as text mode shows it: `eslint.config.js` first, then one line per file and per empty folder, in the order of the tree, with a `/` after the name of a folder. A line is never indented in M1: dependencies are not written.
 * @param sketch The sketch to write: only its tree counts, so that a caller can keep the text while the config changes.
 * @returns The text, which ends with a newline.
 */
export function toText(sketch: Pick<Sketch, "tree">): string {
  const lines = canonicalizeNodes(sketch.tree).map((node) =>
    node.kind === "folder" ? `${node.path}/` : node.path
  );

  return `${[CONFIG_PATH, ...lines].join("\n")}\n`;
}

/**
 * Reads the lines of text mode. Blank lines and the `eslint.config.js` line are skipped. Every other line is a path, cleaned up with {@link normalizePath}, that ends with `/` for a folder. A line that cannot be read is a problem and is left out: an indented line, an invalid path, a duplicate, a path under a file or a file where a folder is.
 * @param text The text to read.
 * @returns The nodes of the valid lines, and the problems of the lines that were left out, in order.
 */
function readLines(text: string): {
  readonly nodes: readonly SketchNode[];
  readonly problems: readonly TextProblem[];
} {
  const nodes: SketchNode[] = [];
  const problems: TextProblem[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === "") {
      return;
    }

    const reject = (reason: string): void => {
      problems.push({ line: index + 1, text: line, reason });
    };

    if (INDENTED_LINE.test(line)) {
      reject("Dependencies are not written in text mode yet.");
      return;
    }

    const { path, isFolder } = normalizePath(line);

    if (path === CONFIG_PATH && !isFolder) {
      return;
    }

    const kind = isFolder ? "folder" : "file";
    const error = getAddError(nodes, path, kind);

    if (error === undefined) {
      nodes.push({ path, kind });
    } else {
      reject(error);
    }
  });

  return { nodes, problems };
}

/**
 * Tells which lines of text mode cannot be read, as {@link fromText} reports them. They depend on the text alone, so that a caller can keep them while the sketch changes.
 * @param text The text to read.
 * @returns The problems of the lines that would be left out, in order.
 */
export function readTextProblems(text: string): readonly TextProblem[] {
  return readLines(text).problems;
}

/**
 * Reads text mode into a sketch, line by line as {@link readTextProblems} says. The tree of the new sketch is made of the valid lines, and the config is the one of the sketch given. The dependencies of the sketch given are kept when their file and their node target are still in the tree.
 * @param text The text to read.
 * @param sketch The sketch that the text edits. It is not changed.
 * @returns The new sketch and the problems of the lines that were left out, in order.
 */
export function fromText(text: string, sketch: Sketch): TextResult {
  const { nodes, problems } = readLines(text);
  const tree = canonicalizeNodes(nodes);

  return {
    sketch: {
      ...sketch,
      tree,
      dependencies: sketch.dependencies.filter(
        ({ from, target }) =>
          getNodeKind(tree, from) === "file" &&
          (target.kind === "external" ||
            getNodeKind(tree, target.path) !== undefined)
      ),
    },
    problems,
  };
}
