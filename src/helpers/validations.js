const chalk = require("chalk");
const micromatch = require("micromatch");

const { PLUGIN_NAME } = require("../constants/plugin");
const { TYPES } = require("../constants/settings");

const warns = [];
const invalidMatchers = [];

function warn(message) {
  if (!warns.includes(message)) {
    console.warn(chalk.yellow(`[${PLUGIN_NAME}]: ${message}`));
    warns.push(message);
  }
}

function settingsTypeNames(settings) {
  if (!settings[TYPES]) {
    return [];
  }
  return settings[TYPES].map((type) => {
    if (typeof type === "string") {
      return type;
    }
    return type.name;
  });
}

function isValidTypesMatcher(matcher, settings) {
  return !matcher || micromatch.some(settingsTypeNames(settings), matcher);
}

function validateTypesMatcher(elementMatcher, settings) {
  const [matcher] = Array.isArray(elementMatcher) ? elementMatcher : [elementMatcher];
  if (!invalidMatchers.includes(matcher) && !isValidTypesMatcher(matcher, settings)) {
    invalidMatchers.push(matcher);
    warn(`Option "${matcher}" does not match any type from "${TYPES}" settings`);
  }
}

module.exports = {
  validateTypesMatcher,
};
