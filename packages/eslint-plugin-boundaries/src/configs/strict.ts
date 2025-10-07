import { SETTINGS } from "../constants/settings";

const { RULE_NO_IGNORED, RULE_NO_UNKNOWN_FILES, RULE_NO_UNKNOWN } = SETTINGS;

import recommended from "./recommended";

export default {
  ...recommended,
  rules: {
    ...recommended.rules,
    [RULE_NO_IGNORED]: 2,
    [RULE_NO_UNKNOWN_FILES]: 2,
    [RULE_NO_UNKNOWN]: 2,
  },
};
