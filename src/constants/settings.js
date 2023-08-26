const { PLUGIN_NAME, PLUGIN_ENV_VARS_PREFIX } = require("./plugin");

const {
  ELEMENT_TYPES,
  EXTERNAL,
  ENTRY_POINT,
  NO_IGNORED,
  NO_UNKNOWN,
  NO_PRIVATE,
  NO_UNKNOWN_FILES,
} = require("./rules");

module.exports = {
  // settings
  ELEMENTS: `${PLUGIN_NAME}/elements`,
  IGNORE: `${PLUGIN_NAME}/ignore`,
  INCLUDE: `${PLUGIN_NAME}/include`,
  ROOT_PATH: `${PLUGIN_NAME}/root-path`,

  // env vars
  DEBUG: `${PLUGIN_ENV_VARS_PREFIX}_DEBUG`,
  ENV_ROOT_PATH: `${PLUGIN_ENV_VARS_PREFIX}_ROOT_PATH`,

  // rules
  RULE_ELEMENT_TYPES: `${PLUGIN_NAME}/${ELEMENT_TYPES}`,
  RULE_ENTRY_POINT: `${PLUGIN_NAME}/${ENTRY_POINT}`,
  RULE_EXTERNAL: `${PLUGIN_NAME}/${EXTERNAL}`,
  RULE_NO_IGNORED: `${PLUGIN_NAME}/${NO_IGNORED}`,
  RULE_NO_PRIVATE: `${PLUGIN_NAME}/${NO_PRIVATE}`,
  RULE_NO_UNKNOWN_FILES: `${PLUGIN_NAME}/${NO_UNKNOWN_FILES}`,
  RULE_NO_UNKNOWN: `${PLUGIN_NAME}/${NO_UNKNOWN}`,

  // deprecated settings
  TYPES: `${PLUGIN_NAME}/types`,
  ALIAS: `${PLUGIN_NAME}/alias`,

  // elements settings properties,
  VALID_MODES: ["folder", "file", "full"],
};
