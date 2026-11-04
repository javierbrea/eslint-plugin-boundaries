import type { Sketch, SketchDependency, SketchNode } from "../contract";
import { QUICK_START_EXAMPLE } from "../examples";

import { fromText, readTextProblems, toText } from "./TextMode";

/**
 * Creates a dependency of a file on a node of the sketch.
 * @param from The file that has the dependency.
 * @param path The node it points to.
 */
function toNode(from: string, path: string): SketchDependency {
  return {
    from,
    target: { kind: "node", path },
    syntax: "import",
    importKind: "value",
    specifiers: [],
  };
}

/**
 * Creates a dependency of a file on an external module.
 * @param from The file that has the dependency.
 * @param moduleName The module it points to.
 */
function toExternal(from: string, moduleName: string): SketchDependency {
  return {
    from,
    target: { kind: "external", name: moduleName },
    syntax: "import",
    importKind: "value",
    specifiers: [],
  };
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
 * Gets the paths of the nodes of a sketch.
 * @param sketch The sketch to read.
 */
function paths(sketch: Sketch): string[] {
  return sketch.tree.map(({ path, kind }) =>
    kind === "folder" ? `${path}/` : path
  );
}

const SKETCH = createSketch([
  { path: "src/components/Price/index.js", kind: "file" },
  { path: "src/helpers/format.js", kind: "file" },
  { path: "src/pages", kind: "folder" },
  { path: "src/index.js", kind: "file" },
  { path: "docs/guides", kind: "folder" },
]);

describe("TextMode", () => {
  describe("toText", () => {
    it("should write the config first, then a line per file and per empty folder", () => {
      // Act
      const text = toText(SKETCH);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "docs/guides/",
          "src/components/Price/index.js",
          "src/helpers/format.js",
          "src/pages/",
          "src/index.js",
          "",
        ].join("\n")
      );
    });

    it("should write the quick start example in the order of its tree", () => {
      // Act
      const text = toText(QUICK_START_EXAMPLE.sketch);

      // Assert
      expect(text).toBe(
        [
          "eslint.config.js",
          "src/components/atoms/Button/Button.css",
          "src/components/atoms/Button/Button.spec.js",
          "src/components/atoms/Button/index.js",
          "src/helpers/format/index.js",
          "src/modules/checkout/index.js",
          "src/index.js",
          "",
        ].join("\n")
      );
    });

    it("should write only the config line for an empty sketch", () => {
      // Act
      const text = toText(createSketch([]));

      // Assert
      expect(text).toBe("eslint.config.js\n");
    });

    it("should not write dependencies", () => {
      // Arrange
      const sketch = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe(toText(SKETCH));
    });

    it("should not list a folder that the nodes under it imply", () => {
      // Arrange
      const sketch = createSketch([
        { path: "src", kind: "folder" },
        { path: "src/index.js", kind: "file" },
      ]);

      // Act
      const text = toText(sketch);

      // Assert
      expect(text).toBe("eslint.config.js\nsrc/index.js\n");
    });
  });

  describe("fromText", () => {
    it("should read a path per line, with a trailing slash for a folder", () => {
      // Arrange
      const text =
        "eslint.config.js\nsrc/index.js\nsrc/helpers/format.js\ndocs/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual([
        "docs/",
        "src/helpers/format.js",
        "src/index.js",
      ]);
      expect(problems).toEqual([]);
    });

    it("should skip blank lines and the config line, however it is written", () => {
      // Arrange
      const text =
        "\n   \n./eslint.config.js\n\t\nsrc/index.js\n\\eslint.config.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should clean up each path", () => {
      // Arrange
      const text = "./src\\index.js \t\n/src//helpers/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/helpers/", "src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should read Windows line endings", () => {
      // Arrange
      const text = "eslint.config.js\r\nsrc/index.js\r\nsrc/pages/\r\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/pages/", "src/index.js"]);
      expect(problems).toEqual([]);
    });

    it("should read text without a final newline", () => {
      // Act
      const { sketch } = fromText("src/index.js", createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
    });

    it("should leave out an indented line as a problem", () => {
      // Arrange
      const text = [
        "src/index.js",
        '  import "./helpers";',
        '\timport React from "react";',
        "src/helpers/index.js",
      ].join("\n");

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/helpers/index.js", "src/index.js"]);
      expect(problems).toEqual([
        {
          line: 2,
          text: '  import "./helpers";',
          reason: "Dependencies are not written in text mode yet.",
        },
        {
          line: 3,
          text: '\timport React from "react";',
          reason: "Dependencies are not written in text mode yet.",
        },
      ]);
    });

    it("should leave out a duplicate as a problem and keep the first", () => {
      // Arrange
      const text = "src/index.js\nsrc/helpers/\nsrc/index.js\n./src/helpers/\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/helpers/", "src/index.js"]);
      expect(problems).toEqual([
        { line: 3, text: "src/index.js", reason: "That path already exists." },
        {
          line: 4,
          text: "./src/helpers/",
          reason: "That path already exists.",
        },
      ]);
    });

    it("should leave out an invalid path as a problem", () => {
      // Arrange
      const text =
        "src/../index.js\neslint.config.js/\nsrc/a\u0001b.js\n/\neslint.config.js/index.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.tree).toEqual([]);
      expect(problems).toEqual([
        {
          line: 1,
          text: "src/../index.js",
          reason: "The path cannot have `.` or `..` segments.",
        },
        {
          line: 2,
          text: "eslint.config.js/",
          reason:
            "eslint.config.js at the root is the config node, not a file or a folder.",
        },
        {
          line: 3,
          text: "src/a\u0001b.js",
          reason: "The path cannot have control characters.",
        },
        { line: 4, text: "/", reason: "The path is empty." },
        {
          line: 5,
          text: "eslint.config.js/index.js",
          reason:
            "eslint.config.js at the root is the config node, not a file or a folder.",
        },
      ]);
    });

    it("should leave out a path under a file as a problem", () => {
      // Arrange
      const text = "src/index.js\nsrc/index.js/other.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/index.js"]);
      expect(problems).toEqual([
        {
          line: 2,
          text: "src/index.js/other.js",
          reason: '"src/index.js" is a file, so nothing can be added under it.',
        },
      ]);
    });

    it("should leave out a file where a folder is, and the other way round", () => {
      // Arrange
      const text = "src/a.js\nsrc/a.js/\nsrc/b/c.js\nsrc/b\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(paths(sketch)).toEqual(["src/b/c.js", "src/a.js"]);
      expect(problems.map(({ line, reason }) => ({ line, reason }))).toEqual([
        { line: 2, reason: "A file already exists at that path." },
        { line: 4, reason: "A folder already exists at that path." },
      ]);
    });

    it("should not repeat a folder that the files of other lines imply", () => {
      // Arrange
      const text = "src/\nsrc/index.js\n";

      // Act
      const { sketch, problems } = fromText(text, createSketch([]));

      // Assert
      expect(sketch.tree).toEqual([{ path: "src/index.js", kind: "file" }]);
      expect(problems).toEqual([]);
    });

    it("should keep the config of the sketch given", () => {
      // Arrange
      const original = createSketch([]);

      // Act
      const { sketch } = fromText("src/index.js\n", original);

      // Assert
      expect(sketch.config).toBe(original.config);
    });

    it("should keep the dependencies whose file and target are still in the tree", () => {
      // Arrange
      const original = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
        toNode("src/index.js", "src/helpers"),
        toNode("src/index.js", "src/pages"),
        toExternal("src/index.js", "react"),
        toNode("src/removed.js", "src/helpers/format.js"),
        toNode("src/index.js", "src/removed.js"),
        toExternal("src/removed.js", "react"),
        toNode("src/pages", "src/index.js"),
      ]);
      const text = "src/index.js\nsrc/helpers/format.js\nsrc/pages/\n";

      // Act
      const { sketch } = fromText(text, original);

      // Assert
      expect(sketch.dependencies).toEqual([
        toNode("src/index.js", "src/helpers/format.js"),
        toNode("src/index.js", "src/helpers"),
        toNode("src/index.js", "src/pages"),
        toExternal("src/index.js", "react"),
      ]);
    });

    it("should not change the sketch given", () => {
      // Arrange
      const before = JSON.stringify(SKETCH);

      // Act
      fromText("src/other.js\n", SKETCH);

      // Assert
      expect(JSON.stringify(SKETCH)).toBe(before);
    });
  });

  describe("readTextProblems", () => {
    it("should report the lines that fromText leaves out", () => {
      // Arrange
      const text = "src/a.js\n  import x\nsrc/a.js\n../b.js\n";

      // Act
      const problems = readTextProblems(text);

      // Assert
      expect(problems).toEqual(fromText(text, SKETCH).problems);
    });

    it("should report the same lines whatever the sketch is", () => {
      // Arrange
      const text = "src/a.js/\nsrc/a.js\n";

      // Act
      const problems = readTextProblems(text);

      // Assert
      expect(problems).toEqual(fromText(text, createSketch([])).problems);
    });

    it("should report nothing for a text whose lines can all be read", () => {
      // Act
      const problems = readTextProblems(toText(SKETCH));

      // Assert
      expect(problems).toEqual([]);
    });
  });

  describe("round trip", () => {
    it("should return the quick start example from its own text", () => {
      // Act
      const { sketch, problems } = fromText(
        toText(QUICK_START_EXAMPLE.sketch),
        QUICK_START_EXAMPLE.sketch
      );

      // Assert
      expect(sketch).toEqual(QUICK_START_EXAMPLE.sketch);
      expect(problems).toEqual([]);
    });

    it("should return a sketch with empty folders from its own text", () => {
      // Arrange
      const original = createSketch(
        [
          { path: "docs/guides", kind: "folder" },
          { path: "src/components/Price/index.js", kind: "file" },
          { path: "src/helpers/format.js", kind: "file" },
          { path: "src/pages", kind: "folder" },
          { path: "src/index.js", kind: "file" },
          { path: "empty", kind: "folder" },
        ],
        [
          toNode("src/index.js", "src/helpers/format.js"),
          toNode("src/index.js", "src/pages"),
          toExternal("src/components/Price/index.js", "react"),
        ]
      );

      // Act
      const { sketch, problems } = fromText(toText(original), original);

      // Assert
      expect(sketch).toEqual({
        ...original,
        tree: [
          { path: "docs/guides", kind: "folder" },
          { path: "empty", kind: "folder" },
          { path: "src/components/Price/index.js", kind: "file" },
          { path: "src/helpers/format.js", kind: "file" },
          { path: "src/pages", kind: "folder" },
          { path: "src/index.js", kind: "file" },
        ],
      });
      expect(problems).toEqual([]);
    });

    it("should keep the same files and folders when the nodes are in another order", () => {
      // Arrange
      const original = createSketch([...SKETCH.tree].reverse());

      // Act
      const { sketch } = fromText(toText(original), original);

      // Assert
      expect(
        [...sketch.tree].sort((a, b) => a.path.localeCompare(b.path))
      ).toEqual(
        [...original.tree].sort((a, b) => a.path.localeCompare(b.path))
      );
    });

    it("should return an empty sketch from its own text", () => {
      // Arrange
      const original = createSketch([]);

      // Act
      const { sketch, problems } = fromText(toText(original), original);

      // Assert
      expect(sketch).toEqual(original);
      expect(problems).toEqual([]);
    });
  });
});
