import { createEngine } from "@/domains/evaluation/helpers/engine";

import {
  listDecisions,
  listDisallowed,
  listReported,
  listStatements,
  slice,
} from "./exampleVerdicts.mock";
import { QUICK_START_EXAMPLE } from "./quickStart";
import {
  QUICK_START_MESSAGES,
  QUICK_START_STATEMENTS,
} from "./quickStartVerdicts.mock";

describe("QUICK_START_EXAMPLE", () => {
  const evaluate = createEngine().evaluate;

  describe("verdicts", () => {
    const example = QUICK_START_EXAMPLE.sketch;

    it("should write the statements of the plugin's project, file by file and in order", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(
        listStatements(dependencies, Object.keys(QUICK_START_STATEMENTS))
      ).toEqual(QUICK_START_STATEMENTS);
      expect(dependencies).toHaveLength(9);
    });

    it("should disallow exactly the dependencies that ESLint reports, with their files, lines and messages", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDisallowed(dependencies)).toEqual(
        listReported(QUICK_START_MESSAGES)
      );
    });

    it("should give every dependency the verdict that the plan lists, in the order of the sketch", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDecisions(dependencies)).toEqual([
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
