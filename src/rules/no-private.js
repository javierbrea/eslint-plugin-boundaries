const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, validateSettings } = require("../helpers/rules");
const { getDependencyInfo, getElementInfo } = require("../helpers/elements");

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
    validateSettings(context);
    const fileName = context.getFilename();
    const currentElementInfo = getElementInfo(fileName, context.settings, context.options);
    if (!currentElementInfo.type || currentElementInfo.isIgnored) {
      return {};
    }
    const options = context.options[0];
    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);
        if (
          dependencyInfo.type &&
          dependencyInfo.isLocal &&
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
