const { RULE_ALLOWED_TYPES } = require("../constants/settings");

const { meta2, dependencyLocation } = require("../helpers/rules");
const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");
const {
  ELEMENTS_MATCHER_SCHEMA,
  validateElementTypesMatcher,
  validateSettings,
} = require("../helpers/validations");

function capturesMatch(captures, capturesToMatch) {
  return Object.keys(captures).reduce((match, key) => {
    if (!capturesToMatch[key] !== captures[key]) {
      return false;
    }
    return true;
  }, true);
}

function rulesMatchElementType(elementsTypesMatchers, elementInfo) {
  let match = false;
  const matchers = !Array.isArray(elementsTypesMatchers)
    ? [elementsTypesMatchers]
    : elementsTypesMatchers;
  matchers.forEach((matcher) => {
    if (!match) {
      if (Array.isArray(matcher)) {
        const [type, captures] = matcher;
        if (elementInfo.type === type && capturesMatch(captures, elementInfo.capturedValues)) {
          match = true;
        }
      } else {
        if (elementInfo.type === matcher) {
          match = true;
        }
      }
    }
  });
  return match;
}

function getAllowedElementsRules(elementInfo, options) {
  if (!options.allow) {
    return;
  }
  const ruleMatchingFrom = [...options.allow].reverse().find((rule) => {
    return rulesMatchElementType(rule.from, elementInfo);
  });
  return ruleMatchingFrom && ruleMatchingFrom.target;
}

function validateOptionsMatchers(matchers = [], settings) {
  matchers.forEach((matcher) => {
    validateElementTypesMatcher(matcher.from, settings);
    validateElementTypesMatcher(matcher.target, settings);
  });
}

function validateOptions(options, settings) {
  validateOptionsMatchers(options.allow, settings);
}

module.exports = {
  ...meta2({
    ruleName: RULE_ALLOWED_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: ELEMENTS_MATCHER_SCHEMA,
                target: ELEMENTS_MATCHER_SCHEMA,
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
  }),

  create: function (context) {
    const options = context.options[0];
    const file = fileInfo(context);
    if (!options || file.isIgnored || !file.type) {
      return {};
    }

    validateOptions(options, context.settings);
    validateSettings(context.settings);

    return {
      ImportDeclaration: (node) => {
        const allowedElementsRules = getAllowedElementsRules(file, options);
        const dependency = dependencyInfo(node.source.value, context);

        if (
          dependency.isLocal &&
          !dependency.isIgnored &&
          dependency.type &&
          !dependency.isInternal &&
          allowedElementsRules &&
          !rulesMatchElementType(allowedElementsRules, dependency)
        ) {
          context.report({
            message: `Usage of '${dependency.type}' is not allowed in '${file.type}'`,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
