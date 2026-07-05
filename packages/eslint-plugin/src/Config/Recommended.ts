import type { Config } from "../Shared";
import { SETTINGS } from "../Shared";

const {
  ELEMENTS,
  // rules
  RULE_DEPENDENCIES,
  RULE_NO_IGNORED_DEPENDENCIES,
  RULE_NO_PRIVATE,
  RULE_NO_UNKNOWN_FILES,
  RULE_NO_UNKNOWN_DEPENDENCIES,
} = SETTINGS;

// TODO In next major version: Export also files, plugin, etc.

/**
 * Recommended configuration for eslint-plugin-boundaries.
 *
 * It is recommended for applying the plugin to an already existing project.
 * Rules `boundaries/no-unknown-dependencies`, `boundaries/no-unknown-files` and `boundaries/no-ignored-dependencies` are disabled,
 * so it allows to have parts of the project non-compliant with defined rules, allowing to refactor the code progressively.
 *
 * Only the canonical `boundaries/dependencies` rule is enabled. The deprecated `boundaries/element-types`,
 * `boundaries/entry-point`, and `boundaries/external` rules are not enabled here: with no options they are
 * complete no-ops (the shared rule runner short-circuits when no options are provided), so enabling them
 * would add nothing. Configure them explicitly (with their own options) if you still rely on them.
 */
const config: Config = {
  rules: {
    [RULE_DEPENDENCIES]: [2],
    [RULE_NO_IGNORED_DEPENDENCIES]: 0,
    [RULE_NO_PRIVATE]: 0,
    [RULE_NO_UNKNOWN_FILES]: 0,
    [RULE_NO_UNKNOWN_DEPENDENCIES]: 0,
  },
  settings: {
    [ELEMENTS]: [],
  },
};

export default config;

// For CommonJS compatibility
module.exports = config;
