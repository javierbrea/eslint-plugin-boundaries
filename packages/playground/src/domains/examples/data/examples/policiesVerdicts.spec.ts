import { createEngine } from "@/domains/evaluation/helpers/engine";

import {
  listDecisions,
  listDisallowed,
  listReported,
  listStatements,
  slice,
} from "./exampleVerdicts.mock";
import { POLICIES_EXAMPLE } from "./policies";
import {
  POLICIES_MESSAGES,
  POLICIES_STATEMENTS,
} from "./policiesVerdicts.mock";

describe("POLICIES_EXAMPLE", () => {
  const evaluate = createEngine().evaluate;

  describe("verdicts", () => {
    const example = POLICIES_EXAMPLE.sketch;

    it("should write the statements of the plugin's project, file by file and in order", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(
        listStatements(dependencies, Object.keys(POLICIES_STATEMENTS))
      ).toEqual(POLICIES_STATEMENTS);
      expect(dependencies).toHaveLength(
        Object.values(POLICIES_STATEMENTS).flat().length
      );
    });

    it("should disallow exactly the dependencies that ESLint reports, with their files, lines and messages", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDisallowed(dependencies)).toEqual(
        listReported(POLICIES_MESSAGES)
      );
      expect(POLICIES_MESSAGES).toHaveLength(5);
    });

    it("should give every dependency the verdict that its policy gives, in the order of the sketch", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDecisions(dependencies)).toEqual([
        ["src/components/atoms/atom-a/index.js", 1, "allowed", 1],
        ["src/components/atoms/atom-a/index.js", 2, "disallowed", 3],
        ["src/components/atoms/atom-a/index.js", 3, "disallowed", null],
        ["src/components/molecules/molecule-a/index.js", 1, "disallowed", 4],
        ["src/components/molecules/molecule-a/index.js", 2, "allowed", 2],
        ["src/helpers/data/sort.js", 1, "allowed", 0],
        ["src/modules/checkout/index.js", 1, "allowed", 5],
        ["src/modules/checkout/index.js", 2, "disallowed", 6],
        ["src/modules/page-home/index.js", 1, "disallowed", 7],
        ["src/modules/page-home/index.js", 2, "allowed", 5],
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

    it("should summarize the eight policies and the default with the dependencies each one decided", () => {
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
          from: ["helper"],
          to: ["helper"],
          decided: 1,
          disallowed: 0,
        },
        {
          index: 1,
          action: "allow",
          from: ["component"],
          to: ["component", "helper"],
          decided: 1,
          disallowed: 0,
        },
        {
          index: 2,
          action: "allow",
          from: ["component"],
          to: ["component"],
          decided: 1,
          disallowed: 0,
        },
        {
          index: 3,
          action: "disallow",
          from: ["component"],
          to: ["helper"],
          decided: 1,
          disallowed: 1,
        },
        {
          index: 4,
          action: "disallow",
          from: [],
          to: ["test"],
          decided: 1,
          disallowed: 1,
        },
        {
          index: 5,
          action: "allow",
          from: ["module"],
          to: ["helper", "component"],
          decided: 2,
          disallowed: 0,
        },
        {
          index: 6,
          action: "disallow",
          from: ["module"],
          to: [],
          decided: 1,
          disallowed: 1,
        },
        {
          index: 7,
          action: "disallow",
          from: ["module"],
          to: ["component"],
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

    it("should place the dependency that policy 6 disallowed, and the policy, at its text of the config", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const policy = policies[6];

      expect(slice(example.config, policy.range)).toBe(
        [
          "{",
          "          // Modules cannot import external state libraries directly",
          '          from: { element: { type: "module" } },',
          "          disallow: {",
          '            to: { module: { origin: "external", source: "redux" } },',
          "          },",
          '          message: "Modules must not import {{to.module.source}} directly",',
          "        }",
        ].join("\n")
      );
      expect([policy.range.line, policy.range.column]).toEqual([65, 9]);
      expect(dependencies[7].verdict).toMatchObject({
        policy: { index: 6, range: policy.range },
      });
    });

    it("should place the dependency that the default disallowed, and the default, at its value in the config", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const fallback = policies[8];

      expect(slice(example.config, fallback.range)).toBe('"disallow"');
      expect([fallback.range.line, fallback.range.column]).toEqual([18, 16]);
      expect(dependencies[2].verdict).toMatchObject({
        policy: { index: null, range: fallback.range },
      });
    });
  });
});
