import type { Sketch, SketchDependency } from "@/contract";
import type { TextRange } from "@/domains/evaluation/helpers/engine";

import {
  findHighlightPolicy,
  getFocusedPath,
  moveFocus,
  moveHighlight,
  moveHighlightRange,
} from "./focus";
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

/**
 * Builds a dependency again, as reading the text of text mode does: the same data in new objects.
 * @param original The dependency to copy.
 * @returns A dependency that is not the same object and holds the same data.
 */
function rebuilt(original: SketchDependency): SketchDependency {
  return {
    ...original,
    target: { ...original.target },
    specifiers: original.specifiers.map((specifier) => ({ ...specifier })),
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
      it("should keep the focus on the same index when the dependencies are the same", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);
        const sketch = after({
          dependencies: BEFORE.dependencies.map(rebuilt),
        });

        // Act
        const moved = moveFocus(openNode, BEFORE, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should keep the focus on the same index when the dependency was edited in place", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);
        const edited: SketchDependency = {
          ...rebuilt(A_TO_C),
          specifiers: [{ kind: "named", name: "x" }],
        };
        const sketch = after({
          dependencies: [
            rebuilt(A_TO_B),
            edited,
            rebuilt(B_TO_A),
            rebuilt(A_TO_D),
          ],
        });

        // Act
        const moved = moveFocus(openNode, BEFORE, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should follow the dependency to the line it has now when a line before it was deleted", () => {
        // Arrange
        const sketch = after({
          dependencies: [rebuilt(A_TO_C), rebuilt(B_TO_A), rebuilt(A_TO_D)],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 1), BEFORE, sketch);

        // Assert
        expect(moved).toEqual(dependencyFocus("src/a.js", 0));
      });

      it("should follow the dependency to the line it has now when a line before it was added", () => {
        // Arrange
        const added = dependency("src/a.js", "src/d.js");
        const sketch = after({
          dependencies: [
            rebuilt(added),
            rebuilt(A_TO_B),
            rebuilt(A_TO_C),
            rebuilt(B_TO_A),
            rebuilt(A_TO_D),
          ],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 1), BEFORE, sketch);

        // Assert
        expect(moved).toEqual(dependencyFocus("src/a.js", 2));
      });

      it("should follow the dependency when the lines of its file were swapped", () => {
        // Arrange
        const sketch = after({
          dependencies: [
            rebuilt(A_TO_D),
            rebuilt(A_TO_C),
            rebuilt(A_TO_B),
            rebuilt(B_TO_A),
          ],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 0), BEFORE, sketch);

        // Assert
        expect(moved).toEqual(dependencyFocus("src/a.js", 2));
      });

      it("should keep the focus on the line when a line before it was edited into what it says", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);
        const sketch = after({
          dependencies: [
            rebuilt(A_TO_C),
            rebuilt(A_TO_C),
            rebuilt(B_TO_A),
            rebuilt(A_TO_D),
          ],
        });

        // Act
        const moved = moveFocus(openNode, BEFORE, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should keep the focus on the line when it was edited into what no line said before, though a later line says what it said", () => {
        // Arrange
        const twice: Sketch = {
          ...BEFORE,
          dependencies: [A_TO_B, A_TO_C, A_TO_B],
        };
        const openNode = dependencyFocus("src/a.js", 0);
        const sketch: Sketch = {
          ...twice,
          dependencies: [
            rebuilt(dependency("src/a.js", "src/d.js")),
            rebuilt(A_TO_C),
            rebuilt(A_TO_B),
          ],
        };

        // Act
        const moved = moveFocus(openNode, twice, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should keep the focus on the line when it was edited into what another line says and no line says what it said", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 0);
        const sketch = after({
          dependencies: [
            rebuilt(A_TO_C),
            rebuilt(A_TO_C),
            rebuilt(B_TO_A),
            rebuilt(A_TO_D),
          ],
        });

        // Act
        const moved = moveFocus(openNode, BEFORE, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should keep the focus on the line when other lines were added and deleted and it stayed at its index", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);
        const sketch = after({
          dependencies: [rebuilt(A_TO_D), rebuilt(A_TO_C), rebuilt(B_TO_A)],
        });

        // Act
        const moved = moveFocus(openNode, BEFORE, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      it("should follow the dependency when two lines of its file were swapped", () => {
        // Arrange
        const sketch = after({
          dependencies: [
            rebuilt(A_TO_C),
            rebuilt(A_TO_B),
            rebuilt(B_TO_A),
            rebuilt(A_TO_D),
          ],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 0), BEFORE, sketch);

        // Assert
        expect(moved).toEqual(dependencyFocus("src/a.js", 1));
      });

      it("should not move the focus for the lines that changed in another file", () => {
        // Arrange
        const openNode = dependencyFocus("src/a.js", 1);
        const sketch = after({
          dependencies: [
            rebuilt(dependency("src/b.js", "src/c.js")),
            rebuilt(A_TO_B),
            rebuilt(A_TO_C),
            rebuilt(B_TO_A),
            rebuilt(A_TO_D),
          ],
        });

        // Act
        const moved = moveFocus(openNode, BEFORE, sketch);

        // Assert
        expect(moved).toBe(openNode);
      });

      describe("when the file has equal dependencies", () => {
        const twice: Sketch = {
          ...BEFORE,
          dependencies: [A_TO_B, A_TO_B, A_TO_C],
        };

        it("should follow the second one when a line before both was added", () => {
          // Arrange
          const sketch: Sketch = {
            ...twice,
            dependencies: [
              rebuilt(A_TO_D),
              rebuilt(A_TO_B),
              rebuilt(A_TO_B),
              rebuilt(A_TO_C),
            ],
          };

          // Act
          const moved = moveFocus(
            dependencyFocus("src/a.js", 1),
            twice,
            sketch
          );

          // Assert
          expect(moved).toEqual(dependencyFocus("src/a.js", 2));
        });

        it("should follow the first one when a line before both was added", () => {
          // Arrange
          const sketch: Sketch = {
            ...twice,
            dependencies: [
              rebuilt(A_TO_D),
              rebuilt(A_TO_B),
              rebuilt(A_TO_B),
              rebuilt(A_TO_C),
            ],
          };

          // Act
          const moved = moveFocus(
            dependencyFocus("src/a.js", 0),
            twice,
            sketch
          );

          // Assert
          expect(moved).toEqual(dependencyFocus("src/a.js", 1));
        });

        it("should put its file in focus when the second one was deleted", () => {
          // Arrange
          const sketch: Sketch = {
            ...twice,
            dependencies: [rebuilt(A_TO_B), rebuilt(A_TO_C)],
          };

          // Act
          const moved = moveFocus(
            dependencyFocus("src/a.js", 1),
            twice,
            sketch
          );

          // Assert
          expect(moved).toEqual(FILE_A);
        });
      });

      it("should put its file in focus when the dependency is gone and the file has fewer lines", () => {
        // Arrange
        const sketch = after({
          dependencies: [rebuilt(A_TO_B), rebuilt(A_TO_D), rebuilt(B_TO_A)],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 1), BEFORE, sketch);

        // Assert
        expect(moved).toEqual(FILE_A);
      });

      it("should put its file in focus when the dependency is gone and the file has more lines", () => {
        // Arrange
        const edited: SketchDependency = {
          ...rebuilt(A_TO_C),
          importKind: "type",
          specifiers: [{ kind: "named", name: "x" }],
        };
        const sketch = after({
          dependencies: [
            rebuilt(A_TO_B),
            edited,
            rebuilt(A_TO_D),
            rebuilt(A_TO_D),
            rebuilt(B_TO_A),
          ],
        });

        // Act
        const moved = moveFocus(dependencyFocus("src/a.js", 1), BEFORE, sketch);

        // Assert
        expect(moved).toEqual(FILE_A);
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

      it("should keep the focus on the replaced dependency when another one of its file says the same", () => {
        // Arrange
        const twin = rebuilt(A_TO_B);
        const withTwin: Sketch = {
          ...BEFORE,
          dependencies: [A_TO_B, twin, A_TO_C],
        };
        const openNode = dependencyFocus("src/a.js", 0);
        const sketch: Sketch = {
          ...withTwin,
          dependencies: [dependency("src/a.js", "src/d.js"), twin, A_TO_C],
        };

        // Act
        const moved = moveFocus(openNode, withTwin, sketch);

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
      policy: 2,
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
        policy: 2,
        dependency: { path: "src/a.js", index: 1 },
      });
    });

    it("should follow its dependency when the text built the dependencies again and a line before it was deleted", () => {
      // Act
      const moved = moveHighlight(
        HIGHLIGHT,
        BEFORE,
        after({
          dependencies: [rebuilt(A_TO_C), rebuilt(A_TO_D), rebuilt(B_TO_A)],
        })
      );

      // Assert
      expect(moved).toEqual({
        range: RANGE,
        policy: 2,
        dependency: { path: "src/a.js", index: 1 },
      });
    });

    it("should drop the highlight when the text deleted its dependency", () => {
      // Act
      const moved = moveHighlight(
        HIGHLIGHT,
        BEFORE,
        after({
          dependencies: [rebuilt(A_TO_B), rebuilt(A_TO_C), rebuilt(B_TO_A)],
        })
      );

      // Assert
      expect(moved).toBeUndefined();
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

  describe("moveHighlightRange", () => {
    const HIGHLIGHT: PolicyHighlight = {
      range: RANGE,
      policy: 2,
      dependency: { path: "src/a.js", index: 2 },
    };

    const MOVED: TextRange = { from: 14, to: 24, line: 3, column: 3 };

    it("should give nothing when there is no highlight, whatever the editor says", () => {
      // Act
      const results = [
        moveHighlightRange(undefined, MOVED),
        moveHighlightRange(undefined, null),
        moveHighlightRange(undefined, undefined),
      ];

      // Assert
      expect(results).toEqual([undefined, undefined, undefined]);
    });

    it("should keep the same highlight when the change did not come from the editor, which reports no range", () => {
      // Act
      const moved = moveHighlightRange(HIGHLIGHT, undefined);

      // Assert
      expect(moved).toBe(HIGHLIGHT);
    });

    it("should drop the highlight when the editor has none after the edit", () => {
      // Act
      const moved = moveHighlightRange(HIGHLIGHT, null);

      // Assert
      expect(moved).toBeUndefined();
    });

    it("should keep the same highlight when the editor reports the range it has", () => {
      // Act
      const moved = moveHighlightRange(HIGHLIGHT, { ...RANGE });

      // Assert
      expect(moved).toBe(HIGHLIGHT);
    });

    it.each<[string, Partial<TextRange>]>([
      ["from", { from: RANGE.from + 4 }],
      ["to", { to: RANGE.to + 4 }],
      ["line", { line: RANGE.line + 1 }],
      ["column", { column: RANGE.column + 1 }],
    ])(
      "should take the range of the editor when its %s is not the one the highlight has",
      (_name, change) => {
        // Act
        const moved = moveHighlightRange(HIGHLIGHT, { ...RANGE, ...change });

        // Assert
        expect(moved).toEqual({ ...HIGHLIGHT, range: { ...RANGE, ...change } });
      }
    );

    it("should keep the policy and the dependency of the highlight when it takes the range", () => {
      // Act
      const moved = moveHighlightRange(HIGHLIGHT, MOVED);

      // Assert
      expect(moved).toEqual({
        range: MOVED,
        policy: 2,
        dependency: { path: "src/a.js", index: 2 },
      });
    });
  });

  describe("findHighlightPolicy", () => {
    const HIGHLIGHT: PolicyHighlight = {
      range: RANGE,
      policy: 1,
      dependency: { path: "src/a.js", index: 2 },
    };

    /**
     * Builds a policy of an evaluation.
     * @param index Its index in the options, or `null` for the default.
     * @param from The offset it starts at.
     * @returns The policy, whose range starts at the offset.
     */
    function policyAt(index: number | null, from: number) {
      return { index, range: { ...RANGE, from, to: from + 30 } };
    }

    it("should give nothing when there is no highlight", () => {
      // Act
      const found = findHighlightPolicy(undefined, [policyAt(0, RANGE.from)]);

      // Assert
      expect(found).toBeUndefined();
    });

    it("should give the highlight the index of the policy that starts where its range starts", () => {
      // Act
      const found = findHighlightPolicy(HIGHLIGHT, [
        policyAt(0, RANGE.from - 8),
        policyAt(2, RANGE.from),
        policyAt(null, RANGE.from + 40),
      ]);

      // Assert
      expect(found).toEqual({ ...HIGHLIGHT, policy: 2 });
    });

    it("should give the highlight null when the default starts where its range starts", () => {
      // Act
      const found = findHighlightPolicy(HIGHLIGHT, [
        policyAt(0, RANGE.from - 8),
        policyAt(null, RANGE.from),
      ]);

      // Assert
      expect(found).toEqual({ ...HIGHLIGHT, policy: null });
    });

    it("should give the highlight no index when no policy starts where its range starts", () => {
      // Act
      const found = findHighlightPolicy(HIGHLIGHT, [
        policyAt(0, RANGE.from - 8),
        policyAt(1, RANGE.from + 1),
        policyAt(null, RANGE.from + 40),
      ]);

      // Assert
      expect(found).toEqual({ ...HIGHLIGHT, policy: undefined });
    });

    it("should give the highlight no index when the evaluation has no policies", () => {
      // Act
      const found = findHighlightPolicy(HIGHLIGHT, []);

      // Assert
      expect(found).toEqual({ ...HIGHLIGHT, policy: undefined });
    });

    it("should find a policy again that the highlight did not know", () => {
      // Arrange
      const unknown: PolicyHighlight = { ...HIGHLIGHT, policy: undefined };

      // Act
      const found = findHighlightPolicy(unknown, [policyAt(3, RANGE.from)]);

      // Assert
      expect(found).toEqual({ ...HIGHLIGHT, policy: 3 });
    });

    it("should keep the same highlight when the index is the one it had", () => {
      // Act
      const found = findHighlightPolicy(HIGHLIGHT, [policyAt(1, RANGE.from)]);

      // Assert
      expect(found).toBe(HIGHLIGHT);
    });

    it("should keep the same highlight when the default is the policy it had", () => {
      // Arrange
      const byDefault: PolicyHighlight = { ...HIGHLIGHT, policy: null };

      // Act
      const found = findHighlightPolicy(byDefault, [
        policyAt(null, RANGE.from),
      ]);

      // Assert
      expect(found).toBe(byDefault);
    });

    it("should keep the same highlight when it had no index and no policy starts there", () => {
      // Arrange
      const unknown: PolicyHighlight = { ...HIGHLIGHT, policy: undefined };

      // Act
      const found = findHighlightPolicy(unknown, [policyAt(1, RANGE.from + 1)]);

      // Assert
      expect(found).toBe(unknown);
    });
  });
});
