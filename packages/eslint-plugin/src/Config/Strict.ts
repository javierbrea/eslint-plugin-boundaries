import type { Config } from "../Settings";
import { SETTINGS } from "../Settings";

import recommended from "./Recommended";

const { RULE_NO_IGNORED, RULE_NO_UNKNOWN_FILES, RULE_NO_UNKNOWN } = SETTINGS;

// TODO In next major version: Export also files, plugin, etc.

/**
 * Strict configuration for eslint-plugin-boundaries.
 *
 * It enables all rules, enforcing full compliance with defined boundaries. Unknown files and importing ignored files are not allowed.
 */
const config: Config = {
  ...recommended,
  rules: {
    ...recommended.rules,
    [RULE_NO_IGNORED]: 2,
    [RULE_NO_UNKNOWN_FILES]: 2,
    [RULE_NO_UNKNOWN]: 2,
  },
};

export default config;

// For CommonJS compatibility
module.exports = config;
