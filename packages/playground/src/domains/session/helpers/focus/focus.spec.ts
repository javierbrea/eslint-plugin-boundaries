import type { Sketch, SketchDependency } from "@/contract";
import type { TextRange } from "@/domains/evaluation/helpers/engine";

import { getFocusedPath, moveFocus, moveHighlight } from "./focus";
import type { Focus, PolicyHighlight } from "./focus.types";

const RANGE: TextRange = { from: 10, to: 20, line: 2, column: 3 };

/**
 * Builds a value dependency of a file on a file of the sketch.
 * @param from The file that has the dependency.
 * @param to The file it points to.
 * @returns The dependency, a new object each time.
 */
function dependency(from: string, to: string): SketchDependency {
  return {
    from,
    target: { kind: "node", path: to },
    syntax: "import",
    importKind: "value",
    specifiers: [],
  };
}

const A_TO_B = dependency("src/a.js", "src/b.js");

const A_TO_C = dependency("src/a.js", "src/c.js");

const A_TO_D = dependency("src/a.js", "src/d.js");

const B_TO_A = dependency("src/b.js", "src/a.js");

const BEFORE: Sketch = {
  config: "{}",
  tree: [
    { path: "src/a.js", kind: "file" },
    { path: "src/b.js", kind: "file" },
    { path: "src/c.js", kind: "file" },
    { path: "src/d.js", kind: "file" },
  ],
  dependencies: [A_TO_B, A_TO_C, B_TO_A, A_TO_D],
};

/**
 * Builds the sketch after an edit.
 * @param overrides What the edit changed.
 * @returns A sketch that differs from the one before in what is given.
 */
function after(overrides: Partial<Sketch>): Sketch {
  return { ...BEFORE, ...overrides };
}

const FILE_A: Focus = { kind: "file", path: "src/a.js" };

/**
 * Builds the focus on a dependency.
 * @param path The file of the dependency.
 * @param index Its position among the dependencies of the file.
 * @returns The focus.
 */
function dependencyFocus(path: string, index: number): Focus {
  return { kind: "dependency", path, index };
}

