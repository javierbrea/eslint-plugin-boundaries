import type { CustomMessageTemplatePolicyContext } from "@boundaries/policies";

export type {
  CustomMessageTemplatePolicyContext,
  CustomMessageTemplateContext,
} from "@boundaries/policies";

/**
 * Context about the rule that matched the dependency, if any.
 * @deprecated Use `CustomMessageTemplatePolicyContext` instead.
 */
export type CustomMessageTemplateRuleContext =
  CustomMessageTemplatePolicyContext;
