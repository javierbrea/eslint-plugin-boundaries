import type { Rule } from "eslint";

import { entityDescription } from "../Elements";
import { getSettings } from "../Settings";
import { SETTINGS } from "../Shared";

import { meta } from "./Support";

const { RULE_NO_UNKNOWN_FILES } = SETTINGS;

const noUnknownFilesRule: Rule.RuleModule = {
  ...meta({
    ruleName: RULE_NO_UNKNOWN_FILES,
    schema: [],
    description: `Prevent creating files not recognized by any element or file patterns`,
  }),

  create: function (context) {
    const settings = getSettings(context);
    const entity = entityDescription(context.filename, settings);
    if (
      entity.file.isIgnored ||
      !entity.file.isUnknown ||
      !entity.element.isUnknown
    ) {
      return {};
    }
    return {
      Program: (node) => {
        context.report({
          message: `File does not match any file pattern and does not belong to any known element`,
          node: node,
        });
      },
    };
  },
};

export default noUnknownFilesRule;
