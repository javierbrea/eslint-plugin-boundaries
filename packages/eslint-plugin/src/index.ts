import { readFileSync } from "fs";
import { join } from "path";

import recommendedConfig from "./Config/Recommended";
import strictConfig from "./Config/Strict";
import ElementTypesRule from "./Rules/ElementTypes";
import EntryPointRule from "./Rules/EntryPoint";
import ExternalRule from "./Rules/External";
import NoIgnoredRule from "./Rules/NoIgnored";
import NoPrivateRule from "./Rules/NoPrivate";
import NoUnknownRule from "./Rules/NoUnknown";
import NoUnknownFilesRule from "./Rules/NoUnknownFiles";
import { RULE_SHORT_NAMES_MAP } from "./Settings";
import type { PluginBoundaries } from "./Settings";
// import { warn } from "./Support";

export * from "./Public";

/**
 * The path to the plugin package.json file
 */
const packageJsonPath = join(__dirname, "..", "package.json");

/**
 * The content of the package.json file
 */
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

// TODO: Enable this warning in the next major release
/* if (packageJson.name !== "@boundaries/eslint-plugin") {
  warn(
    `⚠️  The "eslint-plugin-boundaries" package has been renamed to "@boundaries/eslint-plugin". Please install the new package, as this one will soon no longer receive updates`
  );
} */

const RULES = {
  [RULE_SHORT_NAMES_MAP.ENTRY_POINT]: EntryPointRule,
  [RULE_SHORT_NAMES_MAP.ELEMENT_TYPES]: ElementTypesRule,
  [RULE_SHORT_NAMES_MAP.EXTERNAL]: ExternalRule,
  [RULE_SHORT_NAMES_MAP.NO_IGNORED]: NoIgnoredRule,
  [RULE_SHORT_NAMES_MAP.NO_PRIVATE]: NoPrivateRule,
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN]: NoUnknownRule,
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES]: NoUnknownFilesRule,
};

/**
 * Eslint plugin ensuring that architecture boundaries are respected by the elements in a project
 * It enables to check the folders and files structure and the dependencies and relationships between them.
 */
const publicInterface: PluginBoundaries = {
  meta: {
    name: packageJson.name as string,
    version: packageJson.version as string,
  },
  rules: RULES,
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
