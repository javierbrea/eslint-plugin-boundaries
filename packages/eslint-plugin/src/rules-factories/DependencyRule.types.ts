import type { DependencyDescription } from "@boundaries/elements";
import type { Rule } from "eslint";

import type { EslintLiteralNode } from "../Elements";
import type { ValidateRulesOptions } from "../helpers/Helpers.types";

export type DependencyRuleRunner<Options> = (options: {
  dependency: DependencyDescription;
  options?: Options;
  node: EslintLiteralNode;
  context: Rule.RuleContext;
}) => void;

export type DependencyRuleOptions = {
  /** Whether to validate the presence of options */
  validate?: boolean;
  /** Whether to validate the rules */
  validateRules?: ValidateRulesOptions;
};
