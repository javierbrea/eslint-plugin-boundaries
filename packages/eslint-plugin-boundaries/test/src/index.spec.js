const pluginPackage = require("../../src/index");

const RULES = require("../../src/constants/rules");

describe("package", () => {
  describe("rules property", () => {
    it("should contain all rules defined in constants", () => {
      Object.keys(RULES).forEach((ruleKey) => {
        expect(pluginPackage.rules[RULES[ruleKey]].create).toBeDefined();
      });
    });
  });
});
