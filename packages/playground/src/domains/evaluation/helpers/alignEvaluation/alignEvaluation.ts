import type { Sketch, SketchDependency } from "@/contract";
import type {
  DependencyResult,
  EntityDescription,
  Evaluation,
} from "@/domains/evaluation/helpers/engine";
import {
  getDependencySource,
  getFiles,
} from "@/domains/project/helpers/sketch";

/** The verdict of a dependency that no evaluation has decided yet. */
const PENDING = { status: "pending" } as const;

/**
 * Writes what decides the verdict of a dependency as one text: its file, its target, its syntax, its kind and its names. Two dependencies with the same text are judged alike by the same config.
 * @param dependency A dependency of a sketch.
 * @param dependency.from
 * @param dependency.target
 * @param dependency.syntax
 * @param dependency.importKind
 * @param dependency.specifiers
 * @returns The text, the same for dependencies that hold the same data, whatever the order of the keys of their objects.
 */
function getDependencyKey({
  from,
  target,
  syntax,
  importKind,
  specifiers,
}: SketchDependency): string {
  return JSON.stringify([
    from,
    target.kind === "node" ? ["node", target.path] : ["external", target.name],
    syntax,
    importKind,
    specifiers.map((specifier) => [
      specifier.kind,
      specifier.name,
      specifier.alias ?? null,
    ]),
  ]);
}

/**
 * Gives each dependency of a sketch a result, with its own position in its file: the result of a dependency that holds the same data, among the known ones, or a pending one.
 * @param known The results to take from, of any sketch.
 * @param sketch The sketch whose dependencies need results.
 * @returns A result for each dependency of the sketch, in its order, whose `dependency` and `ref` are those of the sketch. A known result is taken once.
 */
function alignResults(
  known: readonly DependencyResult[],
  sketch: Pick<Sketch, "dependencies">
): DependencyResult[] {
  const byKey = new Map<string, DependencyResult[]>();
  const seen = new Map<string, number>();

  known.forEach((result) => {
    const key = getDependencyKey(result.dependency);
    const results = byKey.get(key);

    if (results === undefined) {
      byKey.set(key, [result]);
    } else {
      results.push(result);
    }
  });

  return sketch.dependencies.map((dependency): DependencyResult => {
    const index = seen.get(dependency.from) ?? 0;
    const ref = { path: dependency.from, index };
    const result = byKey.get(getDependencyKey(dependency))?.shift();

    seen.set(dependency.from, index + 1);
    return result === undefined
      ? {
          dependency,
          ref,
          source: getDependencySource(dependency),
          description: undefined,
          verdict: PENDING,
        }
      : { ...result, dependency, ref };
  });
}

/**
 * Gives the dependencies of a sketch that has no evaluation yet, each with a pending verdict.
 * @param sketch The sketch.
 * @returns A pending result for each dependency, in the order of the sketch.
 */
export function getPendingResults(
  sketch: Pick<Sketch, "dependencies">
): DependencyResult[] {
  return alignResults([], sketch);
}

/**
 * Shows the last evaluation as the evaluation of a newer sketch, so that the panes keep what it said while the newer one is evaluated. A dependency keeps the verdict and the description of a dependency of the evaluation that holds the same data, which the same config judges alike, and a file keeps the description of the file of the same path; a dependency that the evaluation does not have is pending, and a file that it does not have is left out. What the evaluation says about the config, its problems and its summaries, stays as it is, with the `sketch` that was evaluated, whose config text its ranges point into.
 * @param evaluation The last evaluation.
 * @param sketch The sketch on screen.
 * @returns The same evaluation when its sketch has the tree and the dependencies of `sketch`, such as after an edit of the config only; otherwise an evaluation whose `files` and `dependencies` follow `sketch`, each one the same object as in the evaluation when its part of the sketch did not change.
 */
export function alignEvaluation(
  evaluation: Evaluation,
  sketch: Sketch
): Evaluation {
  const evaluated = evaluation.sketch;
  const sameTree = evaluated.tree === sketch.tree;
  const sameDependencies = evaluated.dependencies === sketch.dependencies;

  if (sameTree && sameDependencies) {
    return evaluation;
  }

  const files = sameTree
    ? evaluation.files
    : new Map(
        getFiles(sketch).flatMap((path): [string, EntityDescription][] => {
          const description = evaluation.files.get(path);

          return description === undefined ? [] : [[path, description]];
        })
      );

  return {
    ...evaluation,
    files,
    dependencies: sameDependencies
      ? evaluation.dependencies
      : alignResults(evaluation.dependencies, sketch),
  };
}
