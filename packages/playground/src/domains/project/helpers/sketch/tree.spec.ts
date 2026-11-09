import type { Sketch, SketchNode } from "@/contract";

import { MAX_PATH_SEGMENTS } from "./sketch.constants";
import {
  buildTree,
  canonicalizeNodes,
  countFilesUnder,
  createNodeIndex,
  getAddError,
  getFiles,
  getNodeKind,
  hasNode,
} from "./tree";

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

/**
 * A small deterministic generator, so that a failure can be reproduced.
 * @param seed The number it starts from.
 * @returns A function that gives a number from 0 up to, not including, 1 each time it is called.
 */
function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);

    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every path of up to three segments made of the names `a`, `b` and `c`, and a name that only one path has */
const UNIVERSE: readonly string[] = (() => {
  const names = ["a", "b", "c"];
  const paths: string[] = [];
  let level: string[] = [""];

  for (let depth = 0; depth < 3; depth += 1) {
    level = level.flatMap((folder) =>
      names.map((segment) => (folder === "" ? segment : `${folder}/${segment}`))
    );
    paths.push(...level);
  }
  return paths;
})();

/**
 * Lists the paths of the universe that the index and the scan of the nodes answer differently.
 * @param index The index of the nodes.
 * @param nodes The nodes the index was given.
 * @returns What differs, with the nodes. It is empty when they answer the same.
 */
function findKindDifferences(
  index: ReturnType<typeof createNodeIndex>,
  nodes: readonly SketchNode[]
): unknown[] {
  return UNIVERSE.filter(
    (path) => index.kindOf(path) !== getNodeKind(nodes, path)
  ).map((path) => ({ nodes: [...nodes], path, kind: index.kindOf(path) }));
}

/**
 * Feeds sequences of random nodes to an index and to the scan of the nodes before them, and sets apart what they answer differently.
 * @param seed The number the generator starts from.
 * @param onlyAddable Whether to add only the nodes that the scan accepts, as a check of a list does, or any node, which makes lists that no check would let in.
 * @returns What differs, with the nodes that were added by then. It is empty when they answer the same.
 */
