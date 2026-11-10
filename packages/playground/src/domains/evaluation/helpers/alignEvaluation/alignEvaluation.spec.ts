import type { Sketch, SketchDependency } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type {
  DependencyResult,
  Evaluation,
} from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import { alignEvaluation, getPendingResults } from "./alignEvaluation";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const CHECKOUT = "src/modules/checkout/index.js";
const FORMAT = "src/helpers/format/index.js";
const BUTTON = "src/components/atoms/Button/index.js";

const PENDING = { status: "pending" };

const { evaluate } = createEngine();

/**
 * Copies a dependency into objects of its own, with the same data.
 * @param dependency The dependency.
 * @returns The copy.
 */
function copyOf(dependency: SketchDependency): SketchDependency {
  return {
    ...dependency,
    target: { ...dependency.target },
    specifiers: dependency.specifiers.map((specifier) => ({ ...specifier })),
  };
}

/**
 * Writes an object with its keys in the opposite order.
 * @param value The object.
 * @returns The same data, written in another order.
 */
function reverseKeys<Value extends object>(value: Value): Value {
  return Object.fromEntries(Object.entries(value).reverse()) as Value;
}

/**
 * Makes a sketch with other dependencies, which is not the object of the sketch it comes from.
 * @param dependencies The dependencies of the new sketch.
 * @returns The sketch, with the config and the tree of the quick-start project.
 */
function withDependencies(dependencies: readonly SketchDependency[]): Sketch {
  return { ...QUICK_START, dependencies };
}

/**
 * Takes the results of the dependencies of a file.
 * @param evaluation The evaluation.
 * @param path The path of the file.
 * @returns Its results, in order.
 */
function resultsOf(
  evaluation: Evaluation,
  path: string
): readonly DependencyResult[] {
  return evaluation.dependencies.filter(({ ref }) => ref.path === path);
}

/**
 * Takes one field of each result.
 * @param results The results.
 * @param field The name of the field.
 * @returns The value of the field in each result, in order.
 */
function fieldOf<Field extends keyof DependencyResult>(
  results: readonly DependencyResult[],
  field: Field
): DependencyResult[Field][] {
  return results.map((result) => result[field]);
}

/**
 * Tells for each expected object whether the item at its position is that same object.
 * @param actual The items to check.
 * @param expected The objects they must be.
 * @returns One answer for each expected object.
 */
function identities<Item>(
  actual: readonly Item[],
  expected: readonly Item[]
): boolean[] {
  return expected.map((item, index) => actual[index] === item);
}

/**
 * Writes the answers of `identities` when every object is the one expected.
 * @param count How many objects are expected.
 * @returns A `true` for each.
 */
function allSame(count: number): boolean[] {
  return Array.from({ length: count }, () => true);
}

/** A dependency that no evaluation knows, which `checkout` has in the middle */
const NEW_DEPENDENCY: SketchDependency = {
  from: CHECKOUT,
  target: { kind: "external", name: "lodash" },
  syntax: "import",
  importKind: "value",
  specifiers: [{ kind: "named", name: "debounce" }],
};

