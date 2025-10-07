import { readFileSync } from "fs";
import { join } from "path";

import rules from "./constants/rules";
import recommendedConfig from "./configs/recommended";
import strictConfig from "./configs/strict";

const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const importRules = (ruleNames: any) => {
  return Object.keys(ruleNames).reduce((loadedRules: any, ruleKey) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ruleModule = require(`./rules/${rules[ruleKey]}`);
    loadedRules[rules[ruleKey]] = ruleModule.default || ruleModule;
    return loadedRules;
  }, {});
};

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// export all rules in lib/rules
// export all configs

module.exports = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules: importRules(rules),
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
  },
};
