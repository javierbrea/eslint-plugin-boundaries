import { createEngine } from "@/domains/evaluation/helpers/engine";

import {
  listDecisions,
  listDisallowed,
  listReported,
  listStatements,
  slice,
} from "./exampleVerdicts.mock";
import { OVERVIEW_EXAMPLE } from "./overview";
import {
  OVERVIEW_MESSAGES,
  OVERVIEW_STATEMENTS,
} from "./overviewVerdicts.mock";

describe("OVERVIEW_EXAMPLE", () => {
  const evaluate = createEngine().evaluate;

  describe("verdicts", () => {
    const example = OVERVIEW_EXAMPLE.sketch;

    it("should write the statements of the plugin's project, file by file and in order", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(
        listStatements(dependencies, Object.keys(OVERVIEW_STATEMENTS))
      ).toEqual(OVERVIEW_STATEMENTS);
      expect(dependencies).toHaveLength(
        Object.values(OVERVIEW_STATEMENTS).flat().length
      );
    });

    it("should disallow exactly the dependencies that ESLint reports, with their files, lines and messages", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDisallowed(dependencies)).toEqual(
        listReported(OVERVIEW_MESSAGES)
      );
      expect(OVERVIEW_MESSAGES).toHaveLength(3);
    });

    it("should give every dependency the verdict that its policy gives, in the order of the sketch", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDecisions(dependencies)).toEqual([
        ["src/controllers/controller-a/index.js", 1, "allowed", 0],
        ["src/controllers/controller-a/index.js", 2, "allowed", 0],
        ["src/models/model-a/index.js", 1, "disallowed", null],
        ["src/models/model-a/index.js", 2, "disallowed", 3],
        ["src/views/view-a/index.js", 1, "allowed", 1],
        ["src/views/view-a/index.js", 2, "disallowed", 2],
      ]);
    });

    it("should say that nothing is left unevaluated", () => {
      // Act
      const { notEvaluated, rulesValid, problems } = evaluate(example);

      // Assert
      expect(notEvaluated).toBeUndefined();
      expect(rulesValid).toBe(true);
      expect(problems).toEqual([]);
    });

    it("should summarize the four policies and the default with the dependencies each one decided", () => {
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
          from: ["controller"],
          to: ["model", "view"],
          decided: 2,
          disallowed: 0,
        },
        {
          index: 1,
          action: "allow",
          from: ["view"],
          to: ["model"],
          decided: 1,
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
          index: 3,
          action: "disallow",
          from: ["!controller"],
          to: [],
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

    it("should place the dependency that policy 3 disallowed, and the policy, at its text of the config", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const policy = policies[3];

      expect(slice(example.config, policy.range)).toBe(
        [
          "{",
          '          from: { element: { type: "!controller" } },',
          "          disallow: {",
          '            to: { module: { origin: "external", source: "axios" } },',
          "          },",
          "        }",
        ].join("\n")
      );
      expect([policy.range.line, policy.range.column]).toEqual([39, 9]);
      expect(dependencies[3].verdict).toMatchObject({
        policy: { index: 3, range: policy.range },
      });
    });

    it("should place the dependency that the default disallowed at the options of the rule, because the config sets no default", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const fallback = policies[4];

      expect(slice(example.config, fallback.range)).toMatch(
        /^\{\n {6}\/\/ Not on the page[\s\S]*\n {4}\}$/
      );
      expect([fallback.range.line, fallback.range.column]).toEqual([14, 36]);
      expect(dependencies[2].verdict).toMatchObject({
        policy: { index: null, range: fallback.range },
      });
    });
  });
});
