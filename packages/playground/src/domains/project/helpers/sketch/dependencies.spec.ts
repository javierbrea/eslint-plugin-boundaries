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
  removeDependency,
  replaceDependency,
} from "./dependencies";
import type { EditResult } from "./sketch.types";

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
  { path: "src/it's.js", kind: "file" },
  { path: 'src/say"hi".js', kind: "file" },
  { path: "src/pages", kind: "folder" },
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
      [
        "a target with a double quote in its path",
        toNode(A, 'src/say"hi".js'),
        "A statement cannot write a path that has quotes or backslashes.",
      ],
      [
        "a target with a single quote in its path",
        toNode(A, "src/it's.js"),
        "A statement cannot write a path that has quotes or backslashes.",
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
        "two default names in an import",
        toNode(A, B, { specifiers: specifiers("default", "a", "b") }),
        "An import holds one default name.",
      ],
      [
        "a default name in an export",
        toNode(A, B, {
          syntax: "export-from",
          specifiers: specifiers("default", "a"),
        }),
        "`export … from` holds named names or one namespace, not a default name.",
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
        { tree: [{ path: A, kind: "file" }] },
        toNode(A, B)
      );

      // Assert
      expect(error).toBe('"src/b.js" is not a file of the sketch.');
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
