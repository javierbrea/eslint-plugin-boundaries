import type {
  Sketch,
  SketchDependency,
  SketchDependencyTarget,
  SketchNode,
} from "@/contract";

import { getDependencyError } from "./dependencies";
import { normalizePath } from "./paths";
import { CONFIG_PATH, TEXT_LINE_BREAK } from "./sketch.constants";
import type {
  DependencyRef,
  TextDependencyLine,
  TextProblem,
  TextReadOptions,
  TextResult,
} from "./sketch.types";
import {
  findSourceFiles,
  getDependencySource,
  isRelativeSource,
  parseStatement,
  toRelativePath,
  toStatement,
} from "./statements";
import { canonicalizeNodes, getAddError, getFiles } from "./tree";

/** Matches a line that starts with a space or a tab: a dependency of the file above it */
const INDENTED_LINE = /^[ \t]/;

const NO_FILE_REASON =
  "A dependency is indented under the file that has it, and there is no file above this line.";

const FOLDER_REASON = "A folder has no dependencies: indent them under a file.";

const UNREADABLE_REASON =
  'Text mode reads the statements import, export … from, require("…") and import("…"), such as import { a } from "./a";';

/** An indented line, which is read once all the files of the text are known */
type PendingDependency = {
  /** Number of the line, from 1 */
  readonly line: number;
  /** The line as it was written */
  readonly text: string;
  /** The node of the last line above that is not indented, if it was read as a node */
  readonly owner: SketchNode | undefined;
};

/** An indented line under a file, once it was read */
type IndentedLine = TextDependencyLine & {
  /** Number of the line, from 1 */
  readonly line: number;
};

/**
 * Writes a sketch as text mode shows it: `eslint.config.js` first, then one line per file and per empty folder, in the order of the tree, with a `/` after the name of a folder. The dependencies of a file follow its line, in order, indented two spaces and written as import statements with the sources that {@link getDependencySource} gives, in full. The dependencies of something that is not a file of the tree are not written.
 * @param sketch The sketch to write: only its tree and dependencies count, so that a caller can keep the text while the config changes.
 * @returns The text, which ends with a newline.
 */
export function toText(sketch: Pick<Sketch, "tree" | "dependencies">): string {
  const nodes = canonicalizeNodes(sketch.tree);
  const statements = new Map<string, string[]>();

  for (const dependency of sketch.dependencies) {
    const source = getDependencySource(dependency);
    const written = statements.get(dependency.from) ?? [];

    written.push(`  ${toStatement(dependency, source)}`);
    statements.set(dependency.from, written);
  }

  const lines = nodes.flatMap(({ path, kind }) =>
    kind === "folder" ? [`${path}/`] : [path, ...(statements.get(path) ?? [])]
  );

  return `${[CONFIG_PATH, ...lines].join("\n")}\n`;
}

/**
 * Tells why a source that matches several files is not read: it never picks one silently.
 * @param source The source, without quotes.
 * @param from The path of the file that has the source.
 * @param candidates The paths of the files it can be, at least two, in the order of {@link findSourceFiles}.
 * @returns A sentence for the user that lists the full source of each candidate, as the statement of the file would write it, such as `"./b" can be "./b.js", "./b.ts" or "./b/index.js". Write the one you mean, with its extension.`
 */
function getAmbiguityReason(
  source: string,
  from: string,
  candidates: readonly string[]
): string {
  const sources = candidates.map((path) => `"${toRelativePath(from, path)}"`);
  const last = sources[sources.length - 1];

  return `"${source}" can be ${sources.slice(0, -1).join(", ")} or ${last}. Write the one you mean, with its extension.`;
}

/**
 * Reads an indented line as a dependency of a file. A relative source is read with the rule of {@link findSourceFiles}: it must match exactly one file.
 * @param text The line as it was written.
 * @param from The path of the file above the line.
 * @param read What the text declares so far: its nodes, and the dependencies of the lines read before this one, which a name of this line must not repeat.
 * @param files The paths of the files among the nodes.
 * @returns The dependency, or why the line cannot be read, as a sentence for the user.
 */
