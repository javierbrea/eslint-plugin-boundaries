import type {
  Sketch,
  SketchDependency,
  SketchDependencySyntax,
  SketchDependencyTarget,
  SketchNode,
  SketchSpecifier,
} from "@/contract";

import { createDependencyChecker, sortSpecifiers } from "./dependencies";
import {
  MAX_SKETCH_DEPENDENCIES,
  MAX_SKETCH_NODES,
  SYNTAX_FACTS,
} from "./sketch.constants";
import type { NodeIndex, SketchReadResult } from "./sketch.types";
import { canonicalizeNodes, createNodeIndex } from "./tree";

/** An object whose keys are not known yet */
type Fields = { readonly [key: string]: unknown };

const NODE_KINDS = ["file", "folder"] as const;

const TARGET_KINDS = ["node", "external"] as const;

const SYNTAXES = Object.keys(SYNTAX_FACTS) as SketchDependencySyntax[];

const IMPORT_KINDS = ["value", "type"] as const;

const SPECIFIER_KINDS = ["default", "named", "namespace"] as const;

/** The most characters of a path that a reason quotes: a path that is refused for its length can be much longer, and a reason is a sentence to read */
const MAX_QUOTED_PATH_LENGTH = 80;

const NOT_A_SKETCH =
  'The data is not a project: it must be an object with "config", "tree" and "dependencies".';

const TOO_MANY_NODES = `The project has more than ${MAX_SKETCH_NODES} files and folders.`;

const TOO_MANY_DEPENDENCIES = `The project has more than ${MAX_SKETCH_DEPENDENCIES} dependencies.`;

/**
 * Writes a path between quotes, as a reason names it. A long path is cut and ends with `…`.
 * @param path The path.
 */
function quotePath(path: string): string {
  return path.length > MAX_QUOTED_PATH_LENGTH
    ? `"${path.slice(0, MAX_QUOTED_PATH_LENGTH)}…"`
    : `"${path}"`;
}

/**
 * Tells whether a value is an object that is not an array.
 * @param value The value to check.
 */