describe("focus", () => {
  describe("getFocusedPath", () => {
    it("should give the path of a file in focus", () => {
      // Act
      const path = getFocusedPath(FILE_A);

      // Assert
      expect(path).toBe("src/a.js");
    });

    it("should give the file of a dependency in focus", () => {
      // Act
      const path = getFocusedPath(dependencyFocus("src/b.js", 0));

      // Assert
      expect(path).toBe("src/b.js");
    });

    it.each([{ kind: "config" }, { kind: "none" }] as const)(
      "should give no path when the focus is %j",
      (openNode) => {
        // Act
        const path = getFocusedPath(openNode);

        // Assert
        expect(path).toBeUndefined();
      }
    );
  });

  describe("moveFocus", () => {
    describe("a file", () => {
      it("should keep the focus on a file that the sketch still has", () => {
        // Act
        const moved = moveFocus(FILE_A, BEFORE, after({}));

        // Assert
        expect(moved).toBe(FILE_A);
      });

      it("should leave nothing in focus when the file is gone", () => {
        // Arrange
        const sketch = after({ tree: [{ path: "src/b.js", kind: "file" }] });

        // Act
        const moved = moveFocus(FILE_A, BEFORE, sketch);

        // Assert
        expect(moved).toEqual({ kind: "none" });
      });
    });

    it.each([{ kind: "config" }, { kind: "none" }] as const)(
      "should keep the focus when it is %j, whatever the edit",
      (openNode) => {
        // Act
        const moved = moveFocus(openNode, BEFORE, after({ dependencies: [] }));

        // Assert
        expect(moved).toBe(openNode);
      }
    );

    describe("a dependency, after an edit that only drops dependencies", () => {
      it("should keep the focus when the dependency is where it was", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);

        // Act
        const moved = moveFocus(
          openNode,
          BEFORE,
          after({ dependencies: [A_TO_B, A_TO_C, B_TO_A] })
        );

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should move the index up when a dependency before it in its file is gone", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 2);

        // Act
        const moved = moveFocus(
          openNode,
          BEFORE,
          after({ dependencies: [A_TO_C, B_TO_A, A_TO_D] })
        );

        // Assert
        expect(moved).toEqual(dependencyFocus("src/a.js", 1));
      });

      it("should not move the index when the dependency that went is of another file", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 2);

        // Act
        const moved = moveFocus(
          openNode,
          BEFORE,
          after({ dependencies: [A_TO_B, A_TO_C, A_TO_D] })
        );

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should put its file in focus when the dependency is gone, and not the one that took its index", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);

        // Act
        const moved = moveFocus(
          openNode,
          BEFORE,
          after({ dependencies: [A_TO_B, B_TO_A, A_TO_D] })
        );

        // Assert
        expect(moved).toEqual(FILE_A);
      });

      it("should put its file in focus when it was the last of the file", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 2);

        // Act
        const moved = moveFocus(
          openNode,
          BEFORE,
          after({ dependencies: [A_TO_B, A_TO_C, B_TO_A] })
        );

        // Assert
        expect(moved).toEqual(FILE_A);
      });

      it("should leave nothing in focus when its file is gone too", () => {
        // Arrange
        const sketch = after({
          tree: BEFORE.tree.filter(({ path }) => path !== "src/b.js"),
          dependencies: [A_TO_C, A_TO_D],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/b.js", 0), BEFORE, sketch);

        // Assert
        expect(moved).toEqual({ kind: "none" });
      });
    });

    describe("a dependency, after an edit that builds dependencies again", () => {
      it("should keep the focus on the same index of the same file", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);
        const sketch = after({
          dependencies: [
            dependency("src/a.js", "src/b.js"),
            dependency("src/a.js", "src/d.js"),
            dependency("src/b.js", "src/a.js"),
          ],
        });

        // Act
        const moved = moveFocus(openNode, BEFORE, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should keep the focus on the replaced dependency", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 0);
        const replaced = dependency("src/a.js", "src/d.js");

        // Act
        const moved = moveFocus(
          openNode,
          BEFORE,
          after({ dependencies: [replaced, A_TO_C, B_TO_A, A_TO_D] })
        );

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should put its file in focus when the file has fewer dependencies than its index", () => {
        // Arrange
        const sketch = after({
          dependencies: [dependency("src/a.js", "src/b.js"), B_TO_A],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 2), BEFORE, sketch);

        // Assert
        expect(moved).toEqual(FILE_A);
      });

      it("should leave nothing in focus when the file is gone", () => {
        // Arrange
        const sketch = after({
          tree: [{ path: "src/b.js", kind: "file" }],
          dependencies: [dependency("src/b.js", "src/a.js")],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 0), BEFORE, sketch);

        // Assert
        expect(moved).toEqual({ kind: "none" });
      });
    });

    describe("a dependency that the sketch before does not have", () => {
      it("should put its file in focus", () => {
        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 9), BEFORE, BEFORE);

        // Assert
        expect(moved).toEqual(FILE_A);
      });
    });
  });

  describe("moveHighlight", () => {
    const HIGHLIGHT: PolicyHighlight = {
      range: RANGE,
      dependency: { path: "src/a.js", index: 2 },
    };

    it("should give nothing when there is no highlight", () => {
      // Act
      const moved = moveHighlight(undefined, BEFORE, after({}));

      // Assert
      expect(moved).toBeUndefined();
    });

    it("should keep the same highlight when its dependency did not move", () => {
      // Act
      const moved = moveHighlight(HIGHLIGHT, BEFORE, after({}));

      // Assert
      expect(moved).toBe(HIGHLIGHT);
    });

    it("should follow its dependency when the ones before it in its file are gone, and keep the range", () => {
      // Act
      const moved = moveHighlight(
        HIGHLIGHT,
        BEFORE,
        after({ dependencies: [A_TO_C, B_TO_A, A_TO_D] })
      );

      // Assert
      expect(moved).toEqual({
        range: RANGE,
        dependency: { path: "src/a.js", index: 1 },
      });
    });

    it("should drop the highlight when its dependency is gone", () => {
      // Act
      const moved = moveHighlight(
        HIGHLIGHT,
        BEFORE,
        after({ dependencies: [A_TO_B, A_TO_C, B_TO_A] })
      );

      // Assert
      expect(moved).toBeUndefined();
    });
  });
});
