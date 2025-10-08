import { readFileSync } from "fs";
import { join } from "path";

import type { Rule } from "eslint";

import recommendedConfig from "./configs/recommended";
import strictConfig from "./configs/strict";
import type { RuleName, RuleNames } from "./constants/rules";
import { RULE_NAMES } from "./constants/rules";

/**
 * The path to the plugin package.json file
 */
const packageJsonPath = join(__dirname, "..", "package.json");

/**
 * The content of the package.json file
 */
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

/**
 * Type guard to check if an object is a default export
 * @param obj The object to check
 * @returns True if the object is a default export, false otherwise
 */
function isDefaultExport<T>(obj: T | { default: T }): obj is { default: T } {
  return typeof obj === "object" && obj !== null && "default" in obj;
}

/**
 * Returns all rules imported dynamically
 * @param ruleNames The rule names to import
 * @returns The imported rules
 */
function importRules(ruleNames: RuleNames) {
  return ruleNames.reduce(
    (loadedRules: Record<RuleName, Rule.RuleModule>, ruleName) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ruleModule = require(`./rules/${ruleName}`) as
        | Rule.RuleModule
        | {
            default: Rule.RuleModule;
          };
      loadedRules[ruleName] = isDefaultExport(ruleModule)
        ? ruleModule.default
        : ruleModule;
      return loadedRules;
    },
    {} as Record<RuleName, Rule.RuleModule>,
  );
}

module.exports = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules: importRules(RULE_NAMES),
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
  },
};
