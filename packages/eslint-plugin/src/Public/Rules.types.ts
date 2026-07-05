import type { DependencyKind } from "@boundaries/elements";
export type {
  DependencyKind,
  CapturedValuesSelector,
  ElementSelector,
  LegacySimpleElementSingleSelectorByTypeWithOptions,
  FlagAsExternalOptions,
} from "@boundaries/elements";

export { isElementSelector } from "@boundaries/elements";

export type {
  RuleEffect,
  RulePolicy,
  RuleBaseOptions,
  DependenciesPolicy,
  DependenciesRule,
  DependenciesRuleOptions,
  EntryPointPolicy,
  EntryPointRule,
  EntryPointRuleOptions,
  ExternalPolicy,
  ExternalRule,
  ExternalRuleOptions,
  NoPrivateOptions,
  NoUnknownDependenciesOptions,
  NoUnknownDependenciesRequire,
  RuleShortName,
  RuleName,
} from "../Shared";

export {
  RULE_EFFECTS_MAP,
  RULE_POLICIES_MAP,
  RULE_SHORT_NAMES_MAP,
  RULE_NAMES_MAP,
  NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP,
} from "../Shared";

export {
  isRuleEffect,
  isRulePolicy,
  isRuleShortName,
  isRuleName,
} from "../Settings";

/**
 * Kind of import that the rule applies to (e.g., "type", "value")
 * @deprecated Use DependencyKind instead
 */
export type ImportKind = DependencyKind;
