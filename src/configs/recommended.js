const { PLUGIN_NAME } = require("../constants/plugin");

const {
  TYPES,
  IGNORE,
  ALIAS,
  RULE_NO_PRIVATE,
  RULE_ENTRY_POINT,
  RULE_ALLOWED_TYPES,
  RULE_NO_EXTERNAL,
  RULE_PREFER_RECOGNIZED_TYPES,
  RULE_NO_IMPORT_NOT_RECOGNIZED_TYPES,
  RULE_NO_IMPORT_IGNORED,
} = require("../constants/settings");

module.exports = {
  plugins: [PLUGIN_NAME],
  rules: {
    [RULE_NO_PRIVATE]: [
      2,
      {
        allowUncles: true,
      },
    ],
    [RULE_ENTRY_POINT]: [
      2,
      {
        default: "index.js",
        byType: {},
      },
    ],
    [RULE_ALLOWED_TYPES]: [
      2,
      {
        allow: {},
      },
    ],
    [RULE_NO_EXTERNAL]: [
      2,
      {
        forbid: {},
      },
    ],
    [RULE_PREFER_RECOGNIZED_TYPES]: 0,
    [RULE_NO_IMPORT_NOT_RECOGNIZED_TYPES]: 0,
    [RULE_NO_IMPORT_IGNORED]: 0,
  },
  settings: {
    [TYPES]: [],
    [IGNORE]: ["src/**/*.spec?.js", "src/**/*.test?.js"],
    [ALIAS]: [],
  },
};
