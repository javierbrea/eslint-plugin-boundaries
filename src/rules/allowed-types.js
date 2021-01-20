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

function ruleMatchElementType(elementsTypesMatchers, elementInfo) {
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

function getElementRules(elementInfo, options) {
  if (!options.rules) {
    return [];
  }
  return options.rules.filter((rule) => {
    return ruleMatchElementType(rule.from, elementInfo);
  });
}

function elementRulesAllowDependency(element, dependency, options) {
  return getElementRules(element, options).reduce((allowed, rule) => {
    if (rule.disallow && ruleMatchElementType(rule.disallow, dependency)) {
      return false;
    }
    if (rule.allow && ruleMatchElementType(rule.allow, dependency)) {
      return true;
    }
    return allowed;
  }, options.default === "allow");
}

function validateRules(rules = [], settings) {
  rules.forEach((rule) => {
    validateElementTypesMatcher(rule.from, settings);
    validateElementTypesMatcher(rule.allow, settings);
    validateElementTypesMatcher(rule.disallow, settings);
  });
}

module.exports = {
  ...meta2({
    ruleName: RULE_ALLOWED_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: [
      {
        type: "object",
        properties: {
          default: {
            type: "string",
            enum: ["allow", "disallow"],
          },
          rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: ELEMENTS_MATCHER_SCHEMA,
                allow: ELEMENTS_MATCHER_SCHEMA,
                disallow: ELEMENTS_MATCHER_SCHEMA,
              },
              additionalProperties: false,
              oneOf: [
                {
                  required: ["from", "allow"],
                },
                {
                  required: ["from", "disallow"],
                },
              ],
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

    validateRules(options.rules, context.settings);
    validateSettings(context.settings);

    return {
      ImportDeclaration: (node) => {
        const dependency = dependencyInfo(node.source.value, context);

        if (
          dependency.isLocal &&
          !dependency.isIgnored &&
          dependency.type &&
          !dependency.isInternal &&
          !elementRulesAllowDependency(file, dependency, options)
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
