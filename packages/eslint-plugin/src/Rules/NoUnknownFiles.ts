import type { Rule } from "eslint";

import { elementDescription } from "../Elements";
import { getSettings, SETTINGS } from "../Settings";

import { meta } from "./Support";

const { RULE_NO_UNKNOWN_FILES } = SETTINGS;

const noUnknownFilesRule: Rule.RuleModule = {
  ...meta({
    ruleName: RULE_NO_UNKNOWN_FILES,
    schema: [],
    description: `Prevent creating files not recognized by any element patterns`,
  }),

  create: function (context) {
    const settings = getSettings(context);
    const file = elementDescription(context.filename, settings);
    if (file.isIgnored || !file.isUnknown) {
      return {};
    }
    return {
      Program: (node) => {
        context.report({
          message: `File does not match any element pattern`,
          node: node,
        });
      },
    };
  },
};

export default noUnknownFilesRule;