function readDependency(
  text: string,
  from: string,
  read: Pick<Sketch, "tree" | "dependencies">,
  files: ReadonlySet<string>
): SketchDependency | string {
  const parsed = parseStatement(text);

  if (parsed === undefined) {
    return UNREADABLE_REASON;
  }

  const { source, ...statement } = parsed;
  let target: SketchDependencyTarget;

  if (isRelativeSource(source)) {
    const candidates = findSourceFiles(files, from, source);

    if (candidates.length === 0) {
      return `"${source}" does not resolve to a file of the sketch.`;
    }
    if (candidates.length > 1) {
      return getAmbiguityReason(source, from, candidates);
    }
    target = { kind: "node", path: candidates[0] };
  } else if (source.startsWith("/")) {
    return `"${source}" is an absolute path: write the source relative to the file, starting with ./ or ../.`;
  } else {
    target = { kind: "external", name: source };
  }

  const dependency = { from, target, ...statement };

  return getDependencyError(read, dependency) ?? dependency;
}

/**
 * Reads a line that is not indented as a node.
 * @param line The line as it was written.
 * @param nodes The nodes of the lines read before.
 * @returns The node, `undefined` for the config line, which is skipped, or why the line cannot be a node, as a sentence for the user.
 */
function readNodeLine(
  line: string,
  nodes: readonly SketchNode[]
): SketchNode | string | undefined {
  const { path, isFolder } = normalizePath(line);

  if (path === CONFIG_PATH && !isFolder) {
    return undefined;
  }

  const kind = isFolder ? "folder" : "file";

  return getAddError(nodes, path, kind) ?? { path, kind };
}

/**
 * Reads an indented line as a dependency of the node above it.
 * @param pending The indented line.
 * @param read What the text declares so far: its nodes, and the dependencies of the lines read before this one.
 * @param files The paths of the files among the nodes.
 * @returns The dependency, or why the line cannot be read, as a sentence for the user.
 */
function readIndented(
  pending: PendingDependency,
  read: Pick<Sketch, "tree" | "dependencies">,
  files: ReadonlySet<string>
): SketchDependency | string {
  const { text, owner } = pending;

  if (owner === undefined) {
    return NO_FILE_REASON;
  }
  return owner.kind === "file"
    ? readDependency(text, owner.path, read, files)
    : FOLDER_REASON;
}

/**
 * Reads the indented lines once every file of the text is known, so that a dependency can point to a file written below it. Each line is checked against the dependencies of the lines read before it, so that the later line of a name that two statements of a file repeat is the one reported.
 * @param pending The indented lines, in order.
 * @param nodes The nodes that the text declares.
 * @returns The dependencies that were read, in order, the problems of the lines that were left out, and what each line under a file was read as, in order.
 */
function readPending(
  pending: readonly PendingDependency[],
  nodes: readonly SketchNode[]
): {
  readonly dependencies: readonly SketchDependency[];
  readonly problems: readonly TextProblem[];
  readonly lines: readonly IndentedLine[];
} {
  const files = new Set(getFiles({ tree: nodes }));
  const dependencies: SketchDependency[] = [];
  const problems: TextProblem[] = [];
  const lines: IndentedLine[] = [];
  const counts = new Map<string, number>();

  for (const item of pending) {
    const result = readIndented(item, { tree: nodes, dependencies }, files);

    if (typeof result === "string") {
      problems.push({ line: item.line, text: item.text, reason: result });
      if (item.owner?.kind === "file") {
        lines.push({
          line: item.line,
          path: item.owner.path,
          index: undefined,
        });
      }
    } else {
      // The position among the dependencies of its file, as `Sketch.dependencies` lists them
      const index = counts.get(result.from) ?? 0;

      counts.set(result.from, index + 1);
      dependencies.push(result);
      lines.push({ line: item.line, path: result.from, index });
    }
  }
  return { dependencies, problems, lines };
}

/**
 * Reads the lines of text mode. Blank lines and the `eslint.config.js` line are skipped. A line that is not indented is a path, cleaned up with {@link normalizePath}, that ends with `/` for a folder. An indented line is a dependency of the file line above it, or nothing when the dependencies are not read. A line that cannot be read is a problem and is left out: an invalid path, a duplicate, a path under a file, a file where a folder is, a dependency under a folder or under no file (the config line and a line that was left out own nothing), or a dependency that cannot be read as {@link readDependency} says.
 * @param text The text to read.
 * @param readDependencies Whether an indented line is read as a dependency. When it is not, it is skipped as a blank line is: it is neither read nor reported.
 * @returns The nodes of the valid lines, the dependencies of the valid lines in the order of the text, the problems of the lines that were left out, in order, and what each indented line under a file was read as, in order.
 */