function findDifferences(seed: number, onlyAddable: boolean): unknown[] {
  const random = createRandom(seed);
  const differences: unknown[] = [];

  for (let sequence = 0; sequence < 120; sequence += 1) {
    const nodes: SketchNode[] = [];
    const index = createNodeIndex();

    for (let step = 0; step < 10; step += 1) {
      const path = UNIVERSE[Math.floor(random() * UNIVERSE.length)];
      const kind = random() < 0.7 ? "file" : "folder";
      const expected = getAddError(nodes, path, kind);
      const actual = index.getAddError(path, kind);

      if (expected !== actual) {
        differences.push({ nodes: [...nodes], path, kind, expected, actual });
      }
      if (!onlyAddable || expected === undefined) {
        nodes.push({ path, kind });
        index.add({ path, kind });
      }
      differences.push(...findKindDifferences(index, nodes));
    }
  }
  return differences;
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

    it("should give each item the path from the root, down to the deepest path allowed", () => {
      // Arrange
      const segments = Array.from(
        { length: MAX_PATH_SEGMENTS },
        (_, index) => `s${index}`
      );
      const sketch = createSketch(files(segments.join("/")));

      // Act
      let item = buildTree(sketch)[0];
      const paths = [item.path];

      while (item.children.length > 0) {
        [item] = item.children;
        paths.push(item.path);
      }

      // Assert
      expect(paths).toHaveLength(MAX_PATH_SEGMENTS);
      expect(paths[0]).toBe("s0");
      expect(paths[1]).toBe("s0/s1");
      expect(paths[MAX_PATH_SEGMENTS - 1]).toBe(segments.join("/"));
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

    it("should refuse a path with a quote", () => {
      // Act
      const error = getAddError(nodes, "src/it's.js", "file");

      // Assert
      expect(error).toBe("A path cannot have quotes or backslashes.");
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

    it("should refuse a path of more segments than a path can have", () => {
      // Arrange
      const path = Array.from({ length: MAX_PATH_SEGMENTS + 1 }, () => "a");

      // Act
      const error = getAddError(nodes, path.join("/"), "file");

      // Assert
      expect(error).toBe("The path cannot have more than 64 segments.");
    });
  });

  describe("createNodeIndex", () => {
    /**
     * Makes an index of nodes.
     * @param nodes The nodes to add, in order.
     */
    function indexOf(
      nodes: readonly SketchNode[]
    ): ReturnType<typeof createNodeIndex> {
      const index = createNodeIndex();

      nodes.forEach(index.add);
      return index;
    }

    describe("kindOf", () => {
      it("should return undefined for every path while it has no node", () => {
        // Arrange
        const index = createNodeIndex();

        // Act
        const kinds = ["a", "a/b", "eslint.config.js"].map(index.kindOf);

        // Assert
        expect(kinds).toEqual([undefined, undefined, undefined]);
      });

      it("should return what the nodes declare, and a folder for each path that a node is under", () => {
        // Arrange
        const index = indexOf([
          { path: "src/index.js", kind: "file" },
          { path: "docs", kind: "folder" },
        ]);

        // Act
        const kinds = ["src/index.js", "docs", "src", "other"].map(
          index.kindOf
        );

        // Assert
        expect(kinds).toEqual(["file", "folder", "folder", undefined]);
      });

      it("should return undefined for a path that only starts as one of its folders does", () => {
        // Arrange
        const index = indexOf(files("src/a/b.js"));

        // Act
        const kinds = ["sr", "src/a/b.j", "src/a/b.js/c", "src/b"].map(
          index.kindOf
        );

        // Assert
        expect(kinds).toEqual([undefined, undefined, undefined, undefined]);
      });

      it("should return a folder for a path that a file is declared at and a node is under, whatever came first", () => {
        // Arrange
        const fileFirst = indexOf(files("a", "a/b.js"));
        const fileLast = indexOf(files("a/b.js", "a"));

        // Act
        const kinds = [fileFirst.kindOf("a"), fileLast.kindOf("a")];

        // Assert
        expect(kinds).toEqual(["folder", "folder"]);
      });

      it("should keep the kind of the first node at a path", () => {
        // Arrange
        const index = indexOf([
          { path: "a", kind: "file" },
          { path: "a", kind: "folder" },
          { path: "b", kind: "folder" },
          { path: "b", kind: "file" },
        ]);

        // Act
        const kinds = [index.kindOf("a"), index.kindOf("b")];

        // Assert
        expect(kinds).toEqual(["file", "folder"]);
      });
    });

    describe("getAddError", () => {
      it("should refuse an invalid path, as getAddError does", () => {
        // Arrange
        const index = createNodeIndex();

        // Act
        const errors = [
          index.getAddError("", "file"),
          index.getAddError("a//b", "file"),
          index.getAddError(`${"a/".repeat(MAX_PATH_SEGMENTS)}b`, "file"),
        ];

        // Assert
        expect(errors).toEqual([
          "The path is empty.",
          "The path has an empty segment.",
          "The path cannot have more than 64 segments.",
        ]);
      });

      it("should say what is already at the path, and what is under a file", () => {
        // Arrange
        const index = indexOf([
          { path: "src/index.js", kind: "file" },
          { path: "docs", kind: "folder" },
        ]);

        // Act
        const errors = [
          index.getAddError("src/index.js", "file"),
          index.getAddError("src", "file"),
          index.getAddError("docs", "file"),
          index.getAddError("src/index.js", "folder"),
          index.getAddError("src/index.js/new.js", "file"),
          index.getAddError("src/index.js/a/b.js", "file"),
        ];

        // Assert
        expect(errors).toEqual([
          "That path already exists.",
          "A folder already exists at that path.",
          "A folder already exists at that path.",
          "A file already exists at that path.",
          '"src/index.js" is a file, so nothing can be added under it.',
          '"src/index.js" is a file, so nothing can be added under it.',
        ]);
      });

      it("should accept a free path, next to the nodes and under a folder", () => {
        // Arrange
        const index = indexOf([
          { path: "src/index.js", kind: "file" },
          { path: "docs", kind: "folder" },
        ]);

        // Act
        const errors = [
          index.getAddError("src/new.js", "file"),
          index.getAddError("docs/guide.md", "file"),
          index.getAddError("src/deep/er/new.js", "file"),
          index.getAddError("other", "folder"),
        ];

        // Assert
        expect(errors).toEqual([undefined, undefined, undefined, undefined]);
      });

      it("should add nothing", () => {
        // Arrange
        const index = createNodeIndex();

        // Act
        index.getAddError("src/index.js", "file");

        // Assert
        expect(index.kindOf("src/index.js")).toBeUndefined();
      });
    });

    describe("compared with the scan of the same nodes", () => {
      it("should answer the same for the nodes that a check lets in", () => {
        // Act
        const differences = findDifferences(20261109, true);

        // Assert
        expect(differences).toStrictEqual([]);
      });

      it("should answer the same for nodes in any order and of any kind, even where a file has nodes under it", () => {
        // Act
        const differences = findDifferences(7, false);

        // Assert
        expect(differences).toStrictEqual([]);
      });
    });
  });
});
