const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, dependencyLocation, getContextInfo } = require("../helpers/rules");
const { getDependencyInfo, isNotRecognizedOrIgnored } = require("../helpers/elements");

module.exports = (ruleDescription, dependencyIsNotValid, message) => {
  return {
    ...meta(ruleDescription, PLUGIN_NAME),

    create: function (context) {
      const { currentElementInfo, fileName } = getContextInfo(context);
      if (isNotRecognizedOrIgnored(currentElementInfo)) {
        return {};
      }

      return {
        ImportDeclaration: (node) => {
          const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);

          if (dependencyIsNotValid(dependencyInfo)) {
            context.report({
              message,
              type: PLUGIN_NAME,
              node: node,
              ...dependencyLocation(node, context),
            });
          }
        },
      };
    },
  };
};
