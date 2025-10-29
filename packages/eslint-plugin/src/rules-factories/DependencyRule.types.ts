import type { Rule } from "eslint";

import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo } from "../constants/ElementsInfo.types";
import type { EslintLiteralNode } from "../core/elementsInfo.types";
import type { ValidateRulesOptions } from "../helpers/Helpers.types";

export type DependencyRuleRunner<Options> = (
  // eslint-disable-next-line no-unused-vars
  options: {
    dependency: DependencyInfo;
    file: FileInfo;
    options?: Options;
    node: EslintLiteralNode;
    context: Rule.RuleContext;
  }
) => void;

export type DependencyRuleOptions = {
  /** Whether to validate the presence of options */
  validate?: boolean;
  /** Whether to validate the rules */
  validateRules?: ValidateRulesOptions;
};
