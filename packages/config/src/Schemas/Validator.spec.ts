import { RULE_NAMES_MAP } from "../Shared";

import { validateRuleOptionsList } from "./Validator";

const DEPENDENCIES_DOCS_LINK =
  "More info: https://www.jsboundaries.dev/docs/rules/dependencies/";

describe("Validator", () => {
  describe("validateRuleOptionsList", () => {
    it("returns null when the rule entry has no options", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.DEPENDENCIES, []);

      expect(result).toBeNull();
    });

    it("returns null when the options pass the rule schema", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.DEPENDENCIES, [
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "a" } },
              allow: { to: { element: { type: "b" } } },
            },
          ],
          checkInternals: true,
        },
      ]);

      expect(result).toBeNull();
    });

    it("reports an unexpected property with the lines that ESLint prints", () => {
      const options = { policies: [], unknownOption: true };

      const result = validateRuleOptionsList(RULE_NAMES_MAP.DEPENDENCIES, [
        options,
      ]);

      expect(result).toEqual({
        title: `[${RULE_NAMES_MAP.DEPENDENCIES}] Invalid rule options.`,
        detail: `Value ${JSON.stringify(options)} should NOT have additional properties.\nUnexpected property "unknownOption". Expected properties: "message", "default", "policies", "rules", "checkAllOrigins", "checkUnknownLocals", "checkInternals".\n${DEPENDENCIES_DOCS_LINK}`,
        paths: [[0]],
      });
    });

    it("reports a wrong value with the path of the value", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.DEPENDENCIES, [
        { policies: [{ allow: "*" }, { allow: "*", importKind: 2 }] },
      ]);

      expect(result?.detail).toContain("Value 2 should be string.");
      expect(result?.paths).toEqual([[0, "policies", 1, "importKind"]]);
    });

    it("reports an invalid value of an enum", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.DEPENDENCIES, [
        { default: "deny" },
      ]);

      expect(result?.detail).toBe(
        `Value "deny" should be equal to one of the allowed values.\n${DEPENDENCIES_DOCS_LINK}`
      );
      expect(result?.paths).toEqual([[0, "default"]]);
    });

    it("reports options of a rule that takes none at the root of the options list", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.NO_UNKNOWN_FILES, [
        {},
      ]);

      expect(result).toEqual({
        title: `[${RULE_NAMES_MAP.NO_UNKNOWN_FILES}] Invalid rule options.`,
        detail:
          "Value [{}] should NOT have more than 0 items.\nMore info: https://www.jsboundaries.dev/docs/rules/no-unknown-files/",
        paths: [[]],
      });
    });

    it("reports more options than the rule takes", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.NO_PRIVATE, [
        {},
        {},
      ]);

      expect(result?.detail).toContain("should NOT have more than 1 items.");
      expect(result?.paths).toEqual([[]]);
    });

    it("reports every failed branch of a schema with alternatives, as ESLint does", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.ENTRY_POINT, [
        { policies: [{ target: "a", allow: 1 }] },
      ]);

      expect(result?.detail.split("\n").slice(0, -1)).toEqual([
        "Value 1 should be string.",
        "Value 1 should be array.",
        "Value 1 should be array.",
        "Value 1 should match some schema in anyOf.",
      ]);
      expect(result?.paths).toEqual([[0, "policies", 0, "allow"]]);
    });

    it("decodes escaped characters of object keys in the paths", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.NO_PRIVATE, [
        { "a/b~c": true },
      ]);

      expect(result?.paths).toEqual([[0]]);
      expect(result?.detail).toContain('Unexpected property "a/b~c".');
    });

    it("keeps object keys that look like numbers as strings", () => {
      const result = validateRuleOptionsList(RULE_NAMES_MAP.DEPENDENCIES, [
        {
          policies: [
            {
              allow: { to: { element: { captured: { "0": 1 } } } },
              message: 1,
            },
          ],
        },
      ]);

      expect(result?.paths).toEqual([[0, "policies", 0, "message"]]);
    });

    it("reuses the compiled validator of a rule", () => {
      const first = validateRuleOptionsList(RULE_NAMES_MAP.NO_PRIVATE, [
        { allowUncles: "yes" },
      ]);
      const second = validateRuleOptionsList(RULE_NAMES_MAP.NO_PRIVATE, [
        { allowUncles: "no" },
      ]);

      expect(first?.detail).toContain('Value "yes" should be boolean.');
      expect(second?.detail).toContain('Value "no" should be boolean.');
    });

    it("does not change the validated options", () => {
      const options = { policies: [{ allow: "*" }] };
      const copy = structuredClone(options);

      validateRuleOptionsList(RULE_NAMES_MAP.DEPENDENCIES, [options]);

      expect(options).toEqual(copy);
    });
  });
});
