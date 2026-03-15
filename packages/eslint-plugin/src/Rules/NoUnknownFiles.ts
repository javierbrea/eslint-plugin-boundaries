import type { Rule } from "eslint";
import type {
  CompatRuleModule,
  CompatRuleContext,
} from "../Shared/Settings.types";

import { elementDescription } from "../Elements";
import { getSettings } from "../Settings";
import { SETTINGS } from "../Shared";

import { meta } from "./Support";

const { RULE_NO_UNKNOWN_FILES } = SETTINGS;

const noUnknownFilesRule: CompatRuleModule = {
  ...meta({
    ruleName: RULE_NO_UNKNOWN_FILES,
    schema: [],
    description: `Prevent creating files not recognized by any element patterns`,
  }),

  create: function (context: CompatRuleContext) {
    const settings = getSettings(context as Rule.RuleContext);
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
