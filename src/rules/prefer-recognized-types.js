const { PLUGIN_NAME } = require("../constants/plugin");
const { meta, validateSettings } = require("../helpers/rules");
const { getElementInfo } = require("../helpers/elements");

module.exports = {
  ...meta(`Prevent creating files not recognized as any of the element types`, PLUGIN_NAME),

  create: function (context) {
    validateSettings(context);
    const fileName = context.getFilename();
    const currentElementInfo = getElementInfo(fileName, context.settings);
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
