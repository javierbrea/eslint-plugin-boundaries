const rules = require("./constants/rules");
const recommendedConfig = require("./configs/recommended");
const strictConfig = require("./configs/strict");

const importRules = (ruleNames) => {
  return Object.keys(ruleNames).reduce((loadedRules, ruleKey) => {
    loadedRules[rules[ruleKey]] = require(`./rules/${rules[ruleKey]}`);
    return loadedRules;
  }, {});
};

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// export all rules in lib/rules
// export all configs

module.exports = {
  rules: importRules(rules),
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
  },
};
