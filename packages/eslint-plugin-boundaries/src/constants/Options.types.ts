import type { DependencyInfo } from "./DependencyInfo.types";
import type { FileInfo } from "./ElementsInfo.types";
import type { ImportKind } from "./settings";

export type CapturedValues = Record<string, string>;

export type CapturedValuesMatcher = Record<string, string>;

export type ElementMatcherWithCaptureRules = [string, CapturedValuesMatcher];

export type ElementMatcher = string | ElementMatcherWithCaptureRules;

export type ElementMatchers = ElementMatcher | ElementMatcher[];

export type ExternalLibraryDetailsMatcher = {
  path: string | string[];
  specifiers?: string[];
};

export type ExternalLibraryMatcherWithDetails = [
  string,
  ExternalLibraryDetailsMatcher,
];

export type ExternalLibraryMatcher = string | ExternalLibraryMatcherWithDetails;

export type ExternalLibraryMatchers =
  | ExternalLibraryMatcher
  | ExternalLibraryMatcher[];

export type RuleDefault = "allow" | "disallow";

export type BaseRule = {
  from?: ElementMatchers;
  to?: ElementMatchers;
  target?: ElementMatchers;
  disallow?: ElementMatchers;
  allow?: ElementMatchers;
  importKind?: ImportKind;
  message?: string;
};

export type RuleBaseOptions = {
  default?: RuleDefault;
  message?: string;
};

export type RuleReport = {
  message?: string;
  isDefault?: boolean;
  importKind?: ImportKind;
  disallow?: ElementMatchers;
  element: ElementMatchers;
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
    | CapturedValuesMatcher
    | ExternalLibraryDetailsMatcher = CapturedValuesMatcher,
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
  importKind?: ImportKind,
) => RuleResult;

// Specific rule options

// TODO: Change the Options type to a generic one that receives the Rule type

export type ElementTypesRule = {
  from: ElementMatchers;
  disallow?: ElementMatchers;
  allow?: ElementMatchers;
  importKind?: ImportKind;
  message?: string;
};

export type ElementTypesRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  rules?: ElementTypesRule[];
};

export type EntryPointRule = {
  target: ElementMatchers;
  disallow?: ElementMatchers;
  allow?: ElementMatchers;
  importKind?: ImportKind;
  message?: string;
};

export type EntryPointRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  rules?: EntryPointRule[];
};

export type ExternalRule = {
  from: ElementMatchers;
  disallow?: ExternalLibraryMatchers;
  allow?: ExternalLibraryMatchers;
  importKind?: ImportKind;
  message?: string;
};

export type ExternalRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  rules?: ExternalRule[];
};

export type NoPrivateOptions = {
  allowUncles?: boolean;
  message?: string;
};

export type RuleOptionsWithRules =
  | ExternalRuleOptions
  | EntryPointRuleOptions
  | ElementTypesRuleOptions;

export type RuleOptions = RuleOptionsWithRules | NoPrivateOptions;

export type RuleOptionsRules = ExternalRule | EntryPointRule | ElementTypesRule;
