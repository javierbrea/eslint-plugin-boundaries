import type { Sketch, SketchDependency, SketchNode } from "@/contract";

import {
  addNode,
  getUniquePath,
  removeNode,
  renameInFolder,
  renameNode,
  setConfig,
} from "./Edit";
import type { EditResult, RenameResult } from "./Sketch.types";

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

/**
 * Gets the sketch and the path of a rename that is not an error.
 * @param result The result of renaming a node by its typed name.
 */
function getRenamed(result: RenameResult): { sketch: Sketch; path: string } {
  if ("error" in result) {
    throw new Error(`The rename was refused: ${result.error}`);
  }
  return result;
}

// In the order of the tree: what an edit returns
const SKETCH = createSketch([
  { path: "docs", kind: "folder" },
  { path: "src/components/Price/index.js", kind: "file" },
  { path: "src/components/Price/Price.css", kind: "file" },
  { path: "src/helpers/format.js", kind: "file" },
  { path: "src/index.js", kind: "file" },
]);

describe("Edit", () => {
  describe("addNode", () => {
    it("should add a file in the order of the tree", () => {
      // Act
      const sketch = getSketch(addNode(SKETCH, "src/helpers/date.js", "file"));

      // Assert
      expect(sketch.tree.map((node) => node.path)).toEqual([
        "docs",
        "src/components/Price/index.js",
        "src/components/Price/Price.css",
        "src/helpers/date.js",
        "src/helpers/format.js",
        "src/index.js",
      ]);
    });

    it("should add an empty folder", () => {
      // Act
      const sketch = getSketch(addNode(SKETCH, "src/pages", "folder"));

      // Assert
      expect(sketch.tree).toContainEqual({ path: "src/pages", kind: "folder" });
    });

    it("should remove the empty folder node that the new file implies", () => {
      // Act
      const sketch = getSketch(addNode(SKETCH, "docs/guide.md", "file"));

      // Assert
      expect(sketch.tree).toContainEqual({
        path: "docs/guide.md",
        kind: "file",
      });
      expect(sketch.tree).not.toContainEqual({ path: "docs", kind: "folder" });
    });

    it("should remove the empty folder node that the new folder implies", () => {
      // Act
      const sketch = getSketch(addNode(SKETCH, "docs/guides", "folder"));

      // Assert
      expect(sketch.tree).toContainEqual({
        path: "docs/guides",
        kind: "folder",
      });
      expect(sketch.tree).not.toContainEqual({ path: "docs", kind: "folder" });
    });

    it("should keep the config and the dependencies", () => {
      // Arrange
      const withDependency = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);

      // Act
      const sketch = getSketch(addNode(withDependency, "new.js", "file"));

      // Assert
      expect(sketch.config).toBe(withDependency.config);
      expect(sketch.dependencies).toEqual(withDependency.dependencies);
    });

    it("should not change its input", () => {
      // Arrange
      const before = JSON.stringify(SKETCH);

      // Act
      addNode(SKETCH, "docs/guide.md", "file");

      // Assert
      expect(JSON.stringify(SKETCH)).toBe(before);
    });

    it("should refuse an invalid path", () => {
      // Act
      const error = getError(addNode(SKETCH, "eslint.config.js", "file"));

      // Assert
      expect(error).toBe(
        "eslint.config.js at the root is the config node, not a file or a folder."
      );
    });

    it("should refuse an existing node", () => {
      // Act
      const error = getError(addNode(SKETCH, "src/index.js", "file"));

      // Assert
      expect(error).toBe("That path already exists.");
    });

    it("should refuse a path under a file", () => {
      // Act
      const error = getError(addNode(SKETCH, "src/index.js/new.js", "file"));

      // Assert
      expect(error).toBe(
        '"src/index.js" is a file, so nothing can be added under it.'
      );
    });

    it("should refuse a file where a folder exists", () => {
      // Act
      const error = getError(addNode(SKETCH, "src/helpers", "file"));

      // Assert
      expect(error).toBe("A folder already exists at that path.");
    });
  });

  describe("renameNode", () => {
    it("should rename a file", () => {
      // Act
      const sketch = getSketch(
        renameNode(SKETCH, "src/index.js", "src/main.js")
      );

      // Assert
      expect(sketch.tree.map((node) => node.path)).toEqual([
        "docs",
        "src/components/Price/index.js",
        "src/components/Price/Price.css",
        "src/helpers/format.js",
        "src/main.js",
      ]);
    });

    it("should move a file to another folder", () => {
      // Act
      const sketch = getSketch(
        renameNode(SKETCH, "src/index.js", "src/helpers/index.js")
      );

      // Assert
      expect(sketch.tree.map((node) => node.path)).toContain(
        "src/helpers/index.js"
      );
      expect(sketch.tree.map((node) => node.path)).not.toContain(
        "src/index.js"
      );
    });

    it("should rename a folder and move everything under it", () => {
      // Act
      const sketch = getSketch(renameNode(SKETCH, "src/components", "src/ui"));

      // Assert
      expect(sketch.tree.map((node) => node.path)).toEqual([
        "docs",
        "src/helpers/format.js",
        "src/ui/Price/index.js",
        "src/ui/Price/Price.css",
        "src/index.js",
      ]);
    });

    it("should rename an empty folder", () => {
      // Act
      const sketch = getSketch(renameNode(SKETCH, "docs", "guides"));

      // Assert
      expect(sketch.tree).toContainEqual({ path: "guides", kind: "folder" });
      expect(sketch.tree).not.toContainEqual({ path: "docs", kind: "folder" });
    });

    it("should rename a node to its own path without changing the sketch", () => {
      // Act
      const sketch = getSketch(
        renameNode(SKETCH, "src/index.js", "src/index.js")
      );

      // Assert
      expect(sketch).toEqual(SKETCH);
    });

    it("should move a folder to a deeper path that is not inside itself", () => {
      // Act
      const sketch = getSketch(
        renameNode(SKETCH, "src/helpers", "src/components/helpers")
      );

      // Assert
      expect(sketch.tree.map((node) => node.path)).toContain(
        "src/components/helpers/format.js"
      );
    });

    it("should make the dependencies follow a renamed file", () => {
      // Arrange
      const withDependencies = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
        toNode("src/helpers/format.js", "src/index.js"),
        toExternal("src/index.js", "react"),
      ]);

      // Act
      const sketch = getSketch(
        renameNode(withDependencies, "src/index.js", "src/main.js")
      );

      // Assert
      expect(sketch.dependencies).toEqual([
        toNode("src/main.js", "src/helpers/format.js"),
        toNode("src/helpers/format.js", "src/main.js"),
        toExternal("src/main.js", "react"),
      ]);
    });

    it("should make the dependencies follow a renamed folder", () => {
      // Arrange
      const withDependencies = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/components/Price/index.js"),
        toNode("src/components/Price/index.js", "src/helpers/format.js"),
        toNode("src/index.js", "src/components"),
        toNode("src/index.js", "src/componentsAndMore"),
      ]);

      // Act
      const sketch = getSketch(
        renameNode(withDependencies, "src/components", "src/ui")
      );

      // Assert
      expect(sketch.dependencies).toEqual([
        toNode("src/index.js", "src/ui/Price/index.js"),
        toNode("src/ui/Price/index.js", "src/helpers/format.js"),
        toNode("src/index.js", "src/ui"),
        toNode("src/index.js", "src/componentsAndMore"),
      ]);
    });

    it("should allow a file to become a folder of the same name", () => {
      // Act
      const sketch = getSketch(
        renameNode(SKETCH, "src/index.js", "src/index.js/main.js")
      );

      // Assert
      expect(sketch.tree.map((node) => node.path)).toContain(
        "src/index.js/main.js"
      );
    });

    it("should not change its input", () => {
      // Arrange
      const before = JSON.stringify(SKETCH);

      // Act
      renameNode(SKETCH, "src/components", "src/ui");

      // Assert
      expect(JSON.stringify(SKETCH)).toBe(before);
    });

    it("should refuse a path without a node", () => {
      // Act
      const error = getError(renameNode(SKETCH, "lib", "src"));

      // Assert
      expect(error).toBe("There is no file or folder at that path.");
    });

    it("should refuse to move a folder into itself", () => {
      // Act
      const error = getError(
        renameNode(SKETCH, "src/components", "src/components/ui")
      );

      // Assert
      expect(error).toBe("A folder cannot be moved into itself.");
    });

    it("should refuse an invalid new path", () => {
      // Act
      const error = getError(
        renameNode(SKETCH, "src/index.js", "src//main.js")
      );

      // Assert
      expect(error).toBe("The path has an empty segment.");
    });

    it("should refuse a new path under the config node", () => {
      // Act
      const error = getError(
        renameNode(SKETCH, "src/index.js", "eslint.config.js/index.js")
      );

      // Assert
      expect(error).toBe(
        "eslint.config.js at the root is the config node, not a file or a folder."
      );
    });

    it("should refuse a new path that is taken", () => {
      // Act
      const error = getError(
        renameNode(SKETCH, "src/index.js", "src/helpers/format.js")
      );

      // Assert
      expect(error).toBe("That path already exists.");
    });

    it("should refuse to rename a folder to a path where a file is", () => {
      // Act
      const error = getError(renameNode(SKETCH, "docs", "src/index.js"));

      // Assert
      expect(error).toBe("A file already exists at that path.");
    });

    it("should refuse a new path under a file", () => {
      // Act
      const error = getError(
        renameNode(SKETCH, "src/helpers", "src/index.js/helpers")
      );

      // Assert
      expect(error).toBe(
        '"src/index.js" is a file, so nothing can be added under it.'
      );
    });
  });

  describe("renameInFolder", () => {
    it("should rename a file in the folder it is in", () => {
      // Act
      const { sketch, path } = getRenamed(
        renameInFolder(SKETCH, "src/index.js", "main.js")
      );

      // Assert
      expect(path).toBe("src/main.js");
      expect(sketch.tree.map((node) => node.path)).toEqual([
        "docs",
        "src/components/Price/index.js",
        "src/components/Price/Price.css",
        "src/helpers/format.js",
        "src/main.js",
      ]);
    });

    it("should rename a node at the root without a folder in front of the name", () => {
      // Act
      const { sketch, path } = getRenamed(
        renameInFolder(SKETCH, "docs", "guides")
      );

      // Assert
      expect(path).toBe("guides");
      expect(sketch.tree).toContainEqual({ path: "guides", kind: "folder" });
    });

    it("should rename a folder and move everything under it", () => {
      // Act
      const { sketch, path } = getRenamed(
        renameInFolder(SKETCH, "src/components", "ui")
      );

      // Assert
      expect(path).toBe("src/ui");
      expect(sketch.tree.map((node) => node.path)).toContain(
        "src/ui/Price/index.js"
      );
    });

    it("should clean up the typed name before joining it to the folder", () => {
      // Act
      const { path } = getRenamed(
        renameInFolder(SKETCH, "src/index.js", "  ./main.js  ")
      );

      // Assert
      expect(path).toBe("src/main.js");
    });

    it("should move the node to another folder when the typed name has a path", () => {
      // Act
      const { sketch, path } = getRenamed(
        renameInFolder(SKETCH, "src/index.js", "helpers\\index.js")
      );

      // Assert
      expect(path).toBe("src/helpers/index.js");
      expect(sketch.tree.map((node) => node.path)).toContain(
        "src/helpers/index.js"
      );
    });

    it("should make the dependencies follow the renamed node", () => {
      // Arrange
      const withDependencies = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
      ]);

      // Act
      const { sketch } = getRenamed(
        renameInFolder(withDependencies, "src/helpers/format.js", "fmt.js")
      );

      // Assert
      expect(sketch.dependencies).toEqual([
        toNode("src/index.js", "src/helpers/fmt.js"),
      ]);
    });

    it("should return the same sketch and path when the name leaves the node where it is", () => {
      // Act
      const result = renameInFolder(SKETCH, "src/index.js", " ./index.js ");

      // Assert
      expect(result).toEqual({ sketch: SKETCH, path: "src/index.js" });
      expect(getRenamed(result).sketch).toBe(SKETCH);
    });

    it.each(["", "   ", "./"])(
      "should refuse the empty name %j as an empty path",
      (typedName) => {
        // Act
        const error = getError(
          renameInFolder(SKETCH, "src/index.js", typedName)
        );

        // Assert
        expect(error).toBe("The path is empty.");
      }
    );

    it("should refuse a name with a `..` segment", () => {
      // Act
      const error = getError(
        renameInFolder(SKETCH, "src/helpers/format.js", "../index.js")
      );

      // Assert
      expect(error).toBe("The path cannot have `.` or `..` segments.");
    });

    it("should refuse a path that already exists", () => {
      // Act
      const error = getError(
        renameInFolder(SKETCH, "src/index.js", "helpers/format.js")
      );

      // Assert
      expect(error).toBe("That path already exists.");
    });

    it("should refuse to move a folder into itself", () => {
      // Act
      const error = getError(
        renameInFolder(SKETCH, "src/components", "components/ui")
      );

      // Assert
      expect(error).toBe("A folder cannot be moved into itself.");
    });

    it("should refuse a path where there is no node", () => {
      // Act
      const error = getError(renameInFolder(SKETCH, "src/missing.js", "a.js"));

      // Assert
      expect(error).toBe("There is no file or folder at that path.");
    });
  });

  describe("removeNode", () => {
    it("should remove a file", () => {
      // Act
      const sketch = getSketch(removeNode(SKETCH, "src/index.js"));

      // Assert
      expect(sketch.tree.map((node) => node.path)).toEqual([
        "docs",
        "src/components/Price/index.js",
        "src/components/Price/Price.css",
        "src/helpers/format.js",
      ]);
    });

    it("should remove a folder and everything under it", () => {
      // Act
      const sketch = getSketch(removeNode(SKETCH, "src/components"));

      // Assert
      expect(sketch.tree.map((node) => node.path)).toEqual([
        "docs",
        "src/helpers/format.js",
        "src/index.js",
      ]);
    });

    it("should remove an empty folder", () => {
      // Act
      const sketch = getSketch(removeNode(SKETCH, "docs"));

      // Assert
      expect(sketch.tree).not.toContainEqual({ path: "docs", kind: "folder" });
    });

    it("should not take a sibling that starts with the same text", () => {
      // Arrange
      const sketch = createSketch([
        { path: "src/a/one.js", kind: "file" },
        { path: "src/ab/two.js", kind: "file" },
      ]);

      // Act
      const result = getSketch(removeNode(sketch, "src/a"));

      // Assert
      expect(result.tree).toEqual([{ path: "src/ab/two.js", kind: "file" }]);
    });

    it("should remove the dependencies from or to what is removed", () => {
      // Arrange
      const withDependencies = createSketch(SKETCH.tree, [
        toNode("src/index.js", "src/helpers/format.js"),
        toNode("src/helpers/format.js", "src/index.js"),
        toNode("src/index.js", "src/components/Price/index.js"),
        toNode("src/index.js", "src/components"),
        toExternal("src/components/Price/index.js", "react"),
        toExternal("src/index.js", "react"),
      ]);

      // Act
      const sketch = getSketch(removeNode(withDependencies, "src/components"));

      // Assert
      expect(sketch.dependencies).toEqual([
        toNode("src/index.js", "src/helpers/format.js"),
        toNode("src/helpers/format.js", "src/index.js"),
        toExternal("src/index.js", "react"),
      ]);
    });

    it("should not change its input", () => {
      // Arrange
      const before = JSON.stringify(SKETCH);

      // Act
      removeNode(SKETCH, "src/components");

      // Assert
      expect(JSON.stringify(SKETCH)).toBe(before);
    });

    it("should refuse a path without a node", () => {
      // Act
      const error = getError(removeNode(SKETCH, "lib"));

      // Assert
      expect(error).toBe("There is no file or folder at that path.");
    });
  });

  describe("setConfig", () => {
    it("should replace the config and keep the rest", () => {
      // Act
      const sketch = setConfig(SKETCH, "{ settings: {}, rules: { a: 1 } }");

      // Assert
      expect(sketch).toEqual({
        ...SKETCH,
        config: "{ settings: {}, rules: { a: 1 } }",
      });
    });

    it("should not change its input", () => {
      // Arrange
      const config = SKETCH.config;

      // Act
      setConfig(SKETCH, "{}");

      // Assert
      expect(SKETCH.config).toBe(config);
    });
  });

  describe("getUniquePath", () => {
    it("should return the base in the folder when it is free", () => {
      // Act
      const path = getUniquePath(SKETCH, "src", "new-file.js");

      // Assert
      expect(path).toBe("src/new-file.js");
    });

    it("should return the base alone for the root", () => {
      // Act
      const path = getUniquePath(SKETCH, "", "new-folder");

      // Assert
      expect(path).toBe("new-folder");
    });

    it("should add a counter before the extension of a file", () => {
      // Arrange
      const sketch = createSketch([
        { path: "new-file.js", kind: "file" },
        { path: "new-file-2.js", kind: "file" },
      ]);

      // Act
      const path = getUniquePath(sketch, "", "new-file.js");

      // Assert
      expect(path).toBe("new-file-3.js");
    });

    it("should add a counter to a name without an extension", () => {
      // Arrange
      const sketch = createSketch([
        { path: "src/new-folder/a.js", kind: "file" },
      ]);

      // Act
      const path = getUniquePath(sketch, "src", "new-folder");

      // Assert
      expect(path).toBe("src/new-folder-2");
    });

    it("should add a counter before the last extension only", () => {
      // Arrange
      const sketch = createSketch([{ path: "a.test.js", kind: "file" }]);

      // Act
      const path = getUniquePath(sketch, "", "a.test.js");

      // Assert
      expect(path).toBe("a.test-2.js");
    });

    it("should not take a leading dot for an extension", () => {
      // Arrange
      const sketch = createSketch([{ path: ".gitignore", kind: "file" }]);

      // Act
      const path = getUniquePath(sketch, "", ".gitignore");

      // Assert
      expect(path).toBe(".gitignore-2");
    });

    it("should find a name taken by an implied folder", () => {
      // Act
      const path = getUniquePath(SKETCH, "", "src");

      // Assert
      expect(path).toBe("src-2");
    });
  });
});
