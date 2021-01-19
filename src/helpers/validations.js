const chalk = require("chalk");
const micromatch = require("micromatch");

const { PLUGIN_NAME } = require("../constants/plugin");
const { TYPES, ALIAS } = require("../constants/settings");

const { getTypesNames, isLegacyType } = require("./settings");

const warns = [];
const invalidMatchers = [];

const VALID_MATCH_TYPES = ["parentFolders"];

const TYPES_MATCHER_SCHEMA = {
  oneOf: [
    {
      type: "string", // single matcher
    },
    {
      type: "array", // multiple matchers
      items: {
        oneOf: [
          {
            type: "string", // matcher with no capture options
          },
          {
            type: "array",
            items: [
              {
                type: "string", // matcher
              },
              {
                type: "object", // capture options
              },
            ],
          },
        ],
      },
    },
  ],
};

function warn(message) {
  console.warn(chalk.yellow(`[${PLUGIN_NAME}]: ${message}`));
}

function warnOnce(message) {
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
  }
}

function isValidTypesMatcher(matcher, settings) {
  return !matcher || micromatch.some(getTypesNames(settings), matcher);
}

function validateTypesMatcher(elementMatcher, settings) {
  const [matcher] = Array.isArray(elementMatcher) ? elementMatcher : [elementMatcher];
  if (!invalidMatchers.includes(matcher) && !isValidTypesMatcher(matcher, settings)) {
    invalidMatchers.push(matcher);
    warnOnce(`Option "${matcher}" does not match any type from "${TYPES}" setting`);
  }
}

function validateTypes(types) {
  if (!types || !Array.isArray(types) || !types.length) {
    warnOnce(`Please provide element types using the "${TYPES}" setting`);
  }
  types.forEach((type) => {
    // TODO, remove in next major version
    if (isLegacyType(type)) {
      warnOnce(
        `Defining types as strings in "${TYPES}" setting is deprecated. Will be automatically converted, but this feature will be removed in next major versions`
      );
    } else {
      Object.keys(type).forEach(() => {
        if (!type.name || typeof type.name !== "string") {
          warnOnce(`Please provide type name in "${TYPES}" setting`);
        }
        if (type.matchType && !VALID_MATCH_TYPES.includes(type.matchType)) {
          warnOnce(
            `Invalid matchType property in "${TYPES}" setting. Should be one of ${VALID_MATCH_TYPES.join(
              ","
            )}`
          );
        }
        if (!type.pattern || typeof type.pattern !== "string") {
          warnOnce(`Please provide pattern in "${TYPES}" setting`);
        }
        if (type.capture && !Array.isArray(type.capture)) {
          warnOnce(`Invalid capture property in "${TYPES}" setting`);
        }
      });
    }
  });
}

function validateAlias(aliases) {
  if (aliases) {
    warnOnce(
      `Defining aliases in "${ALIAS}" setting is deprecated. Please use "import/resolver" setting`
    );
  }
}

function validateSettings(settings) {
  validateTypes(settings[TYPES]);
  validateAlias(settings[ALIAS]);
}

module.exports = {
  validateTypesMatcher,
  validateSettings,
  TYPES_MATCHER_SCHEMA,
};
