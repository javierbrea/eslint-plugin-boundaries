import type { DependencyKind } from "@boundaries/elements";
export type {
  DependencyKind,
  CapturedValuesSelector,
  ElementSelector,
  ElementSelectors,
  ElementsSelector,
  ExternalLibrarySelectorOptions,
  ExternalLibrarySelectorWithOptions,
  ExternalLibrarySelector,
  ExternalLibrarySelectors,
  ExternalLibrariesSelector,
  ElementSelectorWithOptions,
} from "@boundaries/elements";

export {
  isElementSelector,
  isElementsSelector,
  isExternalLibrarySelector,
  isExternalLibrariesSelector,
} from "@boundaries/elements";

export type {
  RulePolicy,
  RuleBaseOptions,
  ElementTypesRule,
  ElementTypesRuleOptions,
  EntryPointRule,
  EntryPointRuleOptions,
  ExternalRule,
  ExternalRuleOptions,
  NoPrivateOptions,
} from "../constants/Options.types";

export { RULE_POLICIES_MAP, isRulePolicy } from "../constants/Options.types";

export type { RuleShortName, RuleName } from "../constants/rules";

/**
 * Kind of import that the rule applies to (e.g., "type", "value")
 * @deprecated Use DependencyKind instead
 */
export type ImportKind = DependencyKind;

export {
  RULE_SHORT_NAMES_MAP,
  RULE_NAMES_MAP,
  isRuleShortName,
  isRuleName,
} from "../constants/rules";