function readLines(
  text: string,
  readDependencies: boolean
): {
  readonly nodes: readonly SketchNode[];
  readonly dependencies: readonly SketchDependency[];
  readonly problems: readonly TextProblem[];
  readonly indented: readonly IndentedLine[];
} {
  const nodes: SketchNode[] = [];
  const problems: TextProblem[] = [];
  const pending: PendingDependency[] = [];
  // What the indented lines below belong to: the last line that is not indented, if it was read as a node
  let owner: SketchNode | undefined;

  for (const [index, line] of text.split(TEXT_LINE_BREAK).entries()) {
    if (line.trim() === "") {
      continue;
    }

    const lineNumber = index + 1;

    if (INDENTED_LINE.test(line)) {
      if (readDependencies) {
        pending.push({ line: lineNumber, text: line, owner });
      }
      continue;
    }

    const result = readNodeLine(line, nodes);

    owner = typeof result === "object" ? result : undefined;
    if (typeof result === "string") {
      problems.push({ line: lineNumber, text: line, reason: result });
    } else if (result !== undefined) {
      nodes.push(result);
    }
  }

  const read = readPending(pending, nodes);

  return {
    nodes,
    dependencies: read.dependencies,
    problems: [...problems, ...read.problems].sort(
      (first, second) => first.line - second.line
    ),
    indented: read.lines,
  };
}

/**
 * Tells which lines of text mode cannot be read, as {@link fromText} reports them. They depend on the text alone, so that a caller can keep them while the sketch changes.
 * @param text The text to read.
 * @param options What text mode reads: the lines of the dependencies are never reported when it does not read them.
 * @param options.dependencies Whether the indented lines are read as dependencies; `true` when it is not given.
 * @returns The problems of the lines that would be left out, in order.
 */
export function readTextProblems(
  text: string,
  { dependencies = true }: TextReadOptions = {}
): readonly TextProblem[] {
  return readLines(text, dependencies).problems;
}

/**
 * Tells what an indented line of text mode is, as {@link fromText} reads the text with the dependencies. A blank line, a line that is not indented, and an indented line under a folder, under the config line or under a line that was left out are none.
 * @param text The text to read.
 * @param line Number of the line, from 1.
 * @returns The file the line is under and the position of the dependency it was read as, or `undefined` as the position when it cannot be read; `undefined` when the line is not an indented line under a file, or is not in the text.
 */
export function getDependencyAtLine(
  text: string,
  line: number
): TextDependencyLine | undefined {
  const found = readLines(text, true).indented.find(
    (candidate) => candidate.line === line
  );

  return found === undefined
    ? undefined
    : { path: found.path, index: found.index };
}

/**
 * Finds where a dependency is written in the text, as {@link fromText} reads the text with the dependencies: the line that was read as the dependency at that position of that file.
 * @param text The text to read.
 * @param ref The file and the position of the dependency among the ones read for the file.
 * @returns Number of the line, from 1, or `undefined` when the text has no such dependency.
 */
export function getDependencyLine(
  text: string,
  ref: DependencyRef
): number | undefined {
  return readLines(text, true).indented.find(
    ({ path, index }) => path === ref.path && index === ref.index
  )?.line;
}

/**
 * Keeps the dependencies of a sketch whose file and whose node target are still files of a tree, in their order.
 * @param previous The dependencies to keep.
 * @param tree The tree that the dependencies must still fit.
 * @returns The dependencies that fit the tree: the ones from a file of it, to a file of it or to an external module.
 */
function keepDependencies(
  previous: readonly SketchDependency[],
  tree: readonly SketchNode[]
): readonly SketchDependency[] {
  const files = new Set(getFiles({ tree }));

  return previous.filter(
    ({ from, target }) =>
      files.has(from) && (target.kind === "external" || files.has(target.path))
  );
}

/**
 * Reads text mode into a sketch, line by line as {@link readTextProblems} says. The tree of the new sketch is made of the valid lines, its dependencies are the ones that the text declares, in the order of the text, and the config is the one of the sketch given. When the dependencies are not read, its dependencies are the ones of the sketch given that still fit the new tree, in their order, and the dependency lines of the text decide nothing.
 * @param text The text to read.
 * @param sketch The sketch that the text edits. It is not changed.
 * @param options What text mode reads: the dependencies of the text, unless it says otherwise.
 * @param options.dependencies Whether the indented lines are read as dependencies; `true` when it is not given.
 * @returns The new sketch and the problems of the lines that were left out, in order.
 */
export function fromText(
  text: string,
  sketch: Sketch,
  { dependencies: readDependencies = true }: TextReadOptions = {}
): TextResult {
  const { nodes, dependencies, problems } = readLines(text, readDependencies);
  const tree = canonicalizeNodes(nodes);

  return {
    sketch: {
      ...sketch,
      tree,
      dependencies: readDependencies
        ? dependencies
        : keepDependencies(sketch.dependencies, tree),
    },
    problems,
  };
}
