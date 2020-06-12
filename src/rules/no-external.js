const { PLUGIN_NAME } = require("../constants/plugin");
const { RULE_NO_EXTERNAL } = require("../constants/settings");
const { meta, dependencyLocation, validateSettings, checkOptions } = require("../helpers/rules");
const { getDependencyInfo, getElementInfo } = require("../helpers/elements");

module.exports = {
  ...meta(`Enforce elements of one type to not use some external dependencies`, PLUGIN_NAME, [
    {
      type: "object",
      properties: {
        forbid: {
          type: "object",
        },
      },
      additionalProperties: true,
    },
  ]),

  create: function (context) {
    validateSettings(context);
    const fileName = context.getFilename();
    const currentElementInfo = getElementInfo(fileName, context.settings);
    if (!currentElementInfo.type || currentElementInfo.isIgnored) {
      return {};
    }
    checkOptions(context, "forbid", RULE_NO_EXTERNAL);
    const forbidOptions = (context.options[0] && context.options[0].forbid) || {};

    return {
      ImportDeclaration: (node) => {
        const dependencyInfo = getDependencyInfo(fileName, node.source.value, context.settings);
        const currentElementOptions = forbidOptions[currentElementInfo.type];

        if (
          !dependencyInfo.isLocal &&
          currentElementOptions &&
          currentElementOptions.includes(dependencyInfo.name)
        ) {
          context.report({
            message: `Usage of external module '${dependencyInfo.name}' is not allowed in '${currentElementInfo.type}'`,
            type: PLUGIN_NAME,
            node: node,
            ...dependencyLocation(node, context),
          });
        }
      },
    };
  },
};
