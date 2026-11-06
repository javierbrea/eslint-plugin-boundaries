import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type {
  ElementTypeSummary,
  Evaluation,
  FileCategorySummary,
  PolicySummary,
  RuleSummary,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import {
  getElementTypeRow,
  getFileCategoryRow,
  getPoliciesRows,
  getPolicyRow,
  getRuleRow,
} from "./configRows";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

const RANGE: TextRange = { from: 120, to: 170, line: 5, column: 7 };

const ELEMENT_TYPE: ElementTypeSummary = {
  index: 2,
  type: "helper",
  patterns: ["src/helpers/*"],
  files: 3,
  ignored: false,
  range: RANGE,
};

const FILE_CATEGORY: FileCategorySummary = {
  index: 1,
  category: "style",
  patterns: ["**/*.css", "**/*.scss"],
  files: 2,
  range: RANGE,
};

const RULE: RuleSummary = {
  name: "boundaries/dependencies",
  policies: 3,
  valid: true,
  evaluated: true,
  range: RANGE,
};

const POLICY: PolicySummary = {
  index: 2,
  action: "disallow",
  from: [],
  to: ["test"],
  decided: 3,
  disallowed: 0,
  errors: 0,
  range: RANGE,
};

/** A policy the config accepts, to have one */
const A_POLICY =
  '{ from: { element: { type: "a" } }, allow: { to: { element: { type: "b" } } } }';

/**
 * Evaluates a config over the files and dependencies of no sketch at all, which is all that the rows of the policies need.
 * @param config The text of the config.
 * @returns What the engine says.
 */
function evaluateConfig(config: string): Evaluation {
  const sketch: Sketch = { config, tree: [], dependencies: [] };

  return evaluate(sketch);
}

/**
 * Writes what each row of a list says, as the inspector shows it.
 * @param rows The rows.
 * @returns The name, the status and the detail of each row, joined by a bar.
 */
function readRows(rows: ReturnType<typeof getPoliciesRows>): string[] {
  return rows.map((row) =>
    [row.name, row.status, row.detail]
      .filter((part) => part !== undefined)
      .join(" | ")
  );
}

describe("configRows", () => {
  describe("getElementTypeRow", () => {
    it("should name the row by the type, with its files and its patterns", () => {
      // Act
      const row = getElementTypeRow(ELEMENT_TYPE);

      // Assert
      expect(row).toEqual({
        key: "element-2",
        name: "helper",
        status: "3 files",
        detail: "src/helpers/*",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should say 1 file in the singular", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, files: 1 });

      // Assert
      expect(row.status).toBe("1 file");
    });

    it("should say 0 files when the descriptor matches none", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, files: 0 });

      // Assert
      expect(row.status).toBe("0 files");
    });

    it("should join the patterns with commas", () => {
      // Act
      const row = getElementTypeRow({
        ...ELEMENT_TYPE,
        patterns: ["src/helpers/*", "lib/helpers/*"],
      });

      // Assert
      expect(row.detail).toBe("src/helpers/*, lib/helpers/*");
    });

    it("should draw no tone for a descriptor that is not ignored", () => {
      // Act
      const row = getElementTypeRow(ELEMENT_TYPE);

      // Assert
      expect(row.nameTone).toBeUndefined();
      expect(row.statusTone).toBeUndefined();
    });

    it("should say that an ignored descriptor is, and where it is, instead of its files and its patterns", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, ignored: true });

      // Assert
      expect(row).toEqual({
        key: "element-2",
        name: "helper",
        nameTone: "warn",
        status: "ignored",
        statusTone: "warn",
        detail: "invalid descriptor, line 5",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should name a descriptor that has no type by its position", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, type: "#2" });

      // Assert
      expect(row.name).toBe("#2");
    });

    it("should open the config at the descriptor", () => {
      // Act
      const row = getElementTypeRow({ ...ELEMENT_TYPE, ignored: true });

      // Assert
      expect(row.target).toEqual({ kind: "config", range: RANGE });
    });
  });

  describe("getFileCategoryRow", () => {
    it("should name the row by the category, with its files and its patterns", () => {
      // Act
      const row = getFileCategoryRow(FILE_CATEGORY);

      // Assert
      expect(row).toEqual({
        key: "category-1",
        name: "style",
        status: "2 files",
        detail: "**/*.css, **/*.scss",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should say 1 file in the singular", () => {
      // Act
      const row = getFileCategoryRow({ ...FILE_CATEGORY, files: 1 });

      // Assert
      expect(row.status).toBe("1 file");
    });

    it("should not key it as an element type of the same position", () => {
      // Act
      const category = getFileCategoryRow({ ...FILE_CATEGORY, index: 2 });
      const elementType = getElementTypeRow(ELEMENT_TYPE);

      // Assert
      expect(category.key).not.toBe(elementType.key);
    });
  });

  describe("getRuleRow", () => {
    it("should name the row by the rule, with its policies", () => {
      // Act
      const row = getRuleRow(RULE);

      // Assert
      expect(row).toEqual({
        key: "boundaries/dependencies",
        name: "boundaries/dependencies",
        status: "3 policies",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should say 1 policy in the singular", () => {
      // Act
      const row = getRuleRow({ ...RULE, policies: 1 });

      // Assert
      expect(row.status).toBe("1 policy");
    });

    it("should say 0 policies when the options have none", () => {
      // Act
      const row = getRuleRow({ ...RULE, policies: 0 });

      // Assert
      expect(row.status).toBe("0 policies");
    });

    it("should say that a rule whose options are invalid is not evaluated, and keep its policies", () => {
      // Act
      const row = getRuleRow({ ...RULE, valid: false });

      // Assert
      expect(row).toEqual({
        key: "boundaries/dependencies",
        name: "boundaries/dependencies",
        status: "not evaluated",
        statusTone: "bad",
        detail: "3 policies · invalid options",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should open the config at the rule", () => {
      // Act
      const row = getRuleRow(RULE);

      // Assert
      expect(row.target).toEqual({ kind: "config", range: RANGE });
    });
  });

  describe("getPolicyRow", () => {
    it("should name the row by the policy and say how many dependencies it decided", () => {
      // Act
      const row = getPolicyRow(POLICY);

      // Assert
      expect(row).toEqual({
        key: "policy-2",
        name: "2 · disallow → test",
        status: "3 dependencies",
        target: { kind: "config", range: RANGE },
      });
    });

    it("should say 1 dependency in the singular", () => {
      // Act
      const row = getPolicyRow({ ...POLICY, decided: 1 });

      // Assert
      expect(row.status).toBe("1 dependency");
    });

    it("should say 0 dependencies for a policy that decided none", () => {
      // Act
      const row = getPolicyRow({ ...POLICY, decided: 0 });

      // Assert
      expect(row.status).toBe("0 dependencies");
    });

    it("should draw the status of a policy that disallowed a dependency in the color of errors", () => {
      // Act
      const row = getPolicyRow({
        ...POLICY,
        decided: 3,
        disallowed: 1,
        errors: 1,
      });

      // Assert
      expect(row.statusTone).toBe("bad");
    });

    it("should draw the status of a policy in the color of warnings when everything it disallowed is a warning", () => {
      // Act
      const row = getPolicyRow({
        ...POLICY,
        decided: 3,
        disallowed: 2,
        errors: 0,
      });

      // Assert
      expect(row.statusTone).toBe("warn");
    });

    it("should draw the status of a policy in the color of errors when any of what it disallowed is an error", () => {
      // Act
      const row = getPolicyRow({
        ...POLICY,
        decided: 3,
        disallowed: 2,
        errors: 1,
      });

      // Assert
      expect(row.statusTone).toBe("bad");
    });

    it("should draw no tone for a policy that disallowed none", () => {
      // Act
      const row = getPolicyRow(POLICY);

      // Assert
      expect(row.statusTone).toBeUndefined();
    });

    it("should name the default as such, and key it apart from the policies", () => {
      // Act
      const row = getPolicyRow({ ...POLICY, index: null, to: [] });

      // Assert
      expect(row.key).toBe("policy-default");
      expect(row.name).toBe("default · disallow");
    });

    it("should open the config at the policy", () => {
      // Act
      const row = getPolicyRow(POLICY);

      // Assert
      expect(row.target).toEqual({ kind: "config", range: RANGE });
    });
  });

  describe("getPoliciesRows", () => {
    it("should list the policies of the quick-start rule and its default, with the dependencies each decided", () => {
      // Arrange
      const evaluation = evaluate(QUICK_START);

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(readRows(rows)).toEqual([
        "0 · component → helper | 1 dependency",
        "1 · module → component, helper | 2 dependencies",
        "2 · disallow → test | 1 dependency",
        "default · disallow | 1 dependency",
      ]);
      expect(rows.map(({ statusTone }) => statusTone)).toEqual([
        undefined,
        undefined,
        "bad",
        "bad",
      ]);
    });

    it("should draw the policies that decided the disallowed dependencies in the color of warnings when the rule is a warning", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const evaluation = evaluate({ ...QUICK_START, config });

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(rows.map(({ statusTone }) => statusTone)).toEqual([
        undefined,
        undefined,
        "warn",
        "warn",
      ]);
    });

    it("should open the config at the range of each policy", () => {
      // Arrange
      const evaluation = evaluate(QUICK_START);

      // Act
      const targets = getPoliciesRows(evaluation).map(({ target }) => target);

      // Assert
      expect(targets).toEqual(
        evaluation.policies.map(({ range }) => ({ kind: "config", range }))
      );
    });

    it("should say that the other rules of the plugin are not evaluated here, in the place they have in the config", () => {
      // Arrange
      const evaluation = evaluateConfig(`{
        settings: {},
        rules: {
          "boundaries/no-unknown": 2,
          "boundaries/dependencies": [2, { default: "allow", policies: [${A_POLICY}] }],
        },
      }`);

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(readRows(rows)).toEqual([
        "boundaries/no-unknown | not evaluated here",
        "0 · a → b | 0 dependencies",
        "default · allow | 0 dependencies",
      ]);
      expect(rows[0].target).toEqual({
        kind: "config",
        range: evaluation.rules[0].range,
      });
    });

    it("should say that the deprecated rule is not evaluated here when the dependencies rule is written", () => {
      // Arrange
      const evaluation = evaluateConfig(`{
        settings: {},
        rules: {
          "boundaries/element-types": [2, { default: "disallow", rules: [{ from: "a", allow: ["b"] }] }],
          "boundaries/dependencies": [2, { default: "allow" }],
        },
      }`);

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(readRows(rows)).toEqual([
        "boundaries/element-types | not evaluated here",
        "default · allow | 0 dependencies",
      ]);
    });

    it("should list the policies of the deprecated rule when it is the one that is evaluated", () => {
      // Arrange
      const evaluation = evaluateConfig(`{
        settings: {},
        rules: {
          "boundaries/element-types": [2, { default: "disallow", rules: [{ from: "a", allow: ["b"] }] }],
        },
      }`);

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(readRows(rows)).toEqual([
        "0 · a → b | 0 dependencies",
        "default · disallow | 0 dependencies",
      ]);
    });

    it.each([
      ["off", '"off"'],
      ["written with only a severity", "[2]"],
    ])(
      "should list the policies of the deprecated rule, and say that the dependencies rule is not evaluated here, when the dependencies rule is %s",
      (_title, entry) => {
        // Arrange
        const evaluation = evaluateConfig(`{
        settings: {},
        rules: {
          "boundaries/dependencies": ${entry},
          "boundaries/element-types": [2, { default: "disallow", rules: [{ from: "a", allow: ["b"] }] }],
        },
      }`);

        // Act
        const rows = getPoliciesRows(evaluation);

        // Assert
        expect(evaluation.notEvaluated).toBeUndefined();
        expect(readRows(rows)).toEqual([
          "boundaries/dependencies | not evaluated here",
          "0 · a → b | 0 dependencies",
          "default · disallow | 0 dependencies",
        ]);
      }
    );

    it("should say that the evaluated rule is not evaluated while its options are invalid, as before", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        'default: "disallow"',
        'default: "nothing"'
      );
      const evaluation = evaluateConfig(config);

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(readRows(rows)).toEqual([
        "boundaries/dependencies | not evaluated | 3 policies · invalid options",
      ]);
      expect(rows[0].statusTone).toBe("bad");
    });

    it("should keep the policies of a valid evaluated rule while another rule is invalid, and say why the other one is not evaluated", () => {
      // Arrange
      const evaluation = evaluateConfig(`{
        settings: {},
        rules: {
          "boundaries/no-unknown": [2, { unknownOption: true }],
          "boundaries/dependencies": [2, { default: "allow", policies: [${A_POLICY}] }],
        },
      }`);

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(evaluation.notEvaluated).toBe("rules-invalid");
      expect(readRows(rows)).toEqual([
        "boundaries/no-unknown | not evaluated here | 0 policies · invalid options",
        "boundaries/dependencies | 1 policy",
      ]);
    });

    it("should say that the rule is not evaluated, and that it is off, while its severity is off", () => {
      // Arrange
      const evaluation = evaluateConfig(
        QUICK_START.config.replace(
          '"boundaries/dependencies": [2,',
          '"boundaries/dependencies": ["off",'
        )
      );

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(evaluation.notEvaluated).toBe("rule-off");
      expect(readRows(rows)).toEqual([
        "boundaries/dependencies | not evaluated | off",
      ]);
      expect(rows[0].statusTone).toBeUndefined();
      expect(rows[0].target).toEqual({
        kind: "config",
        range: evaluation.rules[0].range,
      });
    });

    it("should say that the rule is not evaluated, and that it has no options, while it is written with none", () => {
      // Arrange
      const evaluation = evaluateConfig(
        '{ settings: {}, rules: { "boundaries/dependencies": 2 } }'
      );

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(evaluation.notEvaluated).toBe("no-options");
      expect(readRows(rows)).toEqual([
        "boundaries/dependencies | not evaluated | no options",
      ]);
    });

    it("should list only the other rules while no rule that checks dependencies is written", () => {
      // Arrange
      const evaluation = evaluateConfig(
        '{ settings: {}, rules: { "boundaries/no-unknown": 2 } }'
      );

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(evaluation.notEvaluated).toBe("no-rule");
      expect(readRows(rows)).toEqual([
        "boundaries/no-unknown | not evaluated here",
      ]);
    });

    it("should list nothing while the config cannot be read", () => {
      // Arrange
      const evaluation = evaluateConfig("{ settings: ");

      // Act
      const rows = getPoliciesRows(evaluation);

      // Assert
      expect(rows).toEqual([]);
    });
  });
});
