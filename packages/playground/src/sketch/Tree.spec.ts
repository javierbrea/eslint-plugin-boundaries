import type { Sketch, SketchNode } from "@/contract";

import {
  buildTree,
  canonicalizeNodes,
  countFilesUnder,
  getAddError,
  getFiles,
  getNodeKind,
  hasNode,
} from "./Tree";

/**
 * Creates a sketch with the nodes given.
 * @param tree The nodes of the sketch.
 */
function createSketch(tree: readonly SketchNode[]): Sketch {
  return { config: "{}", tree, dependencies: [] };
}

/**
 * Creates the file nodes of some paths.
 * @param paths The paths of the files.
 */
function files(...paths: string[]): SketchNode[] {
  return paths.map((path) => ({ path, kind: "file" }));
}

describe("Tree", () => {
  describe("buildTree", () => {
    it("should return no items for an empty sketch", () => {
      // Act
      const tree = buildTree(createSketch([]));

      // Assert
      expect(tree).toEqual([]);
    });

    it("should imply the folders from the paths of the files", () => {
      // Arrange
      const sketch = createSketch(files("src/components/Price.js"));

      // Act
      const tree = buildTree(sketch);

      // Assert
      expect(tree).toEqual([
        {
          path: "src",
          name: "src",
          kind: "folder",
          children: [
            {
              path: "src/components",
              name: "components",
              kind: "folder",
              children: [
                {
                  path: "src/components/Price.js",
                  name: "Price.js",
                  kind: "file",
                  children: [],
                },
              ],
            },
          ],
        },
      ]);
    });

    it("should add an empty folder for a folder node", () => {
      // Arrange
      const sketch = createSketch([{ path: "src/pages", kind: "folder" }]);

      // Act
      const tree = buildTree(sketch);

      // Assert
      expect(tree).toEqual([
        {
          path: "src",
          name: "src",
          kind: "folder",
          children: [
            { path: "src/pages", name: "pages", kind: "folder", children: [] },
          ],
        },
      ]);
    });

    it("should not repeat a folder that a node declares and the files imply", () => {
      // Arrange
      const sketch = createSketch([
        { path: "src", kind: "folder" },
        { path: "src/index.js", kind: "file" },
      ]);

      // Act
      const tree = buildTree(sketch);

      // Assert
      expect(tree).toHaveLength(1);
      expect(tree[0].children.map((item) => item.path)).toEqual([
        "src/index.js",
      ]);
    });

    it("should show a file node that has something under it as a folder", () => {
      // Arrange
      const sketch = createSketch(files("src", "src/index.js"));

      // Act
      const tree = buildTree(sketch);

      // Assert
      expect(tree.map(({ path, kind }) => ({ path, kind }))).toEqual([
        { path: "src", kind: "folder" },
      ]);
    });

    it("should sort folders first and then files, each by name", () => {
      // Arrange
      const sketch = createSketch([
        ...files("zeta.js", "alpha.js"),
        ...files("src/b.js", "src/a.js", "src/nested/c.js", "lib/index.js"),
      ]);

      // Act
      const tree = buildTree(sketch);

      // Assert
      expect(tree.map((item) => item.path)).toEqual([
        "lib",
        "src",
        "alpha.js",
        "zeta.js",
      ]);
      expect(tree[1].children.map((item) => item.path)).toEqual([
        "src/nested",
        "src/a.js",
        "src/b.js",
      ]);
    });

    it("should compare the numbers inside the names by value", () => {
      // Arrange
      const sketch = createSketch(files("file10.js", "file2.js", "file1.js"));

      // Act
      const tree = buildTree(sketch);

      // Assert
      expect(tree.map((item) => item.name)).toEqual([
        "file1.js",
        "file2.js",
        "file10.js",
      ]);
    });

    it("should ignore the case when it sorts the names", () => {
      // Arrange
      const sketch = createSketch(files("b.js", "C.js", "a.js"));

      // Act
      const tree = buildTree(sketch);

      // Assert
      expect(tree.map((item) => item.name)).toEqual(["a.js", "b.js", "C.js"]);
    });

    it("should order names that differ only by case the same way whatever the input order", () => {
      // Arrange
      const forward = createSketch(files("a.js", "A.js"));
      const backward = createSketch(files("A.js", "a.js"));

      // Act
      const forwardNames = buildTree(forward).map((item) => item.name);
      const backwardNames = buildTree(backward).map((item) => item.name);

      // Assert
      expect(forwardNames).toEqual(backwardNames);
    });

    it("should not change the sketch", () => {
      // Arrange
      const sketch = createSketch(files("b.js", "a.js"));

      // Act
      buildTree(sketch);

      // Assert
      expect(sketch.tree.map((node) => node.path)).toEqual(["b.js", "a.js"]);
    });
  });

  describe("canonicalizeNodes", () => {
    it("should put the nodes in the order of the tree", () => {
      // Arrange
      const nodes = files("src/index.js", "src/modules/a.js", "readme.md");

      // Act
      const result = canonicalizeNodes(nodes);

      // Assert
      expect(result.map((node) => node.path)).toEqual([
        "src/modules/a.js",
        "src/index.js",
        "readme.md",
      ]);
    });

    it("should drop the folders that other nodes imply and keep the empty ones", () => {
      // Arrange
      const nodes: SketchNode[] = [
        { path: "src", kind: "folder" },
        { path: "src/index.js", kind: "file" },
        { path: "docs/guides", kind: "folder" },
        { path: "docs", kind: "folder" },
      ];

      // Act
      const result = canonicalizeNodes(nodes);

      // Assert
      expect(result).toEqual([
        { path: "docs/guides", kind: "folder" },
        { path: "src/index.js", kind: "file" },
      ]);
    });
  });

  describe("getFiles", () => {
    it("should return the paths of the files in the order of the tree", () => {
      // Arrange
      const sketch = createSketch([
        ...files("src/index.js", "src/helpers/format.js"),
        { path: "src/pages", kind: "folder" },
      ]);

      // Act
      const result = getFiles(sketch);

      // Assert
      expect(result).toEqual(["src/helpers/format.js", "src/index.js"]);
    });

    it("should return nothing for an empty sketch", () => {
      // Act
      const result = getFiles(createSketch([]));

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("countFilesUnder", () => {
    const sketch = createSketch([
      ...files(
        "src/index.js",
        "src/helpers/format.js",
        "src/helpers/date/parse.js",
        "src/helpersAndMore/index.js"
      ),
      { path: "docs", kind: "folder" },
    ]);

    it("should count the files of a folder at any depth", () => {
      // Act
      const result = countFilesUnder(sketch, "src");

      // Assert
      expect(result).toBe(4);
    });

    it("should count the files of a folder inside another", () => {
      // Act
      const result = countFilesUnder(sketch, "src/helpers");

      // Assert
      expect(result).toBe(2);
    });

    it("should not count the files of a folder that only shares the start of the name", () => {
      // Act
      const result = countFilesUnder(sketch, "src/helpers/date");

      // Assert
      expect(result).toBe(1);
    });

    it("should count the files under a node that is declared as a file, which is a folder when it has nodes under it", () => {
      // Arrange
      const declared = createSketch([
        { path: "src", kind: "file" },
        ...files("src/index.js"),
      ]);

      // Act
      const result = countFilesUnder(declared, "src");

      // Assert
      expect(result).toBe(1);
    });

    it.each([
      ["an empty folder", "docs"],
      ["a file", "src/index.js"],
      ["a path with no node", "lib"],
    ])("should count no file for %s", (_case, path) => {
      // Act
      const result = countFilesUnder(sketch, path);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe("getNodeKind", () => {
    const nodes: SketchNode[] = [
      ...files("src/index.js"),
      { path: "docs", kind: "folder" },
    ];

    it("should return file for a file", () => {
      // Act
      const kind = getNodeKind(nodes, "src/index.js");

      // Assert
      expect(kind).toBe("file");
    });

    it("should return folder for a folder node", () => {
      // Act
      const kind = getNodeKind(nodes, "docs");

      // Assert
      expect(kind).toBe("folder");
    });

    it("should return folder for a folder that a file implies", () => {
      // Act
      const kind = getNodeKind(nodes, "src");

      // Assert
      expect(kind).toBe("folder");
    });

    it("should return undefined when there is nothing at the path", () => {
      // Act
      const kind = getNodeKind(nodes, "lib");

      // Assert
      expect(kind).toBeUndefined();
    });

    it("should not take a path that only starts with the same text as the folder", () => {
      // Act
      const kind = getNodeKind(nodes, "sr");

      // Assert
      expect(kind).toBeUndefined();
    });
  });

  describe("hasNode", () => {
    const sketch = createSketch(files("src/index.js"));

    it("should be true for a file", () => {
      // Act
      const result = hasNode(sketch, "src/index.js");

      // Assert
      expect(result).toBe(true);
    });

    it("should be true for an implied folder", () => {
      // Act
      const result = hasNode(sketch, "src");

      // Assert
      expect(result).toBe(true);
    });

    it("should be false for a path without a node", () => {
      // Act
      const result = hasNode(sketch, "lib");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getAddError", () => {
    const nodes: SketchNode[] = [
      ...files("src/index.js", "readme.md"),
      { path: "docs", kind: "folder" },
    ];

    it("should return undefined for a free path", () => {
      // Act
      const error = getAddError(nodes, "src/new.js", "file");

      // Assert
      expect(error).toBeUndefined();
    });

    it("should return undefined for a path under a folder", () => {
      // Act
      const error = getAddError(nodes, "docs/guide.md", "file");

      // Assert
      expect(error).toBeUndefined();
    });

    it("should refuse an invalid path", () => {
      // Act
      const error = getAddError(nodes, "src/../new.js", "file");

      // Assert
      expect(error).toBe("The path cannot have `.` or `..` segments.");
    });

    it("should refuse a file where there is a file", () => {
      // Act
      const error = getAddError(nodes, "src/index.js", "file");

      // Assert
      expect(error).toBe("That path already exists.");
    });

    it("should refuse a folder where there is a folder, implied or not", () => {
      // Act
      const errors = [
        getAddError(nodes, "src", "folder"),
        getAddError(nodes, "docs", "folder"),
      ];

      // Assert
      expect(errors).toEqual([
        "That path already exists.",
        "That path already exists.",
      ]);
    });

    it("should refuse a file where there is a folder", () => {
      // Act
      const error = getAddError(nodes, "src", "file");

      // Assert
      expect(error).toBe("A folder already exists at that path.");
    });

    it("should refuse a folder where there is a file", () => {
      // Act
      const error = getAddError(nodes, "readme.md", "folder");

      // Assert
      expect(error).toBe("A file already exists at that path.");
    });

    it("should refuse a path under a file", () => {
      // Act
      const error = getAddError(nodes, "src/index.js/new.js", "file");

      // Assert
      expect(error).toBe(
        '"src/index.js" is a file, so nothing can be added under it.'
      );
    });
  });
});
