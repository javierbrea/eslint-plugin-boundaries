import { createEngine } from "@/domains/evaluation/helpers/engine";

import { DEPENDENCIES_RULE_EXAMPLE } from "./dependenciesRule";
import {
  DEPENDENCIES_RULE_MESSAGES,
  DEPENDENCIES_RULE_STATEMENTS,
} from "./dependenciesRuleVerdicts.mock";
import {
  listDecisions,
  listDisallowed,
  listReported,
  listStatements,
  slice,
} from "./exampleVerdicts.mock";

describe("DEPENDENCIES_RULE_EXAMPLE", () => {
  const evaluate = createEngine().evaluate;

  describe("verdicts", () => {
    const example = DEPENDENCIES_RULE_EXAMPLE.sketch;

    it("should write the statements of the plugin's project, file by file and in order", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(
        listStatements(dependencies, Object.keys(DEPENDENCIES_RULE_STATEMENTS))
      ).toEqual(DEPENDENCIES_RULE_STATEMENTS);
      expect(dependencies).toHaveLength(
        Object.values(DEPENDENCIES_RULE_STATEMENTS).flat().length
      );
    });

    it("should disallow exactly the dependencies that ESLint reports, with their files, lines and messages", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      expect(listDisallowed(dependencies)).toEqual(
        listReported(DEPENDENCIES_RULE_MESSAGES)
      );
      expect(DEPENDENCIES_RULE_MESSAGES).toHaveLength(7);
    });

    it("should give every dependency the verdict that the page lists, in the order of the sketch", () => {
      // Act
      const { dependencies } = evaluate(example);

      // Assert
      // The first seven are the Incorrect examples of the page, in the order of the files; none of them is decided by a policy but the one for test files, so that the others fall to the default
      expect(listDecisions(dependencies)).toEqual([
        ["components/atoms/atom-a/AtomA.js", 1, "disallowed", null],
        ["components/atoms/atom-a/AtomA.js", 2, "disallowed", null],
        ["components/atoms/atom-a/AtomA.js", 3, "disallowed", null],
        ["components/atoms/atom-a/AtomA.js", 4, "disallowed", 4],
        ["components/atoms/atom-a/AtomA.js", 5, "allowed", 1],
        ["components/atoms/atom-a/AtomA.js", 6, "allowed", 1],
        ["components/molecules/molecule-a/MoleculeA.js", 1, "allowed", 2],
        ["helpers/data/sort.js", 1, "disallowed", null],
        ["helpers/permissions/roles.js", 1, "disallowed", null],
        ["helpers/permissions/roles.js", 2, "disallowed", null],
        ["helpers/permissions/roles.js", 3, "allowed", 0],
        ["modules/module-a/ModuleA.js", 1, "allowed", 3],
        ["modules/module-a/ModuleA.js", 2, "allowed", 3],
        ["modules/module-a/ModuleA.js", 3, "allowed", 3],
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

    it("should summarize the five policies and the default with the dependencies each one decided", () => {
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
          to: ["helper", "util"],
          decided: 1,
          disallowed: 0,
        },
        {
          index: 1,
          action: "allow",
          from: ["component"],
          to: ["component", "helper"],
          decided: 2,
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
          action: "allow",
          from: ["module"],
          to: ["helper", "component", "module"],
          decided: 3,
          disallowed: 0,
        },
        {
          index: 4,
          action: "disallow",
          from: ["*"],
          to: ["test"],
          decided: 1,
          disallowed: 1,
        },
        {
          index: null,
          action: "disallow",
          from: [],
          to: [],
          decided: 6,
          disallowed: 6,
        },
      ]);
    });

    it("should place the dependency that policy 4 disallowed, and the policy, at its text of the config", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const policy = policies[4];

      expect(slice(example.config, policy.range)).toBe(
        [
          "{",
          "          // from any element",
          '          from: { element: { type: "*" } },',
          '          // disallow importing files categorized as "test" (file selector)',
          "          disallow: {",
          '            to: { file: { categories: "test" } },',
          "          },",
          "        }",
        ].join("\n")
      );
      expect([policy.range.line, policy.range.column]).toEqual([63, 9]);
      expect(dependencies[3].verdict).toMatchObject({
        policy: { index: 4, range: policy.range },
      });
    });

    it("should place the dependency that the default disallowed, and the default, at its value in the config", () => {
      // Act
      const { dependencies, policies } = evaluate(example);

      // Assert
      const fallback = policies[5];

      expect(slice(example.config, fallback.range)).toBe('"disallow"');
      expect([fallback.range.line, fallback.range.column]).toEqual([20, 16]);
      expect(dependencies[0].verdict).toMatchObject({
        policy: { index: null, range: fallback.range },
      });
    });
  });
});
