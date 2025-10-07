import { SETTINGS } from "../constants/settings";

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

export default {
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
