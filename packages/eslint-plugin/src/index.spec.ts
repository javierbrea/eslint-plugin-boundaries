import { RULE_NAMES_MAP, RULE_SHORT_NAMES_MAP } from "./Public";

import plugin from "./index";

describe("package", () => {
  describe("rules property", () => {
    it.each(Object.values(RULE_SHORT_NAMES_MAP))(
      "should contain rule '%s' with a defined create function",
      (ruleName) => {
        expect(plugin.rules[ruleName].create).toBeDefined();
      }
    );

    it.each([
      [
        RULE_SHORT_NAMES_MAP.ELEMENT_TYPES,
        RULE_NAMES_MAP.DEPENDENCIES,
      ] as const,
      [RULE_SHORT_NAMES_MAP.ENTRY_POINT, RULE_NAMES_MAP.DEPENDENCIES] as const,
      [RULE_SHORT_NAMES_MAP.EXTERNAL, RULE_NAMES_MAP.DEPENDENCIES] as const,
      [RULE_SHORT_NAMES_MAP.NO_PRIVATE, RULE_NAMES_MAP.DEPENDENCIES] as const,
      [
        RULE_SHORT_NAMES_MAP.NO_IGNORED,
        RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES,
      ] as const,
      [
        RULE_SHORT_NAMES_MAP.NO_UNKNOWN,
        RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES,
      ] as const,
    ])(
      "should mark deprecated rule '%s' as replaced by '%s' in its meta",
      (ruleName, replacedBy) => {
        expect(plugin.rules[ruleName].meta?.deprecated).toEqual(
          expect.objectContaining({
            replacedBy: [
              expect.objectContaining({
                rule: expect.objectContaining({ name: replacedBy }),
              }),
            ],
          })
        );
      }
    );

    it.each([
      RULE_SHORT_NAMES_MAP.DEPENDENCIES,
      RULE_SHORT_NAMES_MAP.NO_IGNORED_DEPENDENCIES,
      RULE_SHORT_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES,
      RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES,
    ])("should not mark canonical rule '%s' as deprecated", (ruleName) => {
      expect(plugin.rules[ruleName].meta?.deprecated).toBeUndefined();
    });
  });

  describe("recommended config", () => {
    it("should enable only the canonical 'dependencies' rule, not the deprecated element-types/entry-point/external rules", () => {
      const rules = plugin.configs.recommended.rules ?? {};

      expect(rules[RULE_NAMES_MAP.DEPENDENCIES]).toBeDefined();
      expect(rules[RULE_NAMES_MAP.ELEMENT_TYPES]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.ENTRY_POINT]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.EXTERNAL]).toBeUndefined();
    });
  });

  describe("strict config", () => {
    it("should not enable the deprecated element-types/entry-point/external rules either", () => {
      const rules = plugin.configs.strict.rules ?? {};

      expect(rules[RULE_NAMES_MAP.DEPENDENCIES]).toBeDefined();
      expect(rules[RULE_NAMES_MAP.ELEMENT_TYPES]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.ENTRY_POINT]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.EXTERNAL]).toBeUndefined();
    });
  });
});
