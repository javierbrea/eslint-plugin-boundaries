import type {
  Sketch,
  SketchDependency,
  SketchNode,
  SketchSpecifier,
} from "@/contract";

import {
  addDependency,
  getDependency,
  getDependencyError,
  getFileDependencies,
  getSyntaxFacts,
  removeDependency,
  replaceDependency,
} from "./dependencies";
import type { EditResult, ImportKind, SpecifierKind } from "./sketch.types";

/**
 * Creates a dependency of a file on a node of the sketch, with the fields given.
 * @param from The file that has the dependency.
 * @param path The node it points to.
 * @param fields The fields to set besides the target.
 */
function toNode(
  from: string,
  path: string,
  fields: Partial<SketchDependency> = {}
): SketchDependency {
  return {
    from,
    target: { kind: "node", path },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    ...fields,
  };
}

/**
 * Creates a dependency of a file on an external module, with the fields given.
 * @param from The file that has the dependency.
 * @param moduleName The module it points to.
 * @param fields The fields to set besides the target.
 */
function toExternal(
  from: string,
  moduleName: string,
  fields: Partial<SketchDependency> = {}
): SketchDependency {
  return {
    from,
    target: { kind: "external", name: moduleName },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    ...fields,
  };
}

/**
 * Creates the specifiers of the kind and the names given.
 * @param kind The kind of the specifiers.
 * @param names The names; `a as b` sets the alias.
 */
function specifiers(
  kind: SketchSpecifier["kind"],
  ...names: string[]
): SketchSpecifier[] {
  return names.map((entry) => {
    const [local, alias] = entry.split(" as ");

    return alias === undefined
      ? { kind, name: local }
      : { kind, name: local, alias };
  });
}

/**
 * Creates a sketch with the nodes and the dependencies given.
 * @param tree The nodes of the sketch.
 * @param dependencies The dependencies of the sketch.
 */
function createSketch(
  tree: readonly SketchNode[],
  dependencies: readonly SketchDependency[] = []
): Sketch {
  return { config: "{ settings: {}, rules: {} }", tree, dependencies };
}

/**
 * Gets the sketch of a result that is not an error.
 * @param result The result of an edit.
 */
function getSketch(result: EditResult): Sketch {
  if ("error" in result) {
    throw new Error(`The edit was refused: ${result.error}`);
  }
  return result.sketch;
}

/**
 * Gets the error of a result that is refused.
 * @param result The result of an edit.
 */
function getError(result: EditResult): string {
  if ("sketch" in result) {
    throw new Error("The edit was not refused");
  }
  return result.error;
}

const A = "src/a.js";
const B = "src/b.js";
const C = "src/c.js";

const TREE: readonly SketchNode[] = [
  { path: A, kind: "file" },
  { path: B, kind: "file" },
  { path: C, kind: "file" },
  { path: "src/pages", kind: "folder" },
];

const SYNTAXES = [
  "import",
  "export-from",
  "require",
  "dynamic-import",
] as const;

const IMPORT_KINDS: readonly ImportKind[] = ["value", "type"];

const SPECIFIER_KINDS: readonly SpecifierKind[] = [
  "default",
  "named",
  "namespace",
];

