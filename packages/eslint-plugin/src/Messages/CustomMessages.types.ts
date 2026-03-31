import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
} from "@boundaries/elements";

export type CustomMessageTemplateRuleContext = {
  /** Index of the rule that triggered the error */
  index: number | null;
  /** Selector of the rule that matched the dependency */
  selector: DependencySingleSelectorMatchResult | null;
} | null;

/** Context received by custom message templates */
export type CustomMessageTemplateContext = {
  /** Information about the dependency importer element */
  from: DependencyDescription["from"] | null;
  /** Information about the dependency target element */
  to: DependencyDescription["to"] | null;
  /** Information about the dependency itself */
  dependency: DependencyDescription["dependency"] | null;
  /** Context about the rule that matched the dependency, if any */
  rule: CustomMessageTemplateRuleContext;
};
