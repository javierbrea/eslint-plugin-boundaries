import type {
  Sketch,
  SketchDependency,
  SketchDependencySyntax,
  SketchSpecifier,
} from "@/contract";

import type { DependencyRef, EditResult } from "./sketch.types";
import { getNodeKind } from "./tree";

const NOT_FOUND = "There is no dependency at that line.";

/** Matches a JavaScript identifier: a start character, then continuation characters */
const IDENTIFIER = /^[\p{ID_Start}$_][\p{ID_Continue}$\u200c\u200d]*$/u;

/** The words that cannot be a name in a module, even though they look like an identifier */
const RESERVED_WORDS = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

/** How a syntax is called in the sentences for the user */
const SYNTAX_LABELS: Record<SketchDependencySyntax, string> = {
  import: "`import`",
  "export-from": "`export … from`",
  require: "`require()`",
  "dynamic-import": "`import()`",
};

/**
 * Gets the dependencies of a file, in the order of the sketch.
 * @param sketch The sketch to read: only its dependencies count.
 * @param path The path of the file.
 * @returns The dependencies whose `from` is the path. The position of each one is its `index` in a {@link DependencyRef}.
 */
export function getFileDependencies(
  sketch: Pick<Sketch, "dependencies">,
  path: string
): readonly SketchDependency[] {
  return sketch.dependencies.filter(({ from }) => from === path);
}

/**
 * Gets the dependency that a reference identifies.
 * @param sketch The sketch to read: only its dependencies count.
 * @param ref The file and the position of the dependency among the ones of that file.
 * @returns The dependency, or `undefined` when the file has no dependency at that position.
 */
export function getDependency(
  sketch: Pick<Sketch, "dependencies">,
  ref: DependencyRef
): SketchDependency | undefined {
  return getFileDependencies(sketch, ref.path)[ref.index];
}

/**
 * Tells whether a word can be a name in a statement: it is an identifier that is not reserved.
 * @param word The word to check.
 */
function isName(word: string): boolean {
  return IDENTIFIER.test(word) && !RESERVED_WORDS.has(word);
}

/**
 * Tells why a target cannot be written in a statement.
 * @param sketch The sketch that would hold the dependency: only its tree counts.
 * @param dependency The dependency to check.
 * @returns The reason as a sentence for the user, or `undefined` when the target is valid.
 */
