import type {
  Sketch,
  SketchDependency,
  SketchNode,
  SketchSpecifier,
} from "@/contract";

import {
  findSameSketch,
  isSameDependency,
  isSameProject,
  isSameSketch,
} from "./compare";

/**
 * Creates a dependency of a file on a node of the sketch.
 * @param from The file that has the dependency.
 * @param path The node it points to.
 * @param overrides What differs from an `import` of values with no specifiers.
 */
function toNode(
  from: string,
  path: string,
  overrides: Partial<SketchDependency> = {}
): SketchDependency {
  return {
    from,
    target: { kind: "node", path },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    ...overrides,
  };
}

/**
 * Creates a sketch with the nodes and the dependencies given.
 * @param tree The nodes of the sketch.
 * @param dependencies The dependencies of the sketch.
 * @param config The config text of the sketch.
 */
function createSketch(
  tree: readonly SketchNode[],
  dependencies: readonly SketchDependency[] = [],
  config = "{ settings: {}, rules: {} }"
): Sketch {
  return { config, tree, dependencies };
}

const TREE: readonly SketchNode[] = [
  { path: "docs", kind: "folder" },
  { path: "src/helpers/format.js", kind: "file" },
  { path: "src/index.js", kind: "file" },
];

describe("Compare", () => {
  describe("isSameProject", () => {
    it("should be true for the same sketch", () => {
      // Arrange
      const sketch = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);

      // Act
      const result = isSameProject(sketch, sketch);

      // Assert
      expect(result).toBe(true);
    });

    it("should be true for sketches that hold the same data in other objects", () => {
      // Arrange
      const first = createSketch(
        TREE.map((node) => ({ ...node })),
        [
          toNode("src/index.js", "src/helpers/format.js", {
            specifiers: [{ kind: "named", name: "format", alias: "fmt" }],
          }),
        ]
      );
      const second = createSketch(
        TREE.map((node) => ({ ...node })),
        [
          toNode("src/index.js", "src/helpers/format.js", {
            specifiers: [{ kind: "named", name: "format", alias: "fmt" }],
          }),
        ]
      );

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(true);
    });

    it("should be true for an empty project", () => {
      // Act
      const result = isSameProject(createSketch([]), createSketch([]));

      // Assert
      expect(result).toBe(true);
    });

    it("should not compare the config", () => {
      // Arrange
      const first = createSketch(TREE, [], "{ settings: {}, rules: {} }");
      const second = createSketch(TREE, [], "{}");

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(true);
    });

    it("should be false when a node is added", () => {
      // Arrange
      const first = createSketch(TREE);
      const second = createSketch([...TREE, { path: "lib", kind: "folder" }]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a node has another path", () => {
      // Arrange
      const first = createSketch(TREE);
      const second = createSketch([
        TREE[0],
        { path: "src/helpers/date.js", kind: "file" },
        TREE[2],
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a node has another kind", () => {
      // Arrange
      const first = createSketch(TREE);
      const second = createSketch([
        { path: "docs", kind: "file" },
        ...TREE.slice(1),
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when the nodes are in another order", () => {
      // Arrange
      const first = createSketch(TREE);
      const second = createSketch([...TREE].reverse());

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a dependency is added", () => {
      // Arrange
      const first = createSketch(TREE);
      const second = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a dependency points to another node", () => {
      // Arrange
      const first = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);
      const second = createSketch(TREE, [toNode("src/index.js", "docs")]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a dependency points to a node and the other to a module", () => {
      // Arrange
      const first = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);
      const second = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js", {
          target: { kind: "external", name: "react" },
        }),
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a dependency has another syntax", () => {
      // Arrange
      const first = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);
      const second = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js", { syntax: "require" }),
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a specifier is added", () => {
      // Arrange
      const first = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);
      const second = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js", {
          specifiers: [{ kind: "default", name: "format" }],
        }),
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when a specifier has an alias and the other has none", () => {
      // Arrange
      const first = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js", {
          specifiers: [{ kind: "named", name: "format" }],
        }),
      ]);
      const second = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js", {
          specifiers: [{ kind: "named", name: "format", alias: "fmt" }],
        }),
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when two specifiers have the same number of keys but different ones", () => {
      // Arrange
      const first = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js", {
          specifiers: [{ kind: "named", name: "format", alias: "fmt" }],
        }),
      ]);
      const second = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js", {
          specifiers: [
            {
              kind: "named",
              name: "format",
              other: "fmt",
            } as unknown as SketchSpecifier,
          ],
        }),
      ]);

      // Act
      const result = isSameProject(first, second);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("isSameSketch", () => {
    it("should be true for sketches that hold the same config, tree and dependencies in other objects", () => {
      // Arrange
      const first = createSketch(
        TREE.map((node) => ({ ...node })),
        [toNode("src/index.js", "src/helpers/format.js")]
      );
      const second = createSketch(
        TREE.map((node) => ({ ...node })),
        [toNode("src/index.js", "src/helpers/format.js")]
      );

      // Act
      const result = isSameSketch(first, second);

      // Assert
      expect(result).toBe(true);
    });

    it("should be false when only the config text differs", () => {
      // Arrange
      const first = createSketch(TREE, [], "{ settings: {}, rules: {} }");
      const second = createSketch(TREE, [], "{ settings: {}, rules: [] }");

      // Act
      const result = isSameSketch(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when only the tree differs", () => {
      // Arrange
      const first = createSketch(TREE);
      const second = createSketch([
        ...TREE,
        { path: "src/a.js", kind: "file" },
      ]);

      // Act
      const result = isSameSketch(first, second);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when only the dependencies differ", () => {
      // Arrange
      const first = createSketch(TREE, []);
      const second = createSketch(TREE, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);

      // Act
      const result = isSameSketch(first, second);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("findSameSketch", () => {
    it("should find the first candidate that holds the same sketch", () => {
      // Arrange
      const sketch = createSketch(TREE);
      const candidates = [
        { id: "other", sketch: createSketch([]) },
        { id: "first", sketch: { ...sketch } },
        { id: "second", sketch: { ...sketch } },
      ];

      // Act
      const found = findSameSketch(candidates, sketch);

      // Assert
      expect(found).toBe(candidates[1]);
    });

    it("should find none when no candidate holds the same sketch", () => {
      // Arrange
      const candidates = [{ id: "other", sketch: createSketch([]) }];

      // Act
      const found = findSameSketch(candidates, createSketch(TREE));

      // Assert
      expect(found).toBeUndefined();
    });
  });

  describe("isSameDependency", () => {
    it("should be true for two objects that hold the same data", () => {
      // Arrange
      const first = toNode("src/index.js", "src/helpers/format.js", {
        specifiers: [{ kind: "named", name: "format", alias: "fmt" }],
      });
      const second = toNode("src/index.js", "src/helpers/format.js", {
        specifiers: [{ kind: "named", name: "format", alias: "fmt" }],
      });

      // Act
      const result = isSameDependency(first, second);

      // Assert
      expect(result).toBe(true);
    });

    it.each([
      ["file", toNode("src/other.js", "src/helpers/format.js")],
      ["target", toNode("src/index.js", "src/other.js")],
      [
        "syntax",
        toNode("src/index.js", "src/helpers/format.js", { syntax: "require" }),
      ],
      [
        "kind",
        toNode("src/index.js", "src/helpers/format.js", { importKind: "type" }),
      ],
      [
        "names",
        toNode("src/index.js", "src/helpers/format.js", {
          specifiers: [{ kind: "named", name: "format" }],
        }),
      ],
    ])("should be false when the %s differs", (_label, other) => {
      // Arrange
      const dependency = toNode("src/index.js", "src/helpers/format.js");

      // Act
      const result = isSameDependency(dependency, other);

      // Assert
      expect(result).toBe(false);
    });
  });
});
