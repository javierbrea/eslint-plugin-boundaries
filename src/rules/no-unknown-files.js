const { RULE_NO_UNKNOWN_FILES } = require("../constants/settings");

const { fileInfo } = require("../core/elementsInfo");
const { meta } = require("../helpers/rules");

module.exports = {
  ...meta({
    ruleName: RULE_NO_UNKNOWN_FILES,
    description: `Prevent creating files not recognized as any of the element types`,
  }),

  create: function (context) {
    const file = fileInfo(context);
    if (file.type || file.isIgnored) {
      return {};
    }
    return {
      Program: (node) => {
        context.report({
          message: `File is not of any known element type`,
          node: node,
        });
      },
    };
  },
};
