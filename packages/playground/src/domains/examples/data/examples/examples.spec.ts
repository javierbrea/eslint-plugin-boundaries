import { createEngine } from "@/domains/evaluation/helpers/engine";
import type {
  DependencyResult,
  Evaluation,
  FileDescription,
} from "@/domains/evaluation/helpers/engine";
import {
  findSameSketch,
  fromText,
  getDependencyError,
  isSameProject,
  toText,
} from "@/domains/project/helpers/sketch";
import { decodeHash, encodeSketch } from "@/domains/share/helpers/sketchHash";
import type { HashReading } from "@/domains/share/helpers/sketchHash";

import { EXAMPLES } from "./examples";
import { QUICK_START_EXAMPLE } from "./quickStart";

/**
 * Tells whether a file has several categories.
 * @param description What the engine says about the file.
 * @param description.file
 */
function hasSeveralCategories({ file }: FileDescription): boolean {
  return file.categories !== null && file.categories.length > 1;
}

/**
 * Tells whether a policy judged a dependency on a package, which the rule only does when it checks every origin.
 * @param result The dependency with its verdict.
 * @param result.dependency
 * @param result.verdict
 */
function isPackageJudged({ dependency, verdict }: DependencyResult): boolean {
  return (
    dependency.target.kind === "external" &&
    (verdict.status === "allowed" || verdict.status === "disallowed")
  );
}

describe("examples", () => {
  const evaluate = createEngine().evaluate;
  let evaluations: readonly Evaluation[];

  beforeEach(() => {
    evaluations = EXAMPLES.map(({ sketch }) => evaluate(sketch));
  });

  describe("eXAMPLES", () => {
    it("should list the quick start example first, and then the examples of the docs", () => {
      // Assert
      expect(EXAMPLES[0]).toBe(QUICK_START_EXAMPLE);
      expect(EXAMPLES.map(({ id }) => id)).toEqual([
        "quick-start",
        "overview",
        "policies",
        "dependencies-rule",
      ]);
    });

    it("should have an id for each example, and no id twice", () => {
      // Act
      const ids = EXAMPLES.map((example) => example.id);

      // Assert
      expect(new Set(ids).size).toBe(EXAMPLES.length);
    });

    it.each(EXAMPLES)(
      "should have a kebab-case id and a title short enough for a menu item in $id",
      ({ id, title }) => {
        // Assert
        expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(title.length).toBeGreaterThan(0);
        expect(title.length).toBeLessThanOrEqual(24);
      }
    );

    it.each(EXAMPLES)(
      "should read back from its text in text mode as the same project, with no problems, in $id",
      ({ sketch }) => {
        // Act
        const result = fromText(toText(sketch), sketch);

        // Assert
        expect(result.problems).toEqual([]);
        expect(isSameProject(result.sketch, sketch)).toBe(true);
      }
    );

    it.each(EXAMPLES)(
      "should come back from its link exactly as it is in $id, so that the picker names it and Reset does not ask about it",
      (example) => {
        // Act
        const reading = decodeHash(encodeSketch(example.sketch));

        // Assert
        expect(reading).toStrictEqual({
          status: "sketch",
          sketch: example.sketch,
        });

        const { sketch } = reading as Extract<
          HashReading,
          { status: "sketch" }
        >;

        expect(findSameSketch(EXAMPLES, sketch)).toBe(example);
      }
    );

    it.each(EXAMPLES)(
      "should have only dependencies that the sketch can hold in $id",
      ({ sketch }) => {
        // Act
        const errors = sketch.dependencies.map((dependency, position) =>
          getDependencyError(
            {
              ...sketch,
              dependencies: sketch.dependencies.filter(
                (_other, index) => index !== position
              ),
            },
            dependency
          )
        );

        // Assert
        expect(errors).toEqual(sketch.dependencies.map(() => undefined));
      }
    );

    it("should have a config that the engine reads with no problems, and that judges every dependency, in each example", () => {
      // Assert
      expect(
        evaluations.map(
          ({ configParsed, rulesValid, notEvaluated, problems }) => ({
            configParsed,
            rulesValid,
            notEvaluated,
            problems,
          })
        )
      ).toEqual(
        EXAMPLES.map(() => ({
          configParsed: true,
          rulesValid: true,
          notEvaluated: undefined,
          problems: [],
        }))
      );
    });

    it("should have a file of an element with its types and its captured values, and a file with categories", () => {
      // Act
      const files = evaluations.flatMap(({ files: described }) => [
        ...described.values(),
      ]);

      // Assert
      expect(files.some(({ element }) => element.types !== null)).toBe(true);
      expect(files.some(({ element }) => element.captured !== null)).toBe(true);
      expect(files.some(({ file }) => file.categories !== null)).toBe(true);
    });

    it("should have a file with several categories", () => {
      // Act
      const files = evaluations.flatMap(({ files: described }) => [
        ...described.values(),
      ]);

      // Assert
      expect(files.some(hasSeveralCategories)).toBe(true);
    });

    it("should have a dependency on a package that a policy decides, because the rule checks every origin", () => {
      // Act
      const decided = evaluations
        .flatMap(({ dependencies }) => dependencies)
        .filter(isPackageJudged);

      // Assert
      expect(decided.length).toBeGreaterThan(0);
    });
  });
});
