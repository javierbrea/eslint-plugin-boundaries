import { RULE_NAMES } from "../../src/constants/rules";

const eslintPluginBoundaries = require("../../src/index");

describe("package", () => {
  describe("rules property", () => {
    it.each(RULE_NAMES)(
      "should contain rule '%s' with a defined create function",
      (ruleName) => {
        expect(eslintPluginBoundaries.rules[ruleName].create).toBeDefined();
      },
    );
  });
});
