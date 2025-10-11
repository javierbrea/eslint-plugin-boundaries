import { SETTINGS } from "../constants/settings";

import type { Config } from "./Config.types";
import recommended from "./recommended";

const { RULE_NO_IGNORED, RULE_NO_UNKNOWN_FILES, RULE_NO_UNKNOWN } = SETTINGS;

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
