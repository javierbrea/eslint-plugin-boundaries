import type {
  DependencyResult,
  DependencyVerdict,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import { toStatement } from "@/domains/project/helpers/sketch";

import type {
  DisallowedDependency,
  ExampleMessage,
} from "./exampleVerdicts.types";

/** The level of a dependency that is disallowed, by the severity ESLint reports it with */
const LEVELS = { 1: "warning", 2: "error" } as const;

/**
 * Reads the text a range covers.
 * @param text The config text.
 * @param range A range of the text.
 * @param range.from
 * @param range.to
 * @returns The text in the range.
 */
export function slice(text: string, { from, to }: TextRange): string {
  return text.slice(from, to);
}

/**
 * Writes the statement of a dependency as its result says it.
 * @param result The dependency with its source.
 * @param result.dependency
 * @param result.source
 * @returns The text of the statement.
 */
function statementOf({ dependency, source }: DependencyResult): string {
  return toStatement(dependency, source);
}

/**
 * Lists the statements of the dependencies of some files, as the engine writes them.
 * @param results The dependencies with their verdicts.
 * @param paths The paths of the files to list.
 * @returns For each path, the statements of its dependencies in order.
 */
export function listStatements(
  results: readonly DependencyResult[],
  paths: readonly string[]
): Record<string, string[]> {
  return Object.fromEntries(
    paths.map((path) => [
      path,
      results.filter(({ ref }) => ref.path === path).map(statementOf),
    ])
  );
}

/**
 * Lists the dependencies that were disallowed.
 * @param results The dependencies with their verdicts.
 * @returns For each one that was disallowed, sorted by file and line, its file, its line, its message and its level.
 */
export function listDisallowed(
  results: readonly DependencyResult[]
): DisallowedDependency[] {
  return results
    .flatMap(({ ref, verdict }) =>
      verdict.status === "disallowed"
        ? [
            {
              path: ref.path,
              line: ref.index + 1,
              message: verdict.message,
              level: verdict.level,
            },
          ]
        : []
    )
    .sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
}

/**
 * Reads what ESLint reported as the dependencies that the engine has to disallow.
 * @param messages The messages that ESLint reported, sorted by path and line.
 * @returns For each one, its file, its line, its message and the level of its severity.
 */
export function listReported(
  messages: readonly ExampleMessage[]
): DisallowedDependency[] {
  return messages.map(({ path, line, message, severity }) => ({
    path,
    line,
    message,
    level: LEVELS[severity],
  }));
}

/**
 * Tells what decided a verdict, as a table of a test writes it.
 * @param verdict The verdict.
 * @returns The skip reason of a dependency that is not checked, and otherwise the index of the policy that decided, with `null` for the default and `undefined` when none is known.
 */
function decisionOf(
  verdict: DependencyVerdict
): string | number | null | undefined {
  if (verdict.status === "not-checked") {
    return verdict.reason;
  }
  return verdict.status === "not-evaluated" ? undefined : verdict.policy?.index;
}

/**
 * Lists the verdict of every dependency, as a table of a test writes it.
 * @param results The dependencies with their verdicts.
 * @returns For each one, in order, its file, its line, its status and what decided it.
 */
export function listDecisions(
  results: readonly DependencyResult[]
): (string | number | null | undefined)[][] {
  return results.map(({ ref, verdict }) => [
    ref.path,
    ref.index + 1,
    verdict.status,
    decisionOf(verdict),
  ]);
}
