import type {
  Sketch,
  SketchDependency,
  SketchDependencySyntax,
  SketchSpecifier,
} from "@/contract";

import { SYNTAX_FACTS } from "./sketch.constants";
import type {
  DependencyRef,
  EditResult,
  SpecifierKind,
  SyntaxFacts,
} from "./sketch.types";
import { getNodeKind } from "./tree";

const NOT_FOUND = "There is no dependency at that line.";

/** Matches a JavaScript identifier: a start character, then continuation characters */
const IDENTIFIER = /^[\p{ID_Start}$_][\p{ID_Continue}$\u200c\u200d]*$/u;

/** The words that cannot be a local name in a module, even though they look like an identifier: the reserved words, and `eval` and `arguments`, which strict mode does not let a binding have */
const RESERVED_WORDS = new Set([
  "arguments",
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
  "eval",
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

/** How the reason says that a name is taken, by the syntax that declares names: an `import` binds local names and an `export … from` exports names. The other syntaxes declare none */
const NAME_VERBS: Partial<Record<SketchDependencySyntax, string>> = {
  import: "imported",
  "export-from": "exported",
};

/** The order of the names in a statement: the default name, then the namespace, then the named names */
const SPECIFIER_ORDER: readonly SpecifierKind[] = [
  "default",
  "namespace",
  "named",
];

/**
 * Gets what a syntax holds: its name, the kinds of statement and the kinds of name. The checks of a dependency are derived from the same table.
 * @param syntax The syntax of the dependency.
 * @returns The facts of the syntax, as the table of the syntaxes says.
 */
export function getSyntaxFacts(syntax: SketchDependencySyntax): SyntaxFacts {
  return SYNTAX_FACTS[syntax];
}

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
 * Tells whether a word is an IdentifierName: any word that looks like an identifier, keywords included. It is what the name of a named specifier with an alias is in an `import`, and what every name is in an `export … from`.
 * @param word The word to check.
 */
function isIdentifierName(word: string): boolean {
  return IDENTIFIER.test(word);
}

/**
 * Tells whether a word can be a local name of an `import`: an identifier that is not reserved.
 * @param word The word to check.
 */
function isLocalName(word: string): boolean {
  return isIdentifierName(word) && !RESERVED_WORDS.has(word);
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
 * Tells why a syntax cannot hold the kind and the names of a dependency. Which kinds of statement and which kinds of name a syntax holds come from the table of the syntaxes; the grammar that its syntaxes with names share is here.
 * @param dependency The dependency to check.
 * @returns The reason as a sentence for the user, or `undefined` when the syntax holds them.
 */
function getSyntaxError(dependency: SketchDependency): string | undefined {
  const { syntax, importKind, specifiers } = dependency;
  const facts = SYNTAX_FACTS[syntax];
  const { importKinds, specifierKinds } = facts;
  const label = `\`${facts.name}\``;

  if (!importKinds.includes(importKind)) {
    const held = importKinds.map((kind) => `${kind}s`).join(" and ");

    return `${label} imports ${held} only.`;
  }
  if (specifierKinds.length === 0) {
    return specifiers.length > 0 ? `${label} holds no names.` : undefined;
  }

  const refused = specifiers.find(({ kind }) => !specifierKinds.includes(kind));

  if (refused !== undefined) {
    return `${label} holds ${specifierKinds.join(" or ")} names, not ${refused.kind} names.`;
  }

  const typeImportError =
    importKind === "type" && syntax === "import"
      ? getTypeImportError(specifiers)
      : undefined;

  if (typeImportError !== undefined) {
    return typeImportError;
  }
  if (countKind(specifiers, "default") > 1) {
    return `${label} holds one default name.`;
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
 * Tells why a specifier cannot be written: its alias, or a name that cannot play its role. In an `import`, what a specifier binds is a local name: the name of a default or namespace specifier, the alias of a named one, or its name when it has no alias. The name of a named specifier that has an alias is only an IdentifierName, so it can be a keyword. In an `export … from`, the name and the alias of a named specifier and the name of a namespace are IdentifierNames.
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

  const isImport = syntax === "import";
  // Nothing renames the name of this specifier, so an import binds it
  const isNameLocal = isImport && alias === undefined;
  const isValidName = isNameLocal ? isLocalName : isIdentifierName;
  const isValidAlias = isImport ? isLocalName : isIdentifierName;

  if (!isValidName(specifierName)) {
    // `default` and the keywords are names to import, though not local names: the alias is the fix
    return kind === "named" && isNameLocal && isIdentifierName(specifierName)
      ? `An import of "${specifierName}" needs an alias.`
      : `"${specifierName}" is not a valid name.`;
  }
  return alias !== undefined && !isValidAlias(alias)
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
 * Tells why a name that a statement declares is already declared by another statement of its file. A name is declared in one of two namespaces, and a name can be declared once in each: the local names that the `import` statements of the file bind, whether they import values or types, and the names that its `export … from` statements export, `default` included. A name that one statement imports and another exports is not repeated, and neither is one that another file declares. `require()` and `import()` declare no name, and neither does `export * from`.
 * @param sketch The sketch that would hold the dependency: only its dependencies count, which are the other statements of the file and of the other files.
 * @param dependency The dependency to check, whose specifiers are valid.
 * @returns The reason as a sentence for the user, naming the first repeated name in the order of the specifiers, or `undefined` when no other statement of the file declares a name of the dependency in the same namespace.
 */
function getRepeatedNameError(
  sketch: Pick<Sketch, "dependencies">,
  dependency: SketchDependency
): string | undefined {
  const { syntax, specifiers } = dependency;
  const verb = NAME_VERBS[syntax];

  if (verb === undefined) {
    return undefined;
  }

  // A syntax declares its names in one namespace, so the statements of the same syntax are the ones that share it
  const taken = new Set(
    getFileDependencies(sketch, dependency.from)
      .filter((other) => other.syntax === syntax)
      .flatMap((other) =>
        other.specifiers.map((specifier) => specifier.alias ?? specifier.name)
      )
  );
  const repeated = specifiers
    .map((specifier) => specifier.alias ?? specifier.name)
    .find((declared) => taken.has(declared));

  return repeated === undefined
    ? undefined
    : `The name "${repeated}" is already ${verb} by another statement of the file.`;
}

/**
 * Tells why a sketch cannot hold a dependency, so that the edits refuse it and a sketch never has one that cannot be written as a statement. A node path that has quotes or backslashes is not here: no path of the tree can have them, as `getPathError` refuses them wherever a path enters.
 * @param sketch The sketch that would hold it: only its tree and its dependencies count. The dependencies are the ones the file would have besides this one, so a caller that replaces a dependency leaves it out.
 * @param dependency The dependency to check.
 * @returns The reason as a sentence for the user, or `undefined` when the sketch can hold it. The first reason found: its file is not a file of the tree, its target is not a file of the tree or is its own file, an external module name that is empty, has spaces or quotes, or starts with `.` or `/`, a kind of statement or a kind of name that its syntax does not hold as the table of the syntaxes says (a type import with a default name together with named names or a namespace included), an alias on a default or namespace name, a name that cannot play its role (a local name of an `import` is an identifier that is not a reserved word, nor `eval` or `arguments`; the name of a named specifier that has an alias, and every name of an `export … from`, may be any word that looks like an identifier, keywords and `default` included), a named import of a name that cannot be a local name and has no alias, two names of the statement that are the same locally, or a name that another statement of the same file already imports (an `import`) or already exports (an `export … from`).
 */
export function getDependencyError(
  sketch: Pick<Sketch, "tree" | "dependencies">,
  dependency: SketchDependency
): string | undefined {
  if (getNodeKind(sketch.tree, dependency.from) !== "file") {
    return `"${dependency.from}" is not a file of the sketch.`;
  }
  return (
    getTargetError(sketch, dependency) ??
    getSyntaxError(dependency) ??
    getSpecifiersError(dependency) ??
    getRepeatedNameError(sketch, dependency)
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
 * Puts the names of a dependency in the order a statement writes them: the default name, then the namespace, then the named names, each kind in the order given.
 * @param dependency The dependency to sort. It is not changed.
 * @returns The dependency with its names in the order of the statement.
 */
export function sortSpecifiers(dependency: SketchDependency): SketchDependency {
  return {
    ...dependency,
    specifiers: SPECIFIER_ORDER.flatMap((kind) =>
      dependency.specifiers.filter((specifier) => specifier.kind === kind)
    ),
  };
}

/**
 * Adds a dependency at the end of the list of the sketch, so that it is the last line of its file. The sketch keeps its names in the order a statement writes them, so that reading its text gives the same names back.
 * @param sketch The sketch to edit. It is not changed.
 * @param dependency The dependency to add.
 * @returns The new sketch, or the reason why the sketch cannot hold the dependency, as {@link getDependencyError} gives it, against the dependencies the sketch already has.
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
          dependencies: [...sketch.dependencies, sortSpecifiers(dependency)],
        },
      }
    : { error };
}

/**
 * Replaces a dependency with another one of the same file, in the same position. The sketch keeps its names in the order a statement writes them, as {@link addDependency} does.
 * @param sketch The sketch to edit. It is not changed.
 * @param ref The dependency to replace.
 * @param dependency The dependency that takes its place. It has to be of the same file.
 * @returns The new sketch, or the reason why the dependency is not replaced: there is none at `ref`, the new one is of another file, or the sketch cannot hold it, as {@link getDependencyError} gives it, against the other dependencies of the sketch.
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

  // The dependency that is replaced does not count: the new one may keep its names
  const error = getDependencyError(
    {
      ...sketch,
      dependencies: sketch.dependencies.filter(
        (_existing, index) => index !== position
      ),
    },
    dependency
  );

  return error === undefined
    ? {
        sketch: {
          ...sketch,
          dependencies: sketch.dependencies.map((existing, index) =>
            index === position ? sortSpecifiers(dependency) : existing
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
