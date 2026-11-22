import { areRulesValid } from "../Shared";

import type { EvaluatedRule, ProjectConfig } from "./Config.types";
import { selectRule } from "./EvaluatedRule";
import { normalizeConfigSafely } from "./NormalizeConfigSafely";
import { summarizePolicies } from "./Policies";

const QUICK_START_CONFIG: ProjectConfig = {
  rules: {
    "boundaries/dependencies": [
      2,
      {
        default: "disallow",
        policies: [
          {
            from: { element: { type: "component" } },
            allow: { to: { element: { type: "helper" } } },
          },
          {
            from: { element: { type: "module" } },
            allow: { to: { element: { types: ["component", "helper"] } } },
          },
          { disallow: { to: { file: { categories: "test" } } } },
        ],
      },
    ],
  },
};

/**
 * Selects the rule of a config object as the analysis does.
 * @param config The config object, as written.
 * @returns The rule that is evaluated.
 */
function selectEvaluatedRule(config: ProjectConfig): EvaluatedRule {
  const { value, diagnostics } = normalizeConfigSafely({
    settings: config.settings,
    rules: config.rules,
  });
  const { rule } = selectRule({
    config,
    rules: value.rules,
    rulesValid: areRulesValid(diagnostics),
  });
  if (rule === undefined) {
    throw new Error("The config object should have a rule to evaluate");
  }
  return rule;
}

describe("Policies", () => {
  describe("summarizePolicies", () => {
    it("should summarize every policy in its order and then the default, at their paths in the config object", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);

      // Act
      const summaries = summarizePolicies(rule);

      // Assert
      expect(summaries.map(({ index }) => index)).toEqual([0, 1, 2, null]);
      expect(summaries.map(({ path }) => path)).toEqual([
        ...rule.policies.map(({ path }) => path),
        rule.defaultPolicy.path,
      ]);
      expect(summaries.map(({ path }) => path)).toEqual([
        ["rules", "boundaries/dependencies", 1, "policies", 0],
        ["rules", "boundaries/dependencies", 1, "policies", 1],
        ["rules", "boundaries/dependencies", 1, "policies", 2],
        ["rules", "boundaries/dependencies", 1, "default"],
      ]);
    });

    it("should name the element types and file categories of each policy", () => {
      // Arrange
      const rule = selectEvaluatedRule(QUICK_START_CONFIG);

      // Act
      const summaries = summarizePolicies(rule);

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
      const rule = selectEvaluatedRule({
        rules: {
          "boundaries/dependencies": [
            2,
            {
              default: "allow",
              policies: [
                { allow: { to: { element: { type: "a" } } } },
                { disallow: { to: { element: { type: "b" } } } },
                {
                  allow: { to: { element: { type: "c" } } },
                  disallow: { to: { element: { type: "d" } } },
                },
              ],
            },
          ],
        },
      });

      // Act
      const summaries = summarizePolicies(rule);

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
      const rule = selectEvaluatedRule({
        rules: { "boundaries/dependencies": [2, {}] },
      });

      // Act
      const summaries = summarizePolicies(rule);

      // Assert
      expect(summaries).toEqual([
        {
          index: null,
          action: "disallow",
          from: [],
          to: [],
          path: rule.defaultPolicy.path,
        },
      ]);
    });
  });
});