function isFields(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Tells whether a value is one of the choices.
 * @param value The value to check.
 * @param choices The values it can be.
 */
function isOneOf<Choice extends string>(
  value: unknown,
  choices: readonly Choice[]
): value is Choice {
  return choices.some((choice) => choice === value);
}

/**
 * Lists choices as a sentence would: `"a", "b" or "c"`.
 * @param choices At least two choices.
 */
function listChoices(choices: readonly string[]): string {
  const quoted = choices.map((choice) => `"${choice}"`);

  return `${quoted.slice(0, -1).join(", ")} or ${quoted[quoted.length - 1]}`;
}

/**
 * Tells why a value is not an object of exactly the keys given: an unknown key is refused, so that nothing unexpected enters the sketch. A missing key is reported by the check of its value.
 * @param fields The object.
 * @param allowed The keys it can have.
 * @param where What the object is, such as `Dependency 2`.
 * @returns The reason as a sentence for the user, or `undefined` when every key is allowed.
 */
function getUnknownKeyError(
  fields: Fields,
  allowed: readonly string[],
  where: string
): string | undefined {
  const unknownKey = Object.keys(fields).find((key) => !allowed.includes(key));

  return unknownKey === undefined
    ? undefined
    : `${where} has the unknown key "${unknownKey}".`;
}

/**
 * Says what a field must be.
 * @param where What holds the field, such as `Dependency 2`.
 * @param key The name of the field.
 * @param expected What the field must be, such as `text`.
 */
function getFieldError(where: string, key: string, expected: string): string {
  return `${where} needs "${key}" to be ${expected}.`;
}

/**
 * Reads the items of a list with one reader, stopping at the first that cannot be read.
 * @param items The items of the list.
 * @param readItem Reads an item, given its number in the list from 1: the item, or why it cannot be read.
 * @returns The items that were read, or the reason for the first that cannot be read.
 */
function readList<Item extends object>(
  items: readonly unknown[],
  readItem: (item: unknown, number: number) => Item | string
): readonly Item[] | string {
  const read: Item[] = [];

  for (const [index, item] of items.entries()) {
    const result = readItem(item, index + 1);

    if (typeof result === "string") {
      return result;
    }
    read.push(result);
  }
  return read;
}

/**
 * Reads a node of the tree. Its path is checked later, with the rest of the tree.
 * @param value The value to read.
 * @param number The position of the node in the tree, from 1.
 * @returns The node, or why the value is not one.
 */
function readNode(value: unknown, number: number): SketchNode | string {
  const where = `Node ${number} of the tree`;

  if (!isFields(value)) {
    return `${where} must be an object.`;
  }

  const { path, kind } = value;

  if (typeof path !== "string") {
    return getFieldError(where, "path", "text");
  }
  if (!isOneOf(kind, NODE_KINDS)) {
    return getFieldError(where, "kind", listChoices(NODE_KINDS));
  }
  return getUnknownKeyError(value, ["path", "kind"], where) ?? { path, kind };
}

/**
 * Reads what a dependency points to.
 * @param value The value to read.
 * @param where What holds the target, such as `Dependency 2`.
 * @returns The target, or why the value is not one.
 */
function readTarget(
  value: unknown,
  where: string
): SketchDependencyTarget | string {
  const targetWhere = `The target of ${where.toLowerCase()}`;

  if (!isFields(value)) {
    return `${targetWhere} must be an object.`;
  }

  const { kind } = value;

  if (!isOneOf(kind, TARGET_KINDS)) {
    return getFieldError(targetWhere, "kind", listChoices(TARGET_KINDS));
  }

  const key = kind === "node" ? "path" : "name";
  const named = value[key];

  if (typeof named !== "string") {
    return getFieldError(targetWhere, key, "text");
  }
  return (
    getUnknownKeyError(value, ["kind", key], targetWhere) ??
    (kind === "node" ? { kind, path: named } : { kind, name: named })
  );
}

/**
 * Reads a name of a statement. The alias is optional.
 * @param value The value to read.
 * @param number The position of the name among the ones of its dependency, from 1.
 * @param where What holds the name, such as `Dependency 2`.
 * @returns The specifier, or why the value is not one.
 */
function readSpecifier(
  value: unknown,
  number: number,
  where: string
): SketchSpecifier | string {
  const specifierWhere = `Name ${number} of ${where.toLowerCase()}`;

  if (!isFields(value)) {
    return `${specifierWhere} must be an object.`;
  }

  const { kind, alias } = value;
  const specifierName = value.name;

  if (!isOneOf(kind, SPECIFIER_KINDS)) {
    return getFieldError(specifierWhere, "kind", listChoices(SPECIFIER_KINDS));
  }
  if (typeof specifierName !== "string") {
    return getFieldError(specifierWhere, "name", "text");
  }
  if (Object.hasOwn(value, "alias") && typeof alias !== "string") {
    return getFieldError(specifierWhere, "alias", "text");
  }
  return (
    getUnknownKeyError(value, ["kind", "name", "alias"], specifierWhere) ??
    (typeof alias === "string"
      ? { kind, name: specifierName, alias }
      : { kind, name: specifierName })
  );
}

/**
 * Reads a dependency of the sketch. Its checks come later, with the rest of the sketch.
 * @param value The value to read.
 * @param number The position of the dependency in the list, from 1.
 * @returns The dependency, or why the value is not one.
 */
function readDependency(
  value: unknown,
  number: number
): SketchDependency | string {
  const where = `Dependency ${number}`;

  if (!isFields(value)) {
    return `${where} must be an object.`;
  }

  const { from, target, syntax, importKind, specifiers } = value;

  if (typeof from !== "string") {
    return getFieldError(where, "from", "text");
  }

  const readTargetResult = readTarget(target, where);

  if (typeof readTargetResult === "string") {
    return readTargetResult;
  }
  if (!isOneOf(syntax, SYNTAXES)) {
    return getFieldError(where, "syntax", listChoices(SYNTAXES));
  }
  if (!isOneOf(importKind, IMPORT_KINDS)) {
    return getFieldError(where, "importKind", listChoices(IMPORT_KINDS));
  }
  if (!Array.isArray(specifiers)) {
    return getFieldError(where, "specifiers", "a list");
  }

  const names = readList(specifiers, (item, position) =>
    readSpecifier(item, position, where)
  );

  if (typeof names === "string") {
    return names;
  }
  return (
    getUnknownKeyError(
      value,
      ["from", "target", "syntax", "importKind", "specifiers"],
      where
    ) ?? {
      from,
      target: readTargetResult,
      syntax,
      importKind,
      specifiers: names,
    }
  );
}

/**
 * Reads the shape of a sketch: its keys and the type of every value, nothing else.
 * @param value The value to read.
 * @returns The sketch as it was written, or why the value is not the shape of one.
 */
function readShape(value: unknown): Sketch | string {
  if (!isFields(value)) {
    return NOT_A_SKETCH;
  }

  const where = "The project";
  const { config, tree, dependencies } = value;

  if (typeof config !== "string") {
    return getFieldError(where, "config", "text");
  }
  if (!Array.isArray(tree)) {
    return getFieldError(where, "tree", "a list");
  }
  if (!Array.isArray(dependencies)) {
    return getFieldError(where, "dependencies", "a list");
  }
  // Before the lists are read: the cost of the checks that follow grows with the size of the sketch
  if (tree.length > MAX_SKETCH_NODES) {
    return TOO_MANY_NODES;
  }
  if (dependencies.length > MAX_SKETCH_DEPENDENCIES) {
    return TOO_MANY_DEPENDENCIES;
  }

  const nodes = readList(tree, readNode);

  if (typeof nodes === "string") {
    return nodes;
  }

  const read = readList(dependencies, readDependency);

  if (typeof read === "string") {
    return read;
  }
  return (
    getUnknownKeyError(value, ["config", "tree", "dependencies"], where) ?? {
      config,
      tree: nodes,
      dependencies: read,
    }
  );
}

/**
 * Tells why a node cannot be in the tree, as text mode would refuse the line that declares it: its path is invalid, something is already there, or a file is above it. A path that ends with a space is refused too: text mode trims the line of a node, so the next read would lose the space.
 * @param before The nodes before it in the tree, indexed.
 * @param node The node to check.
 * @param node.path The path of the node.
 * @param node.kind Whether the node is a file or a folder.
 * @returns The reason as a sentence for the user, or `undefined` when the node can be in the tree.
 */
function getNodeError(
  before: NodeIndex,
  { path, kind }: SketchNode
): string | undefined {
  const error = before.getAddError(path, kind);

  if (error !== undefined) {
    return error;
  }
  return path === path.trimEnd()
    ? undefined
    : "A path cannot end with a space.";
}

/**
 * Checks the nodes of a tree one after the other, as text mode reads its lines.
 * @param nodes The nodes, in the order they are written.
 * @returns The reason the first node that cannot be in the tree is refused, or `undefined` when every node can.
 */
function getTreeError(nodes: readonly SketchNode[]): string | undefined {
  const before = createNodeIndex();

  for (const node of nodes) {
    const error = getNodeError(before, node);

    if (error !== undefined) {
      return `${quotePath(node.path)} cannot be in the tree. ${error}`;
    }
    before.add(node);
  }
  return undefined;
}

/**
 * Checks the dependencies against the tree, each one against the ones before it in its file, as text mode reads them: only the dependencies of the same file count for a name that is taken. It groups them by their file in the same pass.
 * @param tree The tree the dependencies belong to.
 * @param dependencies The dependencies, in the order they came.
 * @returns The dependencies grouped by their file, each file's dependencies in the order they came, or the reason the first dependency that the sketch cannot hold is refused.
 */
function groupDependencies(
  tree: readonly SketchNode[],
  dependencies: readonly SketchDependency[]
): ReadonlyMap<string, readonly SketchDependency[]> | string {
  const checker = createDependencyChecker(tree);
  const groups = new Map<string, SketchDependency[]>();

  for (const [index, dependency] of dependencies.entries()) {
    const error = checker.accept(dependency);

    if (error !== undefined) {
      return `Dependency ${index + 1} cannot be in the project. ${error}`;
    }

    const sameFile = groups.get(dependency.from) ?? [];

    sameFile.push(dependency);
    groups.set(dependency.from, sameFile);
  }
  return groups;
}

/**
 * Reads a value that comes from outside, such as a link, as a sketch. It checks the exact shape: the keys, the type of every value and the values a field allows, and an unknown key is refused. Then it applies every check that the edits and text mode apply, so that the sketch is one that they could have made: every path of the tree, a path declared twice, a file used as a folder, and every dependency against the tree and the ones before it in its file.
 *
 * The sketch is returned in the order that text mode reads back, so that reading its text gives the same project and the first read of a decoded sketch never counts as an edit: the tree in the order of the project pane, with the folders that the files imply dropped; the dependencies grouped by their file, the files in the order of the tree, each file's dependencies in the order they came; and the names of each dependency in the order a statement writes them: default, namespace, named.
 * @param value The value to read, such as the result of `JSON.parse`. It is not changed.
 * @returns The sketch, or why the value is not one, as a sentence for the user.
 */
export function readSketch(value: unknown): SketchReadResult {
  const shape = readShape(value);

  if (typeof shape === "string") {
    return shape === TOO_MANY_NODES || shape === TOO_MANY_DEPENDENCIES
      ? { error: shape, tooLarge: true }
      : { error: shape };
  }

  const treeError = getTreeError(shape.tree);

  if (treeError !== undefined) {
    return { error: treeError };
  }

  const tree = canonicalizeNodes(shape.tree);
  const groups = groupDependencies(tree, shape.dependencies);

  if (typeof groups === "string") {
    return { error: groups };
  }
  return {
    sketch: {
      config: shape.config,
      tree,
      // Every dependency is of a file of the tree, which the check above made sure of
      dependencies: tree
        .filter(({ kind }) => kind === "file")
        .flatMap(({ path }) => groups.get(path) ?? [])
        .map(sortSpecifiers),
    },
  };
}
