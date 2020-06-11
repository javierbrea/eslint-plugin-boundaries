const {
  RULE_PREFER_RECOGNIZED_TYPES,
  RULE_NO_IMPORT_NOT_RECOGNIZED_TYPES,
  RULE_NO_IMPORT_IGNORED,
} = require("../constants/settings");

const recommended = require("./recommended");

module.exports = {
  ...recommended,
  rules: {
    ...recommended.rules,
    [RULE_PREFER_RECOGNIZED_TYPES]: 2,
    [RULE_NO_IMPORT_NOT_RECOGNIZED_TYPES]: 2,
    [RULE_NO_IMPORT_IGNORED]: 2,
  },
};
