import { RULE_SHORT_NAMES_MAP } from "../../src/constants/rules";

const eslintPluginBoundaries = require("../../src/index");

describe("package", () => {
  describe("rules property", () => {
    it.each(Object.values(RULE_SHORT_NAMES_MAP))(
      "should contain rule '%s' with a defined create function",
      (ruleName) => {
        expect(eslintPluginBoundaries.rules[ruleName].create).toBeDefined();
      },
    );
  });
});