describe("alignEvaluation", () => {
  describe("alignEvaluation", () => {
    describe("when the tree and the dependencies are the same arrays", () => {
      it("should give back the same evaluation, as after an edit of the config only", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const edited: Sketch = {
          ...QUICK_START,
          config: `${QUICK_START.config}\n// edited`,
        };

        // Act
        const aligned = alignEvaluation(evaluation, edited);

        // Assert
        expect(edited.config).not.toBe(evaluation.sketch.config);
        expect(aligned).toBe(evaluation);
      });
    });

    describe("when only the dependencies changed", () => {
      it("should keep the same map of files", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies(QUICK_START.dependencies.slice(1));

        // Act
        const aligned = alignEvaluation(evaluation, sketch);

        // Assert
        expect(aligned).not.toBe(evaluation);
        expect(aligned.files).toBe(evaluation.files);
      });

      it("should follow the dependencies of the sketch, in its order", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies(QUICK_START.dependencies.slice(1));

        // Act
        const aligned = alignEvaluation(evaluation, sketch);

        // Assert
        expect(aligned.dependencies).toHaveLength(8);
        expect(
          identities(
            fieldOf(aligned.dependencies, "dependency"),
            sketch.dependencies
          )
        ).toEqual(allSame(8));
      });
    });

    describe("when only the tree changed", () => {
      it("should keep the same dependencies", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch: Sketch = {
          ...QUICK_START,
          tree: QUICK_START.tree.filter(({ path }) => path !== FORMAT),
        };

        // Act
        const aligned = alignEvaluation(evaluation, sketch);

        // Assert
        expect(aligned).not.toBe(evaluation);
        expect(aligned.dependencies).toBe(evaluation.dependencies);
      });

      it("should leave out the files that the tree no longer has, and keep the description of the others", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch: Sketch = {
          ...QUICK_START,
          tree: QUICK_START.tree.filter(({ path }) => path !== FORMAT),
        };

        // Act
        const { files } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(evaluation.files.has(FORMAT)).toBe(true);
        expect(files).not.toBe(evaluation.files);
        expect(files.has(FORMAT)).toBe(false);
        expect(files.size).toBe(evaluation.files.size - 1);
        expect(
          [...files].map(
            ([path, description]) => description === evaluation.files.get(path)
          )
        ).toEqual(allSame(files.size));
      });

      it("should leave out a file that the evaluation never described", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch: Sketch = {
          ...QUICK_START,
          tree: [...QUICK_START.tree, { path: "src/new.js", kind: "file" }],
        };

        // Act
        const { files } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(files.has("src/new.js")).toBe(false);
        expect(new Set(files.keys())).toEqual(new Set(evaluation.files.keys()));
      });

      it("should not take a folder for a file", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch: Sketch = {
          ...QUICK_START,
          tree: [...QUICK_START.tree, { path: "src/empty", kind: "folder" }],
        };

        // Act
        const { files } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(files.has("src/empty")).toBe(false);
        expect(files.size).toBe(evaluation.files.size);
      });
    });

    describe("when the tree and the dependencies changed", () => {
      it("should align the files and the dependencies", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch: Sketch = {
          ...QUICK_START,
          tree: QUICK_START.tree.filter(({ path }) => path !== FORMAT),
          dependencies: QUICK_START.dependencies.slice(1),
        };

        // Act
        const aligned = alignEvaluation(evaluation, sketch);

        // Assert
        expect(aligned.files.has(FORMAT)).toBe(false);
        expect(aligned.dependencies).toHaveLength(8);
      });
    });

    describe("what the evaluation says about the config", () => {
      it("should stay as it is, with the sketch that was evaluated, whatever changed", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch: Sketch = {
          config: `${QUICK_START.config}\n// edited`,
          tree: QUICK_START.tree.slice(1),
          dependencies: QUICK_START.dependencies.slice(1),
        };
        const objectsOf = ({
          sketch: evaluated,
          problems,
          elementTypes,
          fileCategories,
          rules,
          policies,
        }: Evaluation): unknown[] => [
          evaluated,
          problems,
          elementTypes,
          fileCategories,
          rules,
          policies,
        ];

        // Act
        const aligned = alignEvaluation(evaluation, sketch);

        // Assert
        expect(identities(objectsOf(aligned), objectsOf(evaluation))).toEqual(
          allSame(6)
        );
        expect(aligned.configParsed).toBe(evaluation.configParsed);
        expect(aligned.rulesValid).toBe(evaluation.rulesValid);
        expect(aligned.notEvaluated).toBe(evaluation.notEvaluated);
      });
    });

    describe("the results of the dependencies", () => {
      it("should keep the verdict and the description of a dependency that holds the same data, even when it is a new object", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies(QUICK_START.dependencies.map(copyOf));

        // Act
        const { dependencies } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(dependencies).toHaveLength(9);
        expect(
          identities(
            fieldOf(dependencies, "verdict"),
            fieldOf(evaluation.dependencies, "verdict")
          )
        ).toEqual(allSame(9));
        expect(
          identities(
            fieldOf(dependencies, "description"),
            fieldOf(evaluation.dependencies, "description")
          )
        ).toEqual(allSame(9));
      });

      it("should keep the source and the position of those dependencies", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies(QUICK_START.dependencies.map(copyOf));

        // Act
        const { dependencies } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(fieldOf(dependencies, "source")).toEqual(
          fieldOf(evaluation.dependencies, "source")
        );
        expect(fieldOf(dependencies, "ref")).toEqual(
          fieldOf(evaluation.dependencies, "ref")
        );
      });

      it("should give each result the dependency of the sketch, and not the one it had", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies(QUICK_START.dependencies.map(copyOf));

        // Act
        const { dependencies } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(
          identities(fieldOf(dependencies, "dependency"), sketch.dependencies)
        ).toEqual(allSame(9));
        expect(
          identities(
            fieldOf(dependencies, "dependency"),
            fieldOf(evaluation.dependencies, "dependency")
          )
        ).not.toContain(true);
      });

      it("should keep the result of a dependency at its new position, and number it by the position in the sketch", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const [first, ...others] = resultsOf(evaluation, CHECKOUT);
        const sketch = withDependencies(
          QUICK_START.dependencies.filter(
            (dependency) => dependency !== first.dependency
          )
        );

        // Act
        const results = resultsOf(
          alignEvaluation(evaluation, sketch),
          CHECKOUT
        );

        // Assert
        expect(others[0].ref.index).toBe(1);
        expect(fieldOf(results, "ref")).toEqual([
          { path: CHECKOUT, index: 0 },
          { path: CHECKOUT, index: 1 },
          { path: CHECKOUT, index: 2 },
        ]);
        expect(
          identities(fieldOf(results, "verdict"), fieldOf(others, "verdict"))
        ).toEqual(allSame(3));
        expect(
          identities(
            fieldOf(results, "description"),
            fieldOf(others, "description")
          )
        ).toEqual(allSame(3));
      });

      it("should give a new dependency a pending verdict, with no description and its own source", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const at = QUICK_START.dependencies.indexOf(
          resultsOf(evaluation, CHECKOUT)[0].dependency
        );
        const sketch = withDependencies([
          ...QUICK_START.dependencies.slice(0, at),
          NEW_DEPENDENCY,
          ...QUICK_START.dependencies.slice(at),
        ]);

        // Act
        const [added] = resultsOf(
          alignEvaluation(evaluation, sketch),
          CHECKOUT
        );

        // Assert
        expect(added).toEqual({
          dependency: NEW_DEPENDENCY,
          ref: { path: CHECKOUT, index: 0 },
          source: "lodash",
          description: undefined,
          verdict: PENDING,
        });
        expect(added.dependency).toBe(NEW_DEPENDENCY);
      });

      it("should keep the result of the dependencies that come after a new one, and move them", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const known = resultsOf(evaluation, CHECKOUT);
        const at = QUICK_START.dependencies.indexOf(known[0].dependency);
        const sketch = withDependencies([
          ...QUICK_START.dependencies.slice(0, at),
          NEW_DEPENDENCY,
          ...QUICK_START.dependencies.slice(at),
        ]);

        // Act
        const [, ...moved] = resultsOf(
          alignEvaluation(evaluation, sketch),
          CHECKOUT
        );

        // Assert
        expect(
          identities(fieldOf(moved, "verdict"), fieldOf(known, "verdict"))
        ).toEqual(allSame(4));
        expect(fieldOf(moved, "ref").map(({ index }) => index)).toEqual([
          1, 2, 3, 4,
        ]);
      });

      it("should write the source of a new dependency on a file of the sketch as a relative path", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const dependency: SketchDependency = {
          from: CHECKOUT,
          target: { kind: "node", path: FORMAT },
          syntax: "require",
          importKind: "value",
          specifiers: [],
        };

        // Act
        const aligned = alignEvaluation(
          evaluation,
          withDependencies([...QUICK_START.dependencies, dependency])
        );

        // Assert
        const added = aligned.dependencies[9];

        expect(aligned.dependencies).toHaveLength(10);
        expect(added.source).toBe("../../helpers/format/index.js");
        expect(added.verdict).toEqual(PENDING);
        expect(added.description).toBeUndefined();
      });

      it("should keep the result of the others when a dependency is new", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies([
          ...QUICK_START.dependencies,
          NEW_DEPENDENCY,
        ]);

        // Act
        const { dependencies } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(dependencies).toHaveLength(10);
        expect(
          identities(
            fieldOf(dependencies.slice(0, 9), "verdict"),
            fieldOf(evaluation.dependencies, "verdict")
          )
        ).toEqual(allSame(9));
        expect(dependencies[9].verdict).toEqual(PENDING);
        expect(dependencies[9].ref).toEqual({ path: CHECKOUT, index: 4 });
      });

      it("should give two identical dependencies the results of two identical ones, once each", () => {
        // Arrange
        const twice = withDependencies([
          QUICK_START.dependencies[0],
          copyOf(QUICK_START.dependencies[0]),
        ]);
        const evaluation = evaluate(twice);
        const thrice = withDependencies([
          ...twice.dependencies,
          copyOf(QUICK_START.dependencies[0]),
        ]);

        // Act
        const { dependencies } = alignEvaluation(evaluation, thrice);

        // Assert
        expect(dependencies).toHaveLength(3);
        expect(
          identities(
            fieldOf(dependencies.slice(0, 2), "verdict"),
            fieldOf(evaluation.dependencies, "verdict")
          )
        ).toEqual(allSame(2));
        expect(dependencies[2].verdict).toEqual(PENDING);
      });

      it("should take the known results of identical dependencies in their order", () => {
        // Arrange
        const twice = withDependencies([
          QUICK_START.dependencies[0],
          copyOf(QUICK_START.dependencies[0]),
        ]);
        const evaluation = evaluate(twice);
        const first = {
          ...evaluation.dependencies[0],
          verdict: { status: "not-evaluated" } as const,
        };
        const second = {
          ...evaluation.dependencies[1],
          verdict: { status: "not-checked", reason: "internal" } as const,
        };

        // Act
        const { dependencies } = alignEvaluation(
          { ...evaluation, dependencies: [first, second] },
          withDependencies(twice.dependencies.map(copyOf))
        );

        // Assert
        expect(fieldOf(dependencies, "verdict")).toEqual([
          first.verdict,
          second.verdict,
        ]);
      });

      it("should ignore the order of the keys of the objects of a dependency", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies(
          QUICK_START.dependencies.map((dependency) =>
            reverseKeys({
              ...dependency,
              target: reverseKeys(dependency.target),
              specifiers: dependency.specifiers.map(reverseKeys),
            })
          )
        );

        // Act
        const { dependencies } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(dependencies).toHaveLength(9);
        expect(
          identities(
            fieldOf(dependencies, "verdict"),
            fieldOf(evaluation.dependencies, "verdict")
          )
        ).toEqual(allSame(9));
      });

      it("should take an alias that is undefined as no alias", () => {
        // Arrange
        const evaluation = evaluate(QUICK_START);
        const sketch = withDependencies(
          QUICK_START.dependencies.map((dependency) => ({
            ...dependency,
            specifiers: dependency.specifiers.map((specifier) => ({
              ...specifier,
              alias: undefined,
            })),
          }))
        );

        // Act
        const { dependencies } = alignEvaluation(evaluation, sketch);

        // Assert
        expect(dependencies).toHaveLength(9);
        expect(
          identities(
            fieldOf(dependencies, "verdict"),
            fieldOf(evaluation.dependencies, "verdict")
          )
        ).toEqual(allSame(9));
      });

      it.each<[string, (dependency: SketchDependency) => SketchDependency]>([
        [
          "its file",
          (dependency) => ({ ...dependency, from: "src/other/index.js" }),
        ],
        [
          "the file it points to",
          (dependency) => ({
            ...dependency,
            target: { kind: "node", path: "src/other/index.js" },
          }),
        ],
        [
          "the module it points to",
          (dependency) => ({
            ...dependency,
            target: { kind: "external", name: "other" },
          }),
        ],
        [
          "its target from a file to a module with the same text",
          (dependency) => ({
            ...dependency,
            target: { kind: "external", name: BUTTON },
          }),
        ],
        ["its syntax", (dependency) => ({ ...dependency, syntax: "require" })],
        [
          "its import kind",
          (dependency) => ({ ...dependency, importKind: "type" }),
        ],
        [
          "the name it imports",
          (dependency) => ({
            ...dependency,
            specifiers: [{ kind: "named", name: "Other" }],
          }),
        ],
        [
          "the kind of the name it imports",
          (dependency) => ({
            ...dependency,
            specifiers: [{ kind: "default", name: "Button" }],
          }),
        ],
        [
          "the alias of the name it imports",
          (dependency) => ({
            ...dependency,
            specifiers: [{ kind: "named", name: "Button", alias: "Other" }],
          }),
        ],
        [
          "how many names it imports",
          (dependency) => ({
            ...dependency,
            specifiers: [
              { kind: "named", name: "Button" },
              { kind: "named", name: "Other" },
            ],
          }),
        ],
      ])(
        "should give a pending verdict to a dependency that changed %s, and keep the others",
        (_title, change) => {
          // Arrange
          const evaluation = evaluate(QUICK_START);
          const [changed, ...others] = evaluation.dependencies;
          const edited = change(changed.dependency);
          const sketch = withDependencies([
            edited,
            ...others.map(({ dependency }) => dependency),
          ]);

          // Act
          const { dependencies } = alignEvaluation(evaluation, sketch);

          // Assert
          expect(edited).not.toEqual(changed.dependency);
          expect(dependencies[0].verdict).toEqual(PENDING);
          expect(
            identities(
              fieldOf(dependencies.slice(1), "verdict"),
              fieldOf(others, "verdict")
            )
          ).toEqual(allSame(8));
        }
      );
    });
  });

  describe("getPendingResults", () => {
    it("should give each dependency of the sketch a pending result, with its dependency, in its order", () => {
      // Act
      const results = getPendingResults(QUICK_START);

      // Assert
      expect(results).toHaveLength(9);
      expect(
        identities(fieldOf(results, "dependency"), QUICK_START.dependencies)
      ).toEqual(allSame(9));
      expect(fieldOf(results, "verdict")).toEqual(
        QUICK_START.dependencies.map(() => PENDING)
      );
      expect(fieldOf(results, "description")).toEqual(
        QUICK_START.dependencies.map(() => undefined)
      );
    });

    it("should write the source of each dependency, and number the dependencies of each file as the engine does", () => {
      // Arrange
      const { dependencies } = evaluate(QUICK_START);

      // Act
      const results = getPendingResults(QUICK_START);

      // Assert
      expect(fieldOf(results, "source")).toEqual(
        fieldOf(dependencies, "source")
      );
      expect(fieldOf(results, "ref")).toEqual(fieldOf(dependencies, "ref"));
      expect(fieldOf(results, "source")).toContain("react");
      expect(results[6].ref).toEqual({ path: CHECKOUT, index: 2 });
    });

    it("should number the dependencies of a file by its own order when the files are mixed", () => {
      // Arrange
      const [first, second] = QUICK_START.dependencies;
      const mixed = [first, { ...second, from: CHECKOUT }, first, second];

      // Act
      const results = getPendingResults({ dependencies: mixed });

      // Assert
      expect(fieldOf(results, "ref")).toEqual([
        { path: first.from, index: 0 },
        { path: CHECKOUT, index: 0 },
        { path: first.from, index: 1 },
        { path: second.from, index: 0 },
      ]);
    });

    it("should give no result for a sketch with no dependencies", () => {
      // Act
      const results = getPendingResults({ dependencies: [] });

      // Assert
      expect(results).toEqual([]);
    });
  });
});
