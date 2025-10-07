import * as pluginPackage from "../../src/index";

import RULES from "../../src/constants/rules";

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
