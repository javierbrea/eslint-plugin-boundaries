import { SETTINGS } from "../constants/settings";

import { fileInfo } from "../core/elementsInfo";
import { meta } from "../helpers/rules";

const { RULE_NO_UNKNOWN_FILES } = SETTINGS;

export default {
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
