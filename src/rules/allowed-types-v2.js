const { PLUGIN_NAME } = require("../constants/plugin");
const { meta } = require("../helpers/rules");

const { dependencyLocation } = require("../helpers/rules");
const { fileInfo } = require("../core/elementsInfo");
const { dependencyInfo } = require("../core/dependencyInfo");

function capturesMatch(captures, capturesToMatch) {
  return Object.keys(captures).reduce((match, key) => {
    if (!capturesToMatch[key] !== captures[key]) {
      return false;
    }
    return true;
  }, true);
}

function ruleMatchElement(elementsMatchers, elementInfo) {
  let match = false;
  const matchers = !Array.isArray(elementsMatchers) ? [elementsMatchers] : elementsMatchers;
  matchers.forEach((matcher) => {
    if (!match) {
      if (Array.isArray(matcher)) {
        const [type, captures] = matcher;
        if (elementInfo.type === type && capturesMatch(captures, elementInfo.typeCapturedValues)) {
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

function getAllowedElements(elementInfo, options) {
  if (!options.allow) {
    return;
  }
  const ruleMatchingFrom = [...options.allow].reverse().find((rule) => {
    return ruleMatchElement(rule.from, elementInfo);
  });
  return ruleMatchingFrom && ruleMatchingFrom.targets;
}

module.exports = {
  ...meta(`Check allowed dependencies between element types`, PLUGIN_NAME, [
    {
      type: "object",
      properties: {
        allow: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: {
                type: "string",
              },
              targets: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  ]),

  create: function (context) {
    const options = context.options[0];
    const file = fileInfo(context);
    if (!options || file.isIgnored || !file.type) {
      return {};
    }

    return {
      ImportDeclaration: (node) => {
        const currentElementRules = getAllowedElements(file, options);
        const dependency = dependencyInfo(node.source.value, context);

        /* console.log("-----------------------------------");
        console.log("file");
        console.log(JSON.stringify(file, null, 2));
        console.log("dependency");
        console.log(JSON.stringify(dependency, null, 2));
        console.log("allowed");
        console.log(file.type);
        console.log(JSON.stringify(currentElementRules, null, 2)); */

        if (
          dependency.isLocal &&
          !dependency.isIgnored &&
          dependency.type &&
          !dependency.isInternal &&
          currentElementRules &&
          !ruleMatchElement(currentElementRules, dependency)
        ) {
          context.report({
            message: `Usage of '${dependency.type}' is not allowed in '${file.type}'`,
            type: PLUGIN_NAME,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
