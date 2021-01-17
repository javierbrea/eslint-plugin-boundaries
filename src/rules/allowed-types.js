const { PLUGIN_NAME } = require("../constants/plugin");
const { TYPES, RULE_ALLOWED_TYPES } = require("../constants/settings");
const {
  meta,
  dependencyLocation,
  warn,
  checkOptions,
  getContextInfo,
} = require("../helpers/rules");
const { getDependencyInfo, isNotRecognizedOrIgnored } = require("../helpers/elements");

const { importInfo } = require("../core/elements");

const checkElement = (type, element, context) => {
  if (!context.settings[TYPES].includes(element)) {
    warn(
      `Invalid element type '${element}' in '${RULE_ALLOWED_TYPES}' rule config for '${type}' elements`
    );
  }
};

module.exports = {
  ...meta(
    `Prevent elements of one type to import any other element types not specified in the configuration of this rule`,
    PLUGIN_NAME,
    [
      {
        type: "object",
        properties: {
          allow: {
            type: "object",
          },
        },
        additionalProperties: false,
      },
    ]
  ),

  create: function (context) {
    const { currentElementInfo, fileName } = getContextInfo(context);
    if (isNotRecognizedOrIgnored(currentElementInfo)) {
      return {};
    }
    checkOptions(context, "allow", RULE_ALLOWED_TYPES, checkElement);
    const allowOption = context.options[0] && context.options[0].allow;
    if (!allowOption) {
      return {};
    }

    return {
      ImportDeclaration: (node) => {
        console.log("-----------------------------------");
        console.log(importInfo(node.source.value, context));

        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);
        const currentElementOptions = allowOption[currentElementInfo.type];

        console.log({
          dependencyInfo,
          currentElementInfo,
        });

        if (
          dependencyInfo.isLocal &&
          !dependencyInfo.isIgnored &&
          dependencyInfo.type &&
          !dependencyInfo.isInternal &&
          currentElementOptions &&
          !currentElementOptions.includes(dependencyInfo.type)
        ) {
          context.report({
            message: `Usage of '${dependencyInfo.type}' is not allowed in '${currentElementInfo.type}'`,
            type: PLUGIN_NAME,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