function getTargetError(
  sketch: Pick<Sketch, "tree">,
  dependency: SketchDependency
): string | undefined {
  const { from, target } = dependency;

  if (target.kind === "node") {
    if (getNodeKind(sketch.tree, target.path) !== "file") {
      return `"${target.path}" is not a file of the sketch.`;
    }
    return target.path === from ? "A file cannot depend on itself." : undefined;
  }

  const moduleName = target.name;

  if (moduleName === "") {
    return "The module name is empty.";
  }
  if (/\s/.test(moduleName)) {
    return "A module name cannot have spaces.";
  }
  if (moduleName.startsWith(".") || moduleName.startsWith("/")) {
    return `"${moduleName}" is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.`;
  }
  return /["'\\]/.test(moduleName)
    ? "A module name cannot have quotes or backslashes."
    : undefined;
}

/**
 * Counts the specifiers of one kind.
 * @param specifiers The specifiers of a statement.
 * @param kind The kind to count.
 */
function countKind(
  specifiers: readonly SketchSpecifier[],
  kind: SketchSpecifier["kind"]
): number {
  return specifiers.filter((specifier) => specifier.kind === kind).length;
}

/**
 * Tells why a type import cannot hold its names: it needs one, and TypeScript's parser rejects `import type A, { B }` and `import type A, * as ns`, since a type import has a default name or the others, not both.
 * @param specifiers The specifiers of an `import` of types.
 * @returns The reason as a sentence for the user, or `undefined` when the names fit a type import.
 */
function getTypeImportError(
  specifiers: readonly SketchSpecifier[]
): string | undefined {
  if (specifiers.length === 0) {
    return "A type import needs at least one name.";
  }

  const defaults = countKind(specifiers, "default");

  return defaults > 0 && defaults < specifiers.length
    ? "A type import cannot hold a default name together with named names or a namespace."
    : undefined;
}

/**
 * Tells why a syntax cannot hold the kind and the names of a dependency, as the table of the syntaxes says.
 * @param dependency The dependency to check.
 * @returns The reason as a sentence for the user, or `undefined` when the syntax holds them.
 */
function getSyntaxError(dependency: SketchDependency): string | undefined {
  const { syntax, importKind, specifiers } = dependency;
  const label = SYNTAX_LABELS[syntax];

  if (syntax === "require" || syntax === "dynamic-import") {
    if (importKind === "type") {
      return `${label} imports values only.`;
    }
    return specifiers.length > 0 ? `${label} holds no names.` : undefined;
  }
  const typeImportError =
    importKind === "type" && syntax === "import"
      ? getTypeImportError(specifiers)
      : undefined;

  if (typeImportError !== undefined) {
    return typeImportError;
  }
  if (countKind(specifiers, "default") > (syntax === "import" ? 1 : 0)) {
    return syntax === "import"
      ? "An import holds one default name."
      : `${label} holds named names or one namespace, not a default name.`;
  }
  if (countKind(specifiers, "namespace") > 1) {
    return `${label} holds one namespace.`;
  }
  return countKind(specifiers, "namespace") > 0 &&
    countKind(specifiers, "named") > 0
    ? `${label} cannot hold a namespace and named names together.`
    : undefined;
}

/**
 * Tells why a specifier cannot be written: its alias, or a name that is not an identifier.
 * @param specifier The specifier to check.
 * @param syntax The syntax of the statement that holds it.
 * @returns The reason as a sentence for the user, or `undefined` when the specifier is valid.
 */
function getSpecifierError(
  specifier: SketchSpecifier,
  syntax: SketchDependencySyntax
): string | undefined {
  const { kind, alias } = specifier;
  const specifierName = specifier.name;

  if (kind !== "named" && alias !== undefined) {
    return `The ${kind} name "${specifierName}" cannot have an alias.`;
  }

  // `default` is the name of a named export, though it cannot be a local name
  const isDefaultExport = kind === "named" && specifierName === "default";

  if (!isDefaultExport && !isName(specifierName)) {
    return `"${specifierName}" is not a valid name.`;
  }
  if (isDefaultExport && syntax === "import" && alias === undefined) {
    return 'An import of "default" needs an alias.';
  }
  // `default` is also a valid name to export under, as in `export { a as default } from "./x"`, and only there
  const isDefaultAlias = syntax === "export-from" && alias === "default";

  return alias !== undefined && !isDefaultAlias && !isName(alias)
    ? `"${alias}" is not a valid name.`
    : undefined;
}

/**
 * Tells why the specifiers of a dependency cannot be written: each one on its own, and then the names that two of them share.
 * @param dependency The dependency to check.
 * @returns The reason as a sentence for the user, or `undefined` when the specifiers are valid.
 */
function getSpecifiersError(dependency: SketchDependency): string | undefined {
  const { syntax, specifiers } = dependency;

  for (const specifier of specifiers) {
    const error = getSpecifierError(specifier, syntax);

    if (error !== undefined) {
      return error;
    }
  }

  const locals = specifiers.map(
    (specifier) => specifier.alias ?? specifier.name
  );
  const repeated = locals.find((local, index) => locals.indexOf(local) < index);

  return repeated === undefined
    ? undefined
    : `The name "${repeated}" is used twice in the statement.`;
}

/**
 * Tells why a sketch cannot hold a dependency, so that the edits refuse it and a sketch never has one that cannot be written as a statement. A node path that has quotes or backslashes is not here: no path of the tree can have them, as `getPathError` refuses them wherever a path enters.
 * @param sketch The sketch that would hold it: only its tree counts.
 * @param dependency The dependency to check.
 * @returns The reason as a sentence for the user, or `undefined` when the sketch can hold it. The first reason found: its file is not a file of the tree, its target is not a file of the tree or is its own file, an external name that is empty, has spaces or quotes, or starts with `.` or `/`, names that its syntax does not hold (a type import with a default name together with named names or a namespace included), an alias on a default or namespace name, a name that is not an identifier (but `default` as a named name, and as the alias of a name an `export … from` writes), or two names of the statement that are the same locally.
 */
export function getDependencyError(
  sketch: Pick<Sketch, "tree">,
  dependency: SketchDependency
): string | undefined {
  if (getNodeKind(sketch.tree, dependency.from) !== "file") {
    return `"${dependency.from}" is not a file of the sketch.`;
  }
  return (
    getTargetError(sketch, dependency) ??
    getSyntaxError(dependency) ??
    getSpecifiersError(dependency)
  );
}

/**
 * Finds where a dependency is in the list of the sketch.
 * @param dependencies The dependencies of the sketch.
 * @param ref The file and the position of the dependency among the ones of that file.
 * @returns The position in `dependencies`, or -1 when the file has no dependency at that position.
 */
function indexOfRef(
  dependencies: readonly SketchDependency[],
  ref: DependencyRef
): number {
  let seen = 0;

  for (const [position, { from }] of dependencies.entries()) {
    if (from === ref.path) {
      if (seen === ref.index) {
        return position;
      }
      seen += 1;
    }
  }
  return -1;
}

/**
 * Adds a dependency at the end of the list of the sketch, so that it is the last line of its file.
 * @param sketch The sketch to edit. It is not changed.
 * @param dependency The dependency to add.
 * @returns The new sketch, or the reason why the sketch cannot hold the dependency, as {@link getDependencyError} gives it.
 */
export function addDependency(
  sketch: Sketch,
  dependency: SketchDependency
): EditResult {
  const error = getDependencyError(sketch, dependency);

  return error === undefined
    ? {
        sketch: {
          ...sketch,
          dependencies: [...sketch.dependencies, dependency],
        },
      }
    : { error };
}

/**
 * Replaces a dependency with another one of the same file, in the same position.
 * @param sketch The sketch to edit. It is not changed.
 * @param ref The dependency to replace.
 * @param dependency The dependency that takes its place. It has to be of the same file.
 * @returns The new sketch, or the reason why the dependency is not replaced: there is none at `ref`, the new one is of another file, or the sketch cannot hold it, as {@link getDependencyError} gives it.
 */
export function replaceDependency(
  sketch: Sketch,
  ref: DependencyRef,
  dependency: SketchDependency
): EditResult {
  const position = indexOfRef(sketch.dependencies, ref);

  if (position === -1) {
    return { error: NOT_FOUND };
  }
  if (dependency.from !== ref.path) {
    return { error: "A dependency cannot move to another file." };
  }

  const error = getDependencyError(sketch, dependency);

  return error === undefined
    ? {
        sketch: {
          ...sketch,
          dependencies: sketch.dependencies.map((existing, index) =>
            index === position ? dependency : existing
          ),
        },
      }
    : { error };
}

/**
 * Removes a dependency. The ones after it in its file move up one line.
 * @param sketch The sketch to edit. It is not changed.
 * @param ref The dependency to remove.
 * @returns The new sketch, or the reason why there is nothing to remove.
 */
export function removeDependency(
  sketch: Sketch,
  ref: DependencyRef
): EditResult {
  const position = indexOfRef(sketch.dependencies, ref);

  return position === -1
    ? { error: NOT_FOUND }
    : {
        sketch: {
          ...sketch,
          dependencies: sketch.dependencies.filter(
            (_dependency, index) => index !== position
          ),
        },
      };
}
