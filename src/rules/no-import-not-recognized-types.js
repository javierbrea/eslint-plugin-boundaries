const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, getContextInfo } = require("../helpers/rules");
const { getDependencyInfo, isNotRecognizedOrIgnored } = require("../helpers/elements");

module.exports = {
  ...meta(`Prevent importing not recognized elements from the recognized ones`, PLUGIN_NAME),

  create: function (context) {
    const { currentElementInfo, fileName } = getContextInfo(context);
    if (isNotRecognizedOrIgnored(currentElementInfo)) {
      return {};
    }

    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);

        if (dependencyInfo.isLocal && !dependencyInfo.isIgnored && !dependencyInfo.type) {
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
