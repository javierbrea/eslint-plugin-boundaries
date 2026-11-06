import { createEngine } from "@/domains/evaluation/helpers/engine";
import type {
  DependencyResult,
  DependencyVerdict,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import {
  QUICK_START_MESSAGES,
  QUICK_START_STATEMENTS,
} from "@/domains/evaluation/helpers/engine/quickStartVerdicts.mock";
import { toStatement } from "@/domains/project/helpers/sketch";

import { QUICK_START_EXAMPLE } from "./quickStart";

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
function slice(text: string, { from, to }: TextRange): string {
  return text.slice(from, to);
}

/**
 * Lists the dependencies that were disallowed.
 * @param results The dependencies with their verdicts.
 * @returns For each one that was disallowed, sorted by file and line, its file, its line, its message and its level.
 */
function listDisallowed(results: readonly DependencyResult[]): {
  path: string;
  line: number;
  message: string;
  level: "error" | "warning";
}[] {
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
 * Writes the statement of a dependency as its result says it.
 * @param result The dependency with its source.
 * @param result.dependency
 * @param result.source
 * @returns The text of the statement.
 */
function statementOf({ dependency, source }: DependencyResult): string {
  return toStatement(dependency, source);
}

describe("QUICK_START_EXAMPLE", () => {
  const evaluate = createEngine().evaluate;

  describe("verdicts", () => {
    const example = QUICK_START_EXAMPLE.sketch;

    it("should write the statements of the plugin's project, file by file and in order", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      const statementsByFile = Object.fromEntries(
        Object.keys(QUICK_START_STATEMENTS).map((path) => [
          path,
          dependencies.filter(({ ref }) => ref.path === path).map(statementOf),
        ])
      );

      expect(statementsByFile).toEqual(QUICK_START_STATEMENTS);
      expect(dependencies).toHaveLength(9);
    });

    it("should disallow exactly the dependencies that ESLint reports, with their files, lines and messages", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDisallowed(dependencies)).toEqual(
        QUICK_START_MESSAGES.map(({ path, line, message, severity }) => ({
          path,
          line,
          message,
          level: LEVELS[severity],
        }))
      );
    });

    it("should give every dependency the verdict that the plan lists, in the order of the sketch", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(
        dependencies.map(({ ref, verdict }) => [
          ref.path,
          ref.index + 1,
          verdict.status,
          decisionOf(verdict),
        ])
      ).toEqual([
        [
          "src/components/atoms/Button/Button.spec.js",
          1,
          "not-checked",
          "internal",
        ],
        ["src/components/atoms/Button/index.js", 1, "allowed", 0],
        ["src/components/atoms/Button/index.js", 2, "not-checked", "internal"],
        ["src/helpers/format/index.js", 1, "disallowed", null],
        ["src/modules/checkout/index.js", 1, "allowed", 1],
        ["src/modules/checkout/index.js", 2, "allowed", 1],
        ["src/modules/checkout/index.js", 3, "disallowed", 2],
        ["src/modules/checkout/index.js", 4, "not-checked", "not-local"],
        ["src/index.js", 1, "not-checked", "from-unknown"],
      ]);
    });

    it("should say that nothing is left unevaluated", () => {
      // Act
      const { notEvaluated, rulesValid } = evaluate(example);

      // Assert
      expect(notEvaluated).toBeUndefined();
      expect(rulesValid).toBe(true);
    });

    it("should summarize the three policies and the default with the dependencies each one decided", () => {
      // Act
      const { policies } = evaluate(example);

      // Assert
      expect(
        policies.map(({ index, action, from, to, decided, disallowed }) => ({
          index,
          action,
          from,
          to,
          decided,
          disallowed,
        }))
      ).toEqual([
        {
          index: 0,
          action: "allow",
          from: ["component"],
          to: ["helper"],
          decided: 1,
          disallowed: 0,
        },
        {
          index: 1,
          action: "allow",
          from: ["module"],
          to: ["component", "helper"],
          decided: 2,
          disallowed: 0,
        },
        {
          index: 2,
          action: "disallow",
          from: [],
          to: ["test"],
          decided: 1,
          disallowed: 1,
        },
        {
          index: null,
          action: "disallow",
          from: [],
          to: [],
          decided: 1,
          disallowed: 1,
        },
      ]);
    });

    it("should place the dependency that policy 2 disallowed, and the policy, at its text of the config", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const policy = policies[2];

      expect(slice(example.config, policy.range)).toBe(
        [
          "{",
          "          // No element may import a test file, whatever element it belongs to",
          '          disallow: { to: { file: { categories: "test" } } },',
          "        }",
        ].join("\n")
      );
      expect([policy.range.line, policy.range.column]).toEqual([25, 9]);
      expect(dependencies[6].verdict).toMatchObject({
        policy: { index: 2, range: policy.range },
      });
    });

    it("should place the dependency that the default disallowed, and the default, at its value in the config", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const fallback = policies[3];

      expect(slice(example.config, fallback.range)).toBe('"disallow"');
      expect([fallback.range.line, fallback.range.column]).toEqual([15, 16]);
      expect(dependencies[3].verdict).toMatchObject({
        policy: { index: null, range: fallback.range },
      });
    });
  });
});
