import type { Rule } from "eslint";
export type CompatRuleContext = Rule.RuleContext & {
  getCwd?: () => string;
  getFilename?: () => string;
  getPhysicalFilename?: () => string;
  getSourceCode?: () => any;
  parserOptions?: Record<string, unknown>;
  parserPath?: string;
};
export type CompatRuleModule = Omit<Rule.RuleModule, "create"> & {
  create: (context: CompatRuleContext) => Rule.RuleListener;
};
