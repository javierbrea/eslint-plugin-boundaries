import plugin from "../../src";
import { RULE_SHORT_NAMES_MAP } from "../../src/Public";

describe("package", () => {
  describe("rules property", () => {
    it.each(Object.values(RULE_SHORT_NAMES_MAP))(
      "should contain rule '%s' with a defined create function",
      (ruleName) => {
        expect(plugin.rules[ruleName].create).toBeDefined();
      }
    );
  });
});
