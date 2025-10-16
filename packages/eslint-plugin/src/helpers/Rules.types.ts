import type { Rule } from "eslint";

import type { RuleName } from "../constants/rules";

export type RuleMetaDefinition = {
  /** The description of the rule */
  description: string;
  /** The name of the rule */
  ruleName: RuleName;
  /** The schema of the rule options */
  schema?: Rule.RuleMetaData["schema"];
};
