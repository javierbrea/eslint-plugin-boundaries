const pluginPackage = require("../../dist/index");

const RULES = require("../../dist/constants/rules").default;

describe("package", () => {
  describe("rules property", () => {
    it.each(Object.keys(RULES))(
      "should contain rule '%s' with a defined create function",
      (ruleKey) => {
        expect(pluginPackage.rules[RULES[ruleKey]].create).toBeDefined();
      },
    );
  });
});
