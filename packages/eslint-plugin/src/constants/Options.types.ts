import type {
  DependencyKind,
  CapturedValuesSelector,
  ElementsSelector,
  CapturedValues,
  ExternalLibrarySelectorOptions,
  ExternalLibrariesSelector,
} from "@boundaries/elements";

import type { DependencyInfo } from "./DependencyInfo.types";
import type { FileInfo } from "./ElementsInfo.types";
import { isString } from "./settings";

export const RULE_POLICY_ALLOW = "allow" as const;
export const RULE_POLICY_DISALLOW = "disallow" as const;

/**
 * Map containing the available rule policies.
 */
export const RULE_POLICIES_MAP = {
  ALLOW: RULE_POLICY_ALLOW,
  DISALLOW: RULE_POLICY_DISALLOW,
} as const;

/**
 * Policy for rules, either allowing or disallowing certain dependencies.
 */
export type RulePolicy =
  (typeof RULE_POLICIES_MAP)[keyof typeof RULE_POLICIES_MAP];

/**
 * Type guard to check if a value is a valid RulePolicy.
 * @param value - The value to check.
 * @returns True if the value is a valid RulePolicy, false otherwise.
 */
export function isRulePolicy(value: unknown): value is RulePolicy {
  return (
    isString(value) &&
    (value === RULE_POLICY_ALLOW || value === RULE_POLICY_DISALLOW)
  );
}

/**
 * Base options for some rules, including default policy and custom message.
 */
export type RuleBaseOptions = {
  /** Default policy for all the rules (allow or disallow) */
  default?: RulePolicy;
  /** Custom message for all rule violations. It can be overridden at the rule level. */
  message?: string;
};

export type RuleReport = {
  message?: string;
  isDefault?: boolean;
  importKind?: DependencyKind;
  disallow?: ElementsSelector;
  element: ElementsSelector;
  index: number;
};

export type RuleResultReport = {
  path?: string;
  specifiers?: string[];
};

export type RuleResult = {
  result: boolean;
  ruleReport: RuleReport | null;
  report: RuleResultReport | null;
};

export type RuleMatcherElementsCapturedValues = {
  from: CapturedValues;
  target: CapturedValues;
};

export type RuleMatcher<
  FileOrDependencyInfo extends FileInfo | DependencyInfo = FileInfo,
  RuleMatchers extends
    | CapturedValuesSelector
    | ExternalLibrarySelectorOptions = CapturedValuesSelector,
> = (
  // eslint-disable-next-line no-unused-vars
  elementInfo: FileOrDependencyInfo,
  // eslint-disable-next-line no-unused-vars
  matcher: string,
  // eslint-disable-next-line no-unused-vars
  ruleMatchers: RuleMatchers,
  // eslint-disable-next-line no-unused-vars
  elementsCapturedValues: RuleMatcherElementsCapturedValues,
  // eslint-disable-next-line no-unused-vars
  importKind?: DependencyKind,
) => RuleResult;

// Specific rule options

// TODO: Change the Options type to a generic one that receives the Rule type

/**
 * Rule that defines allowed or disallowed dependencies between different element types.
 */
export type ElementTypesRule = {
  /** Selectors of the source elements that the rule applies to (the elements importing) */
  from?: ElementsSelector;
  /** Selectors of the target elements that are disallowed to be imported */
  to?: ElementsSelector;
  /** Selectors of the elements that are disallowed to be imported */
  disallow?: ElementsSelector;
  /** Selectors of the elements that are allowed to be imported */
  allow?: ElementsSelector;
  /** Kind of import that the rule applies to (e.g., "type", "value") */
  importKind?: DependencyKind;
  /** Custom message for rule violations */
  message?: string;
};

/**
 * Options for the element-types rule, including default policy and specific rules.
 */
export type ElementTypesRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  /** Specific rules for defining boundaries between elements */
  rules?: ElementTypesRule[];
};

// TODO: Support element selectors in the disallow and allow options.

/**
 * Rule that defines entry points for specific element types, controlling which files can be imported.
 */
export type EntryPointRule = {
  /** Selectors of the elements that the rule applies to (the elements being imported) */
  target: ElementsSelector;
  /** Micromatch patterns of the files that are disallowed to import from other elements. Relative to the element path */
  disallow?: string[];
  /** Micromatch patterns of the files that are allowed to import from other elements. Relative to the element path */
  allow?: string[];
  /** Kind of import that the rule applies to (e.g., "type", "value") */
  importKind?: DependencyKind;
  /** Custom message for rule violations */
  message?: string;
};

/**
 * Options for the entry-point rule, including default policy and specific rules.
 */
export type EntryPointRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  /** Specific rules for defining entry points between elements */
  rules?: EntryPointRule[];
};

/**
 * Rule that defines allowed or disallowed external library imports for specific element types.
 */
export type ExternalRule = {
  /** Selectors of the source elements that the rule applies to (the elements importing) */
  from: ElementsSelector;
  /** Selectors of the external libraries that are disallowed to be imported */
  disallow?: ExternalLibrariesSelector;
  /** Selectors of the external libraries that are allowed to be imported */
  allow?: ExternalLibrariesSelector;
  /** Kind of import that the rule applies to (e.g., "type", "value") */
  importKind?: DependencyKind;
  /** Custom message for rule violations */
  message?: string;
};

/**
 * Options for the external rule, including default policy and specific rules.
 */
export type ExternalRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  /** Specific rules for defining allowed or disallowed external library imports */
  rules?: ExternalRule[];
};

/**
 * Options for the no-private rule, which restricts imports of private elements.
 * Private elements are those that are children of another elements in the folder structure.
 * This rules enables that private elements can't be used by anyone except its parent (or any other descendant of the parent when `allowUncles` option is enabled)
 */
export type NoPrivateOptions = {
  /** Whether to allow imports from "uncle" elements (elements sharing the same ancestor) */
  allowUncles?: boolean;
  /** Custom message for rule violations */
  message?: string;
};

export type RuleOptionsWithRules =
  | ExternalRuleOptions
  | EntryPointRuleOptions
  | ElementTypesRuleOptions;

export type RuleOptions = RuleOptionsWithRules | NoPrivateOptions;

export type RuleOptionsRules = ExternalRule | EntryPointRule | ElementTypesRule;
