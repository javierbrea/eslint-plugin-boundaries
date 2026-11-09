import type { SketchDependency } from "@/contract";

import { areRulesValid } from "./diagnostics";
import type { DependencyResult, DependencyVerdict } from "./engine.types";
import { selectRule } from "./evaluatedRule";
import type { EvaluatedRule } from "./evaluatedRule.types";
import { normalizeConfigSafely } from "./normalizeConfigSafely";
import { parseConfig } from "./parseConfig";
import { summarizePolicies } from "./policies";

const QUICK_START_CONFIG = `{
  rules: {
    "boundaries/dependencies": [2, {
      default: "disallow",
      policies: [
        { from: { element: { type: "component" } }, allow: { to: { element: { type: "helper" } } } },
        { from: { element: { type: "module" } }, allow: { to: { element: { types: ["component", "helper"] } } } },
        { disallow: { to: { file: { categories: "test" } } } },
      ],
    }],
  },
}`;

const DEPENDENCY: SketchDependency = {
  from: "src/a.js",
  target: { kind: "node", path: "src/b.js" },
  syntax: "import",
  importKind: "value",
  specifiers: [],
};

/**
 * Selects the rule of a config text as the engine does.
 * @param text The config text.
 * @returns The rule that is evaluated.
 */
function selectEvaluatedRule(text: string): EvaluatedRule {
  const config = parseConfig(text);
  if (!config.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  const { value, diagnostics } = normalizeConfigSafely({
    settings: config.value.settings,
    rules: config.value.rules,
  });
  const { rule } = selectRule({
    config,
    rules: value.rules,
    rulesValid: areRulesValid(diagnostics),
  });
  if (rule === undefined) {
    throw new Error("The config text should have a rule to evaluate");
  }
  return rule;
}

/**
 * Builds the result of a dependency with the verdict that it is given.
 * @param verdict What the engine says about it.
 * @returns The result.
 */
function resultOf(verdict: DependencyVerdict): DependencyResult {
  return {
    dependency: DEPENDENCY,
    ref: { path: DEPENDENCY.from, index: 0 },
    source: "./b",
    description: undefined,
    verdict,
  };
}

/**
 * Builds the result of a dependency that a policy allowed.
 * @param rule The rule.
 * @param index The index of the policy, or `null` for the default.
 * @returns The result.
 */
function allowedBy(rule: EvaluatedRule, index: number | null) {
  return resultOf({
    status: "allowed",
    policy: index === null ? rule.defaultPolicy : rule.policies[index],
  });
}

/**
 * Builds the result of a dependency that a policy disallowed.
 * @param rule The rule.
 * @param index The index of the policy, or `null` for the default.
 * @param level The level of the verdict: `error` unless the rule is a warning.
 * @returns The result.
 */
function disallowedBy(
  rule: EvaluatedRule,
  index: number | null,
  level: "error" | "warning" = "error"
) {
  return resultOf({
    status: "disallowed",
    policy: index === null ? rule.defaultPolicy : rule.policies[index],
    message: "Not allowed",
    level,
  });
}

describe("Policies", () => {
  describe("summarizePolicies", () => {
    it("should count the dependencies that each policy and the default decided, and the ones they disallowed", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);
      const results = [
        allowedBy(rule, 0),
        allowedBy(rule, 1),
        allowedBy(rule, 1),
        disallowedBy(rule, 2),
        disallowedBy(rule, null),
      ];

      // Act
      const summaries = summarizePolicies(rule, results);

      // Assert
      expect(
        summaries.map(({ index, decided, disallowed }) => [
          index,
          decided,
          disallowed,
        ])
      ).toEqual([
        [0, 1, 0],
        [1, 2, 0],
        [2, 1, 1],
        [null, 1, 1],
      ]);
    });

    it("should count a policy that decided both an allowed and a disallowed dependency once for each", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);
      const results = [
        allowedBy(rule, 2),
        disallowedBy(rule, 2),
        disallowedBy(rule, 2),
      ];

      // Act
      const summaries = summarizePolicies(rule, results);

      // Assert
      expect(summaries[2]).toMatchObject({ decided: 3, disallowed: 2 });
    });

    it("should count how many of the dependencies that a policy disallowed are errors, the others being warnings", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);
      const results = [
        disallowedBy(rule, 2, "warning"),
        disallowedBy(rule, 2, "error"),
        disallowedBy(rule, null, "warning"),
        allowedBy(rule, 1),
      ];

      // Act
      const summaries = summarizePolicies(rule, results);

      // Assert
      expect(
        summaries.map(({ index, disallowed, errors }) => [
          index,
          disallowed,
          errors,
        ])
      ).toEqual([
        [0, 0, 0],
        [1, 0, 0],
        [2, 2, 1],
        [null, 1, 0],
      ]);
    });

    it("should count nothing for a policy that decided no dependency", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);

      // Act
      const summaries = summarizePolicies(rule, [allowedBy(rule, 1)]);

      // Assert
      expect(
        summaries.map(({ index, decided, disallowed }) => [
          index,
          decided,
          disallowed,
        ])
      ).toEqual([
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0],
        [null, 0, 0],
      ]);
    });

    it("should count no dependency that is not checked, not evaluated, or disallowed with no policy", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);
      const results = [
        resultOf({ status: "not-checked", reason: "internal" }),
        resultOf({ status: "not-checked", reason: "not-read" }),
        resultOf({ status: "not-evaluated" }),
        resultOf({
          status: "disallowed",
          policy: undefined,
          message: "Invalid custom message",
          level: "error",
        }),
      ];

      // Act
      const summaries = summarizePolicies(rule, results);

      // Assert
      expect(
        summaries.map(({ decided, disallowed }) => [decided, disallowed])
      ).toEqual([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ]);
    });

    it("should summarize every policy in its order and then the default, at their places in the text", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);

      // Act
      const summaries = summarizePolicies(rule, []);

      // Assert
      expect(summaries.map(({ index }) => index)).toEqual([0, 1, 2, null]);
      expect(summaries.map(({ range }) => range)).toEqual([
        ...rule.policies.map(({ range }) => range),
        rule.defaultPolicy.range,
      ]);
      expect(summaries.map(({ range }) => range.line)).toEqual([6, 7, 8, 4]);
    });

    it("should name the element types and file categories of each policy", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);

      // Act
      const summaries = summarizePolicies(rule, []);

      // Assert
      expect(summaries.map(({ from, to }) => [from, to])).toEqual([
        [["component"], ["helper"]],
        [["module"], ["component", "helper"]],
        [[], ["test"]],
        [[], []],
      ]);
    });

    it("should say whether each policy allows, disallows or does both, and what the default does", () => {
      // Arrange
      const rule = selectEvaluatedRule(`{
  rules: {
    "boundaries/dependencies": [2, {
      default: "allow",
      policies: [
        { allow: { to: { element: { type: "a" } } } },
        { disallow: { to: { element: { type: "b" } } } },
        { allow: { to: { element: { type: "c" } } }, disallow: { to: { element: { type: "d" } } } },
      ],
    }],
  },
}`);

      // Act
      const summaries = summarizePolicies(rule, []);

      // Assert
      expect(summaries.map(({ action }) => action)).toEqual([
        "allow",
        "disallow",
        "both",
        "allow",
      ]);
    });

    it("should summarize only the default for a rule with no policies", () => {
      // Arrange
      const rule = selectEvaluatedRule(
        '{ rules: { "boundaries/dependencies": [2, {}] } }'
      );

      // Act
      const summaries = summarizePolicies(rule, [allowedBy(rule, null)]);

      // Assert
      expect(summaries).toEqual([
        {
          index: null,
          action: "disallow",
          from: [],
          to: [],
          decided: 1,
          disallowed: 0,
          errors: 0,
          range: rule.defaultPolicy.range,
        },
      ]);
    });
  });
});
