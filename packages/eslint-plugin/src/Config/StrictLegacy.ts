import type { Config } from "../Shared";
import { SETTINGS } from "../Shared";

import recommended from "./Recommended";

const { RULE_NO_IGNORED, RULE_NO_UNKNOWN_FILES, RULE_NO_UNKNOWN } = SETTINGS;

/**
 * Legacy strict configuration for eslint-plugin-boundaries.
 *
 * Identical to the `strict` configuration, but enables the deprecated `boundaries/no-ignored` and
 * `boundaries/no-unknown` rule names instead of their `boundaries/no-ignored-dependencies` and
 * `boundaries/no-unknown-dependencies` replacements.
 *
 * Use this preset only as a temporary measure right after upgrading from v6, if your codebase has
 * `eslint-disable` comments referencing the old rule names and you are not ready to update them yet.
 * Prefer the `strict` configuration otherwise: it does not print deprecation warnings and is the one
 * that will keep working in future major versions.
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