describe("Dependencies", () => {
  describe("getFileDependencies", () => {
    it("should give the dependencies of a file in the order of the sketch", () => {
      // Arrange
      const first = toNode(A, B);
      const second = toExternal(A, "react");
      const sketch = createSketch(TREE, [
        first,
        toNode(B, C),
        second,
        toNode(C, A),
      ]);

      // Act
      const dependencies = getFileDependencies(sketch, A);

      // Assert
      expect(dependencies).toEqual([first, second]);
    });

    it("should give nothing for a file without dependencies and for a path that is not a file", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);

      // Act
      const withoutDependencies = getFileDependencies(sketch, B);
      const missing = getFileDependencies(sketch, "src/missing.js");

      // Assert
      expect(withoutDependencies).toEqual([]);
      expect(missing).toEqual([]);
    });
  });

  describe("getDependency", () => {
    it("should give the dependency at the position among the ones of its file", () => {
      // Arrange
      const second = toExternal(A, "react");
      const sketch = createSketch(TREE, [
        toNode(A, B),
        toNode(B, C),
        second,
        toNode(C, A),
      ]);

      // Act
      const dependency = getDependency(sketch, { path: A, index: 1 });

      // Assert
      expect(dependency).toBe(second);
    });

    it("should give undefined for a position that the file does not have", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B), toNode(B, C)]);

      // Act
      const past = getDependency(sketch, { path: A, index: 1 });
      const negative = getDependency(sketch, { path: A, index: -1 });
      const fractional = getDependency(sketch, { path: A, index: 0.5 });
      const otherFile = getDependency(sketch, { path: C, index: 0 });

      // Assert
      expect([past, negative, fractional, otherFile]).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
      ]);
    });
  });

  describe("getSyntaxFacts", () => {
    it("should hold both kinds and the three kinds of name in an import", () => {
      // Act
      const facts = getSyntaxFacts("import");

      // Assert
      expect(facts).toEqual({
        name: "import",
        importKinds: ["value", "type"],
        specifierKinds: ["default", "named", "namespace"],
      });
    });

    it("should hold both kinds but no default name in an export from, where default is a named name", () => {
      // Act
      const facts = getSyntaxFacts("export-from");

      // Assert
      expect(facts).toEqual({
        name: "export … from",
        importKinds: ["value", "type"],
        specifierKinds: ["named", "namespace"],
      });
    });

    it.each([
      ["require", "require()"],
      ["dynamic-import", "import()"],
    ] as const)(
      "should hold values and no name in %s, which is called %s",
      (syntax, syntaxName) => {
        // Act
        const facts = getSyntaxFacts(syntax);

        // Assert
        expect(facts).toEqual({
          name: syntaxName,
          importKinds: ["value"],
          specifierKinds: [],
        });
      }
    );

    it("should list the syntaxes in the order the picker offers them", () => {
      // Act
      const names = SYNTAXES.map((syntax) => getSyntaxFacts(syntax).name);

      // Assert
      expect(names).toEqual([
        "import",
        "export … from",
        "require()",
        "import()",
      ]);
    });
  });

  describe("the checks of a dependency against the table of the syntaxes", () => {
    const sketch = createSketch(TREE);

    it.each(
      SYNTAXES.flatMap((syntax) =>
        IMPORT_KINDS.map((importKind) => [syntax, importKind] as const)
      )
    )(
      "should hold the kind of statement exactly when the table of %s lists %s",
      (syntax, importKind) => {
        // Arrange
        const facts = getSyntaxFacts(syntax);
        const names = facts.specifierKinds
          .slice(0, 1)
          .flatMap((kind) => specifiers(kind, "x"));

        // Act
        const error = getDependencyError(
          sketch,
          toNode(A, B, { syntax, importKind, specifiers: names })
        );

        // Assert
        expect(error === undefined).toBe(
          facts.importKinds.includes(importKind)
        );
      }
    );

    it.each(
      SYNTAXES.flatMap((syntax) =>
        SPECIFIER_KINDS.map((kind) => [syntax, kind] as const)
      )
    )(
      "should hold a name exactly when the table of %s lists the kind %s",
      (syntax, kind) => {
        // Act
        const error = getDependencyError(
          sketch,
          toNode(A, B, { syntax, specifiers: specifiers(kind, "x") })
        );

        // Assert
        expect(error === undefined).toBe(
          getSyntaxFacts(syntax).specifierKinds.includes(kind)
        );
      }
    );
  });

  describe("getDependencyError", () => {
    const sketch = createSketch(TREE);

    it.each([
      [
        "a default name",
        toNode(A, B, { specifiers: specifiers("default", "b") }),
      ],
      [
        "a namespace",
        toNode(A, B, { specifiers: specifiers("namespace", "ns") }),
      ],
      [
        "a default name and named names",
        toNode(A, B, {
          specifiers: [
            ...specifiers("default", "b"),
            ...specifiers("named", "x", "y as z"),
          ],
        }),
      ],
      [
        "a default name and a namespace",
        toNode(A, B, {
          specifiers: [
            ...specifiers("default", "b"),
            ...specifiers("namespace", "ns"),
          ],
        }),
      ],
      ["a side-effect import", toNode(A, B)],
      [
        "the default as a named name with an alias",
        toNode(A, B, { specifiers: specifiers("named", "default as d") }),
      ],
      [
        "a type import",
        toNode(A, B, {
          importKind: "type",
          specifiers: specifiers("named", "T"),
        }),
      ],
      [
        "an export of named names",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("named", "x", "y as z"),
        }),
      ],
      [
        "an export of the default",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("named", "default"),
        }),
      ],
      [
        "an export of a namespace",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("namespace", "ns"),
        }),
      ],
      [
        "an export of a name as the default",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("named", "a as default", "b"),
        }),
      ],
      [
        "an export of the default as the default",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("named", "default as default"),
        }),
      ],
      [
        "a type import of a default name",
        toNode(A, B, {
          importKind: "type",
          specifiers: specifiers("default", "T"),
        }),
      ],
      [
        "a type import of a namespace",
        toNode(A, B, {
          importKind: "type",
          specifiers: specifiers("namespace", "ns"),
        }),
      ],
      ["an export of everything", toNode(A, B, { syntax: "export-from" })],
      [
        "a type export of everything",
        toNode(A, B, { syntax: "export-from", importKind: "type" }),
      ],
      ["a require", toNode(A, B, { syntax: "require" })],
      ["a dynamic import", toNode(A, B, { syntax: "dynamic-import" })],
      ["an external module", toExternal(A, "react")],
      ["a scoped external module", toExternal(A, "@scope/pkg/sub-path")],
      ["a node module", toExternal(A, "node:fs")],
      [
        "names with accents, dollars and underscores",
        toNode(A, B, { specifiers: specifiers("named", "café", "$a", "_b") }),
      ],
      [
        "words that look like keywords of a statement",
        toNode(A, B, {
          specifiers: specifiers("named", "from", "type", "as", "async"),
        }),
      ],
    ])("should accept %s", (_label, dependency) => {
      // Act
      const error = getDependencyError(sketch, dependency);

      // Assert
      expect(error).toBeUndefined();
    });

    it.each([
      [
        "a file that is not in the tree",
        toNode("src/missing.js", B),
        '"src/missing.js" is not a file of the sketch.',
      ],
      [
        "a folder as the file",
        toNode("src/pages", B),
        '"src/pages" is not a file of the sketch.',
      ],
      [
        "a folder that a file implies as the file",
        toNode("src", B),
        '"src" is not a file of the sketch.',
      ],
      [
        "a node target that is not in the tree",
        toNode(A, "src/missing.js"),
        '"src/missing.js" is not a file of the sketch.',
      ],
      [
        "a folder as the target",
        toNode(A, "src/pages"),
        '"src/pages" is not a file of the sketch.',
      ],
      [
        "the file itself as the target",
        toNode(A, A),
        "A file cannot depend on itself.",
      ],
      ["an empty module name", toExternal(A, ""), "The module name is empty."],
      [
        "a module name with a space",
        toExternal(A, "my module"),
        "A module name cannot have spaces.",
      ],
      [
        "a module name with a tab",
        toExternal(A, "my\tmodule"),
        "A module name cannot have spaces.",
      ],
      [
        "a module name that starts with a dot",
        toExternal(A, "./b"),
        '"./b" is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.',
      ],
      [
        "a module name that is only two dots",
        toExternal(A, ".."),
        '".." is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.',
      ],
      [
        "a module name that starts with a slash",
        toExternal(A, "/src/b"),
        '"/src/b" is not a module name: names do not start with "." or "/". Point to a file of the sketch instead.',
      ],
      [
        "a module name with a double quote",
        toExternal(A, 'a"b'),
        "A module name cannot have quotes or backslashes.",
      ],
      [
        "a module name with a single quote",
        toExternal(A, "a'b"),
        "A module name cannot have quotes or backslashes.",
      ],
      [
        "a module name with a backslash",
        toExternal(A, "a\\b"),
        "A module name cannot have quotes or backslashes.",
      ],
      [
        "a require that is a type",
        toNode(A, B, { syntax: "require", importKind: "type" }),
        "`require()` imports values only.",
      ],
      [
        "a dynamic import that is a type",
        toNode(A, B, { syntax: "dynamic-import", importKind: "type" }),
        "`import()` imports values only.",
      ],
      [
        "a require with names",
        toNode(A, B, {
          syntax: "require",
          specifiers: specifiers("named", "a"),
        }),
        "`require()` holds no names.",
      ],
      [
        "a dynamic import with names",
        toNode(A, B, {
          syntax: "dynamic-import",
          specifiers: specifiers("default", "a"),
        }),
        "`import()` holds no names.",
      ],
      [
        "a type import without names",
        toNode(A, B, { importKind: "type" }),
        "A type import needs at least one name.",
      ],
      [
        "a type import of a default name and named names",
        toNode(A, B, {
          importKind: "type",
          specifiers: [
            ...specifiers("default", "A"),
            ...specifiers("named", "B"),
          ],
        }),
        "A type import cannot hold a default name together with named names or a namespace.",
      ],
      [
        "a type import of a default name and a namespace",
        toNode(A, B, {
          importKind: "type",
          specifiers: [
            ...specifiers("default", "A"),
            ...specifiers("namespace", "ns"),
          ],
        }),
        "A type import cannot hold a default name together with named names or a namespace.",
      ],
      [
        "a name as the default in an import",
        toNode(A, B, { specifiers: specifiers("named", "a as default") }),
        '"default" is not a valid name.',
      ],
      [
        "two default names in an import",
        toNode(A, B, { specifiers: specifiers("default", "a", "b") }),
        "`import` holds one default name.",
      ],
      [
        "a default name in an export",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("default", "a"),
        }),
        "`export … from` holds named or namespace names, not default names.",
      ],
      [
        "two namespaces in an import",
        toNode(A, B, { specifiers: specifiers("namespace", "a", "b") }),
        "`import` holds one namespace.",
      ],
      [
        "two namespaces in an export",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("namespace", "a", "b"),
        }),
        "`export … from` holds one namespace.",
      ],
      [
        "a namespace and named names in an import",
        toNode(A, B, {
          specifiers: [
            ...specifiers("namespace", "ns"),
            ...specifiers("named", "a"),
          ],
        }),
        "`import` cannot hold a namespace and named names together.",
      ],
      [
        "a namespace and named names in an export",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: [
            ...specifiers("named", "a"),
            ...specifiers("namespace", "ns"),
          ],
        }),
        "`export … from` cannot hold a namespace and named names together.",
      ],
      [
        "an alias on a default name",
        toNode(A, B, {
          specifiers: [{ kind: "default", name: "a", alias: "b" }],
        }),
        'The default name "a" cannot have an alias.',
      ],
      [
        "an alias on a namespace",
        toNode(A, B, {
          specifiers: [{ kind: "namespace", name: "a", alias: "b" }],
        }),
        'The namespace name "a" cannot have an alias.',
      ],
      [
        "a name that starts with a digit",
        toNode(A, B, { specifiers: specifiers("named", "1a") }),
        '"1a" is not a valid name.',
      ],
      [
        "a name with a dash",
        toNode(A, B, { specifiers: specifiers("default", "a-b") }),
        '"a-b" is not a valid name.',
      ],
      [
        "an empty name",
        toNode(A, B, { specifiers: specifiers("named", "") }),
        '"" is not a valid name.',
      ],
      [
        "a name with a space",
        toNode(A, B, { specifiers: specifiers("named", "a b") }),
        '"a b" is not a valid name.',
      ],
      [
        "a reserved word as a name",
        toNode(A, B, { specifiers: specifiers("default", "class") }),
        '"class" is not a valid name.',
      ],
      [
        "the default as a default name",
        toNode(A, B, { specifiers: specifiers("default", "default") }),
        '"default" is not a valid name.',
      ],
      [
        "an alias that is not an identifier",
        toNode(A, B, { specifiers: specifiers("named", "a as 2b") }),
        '"2b" is not a valid name.',
      ],
      [
        "an empty alias",
        toNode(A, B, { specifiers: [{ kind: "named", name: "a", alias: "" }] }),
        '"" is not a valid name.',
      ],
      [
        "an alias that is a reserved word",
        toNode(A, B, { specifiers: specifiers("named", "a as let") }),
        '"let" is not a valid name.',
      ],
      [
        "the default as a named name of an import without alias",
        toNode(A, B, { specifiers: specifiers("named", "default") }),
        'An import of "default" needs an alias.',
      ],
      [
        "two names that are the same",
        toNode(A, B, { specifiers: specifiers("named", "a", "a") }),
        'The name "a" is used twice in the statement.',
      ],
      [
        "an alias that is the name of another specifier",
        toNode(A, B, { specifiers: specifiers("named", "a", "b as a") }),
        'The name "a" is used twice in the statement.',
      ],
      [
        "a default name that is the alias of a named name",
        toNode(A, B, {
          specifiers: [
            ...specifiers("default", "a"),
            ...specifiers("named", "b as a"),
          ],
        }),
        'The name "a" is used twice in the statement.',
      ],
      [
        "two exports of the same name",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("named", "a", "b as a"),
        }),
        'The name "a" is used twice in the statement.',
      ],
    ])("should refuse %s", (_label, dependency, expected) => {
      // Act
      const error = getDependencyError(sketch, dependency);

      // Assert
      expect(error).toBe(expected);
    });

    it("should accept two specifiers whose names differ only by their alias", () => {
      // Arrange
      const dependency = toNode(A, B, {
        specifiers: specifiers("named", "a as x", "a as y"),
      });

      // Act
      const error = getDependencyError(sketch, dependency);

      // Assert
      expect(error).toBeUndefined();
    });

    it.each([
      ["import { if as c }", "import", "named", "if as c"],
      ["import { default as d }", "import", "named", "default as d"],
      ["import { eval as e }", "import", "named", "eval as e"],
      ["export { if }", "export-from", "named", "if"],
      ["export { a as class }", "export-from", "named", "a as class"],
      ["export { if as class }", "export-from", "named", "if as class"],
      ["export { default }", "export-from", "named", "default"],
      ["export { a as default }", "export-from", "named", "a as default"],
      ["export { eval }", "export-from", "named", "eval"],
      ["export { a as eval }", "export-from", "named", "a as eval"],
      ["export * as if", "export-from", "namespace", "if"],
      ["export * as default", "export-from", "namespace", "default"],
      ["export * as eval", "export-from", "namespace", "eval"],
    ] as const)(
      "should accept the statement %s, as the parser of the Quick start does",
      (_statement, syntax, kind, written) => {
        // Act
        const error = getDependencyError(
          sketch,
          toNode(A, B, { syntax, specifiers: specifiers(kind, written) })
        );

        // Assert
        expect(error).toBeUndefined();
      }
    );

    it.each([
      ["import { if }", "named", "if", 'An import of "if" needs an alias.'],
      [
        "import { eval }",
        "named",
        "eval",
        'An import of "eval" needs an alias.',
      ],
      [
        "import { arguments }",
        "named",
        "arguments",
        'An import of "arguments" needs an alias.',
      ],
      [
        "import { await }",
        "named",
        "await",
        'An import of "await" needs an alias.',
      ],
      ["import { let }", "named", "let", 'An import of "let" needs an alias.'],
      [
        "import { yield }",
        "named",
        "yield",
        'An import of "yield" needs an alias.',
      ],
      [
        "import { default }",
        "named",
        "default",
        'An import of "default" needs an alias.',
      ],
      ["import { a as if }", "named", "a as if", '"if" is not a valid name.'],
      [
        "import { a as default }",
        "named",
        "a as default",
        '"default" is not a valid name.',
      ],
      [
        "import { a as eval }",
        "named",
        "a as eval",
        '"eval" is not a valid name.',
      ],
      [
        "import { a as arguments }",
        "named",
        "a as arguments",
        '"arguments" is not a valid name.',
      ],
      [
        "import { a as await }",
        "named",
        "a as await",
        '"await" is not a valid name.',
      ],
      ["import eval", "default", "eval", '"eval" is not a valid name.'],
      [
        "import arguments",
        "default",
        "arguments",
        '"arguments" is not a valid name.',
      ],
      ["import * as eval", "namespace", "eval", '"eval" is not a valid name.'],
      ["import * as if", "namespace", "if", '"if" is not a valid name.'],
      ["import { 1a as c }", "named", "1a as c", '"1a" is not a valid name.'],
      ["import { 1a }", "named", "1a", '"1a" is not a valid name.'],
    ] as const)(
      "should refuse the statement %s, as the parser of the Quick start does",
      (_statement, kind, written, expected) => {
        // Act
        const error = getDependencyError(
          sketch,
          toNode(A, B, { specifiers: specifiers(kind, written) })
        );

        // Assert
        expect(error).toBe(expected);
      }
    );

    it.each([
      ["export { 1a }", "named", "1a", '"1a" is not a valid name.'],
      ["export { a as 2b }", "named", "a as 2b", '"2b" is not a valid name.'],
      ["export { 1a as b }", "named", "1a as b", '"1a" is not a valid name.'],
      ["export { a-b }", "named", "a-b", '"a-b" is not a valid name.'],
      ["export * as 1ns", "namespace", "1ns", '"1ns" is not a valid name.'],
    ] as const)(
      "should refuse the statement %s, since an export needs words that look like an identifier",
      (_statement, kind, written, expected) => {
        // Act
        const error = getDependencyError(
          sketch,
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers(kind, written),
          })
        );

        // Assert
        expect(error).toBe(expected);
      }
    );

    it("should report the file before the target and the target before the names", () => {
      // Arrange
      const dependency = toNode("src/missing.js", "src/gone.js", {
        syntax: "require",
        specifiers: specifiers("named", "1a"),
      });
      const target = toNode(A, "src/gone.js", {
        syntax: "require",
        specifiers: specifiers("named", "1a"),
      });

      // Act
      const fileError = getDependencyError(sketch, dependency);
      const targetError = getDependencyError(sketch, target);

      // Assert
      expect(fileError).toBe('"src/missing.js" is not a file of the sketch.');
      expect(targetError).toBe('"src/gone.js" is not a file of the sketch.');
    });

    it("should report the syntax before the names", () => {
      // Arrange
      const dependency = toNode(A, B, {
        syntax: "require",
        specifiers: specifiers("named", "1a"),
      });

      // Act
      const error = getDependencyError(sketch, dependency);

      // Assert
      expect(error).toBe("`require()` holds no names.");
    });

    it("should read the files of the tree it is given, whatever else the sketch has", () => {
      // Act
      const error = getDependencyError(
        { tree: [{ path: A, kind: "file" }], dependencies: [] },
        toNode(A, B)
      );

      // Assert
      expect(error).toBe('"src/b.js" is not a file of the sketch.');
    });

    describe("a name that another statement of the file declares", () => {
      /**
       * Says why the sketch cannot hold a dependency next to the ones it has.
       * @param existing The dependencies the sketch has.
       * @param added The dependency to check.
       */
      function check(
        existing: readonly SketchDependency[],
        added: SketchDependency
      ): string | undefined {
        return getDependencyError(createSketch(TREE, existing), added);
      }

      /**
       * Writes the reason for a name that another statement imports.
       * @param declared The name.
       */
      function imported(declared: string): string {
        return `The name "${declared}" is already imported by another statement of the file.`;
      }

      /**
       * Writes the reason for a name that another statement exports.
       * @param declared The name.
       */
      function exported(declared: string): string {
        return `The name "${declared}" is already exported by another statement of the file.`;
      }

      it.each([
        [
          "a default name and a default name",
          toNode(A, B, { specifiers: specifiers("default", "x") }),
          toNode(A, C, { specifiers: specifiers("default", "x") }),
        ],
        [
          "a default name and the alias of a named name",
          toNode(A, B, { specifiers: specifiers("default", "x") }),
          toNode(A, C, { specifiers: specifiers("named", "y as x") }),
        ],
        [
          "the alias of a named name and a default name",
          toNode(A, B, { specifiers: specifiers("named", "y as x") }),
          toNode(A, C, { specifiers: specifiers("default", "x") }),
        ],
        [
          "a namespace and a default name",
          toNode(A, B, { specifiers: specifiers("namespace", "x") }),
          toNode(A, C, { specifiers: specifiers("default", "x") }),
        ],
        [
          "a namespace and a namespace",
          toNode(A, B, { specifiers: specifiers("namespace", "x") }),
          toNode(A, C, { specifiers: specifiers("namespace", "x") }),
        ],
        [
          "a namespace and a named name",
          toNode(A, B, { specifiers: specifiers("namespace", "x") }),
          toNode(A, C, { specifiers: specifiers("named", "x") }),
        ],
        [
          "a named name and a named name",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, C, { specifiers: specifiers("named", "x") }),
        ],
        [
          "a named name and the alias of another",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, C, { specifiers: specifiers("named", "y as x") }),
        ],
        [
          "an alias and an alias",
          toNode(A, B, { specifiers: specifiers("named", "w as x") }),
          toNode(A, C, { specifiers: specifiers("named", "y as x") }),
        ],
        [
          "a value import and a type import",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, C, {
            importKind: "type",
            specifiers: specifiers("named", "x"),
          }),
        ],
        [
          "a type import and a value import",
          toNode(A, B, {
            importKind: "type",
            specifiers: specifiers("named", "x"),
          }),
          toNode(A, C, { specifiers: specifiers("named", "x") }),
        ],
        [
          "a type import and a type import",
          toNode(A, B, {
            importKind: "type",
            specifiers: specifiers("default", "x"),
          }),
          toNode(A, C, {
            importKind: "type",
            specifiers: specifiers("default", "x"),
          }),
        ],
        [
          "an import of a file and an import of an external module",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toExternal(A, "react", { specifiers: specifiers("default", "x") }),
        ],
        [
          "the same statement twice",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, B, { specifiers: specifiers("named", "x") }),
        ],
      ])(
        "should refuse an import of %s that another statement of the file binds",
        (_description, existing, added) => {
          // Act
          const error = check([existing], added);

          // Assert
          expect(error).toBe(imported("x"));
        }
      );

      it.each([
        [
          "a named name and a named name",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ],
        [
          "an alias and a named name",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "w as x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ],
        [
          "a named name and an alias",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "w as x"),
          }),
        ],
        [
          "an alias and an alias",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "v as x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "w as x"),
          }),
        ],
        [
          "a namespace and a namespace",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("namespace", "x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("namespace", "x"),
          }),
        ],
        [
          "a namespace and a named name",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("namespace", "x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "w as x"),
          }),
        ],
        [
          "a value export and a type export",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            importKind: "type",
            specifiers: specifiers("named", "x"),
          }),
        ],
        [
          "a type export and a value export",
          toNode(A, B, {
            syntax: "export-from",
            importKind: "type",
            specifiers: specifiers("named", "x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ],
        [
          "an export from a file and an export from an external module",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
          toExternal(A, "react", {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ],
      ])(
        "should refuse an export of %s that another statement of the file exports",
        (_description, existing, added) => {
          // Act
          const error = check([existing], added);

          // Assert
          expect(error).toBe(exported("x"));
        }
      );

      it.each([
        [
          "default and default",
          specifiers("named", "default"),
          specifiers("named", "default"),
        ],
        [
          "default and an alias of default",
          specifiers("named", "default"),
          specifiers("named", "w as default"),
        ],
        [
          "an alias of default and an alias of default",
          specifiers("named", "v as default"),
          specifiers("named", "w as default"),
        ],
      ])(
        "should refuse an export of %s, since a file exports default once",
        (_description, first, second) => {
          // Arrange
          const existing = toNode(A, B, {
            syntax: "export-from",
            specifiers: first,
          });
          const added = toNode(A, C, {
            syntax: "export-from",
            specifiers: second,
          });

          // Act
          const error = check([existing], added);

          // Assert
          expect(error).toBe(exported("default"));
        }
      );

      it.each([
        [
          "an import of a name that another statement only renames",
          toNode(A, B, { specifiers: specifiers("named", "x as y") }),
          toNode(A, C, { specifiers: specifiers("named", "x") }),
        ],
        [
          "an import of a name that a statement of another file imports",
          toNode(B, C, { specifiers: specifiers("named", "x") }),
          toNode(A, C, { specifiers: specifiers("named", "x") }),
        ],
        [
          "an import of a name that another statement of the file exports",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
          toNode(A, C, { specifiers: specifiers("named", "x") }),
        ],
        [
          "an export of a name that another statement of the file imports",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ],
        [
          "an export of a namespace that another statement of the file imports",
          toNode(A, B, { specifiers: specifiers("namespace", "x") }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("namespace", "x"),
          }),
        ],
        [
          "an export of a name that another statement only renames",
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "x as y"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ],
        [
          "an export of a name that a statement of another file exports",
          toNode(B, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
          toNode(A, C, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ],
        ["a side-effect import twice", toNode(A, B), toNode(A, B)],
        [
          "an export of everything twice",
          toNode(A, B, { syntax: "export-from" }),
          toNode(A, B, { syntax: "export-from" }),
        ],
        [
          "an export of the types of two files",
          toNode(A, B, { syntax: "export-from", importKind: "type" }),
          toNode(A, C, { syntax: "export-from", importKind: "type" }),
        ],
        [
          "a require() next to an import of a name",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, C, { syntax: "require" }),
        ],
        [
          "a require() twice",
          toNode(A, B, { syntax: "require" }),
          toNode(A, B, { syntax: "require" }),
        ],
        [
          "an import() twice",
          toNode(A, B, { syntax: "dynamic-import" }),
          toNode(A, B, { syntax: "dynamic-import" }),
        ],
        [
          "an import() next to an import of a name",
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, B, { syntax: "dynamic-import" }),
        ],
        [
          "an import of a name next to a require()",
          toNode(A, B, { syntax: "require" }),
          toNode(A, C, { specifiers: specifiers("named", "x") }),
        ],
      ])("should not refuse %s", (_description, existing, added) => {
        // Act
        const error = check([existing], added);

        // Assert
        expect(error).toBeUndefined();
      });

      it("should name the first of the names of the dependency that another statement declares", () => {
        // Arrange
        const existing = [
          toNode(A, B, { specifiers: specifiers("named", "a", "b") }),
        ];
        const added = toNode(A, C, {
          specifiers: specifiers("named", "c", "b", "a"),
        });

        // Act
        const error = check(existing, added);

        // Assert
        expect(error).toBe(imported("b"));
      });

      it("should name the first of the names that the dependency exports and another statement exports", () => {
        // Arrange
        const existing = [
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "a", "b"),
          }),
        ];
        const added = toNode(A, C, {
          syntax: "export-from",
          specifiers: specifiers("named", "c", "b", "a"),
        });

        // Act
        const error = check(existing, added);

        // Assert
        expect(error).toBe(exported("b"));
      });

      it("should find the name in any of the other statements of the file", () => {
        // Arrange
        const existing = [
          toNode(A, B, { specifiers: specifiers("named", "a") }),
          toNode(B, C, { specifiers: specifiers("named", "x") }),
          toNode(A, C, { specifiers: specifiers("named", "b") }),
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "x"),
          }),
        ];
        const added = toExternal(A, "react", {
          specifiers: specifiers("named", "b"),
        });

        // Act
        const error = check(existing, added);

        // Assert
        expect(error).toBe(imported("b"));
      });

      it("should say that a name is imported in an import and exported in an export", () => {
        // Arrange
        const existing = [
          toNode(A, B, { specifiers: specifiers("named", "x") }),
          toNode(A, B, {
            syntax: "export-from",
            specifiers: specifiers("named", "y"),
          }),
        ];

        // Act
        const errors = [
          check(
            existing,
            toNode(A, C, { specifiers: specifiers("named", "x") })
          ),
          check(
            existing,
            toNode(A, C, {
              syntax: "export-from",
              specifiers: specifiers("named", "y"),
            })
          ),
        ];

        // Assert
        expect(errors).toEqual([imported("x"), exported("y")]);
      });

      it("should report the problems of the dependency before the names of the other statements", () => {
        // Arrange
        const existing = [
          toNode(A, B, { specifiers: specifiers("named", "x") }),
        ];
        const twice = toNode(A, C, {
          specifiers: specifiers("named", "x", "x"),
        });
        const invalid = toNode(A, C, {
          specifiers: specifiers("named", "1x", "x"),
        });
        const missing = toNode(A, "src/gone.js", {
          specifiers: specifiers("named", "x"),
        });

        // Act
        const errors = [
          check(existing, twice),
          check(existing, invalid),
          check(existing, missing),
        ];

        // Assert
        expect(errors).toEqual([
          'The name "x" is used twice in the statement.',
          '"1x" is not a valid name.',
          '"src/gone.js" is not a file of the sketch.',
        ]);
      });

      it("should not count the dependencies that the sketch does not have", () => {
        // Arrange
        const added = toNode(A, C, { specifiers: specifiers("named", "x") });

        // Act
        const error = getDependencyError(createSketch(TREE), added);

        // Assert
        expect(error).toBeUndefined();
      });
    });
  });

  describe("addDependency", () => {
    it("should add the dependency as the last of the sketch, so that it is the last line of its file", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B), toNode(B, C)]);
      const added = toExternal(A, "react", {
        specifiers: specifiers("default", "React"),
      });

      // Act
      const result = getSketch(addDependency(sketch, added));

      // Assert
      expect(result.dependencies).toEqual([toNode(A, B), toNode(B, C), added]);
      expect(getFileDependencies(result, A)).toEqual([toNode(A, B), added]);
    });

    it("should store the names in the order a statement writes them: the default name, then the namespace, then the named names, in the order given within each kind", () => {
      // Arrange
      const sketch = createSketch(TREE);
      const unordered = toNode(A, B, {
        specifiers: [
          ...specifiers("named", "c", "a"),
          ...specifiers("default", "b"),
        ],
      });

      // Act
      const result = getSketch(addDependency(sketch, unordered));

      // Assert
      expect(result.dependencies[0].specifiers).toEqual([
        ...specifiers("default", "b"),
        ...specifiers("named", "c", "a"),
      ]);
    });

    it("should store a default name before a namespace", () => {
      // Arrange
      const sketch = createSketch(TREE);
      const unordered = toNode(A, B, {
        specifiers: [
          ...specifiers("namespace", "ns"),
          ...specifiers("default", "b"),
        ],
      });

      // Act
      const result = getSketch(addDependency(sketch, unordered));

      // Assert
      expect(result.dependencies[0].specifiers).toEqual([
        ...specifiers("default", "b"),
        ...specifiers("namespace", "ns"),
      ]);
    });

    it("should not change the dependency given when it sorts its names", () => {
      // Arrange
      const sketch = createSketch(TREE);
      const unordered = toNode(A, B, {
        specifiers: [
          ...specifiers("named", "a"),
          ...specifiers("default", "b"),
        ],
      });
      const before = JSON.stringify(unordered);

      // Act
      addDependency(sketch, unordered);

      // Assert
      expect(JSON.stringify(unordered)).toBe(before);
    });

    it("should keep the tree and the config", () => {
      // Arrange
      const sketch = createSketch(TREE);

      // Act
      const result = getSketch(addDependency(sketch, toNode(A, B)));

      // Assert
      expect(result.tree).toBe(sketch.tree);
      expect(result.config).toBe(sketch.config);
    });

    it("should not change the sketch given", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);
      const before = JSON.stringify(sketch);

      // Act
      addDependency(sketch, toNode(B, C));

      // Assert
      expect(JSON.stringify(sketch)).toBe(before);
    });

    it("should refuse a dependency that the sketch cannot hold, with the reason", () => {
      // Arrange
      const sketch = createSketch(TREE);

      // Act
      const result = addDependency(sketch, toNode(A, A));

      // Assert
      expect(getError(result)).toBe("A file cannot depend on itself.");
    });

    it("should refuse a name that another statement of the file already imports, and keep the sketch as it is", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B, { specifiers: specifiers("named", "x") }),
      ]);
      const before = JSON.stringify(sketch);

      // Act
      const result = addDependency(
        sketch,
        toNode(A, C, { specifiers: specifiers("default", "x") })
      );

      // Assert
      expect(getError(result)).toBe(
        'The name "x" is already imported by another statement of the file.'
      );
      expect(JSON.stringify(sketch)).toBe(before);
    });

    it("should refuse a name that another statement of the file already exports", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("named", "x"),
        }),
      ]);

      // Act
      const result = addDependency(
        sketch,
        toNode(A, C, {
          syntax: "export-from",
          specifiers: specifiers("namespace", "x"),
        })
      );

      // Assert
      expect(getError(result)).toBe(
        'The name "x" is already exported by another statement of the file.'
      );
    });

    it("should add a name that another file imports", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(B, C, { specifiers: specifiers("named", "x") }),
      ]);
      const added = toNode(A, C, { specifiers: specifiers("named", "x") });

      // Act
      const result = getSketch(addDependency(sketch, added));

      // Assert
      expect(getFileDependencies(result, A)).toEqual([added]);
    });
  });

  describe("replaceDependency", () => {
    it("should replace the dependency in the same position of its file and of the sketch", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B),
        toNode(B, C),
        toNode(A, C),
        toNode(A, B, {
          importKind: "type",
          specifiers: specifiers("named", "T"),
        }),
      ]);
      const replacement = toExternal(A, "react");

      // Act
      const result = getSketch(
        replaceDependency(sketch, { path: A, index: 1 }, replacement)
      );

      // Assert
      expect(result.dependencies).toEqual([
        toNode(A, B),
        toNode(B, C),
        replacement,
        toNode(A, B, {
          importKind: "type",
          specifiers: specifiers("named", "T"),
        }),
      ]);
    });

    it("should store the names in the order a statement writes them", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);
      const unordered = toNode(A, C, {
        specifiers: [
          ...specifiers("named", "c", "a"),
          ...specifiers("default", "b"),
        ],
      });

      // Act
      const result = getSketch(
        replaceDependency(sketch, { path: A, index: 0 }, unordered)
      );

      // Assert
      expect(result.dependencies[0].specifiers).toEqual([
        ...specifiers("default", "b"),
        ...specifiers("named", "c", "a"),
      ]);
    });

    it("should not change the sketch given", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);
      const before = JSON.stringify(sketch);

      // Act
      replaceDependency(sketch, { path: A, index: 0 }, toNode(A, C));

      // Assert
      expect(JSON.stringify(sketch)).toBe(before);
    });

    it("should refuse a position that the file does not have", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B), toNode(B, C)]);

      // Act
      const past = replaceDependency(
        sketch,
        { path: A, index: 1 },
        toNode(A, C)
      );
      const negative = replaceDependency(
        sketch,
        { path: A, index: -1 },
        toNode(A, C)
      );
      const otherFile = replaceDependency(
        sketch,
        { path: C, index: 0 },
        toNode(C, A)
      );

      // Assert
      expect([getError(past), getError(negative), getError(otherFile)]).toEqual(
        [
          "There is no dependency at that line.",
          "There is no dependency at that line.",
          "There is no dependency at that line.",
        ]
      );
    });

    it("should refuse a dependency of another file", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);

      // Act
      const result = replaceDependency(
        sketch,
        { path: A, index: 0 },
        toNode(B, C)
      );

      // Assert
      expect(getError(result)).toBe(
        "A dependency cannot move to another file."
      );
    });

    it("should refuse a dependency that the sketch cannot hold, with the reason", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);

      // Act
      const result = replaceDependency(
        sketch,
        { path: A, index: 0 },
        toExternal(A, "")
      );

      // Assert
      expect(getError(result)).toBe("The module name is empty.");
    });

    it("should replace a dependency by one that keeps its own names", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B, { specifiers: specifiers("named", "x", "y as z") }),
        toNode(A, C, { specifiers: specifiers("named", "w") }),
      ]);
      const replacement = toNode(A, C, {
        specifiers: specifiers("named", "x", "y as z", "v"),
      });

      // Act
      const result = getSketch(
        replaceDependency(sketch, { path: A, index: 0 }, replacement)
      );

      // Assert
      expect(getFileDependencies(result, A)[0]).toEqual(replacement);
    });

    it("should replace an export by one that keeps its own names", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("namespace", "x"),
        }),
      ]);
      const replacement = toNode(A, C, {
        syntax: "export-from",
        specifiers: specifiers("namespace", "x"),
      });

      // Act
      const result = getSketch(
        replaceDependency(sketch, { path: A, index: 0 }, replacement)
      );

      // Assert
      expect(getFileDependencies(result, A)).toEqual([replacement]);
    });

    it("should leave out the dependency of its file at the position, and not the one of another file that is in the same position of the sketch", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(B, C, { specifiers: specifiers("named", "y") }),
        toNode(A, B, { specifiers: specifiers("named", "x") }),
        toNode(A, C, { specifiers: specifiers("named", "w") }),
      ]);
      const replacement = toNode(A, C, {
        specifiers: specifiers("named", "x"),
      });

      // Act
      const result = getSketch(
        replaceDependency(sketch, { path: A, index: 0 }, replacement)
      );

      // Assert
      expect(result.dependencies).toEqual([
        toNode(B, C, { specifiers: specifiers("named", "y") }),
        replacement,
        toNode(A, C, { specifiers: specifiers("named", "w") }),
      ]);
    });

    it("should refuse a dependency that takes a name another statement of the file imports, and keep the sketch as it is", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B, { specifiers: specifiers("named", "x") }),
        toNode(A, C, { specifiers: specifiers("named", "w") }),
      ]);
      const before = JSON.stringify(sketch);

      // Act
      const result = replaceDependency(
        sketch,
        { path: A, index: 0 },
        toNode(A, B, { specifiers: specifiers("named", "x", "w") })
      );

      // Assert
      expect(getError(result)).toBe(
        'The name "w" is already imported by another statement of the file.'
      );
      expect(JSON.stringify(sketch)).toBe(before);
    });

    it("should refuse a dependency that takes a name another statement of the file exports", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("named", "x"),
        }),
        toNode(A, C, {
          syntax: "export-from",
          specifiers: specifiers("named", "w"),
        }),
      ]);

      // Act
      const result = replaceDependency(
        sketch,
        { path: A, index: 1 },
        toNode(A, C, {
          syntax: "export-from",
          specifiers: specifiers("named", "v as x"),
        })
      );

      // Assert
      expect(getError(result)).toBe(
        'The name "x" is already exported by another statement of the file.'
      );
    });
  });

  describe("removeDependency", () => {
    it("should remove the dependency and move up the ones after it in its file", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode(A, B),
        toNode(B, C),
        toNode(A, C),
        toExternal(A, "react"),
      ]);

      // Act
      const result = getSketch(removeDependency(sketch, { path: A, index: 1 }));

      // Assert
      expect(result.dependencies).toEqual([
        toNode(A, B),
        toNode(B, C),
        toExternal(A, "react"),
      ]);
      expect(getDependency(result, { path: A, index: 1 })).toEqual(
        toExternal(A, "react")
      );
    });

    it("should remove the only dependency of a file", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);

      // Act
      const result = getSketch(removeDependency(sketch, { path: A, index: 0 }));

      // Assert
      expect(result.dependencies).toEqual([]);
    });

    it("should not change the sketch given", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);
      const before = JSON.stringify(sketch);

      // Act
      removeDependency(sketch, { path: A, index: 0 });

      // Assert
      expect(JSON.stringify(sketch)).toBe(before);
    });

    it("should refuse a position that the file does not have", () => {
      // Arrange
      const sketch = createSketch(TREE, [toNode(A, B)]);

      // Act
      const result = removeDependency(sketch, { path: A, index: 1 });

      // Assert
      expect(getError(result)).toBe("There is no dependency at that line.");
    });
  });
});
