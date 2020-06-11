const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, validateSettings } = require("../helpers/rules");
const { getDependencyInfo, getElementInfo } = require("../helpers/elements");

module.exports = {
  ...meta(`Prevent importing files marked as ignored from the recognized elements`, PLUGIN_NAME),

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
