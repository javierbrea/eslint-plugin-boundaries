const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, validateSettings } = require("../helpers/rules");
const { getDependencyInfo, getElementInfo } = require("../helpers/elements");

module.exports = {
  ...meta(`Prevent importing not recognized elements from the recognized ones`, PLUGIN_NAME),

  create: function (context) {
    validateSettings(context);
    const fileName = context.getFilename();
    const currentElementInfo = getElementInfo(fileName, context.settings);
    if (!currentElementInfo.type || currentElementInfo.isIgnored) {
      return {};
    }

    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);

        if (dependencyInfo.isLocal && !dependencyInfo.type) {
          context.report({
            message: `Importing not recognized elements is not allowed`,
            type: PLUGIN_NAME,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
