const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, getContextInfo } = require("../helpers/rules");
const { getDependencyInfo, isNotRecognizedOrIgnored } = require("../helpers/elements");

module.exports = {
  ...meta(`Enforce elements to not use private elements of another element`, PLUGIN_NAME, [
    {
      type: "object",
      properties: {
        allowUncles: {
          type: "boolean",
        },
      },
      additionalProperties: false,
    },
  ]),

  create: function (context) {
    const { currentElementInfo, fileName } = getContextInfo(context);
    if (isNotRecognizedOrIgnored(currentElementInfo)) {
      return {};
    }
    const options = context.options[0];
    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);
        console.log({ dependencyInfo });
        if (
          dependencyInfo.isLocal &&
          !dependencyInfo.isIgnored &&
          dependencyInfo.type &&
          dependencyInfo.parents &&
          dependencyInfo.parents[0] &&
          !dependencyInfo.isInternal &&
          !dependencyInfo.isBrother &&
          !dependencyInfo.isChild &&
          (!options || !options.allowUncles || !dependencyInfo.isCommonAncestorChild)
        ) {
          context.report({
            message: `Dependency is private of '${dependencyInfo.parents[0]}'`,
            type: PLUGIN_NAME,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
