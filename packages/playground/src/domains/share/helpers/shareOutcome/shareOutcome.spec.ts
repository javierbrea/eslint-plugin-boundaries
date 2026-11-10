import type { Sketch, SketchDependency, SketchNode } from "@/contract";
import {
  MAX_SKETCH_DEPENDENCIES,
  MAX_SKETCH_NODES,
} from "@/domains/project/helpers/sketch/sketch.constants";
import { LONG_LINK_LENGTH } from "@/domains/share/helpers/sketchHash";
import { MAX_SKETCH_JSON_BYTES } from "@/domains/share/helpers/sketchHash/sketchHash.constants";

import { getCopiedOutcome, getRefusedOutcome } from "./shareOutcome";

/**
 * Makes a sketch with a number of files and a number of dependencies, spread over the files, each on an external module of its own.
 * @param fileCount How many files.
 * @param dependencyCount How many dependencies.
 * @returns The sketch, which the reader of links accepts when it is within the limits.
 */
function createSketch(fileCount: number, dependencyCount: number): Sketch {
  const tree: SketchNode[] = Array.from({ length: fileCount }, (_, index) => ({
    path: `src/f${index}.js`,
    kind: "file",
  }));
  const dependencies: SketchDependency[] = Array.from(
    { length: dependencyCount },
    (_, index) => ({
      from: `src/f${index % fileCount}.js`,
      target: { kind: "external", name: `m${index}` },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "named", name: `n${index}` }],
    })
  );

  return { config: "{ settings: {}, rules: {} }", tree, dependencies };
}

/**
 * Makes a sketch whose JSON as a link writes it has exactly the bytes given, all of them ASCII.
 * @param bytes The size of the JSON.
 * @returns The sketch, which has no files and a config as long as the size needs.
 */
function createSketchOfBytes(bytes: number): Sketch {
  const empty: Sketch = { config: "", tree: [], dependencies: [] };
  const overhead = JSON.stringify(empty).length;

  return { ...empty, config: "a".repeat(bytes - overhead) };
}

describe("ShareOutcome", () => {
  describe("getCopiedOutcome", () => {
    it("should say that the link was copied when it is short", () => {
      // Arrange
      const link = `https://example.com/playground/#v=1&s=${"a".repeat(40)}`;

      // Act
      const outcome = getCopiedOutcome(link);

      // Assert
      expect(outcome).toStrictEqual({ kind: "copied" });
    });

    it("should say that the link was copied when it has the longest length that is not long", () => {
      // Arrange
      const link = "a".repeat(LONG_LINK_LENGTH);

      // Act
      const outcome = getCopiedOutcome(link);

      // Assert
      expect(outcome).toStrictEqual({ kind: "copied" });
    });

    it("should say that the link is long when it has one character more", () => {
      // Arrange
      const link = "a".repeat(LONG_LINK_LENGTH + 1);

      // Act
      const outcome = getCopiedOutcome(link);

      // Assert
      expect(outcome).toStrictEqual({
        kind: "long",
        length: LONG_LINK_LENGTH + 1,
        maxLength: LONG_LINK_LENGTH,
      });
    });

    it("should tell 8192 characters apart from 8193, which is the length from which a link is long", () => {
      // Arrange
      const notLong = "a".repeat(8192);
      const long = "a".repeat(8193);

      // Act
      const notLongOutcome = getCopiedOutcome(notLong);
      const longOutcome = getCopiedOutcome(long);

      // Assert
      expect(notLongOutcome).toStrictEqual({ kind: "copied" });
      expect(longOutcome).toStrictEqual({
        kind: "long",
        length: 8193,
        maxLength: 8192,
      });
    });

    it("should tell the length of the link, and not the one above which it is long, when it is much longer", () => {
      // Arrange
      const link = "a".repeat(20000);

      // Act
      const outcome = getCopiedOutcome(link);

      // Assert
      expect(outcome).toStrictEqual({
        kind: "long",
        length: 20000,
        maxLength: 8192,
      });
    });
  });

  describe("getRefusedOutcome", () => {
    it("should refuse nothing when the sketch is small", () => {
      // Arrange
      const sketch = createSketch(3, 4);

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toBeUndefined();
    });

    it("should refuse nothing when the sketch has nothing", () => {
      // Arrange
      const sketch: Sketch = { config: "", tree: [], dependencies: [] };

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toBeUndefined();
    });

    it("should refuse nothing when the sketch has the most files and dependencies a link can hold", () => {
      // Arrange
      const sketch = createSketch(MAX_SKETCH_NODES, MAX_SKETCH_DEPENDENCIES);

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(sketch.tree).toHaveLength(1000);
      expect(sketch.dependencies).toHaveLength(3000);
      expect(refusal).toBeUndefined();
    });

    it("should say that the sketch is too large, with the most files that a link can hold, when it has one file more", () => {
      // Arrange
      const sketch = createSketch(MAX_SKETCH_NODES + 1, 0);

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toStrictEqual({
        kind: "too-large",
        limit: "nodes",
        max: 1000,
      });
    });

    it("should count the folders as well as the files", () => {
      // Arrange
      const full = createSketch(MAX_SKETCH_NODES, 0);
      const sketch: Sketch = {
        ...full,
        tree: [...full.tree, { path: "empty", kind: "folder" }],
      };

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toStrictEqual({
        kind: "too-large",
        limit: "nodes",
        max: 1000,
      });
    });

    it("should say that the sketch is too large, with the most dependencies that a link can hold, when it has one dependency more", () => {
      // Arrange
      const sketch = createSketch(
        MAX_SKETCH_NODES,
        MAX_SKETCH_DEPENDENCIES + 1
      );

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toStrictEqual({
        kind: "too-large",
        limit: "dependencies",
        max: 3000,
      });
    });

    it("should refuse nothing when the JSON of the sketch has the most bytes a link can hold", () => {
      // Arrange
      const sketch = createSketchOfBytes(MAX_SKETCH_JSON_BYTES);

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toBeUndefined();
    });

    it("should say that the sketch is too large, with the most bytes that a link can hold, when its JSON has one byte more", () => {
      // Arrange
      const sketch = createSketchOfBytes(MAX_SKETCH_JSON_BYTES + 1);

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toStrictEqual({
        kind: "too-large",
        limit: "bytes",
        max: 4194304,
      });
    });

    it("should say that the sketch is invalid, with the reason the reader of links gives, when it is refused for another cause", () => {
      // Arrange
      const sketch: Sketch = {
        config: "",
        tree: [{ path: "src/a.js ", kind: "file" }],
        dependencies: [],
      };

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toStrictEqual({
        kind: "invalid",
        reason:
          '"src/a.js " cannot be in the tree. A path cannot end with a space.',
      });
    });

    it("should say that the sketch is invalid when a dependency points to a file that it does not have", () => {
      // Arrange
      const sketch: Sketch = {
        config: "",
        tree: [{ path: "src/a.js", kind: "file" }],
        dependencies: [
          {
            from: "src/a.js",
            target: { kind: "node", path: "src/missing.js" },
            syntax: "import",
            importKind: "value",
            specifiers: [],
          },
        ],
      };

      // Act
      const refusal = getRefusedOutcome(sketch);

      // Assert
      expect(refusal).toStrictEqual({
        kind: "invalid",
        reason:
          'Dependency 1 cannot be in the project. "src/missing.js" is not a file of the project.',
      });
    });
  });
});
