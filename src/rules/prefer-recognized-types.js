const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, getContextInfo } = require("../helpers/rules");

module.exports = {
  ...meta(`Prevent creating files not recognized as any of the element types`, PLUGIN_NAME),

  create: function (context) {
    const { currentElementInfo } = getContextInfo(context);
    if (currentElementInfo.type || currentElementInfo.isIgnored) {
      return {};
    }
    return {
      Program: (node) => {
        context.report({
          message: `File does not belong to any element type`,
          type: PLUGIN_NAME,
          node: node,
        });
      },
    };
  },
};
