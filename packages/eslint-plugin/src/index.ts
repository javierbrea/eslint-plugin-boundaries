import { readFileSync } from "fs";
import { join } from "path";

import type { Rule } from "eslint";

import type { PluginBoundaries } from "./configs/Config.types";
import recommendedConfig from "./configs/recommended";
import strictConfig from "./configs/strict";
import type { RuleShortName, RuleShortNames } from "./constants/rules";
import { RULE_SHORT_NAMES } from "./constants/rules";
import { warn } from "./helpers/debug";

export * from "./types";

/**
 * The path to the plugin package.json file
 */
const packageJsonPath = join(__dirname, "..", "package.json");

/**
 * The content of the package.json file
 */
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

if (packageJson.name !== "@boundaries/eslint-plugin") {
  warn(
    `⚠️  The "eslint-plugin-boundaries" package has been renamed to "@boundaries/eslint-plugin". Please install the new package as this one will no longer receive updates soon.`
  );
}

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
function importRules(ruleNames: RuleShortNames) {
  return ruleNames.reduce(
    (loadedRules: Record<RuleShortName, Rule.RuleModule>, ruleName) => {
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
    {} as Record<RuleShortName, Rule.RuleModule>
  );
}

/**
 * Eslint plugin ensuring that architecture boundaries are respected by the elements in a project
 * It enables to check the folders and files structure and the dependencies and relationships between them.
 */
const publicInterface: PluginBoundaries = {
  meta: {
    name: packageJson.name as string,
    version: packageJson.version as string,
  },
  rules: importRules(RULE_SHORT_NAMES),
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
  },
};

export default publicInterface;

// For CommonJS compatibility
module.exports = {
  ...publicInterface,
};
