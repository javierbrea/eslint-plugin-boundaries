const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, getContextInfo } = require("../helpers/rules");
const { getDependencyInfo, isNotRecognizedOrIgnored } = require("../helpers/elements");

module.exports = {
  ...meta(`Prevent importing files marked as ignored from the recognized elements`, PLUGIN_NAME),

  create: function (context) {
    const { currentElementInfo, fileName } = getContextInfo(context);
    if (isNotRecognizedOrIgnored(currentElementInfo)) {
      return {};
    }

    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);

        if (dependencyInfo.isLocal && dependencyInfo.isIgnored) {
          context.report({
            message: `Importing ignored files is not allowed`,
            type: PLUGIN_NAME,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
