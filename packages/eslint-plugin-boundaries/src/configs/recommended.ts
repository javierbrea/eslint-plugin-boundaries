import { SETTINGS } from "../constants/settings";

import type { Config } from "./Config.types";

const {
  ELEMENTS,
  // rules
  RULE_ELEMENT_TYPES,
  RULE_ENTRY_POINT,
  RULE_EXTERNAL,
  RULE_NO_IGNORED,
  RULE_NO_PRIVATE,
  RULE_NO_UNKNOWN_FILES,
  RULE_NO_UNKNOWN,
} = SETTINGS;

// TODO In next major version: Export also files, plugin, etc.

/**
 * Recommended configuration for eslint-plugin-boundaries.
 *
 * It is recommended for applying the plugin to an already existing project.
 * Rules `boundaries/no-unknown`, `boundaries/no-unknown-files` and `boundaries/no-ignored` are disabled,
 * so it allows to have parts of the project non-compliant with defined rules, allowing to refactor the code progressively.
 */
const config: Config = {
  rules: {
    [RULE_ELEMENT_TYPES]: [2],
    [RULE_ENTRY_POINT]: [2],
    [RULE_EXTERNAL]: [2],
    [RULE_NO_IGNORED]: 0,
    [RULE_NO_PRIVATE]: [
      2,
      {
        allowUncles: true,
      },
    ],
    [RULE_NO_UNKNOWN_FILES]: 0,
    [RULE_NO_UNKNOWN]: 0,
  },
  settings: {
    [ELEMENTS]: [],
  },
};

export default config;

// For CommonJS compatibility
module.exports = config;
