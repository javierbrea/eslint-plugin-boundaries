import type { DependencyKind } from "@boundaries/elements";
export type {
  DependencyKind,
  CapturedValuesSelector,
  ElementSelector,
  ElementSelectors,
  ElementsSelector,
  ElementSelectorWithOptions,
  FlagAsExternalOptions,
} from "@boundaries/elements";

export { isElementSelector, isElementsSelector } from "@boundaries/elements";

export type {
  RulePolicy,
  RuleBaseOptions,
  ElementTypesRule,
  ElementTypesRuleOptions,
  DependenciesRule,
  DependenciesRuleOptions,
  EntryPointRule,
  EntryPointRuleOptions,
  ExternalRule,
  ExternalRuleOptions,
  NoPrivateOptions,
  RuleShortName,
  RuleName,
} from "../Shared";

export {
  RULE_POLICIES_MAP,
  RULE_SHORT_NAMES_MAP,
  RULE_NAMES_MAP,
} from "../Shared";

export { isRulePolicy, isRuleShortName, isRuleName } from "../Settings";

/**
 * Kind of import that the rule applies to (e.g., "type", "value")
 * @deprecated Use DependencyKind instead
 */
export type ImportKind = DependencyKind;
