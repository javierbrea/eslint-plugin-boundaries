import type { Config } from "../Shared";
import { SETTINGS } from "../Shared";

import recommended from "./Recommended";

const {
  RULE_NO_IGNORED_DEPENDENCIES,
  RULE_NO_UNKNOWN_FILES,
  RULE_NO_UNKNOWN_DEPENDENCIES,
} = SETTINGS;

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
    [RULE_NO_IGNORED_DEPENDENCIES]: 2,
    [RULE_NO_UNKNOWN_FILES]: 2,
    [RULE_NO_UNKNOWN_DEPENDENCIES]: 2,
  },
};

// `export =` makes the config the value of `module.exports`, which is what `require()` and the default import of an ES module receive, and declares it so
export = config;
