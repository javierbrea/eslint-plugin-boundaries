import type {
  Sketch,
  SketchDependency,
  SketchDependencyTarget,
  SketchNode,
} from "@/contract";

import { getDependencyError } from "./dependencies";
import { normalizePath } from "./paths";
import { CONFIG_PATH } from "./sketch.constants";
import type {
  SourceResolver,
  TextProblem,
  TextReadOptions,
  TextResult,
} from "./sketch.types";
import {
  getSourceAmong,
  isRelativeSource,
  parseStatement,
  resolveAmong,
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

/**
 * Writes a sketch as text mode shows it: `eslint.config.js` first, then one line per file and per empty folder, in the order of the tree, with a `/` after the name of a folder. The dependencies of a file follow its line, in order, indented two spaces and written as import statements with the sources that {@link getSourceAmong} gives against the files of the tree, as the resolvers of the config find them back. The dependencies of something that is not a file of the tree are not written.
 * @param sketch The sketch to write: only its tree and dependencies count, so that a caller can keep the text while the config changes.
 * @param resolvers The resolvers of the `import/resolver` setting that the sources are written for, in the order they are tried, as `Evaluation.resolvers` has them.
 * @returns The text, which ends with a newline.
 */
export function toText(
  sketch: Pick<Sketch, "tree" | "dependencies">,
  resolvers: readonly SourceResolver[]
): string {
  const nodes = canonicalizeNodes(sketch.tree);
  const files = new Set(
    nodes.filter(({ kind }) => kind === "file").map(({ path }) => path)
  );
  const statements = new Map<string, string[]>();

  for (const dependency of sketch.dependencies) {
    const source = getSourceAmong(files, dependency, resolvers);
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
 * Names the resolvers that tried a source, so that the reason of a source that resolves to nothing says which ones: with the default `node` resolver, `./b` finds no `b.ts`.
 * @param resolvers The resolvers that the source was read with.
 * @returns `the "node" resolver finds`, or `the "typescript" and "node" resolvers find` for several, each name once.
 */
function describeResolvers(resolvers: readonly SourceResolver[]): string {
  const names = Array.from(
    new Set(resolvers.map((resolver) => `"${resolver.name}"`))
  );
  const last = names.at(-1);

  return names.length === 1
    ? `the ${last} resolver finds`
    : `the ${names.slice(0, -1).join(", ")} and ${last} resolvers find`;
}

/**
 * Reads an indented line as a dependency of a file.
 * @param text The line as it was written.
 * @param from The path of the file above the line.
 * @param nodes The nodes that the text declares.
 * @param files The paths of the files among them.
 * @param resolvers The resolvers that the source is read with.
 * @returns The dependency, or why the line cannot be read, as a sentence for the user.
 */
function readDependency(
  text: string,
  from: string,
  nodes: readonly SketchNode[],
  files: ReadonlySet<string>,
  resolvers: readonly SourceResolver[]
): SketchDependency | string {
  const parsed = parseStatement(text);

  if (parsed === undefined) {
    return UNREADABLE_REASON;
  }

  const { source, ...statement } = parsed;
  let target: SketchDependencyTarget;

  if (isRelativeSource(source)) {
    const path = resolveAmong(files, from, source, resolvers);

    if (path === undefined) {
      return `"${source}" does not resolve to a file of the sketch: ${describeResolvers(resolvers)} none.`;
    }
    target = { kind: "node", path };
  } else if (source.startsWith("/")) {
    return `"${source}" is an absolute path: write the source relative to the file, starting with ./ or ../.`;
  } else {
    target = { kind: "external", name: source };
  }

  const dependency = { from, target, ...statement };

  return getDependencyError({ tree: nodes }, dependency) ?? dependency;
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
 * @param nodes The nodes that the text declares.
 * @param files The paths of the files among them.
 * @param resolvers The resolvers that the source is read with.
 * @returns The dependency, or why the line cannot be read, as a sentence for the user.
 */
function readIndented(
  pending: PendingDependency,
  nodes: readonly SketchNode[],
  files: ReadonlySet<string>,
  resolvers: readonly SourceResolver[]
): SketchDependency | string {
  const { text, owner } = pending;

  if (owner === undefined) {
    return NO_FILE_REASON;
  }
  return owner.kind === "file"
    ? readDependency(text, owner.path, nodes, files, resolvers)
    : FOLDER_REASON;
}

/**
 * Reads the indented lines once every file of the text is known, so that a dependency can point to a file written below it.
 * @param pending The indented lines, in order.
 * @param nodes The nodes that the text declares.
 * @param resolvers The resolvers that the sources are read with.
 * @returns The dependencies that were read, in order, and the problems of the lines that were left out.
 */
function readPending(
  pending: readonly PendingDependency[],
  nodes: readonly SketchNode[],
  resolvers: readonly SourceResolver[]
): {
  readonly dependencies: readonly SketchDependency[];
  readonly problems: readonly TextProblem[];
} {
  const files = new Set(getFiles({ tree: nodes }));
  const dependencies: SketchDependency[] = [];
  const problems: TextProblem[] = [];

  for (const item of pending) {
    const result = readIndented(item, nodes, files, resolvers);

    if (typeof result === "string") {
      problems.push({ line: item.line, text: item.text, reason: result });
    } else {
      dependencies.push(result);
    }
  }
  return { dependencies, problems };
}

/**
 * Reads the lines of text mode. Blank lines and the `eslint.config.js` line are skipped. A line that is not indented is a path, cleaned up with {@link normalizePath}, that ends with `/` for a folder. An indented line is a dependency of the file line above it, or nothing when the dependencies are not read. A line that cannot be read is a problem and is left out: an invalid path, a duplicate, a path under a file, a file where a folder is, a dependency under a folder or under no file (the config line and a line that was left out own nothing), or a dependency that cannot be read as {@link readDependency} says.
 * @param text The text to read.
 * @param readDependencies Whether an indented line is read as a dependency. When it is not, it is skipped as a blank line is: it is neither read nor reported.
 * @param resolvers The resolvers that the sources of the dependencies are read with.
 * @returns The nodes of the valid lines, the dependencies of the valid lines in the order of the text, and the problems of the lines that were left out, in order.
 */
function readLines(
  text: string,
  readDependencies: boolean,
  resolvers: readonly SourceResolver[]
): {
  readonly nodes: readonly SketchNode[];
  readonly dependencies: readonly SketchDependency[];
  readonly problems: readonly TextProblem[];
} {
  const nodes: SketchNode[] = [];
  const problems: TextProblem[] = [];
  const pending: PendingDependency[] = [];
  // What the indented lines below belong to: the last line that is not indented, if it was read as a node
  let owner: SketchNode | undefined;

  for (const [index, line] of text.split(/\r?\n/).entries()) {
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

  const read = readPending(pending, nodes, resolvers);

  return {
    nodes,
    dependencies: read.dependencies,
    problems: [...problems, ...read.problems].sort(
      (first, second) => first.line - second.line
    ),
  };
}

/**
 * Tells which lines of text mode cannot be read, as {@link fromText} reports them. They depend on the text alone, so that a caller can keep them while the sketch changes.
 * @param text The text to read.
 * @param options What text mode reads: the lines of the dependencies are never reported when it does not read them.
 * @param options.dependencies Whether the indented lines are read as dependencies; `true` when it is not given.
 * @param options.resolvers The resolvers of the `import/resolver` setting that the sources are read with, in the order they are tried, as `Evaluation.resolvers` has them: a source that none of them resolves to a file of the text is a problem.
 * @returns The problems of the lines that would be left out, in order.
 */
export function readTextProblems(
  text: string,
  { dependencies = true, resolvers }: TextReadOptions
): readonly TextProblem[] {
  return readLines(text, dependencies, resolvers).problems;
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
 * @param options.resolvers The resolvers of the `import/resolver` setting that the sources are read with, in the order they are tried, as `Evaluation.resolvers` has them.
 * @returns The new sketch and the problems of the lines that were left out, in order.
 */
export function fromText(
  text: string,
  sketch: Sketch,
  { dependencies: readDependencies = true, resolvers }: TextReadOptions
): TextResult {
  const { nodes, dependencies, problems } = readLines(
    text,
    readDependencies,
    resolvers
  );
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
