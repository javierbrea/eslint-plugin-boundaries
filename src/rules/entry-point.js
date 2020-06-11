const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, validateSettings } = require("../helpers/rules");
const { getDependencyInfo, getElementInfo } = require("../helpers/elements");

module.exports = {
  ...meta(
    `Prevent other elements importing a file different from the allowed entry point`,
    PLUGIN_NAME,
    [
      {
        properties: {
          default: {
            type: "string",
          },
          byType: {
            type: "object",
          },
        },
        additionalProperties: false,
      },
    ]
  ),

  create: function (context) {
    validateSettings(context);
    const fileName = context.getFilename();
    const currentElementInfo = getElementInfo(fileName, context.settings);
    if (!currentElementInfo.type || currentElementInfo.isIgnored) {
      return {};
    }
    const defaultOption = (context.options[0] && context.options[0].default) || null;

    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);
        const typeOption =
          context.options[0] &&
          context.options[0].byType &&
          context.options[0].byType[dependencyInfo.type]
            ? context.options[0].byType[dependencyInfo.type]
            : null;
        const requiredEntryPoint = typeOption || defaultOption;

        if (
          dependencyInfo.type &&
          dependencyInfo.isLocal &&
          !dependencyInfo.isInternal &&
          requiredEntryPoint &&
          dependencyInfo.privatePath !== requiredEntryPoint
        ) {
          context.report({
            message: `Entry point of element '${dependencyInfo.self}' must be '${requiredEntryPoint}'`,
            type: PLUGIN_NAME,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
